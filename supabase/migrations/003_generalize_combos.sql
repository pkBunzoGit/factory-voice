-- Generalize combo_solutions: replace agriculture-specific columns with flexible tags JSONB

ALTER TABLE combo_solutions ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{}';

-- Migrate existing data into tags
UPDATE combo_solutions SET tags = jsonb_strip_nulls(jsonb_build_object(
  'crop', crop, 'land_size', land_size, 'spacing_spec', spacing_spec
)) WHERE crop IS NOT NULL OR land_size IS NOT NULL OR spacing_spec IS NOT NULL;

-- Drop old domain-specific columns
ALTER TABLE combo_solutions DROP COLUMN IF EXISTS crop;
ALTER TABLE combo_solutions DROP COLUMN IF EXISTS land_size;
ALTER TABLE combo_solutions DROP COLUMN IF EXISTS spacing_spec;
