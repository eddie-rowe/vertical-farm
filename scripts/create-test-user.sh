#!/bin/bash

# Script to create test users for local development
# This is now redundant since seed.sql handles this automatically
# Kept for backwards compatibility / manual user creation

echo "Creating test users for local development..."
echo ""
echo "Note: Test users are now automatically created via supabase/seed.sql"
echo "      Run 'supabase db reset' instead of this script."
echo ""

# Add seeded user (has sample data)
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data,
  raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'seeded@test.dev',
  crypt('password123', gen_salt('bf', 12)),
  NOW(),
  NOW(),
  '{\"provider\": \"email\", \"providers\": [\"email\"]}',
  '{\"name\": \"Seeded User\"}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Add seeded user identity
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\", \"email\": \"seeded@test.dev\"}',
  'email',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Add blank user (profile only, for testing empty states)
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data,
  raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'blank@test.dev',
  crypt('password123', gen_salt('bf', 12)),
  NOW(),
  NOW(),
  '{\"provider\": \"email\", \"providers\": [\"email\"]}',
  '{\"name\": \"Blank User\"}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Add blank user identity
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '{\"sub\": \"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb\", \"email\": \"blank@test.dev\"}',
  'email',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

echo ""
echo "✅ Test users created:"
echo "   Seeded User: seeded@test.dev / password123 (has sample data)"
echo "   Blank User:  blank@test.dev / password123 (empty state)"
