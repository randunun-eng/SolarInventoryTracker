/**
 * Cloudflare Pages Function - Categories API with D1 Database
 * CRUD operations for component categories
 */

// Authentication helper types and functions (inlined)
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

function getCookieValue(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;
  const cookie = cookies.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

async function verifySession(
  request: Request,
  sessionsKV: KVNamespace
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || getCookieValue(request, 'session');

    if (!sessionToken) {
      return { authenticated: false, error: 'Not authenticated' };
    }

    const sessionDataStr = await sessionsKV.get(sessionToken);
    if (!sessionDataStr) {
      return { authenticated: false, error: 'Session expired or invalid' };
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    return { authenticated: true, user: sessionData };
  } catch (error: any) {
    return { authenticated: false, error: 'Authentication failed' };
  }
}

function hasRole(user: SessionData | undefined, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

function unauthorizedResponse(message: string = 'Not authenticated'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function forbiddenResponse(message: string = 'Insufficient permissions'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

// GET all categories or a specific category by ID
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Extract ID from path like /api/categories/123
  const pathParts = pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  const isNumericId = /^\d+$/.test(id);

  try {
    if (isNumericId) {
      // Get specific category
      const category = await env.DB.prepare(
        'SELECT * FROM categories WHERE id = ?'
      ).bind(id).first();

      if (!category) {
        return new Response(JSON.stringify({ message: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify(category), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get all categories
    const { results } = await env.DB.prepare(
      'SELECT * FROM categories ORDER BY name ASC'
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// POST - Create a new category (Admin only)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Verify authentication
  const auth = await verifySession(request, env.SESSIONS);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  // Check if user has Admin role
  if (!hasRole(auth.user, ['Admin'])) {
    return forbiddenResponse('Only administrators can create categories');
  }

  try {
    const data = await request.json();
    const { name, description } = data;

    // Validate required fields
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({ error: 'Category name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if category name already exists (UNIQUE constraint)
    const existing = await env.DB.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).bind(name.trim()).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'A category with this name already exists' }),
        {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Insert new category
    const result = await env.DB.prepare(
      'INSERT INTO categories (name, description) VALUES (?, ?)'
    )
      .bind(name.trim(), description || null)
      .run();

    const newCategory = {
      id: result.meta.last_row_id,
      name: name.trim(),
      description: description || null,
    };

    return new Response(JSON.stringify(newCategory), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error creating category:', error);

    // Check if it's a UNIQUE constraint violation (SQLite error)
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'A category with this name already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid category data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// PUT - Update a category (Admin only)
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Verify authentication
  const auth = await verifySession(request, env.SESSIONS);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  // Check if user has Admin role
  if (!hasRole(auth.user, ['Admin'])) {
    return forbiddenResponse('Only administrators can update categories');
  }

  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Extract ID from path like /api/categories/123
    const pathParts = pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || !/^\d+$/.test(id)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await request.json();
    const { name, description } = data;

    // Validate required fields
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({ error: 'Category name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if category exists
    const existing = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({ message: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if new name conflicts with another category
    const nameConflict = await env.DB.prepare(
      'SELECT id FROM categories WHERE name = ? AND id != ?'
    ).bind(name.trim(), id).first();

    if (nameConflict) {
      return new Response(
        JSON.stringify({ error: 'A category with this name already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Update category
    await env.DB.prepare(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?'
    )
      .bind(name.trim(), description || null, id)
      .run();

    const updatedCategory = {
      id: parseInt(id),
      name: name.trim(),
      description: description || null,
    };

    return new Response(JSON.stringify(updatedCategory), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error updating category:', error);

    // Check if it's a UNIQUE constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return new Response(
        JSON.stringify({ error: 'A category with this name already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid category data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// DELETE - Delete a category (Admin only)
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Verify authentication
  const auth = await verifySession(request, env.SESSIONS);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  // Check if user has Admin role
  if (!hasRole(auth.user, ['Admin'])) {
    return forbiddenResponse('Only administrators can delete categories');
  }

  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Extract ID from path like /api/categories/123
    const pathParts = pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || !/^\d+$/.test(id)) {
      return new Response(JSON.stringify({ error: 'Invalid category ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Check if category exists
    const category = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).bind(id).first();

    if (!category) {
      return new Response(JSON.stringify({ message: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // First, set category_id to NULL for all components that reference this category
    const updateResult = await env.DB.prepare(
      'UPDATE components SET category_id = NULL WHERE category_id = ?'
    ).bind(id).run();

    const affectedComponents = updateResult.meta.changes || 0;

    // Now delete the category
    await env.DB.prepare(
      'DELETE FROM categories WHERE id = ?'
    ).bind(id).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Category deleted successfully',
        affectedComponents,
        note: affectedComponents > 0
          ? `${affectedComponents} component(s) previously in this category now have no category.`
          : '',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
