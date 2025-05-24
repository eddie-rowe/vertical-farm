-- Add missing parameters to grow_recipes table for comprehensive recipe management

-- Add new columns to grow_recipes table
ALTER TABLE public.grow_recipes 
ADD COLUMN recipe_source TEXT,
ADD COLUMN germination_days INTEGER,
ADD COLUMN light_days INTEGER,
ADD COLUMN total_grow_days INTEGER,
ADD COLUMN top_coat TEXT,
ADD COLUMN pythium_risk TEXT CHECK (pythium_risk IN ('Low', 'Medium', 'High')),
ADD COLUMN water_intake NUMERIC(6,2), -- ml per tray per watering session
ADD COLUMN water_frequency TEXT, -- descriptive frequency like "Once daily", "Twice daily"
ADD COLUMN lighting JSONB, -- complex lighting schedule parameters
ADD COLUMN fridge_storage_temp NUMERIC(4,1), -- degrees Celsius
ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard'));

-- Add comments to clarify field purposes
COMMENT ON COLUMN public.grow_recipes.recipe_source IS 'Source of the recipe (e.g., "Supplier X", "Internal R&D", "Community Forum")';
COMMENT ON COLUMN public.grow_recipes.sowing_rate IS 'Seed density (grams or seeds per tray/area) - maps to seed_density_dry';
COMMENT ON COLUMN public.grow_recipes.average_yield IS 'Average yield per tray (grams) - maps to avg_tray_yield';
COMMENT ON COLUMN public.grow_recipes.germination_days IS 'Days required for germination phase';
COMMENT ON COLUMN public.grow_recipes.light_days IS 'Days requiring light exposure after germination';
COMMENT ON COLUMN public.grow_recipes.total_grow_days IS 'Total grow cycle days (may be calculated or manually set)';
COMMENT ON COLUMN public.grow_recipes.top_coat IS 'Top coat material used after seeding (e.g., "Vermiculite", "None")';
COMMENT ON COLUMN public.grow_recipes.pythium_risk IS 'Risk assessment for Pythium infection';
COMMENT ON COLUMN public.grow_recipes.water_intake IS 'Water consumption per tray per watering session (ml)';
COMMENT ON COLUMN public.grow_recipes.water_frequency IS 'Descriptive watering frequency pattern';
COMMENT ON COLUMN public.grow_recipes.lighting IS 'Complex lighting schedule and parameters in JSON format';
COMMENT ON COLUMN public.grow_recipes.fridge_storage_temp IS 'Optimal post-harvest refrigeration temperature (Celsius)';
COMMENT ON COLUMN public.grow_recipes.difficulty IS 'Subjective difficulty rating for growing this recipe';

-- Create indexes for frequently queried fields
CREATE INDEX idx_grow_recipes_difficulty ON public.grow_recipes(difficulty);
CREATE INDEX idx_grow_recipes_pythium_risk ON public.grow_recipes(pythium_risk);
CREATE INDEX idx_grow_recipes_total_grow_days ON public.grow_recipes(total_grow_days);

-- Add a trigger to automatically calculate total_grow_days if not explicitly set
CREATE OR REPLACE FUNCTION calculate_total_grow_days()
RETURNS TRIGGER AS $$
BEGIN
  -- If total_grow_days is not set, calculate it from germination_days + light_days
  IF NEW.total_grow_days IS NULL THEN
    NEW.total_grow_days := COALESCE(NEW.germination_days, 0) + COALESCE(NEW.light_days, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_total_grow_days
  BEFORE INSERT OR UPDATE ON public.grow_recipes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_grow_days(); 