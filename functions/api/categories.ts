/**
 * Cloudflare Pages Function - Categories API with D1 Database
 * CRUD operations for component categories
 * Authorization: Admin role required for write operations
 */

import { requireAuth, requireAdmin } from '../_middleware/auth';

interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
}

// GET all categories or a specific category by ID
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
            // Get specific category
            const category = await env.DB.prepare(
                'SELECT * FROM categories WHERE id = ?'
            ).bind(id).first();

            if (!category) {
                return new Response(JSON.stringify({ error: 'Category not found' }), {
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
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}

// POST - Create a new category
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for creating categories
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
            `INSERT INTO categories (name, description) VALUES (?, ?)`
        )
            .bind(name, description || null)
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
                message: 'Category created successfully',
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

// PUT - Update a category
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for updating categories
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

        await env.DB.prepare(`UPDATE categories SET ${fields} WHERE id = ?`)
            .bind(...values, id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: 'Category updated successfully' }),
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

// DELETE - Delete a category
export async function onRequestDelete(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // Require Admin role for deleting categories
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
        await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

        return new Response(
            JSON.stringify({ success: true, message: 'Category deleted successfully' }),
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
