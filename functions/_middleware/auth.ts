/**
 * Authorization utilities for Cloudflare Pages Functions
 * Handles authentication and role-based access control
 */

interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
}

interface User {
    id: number;
    username: string;
    name: string;
    role: string;
}

/**
 * Extract session token from request headers or cookies
 */
export function getSessionToken(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Try cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const match = cookieHeader.match(/session=([^;]+)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Get authenticated user from session token
 */
export async function getAuthenticatedUser(
    request: Request,
    env: Env
): Promise<User | null> {
    const sessionToken = getSessionToken(request);

    if (!sessionToken) {
        return null;
    }

    try {
        // Get user ID from KV session store
        const userId = await env.SESSIONS.get(sessionToken);

        if (!userId) {
            return null;
        }

        // Get user from database
        const user = await env.DB.prepare('SELECT id, username, name, role FROM users WHERE id = ?')
            .bind(userId)
            .first<User>();

        return user;
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
    }
}

/**
 * Require authentication - returns error response if not authenticated
 */
export async function requireAuth(
    request: Request,
    env: Env
): Promise<{ user: User } | Response> {
    const user = await getAuthenticatedUser(request, env);

    if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    return { user };
}

/**
 * Require specific role(s) - returns error response if user doesn't have required role
 */
export async function requireRole(
    request: Request,
    env: Env,
    roles: string[]
): Promise<{ user: User } | Response> {
    const authResult = await requireAuth(request, env);

    // If requireAuth returned a Response (error), return it
    if (authResult instanceof Response) {
        return authResult;
    }

    const { user } = authResult;

    if (!roles.includes(user.role)) {
        return new Response(
            JSON.stringify({
                error: 'Insufficient permissions',
                required: roles,
                current: user.role,
            }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }

    return { user };
}

/**
 * Require Admin role - shorthand for requireRole with Admin
 */
export async function requireAdmin(
    request: Request,
    env: Env
): Promise<{ user: User } | Response> {
    return requireRole(request, env, ['Admin']);
}
