import bcrypt from 'bcrypt';
import { db } from './db';
import { users, categories, faultTypes } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);

    if (existingAdmin.length === 0) {
      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const techPassword = await bcrypt.hash('tech123', 10);

      // Create default admin user
      await db.insert(users).values({
        username: 'admin',
        password: adminPassword,
        name: 'Administrator',
        role: 'Admin',
      });

      console.log('✅ Created admin user (username: admin, password: admin123)');

      // Create test technician user
      await db.insert(users).values({
        username: 'tech1',
        password: techPassword,
        name: 'Test Technician',
        role: 'Technician',
      });

      console.log('✅ Created technician user (username: tech1, password: tech123)');
    } else {
      console.log('ℹ️  Admin user already exists, skipping user seed');
    }

    // Check if categories exist
    const existingCategories = await db.select().from(categories).limit(1);

    if (existingCategories.length === 0) {
      // Add sample categories
      const categoryData = [
        { name: 'Solar Panels', description: 'Photovoltaic panels and modules' },
        { name: 'Inverters', description: 'DC to AC power inverters' },
        { name: 'Batteries', description: 'Energy storage batteries' },
        { name: 'Controllers', description: 'Charge controllers and MPPT devices' },
        { name: 'Capacitors', description: 'Various capacitors' },
        { name: 'Resistors', description: 'Various resistors' },
        { name: 'ICs', description: 'Integrated circuits' },
        { name: 'Connectors', description: 'Electrical connectors and terminals' },
      ];

      for (const category of categoryData) {
        await db.insert(categories).values(category);
      }

      console.log('✅ Created sample categories');
    } else {
      console.log('ℹ️  Categories already exist, skipping category seed');
    }

    // Check if fault types exist
    const existingFaultTypes = await db.select().from(faultTypes).limit(1);

    if (existingFaultTypes.length === 0) {
      // Add sample fault types
      const faultTypeData = [
        { name: 'Error 11', description: 'Grid voltage error' },
        { name: 'Error 13', description: 'Isolation fault' },
        { name: 'Error 24', description: 'Communication error' },
        { name: 'No Power', description: 'Inverter not producing power' },
        { name: 'Overheating', description: 'Temperature too high' },
        { name: 'Fan Failure', description: 'Cooling fan not working' },
      ];

      for (const faultType of faultTypeData) {
        await db.insert(faultTypes).values(faultType);
      }

      console.log('✅ Created sample fault types');
    } else {
      console.log('ℹ️  Fault types already exist, skipping fault type seed');
    }

    console.log('🌱 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
