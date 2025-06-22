-- Views and Functions for Grow Management Interface
-- This creates optimized views for the four main tabs

-- View for Current Grows tab - comprehensive grow status
DROP VIEW IF EXISTS current_grows_view;
CREATE VIEW current_grows_view AS
SELECT 
    g.id,
    g.name,
    g.status,
    g.plant_count,
    g.planted_date,
    g.expected_harvest_date,
    g.notes,
    g.created_at,
    
    -- Seed variety information
    sv.variety_name,
    sp.name as crop_name,
    
    -- Current stage information
    gs.name as current_stage,
    gs.color_code as stage_color,
    gs.order_index as stage_order,
    
    -- Recipe information
    gr.name as recipe_name,
    
    -- Location information
    gl.location_name,
    gl.location_count,
    
    -- Progress calculation
    CASE 
        WHEN g.planted_date IS NULL THEN 0
        WHEN g.expected_harvest_date IS NULL THEN 50
        ELSE LEAST(100, ROUND(
            (EXTRACT(EPOCH FROM NOW() - g.planted_date::timestamp) /
             EXTRACT(EPOCH FROM g.expected_harvest_date::timestamp - g.planted_date::timestamp)) * 100
        ))
    END as progress_percentage,
    
    -- Days information
    CASE 
        WHEN g.planted_date IS NULL THEN NULL
        ELSE EXTRACT(DAYS FROM NOW() - g.planted_date::timestamp)::INTEGER
    END as days_since_planted,
    
    CASE 
        WHEN g.expected_harvest_date IS NULL THEN NULL
        ELSE (g.expected_harvest_date::date - CURRENT_DATE)::INTEGER
    END as days_to_harvest,
    
    -- Alert count
    COALESCE(ga.alert_count, 0) as active_alerts,
    
    -- Latest sensor readings (can be enhanced later)
    NULL::jsonb as recent_sensor_data

FROM grows g
LEFT JOIN seed_varieties sv ON g.seed_variety_id = sv.id
LEFT JOIN species sp ON sv.species_id = sp.id
LEFT JOIN grow_stages gs ON g.current_stage_id = gs.id
LEFT JOIN grow_recipes gr ON g.recipe_id = gr.id
LEFT JOIN (
    SELECT grow_id, 
           STRING_AGG(DISTINCT gl.name, ', ') as location_name,
           COUNT(DISTINCT gl.id) as location_count
    FROM grow_location_assignments gla
    JOIN grow_locations gl ON gla.location_id = gl.id
    GROUP BY grow_id
) gl ON g.id = gl.grow_id
LEFT JOIN (
    SELECT grow_id, COUNT(*) as alert_count
    FROM grow_alerts
    WHERE is_resolved = FALSE
    GROUP BY grow_id
) ga ON g.id = ga.grow_id
WHERE g.status IN ('active', 'planned')
ORDER BY g.created_at DESC;

-- View for Analytics and History tab
DROP VIEW IF EXISTS grow_analytics_view;
CREATE VIEW grow_analytics_view AS
SELECT 
    g.id,
    g.name,
    g.status,
    g.plant_count,
    g.planted_date,
    g.expected_harvest_date,
    g.actual_harvest_date,
    
    -- Crop information
    sp.name as crop_name,
    sv.variety_name,
    
    -- Duration calculations
    CASE 
        WHEN g.actual_harvest_date IS NOT NULL AND g.planted_date IS NOT NULL 
        THEN (g.actual_harvest_date - g.planted_date)::INTEGER
        WHEN g.planted_date IS NOT NULL 
        THEN (CURRENT_DATE - g.planted_date)::INTEGER
        ELSE NULL
    END as total_days,
    
    -- Harvest information
    COALESCE(h.total_harvest, 0) as total_yield,
    COALESCE(h.harvest_count, 0) as harvest_sessions,
    COALESCE(h.avg_quality, 0) as average_quality,
    
    -- Yield per plant
    CASE 
        WHEN g.plant_count > 0 AND h.total_harvest > 0 
        THEN ROUND(h.total_harvest / g.plant_count, 2)
        ELSE 0
    END as yield_per_plant,
    
    -- Success rating
    CASE 
        WHEN g.status = 'harvested' THEN 
            CASE 
                WHEN h.total_harvest > 0 THEN 100
                ELSE 50
            END
        WHEN g.status = 'failed' THEN 0
        WHEN g.status = 'active' THEN 75
        ELSE 50
    END as success_rating,
    
    -- Recipe performance
    gr.name as recipe_name,
    gr.success_rate as recipe_success_rate,
    
    g.created_at,
    g.updated_at
    
FROM grows g
LEFT JOIN seed_varieties sv ON g.seed_variety_id = sv.id
LEFT JOIN species sp ON sv.species_id = sp.id
LEFT JOIN grow_recipes gr ON g.recipe_id = gr.id
LEFT JOIN (
    SELECT 
        grow_id,
        SUM(yield_grams) as total_harvest,
        COUNT(*) as harvest_count,
        AVG(quality_rating) as avg_quality
    FROM harvests
    GROUP BY grow_id
) h ON g.id = h.grow_id
WHERE g.status IN ('harvested', 'failed')
ORDER BY g.updated_at DESC;

-- View for recipe management (simplified - will be enhanced after schema consolidation)
DROP VIEW IF EXISTS recipe_performance_view;
CREATE VIEW recipe_performance_view AS
SELECT 
    gr.id,
    gr.name,
    COALESCE(gr.instruction_document_url, 'No description available') as description,
    COALESCE(gr.version, 1) as version,
    COALESCE(gr.is_template, false) as is_template,
    sp.name as crop_name,

    COALESCE(usage.times_used, 0) as times_used,
    COALESCE(usage.successful_grows, 0) as successful_grows,
    COALESCE(usage.failed_grows, 0) as failed_grows,
    CASE 
        WHEN COALESCE(usage.times_used, 0) > 0 
        THEN ROUND((COALESCE(usage.successful_grows, 0)::NUMERIC / usage.times_used) * 100, 1)
        ELSE 0
    END as success_rate,
    COALESCE(usage.avg_grow_days, 0) as avg_grow_days,
    COALESCE(usage.avg_yield_per_plant, 0) as avg_yield_per_plant,
    gr.created_at,
    gr.updated_at
FROM grow_recipes gr
LEFT JOIN species sp ON gr.species_id = sp.id
LEFT JOIN (
    SELECT 
        recipe_id,
        COUNT(*) as times_used,
        COUNT(CASE WHEN status = 'harvested' THEN 1 END) as successful_grows,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_grows,
        AVG(CASE 
            WHEN actual_harvest_date IS NOT NULL AND planted_date IS NOT NULL 
            THEN (actual_harvest_date - planted_date)::INTEGER
        END) as avg_grow_days,
        AVG(CASE 
            WHEN h.total_harvest > 0 AND g.plant_count > 0 
            THEN h.total_harvest / g.plant_count
        END) as avg_yield_per_plant
    FROM grows g
    LEFT JOIN (
        SELECT grow_id, SUM(yield_grams) as total_harvest
        FROM harvests
        GROUP BY grow_id
    ) h ON g.id = h.grow_id
    WHERE recipe_id IS NOT NULL
    GROUP BY recipe_id
) usage ON gr.id = usage.recipe_id;

-- Function to get grow timeline
DROP FUNCTION IF EXISTS get_grow_timeline(p_grow_id uuid);
CREATE FUNCTION get_grow_timeline(p_grow_id UUID)
RETURNS TABLE (
    event_date DATE,
    event_type VARCHAR(50),
    description TEXT,
    metadata JSONB,
    created_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ge.created_at::DATE,
        ge.event_type,
        ge.description,
        ge.metadata,
        ge.created_by
    FROM grow_events ge
    WHERE ge.grow_id = p_grow_id
    ORDER BY ge.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get location availability
DROP FUNCTION IF EXISTS get_available_locations(p_capacity_needed integer);
CREATE FUNCTION get_available_locations(p_capacity_needed INTEGER DEFAULT 1)
RETURNS TABLE (
    location_id UUID,
    location_name VARCHAR(100),
    location_type VARCHAR(20),
    total_capacity INTEGER,
    used_capacity INTEGER,
    available_capacity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gl.id,
        gl.name,
        gl.location_type,
        gl.capacity,
        COALESCE(usage.used_capacity, 0)::INTEGER,
        (gl.capacity - COALESCE(usage.used_capacity, 0))::INTEGER as available_capacity
    FROM grow_locations gl
    LEFT JOIN (
        SELECT 
            gla.location_id,
            SUM(g.plant_count) as used_capacity
        FROM grow_location_assignments gla
        JOIN grows g ON gla.grow_id = g.id
        WHERE g.status IN ('active', 'planned')
        GROUP BY gla.location_id
    ) usage ON gl.id = usage.location_id
    WHERE (gl.capacity - COALESCE(usage.used_capacity, 0)) >= p_capacity_needed
    ORDER BY available_capacity DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate harvest date (updated for schedules)
DROP FUNCTION IF EXISTS calculate_harvest_date(p_planted_date date, p_recipe_id uuid);
CREATE FUNCTION calculate_harvest_date(
    p_planted_date DATE,
    p_recipe_id UUID DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
    total_days INTEGER := 60; -- Default grow time
BEGIN
    -- Get total grow days from recipe if provided
    IF p_recipe_id IS NOT NULL THEN
        SELECT COALESCE(total_grow_days, 60) INTO total_days
        FROM grow_recipes
        WHERE id = p_recipe_id;
    END IF;
    
    RETURN p_planted_date + total_days;
END;
$$ LANGUAGE plpgsql;

-- Function to get environmental summary
DROP FUNCTION IF EXISTS get_environmental_summary(p_farm_id uuid, p_row_id uuid, p_rack_id uuid, p_shelf_id uuid, p_hours_back integer);
CREATE FUNCTION get_environmental_summary(p_grow_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simplified environmental summary - can be enhanced with actual sensor data
    SELECT jsonb_build_object(
        'temperature', jsonb_build_object('current', 22.5, 'target', 23.0, 'unit', '°C'),
        'humidity', jsonb_build_object('current', 65.0, 'target', 70.0, 'unit', '%'),
        'light', jsonb_build_object('current', 'on', 'schedule', '16h/day'),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create grow from recipe
DROP FUNCTION IF EXISTS create_grow_from_recipe(p_name text, p_recipe_id uuid, p_seed_variety_id uuid, p_plant_count integer, p_shelf_ids uuid[]);
CREATE FUNCTION create_grow_from_recipe(
    p_name VARCHAR(100),
    p_recipe_id UUID,
    p_seed_variety_id UUID,
    p_location_ids UUID[],
    p_plant_count INTEGER,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    new_grow_id UUID;
    planted_date DATE := CURRENT_DATE;
    expected_harvest DATE;
    location_id UUID;
BEGIN
    -- Calculate expected harvest date
    expected_harvest := calculate_harvest_date(planted_date, p_recipe_id);
    
    -- Create new grow
    INSERT INTO grows (
        name,
        recipe_id,
        seed_variety_id,
        plant_count,
        planted_date,
        expected_harvest_date,
        status,
        created_by
    ) VALUES (
        p_name,
        p_recipe_id,
        p_seed_variety_id,
        p_plant_count,
        planted_date,
        expected_harvest,
        'planned',
        p_user_id
    ) RETURNING id INTO new_grow_id;
    
    -- Assign locations
    FOREACH location_id IN ARRAY p_location_ids
    LOOP
        INSERT INTO grow_location_assignments (
            grow_id,
            location_id,
            assigned_by
        ) VALUES (
            new_grow_id,
            location_id,
            p_user_id
        );
    END LOOP;
    
    -- Create initial event
    INSERT INTO grow_events (
        grow_id,
        event_type,
        description,
        created_by
    ) VALUES (
        new_grow_id,
        'created',
        'Grow created from recipe',
        p_user_id
    );
    
    RETURN new_grow_id;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT ON current_grows_view TO authenticated;
GRANT SELECT ON grow_analytics_view TO authenticated;
GRANT SELECT ON recipe_performance_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_grow_timeline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_locations(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_environmental_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_grow_from_recipe(VARCHAR(100), UUID, UUID, UUID[], INTEGER, UUID) TO authenticated; 