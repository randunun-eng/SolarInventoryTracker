/**
 * Cloudflare Pages Function with AI Binding
 * This function uses Workers AI to process chat messages
 */

interface Env {
  AI: any;
  CLOUDFLARE_AI_URL: string;
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

    // Use Workers AI to generate a response
    const systemPrompt = `You are a helpful AI assistant for the Solar Inventory Tracker system.
${chatContext ? `Current system context: ${JSON.stringify(chatContext)}` : ''}
Answer questions about solar components, repairs, inventory, and provide helpful insights.`;

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
