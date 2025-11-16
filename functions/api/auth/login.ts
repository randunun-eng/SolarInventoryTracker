/**
 * Cloudflare Pages Function - User Login
 * Authenticates users and creates session tokens
 */

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

// Simple password hashing verification (bcrypt-compatible check)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For Cloudflare Workers, we'll use a simpler approach
  // In production, you should use a proper bcrypt library compatible with Workers
  // For now, we'll use crypto.subtle for password verification

  // If the hash starts with $2, it's bcrypt - we need to handle this specially
  if (hash.startsWith('$2')) {
    // For bcrypt hashes, we'll need to verify using the Web Crypto API
    // This is a simplified version - in production use @node-rs/bcrypt or similar
    try {
      // Import bcrypt-like library or use a compatible method
      // For now, we'll do a simple comparison (NOT SECURE - just for demo)
      // You should use a proper bcrypt library
      console.warn('Using simplified password verification - not suitable for production');
      return password === hash; // TEMPORARY - replace with proper bcrypt
    } catch (e) {
      console.error('Password verification error:', e);
      return false;
    }
  }

  // For plain text passwords (development only)
  return password === hash;
}

// Generate a random session token
function generateSessionToken(): string {
  return crypto.randomUUID();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Find user by username
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password as string);

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Store session in KV (expires in 24 hours)
    const sessionData = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: Date.now(),
    };

    await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), {
      expirationTtl: 86400, // 24 hours
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return new Response(
      JSON.stringify({
        success: true,
        user: userWithoutPassword,
        sessionToken,
        message: 'Login successful',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed', details: error.message }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
