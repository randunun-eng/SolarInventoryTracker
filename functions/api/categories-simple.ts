/**
 * Cloudflare Pages Function - Categories API (Simplified - No Auth)
 * Temporary test version without authentication to debug 405 errors
 */

interface Env {
  DB: D1Database;
}

// GET all categories or a specific category by ID
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Extract ID from path like /api/categories-simple/123
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

// POST - Create a new category (NO AUTHENTICATION - FOR TESTING ONLY)
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

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

    return new Response(JSON.stringify({ error: 'Invalid category data', details: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// OPTIONS - Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
