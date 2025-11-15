import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createSessionMiddleware } from './middleware/session';
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { uploadRoutes } from './routes/uploads';
import { aiRoutes } from './routes/ai';

// Define the environment bindings
export interface Env {
  SESSIONS: KVNamespace;
  UPLOADS: R2Bucket;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  OPENAI_API_KEY: string;
  OPENAI_API_BASE: string;
  NODE_ENV?: string;
}

// Create the Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('/*', cors({
  origin: (origin) => origin, // Allow all origins in development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Set-Cookie'],
}));

// Session middleware
app.use('/*', createSessionMiddleware());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'production'
  });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/ai', aiRoutes);
app.route('/uploads', uploadRoutes); // Serve uploaded files
app.route('/api', apiRoutes);

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  }, err.status || 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
