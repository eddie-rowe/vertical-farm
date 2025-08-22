-- Fix UUID extension function availability on remote Supabase
-- This ensures uuid_generate_v4() function is available after extension creation

-- Create extension in public schema explicitly
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Alternative: Create the function explicitly if the extension method fails
-- This is a fallback in case the extension doesn't properly export the function
DO $$
BEGIN
    -- Test if uuid_generate_v4 exists, if not create it manually
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'uuid_generate_v4' 
        AND pg_function_is_visible(oid)
    ) THEN
        -- This should not normally be needed, but some Supabase instances require it
        CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
        RETURNS uuid
        AS '$libdir/uuid-ossp', 'uuid_generate_v4'
        LANGUAGE c VOLATILE STRICT;
    END IF;
END $$; 