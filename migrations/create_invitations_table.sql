-- Migration: Create invitations table
-- Run this SQL script directly on your database

-- 1. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  invited_by VARCHAR REFERENCES users(id),
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  revoked_at TIMESTAMP
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org_status ON invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- 3. Create unique constraint for pending invitations (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_invitation
  ON invitations(organization_id, email)
  WHERE status = 'pending';
