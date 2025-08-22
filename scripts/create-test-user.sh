#!/bin/bash

# Script to create test user for local development
# This should be run after supabase db reset

echo "Creating test user for local development..."

# Add auth user
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, 
  raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES (
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'testuser123@gmail.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  '{\"provider\": \"email\", \"providers\": [\"email\"]}',
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Add identity
docker exec supabase_db_vertical-farm psql -U postgres -c "
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  '{\"sub\": \"b26addbe-38fc-4e23-aad5-7ea1bd11edba\", \"email\": \"testuser123@gmail.com\"}',
  'email',
  'testuser123@gmail.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
"

echo "✅ Test user created: testuser123@gmail.com / testpassword123"
