-- Migration to simplify the farm hierarchy schema
-- Remove physical dimensions and positioning columns
-- Make name columns optional

-- First, drop any constraints that reference columns we're about to drop
ALTER TABLE public.rows DROP CONSTRAINT IF EXISTS rows_farm_id_position_key;
ALTER TABLE public.racks DROP CONSTRAINT IF EXISTS racks_row_id_position_in_row_key;
ALTER TABLE public.shelves DROP CONSTRAINT IF EXISTS shelves_rack_id_position_in_rack_key;

-- Remove physical dimension and position columns from farms table
ALTER TABLE public.farms DROP COLUMN IF EXISTS width;
ALTER TABLE public.farms DROP COLUMN IF EXISTS depth;

-- Remove physical dimension and position columns from rows table
ALTER TABLE public.rows DROP COLUMN IF EXISTS position;
ALTER TABLE public.rows DROP COLUMN IF EXISTS position_x;
ALTER TABLE public.rows DROP COLUMN IF EXISTS position_y;
ALTER TABLE public.rows DROP COLUMN IF EXISTS length;
ALTER TABLE public.rows DROP COLUMN IF EXISTS depth;

-- Remove physical dimension and position columns from racks table
ALTER TABLE public.racks DROP COLUMN IF EXISTS position_in_row;
ALTER TABLE public.racks DROP COLUMN IF EXISTS width;
ALTER TABLE public.racks DROP COLUMN IF EXISTS depth;
ALTER TABLE public.racks DROP COLUMN IF EXISTS height;
ALTER TABLE public.racks DROP COLUMN IF EXISTS max_shelves;

-- Remove physical dimension and position columns from shelves table
ALTER TABLE public.shelves DROP COLUMN IF EXISTS position_in_rack;
ALTER TABLE public.shelves DROP COLUMN IF EXISTS width;
ALTER TABLE public.shelves DROP COLUMN IF EXISTS depth;
ALTER TABLE public.shelves DROP COLUMN IF EXISTS max_weight;

-- Make name columns optional (allow NULL)
ALTER TABLE public.rows ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.racks ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.shelves ALTER COLUMN name DROP NOT NULL;

-- Update unique constraints to handle optional names
-- Drop existing name-based unique constraints
ALTER TABLE public.rows DROP CONSTRAINT IF EXISTS rows_farm_id_name_key;
ALTER TABLE public.racks DROP CONSTRAINT IF EXISTS racks_row_id_name_key;
ALTER TABLE public.shelves DROP CONSTRAINT IF EXISTS shelves_rack_id_name_key;

-- Add partial unique constraints that only apply when name is not null
CREATE UNIQUE INDEX IF NOT EXISTS rows_farm_id_name_unique 
  ON public.rows (farm_id, name) 
  WHERE name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS racks_row_id_name_unique 
  ON public.racks (row_id, name) 
  WHERE name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS shelves_rack_id_name_unique 
  ON public.shelves (rack_id, name) 
  WHERE name IS NOT NULL; 