-- Add trial tracking columns to landlords table
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS comped boolean DEFAULT false;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS billing_active boolean DEFAULT false;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS promo_code_id uuid DEFAULT NULL;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS promo_applied_at timestamptz DEFAULT NULL;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz DEFAULT NULL;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS plan_price numeric(8,2) DEFAULT 29.99;
