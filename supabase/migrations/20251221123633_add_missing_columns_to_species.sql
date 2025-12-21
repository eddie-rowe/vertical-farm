-- Add missing columns to species table
-- These columns are expected by the frontend types but were missing from the schema

ALTER TABLE species
ADD COLUMN IF NOT EXISTS scientific_name text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'leafy_greens';

-- Add comments for documentation
COMMENT ON COLUMN species.scientific_name IS 'Scientific/Latin name of the species';
COMMENT ON COLUMN species.category IS 'Category: leafy_greens, herbs, microgreens, etc.';

-- Update existing species with appropriate categories based on name
UPDATE species SET category = 'herbs' WHERE LOWER(name) LIKE '%basil%' OR LOWER(name) LIKE '%mint%' OR LOWER(name) LIKE '%cilantro%';
UPDATE species SET category = 'microgreens' WHERE LOWER(name) LIKE '%microgreen%' OR LOWER(name) LIKE '%micro%';
UPDATE species SET category = 'leafy_greens' WHERE category IS NULL OR category = 'leafy_greens';
