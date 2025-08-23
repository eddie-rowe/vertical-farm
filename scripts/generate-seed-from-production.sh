#!/bin/bash
set -e

echo "🌱 Generating seed data from production..."
echo ""

# Check for required environment variable
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD environment variable not set"
    echo "Get it from: https://supabase.com/dashboard/project/lvjhhvxwxeeupamyahmr/settings/database"
    exit 1
fi

# Production database URL
PROD_DB_URL="postgresql://postgres.lvjhhvxwxeeupamyahmr:$SUPABASE_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Output file
SEED_FILE="supabase/seed.sql"

echo "-- Seed data generated from production on $(date)" > $SEED_FILE
echo "-- This file runs automatically with 'supabase db reset'" >> $SEED_FILE
echo "" >> $SEED_FILE

# Tables to export (in dependency order)
TABLES=(
    "farms"
    "rows"
    "shelves"
    "grow_locations"
    "species"
    "seed_varieties"
    "crops"
    "grow_recipes"
    "grow_stages"
    "grows"
    "grow_location_assignments"
    "device_types"
    "devices"
    "device_assignments"
    "device_states"
    "device_schedules"
    "sensor_types"
    "sensors"
    "sensor_readings"
    "automation_rules"
    "sensor_alert_thresholds"
    "alerts"
    "grow_alerts"
    "sensor_alerts"
)

echo "📊 Exporting data from production tables..."
echo "" >> $SEED_FILE

# Function to export a table
export_table() {
    local table=$1
    echo "  - Exporting $table..."
    
    # Add table comment
    echo "-- Data for $table" >> $SEED_FILE
    
    # Use pg_dump to get INSERT statements with column names
    PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
        "$PROD_DB_URL" \
        --data-only \
        --inserts \
        --column-inserts \
        --table="public.$table" \
        --no-owner \
        --no-privileges \
        --no-publications \
        --no-subscriptions \
        --no-comments \
        2>/dev/null | \
        grep -E "^INSERT INTO" | \
        sed "s/public\.//g" >> $SEED_FILE || true
    
    echo "" >> $SEED_FILE
}

# Export each table
for table in "${TABLES[@]}"; do
    export_table "$table"
done

# Add test users at the end (for development login)
echo "-- Test users for local development" >> $SEED_FILE
echo "-- Email: test@example.com / Password: password123" >> $SEED_FILE
echo "INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)" >> $SEED_FILE
echo "VALUES " >> $SEED_FILE
echo "  ('11111111-1111-1111-1111-111111111111', 'test@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}')," >> $SEED_FILE
echo "  ('22222222-2222-2222-2222-222222222222', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}');" >> $SEED_FILE
echo "" >> $SEED_FILE

# Count records
TOTAL_INSERTS=$(grep -c "INSERT INTO" $SEED_FILE || echo "0")

echo ""
echo "✅ Seed file generated successfully!"
echo "📄 File: $SEED_FILE"
echo "📊 Total INSERT statements: $TOTAL_INSERTS"
echo ""
echo "🚀 To use this seed data:"
echo "  1. Review the file to ensure no sensitive data is included"
echo "  2. Run: supabase db reset"
echo "     (This will apply migrations and seed data)"
echo ""
echo "⚠️  Note: The seed file includes test users for local development:"
echo "  - test@example.com / password123"
echo "  - admin@example.com / password123"
