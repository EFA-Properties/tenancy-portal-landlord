-- Migration: Document final approval + messaging

-- ============================================================
-- 1. Final document approval — tenant double-checks all accepted docs
-- ============================================================
CREATE TABLE IF NOT EXISTS document_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenancy_id uuid NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now(),
  document_ids uuid[] NOT NULL,
  ip_address text,
  user_agent text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_approvals_tenancy ON document_approvals(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_doc_approvals_tenant ON document_approvals(tenant_id);

ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own approvals"
  ON document_approvals FOR SELECT
  USING (tenancy_id IN (SELECT id FROM tenancies WHERE landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid())));

CREATE POLICY "Tenants can create own approvals"
  ON document_approvals FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenants can view own approvals"
  ON document_approvals FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 2. Simple messaging between landlord and tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenancy_id uuid NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('landlord', 'tenant')),
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_tenancy ON messages(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(tenancy_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Landlords can read/write messages for their tenancies
CREATE POLICY "Landlords can manage own messages"
  ON messages FOR ALL
  USING (tenancy_id IN (SELECT id FROM tenancies WHERE landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid())))
  WITH CHECK (tenancy_id IN (SELECT id FROM tenancies WHERE landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid())));

-- Tenants can read messages for their tenancies
CREATE POLICY "Tenants can read their messages"
  ON messages FOR SELECT
  USING (tenancy_id IN (SELECT tenancy_id FROM tenancy_tenants WHERE tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())));

-- Tenants can send messages for their tenancies
CREATE POLICY "Tenants can send messages"
  ON messages FOR INSERT
  WITH CHECK (tenancy_id IN (SELECT tenancy_id FROM tenancy_tenants WHERE tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())));

-- Tenants can mark messages as read
CREATE POLICY "Tenants can mark messages read"
  ON messages FOR UPDATE
  USING (tenancy_id IN (SELECT tenancy_id FROM tenancy_tenants WHERE tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())));
