/**
 * Cloudflare Pages Function - Component Analysis with AI
 * Analyzes component specifications and provides insights
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
    const { component } = await request.json();

    if (!component) {
      return new Response(JSON.stringify({ error: 'Component data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Analyze this solar/electronic component and provide insights:

Component Details:
- Name: ${component.name || 'Unknown'}
- Part Number: ${component.partNumber || 'N/A'}
- Category: ${component.category || 'N/A'}
- Description: ${component.description || 'N/A'}
- Specifications: ${component.specifications || 'N/A'}

Please provide:
1. Component category and type
2. Common applications in solar systems
3. Key specifications to monitor
4. Potential compatible alternatives
5. Storage and handling recommendations

Keep the response concise and technical.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are an expert in solar components and electronic parts. Provide technical and accurate analysis.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: response.response || response.text || 'No analysis generated',
        component: component,
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
    console.error('Component Analysis Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze component',
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
