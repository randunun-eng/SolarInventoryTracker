/**
 * Authentication Helper for Cloudflare Pages Functions
 * Provides session verification and role-based authorization
 */

interface SessionData {
  userId: number;
  username: string;
  name: string | null;
  role: string;
  createdAt: number;
}

interface AuthResult {
  authenticated: boolean;
  user?: SessionData;
  error?: string;
}

// Helper function to get cookie value from request
export function getCookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;

  const cookie = cookies.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

// Verify session and return user data
export async function verifySession(
  request: Request,
  sessionsKV: KVNamespace
): Promise<AuthResult> {
  try {
    // Get session token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || getCookieValue(request, 'session');

    if (!sessionToken) {
      return {
        authenticated: false,
        error: 'Not authenticated',
      };
    }

    // Get session from KV
    const sessionDataStr = await sessionsKV.get(sessionToken);

    if (!sessionDataStr) {
      return {
        authenticated: false,
        error: 'Session expired or invalid',
      };
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);

    return {
      authenticated: true,
      user: sessionData,
    };
  } catch (error: any) {
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

// Check if user has required role
export function hasRole(user: SessionData | undefined, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

// Create unauthorized response
export function unauthorizedResponse(message: string = 'Not authenticated'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

// Create forbidden response
export function forbiddenResponse(message: string = 'Insufficient permissions'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
