/**
 * Cloudflare Pages Function - Repairs API with D1 Database
 * CRUD operations for repair tracking
 */

interface Env {
  DB: D1Database;
  AI: any;
}

// GET all repairs or a specific repair by ID
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const status = url.searchParams.get('status');

  try {
    if (id) {
      // Get specific repair with related data
      const repair = await env.DB.prepare(
        `SELECT
          r.*,
          c.name as client_name,
          c.phone as client_phone,
          ft.name as fault_type_name
         FROM repairs r
         LEFT JOIN clients c ON r.client_id = c.id
         LEFT JOIN fault_types ft ON r.fault_type_id = ft.id
         WHERE r.id = ?`
      ).bind(id).first();

      if (!repair) {
        return new Response(JSON.stringify({ error: 'Repair not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify(repair), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Get all repairs or filter by status
    let query = `
      SELECT
        r.*,
        c.name as client_name,
        c.phone as client_phone,
        ft.name as fault_type_name
      FROM repairs r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN fault_types ft ON r.fault_type_id = ft.id
    `;

    if (status) {
      query += ' WHERE r.status = ?';
      const { results } = await env.DB.prepare(query).bind(status).all();
      return new Response(JSON.stringify({ repairs: results }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    query += ' ORDER BY r.id DESC';
    const { results } = await env.DB.prepare(query).all();

    return new Response(JSON.stringify({ repairs: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// POST - Create a new repair
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const {
      client_id,
      inverter_model,
      inverter_serial_number,
      fault_description,
      status = 'Received',
      priority = 'Medium',
    } = data;

    if (!client_id || !fault_description) {
      return new Response(
        JSON.stringify({ error: 'Client ID and fault description are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Generate tracking token
    const tracking_token = crypto.randomUUID().substring(0, 8).toUpperCase();
    const received_date = new Date().toISOString();

    const result = await env.DB.prepare(
      `INSERT INTO repairs (client_id, inverter_model, inverter_serial_number, fault_description, status, priority, tracking_token, received_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        client_id,
        inverter_model || null,
        inverter_serial_number || null,
        fault_description,
        status,
        priority,
        tracking_token,
        received_date
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        tracking_token,
        message: 'Repair created successfully',
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

// PUT - Update a repair
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { id, status, ...updates } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // If status is being updated, add to history
    if (status) {
      updates.status = status;
      // In a real implementation, you'd fetch and update status_history JSON
    }

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await env.DB.prepare(`UPDATE repairs SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Repair updated successfully' }),
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
