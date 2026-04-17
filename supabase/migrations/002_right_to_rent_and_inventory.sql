-- Migration: Right to Rent checks & Inventory support
-- Run this in the Supabase SQL Editor for project fpgqqxaltegfjhqlhimk

-- ============================================================
-- 1. Right to Rent checks table
-- ============================================================
CREATE TABLE IF NOT EXISTS right_to_rent_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  tenancy_id uuid NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_date date NOT NULL,
  document_type_checked text NOT NULL,
  expiry_date date,
  next_check_due date,
  result text DEFAULT 'pass',
  notes text,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtr_checks_tenancy ON right_to_rent_checks(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_rtr_checks_tenant ON right_to_rent_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rtr_checks_landlord ON right_to_rent_checks(landlord_id);
CREATE INDEX IF NOT EXISTS idx_rtr_checks_next_due ON right_to_rent_checks(next_check_due);

ALTER TABLE right_to_rent_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own RTR checks"
  ON right_to_rent_checks FOR ALL
  USING (landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid()))
  WITH CHECK (landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 2. Compliance alerts tracking table
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id uuid REFERENCES tenancies(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  document_type text,
  expiry_date date,
  days_before integer NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(landlord_id, property_id, tenancy_id, alert_type, document_type, days_before)
);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_landlord ON compliance_alerts(landlord_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_sent ON compliance_alerts(sent_at);

ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own alerts"
  ON compliance_alerts FOR SELECT
  USING (landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid()));

-- ============================================================
-- 3. Add tenant_visible flag to documents if not exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'tenant_visible'
  ) THEN
    ALTER TABLE documents ADD COLUMN tenant_visible boolean DEFAULT true;
  END IF;
END $$;

-- ============================================================
-- 4. Add plan fields to landlords if not exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'plan'
  ) THEN
    ALTER TABLE landlords ADD COLUMN plan text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'plan_price'
  ) THEN
    ALTER TABLE landlords ADD COLUMN plan_price numeric(6,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'billing_active'
  ) THEN
    ALTER TABLE landlords ADD COLUMN billing_active boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'gocardless_customer_id'
  ) THEN
    ALTER TABLE landlords ADD COLUMN gocardless_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'gocardless_mandate_id'
  ) THEN
    ALTER TABLE landlords ADD COLUMN gocardless_mandate_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'max_properties'
  ) THEN
    ALTER TABLE landlords ADD COLUMN max_properties integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlords' AND column_name = 'comped'
  ) THEN
    ALTER TABLE landlords ADD COLUMN comped boolean DEFAULT false;
  END IF;
END $$;
