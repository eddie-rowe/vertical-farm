-- Add is_active columns to support service layer filtering
-- Issue #65: New Grow Setup requires active filtering for species and grow recipes

-- Add is_active column to species table
ALTER TABLE species 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add is_active column to grow_recipes table  
ALTER TABLE grow_recipes 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create indexes for performance on filtering
CREATE INDEX idx_species_is_active ON species(is_active);
CREATE INDEX idx_grow_recipes_is_active ON grow_recipes(is_active);

-- Update existing records to be active by default
UPDATE species SET is_active = true WHERE is_active IS NULL;
UPDATE grow_recipes SET is_active = true WHERE is_active IS NULL;

-- Add helpful comments
COMMENT ON COLUMN species.is_active IS 'Whether this species is actively available for new grows';
COMMENT ON COLUMN grow_recipes.is_active IS 'Whether this grow recipe is actively available for selection';