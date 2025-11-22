/**
 * Cloudflare Pages Function - Fault Types API with D1 Database
 * CRUD operations for fault types
 * Authorization: Admin role required for write operations
 */

import { requireAuth, requireAdmin } from '../_middleware/auth';

interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
}

// GET all fault types or a specific fault type by ID
export async function onRequestGet(context: { request: Request; env: Env; params: any }) {
    const { request, env, params } = context;

    // Require authentication
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[3]; // /api/fault-types/{id}

    try {
        if (id && !id.includes('?')) {
            // Get specific fault type
            const faultType = await env.DB.prepare(
                'SELECT * FROM fault_types WHERE id = ?'
            ).bind(id).first();

            if (!faultType) {
                return new Response(JSON.stringify({ error: 'Fault type not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            return new Response(JSON.stringify(faultType), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Get all fault types
        const { results } = await env.DB.prepare(
            'SELECT * FROM fault_types ORDER BY name ASC'
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

// POST - Create a new fault type
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for creating fault types
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        const data = await request.json();
        const { name, description } = data;

        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        const result = await env.DB.prepare(
            `INSERT INTO fault_types (name, description) VALUES (?, ?)`
        )
            .bind(name, description || null)
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
                message: 'Fault type created successfully',
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

// PUT - Update a fault type
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for updating fault types
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

        await env.DB.prepare(`UPDATE fault_types SET ${fields} WHERE id = ?`)
            .bind(...values, id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: 'Fault type updated successfully' }),
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

// DELETE - Delete a fault type
export async function onRequestDelete(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for deleting fault types
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
        await env.DB.prepare('DELETE FROM fault_types WHERE id = ?').bind(id).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Fault type deleted successfully' }),
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
