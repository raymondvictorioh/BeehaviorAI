-- Migration: Create classes table and add class_id to students table
-- Run this SQL script directly on your database

-- 1. Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add class_id column to students table (nullable for now)
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id VARCHAR REFERENCES classes(id);

-- 3. Create index on class_id for better query performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- 4. Create index on organization_id in classes table
CREATE INDEX IF NOT EXISTS idx_classes_organization_id ON classes(organization_id);

