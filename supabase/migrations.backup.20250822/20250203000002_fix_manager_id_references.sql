-- Fix database functions that still reference manager_id instead of user_id
-- This migration updates all stored procedures and functions to use the new user_id column

-- Update search_devices function
CREATE OR REPLACE FUNCTION public.search_devices(search_term text, farm_uuid uuid DEFAULT NULL)
RETURNS TABLE(
  device_id uuid,
  entity_id text,
  friendly_name text,
  device_type text,
  location_description text,
  farm_name text,
  relevance_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    ) / 3.0 as relevance_score
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
$$;

-- Update get_farm_statistics function
CREATE OR REPLACE FUNCTION public.get_farm_statistics(farm_uuid uuid)
RETURNS TABLE(
  farm_id uuid,
  farm_name text,
  total_rows integer,
  total_racks integer,
  total_shelves integer,
  total_devices integer,
  active_schedules integer,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as farm_id,
    f.name as farm_name,
    (SELECT COUNT(*)::integer FROM public.rows WHERE farm_id = f.id) as total_rows,
    (SELECT COUNT(*)::integer FROM public.racks ra 
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_racks,
    (SELECT COUNT(*)::integer FROM public.shelves s
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as total_shelves,
    (SELECT COUNT(*)::integer FROM public.device_assignments da
     WHERE da.farm_id = f.id 
     OR da.row_id IN (SELECT id FROM public.rows WHERE farm_id = f.id)
     OR da.rack_id IN (
       SELECT ra.id FROM public.racks ra 
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )
     OR da.shelf_id IN (
       SELECT s.id FROM public.shelves s
       JOIN public.racks ra ON s.rack_id = ra.id
       JOIN public.rows r ON ra.row_id = r.id 
       WHERE r.farm_id = f.id
     )) as total_devices,
    (SELECT COUNT(*)::integer FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id AND sc.status = 'active') as active_schedules,
    (SELECT
       CASE 
         WHEN COUNT(*) = 0 THEN 0::numeric
         ELSE ROUND(
           (COUNT(*) FILTER (WHERE status = 'completed'))::numeric / COUNT(*)::numeric * 100, 2
         )
       END
     FROM public.schedules sc
     JOIN public.shelves s ON sc.shelf_id = s.id
     JOIN public.racks ra ON s.rack_id = ra.id
     JOIN public.rows r ON ra.row_id = r.id 
     WHERE r.farm_id = f.id) as completion_rate
  FROM public.farms f
  WHERE f.id = farm_uuid
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  );
END;
$$;

-- Update get_device_status_summary function
CREATE OR REPLACE FUNCTION public.get_device_status_summary(farm_uuid uuid DEFAULT NULL)
RETURNS TABLE(
  device_type text,
  total_count bigint,
  last_update timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.entity_type as device_type,
    COUNT(*) as total_count,
    MAX(da.updated_at) as last_update
  FROM public.device_assignments da
  WHERE (farm_uuid IS NULL OR da.farm_id = farm_uuid)
  AND (
    farm_uuid IS NULL OR
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_uuid 
      AND (
        f.user_id = auth.uid() OR
        public.is_admin()
      )
    )
  )
  GROUP BY da.entity_type
  ORDER BY da.entity_type;
END;
$$;

-- Update get_active_schedules_with_progress function
CREATE OR REPLACE FUNCTION public.get_active_schedules_with_progress(farm_uuid uuid DEFAULT NULL)
RETURNS TABLE(
  schedule_id uuid,
  shelf_name text,
  rack_name text,
  row_name text,
  farm_name text,
  species_name text,
  recipe_name text,
  start_date date,
  estimated_end_date date,
  days_elapsed integer,
  days_remaining integer,
  progress_percentage numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id as schedule_id,
    s.name as shelf_name,
    ra.name as rack_name,
    r.name as row_name,
    f.name as farm_name,
    sp.name as species_name,
    gr.name as recipe_name,
    sc.start_date,
    sc.estimated_end_date,
    EXTRACT(DAY FROM (NOW() - sc.start_date))::integer as days_elapsed,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (sc.estimated_end_date - NOW()))::integer
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN sc.estimated_end_date IS NOT NULL 
      THEN ROUND(
        EXTRACT(EPOCH FROM (NOW() - sc.start_date)) / 
        EXTRACT(EPOCH FROM (sc.estimated_end_date - sc.start_date)) * 100, 2
      )
      ELSE NULL
    END as progress_percentage,
    sc.status
  FROM public.schedules sc
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  JOIN public.grow_recipes gr ON sc.grow_recipe_id = gr.id
  JOIN public.species sp ON gr.species_id = sp.id
  WHERE sc.status IN ('planned', 'active')
  AND (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  ORDER BY sc.start_date DESC;
END;
$$;

-- Update get_harvest_analytics function
CREATE OR REPLACE FUNCTION public.get_harvest_analytics(farm_uuid uuid DEFAULT NULL, start_date date DEFAULT NULL, end_date date DEFAULT NULL)
RETURNS TABLE(
  species_name text,
  total_harvests bigint,
  total_yield numeric,
  average_yield numeric,
  best_yield numeric,
  average_grow_days numeric,
  success_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name as species_name,
    COUNT(h.id) as total_harvests,
    COALESCE(SUM(h.actual_yield), 0) as total_yield,
    COALESCE(AVG(h.actual_yield), 0) as average_yield,
    COALESCE(MAX(h.actual_yield), 0) as best_yield,
    COALESCE(AVG(EXTRACT(DAY FROM (h.harvest_date - sc.start_date))), 0) as average_grow_days,
    ROUND(
      COUNT(h.id)::numeric / 
      GREATEST(COUNT(sc.id), 1)::numeric * 100, 2
    ) as success_rate
  FROM public.species sp
  JOIN public.grow_recipes gr ON sp.id = gr.species_id
  JOIN public.schedules sc ON gr.id = sc.grow_recipe_id
  LEFT JOIN public.harvests h ON sc.id = h.schedule_id
    AND h.harvest_date BETWEEN COALESCE(start_date, '1900-01-01'::date) AND COALESCE(end_date, '2100-12-31'::date)
  JOIN public.shelves s ON sc.shelf_id = s.id
  JOIN public.racks ra ON s.rack_id = ra.id
  JOIN public.rows r ON ra.row_id = r.id
  JOIN public.farms f ON r.farm_id = f.id
  WHERE (farm_uuid IS NULL OR f.id = farm_uuid)
  AND (
    f.user_id = auth.uid() OR
    public.is_admin()
  )
  AND sc.start_date >= COALESCE(start_date, '1900-01-01'::date)
  GROUP BY sp.id, sp.name
  ORDER BY total_harvests DESC, total_yield DESC;
END;
$$;

-- Update get_user_storage_usage function
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_uuid uuid)
RETURNS TABLE(
  total_files bigint,
  total_size_mb numeric,
  quota_mb integer,
  usage_percentage numeric,
  files_by_bucket jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user can access this information
  IF user_uuid != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view storage usage';
  END IF;

  RETURN QUERY
  WITH user_files AS (
    SELECT 
      o.bucket_id,
      COUNT(*) as file_count,
      COALESCE(SUM(o.metadata->>'size')::bigint, 0) as total_bytes
    FROM storage.objects o
    WHERE (
      (o.bucket_id = 'user-uploads' AND (storage.foldername(o.name))[1] = user_uuid::text) OR
      (o.bucket_id IN ('farm-documentation', 'harvest-photos') AND EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(o.name))[1]
        AND f.user_id = user_uuid
      ))
    )
    AND o.name IS NOT NULL
    GROUP BY o.bucket_id
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(file_count), 0) as total_files,
      ROUND(COALESCE(SUM(total_bytes), 0) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM user_files
  ),
  user_quota AS (
    SELECT COALESCE(storage_quota_mb, 100) as quota_mb
    FROM public.user_profiles
    WHERE id = user_uuid
  )
  SELECT 
    t.total_files,
    t.total_size_mb,
    uq.quota_mb,
    CASE 
      WHEN uq.quota_mb > 0 THEN ROUND((t.total_size_mb / uq.quota_mb) * 100, 2)
      ELSE 0
    END as usage_percentage,
    COALESCE(
      jsonb_object_agg(uf.bucket_id, jsonb_build_object(
        'files', uf.file_count,
        'size_mb', ROUND(uf.total_bytes / 1024.0 / 1024.0, 2)
      )), 
      '{}'::jsonb
    ) as files_by_bucket
  FROM totals t
  CROSS JOIN user_quota uq
  LEFT JOIN user_files uf ON true
  GROUP BY t.total_files, t.total_size_mb, uq.quota_mb;
END;
$$;

-- Add comment for clarity
-- Fix all database functions that were still referencing manager_id instead of user_id 