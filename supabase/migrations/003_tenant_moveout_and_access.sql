-- 003: Tenant Move-Out, Archive & Access Revocation
-- Adds lifecycle management to the tenancy_tenants junction table
-- so landlords can move tenants out and revoke portal access.

-- Add status and lifecycle columns to tenancy_tenants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenancy_tenants' AND column_name = 'status'
  ) THEN
    ALTER TABLE tenancy_tenants
      ADD COLUMN status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'moved_out'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenancy_tenants' AND column_name = 'moved_out_at'
  ) THEN
    ALTER TABLE tenancy_tenants ADD COLUMN moved_out_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenancy_tenants' AND column_name = 'move_out_notes'
  ) THEN
    ALTER TABLE tenancy_tenants ADD COLUMN move_out_notes text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenancy_tenants' AND column_name = 'access_revoked_at'
  ) THEN
    ALTER TABLE tenancy_tenants ADD COLUMN access_revoked_at timestamptz;
  END IF;
END $$;

-- Index for quickly filtering active vs moved-out tenants
CREATE INDEX IF NOT EXISTS idx_tenancy_tenants_status ON tenancy_tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenancy_tenants_access_revoked ON tenancy_tenants(access_revoked_at) WHERE access_revoked_at IS NOT NULL;
