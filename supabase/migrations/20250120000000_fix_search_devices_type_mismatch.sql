-- Fix search_devices function type mismatch
-- The similarity() function returns 'real' but the function signature declares 'numeric'
-- This causes: "Returned type double precision does not match expected type numeric in column 7"

DROP FUNCTION IF EXISTS public.search_devices(text, uuid);

CREATE OR REPLACE FUNCTION public.search_devices(
  search_term text,
  farm_uuid uuid DEFAULT NULL
)
RETURNS TABLE (
  device_id uuid,
  entity_id text,
  friendly_name text,
  device_type text,
  location_description text,
  farm_name text,
  relevance_score real  -- Changed from 'numeric' to 'real' to match similarity() return type
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id as device_id,
    da.entity_id,
    da.friendly_name,
    da.entity_type as device_type,
    CASE 
      WHEN da.shelf_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name, ' > ', s.name)
      WHEN da.rack_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name, ' > ', ra.name)
      WHEN da.row_id IS NOT NULL THEN 
        CONCAT(f.name, ' > ', r.name)
      WHEN da.farm_id IS NOT NULL THEN 
        f.name
      ELSE 'Unassigned'
    END as location_description,
    f.name as farm_name,
    (
      similarity(COALESCE(da.friendly_name, ''), search_term) +
      similarity(da.entity_id, search_term) +
      similarity(da.entity_type, search_term)
    ) / 3.0 as relevance_score  -- This naturally returns 'real' type
  FROM public.device_assignments da
  LEFT JOIN public.shelves s ON da.shelf_id = s.id
  LEFT JOIN public.racks ra ON da.rack_id = ra.id OR s.rack_id = ra.id
  LEFT JOIN public.rows r ON da.row_id = r.id OR ra.row_id = r.id
  LEFT JOIN public.farms f ON da.farm_id = f.id OR r.farm_id = f.id
  WHERE (
    COALESCE(da.friendly_name, '') ILIKE '%' || search_term || '%' OR
    da.entity_id ILIKE '%' || search_term || '%' OR
    da.entity_type ILIKE '%' || search_term || '%'
  )
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  ORDER BY relevance_score DESC, da.friendly_name;
END;
$$ LANGUAGE plpgsql; 