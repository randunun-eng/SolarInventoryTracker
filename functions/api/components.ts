/**
 * Cloudflare Pages Function - Components API with D1 Database
 * CRUD operations for electronic components
 * Authorization: Admin role required for write operations
 */

import { requireAuth, requireAdmin } from '../_middleware/auth';

interface Env {
  DB: D1Database;
  AI: any;
  SESSIONS: KVNamespace;
}

// GET all components or a specific component by ID
export async function onRequestGet(context: { request: Request; env: Env; params: any }) {
  const { request, env, params } = context;

  // Require authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    if (id) {
      // Get specific component
      const component = await env.DB.prepare(
        'SELECT * FROM components WHERE id = ?'
      ).bind(id).first();

      if (!component) {
        return new Response(JSON.stringify({ error: 'Component not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify(component), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get all components
    const { results } = await env.DB.prepare(
      'SELECT * FROM components ORDER BY id DESC'
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// POST - Create a new component
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Require Admin role for creating components
  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const data = await request.json();
    const {
      name,
      part_number,
      category_id,
      description,
      datasheet,
      image,
      location,
      minimum_stock,
      current_stock,
      supplier_price,
      supplier_id,
    } = data;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const result = await env.DB.prepare(
      `INSERT INTO components (name, part_number, category_id, description, datasheet, image, location, minimum_stock, current_stock, supplier_price, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        name,
        part_number || null,
        category_id || null,
        description || null,
        datasheet || null,
        image || null,
        location || null,
        minimum_stock || 10,
        current_stock || 0,
        supplier_price || 0,
        supplier_id || null
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        message: 'Component created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// PUT - Update a component
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Require Admin role for updating components
  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Build dynamic update query
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await env.DB.prepare(`UPDATE components SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Component updated successfully' }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// DELETE - Delete a component
export async function onRequestDelete(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Require Admin role for deleting components
  const authResult = await requireAdmin(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    await env.DB.prepare('DELETE FROM components WHERE id = ?').bind(id).run();

    return new Response(
      JSON.stringify({ success: true, message: 'Component deleted successfully' }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
