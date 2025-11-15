import { db } from "./server/db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function fixAdminPassword() {
  try {
    console.log("Checking for admin user...");

    // Try to find admin user
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database`);

    let adminUser = allUsers.find(u => u.username === 'admin');

    if (!adminUser) {
      console.log("No admin user found. Creating admin user...");

      // Hash the password 'admin'
      const hashedPassword = await bcrypt.hash('admin', 10);

      // Create admin user
      const [newAdmin] = await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        role: 'Admin'
      }).returning();

      console.log("✓ Admin user created successfully!");
      console.log(`  Username: admin`);
      console.log(`  Password: admin`);
      console.log(`  Role: Admin`);
      console.log(`  Hashed password: ${hashedPassword}`);
    } else {
      console.log(`Found admin user (ID: ${adminUser.id})`);

      // Check if password is already hashed
      if (adminUser.password.startsWith("$2b$") || adminUser.password.startsWith("$2a$")) {
        console.log("Password is already hashed");

        // Test if it matches 'admin'
        const matches = await bcrypt.compare('admin', adminUser.password);
        if (matches) {
          console.log("✓ Current password IS 'admin' - login should work!");
        } else {
          console.log("⚠ Current password is NOT 'admin' - resetting...");
          const hashedPassword = await bcrypt.hash('admin', 10);
          await db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, adminUser.id));
          console.log("✓ Password reset to 'admin'");
          console.log(`  New hashed password: ${hashedPassword}`);
        }
      } else {
        console.log("Password is NOT hashed. Hashing now...");
        const hashedPassword = await bcrypt.hash('admin', 10);
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, adminUser.id));
        console.log("✓ Password hashed successfully!");
        console.log(`  Hashed password: ${hashedPassword}`);
      }
    }

    // Also create test user if not exists
    let testUser = allUsers.find(u => u.username === 'test');
    if (!testUser) {
      console.log("\nCreating test user...");
      const hashedPassword = await bcrypt.hash('test123', 10);
      await db.insert(users).values({
        username: 'test',
        password: hashedPassword,
        role: 'Technician'
      }).returning();
      console.log("✓ Test user created (username: test, password: test123)");
    }

    console.log("\n✅ All done! You can now login with:");
    console.log("   Username: admin");
    console.log("   Password: admin");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminPassword();
