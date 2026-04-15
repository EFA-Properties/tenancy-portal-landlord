-- Add billing/plan fields to landlords table
-- Run this in Supabase SQL Editor (ALREADY RUN on 2026-04-15)

ALTER TABLE landlords ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS plan_price NUMERIC(6,2) NOT NULL DEFAULT 0.00;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS billing_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS gc_customer_id TEXT;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS gc_mandate_id TEXT;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS gc_subscription_id TEXT;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS billing_grace_until TIMESTAMPTZ;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS portfolio_type TEXT CHECK (portfolio_type IN ('btl', 'hmo', 'hybrid'));
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS property_count_range TEXT;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
