import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stores in local directory
const dbPath = path.join(process.cwd(), 'local.db');

// Create the database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  console.log(`Creating new SQLite database at: ${dbPath}`);
}

// Initialize better-sqlite3
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle ORM instance
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });

// Initialize database with schema if needed
export async function initializeDatabase() {
  console.log('Initializing database schema...');

  try {
    // Read and execute migration files
    const migrationsPath = path.join(process.cwd(), 'migrations');

    if (fs.existsSync(migrationsPath)) {
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order

      for (const file of migrationFiles) {
        console.log(`Running migration: ${file}`);
        const sqlContent = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');

        // Execute the entire SQL file at once
        // SQLite can handle multiple statements in a single exec call
        try {
          sqlite.exec(sqlContent);
        } catch (error: any) {
          // Ignore "table already exists" and "already exists" errors
          if (!error.message.includes('already exists')) {
            console.error(`Error in migration ${file}:`, error.message);
            throw error;
          }
        }
      }

      console.log('✅ Database schema initialized successfully');
    } else {
      console.warn('⚠️  Migrations directory not found');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Helper function to execute raw SQL (for compatibility with storage.ts)
export async function executeSQL(query: string, params: any[] = []) {
  try {
    const stmt = sqlite.prepare(query);
    return stmt.all(...params);
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

// Add execute method for compatibility with existing code
// @ts-ignore - Adding execute method to db object
db.execute = executeSQL;

console.log(`📦 SQLite database initialized at: ${dbPath}`);
