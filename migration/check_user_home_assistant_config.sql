-- Check current Home Assistant configuration for user 3c6eafc7-f53c-4987-abf9-05b64f06d861
SELECT 
    user_id,
    ha_url,
    is_connected,
    last_connected_at,
    created_at,
    updated_at
FROM user_home_assistant_configs 
WHERE user_id = '3c6eafc7-f53c-4987-abf9-05b64f06d861';

-- Also check if any records exist in the table at all
SELECT COUNT(*) as total_configs FROM user_home_assistant_configs;

-- Check table structure
\d user_home_assistant_configs; 