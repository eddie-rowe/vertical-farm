#!/bin/bash

# Test script for local Supabase environment
# This script validates that the migrations applied correctly

set -e  # Exit on any error

echo "🧪 Testing Local Supabase Environment"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test database connection
echo -e "${YELLOW}1. Testing database connection...${NC}"
if docker exec supabase psql -U postgres -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Test Supabase schemas
echo -e "${YELLOW}2. Testing Supabase schemas...${NC}"
SCHEMAS=$(docker exec supabase psql -U postgres -d postgres -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'storage', 'realtime');")
if echo "$SCHEMAS" | grep -q "auth" && echo "$SCHEMAS" | grep -q "storage" && echo "$SCHEMAS" | grep -q "realtime"; then
    echo -e "${GREEN}✅ Supabase schemas exist${NC}"
else
    echo -e "${RED}❌ Missing Supabase schemas${NC}"
    echo "Found schemas: $SCHEMAS"
fi

# Test auth.users table
echo -e "${YELLOW}3. Testing auth.users table...${NC}"
USER_COUNT=$(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM auth.users;")
if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ auth.users table exists with $USER_COUNT users${NC}"
else
    echo -e "${RED}❌ auth.users table is empty or doesn't exist${NC}"
fi

# Test core application tables
echo -e "${YELLOW}4. Testing core application tables...${NC}"
TABLES=("farms" "grows" "sensors" "automation_rules" "queue_jobs")
for table in "${TABLES[@]}"; do
    if docker exec supabase psql -U postgres -d postgres -c "\\dt $table" 2>/dev/null | grep -q "$table"; then
        echo -e "${GREEN}✅ Table '$table' exists${NC}"
    else
        echo -e "${RED}❌ Table '$table' missing${NC}"
    fi
done

# Test migration tracking
echo -e "${YELLOW}5. Testing migration tracking...${NC}"
if docker exec supabase psql -U postgres -d postgres -c "\\dt migration_consolidation_progress" 2>/dev/null | grep -q "migration_consolidation_progress"; then
    MIGRATION_COUNT=$(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM migration_consolidation_progress;")
    echo -e "${GREEN}✅ Migration tracking table exists with $MIGRATION_COUNT entries${NC}"
else
    echo -e "${YELLOW}⚠️  Migration tracking table not found (this is ok for initial setup)${NC}"
fi

# Test functions
echo -e "${YELLOW}6. Testing key functions...${NC}"
FUNCTIONS=("is_admin" "current_user_id" "validate_farm_access")
for func in "${FUNCTIONS[@]}"; do
    if docker exec supabase psql -U postgres -d postgres -c "\\df $func" 2>/dev/null | grep -q "$func"; then
        echo -e "${GREEN}✅ Function '$func' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Function '$func' not found${NC}"
    fi
done

# Test storage buckets
echo -e "${YELLOW}7. Testing storage setup...${NC}"
BUCKET_COUNT=$(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM storage.buckets;" 2>/dev/null || echo "0")
if [ "$BUCKET_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Storage buckets configured ($BUCKET_COUNT buckets)${NC}"
else
    echo -e "${YELLOW}⚠️  No storage buckets found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Local Supabase environment test completed!${NC}"
echo ""
echo "To connect to the database:"
echo "  docker exec -it supabase psql -U postgres -d postgres"
echo ""
echo "Or from outside Docker:"
echo "  psql postgresql://postgres:postgres@localhost:54322/postgres" 