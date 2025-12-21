-- =============================================================================
-- Vertical Farm Development Seed Data
-- =============================================================================
-- This file runs automatically with 'supabase db reset'
--
-- Two test users:
--   1. seeded@test.dev / password123 - Has representative data across all features
--   2. blank@test.dev / password123  - Profile only (for testing empty states)
--
-- All UUIDs are deterministic for debugging ease.
-- =============================================================================

-- Disable triggers to handle circular foreign key constraints
SET session_replication_role = 'replica';

-- =============================================================================
-- SECTION 1: AUTH USERS
-- =============================================================================

-- Seeded User: Has full data
INSERT INTO "auth"."users" (
    "instance_id", "id", "aud", "role", "email", "encrypted_password",
    "email_confirmed_at", "confirmation_token", "recovery_token",
    "email_change_token_new", "email_change", "phone_change",
    "phone_change_token", "email_change_token_current", "reauthentication_token",
    "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "is_sso_user"
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated',
    'seeded@test.dev',
    crypt('password123', gen_salt('bf', 12)),
    NOW(), '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Seeded User"}',
    NOW(), NOW(), false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "auth"."identities" (
    "id", "user_id", "provider_id", "provider", "identity_data",
    "last_sign_in_at", "created_at", "updated_at"
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'email',
    '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "email": "seeded@test.dev"}',
    NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Blank User: Profile only, no data
INSERT INTO "auth"."users" (
    "instance_id", "id", "aud", "role", "email", "encrypted_password",
    "email_confirmed_at", "confirmation_token", "recovery_token",
    "email_change_token_new", "email_change", "phone_change",
    "phone_change_token", "email_change_token_current", "reauthentication_token",
    "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "is_sso_user"
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated',
    'blank@test.dev',
    crypt('password123', gen_salt('bf', 12)),
    NOW(), '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Blank User"}',
    NOW(), NOW(), false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "auth"."identities" (
    "id", "user_id", "provider_id", "provider", "identity_data",
    "last_sign_in_at", "created_at", "updated_at"
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'email',
    '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "email": "blank@test.dev"}',
    NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 2: USER PROFILES
-- =============================================================================

-- Seeded user profile
INSERT INTO "public"."user_profiles" (
    "id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb"
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'operator',
    'Seeded User',
    NOW(), NOW(), NULL, 100
) ON CONFLICT (id) DO NOTHING;

-- Blank user profile (only data this user has)
INSERT INTO "public"."user_profiles" (
    "id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb"
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'operator',
    'Blank User',
    NOW(), NOW(), NULL, 100
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 3: REFERENCE DATA (Shared, not user-specific)
-- =============================================================================

-- Species (3 types: leafy green, herb, microgreen)
INSERT INTO "public"."species" ("id", "name", "description", "category", "scientific_name", "created_at", "updated_at") VALUES
    ('11111111-0001-0001-0001-000000000001', 'Butterhead Lettuce', 'Tender, buttery leaves ideal for salads', 'leafy_greens', 'Lactuca sativa var. capitata', NOW(), NOW()),
    ('11111111-0001-0001-0001-000000000002', 'Genovese Basil', 'Classic Italian basil with sweet, aromatic flavor', 'herbs', 'Ocimum basilicum', NOW(), NOW()),
    ('11111111-0001-0001-0001-000000000003', 'Sunflower Microgreens', 'Nutty, crunchy microgreens packed with nutrients', 'microgreens', 'Helianthus annuus', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grow Stages (universal stages for all crop types)
INSERT INTO "public"."grow_stages" (
    "id", "name", "stage_type", "order_index", "description", "typical_duration_days",
    "color_code", "created_at", "crop_type", "stage_name", "stage_order",
    "expected_duration_days", "milestone_description", "optimal_conditions"
) VALUES
    -- Leafy Greens stages
    ('22222222-0001-0001-0001-000000000001', 'Seed', 'seeding', 1, 'Seeds planted in growing medium', 2, '#22c55e', NOW(), 'leafy_greens', 'Seed', 1, 2, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 22, "min": 18}}'),
    ('22222222-0001-0001-0001-000000000002', 'Germination', 'germination', 2, 'First sprouts emerge', 3, '#16a34a', NOW(), 'leafy_greens', 'Germination', 2, 3, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 24, "min": 20}}'),
    ('22222222-0001-0001-0001-000000000003', 'Seedling', 'vegetative', 3, 'First true leaves develop', 7, '#15803d', NOW(), 'leafy_greens', 'Seedling', 3, 7, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 22, "min": 18}}'),
    ('22222222-0001-0001-0001-000000000004', 'Vegetative', 'vegetative', 4, 'Rapid leaf growth', 14, '#166534', NOW(), 'leafy_greens', 'Vegetative', 4, 14, 'Rapid leaf growth and development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 20, "min": 16}}'),
    ('22222222-0001-0001-0001-000000000005', 'Harvest', 'harvest', 5, 'Ready for harvest', 7, '#14532d', NOW(), 'leafy_greens', 'Harvest', 5, 7, 'Ready for harvest', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 18, "min": 14}}'),
    -- Microgreens stages (shorter cycle)
    ('22222222-0001-0001-0001-000000000006', 'Micro Seed', 'seeding', 1, 'Seeds planted densely', 1, '#a855f7', NOW(), 'microgreens', 'Seed', 1, 1, 'Seeds planted densely', '{"humidity": {"max": 95, "min": 80}, "temperature": {"max": 22, "min": 18}}'),
    ('22222222-0001-0001-0001-000000000007', 'Micro Growth', 'vegetative', 2, 'Cotyledon development', 5, '#7c3aed', NOW(), 'microgreens', 'Growth', 2, 5, 'Cotyledon development', '{"humidity": {"max": 85, "min": 70}, "light_hours": 12, "temperature": {"max": 22, "min": 18}}'),
    ('22222222-0001-0001-0001-000000000008', 'Micro Harvest', 'harvest', 3, 'Ready at 1-2 inches', 2, '#6d28d9', NOW(), 'microgreens', 'Harvest', 3, 2, 'Ready for harvest at 1-2 inches', '{"humidity": {"max": 75, "min": 60}, "temperature": {"max": 20, "min": 16}}')
ON CONFLICT (id) DO NOTHING;

-- Monitoring Thresholds (reference data for alerts)
-- Severity values: critical, high, medium, low
INSERT INTO "public"."monitoring_thresholds" (
    "id", "crop_type", "stage_id", "metric_type", "min_value", "max_value",
    "optimal_min", "optimal_max", "severity", "unit", "created_at"
) VALUES
    ('33333333-0001-0001-0001-000000000001', 'leafy_greens', NULL, 'temperature', 14, 28, 18, 22, 'medium', 'celsius', NOW()),
    ('33333333-0001-0001-0001-000000000002', 'leafy_greens', NULL, 'humidity', 50, 95, 65, 80, 'medium', 'percent', NOW()),
    ('33333333-0001-0001-0001-000000000003', 'microgreens', NULL, 'temperature', 16, 26, 18, 22, 'medium', 'celsius', NOW())
ON CONFLICT (id) DO NOTHING;

-- Grow Device Profiles (templates for device automation)
INSERT INTO "public"."grow_device_profiles" (
    "id", "profile_name", "crop_id", "grow_stage_id", "device_type",
    "profile_config", "description", "is_template", "created_by", "created_at", "updated_at"
) VALUES
    ('44444444-0001-0001-0001-000000000001', 'Leafy Greens - Light Schedule', NULL, NULL, 'light', '{"on_time": "06:00", "off_time": "22:00", "schedule": "daily", "intensity": 80}', 'Standard 16-hour light schedule for leafy greens', true, NULL, NOW(), NOW()),
    ('44444444-0001-0001-0001-000000000002', 'Standard Watering', NULL, NULL, 'pump', '{"schedule": "every_2_days", "flow_rate": "medium", "duration_seconds": 30}', 'General watering schedule', true, NULL, NOW(), NOW()),
    ('44444444-0001-0001-0001-000000000003', 'Climate Control', NULL, NULL, 'fan', '{"max_temp": 26, "min_temp": 18, "target_temp": 22}', 'Temperature-based fan control', true, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Crops (legacy reference data)
INSERT INTO "public"."crops" (
    "id", "name", "category", "description", "typical_grow_days",
    "optimal_temp_min", "optimal_temp_max", "optimal_humidity_min", "optimal_humidity_max",
    "created_at", "updated_at"
) VALUES
    ('55555555-0001-0001-0001-000000000001', 'Lettuce', 'leafy_greens', 'Various lettuce varieties', 28, 16, 22, 60, 80, NOW(), NOW()),
    ('55555555-0001-0001-0001-000000000002', 'Basil', 'herbs', 'Culinary herb', 42, 18, 25, 60, 75, NOW(), NOW()),
    ('55555555-0001-0001-0001-000000000003', 'Microgreens', 'microgreens', 'Quick-growing nutrient-dense greens', 10, 18, 22, 70, 85, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 4: SEEDED USER DATA - Farm Hierarchy
-- =============================================================================

-- Farm (1 farm for seeded user)
INSERT INTO "public"."farms" (
    "id", "name", "location", "user_id", "created_at", "updated_at",
    "documentation_folder_path", "farm_image_url"
) VALUES (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Demo Farm',
    'Building A',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NOW(), NOW(), NULL, NULL
) ON CONFLICT (id) DO NOTHING;

-- Rows (2 rows: 1 grow area, 1 germination)
INSERT INTO "public"."rows" ("id", "farm_id", "name", "orientation", "created_at", "updated_at") VALUES
    ('aaaaaaaa-0002-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 'Grow Row 1', 'north-south', NOW(), NOW()),
    ('aaaaaaaa-0002-0001-0001-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001', 'Germination Row', 'east-west', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Racks (2 racks: 1 per row)
INSERT INTO "public"."racks" ("id", "row_id", "name", "created_at", "updated_at") VALUES
    ('aaaaaaaa-0003-0001-0001-000000000001', 'aaaaaaaa-0002-0001-0001-000000000001', 'Rack A', NOW(), NOW()),
    ('aaaaaaaa-0003-0001-0001-000000000002', 'aaaaaaaa-0002-0001-0001-000000000002', 'Germ Rack 1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Shelves (4 shelves: 2 per rack)
INSERT INTO "public"."shelves" ("id", "rack_id", "name", "created_at", "updated_at") VALUES
    ('aaaaaaaa-0004-0001-0001-000000000001', 'aaaaaaaa-0003-0001-0001-000000000001', 'Shelf A-1', NOW(), NOW()),
    ('aaaaaaaa-0004-0001-0001-000000000002', 'aaaaaaaa-0003-0001-0001-000000000001', 'Shelf A-2', NOW(), NOW()),
    ('aaaaaaaa-0004-0001-0001-000000000003', 'aaaaaaaa-0003-0001-0001-000000000002', 'Germ Shelf 1', NOW(), NOW()),
    ('aaaaaaaa-0004-0001-0001-000000000004', 'aaaaaaaa-0003-0001-0001-000000000002', 'Germ Shelf 2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 5: SEEDED USER DATA - Agricultural Data
-- =============================================================================

-- Seed Varieties (1 per species)
INSERT INTO "public"."seed_varieties" ("id", "species_id", "variety_name", "created_at", "updated_at") VALUES
    ('aaaaaaaa-0005-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 'Boston Butterhead', NOW(), NOW()),
    ('aaaaaaaa-0005-0001-0001-000000000002', '11111111-0001-0001-0001-000000000002', 'Sweet Genovese', NOW(), NOW()),
    ('aaaaaaaa-0005-0001-0001-000000000003', '11111111-0001-0001-0001-000000000003', 'Black Oil Sunflower', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grow Recipes (1 per species)
INSERT INTO "public"."grow_recipes" (
    "id", "name", "species_id", "total_grow_days", "created_at", "updated_at",
    "is_active", "created_by"
) VALUES
    ('aaaaaaaa-0006-0001-0001-000000000001', 'Butterhead - Standard', '11111111-0001-0001-0001-000000000001', 28, NOW(), NOW(), true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('aaaaaaaa-0006-0001-0001-000000000002', 'Basil - Indoor', '11111111-0001-0001-0001-000000000002', 42, NOW(), NOW(), true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('aaaaaaaa-0006-0001-0001-000000000003', 'Sunflower Micros - Quick', '11111111-0001-0001-0001-000000000003', 10, NOW(), NOW(), true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

-- Grows (3 in different states: planned, active, harvested)
INSERT INTO "public"."grows" (
    "id", "name", "seed_variety_id", "recipe_id", "status",
    "planted_date", "expected_harvest_date", "actual_harvest_date",
    "notes", "created_by", "created_at", "updated_at"
) VALUES
    -- Planned grow (future)
    ('aaaaaaaa-0007-0001-0001-000000000001', 'Basil Batch - Planned', 'aaaaaaaa-0005-0001-0001-000000000002', 'aaaaaaaa-0006-0001-0001-000000000002', 'planned', (NOW() + INTERVAL '3 days')::date, (NOW() + INTERVAL '45 days')::date, NULL, 'Scheduled for next week planting', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
    -- Active grow (in progress)
    ('aaaaaaaa-0007-0001-0001-000000000002', 'Lettuce Batch 1', 'aaaaaaaa-0005-0001-0001-000000000001', 'aaaaaaaa-0006-0001-0001-000000000001', 'active', (NOW() - INTERVAL '14 days')::date, (NOW() + INTERVAL '14 days')::date, NULL, 'Growing well, in vegetative stage', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
    -- Harvested grow (completed)
    ('aaaaaaaa-0007-0001-0001-000000000003', 'Microgreens - Complete', 'aaaaaaaa-0005-0001-0001-000000000003', 'aaaaaaaa-0006-0001-0001-000000000003', 'harvested', (NOW() - INTERVAL '15 days')::date, (NOW() - INTERVAL '5 days')::date, (NOW() - INTERVAL '5 days')::date, 'Excellent yield, 250g harvested', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Harvest record for completed grow
INSERT INTO "public"."harvests" (
    "id", "grow_id", "shelf_id", "yield_amount", "yield_unit",
    "harvest_date", "quality_rating", "notes", "created_by", "created_at", "updated_at"
) VALUES (
    'aaaaaaaa-0008-0001-0001-000000000001',
    'aaaaaaaa-0007-0001-0001-000000000003',
    'aaaaaaaa-0004-0001-0001-000000000003',
    250, 'grams',
    (NOW() - INTERVAL '5 days')::date,
    8,
    'Great flavor, slightly smaller leaves than expected',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 6: SEEDED USER DATA - Device Assignments
-- =============================================================================

-- Device assignments (3 devices at different hierarchy levels)
INSERT INTO "public"."device_assignments" (
    "id", "shelf_id", "rack_id", "row_id", "farm_id",
    "entity_id", "entity_type", "friendly_name",
    "assigned_by", "user_id", "device_type", "capabilities", "is_active",
    "created_at", "updated_at"
) VALUES
    -- Light at shelf level
    ('aaaaaaaa-0009-0001-0001-000000000001', 'aaaaaaaa-0004-0001-0001-000000000001', NULL, NULL, NULL, 'light.shelf_a1_grow', 'light', 'Shelf A-1 Grow Light', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'light', '{"dimmable": true, "color_temp": true}', true, NOW(), NOW()),
    -- Pump at rack level
    ('aaaaaaaa-0009-0001-0001-000000000002', NULL, 'aaaaaaaa-0003-0001-0001-000000000001', NULL, NULL, 'switch.rack_a_pump', 'switch', 'Rack A Water Pump', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pump', '{"flow_control": true}', true, NOW(), NOW()),
    -- Sensor at shelf level
    ('aaaaaaaa-0009-0001-0001-000000000003', 'aaaaaaaa-0004-0001-0001-000000000002', NULL, NULL, NULL, 'sensor.shelf_a2_temp', 'sensor', 'Shelf A-2 Temperature', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sensor', '{"reading_type": "temperature"}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 7: STORAGE BUCKETS
-- =============================================================================

INSERT INTO "storage"."buckets" (
    "id", "name", "owner", "created_at", "updated_at",
    "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id"
) VALUES
    ('farm-documentation', 'farm-documentation', NULL, NOW(), NOW(), false, false, 52428800, '{"application/pdf","image/jpeg","image/png","image/webp"}', NULL),
    ('farm-images', 'farm-images', NULL, NOW(), NOW(), true, false, 10485760, '{"image/jpeg","image/png","image/webp"}', NULL),
    ('profile-images', 'profile-images', NULL, NOW(), NOW(), true, false, 5242880, '{"image/jpeg","image/png","image/webp"}', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Re-enable triggers
-- =============================================================================

SET session_replication_role = 'origin';

-- =============================================================================
-- END OF SEED DATA
-- =============================================================================
