/**
 * Cloudflare Pages Function - Statistics API with D1 Database & AI
 * Get inventory and repair statistics with AI-powered insights
 */

interface Env {
  DB: D1Database;
  AI: any;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const includeInsights = url.searchParams.get('insights') === 'true';

  try {
    // Get component statistics
    const componentStats = await env.DB.prepare(
      `SELECT
        COUNT(*) as total_components,
        SUM(current_stock) as total_stock,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_count,
        SUM(current_stock * supplier_price) as total_inventory_value
       FROM components`
    ).first();

    // Get repair statistics
    const repairStats = await env.DB.prepare(
      `SELECT
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Waiting for Parts' THEN 1 END) as waiting_for_parts,
        AVG(labor_hours) as avg_labor_hours,
        SUM(total_cost) as total_revenue
       FROM repairs`
    ).first();

    // Get category breakdown
    const { results: categoryBreakdown } = await env.DB.prepare(
      `SELECT
        c.name as category,
        COUNT(comp.id) as component_count,
        SUM(comp.current_stock) as total_stock
       FROM categories c
       LEFT JOIN components comp ON c.id = comp.category_id
       GROUP BY c.id, c.name
       ORDER BY component_count DESC`
    ).all();

    // Get low stock items
    const { results: lowStockItems } = await env.DB.prepare(
      `SELECT
        name,
        part_number,
        current_stock,
        minimum_stock,
        location
       FROM components
       WHERE current_stock <= minimum_stock
       ORDER BY (current_stock - minimum_stock) ASC
       LIMIT 10`
    ).all();

    // Get recent repairs
    const { results: recentRepairs } = await env.DB.prepare(
      `SELECT
        r.id,
        r.status,
        r.inverter_model,
        r.received_date,
        c.name as client_name
       FROM repairs r
       LEFT JOIN clients c ON r.client_id = c.id
       ORDER BY r.received_date DESC
       LIMIT 5`
    ).all();

    const stats = {
      components: componentStats,
      repairs: repairStats,
      categoryBreakdown,
      lowStockItems,
      recentRepairs,
    };

    // Generate AI insights if requested
    if (includeInsights && env.AI) {
      try {
        const insightPrompt = `Analyze this Solar Inventory Tracker statistics and provide 3-5 key insights:

Component Stats:
- Total Components: ${componentStats.total_components}
- Total Stock: ${componentStats.total_stock}
- Low Stock Items: ${componentStats.low_stock_count}
- Inventory Value: $${componentStats.total_inventory_value}

Repair Stats:
- Total Repairs: ${repairStats.total_repairs}
- In Progress: ${repairStats.in_progress}
- Completed: ${repairStats.completed}
- Waiting for Parts: ${repairStats.waiting_for_parts}
- Average Labor Hours: ${repairStats.avg_labor_hours}
- Total Revenue: $${repairStats.total_revenue}

Provide actionable insights about:
1. Inventory health
2. Repair efficiency
3. Revenue trends
4. Recommended actions

Keep it concise and business-focused.`;

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            {
              role: 'system',
              content: 'You are a business analytics expert for solar inventory management.',
            },
            { role: 'user', content: insightPrompt },
          ],
        });

        stats.aiInsights = aiResponse.response || aiResponse.text;
      } catch (aiError) {
        console.error('AI insights error:', aiError);
        stats.aiInsights = 'AI insights temporarily unavailable';
      }
    }

    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Stats error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
