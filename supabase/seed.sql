-- Seed data generated from production
-- This file runs automatically with 'supabase db reset'

-- Disable triggers to handle circular foreign key constraints
SET session_replication_role = 'replica';

-- Import production data (excluding auth schema)
-- Importing production data...

-- Create test user for development
-- Note: This uses a test password hash for 'password123' - only for development/testing
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "confirmation_token", "recovery_token", "email_change_token_new", "email_change", "phone_change", "phone_change_token", "email_change_token_current", "reauthentication_token", "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "is_sso_user") VALUES
	('00000000-0000-0000-0000-000000000000', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'authenticated', 'authenticated', 'testuser123@gmail.com', crypt('password123', gen_salt('bf', 12)), '2025-06-22 15:29:35.403448+00', '', '', '', '', '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "provider", "identity_data", "last_sign_in_at", "created_at", "updated_at") VALUES 
	(gen_random_uuid(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'email', '{"sub": "b26addbe-38fc-4e23-aad5-7ea1bd11edba", "email": "testuser123@gmail.com"}', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00')
ON CONFLICT DO NOTHING;


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_profiles" ("id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb") VALUES
	('b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'operator', 'testuser123@gmail.com', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', NULL, 100)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: farms; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."farms" ("id", "name", "location", "user_id", "created_at", "updated_at", "documentation_folder_path", "farm_image_url") VALUES
	('2c2c29f5-7921-4545-8d11-47b5d01cad24', 'farm01', NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-22 15:47:50.54631+00', '2025-06-22 15:47:50.54631+00', NULL, NULL)
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rows; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rows" ("id", "farm_id", "name", "orientation", "created_at", "updated_at") VALUES
	('75c73041-f927-4e1f-80c5-5837ac8d8691', '2c2c29f5-7921-4545-8d11-47b5d01cad24', 'Row 2', NULL, '2025-06-22 20:58:05.217682+00', '2025-06-22 20:58:05.217682+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: racks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."racks" ("id", "row_id", "name", "created_at", "updated_at") VALUES
	('ea12bf0f-3a34-48b1-9965-46e27b704586', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 1', '2025-06-22 21:19:23.643471+00', '2025-06-22 21:19:23.643471+00'),
	('e20cbc83-2ea1-4596-aa98-0ec43e571c27', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 2', '2025-06-22 23:38:15.308987+00', '2025-06-22 23:38:15.308987+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: shelves; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shelves" ("id", "rack_id", "name", "created_at", "updated_at") VALUES
	('c3922ea5-a537-4821-b687-bb9906949c3b', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 1', '2025-06-22 21:19:28.317551+00', '2025-06-22 21:19:28.317551+00'),
	('edc0c39c-444f-4083-a707-8c1eb76a2d83', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 2', '2025-06-23 13:31:44.000056+00', '2025-06-23 13:31:44.000056+00'),
	('a66e124f-4581-43ea-9c85-bad986159bd8', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 3', '2025-06-23 13:31:50.486567+00', '2025-06-23 13:31:50.486567+00'),
	('f7e341a7-2681-4622-b38c-400e54a4fda5', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 4', '2025-06-23 13:31:56.560468+00', '2025-06-23 13:31:56.560468+00'),
	('1fe43f55-06db-4f14-855e-fdb46dfd3726', 'e20cbc83-2ea1-4596-aa98-0ec43e571c27', 'Shelf 1', '2025-06-28 21:52:01.88+00', '2025-06-28 21:52:01.88+00'),
	('091cbe1b-3ecb-4584-9ea4-790ffcbe9ed6', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 5', '2025-06-29 04:36:11.356699+00', '2025-06-29 04:36:11.356699+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: device_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_assignments" ("id", "shelf_id", "rack_id", "row_id", "farm_id", "entity_id", "entity_type", "friendly_name", "assigned_by", "created_at", "updated_at", "integration_id", "manual_url", "installation_photos", "user_id", "location_id", "home_assistant_entity_id", "device_type", "device_name", "capabilities", "is_active") VALUES
	('c52a9ee2-f6a7-4742-9801-00dd52c7e827', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack02_shelf05_fill', 'switch', 'rack02-shelf05-fill', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:27:21.778638+00', '2025-06-30 02:27:21.778638+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('955d4315-4aaa-4b6d-9931-6f696928d615', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_shelf04_drain', 'switch', 'rack06-shelf04-drain', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:03.593066+00', '2025-06-30 02:48:03.593066+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('4969b91f-4cb1-430d-a44b-88e207270226', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_switch1_unused', 'switch', 'rack06-switch1-unused', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:15.947198+00', '2025-06-30 02:48:15.947198+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: species; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."species" ("id", "name", "description", "created_at", "updated_at") VALUES
	('bedeebed-e27c-4c89-92ff-ff9fbfc4cf6f', 'basil', NULL, '2025-06-22 20:33:11.984325+00', '2025-06-22 20:33:11.984325+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: grow_recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: background_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_control_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_states; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_stages" ("id", "name", "stage_type", "order_index", "description", "typical_duration_days", "color_code", "created_at", "crop_type", "stage_name", "stage_order", "expected_duration_days", "milestone_description", "optimal_conditions") VALUES
	('561d5978-f2ed-4db5-8875-88b4a178adce', 'Planning', 'planning', 1, 'Planning and preparation phase', 1, '#6b7280', '2025-06-21 18:16:13.101729+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('7feddbba-febd-41ad-8de4-c2af9ee88e55', 'Seed', 'seeding', 1, 'Seeds planted in growing medium', 2, '#22c55e', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seed', 1, 2, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 22, "min": 18}}'),
	('6307f927-36a8-45d5-bd6a-a5710e6cd66f', 'Germination', 'germination', 2, 'First sprouts emerge from seeds', 3, '#16a34a', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Germination', 2, 3, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 24, "min": 20}}'),
	('f209880f-6caa-483c-9d3b-034b9f18392e', 'Seedling', 'vegetative', 3, 'First true leaves develop', 7, '#15803d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seedling', 3, 7, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 22, "min": 18}}'),
	('d32d2ed3-d98d-45d9-90fa-947a227501a9', 'Vegetative', 'vegetative', 4, 'Rapid leaf growth and development', 14, '#166534', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Vegetative', 4, 14, 'Rapid leaf growth and development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 20, "min": 16}}'),
	('29315408-ce78-4e4e-a852-03cb0f643f4d', 'Harvest', 'harvest', 5, 'Ready for harvest', 7, '#14532d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Harvest', 5, 7, 'Ready for harvest', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 18, "min": 14}}'),
	('cb6bf47d-5cc1-4bc2-8ccf-ce93fe46a0f7', 'Herb Seed', 'seeding', 1, 'Seeds planted in growing medium', 3, '#0ea5e9', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seed', 1, 3, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 25, "min": 20}}'),
	('2dce49d9-4865-458a-847f-6b1f2290032a', 'Herb Germination', 'germination', 2, 'First sprouts emerge from seeds', 5, '#0284c7', '2025-06-30 01:43:20.703714+00', 'herbs', 'Germination', 2, 5, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 26, "min": 22}}'),
	('86e1abeb-fc1c-4efe-ac71-59e5cb01132d', 'Herb Seedling', 'vegetative', 3, 'First true leaves develop', 10, '#0369a1', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seedling', 3, 10, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 24, "min": 20}}'),
	('17fc75ff-14eb-40ef-8891-a6c1ca516c73', 'Herb Vegetative', 'vegetative', 4, 'Bushy growth and leaf development', 21, '#075985', '2025-06-30 01:43:20.703714+00', 'herbs', 'Vegetative', 4, 21, 'Bushy growth and leaf development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 22, "min": 18}}'),
	('61e0350c-a678-431a-9916-aae3c33c0c00', 'Herb Harvest', 'harvest', 5, 'Continuous harvest period', 14, '#0c4a6e', '2025-06-30 01:43:20.703714+00', 'herbs', 'Harvest', 5, 14, 'Continuous harvest period', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 22, "min": 18}}'),
	('14bcb119-ea16-4cb0-8c0c-3ea68aabd55f', 'Micro Seed', 'seeding', 1, 'Seeds planted densely', 1, '#a855f7', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Seed', 1, 1, 'Seeds planted densely', '{"humidity": {"max": 95, "min": 80}, "temperature": {"max": 22, "min": 18}}'),
	('a1910ded-c4e1-42d9-a5f8-0f00426f50ab', 'Micro Germination', 'germination', 2, 'Initial sprouting phase', 2, '#9333ea', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Germination', 2, 2, 'Initial sprouting phase', '{"humidity": {"max": 95, "min": 85}, "temperature": {"max": 24, "min": 20}}'),
	('f70d0531-e1f0-41ea-99de-6d05ba5f8a7e', 'Micro Growth', 'vegetative', 3, 'Cotyledon development', 5, '#7c3aed', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Growth', 3, 5, 'Cotyledon development', '{"humidity": {"max": 85, "min": 70}, "light_hours": 12, "temperature": {"max": 22, "min": 18}}'),
	('7ed0b708-7242-43be-a247-382b79cfb5fb', 'Micro Harvest', 'harvest', 4, 'Ready for harvest at 1-2 inches', 2, '#6d28d9', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Harvest', 4, 2, 'Ready for harvest at 1-2 inches', '{"humidity": {"max": 75, "min": 60}, "temperature": {"max": 20, "min": 16}}')
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: grow_device_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_device_profiles" ("id", "profile_name", "crop_id", "grow_stage_id", "device_type", "profile_config", "description", "is_template", "created_by", "created_at", "updated_at") VALUES
	('898d592f-42a8-4a2e-bae5-b76b68c960b5', 'Leafy Greens - Light Schedule', NULL, NULL, 'light', '{"on_time": "06:00", "off_time": "22:00", "schedule": "daily", "intensity": 80}', 'Standard lighting schedule for leafy greens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('98abe92f-55c1-4324-8908-9ab6e4f7edea', 'Herbs - Watering Schedule', NULL, NULL, 'pump', '{"schedule": "every_2_days", "flow_rate": "medium", "duration_seconds": 30}', 'Watering schedule for herbs', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('afd9cdc3-c135-4223-a1d7-34949568e9ba', 'Microgreens - Fan Control', NULL, NULL, 'fan', '{"speed": "medium", "humidity_trigger": 70, "temperature_trigger": 24}', 'Air circulation for microgreens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('34de744d-704f-486e-9671-24956555a57f', 'General - Temperature Control', NULL, NULL, 'fan', '{"max_temp": 26, "min_temp": 18, "target_temp": 22}', 'General temperature control', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: seed_varieties; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grows; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_location_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_monitoring_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_observations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: harvests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: home_assistant_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."home_assistant_devices" ("id", "user_id", "entity_id", "name", "device_type", "state", "attributes", "farm_location", "is_assigned", "last_seen", "created_at", "updated_at") VALUES
	(3, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf04_drain', 'rack06-shelf04-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf04-drain"}', NULL, false, '2025-06-29 04:21:33.237016+00', '2025-06-29 04:21:33.36959+00', '2025-06-29 04:21:33.23702+00'),
	(4, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch101_unused', 'rack06-switch101-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch101-unused"}', NULL, false, '2025-06-29 04:21:49.476655+00', '2025-06-29 04:21:49.601632+00', '2025-06-29 04:21:49.476659+00'),
	(5, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf05_drain', 'rack06-shelf05-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf05-drain"}', NULL, false, '2025-06-29 04:32:04.840384+00', '2025-06-29 04:32:04.271813+00', '2025-06-29 04:32:04.971743+00'),
	(1, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch1_unused', 'rack06-switch1-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch1-unused"}', NULL, false, '2025-06-29 04:42:12.884226+00', '2025-06-29 04:07:02.574209+00', '2025-06-29 04:42:12.99791+00'),
	(8, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack02_shelf05_fill', 'rack02-shelf05-fill', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack02-shelf05-fill"}', NULL, false, '2025-06-29 04:50:19.444918+00', '2025-06-29 04:50:19.590593+00', '2025-06-29 04:50:19.444923+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: integration_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoring_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."monitoring_thresholds" ("id", "crop_type", "stage_id", "metric_type", "min_value", "max_value", "optimal_min", "optimal_max", "severity", "unit", "created_at") VALUES
	('62d32b89-ffab-4d95-8cc4-b13bc6b76aea', 'leafy_greens', NULL, 'temperature', 10.0000, 30.0000, 16.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('b7cfd078-b245-481a-97d1-f5e978fe919c', 'leafy_greens', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 80.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('fa72659e-fbf7-44b5-92f4-aea6fe726770', 'leafy_greens', NULL, 'light_intensity', 100.0000, 800.0000, 200.0000, 400.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('2783d340-8be9-4207-acab-06be0c6936a4', 'leafy_greens', NULL, 'ph', 5.0000, 7.5000, 5.5000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('a0c91d04-cd68-4cb8-bcbb-1de862340c3a', 'leafy_greens', NULL, 'ec', 0.5000, 3.0000, 1.2000, 2.0000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('92775b7c-2247-4b5a-b027-afc6e3a8f6d6', 'herbs', NULL, 'temperature', 12.0000, 32.0000, 18.0000, 24.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('fdeb5fde-d922-4913-8fbb-cff55b45dce5', 'herbs', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 75.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('58633bda-fc79-40f0-8a6f-34a7ebe6692c', 'herbs', NULL, 'light_intensity', 150.0000, 900.0000, 300.0000, 600.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('f9e0d202-867a-48d6-939a-e9fbe3666564', 'herbs', NULL, 'ph', 5.0000, 7.5000, 5.8000, 6.8000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('609f5660-1458-47e1-9b45-bc950b09975c', 'herbs', NULL, 'ec', 0.8000, 3.5000, 1.4000, 2.2000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('21ffbcb2-d2ed-4a80-9f26-1af720c6e207', 'microgreens', NULL, 'temperature', 15.0000, 28.0000, 18.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('ad00ad83-5c16-47d6-ad5b-8710f0f39660', 'microgreens', NULL, 'humidity', 60.0000, 98.0000, 70.0000, 90.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('9a2993dc-37c0-4dfa-9df4-12d9006c7382', 'microgreens', NULL, 'light_intensity', 50.0000, 400.0000, 100.0000, 250.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('9cc71168-1a9b-4426-bf6d-d97436e79b54', 'microgreens', NULL, 'ph', 5.5000, 7.0000, 5.8000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('ed7161d5-e78d-42b4-8bdb-42e3bcace903', 'microgreens', NULL, 'ec', 0.3000, 2.0000, 0.8000, 1.5000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: queue_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."queue_config" ("queue_name", "is_active", "max_concurrent_jobs", "retry_delay_seconds", "max_job_runtime_seconds", "priority_weight", "auto_cleanup_days", "notification_settings", "created_at", "updated_at") VALUES
	('farm_automation', true, 5, 300, 3600, 1.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('sensor_processing', true, 10, 60, 1800, 1.0, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('notifications', true, 8, 120, 600, 0.8, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('analytics', true, 3, 600, 7200, 0.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('maintenance', true, 2, 1800, 10800, 0.3, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('background_tasks', true, 15, 180, 3600, 1.2, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00')
ON CONFLICT (queue_name) DO NOTHING;


--
-- Data for Name: recipe_stage_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedule_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: scheduled_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alert_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_home_assistant_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_home_assistant_configs" ("id", "user_id", "name", "url", "access_token", "local_url", "cloudflare_enabled", "cloudflare_client_id", "cloudflare_client_secret", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at") VALUES
	('119bc866-f866-49f5-8163-56e88dababb8', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'Home Assistant Test 1', 'https://automate-api.goodgoodgreens.org', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4MTgxNDk4Yjg5Yjk0OWJlYjg1YmZmYjViYTY1ZmU1ZiIsImlhdCI6MTc0OTI1NjQ0OSwiZXhwIjoyMDY0NjE2NDQ5fQ.L1AKMYKM-aYd0AmB0u9cC6XNTOMyfZ2m-h2j_lvJPLI', NULL, true, '613004c5bce93e4969122c2994ee33cd.access', '9173c92fd1ae8f97735442b08c496fdfbfe6a5403257d03f796f24feee7db9d4', true, true, NULL, NULL, NULL, '2025-06-22 16:21:05.488902+00', '2025-06-22 16:21:05.488902+00')
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: user_device_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_square_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_square_configs" ("id", "user_id", "name", "application_id", "access_token", "environment", "webhook_signature_key", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at", "webhook_url") VALUES
	('09c39b93-6a34-460c-8ead-2b6b22fa3a9c', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'good good greens', 'sq0idp-DUNV2hrB6P5HT78AfjoHwA', 'EAAAl3Zui51Sip9_Mls3P4PfxUtEF2U0V-aEBztgb2rjC2OkSEVXQoa5N1KnJnhC', 'production', NULL, true, true, NULL, NULL, NULL, '2025-06-23 19:24:14.42874+00', '2025-06-23 19:24:14.42874+00', NULL)
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "public"."crops" ("id", "name", "category", "description", "typical_grow_days", "optimal_temp_min", "optimal_temp_max", "optimal_humidity_min", "optimal_humidity_max", "created_at", "updated_at") VALUES
	('6d038838-20c8-40aa-9649-8a8da23df871', 'Lettuce', 'leafy_greens', 'Quick-growing leafy green', 28, 60.0, 70.0, 60.0, 70.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('fb4e4841-3267-42a4-9739-f56997aa01bd', 'Basil', 'herbs', 'Aromatic herb with strong flavor', 35, 65.0, 75.0, 50.0, 60.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('8983f61f-5257-4548-a1ae-c8833041e407', 'Spinach', 'leafy_greens', 'Nutrient-dense leafy green', 25, 50.0, 65.0, 65.0, 75.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('8e2f15fe-c68e-4763-830e-668444253e58', 'Arugula', 'leafy_greens', 'Peppery salad green', 21, 55.0, 68.0, 60.0, 70.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('2a0b2f0b-70a4-4e33-b576-7098b4d51a13', 'Microgreens Mix', 'microgreens', 'Quick-growing micro vegetables', 10, 65.0, 75.0, 55.0, 65.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00')
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_profiles" ("id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb") VALUES
	('b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'operator', 'testuser123@gmail.com', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', NULL, 100)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: farms; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."farms" ("id", "name", "location", "user_id", "created_at", "updated_at", "documentation_folder_path", "farm_image_url") VALUES
	('2c2c29f5-7921-4545-8d11-47b5d01cad24', 'farm01', NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-22 15:47:50.54631+00', '2025-06-22 15:47:50.54631+00', NULL, NULL)
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rows; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rows" ("id", "farm_id", "name", "orientation", "created_at", "updated_at") VALUES
	('75c73041-f927-4e1f-80c5-5837ac8d8691', '2c2c29f5-7921-4545-8d11-47b5d01cad24', 'Row 2', NULL, '2025-06-22 20:58:05.217682+00', '2025-06-22 20:58:05.217682+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: racks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."racks" ("id", "row_id", "name", "created_at", "updated_at") VALUES
	('ea12bf0f-3a34-48b1-9965-46e27b704586', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 1', '2025-06-22 21:19:23.643471+00', '2025-06-22 21:19:23.643471+00'),
	('e20cbc83-2ea1-4596-aa98-0ec43e571c27', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 2', '2025-06-22 23:38:15.308987+00', '2025-06-22 23:38:15.308987+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: shelves; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shelves" ("id", "rack_id", "name", "created_at", "updated_at") VALUES
	('c3922ea5-a537-4821-b687-bb9906949c3b', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 1', '2025-06-22 21:19:28.317551+00', '2025-06-22 21:19:28.317551+00'),
	('edc0c39c-444f-4083-a707-8c1eb76a2d83', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 2', '2025-06-23 13:31:44.000056+00', '2025-06-23 13:31:44.000056+00'),
	('a66e124f-4581-43ea-9c85-bad986159bd8', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 3', '2025-06-23 13:31:50.486567+00', '2025-06-23 13:31:50.486567+00'),
	('f7e341a7-2681-4622-b38c-400e54a4fda5', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 4', '2025-06-23 13:31:56.560468+00', '2025-06-23 13:31:56.560468+00'),
	('1fe43f55-06db-4f14-855e-fdb46dfd3726', 'e20cbc83-2ea1-4596-aa98-0ec43e571c27', 'Shelf 1', '2025-06-28 21:52:01.88+00', '2025-06-28 21:52:01.88+00'),
	('091cbe1b-3ecb-4584-9ea4-790ffcbe9ed6', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 5', '2025-06-29 04:36:11.356699+00', '2025-06-29 04:36:11.356699+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: device_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_assignments" ("id", "shelf_id", "rack_id", "row_id", "farm_id", "entity_id", "entity_type", "friendly_name", "assigned_by", "created_at", "updated_at", "integration_id", "manual_url", "installation_photos", "user_id", "location_id", "home_assistant_entity_id", "device_type", "device_name", "capabilities", "is_active") VALUES
	('c52a9ee2-f6a7-4742-9801-00dd52c7e827', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack02_shelf05_fill', 'switch', 'rack02-shelf05-fill', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:27:21.778638+00', '2025-06-30 02:27:21.778638+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('955d4315-4aaa-4b6d-9931-6f696928d615', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_shelf04_drain', 'switch', 'rack06-shelf04-drain', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:03.593066+00', '2025-06-30 02:48:03.593066+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('4969b91f-4cb1-430d-a44b-88e207270226', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_switch1_unused', 'switch', 'rack06-switch1-unused', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:15.947198+00', '2025-06-30 02:48:15.947198+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: species; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."species" ("id", "name", "description", "created_at", "updated_at") VALUES
	('bedeebed-e27c-4c89-92ff-ff9fbfc4cf6f', 'basil', NULL, '2025-06-22 20:33:11.984325+00', '2025-06-22 20:33:11.984325+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: grow_recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: background_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_control_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_states; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_stages" ("id", "name", "stage_type", "order_index", "description", "typical_duration_days", "color_code", "created_at", "crop_type", "stage_name", "stage_order", "expected_duration_days", "milestone_description", "optimal_conditions") VALUES
	('561d5978-f2ed-4db5-8875-88b4a178adce', 'Planning', 'planning', 1, 'Planning and preparation phase', 1, '#6b7280', '2025-06-21 18:16:13.101729+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('7feddbba-febd-41ad-8de4-c2af9ee88e55', 'Seed', 'seeding', 1, 'Seeds planted in growing medium', 2, '#22c55e', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seed', 1, 2, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 22, "min": 18}}'),
	('6307f927-36a8-45d5-bd6a-a5710e6cd66f', 'Germination', 'germination', 2, 'First sprouts emerge from seeds', 3, '#16a34a', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Germination', 2, 3, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 24, "min": 20}}'),
	('f209880f-6caa-483c-9d3b-034b9f18392e', 'Seedling', 'vegetative', 3, 'First true leaves develop', 7, '#15803d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seedling', 3, 7, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 22, "min": 18}}'),
	('d32d2ed3-d98d-45d9-90fa-947a227501a9', 'Vegetative', 'vegetative', 4, 'Rapid leaf growth and development', 14, '#166534', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Vegetative', 4, 14, 'Rapid leaf growth and development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 20, "min": 16}}'),
	('29315408-ce78-4e4e-a852-03cb0f643f4d', 'Harvest', 'harvest', 5, 'Ready for harvest', 7, '#14532d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Harvest', 5, 7, 'Ready for harvest', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 18, "min": 14}}'),
	('cb6bf47d-5cc1-4bc2-8ccf-ce93fe46a0f7', 'Herb Seed', 'seeding', 1, 'Seeds planted in growing medium', 3, '#0ea5e9', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seed', 1, 3, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 25, "min": 20}}'),
	('2dce49d9-4865-458a-847f-6b1f2290032a', 'Herb Germination', 'germination', 2, 'First sprouts emerge from seeds', 5, '#0284c7', '2025-06-30 01:43:20.703714+00', 'herbs', 'Germination', 2, 5, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 26, "min": 22}}'),
	('86e1abeb-fc1c-4efe-ac71-59e5cb01132d', 'Herb Seedling', 'vegetative', 3, 'First true leaves develop', 10, '#0369a1', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seedling', 3, 10, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 24, "min": 20}}'),
	('17fc75ff-14eb-40ef-8891-a6c1ca516c73', 'Herb Vegetative', 'vegetative', 4, 'Bushy growth and leaf development', 21, '#075985', '2025-06-30 01:43:20.703714+00', 'herbs', 'Vegetative', 4, 21, 'Bushy growth and leaf development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 22, "min": 18}}'),
	('61e0350c-a678-431a-9916-aae3c33c0c00', 'Herb Harvest', 'harvest', 5, 'Continuous harvest period', 14, '#0c4a6e', '2025-06-30 01:43:20.703714+00', 'herbs', 'Harvest', 5, 14, 'Continuous harvest period', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 22, "min": 18}}'),
	('14bcb119-ea16-4cb0-8c0c-3ea68aabd55f', 'Micro Seed', 'seeding', 1, 'Seeds planted densely', 1, '#a855f7', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Seed', 1, 1, 'Seeds planted densely', '{"humidity": {"max": 95, "min": 80}, "temperature": {"max": 22, "min": 18}}'),
	('a1910ded-c4e1-42d9-a5f8-0f00426f50ab', 'Micro Germination', 'germination', 2, 'Initial sprouting phase', 2, '#9333ea', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Germination', 2, 2, 'Initial sprouting phase', '{"humidity": {"max": 95, "min": 85}, "temperature": {"max": 24, "min": 20}}'),
	('f70d0531-e1f0-41ea-99de-6d05ba5f8a7e', 'Micro Growth', 'vegetative', 3, 'Cotyledon development', 5, '#7c3aed', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Growth', 3, 5, 'Cotyledon development', '{"humidity": {"max": 85, "min": 70}, "light_hours": 12, "temperature": {"max": 22, "min": 18}}'),
	('7ed0b708-7242-43be-a247-382b79cfb5fb', 'Micro Harvest', 'harvest', 4, 'Ready for harvest at 1-2 inches', 2, '#6d28d9', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Harvest', 4, 2, 'Ready for harvest at 1-2 inches', '{"humidity": {"max": 75, "min": 60}, "temperature": {"max": 20, "min": 16}}')
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: grow_device_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_device_profiles" ("id", "profile_name", "crop_id", "grow_stage_id", "device_type", "profile_config", "description", "is_template", "created_by", "created_at", "updated_at") VALUES
	('898d592f-42a8-4a2e-bae5-b76b68c960b5', 'Leafy Greens - Light Schedule', NULL, NULL, 'light', '{"on_time": "06:00", "off_time": "22:00", "schedule": "daily", "intensity": 80}', 'Standard lighting schedule for leafy greens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('98abe92f-55c1-4324-8908-9ab6e4f7edea', 'Herbs - Watering Schedule', NULL, NULL, 'pump', '{"schedule": "every_2_days", "flow_rate": "medium", "duration_seconds": 30}', 'Watering schedule for herbs', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('afd9cdc3-c135-4223-a1d7-34949568e9ba', 'Microgreens - Fan Control', NULL, NULL, 'fan', '{"speed": "medium", "humidity_trigger": 70, "temperature_trigger": 24}', 'Air circulation for microgreens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('34de744d-704f-486e-9671-24956555a57f', 'General - Temperature Control', NULL, NULL, 'fan', '{"max_temp": 26, "min_temp": 18, "target_temp": 22}', 'General temperature control', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: seed_varieties; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grows; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_location_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_monitoring_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_observations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: harvests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: home_assistant_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."home_assistant_devices" ("id", "user_id", "entity_id", "name", "device_type", "state", "attributes", "farm_location", "is_assigned", "last_seen", "created_at", "updated_at") VALUES
	(3, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf04_drain', 'rack06-shelf04-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf04-drain"}', NULL, false, '2025-06-29 04:21:33.237016+00', '2025-06-29 04:21:33.36959+00', '2025-06-29 04:21:33.23702+00'),
	(4, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch101_unused', 'rack06-switch101-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch101-unused"}', NULL, false, '2025-06-29 04:21:49.476655+00', '2025-06-29 04:21:49.601632+00', '2025-06-29 04:21:49.476659+00'),
	(5, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf05_drain', 'rack06-shelf05-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf05-drain"}', NULL, false, '2025-06-29 04:32:04.840384+00', '2025-06-29 04:32:04.271813+00', '2025-06-29 04:32:04.971743+00'),
	(1, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch1_unused', 'rack06-switch1-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch1-unused"}', NULL, false, '2025-06-29 04:42:12.884226+00', '2025-06-29 04:07:02.574209+00', '2025-06-29 04:42:12.99791+00'),
	(8, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack02_shelf05_fill', 'rack02-shelf05-fill', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack02-shelf05-fill"}', NULL, false, '2025-06-29 04:50:19.444918+00', '2025-06-29 04:50:19.590593+00', '2025-06-29 04:50:19.444923+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: integration_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoring_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."monitoring_thresholds" ("id", "crop_type", "stage_id", "metric_type", "min_value", "max_value", "optimal_min", "optimal_max", "severity", "unit", "created_at") VALUES
	('62d32b89-ffab-4d95-8cc4-b13bc6b76aea', 'leafy_greens', NULL, 'temperature', 10.0000, 30.0000, 16.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('b7cfd078-b245-481a-97d1-f5e978fe919c', 'leafy_greens', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 80.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('fa72659e-fbf7-44b5-92f4-aea6fe726770', 'leafy_greens', NULL, 'light_intensity', 100.0000, 800.0000, 200.0000, 400.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('2783d340-8be9-4207-acab-06be0c6936a4', 'leafy_greens', NULL, 'ph', 5.0000, 7.5000, 5.5000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('a0c91d04-cd68-4cb8-bcbb-1de862340c3a', 'leafy_greens', NULL, 'ec', 0.5000, 3.0000, 1.2000, 2.0000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('92775b7c-2247-4b5a-b027-afc6e3a8f6d6', 'herbs', NULL, 'temperature', 12.0000, 32.0000, 18.0000, 24.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('fdeb5fde-d922-4913-8fbb-cff55b45dce5', 'herbs', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 75.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('58633bda-fc79-40f0-8a6f-34a7ebe6692c', 'herbs', NULL, 'light_intensity', 150.0000, 900.0000, 300.0000, 600.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('f9e0d202-867a-48d6-939a-e9fbe3666564', 'herbs', NULL, 'ph', 5.0000, 7.5000, 5.8000, 6.8000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('609f5660-1458-47e1-9b45-bc950b09975c', 'herbs', NULL, 'ec', 0.8000, 3.5000, 1.4000, 2.2000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('21ffbcb2-d2ed-4a80-9f26-1af720c6e207', 'microgreens', NULL, 'temperature', 15.0000, 28.0000, 18.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('ad00ad83-5c16-47d6-ad5b-8710f0f39660', 'microgreens', NULL, 'humidity', 60.0000, 98.0000, 70.0000, 90.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('9a2993dc-37c0-4dfa-9df4-12d9006c7382', 'microgreens', NULL, 'light_intensity', 50.0000, 400.0000, 100.0000, 250.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('9cc71168-1a9b-4426-bf6d-d97436e79b54', 'microgreens', NULL, 'ph', 5.5000, 7.0000, 5.8000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('ed7161d5-e78d-42b4-8bdb-42e3bcace903', 'microgreens', NULL, 'ec', 0.3000, 2.0000, 0.8000, 1.5000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: queue_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."queue_config" ("queue_name", "is_active", "max_concurrent_jobs", "retry_delay_seconds", "max_job_runtime_seconds", "priority_weight", "auto_cleanup_days", "notification_settings", "created_at", "updated_at") VALUES
	('farm_automation', true, 5, 300, 3600, 1.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('sensor_processing', true, 10, 60, 1800, 1.0, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('notifications', true, 8, 120, 600, 0.8, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('analytics', true, 3, 600, 7200, 0.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('maintenance', true, 2, 1800, 10800, 0.3, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('background_tasks', true, 15, 180, 3600, 1.2, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00')
ON CONFLICT (queue_name) DO NOTHING;


--
-- Data for Name: recipe_stage_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedule_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: scheduled_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alert_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_home_assistant_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_home_assistant_configs" ("id", "user_id", "name", "url", "access_token", "local_url", "cloudflare_enabled", "cloudflare_client_id", "cloudflare_client_secret", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at") VALUES
	('119bc866-f866-49f5-8163-56e88dababb8', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'Home Assistant Test 1', 'https://automate-api.goodgoodgreens.org', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4MTgxNDk4Yjg5Yjk0OWJlYjg1YmZmYjViYTY1ZmU1ZiIsImlhdCI6MTc0OTI1NjQ0OSwiZXhwIjoyMDY0NjE2NDQ5fQ.L1AKMYKM-aYd0AmB0u9cC6XNTOMyfZ2m-h2j_lvJPLI', NULL, true, '613004c5bce93e4969122c2994ee33cd.access', '9173c92fd1ae8f97735442b08c496fdfbfe6a5403257d03f796f24feee7db9d4', true, true, NULL, NULL, NULL, '2025-06-22 16:21:05.488902+00', '2025-06-22 16:21:05.488902+00')
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: user_device_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_square_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_square_configs" ("id", "user_id", "name", "application_id", "access_token", "environment", "webhook_signature_key", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at", "webhook_url") VALUES
	('09c39b93-6a34-460c-8ead-2b6b22fa3a9c', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'good good greens', 'sq0idp-DUNV2hrB6P5HT78AfjoHwA', 'EAAAl3Zui51Sip9_Mls3P4PfxUtEF2U0V-aEBztgb2rjC2OkSEVXQoa5N1KnJnhC', 'production', NULL, true, true, NULL, NULL, NULL, '2025-06-23 19:24:14.42874+00', '2025-06-23 19:24:14.42874+00', NULL)
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('user-uploads', 'user-uploads', NULL, '2025-06-21 17:57:20.294275+00', '2025-06-21 17:57:20.294275+00', false, false, NULL, NULL, NULL),
	('farm-documentation', 'farm-documentation', NULL, '2025-06-21 17:57:20.294275+00', '2025-06-21 17:57:20.294275+00', false, false, NULL, NULL, NULL),
	('harvest-photos', 'harvest-photos', NULL, '2025-06-21 17:57:20.294275+00', '2025-06-21 17:57:20.294275+00', false, false, NULL, NULL, NULL),
	('device-manuals', 'device-manuals', NULL, '2025-06-21 17:57:20.294275+00', '2025-06-21 17:57:20.294275+00', true, false, NULL, NULL, NULL),
	('system-backups', 'system-backups', NULL, '2025-06-21 17:57:20.294275+00', '2025-06-21 17:57:20.294275+00', false, false, NULL, NULL, NULL),
	('avatars', 'avatars', NULL, '2025-06-20 16:09:18.265579+00', '2025-06-20 16:09:18.265579+00', true, false, NULL, NULL, NULL),
	('farm-images', 'farm-images', NULL, '2025-06-20 16:09:18.265579+00', '2025-06-20 16:09:18.265579+00', true, false, NULL, NULL, NULL),
	('device-images', 'device-images', NULL, '2025-06-20 16:09:18.265579+00', '2025-06-20 16:09:18.265579+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 505, true);


--
-- Name: q_analytics_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_background_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_critical_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_failed_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_farm_automation_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_high_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_low_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_maintenance_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_normal_tasks_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_notifications_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: q_sensor_processing_msg_id_seq; Type: SEQUENCE SET; Schema: pgmq; Owner: postgres
--



--
-- Name: device_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."device_history_id_seq"', 1, false);


--
-- Name: device_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."device_schedules_id_seq"', 1, false);


--
-- Name: home_assistant_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."home_assistant_devices_id_seq"', 8, true);


--
-- Name: integration_sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."integration_sync_log_id_seq"', 1, false);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sensor_readings_id_seq"', 1, false);


--
-- Name: task_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."task_logs_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
INSERT INTO "public"."crops" ("id", "name", "category", "description", "typical_grow_days", "optimal_temp_min", "optimal_temp_max", "optimal_humidity_min", "optimal_humidity_max", "created_at", "updated_at") VALUES
	('6d038838-20c8-40aa-9649-8a8da23df871', 'Lettuce', 'leafy_greens', 'Quick-growing leafy green', 28, 60.0, 70.0, 60.0, 70.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('fb4e4841-3267-42a4-9739-f56997aa01bd', 'Basil', 'herbs', 'Aromatic herb with strong flavor', 35, 65.0, 75.0, 50.0, 60.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('8983f61f-5257-4548-a1ae-c8833041e407', 'Spinach', 'leafy_greens', 'Nutrient-dense leafy green', 25, 50.0, 65.0, 65.0, 75.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('8e2f15fe-c68e-4763-830e-668444253e58', 'Arugula', 'leafy_greens', 'Peppery salad green', 21, 55.0, 68.0, 60.0, 70.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00'),
	('2a0b2f0b-70a4-4e33-b576-7098b4d51a13', 'Microgreens Mix', 'microgreens', 'Quick-growing micro vegetables', 10, 65.0, 75.0, 55.0, 65.0, '2025-06-21 18:42:03.576251+00', '2025-06-21 18:42:03.576251+00')
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_profiles" ("id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb") VALUES
	('b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'operator', 'testuser123@gmail.com', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', NULL, 100)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: farms; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."farms" ("id", "name", "location", "user_id", "created_at", "updated_at", "documentation_folder_path", "farm_image_url") VALUES
	('2c2c29f5-7921-4545-8d11-47b5d01cad24', 'farm01', NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-22 15:47:50.54631+00', '2025-06-22 15:47:50.54631+00', NULL, NULL)
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rows; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rows" ("id", "farm_id", "name", "orientation", "created_at", "updated_at") VALUES
	('75c73041-f927-4e1f-80c5-5837ac8d8691', '2c2c29f5-7921-4545-8d11-47b5d01cad24', 'Row 2', NULL, '2025-06-22 20:58:05.217682+00', '2025-06-22 20:58:05.217682+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: racks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."racks" ("id", "row_id", "name", "created_at", "updated_at") VALUES
	('ea12bf0f-3a34-48b1-9965-46e27b704586', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 1', '2025-06-22 21:19:23.643471+00', '2025-06-22 21:19:23.643471+00'),
	('e20cbc83-2ea1-4596-aa98-0ec43e571c27', '75c73041-f927-4e1f-80c5-5837ac8d8691', 'Rack 2', '2025-06-22 23:38:15.308987+00', '2025-06-22 23:38:15.308987+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: shelves; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shelves" ("id", "rack_id", "name", "created_at", "updated_at") VALUES
	('c3922ea5-a537-4821-b687-bb9906949c3b', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 1', '2025-06-22 21:19:28.317551+00', '2025-06-22 21:19:28.317551+00'),
	('edc0c39c-444f-4083-a707-8c1eb76a2d83', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 2', '2025-06-23 13:31:44.000056+00', '2025-06-23 13:31:44.000056+00'),
	('a66e124f-4581-43ea-9c85-bad986159bd8', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 3', '2025-06-23 13:31:50.486567+00', '2025-06-23 13:31:50.486567+00'),
	('f7e341a7-2681-4622-b38c-400e54a4fda5', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 4', '2025-06-23 13:31:56.560468+00', '2025-06-23 13:31:56.560468+00'),
	('1fe43f55-06db-4f14-855e-fdb46dfd3726', 'e20cbc83-2ea1-4596-aa98-0ec43e571c27', 'Shelf 1', '2025-06-28 21:52:01.88+00', '2025-06-28 21:52:01.88+00'),
	('091cbe1b-3ecb-4584-9ea4-790ffcbe9ed6', 'ea12bf0f-3a34-48b1-9965-46e27b704586', 'Shelf 5', '2025-06-29 04:36:11.356699+00', '2025-06-29 04:36:11.356699+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: device_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_assignments" ("id", "shelf_id", "rack_id", "row_id", "farm_id", "entity_id", "entity_type", "friendly_name", "assigned_by", "created_at", "updated_at", "integration_id", "manual_url", "installation_photos", "user_id", "location_id", "home_assistant_entity_id", "device_type", "device_name", "capabilities", "is_active") VALUES
	('c52a9ee2-f6a7-4742-9801-00dd52c7e827', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack02_shelf05_fill', 'switch', 'rack02-shelf05-fill', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:27:21.778638+00', '2025-06-30 02:27:21.778638+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('955d4315-4aaa-4b6d-9931-6f696928d615', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_shelf04_drain', 'switch', 'rack06-shelf04-drain', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:03.593066+00', '2025-06-30 02:48:03.593066+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true),
	('4969b91f-4cb1-430d-a44b-88e207270226', '1fe43f55-06db-4f14-855e-fdb46dfd3726', NULL, NULL, NULL, 'switch.rack06_switch1_unused', 'switch', 'rack06-switch1-unused', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', '2025-06-30 02:48:15.947198+00', '2025-06-30 02:48:15.947198+00', NULL, NULL, NULL, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NULL, NULL, NULL, NULL, '{}', true)
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: species; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."species" ("id", "name", "description", "created_at", "updated_at") VALUES
	('bedeebed-e27c-4c89-92ff-ff9fbfc4cf6f', 'basil', NULL, '2025-06-22 20:33:11.984325+00', '2025-06-22 20:33:11.984325+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: grow_recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: background_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_control_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: device_states; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_stages" ("id", "name", "stage_type", "order_index", "description", "typical_duration_days", "color_code", "created_at", "crop_type", "stage_name", "stage_order", "expected_duration_days", "milestone_description", "optimal_conditions") VALUES
	('561d5978-f2ed-4db5-8875-88b4a178adce', 'Planning', 'planning', 1, 'Planning and preparation phase', 1, '#6b7280', '2025-06-21 18:16:13.101729+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('7feddbba-febd-41ad-8de4-c2af9ee88e55', 'Seed', 'seeding', 1, 'Seeds planted in growing medium', 2, '#22c55e', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seed', 1, 2, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 22, "min": 18}}'),
	('6307f927-36a8-45d5-bd6a-a5710e6cd66f', 'Germination', 'germination', 2, 'First sprouts emerge from seeds', 3, '#16a34a', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Germination', 2, 3, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 24, "min": 20}}'),
	('f209880f-6caa-483c-9d3b-034b9f18392e', 'Seedling', 'vegetative', 3, 'First true leaves develop', 7, '#15803d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Seedling', 3, 7, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 22, "min": 18}}'),
	('d32d2ed3-d98d-45d9-90fa-947a227501a9', 'Vegetative', 'vegetative', 4, 'Rapid leaf growth and development', 14, '#166534', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Vegetative', 4, 14, 'Rapid leaf growth and development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 20, "min": 16}}'),
	('29315408-ce78-4e4e-a852-03cb0f643f4d', 'Harvest', 'harvest', 5, 'Ready for harvest', 7, '#14532d', '2025-06-30 01:43:20.703714+00', 'leafy_greens', 'Harvest', 5, 7, 'Ready for harvest', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 18, "min": 14}}'),
	('cb6bf47d-5cc1-4bc2-8ccf-ce93fe46a0f7', 'Herb Seed', 'seeding', 1, 'Seeds planted in growing medium', 3, '#0ea5e9', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seed', 1, 3, 'Seeds planted in growing medium', '{"humidity": {"max": 85, "min": 70}, "temperature": {"max": 25, "min": 20}}'),
	('2dce49d9-4865-458a-847f-6b1f2290032a', 'Herb Germination', 'germination', 2, 'First sprouts emerge from seeds', 5, '#0284c7', '2025-06-30 01:43:20.703714+00', 'herbs', 'Germination', 2, 5, 'First sprouts emerge from seeds', '{"humidity": {"max": 90, "min": 75}, "temperature": {"max": 26, "min": 22}}'),
	('86e1abeb-fc1c-4efe-ac71-59e5cb01132d', 'Herb Seedling', 'vegetative', 3, 'First true leaves develop', 10, '#0369a1', '2025-06-30 01:43:20.703714+00', 'herbs', 'Seedling', 3, 10, 'First true leaves develop', '{"humidity": {"max": 80, "min": 65}, "light_hours": 14, "temperature": {"max": 24, "min": 20}}'),
	('17fc75ff-14eb-40ef-8891-a6c1ca516c73', 'Herb Vegetative', 'vegetative', 4, 'Bushy growth and leaf development', 21, '#075985', '2025-06-30 01:43:20.703714+00', 'herbs', 'Vegetative', 4, 21, 'Bushy growth and leaf development', '{"humidity": {"max": 75, "min": 60}, "light_hours": 16, "temperature": {"max": 22, "min": 18}}'),
	('61e0350c-a678-431a-9916-aae3c33c0c00', 'Herb Harvest', 'harvest', 5, 'Continuous harvest period', 14, '#0c4a6e', '2025-06-30 01:43:20.703714+00', 'herbs', 'Harvest', 5, 14, 'Continuous harvest period', '{"humidity": {"max": 70, "min": 55}, "temperature": {"max": 22, "min": 18}}'),
	('14bcb119-ea16-4cb0-8c0c-3ea68aabd55f', 'Micro Seed', 'seeding', 1, 'Seeds planted densely', 1, '#a855f7', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Seed', 1, 1, 'Seeds planted densely', '{"humidity": {"max": 95, "min": 80}, "temperature": {"max": 22, "min": 18}}'),
	('a1910ded-c4e1-42d9-a5f8-0f00426f50ab', 'Micro Germination', 'germination', 2, 'Initial sprouting phase', 2, '#9333ea', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Germination', 2, 2, 'Initial sprouting phase', '{"humidity": {"max": 95, "min": 85}, "temperature": {"max": 24, "min": 20}}'),
	('f70d0531-e1f0-41ea-99de-6d05ba5f8a7e', 'Micro Growth', 'vegetative', 3, 'Cotyledon development', 5, '#7c3aed', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Growth', 3, 5, 'Cotyledon development', '{"humidity": {"max": 85, "min": 70}, "light_hours": 12, "temperature": {"max": 22, "min": 18}}'),
	('7ed0b708-7242-43be-a247-382b79cfb5fb', 'Micro Harvest', 'harvest', 4, 'Ready for harvest at 1-2 inches', 2, '#6d28d9', '2025-06-30 01:43:20.703714+00', 'microgreens', 'Harvest', 4, 2, 'Ready for harvest at 1-2 inches', '{"humidity": {"max": 75, "min": 60}, "temperature": {"max": 20, "min": 16}}')
ON CONFLICT (name) DO NOTHING;


--
-- Data for Name: grow_device_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grow_device_profiles" ("id", "profile_name", "crop_id", "grow_stage_id", "device_type", "profile_config", "description", "is_template", "created_by", "created_at", "updated_at") VALUES
	('898d592f-42a8-4a2e-bae5-b76b68c960b5', 'Leafy Greens - Light Schedule', NULL, NULL, 'light', '{"on_time": "06:00", "off_time": "22:00", "schedule": "daily", "intensity": 80}', 'Standard lighting schedule for leafy greens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('98abe92f-55c1-4324-8908-9ab6e4f7edea', 'Herbs - Watering Schedule', NULL, NULL, 'pump', '{"schedule": "every_2_days", "flow_rate": "medium", "duration_seconds": 30}', 'Watering schedule for herbs', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('afd9cdc3-c135-4223-a1d7-34949568e9ba', 'Microgreens - Fan Control', NULL, NULL, 'fan', '{"speed": "medium", "humidity_trigger": 70, "temperature_trigger": 24}', 'Air circulation for microgreens', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00'),
	('34de744d-704f-486e-9671-24956555a57f', 'General - Temperature Control', NULL, NULL, 'fan', '{"max_temp": 26, "min_temp": 18, "target_temp": 22}', 'General temperature control', true, NULL, '2025-06-29 22:47:53.819712+00', '2025-06-29 22:47:53.819712+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: seed_varieties; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grows; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_automation_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_location_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_monitoring_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_observations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: grow_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: harvests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: home_assistant_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."home_assistant_devices" ("id", "user_id", "entity_id", "name", "device_type", "state", "attributes", "farm_location", "is_assigned", "last_seen", "created_at", "updated_at") VALUES
	(3, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf04_drain', 'rack06-shelf04-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf04-drain"}', NULL, false, '2025-06-29 04:21:33.237016+00', '2025-06-29 04:21:33.36959+00', '2025-06-29 04:21:33.23702+00'),
	(4, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch101_unused', 'rack06-switch101-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch101-unused"}', NULL, false, '2025-06-29 04:21:49.476655+00', '2025-06-29 04:21:49.601632+00', '2025-06-29 04:21:49.476659+00'),
	(5, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_shelf05_drain', 'rack06-shelf05-drain', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-shelf05-drain"}', NULL, false, '2025-06-29 04:32:04.840384+00', '2025-06-29 04:32:04.271813+00', '2025-06-29 04:32:04.971743+00'),
	(1, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack06_switch1_unused', 'rack06-switch1-unused', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack06-switch1-unused"}', NULL, false, '2025-06-29 04:42:12.884226+00', '2025-06-29 04:07:02.574209+00', '2025-06-29 04:42:12.99791+00'),
	(8, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'switch.rack02_shelf05_fill', 'rack02-shelf05-fill', 'switch', 'off', '{"raw_state": false, "friendly_name": "rack02-shelf05-fill"}', NULL, false, '2025-06-29 04:50:19.444918+00', '2025-06-29 04:50:19.590593+00', '2025-06-29 04:50:19.444923+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: integration_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoring_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."monitoring_thresholds" ("id", "crop_type", "stage_id", "metric_type", "min_value", "max_value", "optimal_min", "optimal_max", "severity", "unit", "created_at") VALUES
	('62d32b89-ffab-4d95-8cc4-b13bc6b76aea', 'leafy_greens', NULL, 'temperature', 10.0000, 30.0000, 16.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('b7cfd078-b245-481a-97d1-f5e978fe919c', 'leafy_greens', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 80.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('fa72659e-fbf7-44b5-92f4-aea6fe726770', 'leafy_greens', NULL, 'light_intensity', 100.0000, 800.0000, 200.0000, 400.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('2783d340-8be9-4207-acab-06be0c6936a4', 'leafy_greens', NULL, 'ph', 5.0000, 7.5000, 5.5000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('a0c91d04-cd68-4cb8-bcbb-1de862340c3a', 'leafy_greens', NULL, 'ec', 0.5000, 3.0000, 1.2000, 2.0000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('92775b7c-2247-4b5a-b027-afc6e3a8f6d6', 'herbs', NULL, 'temperature', 12.0000, 32.0000, 18.0000, 24.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('fdeb5fde-d922-4913-8fbb-cff55b45dce5', 'herbs', NULL, 'humidity', 40.0000, 95.0000, 60.0000, 75.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('58633bda-fc79-40f0-8a6f-34a7ebe6692c', 'herbs', NULL, 'light_intensity', 150.0000, 900.0000, 300.0000, 600.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('f9e0d202-867a-48d6-939a-e9fbe3666564', 'herbs', NULL, 'ph', 5.0000, 7.5000, 5.8000, 6.8000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('609f5660-1458-47e1-9b45-bc950b09975c', 'herbs', NULL, 'ec', 0.8000, 3.5000, 1.4000, 2.2000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00'),
	('21ffbcb2-d2ed-4a80-9f26-1af720c6e207', 'microgreens', NULL, 'temperature', 15.0000, 28.0000, 18.0000, 22.0000, 'medium', 'celsius', '2025-06-30 01:43:20.703714+00'),
	('ad00ad83-5c16-47d6-ad5b-8710f0f39660', 'microgreens', NULL, 'humidity', 60.0000, 98.0000, 70.0000, 90.0000, 'medium', 'percentage', '2025-06-30 01:43:20.703714+00'),
	('9a2993dc-37c0-4dfa-9df4-12d9006c7382', 'microgreens', NULL, 'light_intensity', 50.0000, 400.0000, 100.0000, 250.0000, 'medium', 'ppfd', '2025-06-30 01:43:20.703714+00'),
	('9cc71168-1a9b-4426-bf6d-d97436e79b54', 'microgreens', NULL, 'ph', 5.5000, 7.0000, 5.8000, 6.5000, 'high', 'ph', '2025-06-30 01:43:20.703714+00'),
	('ed7161d5-e78d-42b4-8bdb-42e3bcace903', 'microgreens', NULL, 'ec', 0.3000, 2.0000, 0.8000, 1.5000, 'high', 'ms/cm', '2025-06-30 01:43:20.703714+00')
ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: queue_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."queue_config" ("queue_name", "is_active", "max_concurrent_jobs", "retry_delay_seconds", "max_job_runtime_seconds", "priority_weight", "auto_cleanup_days", "notification_settings", "created_at", "updated_at") VALUES
	('farm_automation', true, 5, 300, 3600, 1.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('sensor_processing', true, 10, 60, 1800, 1.0, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('notifications', true, 8, 120, 600, 0.8, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('analytics', true, 3, 600, 7200, 0.5, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('maintenance', true, 2, 1800, 10800, 0.3, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00'),
	('background_tasks', true, 15, 180, 3600, 1.2, 7, '{}', '2025-06-21 18:19:13.191005+00', '2025-06-21 18:19:13.191005+00')
ON CONFLICT (queue_name) DO NOTHING;


--
-- Data for Name: recipe_stage_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedule_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: scheduled_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alert_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_home_assistant_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_home_assistant_configs" ("id", "user_id", "name", "url", "access_token", "local_url", "cloudflare_enabled", "cloudflare_client_id", "cloudflare_client_secret", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at") VALUES
	('119bc866-f866-49f5-8163-56e88dababb8', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'Home Assistant Test 1', 'https://automate-api.goodgoodgreens.org', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4MTgxNDk4Yjg5Yjk0OWJlYjg1YmZmYjViYTY1ZmU1ZiIsImlhdCI6MTc0OTI1NjQ0OSwiZXhwIjoyMDY0NjE2NDQ5fQ.L1AKMYKM-aYd0AmB0u9cC6XNTOMyfZ2m-h2j_lvJPLI', NULL, true, '613004c5bce93e4969122c2994ee33cd.access', '9173c92fd1ae8f97735442b08c496fdfbfe6a5403257d03f796f24feee7db9d4', true, true, NULL, NULL, NULL, '2025-06-22 16:21:05.488902+00', '2025-06-22 16:21:05.488902+00')
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: user_device_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_square_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_square_configs" ("id", "user_id", "name", "application_id", "access_token", "environment", "webhook_signature_key", "is_default", "enabled", "last_tested", "last_successful_connection", "test_result", "created_at", "updated_at", "webhook_url") VALUES
	('09c39b93-6a34-460c-8ead-2b6b22fa3a9c', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'good good greens', 'sq0idp-DUNV2hrB6P5HT78AfjoHwA', 'EAAAl3Zui51Sip9_Mls3P4PfxUtEF2U0V-aEBztgb2rjC2OkSEVXQoa5N1KnJnhC', 'production', NULL, true, true, NULL, NULL, NULL, '2025-06-23 19:24:14.42874+00', '2025-06-23 19:24:14.42874+00', NULL)
ON CONFLICT (user_id, name) DO NOTHING;


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--


-- ===========================================
-- EXPANDED SEED DATA FOR LOCAL DEVELOPMENT
-- ===========================================
-- Added for junior developer onboarding
-- These inserts use ON CONFLICT to safely add data without duplicates

-- Additional species for testing grow features
INSERT INTO "public"."species" ("id", "name", "description", "created_at", "updated_at") VALUES
	('11111111-1111-1111-1111-111111111001', 'lettuce', 'Butterhead lettuce - tender leaves with mild flavor', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111002', 'spinach', 'Baby spinach - nutrient-rich leafy green', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111003', 'arugula', 'Rocket arugula - peppery salad green', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111004', 'kale', 'Lacinato kale - hardy nutritious green', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111005', 'cilantro', 'Coriander/Cilantro - versatile herb', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111006', 'mint', 'Spearmint - refreshing herb for drinks and dishes', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111007', 'microgreen-sunflower', 'Sunflower microgreens - nutty flavor', NOW(), NOW()),
	('11111111-1111-1111-1111-111111111008', 'microgreen-pea', 'Pea shoot microgreens - sweet and tender', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grow recipes for testing recipe management
INSERT INTO "public"."grow_recipes" ("id", "name", "species_id", "description", "total_duration_days", "created_at", "updated_at", "is_active", "user_id") VALUES
	('22222222-2222-2222-2222-222222222001', 'Basil - Standard', 'bedeebed-e27c-4c89-92ff-ff9fbfc4cf6f', 'Standard basil grow cycle for consistent yields', 42, NOW(), NOW(), true, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('22222222-2222-2222-2222-222222222002', 'Lettuce - Quick Harvest', '11111111-1111-1111-1111-111111111001', 'Fast growing butterhead lettuce', 28, NOW(), NOW(), true, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('22222222-2222-2222-2222-222222222003', 'Spinach - Baby Greens', '11111111-1111-1111-1111-111111111002', 'Baby spinach harvested young for tender leaves', 25, NOW(), NOW(), true, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('22222222-2222-2222-2222-222222222004', 'Microgreens - Sunflower', '11111111-1111-1111-1111-111111111007', 'Quick 10-day sunflower microgreen cycle', 10, NOW(), NOW(), true, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('22222222-2222-2222-2222-222222222005', 'Mint - Continuous Harvest', '11111111-1111-1111-1111-111111111006', 'Mint with ongoing harvest after establishment', 60, NOW(), NOW(), true, 'b26addbe-38fc-4e23-aad5-7ea1bd11edba')
ON CONFLICT (id) DO NOTHING;

-- Additional farm for testing multi-farm features
INSERT INTO "public"."farms" ("id", "name", "location", "user_id", "created_at", "updated_at", "documentation_folder_path", "farm_image_url") VALUES
	('33333333-3333-3333-3333-333333333001', 'Test Farm 2', 'Building B', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NOW(), NOW(), NULL, NULL),
	('33333333-3333-3333-3333-333333333002', 'Microgreens Lab', 'Research Wing', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', NOW(), NOW(), NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- Additional rows for test farms
INSERT INTO "public"."rows" ("id", "farm_id", "name", "orientation", "created_at", "updated_at") VALUES
	('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 'Row A', 'north-south', NOW(), NOW()),
	('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333001', 'Row B', 'north-south', NOW(), NOW()),
	('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333002', 'Micro Row 1', 'east-west', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Additional racks for test rows
INSERT INTO "public"."racks" ("id", "row_id", "name", "created_at", "updated_at") VALUES
	('55555555-5555-5555-5555-555555555001', '44444444-4444-4444-4444-444444444001', 'Rack A1', NOW(), NOW()),
	('55555555-5555-5555-5555-555555555002', '44444444-4444-4444-4444-444444444001', 'Rack A2', NOW(), NOW()),
	('55555555-5555-5555-5555-555555555003', '44444444-4444-4444-4444-444444444002', 'Rack B1', NOW(), NOW()),
	('55555555-5555-5555-5555-555555555004', '44444444-4444-4444-4444-444444444003', 'Micro Rack 1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Additional shelves for test racks
INSERT INTO "public"."shelves" ("id", "rack_id", "name", "created_at", "updated_at") VALUES
	('66666666-6666-6666-6666-666666666001', '55555555-5555-5555-5555-555555555001', 'Shelf A1-1', NOW(), NOW()),
	('66666666-6666-6666-6666-666666666002', '55555555-5555-5555-5555-555555555001', 'Shelf A1-2', NOW(), NOW()),
	('66666666-6666-6666-6666-666666666003', '55555555-5555-5555-5555-555555555002', 'Shelf A2-1', NOW(), NOW()),
	('66666666-6666-6666-6666-666666666004', '55555555-5555-5555-5555-555555555003', 'Shelf B1-1', NOW(), NOW()),
	('66666666-6666-6666-6666-666666666005', '55555555-5555-5555-5555-555555555004', 'Micro Shelf 1', NOW(), NOW()),
	('66666666-6666-6666-6666-666666666006', '55555555-5555-5555-5555-555555555004', 'Micro Shelf 2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample grows in different stages for testing grow tracking
INSERT INTO "public"."grows" ("id", "recipe_id", "shelf_id", "name", "status", "started_at", "expected_harvest_date", "actual_harvest_date", "notes", "created_at", "updated_at", "user_id") VALUES
	('77777777-7777-7777-7777-777777777001', '22222222-2222-2222-2222-222222222001', 'c3922ea5-a537-4821-b687-bb9906949c3b', 'Basil Batch 1', 'active', NOW() - INTERVAL '14 days', NOW() + INTERVAL '28 days', NULL, 'First basil batch - looking healthy', NOW(), NOW(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('77777777-7777-7777-7777-777777777002', '22222222-2222-2222-2222-222222222002', 'edc0c39c-444f-4083-a707-8c1eb76a2d83', 'Lettuce Batch 1', 'active', NOW() - INTERVAL '7 days', NOW() + INTERVAL '21 days', NULL, 'Lettuce in vegetative stage', NOW(), NOW(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('77777777-7777-7777-7777-777777777003', '22222222-2222-2222-2222-222222222004', '66666666-6666-6666-6666-666666666005', 'Sunflower Micros', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '5 days', NULL, 'Microgreens almost ready', NOW(), NOW(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('77777777-7777-7777-7777-777777777004', '22222222-2222-2222-2222-222222222003', '66666666-6666-6666-6666-666666666001', 'Spinach Batch 1', 'germination', NOW() - INTERVAL '3 days', NOW() + INTERVAL '22 days', NULL, 'Just germinating', NOW(), NOW(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba'),
	('77777777-7777-7777-7777-777777777005', '22222222-2222-2222-2222-222222222002', '66666666-6666-6666-6666-666666666003', 'Lettuce Completed', 'harvested', NOW() - INTERVAL '35 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Harvested 2.5 lbs', NOW(), NOW(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- END EXPANDED SEED DATA
-- ===========================================


-- Re-enable triggers
SET session_replication_role = 'origin';



-- Add identity for the test user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  'b26addbe-38fc-4e23-aad5-7ea1bd11edba',
  '{"sub": "b26addbe-38fc-4e23-aad5-7ea1bd11edba", "email": "testuser123@gmail.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;


-- Create test user for local development
-- Run this after database reset: supabase db reset && psql "$DATABASE_URL" < test_user.sql

-- Create test user in auth.users  
-- Note: This uses a test password hash for 'password123' - only for development/testing
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "confirmation_token", "recovery_token", "email_change_token_new", "email_change", "phone_change", "phone_change_token", "email_change_token_current", "reauthentication_token", "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "is_sso_user") VALUES
	('00000000-0000-0000-0000-000000000000', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'authenticated', 'authenticated', 'testuser123@gmail.com', crypt('password123', gen_salt('bf', 12)), '2025-06-22 15:29:35.403448+00', '', '', '', '', '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', false)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding identity
INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "provider", "identity_data", "last_sign_in_at", "created_at", "updated_at") VALUES 
	(gen_random_uuid(), 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'email', '{"sub": "b26addbe-38fc-4e23-aad5-7ea1bd11edba", "email": "testuser123@gmail.com"}', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00')
ON CONFLICT DO NOTHING;

-- Create corresponding user profile
INSERT INTO "public"."user_profiles" ("id", "role", "name", "created_at", "updated_at", "profile_image_url", "storage_quota_mb") VALUES
	('b26addbe-38fc-4e23-aad5-7ea1bd11edba', 'operator', 'testuser123@gmail.com', '2025-06-22 15:29:35.403448+00', '2025-06-22 15:29:35.403448+00', NULL, 100)
ON CONFLICT (id) DO NOTHING;