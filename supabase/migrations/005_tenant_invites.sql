-- Migration: Tenant invite tracking
-- Adds invite status, token, and timestamp to tenants table

-- Invite status: 'invited' (email sent), 'registered' (tenant signed up), NULL (legacy)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS invite_status text DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT NULL;

-- Index for token lookups (tenant portal uses this to match invite link)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_invite_token ON tenants(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_invite_status ON tenants(invite_status) WHERE invite_status IS NOT NULL;
