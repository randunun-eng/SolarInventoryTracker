/**
 * Cloudflare Pages Function with AI Binding
 * This function uses Workers AI to process chat messages
 */

interface Env {
  AI: any;
  DB: D1Database;
  CLOUDFLARE_AI_URL: string;
}

async function searchRepairs(db: D1Database, message: string) {
  const searchResults: any[] = [];

  try {
    // 1. Always get recent repairs (last 5) for general context
    const recent = await db.prepare(`
      SELECT 
        r.id, r.tracking_token, r.status, r.inverter_model, r.received_date,
        c.name as client_name
      FROM repairs r
      LEFT JOIN clients c ON r.client_id = c.id
      ORDER BY r.received_date DESC LIMIT 5
    `).all();
    
    if (recent.results) {
      searchResults.push(...recent.results.map(r => ({ ...r, _type: 'recent_repair' })));
    }

    // 2. Extract potential keywords for specific search
    // Look for alphanumeric strings > 3 chars (tokens, names, serials)
    const keywords = message.match(/\b[a-zA-Z0-9]{4,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)].slice(0, 3); // Limit to 3 keywords to prevent query explosion

    if (uniqueKeywords.length > 0) {
      const conditions: string[] = [];
      const params: string[] = [];

      for (const word of uniqueKeywords) {
         conditions.push(`(
           r.tracking_token LIKE ? OR
           r.inverter_serial_number LIKE ? OR
           c.name LIKE ? OR
           c.phone LIKE ?
         )`);
         const term = `%${word}%`;
         params.push(term, term, term, term);
      }

      if (conditions.length > 0) {
          const query = `
            SELECT 
              r.*, 
              c.name as client_name, 
              c.phone as client_phone, 
              c.email as client_email,
              ft.name as fault_type_name
            FROM repairs r
            LEFT JOIN clients c ON r.client_id = c.id
            LEFT JOIN fault_types ft ON r.fault_type_id = ft.id
            WHERE ${conditions.join(' OR ')}
            LIMIT 5
          `;
          
          const results = await db.prepare(query).bind(...params).all();
          
          // Add specific matches if they aren't already in the list
          if (results.results) {
            for (const row of results.results) {
              if (!searchResults.find(r => r.id === row.id)) {
                searchResults.push({ ...row, _type: 'search_match' });
              }
            }
          }
      }
    }
  } catch (error) {
    console.error('Error fetching repair context:', error);
    // Continue without context if DB fails, don't break the chat
  }

  return searchResults;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { message, context: chatContext } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch relevant context from D1 Database
    const dbContext = await searchRepairs(env.DB, message);

    // Use Workers AI to generate a response
    const systemPrompt = `You are a helpful AI assistant for the Solar Inventory Tracker system.
    
DATABASE CONTEXT (Real-time data from system):
${JSON.stringify(dbContext, null, 2)}

USER CONTEXT:
${chatContext ? JSON.stringify(chatContext) : 'None provided'}

INSTRUCTIONS:
1. Use the DATABASE CONTEXT to answer questions about repairs, status, and history.
2. If the user asks about a specific repair (by name, token, serial), look for it in the context.
3. If the context contains "recent_repair" items, you can use them to summarize recent activity.
4. If you cannot find the information in the context, politely say so and ask for more specific details (like a tracking token).
5. Provide helpful, professional insights about solar inverter repairs.
`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: response.response || response.text || 'No response generated',
        model: '@cf/meta/llama-3.1-8b-instruct',
        context_used: dbContext.length > 0 // Debug info
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('AI Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process AI request',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
