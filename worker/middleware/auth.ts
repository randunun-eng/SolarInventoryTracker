import { createMiddleware } from 'hono/factory';
import type { Env } from '../index';
import type { User } from '@shared/schema';

// Extend Hono context with user
declare module 'hono' {
  interface ContextVariableMap {
    user?: Omit<User, 'password'>;
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const session = c.get('session');

    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Load user from database
    const user = await getUserById(c, session.userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Store user in context (without password)
    const { password: _, ...userWithoutPassword } = user;
    c.set('user', userWithoutPassword);

    await next();
  });
}

/**
 * Middleware to require specific role or admin elevation
 */
export function requireRole(roles: string[]) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const user = c.get('user');
    const session = c.get('session');

    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Check if user has the required role
    const hasRole = roles.includes(user.role);

    // Check if user has admin elevation (temporary admin access via password)
    const isElevated = session?.adminElevated === true;

    // Check if elevation is still valid (within 1 hour)
    const elevationTimestamp = session?.adminElevatedAt;
    const isElevationValid =
      isElevated &&
      elevationTimestamp &&
      Date.now() - elevationTimestamp < 60 * 60 * 1000; // 1 hour

    // Grant access if user has role OR has valid elevation
    if (hasRole || isElevationValid) {
      return await next();
    }

    // If elevation expired, clear it
    if (isElevated && !isElevationValid) {
      const updatedSession = c.get('session');
      updatedSession.adminElevated = false;
      updatedSession.adminElevatedAt = undefined;
      c.set('session', updatedSession);
    }

    return c.json({ error: 'Insufficient permissions' }, 403);
  });
}

/**
 * Helper function to get user by ID from database
 */
async function getUserById(c: any, userId: number): Promise<User | null> {
  const result = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();

  return result as User | null;
}
