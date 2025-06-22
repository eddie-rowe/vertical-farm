-- Enable UUID extension - this must be run before any tables that use uuid_generate_v4()
-- This migration ensures the uuid-ossp extension is properly enabled across all Supabase environments

-- Enable the uuid-ossp extension in the extensions schema (Supabase default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Make the uuid_generate_v4 function available in the public schema
-- This ensures the function can be called without schema qualification
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT extensions.uuid_generate_v4();
$$;

-- Grant execute permissions to all roles that need it
GRANT EXECUTE ON FUNCTION public.uuid_generate_v4() TO anon, authenticated, service_role;

-- Alternative: Also enable in public schema as fallback (for maximum compatibility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
