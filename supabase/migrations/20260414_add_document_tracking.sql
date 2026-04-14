-- Add tenant document tracking columns to documents table
-- Run this in Supabase SQL Editor

-- When landlord marks document as served to tenant
ALTER TABLE documents ADD COLUMN IF NOT EXISTS served_to_tenant_id uuid REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS served_at timestamptz;

-- When tenant opens/views the document
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_opened_at timestamptz;

-- When tenant confirms/acknowledges receipt
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_confirmed_at timestamptz;

-- Create an index for quick lookups by tenant
CREATE INDEX IF NOT EXISTS idx_documents_served_tenant ON documents(served_to_tenant_id) WHERE served_to_tenant_id IS NOT NULL;

-- Allow tenants to update their own opened_at and confirmed_at
-- (This RLS policy is for the tenant portal)
CREATE POLICY "Tenants can update their document tracking" ON documents
  FOR UPDATE
  USING (served_to_tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()))
  WITH CHECK (served_to_tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));

-- Allow tenants to read documents served to them
CREATE POLICY "Tenants can read documents served to them" ON documents
  FOR SELECT
  USING (served_to_tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));
