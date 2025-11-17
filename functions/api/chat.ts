/**
 * Cloudflare Pages Function for Chat Endpoint
 * This replaces the Express server's /api/chat endpoint in production
 * Uses Workers AI as the primary AI backend
 */

interface Env {
  AI: any;
  DB: D1Database;
}

interface ChatRequest {
  sessionId: string;
  message: string;
  isVoiceMode?: boolean;
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
    const body: ChatRequest = await request.json();
    const { sessionId, message, isVoiceMode } = body;

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId or message' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get system context from the database
    const context = await getSystemContext(env.DB);

    // Build the system prompt
    const systemPrompt = isVoiceMode
      ? getVoiceModePrompt(context)
      : getRegularPrompt(context);

    // Use Workers AI to generate a response
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: isVoiceMode ? 800 : 1000,
    });

    const response = aiResponse.response || aiResponse.text || 'Sorry, I could not process your request.';

    return new Response(
      JSON.stringify({
        sessionId,
        response,
        model: '@cf/meta/llama-3.1-8b-instruct',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Chat Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat query',
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

// Helper function to get system context from the database
async function getSystemContext(db: D1Database) {
  try {
    // Get counts and summary data
    const [componentsResult, repairsResult, clientsResult, lowStockResult] =
      await Promise.all([
        db.prepare('SELECT COUNT(*) as count FROM components').first<{ count: number }>(),
        db.prepare('SELECT COUNT(*) as count FROM repairs').first<{ count: number }>(),
        db.prepare('SELECT COUNT(*) as count FROM clients').first<{ count: number }>(),
        db.prepare('SELECT COUNT(*) as count FROM components WHERE currentStock <= minimumStock').first<{ count: number }>(),
      ]);

    const totalComponents = componentsResult?.count || 0;
    const totalRepairs = repairsResult?.count || 0;
    const totalClients = clientsResult?.count || 0;
    const lowStockCount = lowStockResult?.count || 0;

    // Get active repairs count
    const activeRepairsResult = await db
      .prepare("SELECT COUNT(*) as count FROM repairs WHERE status IN ('pending', 'in_progress', 'waiting_parts')")
      .first<{ count: number }>();
    const activeRepairs = activeRepairsResult?.count || 0;

    // Get some recent repairs for context
    const recentRepairs = await db
      .prepare(`
        SELECT r.id, r.inverterModel, r.status, r.priority, c.name as clientName
        FROM repairs r
        LEFT JOIN clients c ON r.clientId = c.id
        ORDER BY r.receivedDate DESC
        LIMIT 5
      `)
      .all();

    // Get low stock components
    const lowStockComponents = await db
      .prepare(`
        SELECT name, currentStock, minimumStock
        FROM components
        WHERE currentStock <= minimumStock
        ORDER BY (currentStock - minimumStock)
        LIMIT 5
      `)
      .all();

    return {
      totalComponents,
      totalRepairs,
      totalClients,
      lowStockCount,
      activeRepairs,
      recentRepairs: recentRepairs.results || [],
      lowStockComponents: lowStockComponents.results || [],
    };
  } catch (error) {
    console.error('Error getting system context:', error);
    return {
      totalComponents: 0,
      totalRepairs: 0,
      totalClients: 0,
      lowStockCount: 0,
      activeRepairs: 0,
      recentRepairs: [],
      lowStockComponents: [],
    };
  }
}

function getRegularPrompt(context: any): string {
  return `You are an AI assistant for a Solar Inverter Repair Management System with COMPLETE REAL-TIME ACCESS to the database.

=== LIVE SYSTEM DATA (Updated in real-time) ===
Total components: ${context.totalComponents} | Low stock: ${context.lowStockCount} | Total clients: ${context.totalClients}
Total repairs: ${context.totalRepairs} | Active repairs: ${context.activeRepairs}

=== RECENT REPAIRS ===
${context.recentRepairs.map((r: any) => `#${r.id}: ${r.clientName || 'Unknown'} - ${r.inverterModel || 'N/A'} - ${r.status} - Priority: ${r.priority}`).join('\n') || 'No recent repairs'}

=== LOW STOCK COMPONENTS ===
${context.lowStockComponents.map((c: any) => `${c.name}: ${c.currentStock}/${c.minimumStock}`).join('\n') || 'No low stock items'}

CRITICAL RULES:
1. Use ONLY the exact numbers from this live database for system counts
2. Never estimate or use different numbers than provided
3. Be helpful and professional in your responses
4. When asked about specific components or repairs, indicate that you can see the summary but for detailed information, the user should check the relevant section
5. Format responses using markdown for readability

You can help with:
- Answering questions about inventory status and component counts
- Providing information about repair statistics and status
- Identifying low stock items that need attention
- General guidance about the solar inverter repair system

Format your responses in a helpful, professional manner.
For actions that modify data, always ask for confirmation first.`;
}

function getVoiceModePrompt(context: any): string {
  return `You are an AI assistant for a Solar Inverter Repair Management System.
The user is interacting with you using voice commands, so keep your responses concise and easily speakable.

Current System Status:
- Total components: ${context.totalComponents}
- Low stock items: ${context.lowStockCount}
- Total repairs: ${context.totalRepairs}
- Active repairs: ${context.activeRepairs}

Voice Response Guidelines:
1. Keep sentences short and simple (under 4 sentences when possible)
2. Avoid complex lists or tables
3. Use natural conversational language
4. Be brief and clear
5. Remind the user what they asked about in your answer

When responding to voice commands, prioritize brevity, clarity, and actionability.`;
}
