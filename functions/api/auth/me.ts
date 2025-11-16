/**
 * Cloudflare Pages Function - Get Current User
 * Returns the currently authenticated user
 */

interface Env {
  SESSIONS: KVNamespace;
  DB: D1Database;
}

// Helper function to get cookie value
function getCookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;

  const cookie = cookies.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Get session token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || getCookieValue(request, 'session');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get session from KV
    const sessionDataStr = await env.SESSIONS.get(sessionToken);

    if (!sessionDataStr) {
      return new Response(
        JSON.stringify({ error: 'Session expired or invalid' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const sessionData = JSON.parse(sessionDataStr);

    // Optionally, fetch fresh user data from database
    const user = await env.DB.prepare('SELECT id, username, name, role FROM users WHERE id = ?')
      .bind(sessionData.userId)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify({ user }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// OPTIONS - Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
