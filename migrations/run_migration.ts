import "dotenv/config";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    console.log("Creating classes table...");
    
    // Create classes table
    await pool.query({
      text: `CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    });
    
    console.log("Adding class_id column to students table...");
    
    // Add class_id column to students table
    await pool.query({
      text: `ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS class_id VARCHAR REFERENCES classes(id)`
    });
    
    console.log("Creating indexes...");
    
    // Create indexes
    await pool.query({
      text: `CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id)`
    });
    
    await pool.query({
      text: `CREATE INDEX IF NOT EXISTS idx_classes_organization_id ON classes(organization_id)`
    });

    console.log("Creating student_resources table...");

    // Create student_resources table
    await pool.query({
      text: `CREATE TABLE IF NOT EXISTS student_resources (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR NOT NULL REFERENCES organizations(id),
        student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    });

    console.log("Creating indexes for student_resources...");

    // Create indexes for student_resources
    await pool.query({
      text: `CREATE INDEX IF NOT EXISTS idx_student_resources_student_id ON student_resources(student_id)`
    });

    await pool.query({
      text: `CREATE INDEX IF NOT EXISTS idx_student_resources_organization_id ON student_resources(organization_id)`
    });

    console.log("✅ Migration completed successfully!");
    console.log("Classes table created and class_id column added to students table.");
    console.log("Student resources table created.");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    if (error.code === "42P07" || error.message?.includes("already exists")) {
      console.log("Note: Table or column may already exist. This is okay.");
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration();

