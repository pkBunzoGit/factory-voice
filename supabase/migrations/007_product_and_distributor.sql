-- Add image_url to products for individual product photos
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

-- Distributor / store locations
CREATE TABLE IF NOT EXISTS locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text NOT NULL,
  area text,
  phone text,
  location_type text NOT NULL DEFAULT 'distributor'
    CHECK (location_type IN ('distributor', 'store', 'warehouse')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_factory ON locations(factory_id);
