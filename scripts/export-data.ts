import { db } from "../server/db";
import * as schema from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

/**
 * ElectroTrack Database Data Export Script
 * Exports all database tables to JSON files for backup/migration
 */

async function exportDatabase() {
  try {
    console.log("🔄 Starting database export...\n");

    const backupDir = path.join(process.cwd(), "backups");
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportDir = path.join(backupDir, `export_${timestamp}`);
    fs.mkdirSync(exportDir, { recursive: true });

    // Export all tables
    const tables = {
      users: await db.select().from(schema.users),
      clients: await db.select().from(schema.clients),
      inverters: await db.select().from(schema.inverters),
      faultTypes: await db.select().from(schema.faultTypes),
      components: await db.select().from(schema.components),
      categories: await db.select().from(schema.categories),
      suppliers: await db.select().from(schema.suppliers),
      repairs: await db.select().from(schema.repairs),
      usedComponents: await db.select().from(schema.usedComponents),
      repairHistory: await db.select().from(schema.repairHistory),
      settings: await db.select().from(schema.settings),
    };

    // Write each table to a JSON file
    let totalRecords = 0;
    for (const [tableName, data] of Object.entries(tables)) {
      const filePath = path.join(exportDir, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ ${tableName}: ${data.length} records exported`);
      totalRecords += data.length;
    }

    // Create metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      totalRecords,
      tables: Object.keys(tables),
      version: "1.0.0",
      application: "ElectroTrack",
    };
    fs.writeFileSync(
      path.join(exportDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✨ Export completed successfully!`);
    console.log(`📁 Location: ${exportDir}`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`\n⚠️  Note: Uploaded files (photos, datasheets) are NOT included.`);
    console.log(`   Copy the /attached_assets folder separately if needed.`);

  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
}

// Run export
exportDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
