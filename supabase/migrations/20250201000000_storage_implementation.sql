-- =====================================================
-- SUPABASE STORAGE IMPLEMENTATION
-- =====================================================
-- This migration implements comprehensive storage features:
-- 1. User profile images and documents
-- 2. Farm documentation and photos
-- 3. Schedule/harvest documentation
-- 4. Device manuals and documentation
-- 5. Automated backup storage
-- 6. RLS policies for secure access

-- =====================================================
-- STORAGE BUCKET CREATION
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-uploads', 'user-uploads', false),
  ('farm-documentation', 'farm-documentation', false), 
  ('harvest-photos', 'harvest-photos', false),
  ('device-manuals', 'device-manuals', true),
  ('system-backups', 'system-backups', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- User uploads policies (profile images, personal documents)
CREATE POLICY "user_uploads_own_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Farm documentation policies (farm managers and operators can access)
CREATE POLICY "farm_documentation_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'farm-documentation' 
    AND (
      -- Check if user has access to the farm
      EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
        AND (
          f.manager_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('operator', 'admin')
          )
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'farm-documentation' 
    AND (
      EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
        AND f.manager_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() 
        AND up.role = 'admin'
      )
    )
  );

-- Harvest photos policies (accessible by farm hierarchy permissions)
CREATE POLICY "harvest_photos_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'harvest-photos' 
    AND (
      -- Extract farm_id from path and check permissions
      EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
        AND (
          f.manager_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('operator', 'admin')
          )
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'harvest-photos' 
    AND (
      EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
        AND (
          f.manager_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('operator', 'admin')
          )
        )
      )
    )
  );

-- Device manuals policies (public read, admin write)
CREATE POLICY "device_manuals_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'device-manuals');

CREATE POLICY "device_manuals_admin_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'device-manuals' 
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'device-manuals' 
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System backups policies (admin only)
CREATE POLICY "system_backups_admin_only" ON storage.objects
  FOR ALL USING (
    bucket_id = 'system-backups' 
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'system-backups' 
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- DATABASE SCHEMA EXTENSIONS FOR STORAGE
-- =====================================================

-- Add storage-related columns to existing tables
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS storage_quota_mb integer DEFAULT 100;

ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS documentation_folder_path text,
ADD COLUMN IF NOT EXISTS farm_image_url text;

ALTER TABLE public.harvests 
ADD COLUMN IF NOT EXISTS photo_urls text[],
ADD COLUMN IF NOT EXISTS documentation_urls text[];

ALTER TABLE public.grow_recipes 
ADD COLUMN IF NOT EXISTS instruction_document_url text,
ADD COLUMN IF NOT EXISTS reference_image_url text;

ALTER TABLE public.device_assignments 
ADD COLUMN IF NOT EXISTS manual_url text,
ADD COLUMN IF NOT EXISTS installation_photos text[];

-- =====================================================
-- STORAGE UTILITY FUNCTIONS
-- =====================================================

-- Function to generate secure file paths
CREATE OR REPLACE FUNCTION public.generate_storage_path(
  bucket_name text,
  folder_id uuid,
  file_name text,
  user_id uuid DEFAULT auth.uid()
)
RETURNS text
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_name text;
  timestamp_suffix text;
  file_extension text;
  base_name text;
BEGIN
  -- Extract file extension
  file_extension := COALESCE(
    SUBSTRING(file_name FROM '\.([^.]+)$'), 
    ''
  );
  
  -- Get base name without extension
  base_name := CASE 
    WHEN file_extension != '' THEN 
      SUBSTRING(file_name FROM '^(.+)\.[^.]+$')
    ELSE 
      file_name
  END;
  
  -- Sanitize filename
  sanitized_name := REGEXP_REPLACE(
    LOWER(base_name), 
    '[^a-z0-9_-]', 
    '_', 
    'g'
  );
  
  -- Add timestamp to prevent conflicts
  timestamp_suffix := EXTRACT(EPOCH FROM NOW())::bigint::text;
  
  -- Construct path based on bucket type
  CASE bucket_name
    WHEN 'user-uploads' THEN
      RETURN user_id::text || '/' || sanitized_name || '_' || timestamp_suffix || 
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'farm-documentation' THEN
      RETURN folder_id::text || '/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'harvest-photos' THEN
      RETURN folder_id::text || '/harvests/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'device-manuals' THEN
      RETURN 'manuals/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    WHEN 'system-backups' THEN
      RETURN 'backups/' || TO_CHAR(NOW(), 'YYYY/MM/DD') || '/' || 
             sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
    ELSE
      RETURN folder_id::text || '/' || sanitized_name || '_' || timestamp_suffix ||
             CASE WHEN file_extension != '' THEN '.' || file_extension ELSE '' END;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  total_files bigint,
  total_size_mb numeric,
  quota_mb integer,
  usage_percentage numeric,
  files_by_bucket jsonb
)
SECURITY DEFINER
SET search_path = public, storage
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
        AND f.manager_id = user_uuid
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
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned storage files
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage_files()
RETURNS TABLE (
  bucket_id text,
  file_path text,
  reason text
)
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Only admin can run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can run storage cleanup';
  END IF;

  RETURN QUERY
  -- Find user upload files for deleted users
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'User profile deleted' as reason
  FROM storage.objects o
  WHERE o.bucket_id = 'user-uploads'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id::text = (storage.foldername(o.name))[1]
  )
  
  UNION ALL
  
  -- Find farm documentation for deleted farms
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'Farm deleted' as reason
  FROM storage.objects o
  WHERE o.bucket_id IN ('farm-documentation', 'harvest-photos')
  AND NOT EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id::text = (storage.foldername(o.name))[1]
  )
  
  UNION ALL
  
  -- Find harvest photos without corresponding harvest records
  SELECT 
    o.bucket_id,
    o.name as file_path,
    'Harvest record not found' as reason
  FROM storage.objects o
  WHERE o.bucket_id = 'harvest-photos'
  AND NOT EXISTS (
    SELECT 1 FROM public.harvests h
    WHERE o.name = ANY(h.photo_urls)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE TRIGGERS
-- =====================================================

-- Function to update storage references when files are uploaded
CREATE OR REPLACE FUNCTION public.handle_storage_upload()
RETURNS TRIGGER AS $$
DECLARE
  path_parts text[];
BEGIN
  -- Parse the storage path
  path_parts := storage.foldername(NEW.name);
  
  -- Handle different bucket types
  CASE NEW.bucket_id
    WHEN 'user-uploads' THEN
      -- Update user profile image if it's in the right location
      IF path_parts[2] = 'profile-image' THEN
        UPDATE public.user_profiles 
        SET profile_image_url = NEW.name
        WHERE id = path_parts[1]::uuid;
      END IF;
      
    WHEN 'farm-documentation' THEN
      -- Update farm documentation folder path
      UPDATE public.farms 
      SET documentation_folder_path = path_parts[1]
      WHERE id = path_parts[1]::uuid;
      
    ELSE
      -- Do nothing for other buckets
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage uploads
DROP TRIGGER IF EXISTS on_storage_upload ON storage.objects;
CREATE TRIGGER on_storage_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION public.handle_storage_upload();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on storage functions
GRANT EXECUTE ON FUNCTION public.generate_storage_path(text, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage_files() TO authenticated;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.generate_storage_path IS 'Generates secure, organized file paths for different storage buckets';
COMMENT ON FUNCTION public.get_user_storage_usage IS 'Returns comprehensive storage usage statistics for a user';
COMMENT ON FUNCTION public.cleanup_orphaned_storage_files IS 'Identifies orphaned storage files that can be safely deleted';

-- Note: Storage buckets are created for different types of files with appropriate access controls

-- Column documentation
COMMENT ON COLUMN public.user_profiles.profile_image_url IS 'URL to user profile image in storage';
COMMENT ON COLUMN public.user_profiles.storage_quota_mb IS 'User storage quota in megabytes';
COMMENT ON COLUMN public.farms.documentation_folder_path IS 'Path to farm documentation folder in storage';
COMMENT ON COLUMN public.farms.farm_image_url IS 'URL to farm overview image';
COMMENT ON COLUMN public.harvests.photo_urls IS 'Array of URLs to harvest photos';
COMMENT ON COLUMN public.harvests.documentation_urls IS 'Array of URLs to harvest documentation';
COMMENT ON COLUMN public.grow_recipes.instruction_document_url IS 'URL to detailed growing instructions document';
COMMENT ON COLUMN public.grow_recipes.reference_image_url IS 'URL to reference image for the recipe';
COMMENT ON COLUMN public.device_assignments.manual_url IS 'URL to device manual or documentation';
COMMENT ON COLUMN public.device_assignments.installation_photos IS 'Array of URLs to device installation photos'; 