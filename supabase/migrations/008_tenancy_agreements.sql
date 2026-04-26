-- Tenancy agreements with e-signature tracking
CREATE TABLE IF NOT EXISTS tenancy_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id uuid NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'tenancy_agreement' CHECK (type IN ('tenancy_agreement', 'inventory')),
  title text NOT NULL,
  content text NOT NULL, -- Rich text / markdown content of the agreement
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'countersigned')),

  -- Landlord signature
  landlord_signed_at timestamptz,
  landlord_signature_data text, -- base64 drawn signature or typed name
  landlord_signature_type text CHECK (landlord_signature_type IN ('drawn', 'typed')),
  landlord_ip text,

  -- Tenant signature
  tenant_signed_at timestamptz,
  tenant_signature_data text,
  tenant_signature_type text CHECK (tenant_signature_type IN ('drawn', 'typed')),
  tenant_ip text,
  tenant_user_agent text,

  -- PDF storage
  pdf_storage_path text, -- Supabase Storage path once generated

  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tenancy_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage their agreements"
  ON tenancy_agreements FOR ALL
  USING (
    tenancy_id IN (
      SELECT t.id FROM tenancies t
      JOIN properties p ON t.property_id = p.id
      JOIN landlords l ON p.landlord_id = l.id
      WHERE l.auth_user_id = auth.uid()
    )
  );

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_agreements_tenancy ON tenancy_agreements(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON tenancy_agreements(status);
