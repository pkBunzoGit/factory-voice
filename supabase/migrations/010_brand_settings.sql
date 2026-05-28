-- Brand identity settings for factories
-- logo_url: URL to the company logo stored in factory-logos bucket
-- brand_colors: JSONB with { primary, secondary, accent } hex color strings
ALTER TABLE factories ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{}';
