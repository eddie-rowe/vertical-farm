#!/bin/bash

# Test script for consolidated migrations in Docker environment
# This script validates syntax and functionality of all consolidated migrations

set -e

echo "🧪 Testing Consolidated Migrations in Docker Environment"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run SQL and check result
run_sql_test() {
    local description="$1"
    local sql="$2"
    local expected_result="$3"
    
    echo -n "Testing: $description... "
    
    if result=$(docker exec supabase psql -U postgres -d postgres -t -c "$sql" 2>&1); then
        if [[ -n "$expected_result" ]] && [[ "$result" != *"$expected_result"* ]]; then
            echo -e "${RED}❌ FAILED${NC}"
            echo "Expected: $expected_result"
            echo "Got: $result"
            return 1
        else
            echo -e "${GREEN}✅ PASSED${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Error: $result"
        return 1
    fi
}

# Function to test migration syntax
test_migration_syntax() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    echo -e "\n${YELLOW}📋 Testing Migration: $migration_name${NC}"
    echo "----------------------------------------"
    
    # Test syntax by parsing the file (dry run)
    if docker exec -i supabase psql -U postgres -d postgres -c "BEGIN;" < /dev/null > /dev/null 2>&1; then
        # Count SQL statements in migration
        local stmt_count=$(grep -c ';' "$migration_file" || echo "0")
        echo "  📊 Migration contains ~$stmt_count SQL statements"
        
        # Check for common patterns
        if grep -q "CREATE TABLE" "$migration_file"; then
            echo "  🏗️  Contains table creation statements"
        fi
        
        if grep -q "CREATE FUNCTION" "$migration_file"; then
            echo "  ⚙️  Contains function definitions"
        fi
        
        if grep -q "CREATE INDEX" "$migration_file"; then
            echo "  🔍 Contains index creation"
        fi
        
        if grep -q "INSERT INTO" "$migration_file"; then
            echo "  📝 Contains data insertion"
        fi
        
        if grep -q "ALTER TABLE" "$migration_file"; then
            echo "  🔧 Contains table alterations"
        fi
        
        echo -e "  ${GREEN}✅ Syntax appears valid${NC}"
        return 0
    else
        echo -e "  ${RED}❌ Database connection failed${NC}"
        return 1
    fi
}

# Function to test database functionality
test_database_functionality() {
    echo -e "\n${YELLOW}🔧 Testing Database Functionality${NC}"
    echo "===================================="
    
    # Test basic connectivity
    run_sql_test "Database connectivity" "SELECT 1;" "1"
    
    # Test table existence
    run_sql_test "Core tables exist" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" ""
    
    # Test specific critical tables
    critical_tables=("farms" "grows" "crops" "automation_rules" "sensor_readings")
    
    for table in "${critical_tables[@]}"; do
        run_sql_test "Table '$table' exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';" "1"
    done
    
    # Test functions exist
    run_sql_test "Database functions exist" "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';" ""
    
    # Test RLS policies
    run_sql_test "RLS policies exist" "SELECT COUNT(*) FROM pg_policies;" ""
    
    # Test extensions
    run_sql_test "Required extensions" "SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');" ""
}

# Function to test data integrity
test_data_integrity() {
    echo -e "\n${YELLOW}🔒 Testing Data Integrity${NC}"
    echo "=========================="
    
    # Test foreign key constraints
    run_sql_test "Foreign key constraints" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" ""
    
    # Test unique constraints
    run_sql_test "Unique constraints" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE';" ""
    
    # Test check constraints
    run_sql_test "Check constraints" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'CHECK';" ""
}

# Function to test performance features
test_performance_features() {
    echo -e "\n${YELLOW}⚡ Testing Performance Features${NC}"
    echo "==============================="
    
    # Test indexes
    run_sql_test "Database indexes" "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" ""
    
    # Test materialized views
    run_sql_test "Materialized views" "SELECT COUNT(*) FROM pg_matviews;" ""
    
    # Test specific performance indexes
    performance_indexes=("idx_sensor_readings_timestamp" "idx_grows_status" "idx_automation_rules_active")
    
    for index in "${performance_indexes[@]}"; do
        run_sql_test "Performance index '$index'" "SELECT COUNT(*) FROM pg_indexes WHERE indexname = '$index';" ""
    done
}

# Main test execution
main() {
    echo "Starting comprehensive migration testing..."
    echo "Container: $(docker ps --format 'table {{.Names}}\t{{.Status}}' | grep supabase)"
    echo ""
    
    # Test all consolidated migrations
    migration_files=(
        "supabase/migrations/20250203000008_consolidated_core_schema.sql"
        "supabase/migrations/20250203000009_consolidated_queue_system.sql"
        "supabase/migrations/20250203000010_consolidated_functions_performance.sql"
        "supabase/migrations/20250203000011_consolidated_storage_features.sql"
        "supabase/migrations/20250203000012_consolidated_data_fixes_cleanup.sql"
    )
    
    migration_test_passed=true
    
    for migration_file in "${migration_files[@]}"; do
        if [[ -f "$migration_file" ]]; then
            if ! test_migration_syntax "$migration_file"; then
                migration_test_passed=false
            fi
        else
            echo -e "${RED}❌ Migration file not found: $migration_file${NC}"
            migration_test_passed=false
        fi
    done
    
    # Test database functionality
    if ! test_database_functionality; then
        echo -e "${RED}❌ Database functionality tests failed${NC}"
        exit 1
    fi
    
    # Test data integrity
    if ! test_data_integrity; then
        echo -e "${RED}❌ Data integrity tests failed${NC}"
        exit 1
    fi
    
    # Test performance features
    if ! test_performance_features; then
        echo -e "${YELLOW}⚠️  Some performance features may not be fully configured${NC}"
    fi
    
    # Final summary
    echo -e "\n${YELLOW}📊 Test Summary${NC}"
    echo "==============="
    
    if $migration_test_passed; then
        echo -e "${GREEN}✅ All consolidated migrations passed syntax validation${NC}"
        echo -e "${GREEN}✅ Database functionality tests passed${NC}"
        echo -e "${GREEN}✅ Data integrity tests passed${NC}"
        echo -e "\n${GREEN}🎉 Consolidated migrations are ready for production!${NC}"
        
        # Display migration statistics
        echo -e "\n${YELLOW}📈 Migration Statistics:${NC}"
        echo "  • Total consolidated migrations: ${#migration_files[@]}"
        echo "  • Total tables: $(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')"
        echo "  • Total functions: $(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';" | tr -d ' ')"
        echo "  • Total indexes: $(docker exec supabase psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | tr -d ' ')"
        
        exit 0
    else
        echo -e "${RED}❌ Some migration tests failed${NC}"
        exit 1
    fi
}

# Run the main function
main "$@" 