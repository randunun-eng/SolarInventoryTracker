/**
 * Database Test Endpoint - Verify D1 Read/Write Access
 * Test endpoint to check if D1 database is accessible
 */

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // Test 1: Check if DB binding exists
    results.tests.dbBinding = {
      status: env.DB ? 'PASS' : 'FAIL',
      message: env.DB ? 'DB binding found' : 'DB binding missing',
    };

    if (!env.DB) {
      return new Response(JSON.stringify(results), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Test 2: Read from categories table
    try {
      const categoriesResult = await env.DB.prepare('SELECT COUNT(*) as count FROM categories').first();
      results.tests.readCategories = {
        status: 'PASS',
        message: `Found ${categoriesResult.count} categories`,
        data: categoriesResult,
      };
    } catch (error: any) {
      results.tests.readCategories = {
        status: 'FAIL',
        message: error.message,
      };
    }

    // Test 3: Read from components table
    try {
      const componentsResult = await env.DB.prepare('SELECT COUNT(*) as count FROM components').first();
      results.tests.readComponents = {
        status: 'PASS',
        message: `Found ${componentsResult.count} components`,
        data: componentsResult,
      };
    } catch (error: any) {
      results.tests.readComponents = {
        status: 'FAIL',
        message: error.message,
      };
    }

    // Test 4: Write test - Try to insert a test category
    try {
      const testName = `TEST_${Date.now()}`;
      const insertResult = await env.DB.prepare(
        'INSERT INTO categories (name, description) VALUES (?, ?)'
      )
        .bind(testName, 'Automated test category')
        .run();

      results.tests.writeCategory = {
        status: 'PASS',
        message: 'Successfully inserted test category',
        insertId: insertResult.meta.last_row_id,
      };

      // Clean up - delete the test category
      await env.DB.prepare('DELETE FROM categories WHERE id = ?')
        .bind(insertResult.meta.last_row_id)
        .run();

      results.tests.deleteCategory = {
        status: 'PASS',
        message: 'Successfully deleted test category',
      };
    } catch (error: any) {
      results.tests.writeCategory = {
        status: 'FAIL',
        message: error.message,
      };
    }

    // Test 5: List all categories
    try {
      const { results: allCategories } = await env.DB.prepare(
        'SELECT id, name FROM categories LIMIT 10'
      ).all();
      results.tests.listCategories = {
        status: 'PASS',
        message: `Listed ${allCategories.length} categories`,
        data: allCategories,
      };
    } catch (error: any) {
      results.tests.listCategories = {
        status: 'FAIL',
        message: error.message,
      };
    }

    // Overall status
    const failedTests = Object.values(results.tests).filter((t: any) => t.status === 'FAIL');
    results.overall = {
      status: failedTests.length === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED',
      totalTests: Object.keys(results.tests).length,
      passed: Object.keys(results.tests).length - failedTests.length,
      failed: failedTests.length,
    };

    return new Response(JSON.stringify(results, null, 2), {
      status: failedTests.length === 0 ? 200 : 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Database test failed',
        message: error.message,
        stack: error.stack,
        results,
      }, null, 2),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
