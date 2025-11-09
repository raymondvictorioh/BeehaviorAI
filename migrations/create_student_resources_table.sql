-- Migration: Create student_resources table
-- Run this SQL script directly on your database

-- 1. Create student_resources table
CREATE TABLE IF NOT EXISTS student_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR NOT NULL REFERENCES organizations(id),
  student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_resources_student_id ON student_resources(student_id);
CREATE INDEX IF NOT EXISTS idx_student_resources_organization_id ON student_resources(organization_id);
