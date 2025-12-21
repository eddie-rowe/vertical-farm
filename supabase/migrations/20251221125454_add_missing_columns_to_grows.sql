-- Add missing columns to grows table
-- These columns are expected by the frontend GrowRecipeService but were missing from the schema

-- Add actual_yield column (for tracking final yield from a grow)
ALTER TABLE grows
ADD COLUMN IF NOT EXISTS actual_yield numeric;

-- Add grow_recipe_id column (foreign key to grow_recipes)
ALTER TABLE grows
ADD COLUMN IF NOT EXISTS grow_recipe_id uuid REFERENCES grow_recipes(id);

-- Add comments for documentation
COMMENT ON COLUMN grows.actual_yield IS 'The actual yield amount from this grow cycle';
COMMENT ON COLUMN grows.grow_recipe_id IS 'Reference to the grow recipe used for this grow';

-- Create index for efficient recipe lookups
CREATE INDEX IF NOT EXISTS idx_grows_grow_recipe_id ON grows(grow_recipe_id);

-- Backfill grow_recipe_id from recipe_id if they should be the same
-- (recipe_id seems to be a legacy column that may have served the same purpose)
UPDATE grows
SET grow_recipe_id = recipe_id
WHERE grow_recipe_id IS NULL AND recipe_id IS NOT NULL;
