import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb } from '../lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs'; // Using bcryptjs for browser compatibility
import { updateSession } from '../middleware/session';

export const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/login
 * Login with username and password
 */
authRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password required' }, 400);
    }

    // Get database connection
    const db = getDb(c.env.DATABASE_URL);

    // Find user by username
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Update session with user ID
    updateSession(c, { userId: user.id });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
authRoutes.post('/logout', async (c) => {
  try {
    // Clear session
    const session = c.get('session');
    session.userId = undefined;
    session.adminElevated = undefined;
    session.adminElevatedAt = undefined;
    c.set('session', session);

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
authRoutes.get('/me', async (c) => {
  try {
    const session = c.get('session');

    if (!session?.userId) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    // Get database connection
    const db = getDb(c.env.DATABASE_URL);

    // Find user by ID
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Check if admin elevation is still valid
    let adminElevated = session.adminElevated || false;
    const elevationTimestamp = session.adminElevatedAt;

    if (adminElevated && elevationTimestamp) {
      const isElevationValid = Date.now() - elevationTimestamp < 60 * 60 * 1000; // 1 hour

      if (!isElevationValid) {
        // Elevation expired
        adminElevated = false;
        session.adminElevated = false;
        session.adminElevatedAt = undefined;
        c.set('session', session);
      }
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return c.json({
      ...userWithoutPassword,
      adminElevated,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

/**
 * POST /api/auth/verify-admin
 * Verify admin password for temporary elevation
 */
authRoutes.post('/verify-admin', async (c) => {
  try {
    const { password } = await c.req.json();
    const session = c.get('session');

    if (!session?.userId) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    if (!password) {
      return c.json({ error: 'Password required' }, 400);
    }

    // Get database connection
    const db = getDb(c.env.DATABASE_URL);

    // Find admin user
    const adminResults = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    const admin = adminResults[0];

    if (!admin) {
      return c.json({ error: 'Admin user not found' }, 500);
    }

    // Verify admin password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid admin password' }, 401);
    }

    // Grant admin elevation
    updateSession(c, {
      adminElevated: true,
      adminElevatedAt: Date.now(),
    });

    return c.json({ success: true, adminElevated: true });
  } catch (error) {
    console.error('Admin verification error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});
