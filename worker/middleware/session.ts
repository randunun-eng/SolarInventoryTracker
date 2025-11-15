import { createMiddleware } from 'hono/factory';
import type { Env } from '../index';
import { v4 as uuidv4 } from 'uuid';

// Session data interface
export interface SessionData {
  id: string;
  userId?: number;
  adminElevated?: boolean;
  adminElevatedAt?: number;
  createdAt: number;
  expiresAt: number;
}

// Extend Hono context with session
declare module 'hono' {
  interface ContextVariableMap {
    session: SessionData;
    sessionId: string;
  }
}

const SESSION_COOKIE_NAME = 'sid';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Parse cookies from request headers
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Create session middleware for Cloudflare KV
 */
export function createSessionMiddleware() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const SESSIONS = c.env.SESSIONS;

    // Parse cookies
    const cookies = parseCookies(c.req.header('Cookie'));
    let sessionId = cookies[SESSION_COOKIE_NAME];

    // Load or create session
    let session: SessionData;

    if (sessionId) {
      // Try to load existing session
      const sessionData = await SESSIONS.get(`session:${sessionId}`);

      if (sessionData) {
        session = JSON.parse(sessionData);

        // Check if session expired
        if (session.expiresAt < Date.now()) {
          // Session expired, create new one
          await SESSIONS.delete(`session:${sessionId}`);
          sessionId = uuidv4();
          session = createNewSession(sessionId);
        }
      } else {
        // Session not found, create new one
        sessionId = uuidv4();
        session = createNewSession(sessionId);
      }
    } else {
      // No session cookie, create new session
      sessionId = uuidv4();
      session = createNewSession(sessionId);
    }

    // Store session in context
    c.set('session', session);
    c.set('sessionId', sessionId);

    // Continue with request
    await next();

    // Save session after request completes
    const updatedSession = c.get('session');
    await SESSIONS.put(
      `session:${sessionId}`,
      JSON.stringify(updatedSession),
      { expirationTtl: SESSION_TTL }
    );

    // Set session cookie in response
    c.header(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${c.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );
  });
}

/**
 * Create a new session object
 */
function createNewSession(sessionId: string): SessionData {
  const now = Date.now();
  return {
    id: sessionId,
    createdAt: now,
    expiresAt: now + (SESSION_TTL * 1000),
  };
}

/**
 * Helper to update session in context
 */
export function updateSession(c: any, updates: Partial<SessionData>) {
  const session = c.get('session');
  c.set('session', { ...session, ...updates });
}
