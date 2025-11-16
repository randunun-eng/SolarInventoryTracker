/**
 * Cloudflare Pages Function - User Registration
 * Creates a new user account
 */

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

// Generate a random session token
function generateSessionToken(): string {
  return crypto.randomUUID();
}

// Simple password hashing (for demo purposes)
// In production, use a proper bcrypt-compatible library
async function hashPassword(password: string): Promise<string> {
  // For now, we'll store plain text (NOT SECURE - for demo only)
  // In production, use @node-rs/bcrypt or similar
  console.warn('Using plain text passwords - not suitable for production');
  return password; // TEMPORARY - replace with proper bcrypt
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const { username, password, name, role } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if username already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
    )
      .bind(username, hashedPassword, name || null, role || 'Technician')
      .run();

    const userId = result.meta.last_row_id;

    // Generate session token
    const sessionToken = generateSessionToken();

    // Store session in KV
    const sessionData = {
      userId,
      username,
      name: name || null,
      role: role || 'Technician',
      createdAt: Date.now(),
    };

    await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), {
      expirationTtl: 86400, // 24 hours
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          username,
          name: name || null,
          role: role || 'Technician',
        },
        sessionToken,
        message: 'User registered successfully',
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Registration failed', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
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
