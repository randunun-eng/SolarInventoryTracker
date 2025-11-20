import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Add execute method for raw SQL queries that handles parameterized queries
// @ts-ignore - Adding execute method to db object
db.execute = async (query: string, params: any[] = []) => {
  // Replace $1, $2, etc. with actual parameter values for Neon
  let processedQuery = query;
  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`;
    // Escape and quote the parameter value properly
    let value: string;
    if (param === null || param === undefined) {
      value = 'NULL';
    } else if (typeof param === 'string') {
      value = `'${param.replace(/'/g, "''")}'`;
    } else if (typeof param === 'number' || typeof param === 'boolean') {
      value = String(param);
    } else {
      // For objects/arrays, convert to JSON and escape quotes
      const jsonStr = JSON.stringify(param);
      value = `'${jsonStr.replace(/'/g, "''")}'`;
    }
    processedQuery = processedQuery.replace(placeholder, value);
  });
  
  return await sql(processedQuery);
};