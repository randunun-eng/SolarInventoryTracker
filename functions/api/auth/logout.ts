/**
 * Cloudflare Pages Function - User Logout
 * Destroys the session token
 */

interface Env {
  SESSIONS: KVNamespace;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Get session token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || getCookieValue(request, 'session');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'No session token provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Delete session from KV
    await env.SESSIONS.delete(sessionToken);

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// Helper function to get cookie value
function getCookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;

  const cookie = cookies.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

// OPTIONS - Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
