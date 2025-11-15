import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function hashPasswords() {
  try {
    console.log("Fetching all users...");
    const allUsers = await db.select().from(users);
    
    console.log(`Found ${allUsers.length} users`);
    
    for (const user of allUsers) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password.startsWith("$2b$")) {
        console.log(`User ${user.username} already has hashed password, skipping...`);
        continue;
      }
      
      console.log(`Hashing password for user: ${user.username}`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
      
      console.log(`✓ Password hashed for user: ${user.username}`);
    }
    
    console.log("\n✓ All passwords hashed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error hashing passwords:", error);
    process.exit(1);
  }
}

hashPasswords();
