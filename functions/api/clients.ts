/**
 * Cloudflare Pages Function - Clients API with D1 Database
 * CRUD operations for clients
 * Authorization: Admin role required for write operations
 */

import { requireAuth, requireAdmin } from '../_middleware/auth';

interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
}

// GET all clients or a specific client by ID
export async function onRequestGet(context: { request: Request; env: Env; params: any }) {
    const { request, env, params } = context;

    // Require authentication
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[3]; // /api/clients/{id}

    try {
        if (id && !id.includes('?')) {
            // Check if requesting inverters or repairs for a client
            if (pathParts[4] === 'inverters') {
                const { results } = await env.DB.prepare(
                    'SELECT * FROM inverters WHERE client_id = ? ORDER BY id DESC'
                ).bind(id).all();

                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            if (pathParts[4] === 'repairs') {
                const { results } = await env.DB.prepare(
                    'SELECT * FROM repairs WHERE client_id = ? ORDER BY received_date DESC'
                ).bind(id).all();

                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            // Get specific client
            const client = await env.DB.prepare(
                'SELECT * FROM clients WHERE id = ?'
            ).bind(id).first();

            if (!client) {
                return new Response(JSON.stringify({ error: 'Client not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            return new Response(JSON.stringify(client), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Get all clients
        const { results } = await env.DB.prepare(
            'SELECT * FROM clients ORDER BY name ASC'
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

// POST - Create a new client
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for creating clients
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        const data = await request.json();
        const { name, email, phone, address } = data;

        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        const result = await env.DB.prepare(
            `INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)`
        )
            .bind(name, email || null, phone || null, address || null)
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
                message: 'Client created successfully',
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

// PUT - Update a client
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for updating clients
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

        await env.DB.prepare(`UPDATE clients SET ${fields} WHERE id = ?`)
            .bind(...values, id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: 'Client updated successfully' }),
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

// DELETE - Delete a client
export async function onRequestDelete(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for deleting clients
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[3];

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Client deleted successfully' }),
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
