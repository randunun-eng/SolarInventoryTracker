/**
 * Cloudflare Pages Function with AI Binding and D1 Database Access
 * This function uses Workers AI to process chat messages with real-time database context
 */

interface Env {
  AI: any;
  DB: D1Database;
  CLOUDFLARE_AI_URL: string;
}

/**
 * Fetch system context from D1 database
 */
async function getSystemContext(db: D1Database) {
  try {
    // Get component statistics
    const componentStats = await db.prepare(`
      SELECT
        COUNT(*) as total_components,
        SUM(current_stock) as total_stock,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_count
      FROM components
    `).first();

    // Get low stock components
    const lowStockComponents = await db.prepare(`
      SELECT name, current_stock, minimum_stock, unit_price
      FROM components
      WHERE current_stock <= minimum_stock
      ORDER BY current_stock ASC
      LIMIT 10
    `).all();

    // Get repair statistics
    const repairStats = await db.prepare(`
      SELECT
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending
      FROM repairs
    `).first();

    // Get recent repairs
    const recentRepairs = await db.prepare(`
      SELECT
        r.job_number,
        r.status,
        r.fault_description,
        c.name as client_name
      FROM repairs r
      LEFT JOIN clients c ON r.client_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all();

    // Get clients count
    const clientStats = await db.prepare(`
      SELECT COUNT(*) as total_clients FROM clients
    `).first();

    return {
      components: {
        total: componentStats?.total_components || 0,
        total_stock: componentStats?.total_stock || 0,
        low_stock_count: componentStats?.low_stock_count || 0,
        low_stock_items: lowStockComponents.results || [],
      },
      repairs: {
        total: repairStats?.total_repairs || 0,
        in_progress: repairStats?.in_progress || 0,
        completed: repairStats?.completed || 0,
        pending: repairStats?.pending || 0,
        recent: recentRepairs.results || [],
      },
      clients: {
        total: clientStats?.total_clients || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching system context:', error);
    return null;
  }
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
    const { message, sessionId, isVoiceMode } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch real-time database context
    const systemContext = await getSystemContext(env.DB);

    // Build system prompt with database context
    let systemPrompt = `You are a helpful AI assistant for the Solar Inventory Tracker system.

You have access to real-time data from the system:

**Inventory Status:**
- Total Components: ${systemContext?.components.total || 'N/A'}
- Total Stock Units: ${systemContext?.components.total_stock || 'N/A'}
- Low Stock Alerts: ${systemContext?.components.low_stock_count || 0} items need restocking

**Repair Jobs:**
- Total Repairs: ${systemContext?.repairs.total || 0}
- In Progress: ${systemContext?.repairs.in_progress || 0}
- Completed: ${systemContext?.repairs.completed || 0}
- Pending: ${systemContext?.repairs.pending || 0}

**Clients:**
- Total Clients: ${systemContext?.clients.total || 0}

${systemContext?.components.low_stock_items.length > 0 ? `
**URGENT - Low Stock Items:**
${systemContext.components.low_stock_items.map((item: any) =>
  `- ${item.name}: ${item.current_stock}/${item.minimum_stock} units (Price: $${item.unit_price})`
).join('\n')}
` : ''}

${systemContext?.repairs.recent.length > 0 ? `
**Recent Repair Jobs:**
${systemContext.repairs.recent.map((repair: any) =>
  `- Job #${repair.job_number}: ${repair.fault_description} (${repair.status}) - ${repair.client_name || 'Unknown Client'}`
).join('\n')}
` : ''}

${isVoiceMode ? `
IMPORTANT: User is in VOICE MODE. Keep responses concise (2-3 sentences max), conversational, and easy to understand when spoken aloud. Avoid technical jargon unless necessary.
` : `
Provide detailed, helpful responses. Use markdown formatting for better readability when appropriate.
`}

Your role is to help users:
1. Check inventory levels and stock status
2. Track repair jobs and their progress
3. Manage client information
4. Get insights and recommendations for the business
5. Answer questions about solar components and systems

Be helpful, accurate, and professional.`;

    // Use Workers AI to generate a response
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const responseText = aiResponse.response || aiResponse.text || 'Sorry, I could not generate a response. Please try again.';

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        model: '@cf/meta/llama-3.1-8b-instruct',
        sessionId: sessionId || 'new-session',
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
