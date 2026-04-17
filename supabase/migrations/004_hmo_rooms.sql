-- 004: HMO Room Support
-- Adds a property_rooms table so HMO landlords can define rooms
-- (by number or name) and assign tenants to specific rooms.

-- ============================================================
-- 1. property_rooms table
-- ============================================================
CREATE TABLE IF NOT EXISTS property_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_label text NOT NULL,              -- e.g. "Room 1", "The Attic", "B2"
  floor smallint,                        -- optional floor number
  notes text,                            -- optional notes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, room_label)
);

CREATE INDEX IF NOT EXISTS idx_property_rooms_property ON property_rooms(property_id);

ALTER TABLE property_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own rooms"
  ON property_rooms FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid())))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE landlord_id IN (SELECT id FROM landlords WHERE auth_user_id = auth.uid())));

-- ============================================================
-- 2. Add room_id to tenancy_tenants junction table
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenancy_tenants' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE tenancy_tenants ADD COLUMN room_id uuid REFERENCES property_rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenancy_tenants_room ON tenancy_tenants(room_id) WHERE room_id IS NOT NULL;

-- ============================================================
-- 3. Add compliance_overrides JSONB to properties
--    Stores manual N/A flags e.g. {"gas_safety":"na","eicr":"na"}
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'compliance_overrides'
  ) THEN
    ALTER TABLE properties ADD COLUMN compliance_overrides jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
