-- Add priority column to grow_recipes table
-- This column is expected by GrowRecipeService but was missing from the schema

ALTER TABLE grow_recipes
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add comment for documentation
COMMENT ON COLUMN grow_recipes.priority IS 'Recipe priority level: low, medium, high, critical';
