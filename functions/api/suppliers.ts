/**
 * Cloudflare Pages Function - Suppliers API with D1 Database
 * CRUD operations for suppliers
 * Authorization: Admin role required for write operations
 */

import { requireAuth, requireAdmin } from '../_middleware/auth';

interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
}

// GET all suppliers or a specific supplier by ID
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
            // Get specific supplier
            const supplier = await env.DB.prepare(
                'SELECT * FROM suppliers WHERE id = ?'
            ).bind(id).first();

            if (!supplier) {
                return new Response(JSON.stringify({ error: 'Supplier not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            return new Response(JSON.stringify(supplier), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Get all suppliers
        const { results } = await env.DB.prepare(
            'SELECT * FROM suppliers ORDER BY name ASC'
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

// POST - Create a new supplier
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for creating suppliers
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        const data = await request.json();
        const { name, contact_name, email, phone, address, website, remarks, tags } = data;

        if (!name) {
            return new Response(JSON.stringify({ error: 'Name is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Convert tags array to JSON string if provided
        const tagsJson = tags ? JSON.stringify(tags) : null;

        const result = await env.DB.prepare(
            `INSERT INTO suppliers (name, contact_name, email, phone, address, website, remarks, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                name,
                contact_name || null,
                email || null,
                phone || null,
                address || null,
                website || null,
                remarks || null,
                tagsJson
            )
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
                message: 'Supplier created successfully',
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

// PUT - Update a supplier
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for updating suppliers
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        const data = await request.json();
        const { id, tags, ...updates } = data;

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Convert tags array to JSON string if provided
        if (tags !== undefined) {
            updates.tags = JSON.stringify(tags);
        }

        // Build dynamic update query
        const fields = Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(', ');
        const values = Object.values(updates);

        await env.DB.prepare(`UPDATE suppliers SET ${fields} WHERE id = ?`)
            .bind(...values, id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: 'Supplier updated successfully' }),
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

// DELETE - Delete a supplier
export async function onRequestDelete(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for deleting suppliers
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
        await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Supplier deleted successfully' }),
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
