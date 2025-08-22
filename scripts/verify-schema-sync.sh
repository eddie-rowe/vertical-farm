#!/bin/bash

# Verify if local migrations match production schema
# This script helps identify schema drift between local and production

echo "🔍 Schema Verification Tool"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo "This file is needed to connect to your production Supabase instance."
    exit 1
fi

# Load production URL
source .env.production
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL not found in .env.production${NC}"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')

echo "📊 Production Project: $PROJECT_REF"
echo ""

# Function to count local migrations
count_local_migrations() {
    if [ -d "supabase/migrations" ]; then
        ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' '
    else
        echo "0"
    fi
}

# Function to get latest migration timestamp
get_latest_migration() {
    if [ -d "supabase/migrations" ]; then
        ls -1 supabase/migrations/*.sql 2>/dev/null | tail -1 | xargs basename 2>/dev/null || echo "none"
    else
        echo "none"
    fi
}

echo "1️⃣ Local Migration Status:"
echo "  - Migration files: $(count_local_migrations)"
echo "  - Latest migration: $(get_latest_migration)"
echo ""

echo "2️⃣ Checking production connection..."
# Test connection to production
if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null; then
    echo -e "  ${GREEN}✓ Connected to production${NC}"
else
    echo -e "  ${RED}✗ Cannot connect to production${NC}"
    exit 1
fi
echo ""

echo "3️⃣ Choose verification method:"
echo ""
echo "  a) Quick check - Compare migration counts"
echo "  b) Full sync - Pull production schema and compare"
echo "  c) Detailed diff - Show exact differences"
echo "  d) Cancel"
echo ""
read -p "Enter choice (a-d): " choice

case $choice in
    a)
        echo ""
        echo "📋 Quick Migration Check:"
        echo ""
        
        # Create temporary directory
        TEMP_DIR=$(mktemp -d)
        
        # Pull remote schema to temp
        echo "Fetching production schema list..."
        cd $TEMP_DIR
        supabase db pull --project-ref $PROJECT_REF > /dev/null 2>&1
        
        if [ -d "supabase/migrations" ]; then
            REMOTE_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
            REMOTE_LATEST=$(ls -1 supabase/migrations/*.sql 2>/dev/null | tail -1 | xargs basename 2>/dev/null || echo "none")
        else
            REMOTE_COUNT=0
            REMOTE_LATEST="none"
        fi
        
        cd - > /dev/null
        
        LOCAL_COUNT=$(count_local_migrations)
        
        echo "  Local migrations:  $LOCAL_COUNT"
        echo "  Remote migrations: $REMOTE_COUNT"
        echo ""
        
        if [ "$LOCAL_COUNT" -eq "$REMOTE_COUNT" ]; then
            echo -e "  ${GREEN}✓ Migration counts match!${NC}"
            echo "  Your local schema is likely up to date."
        else
            echo -e "  ${YELLOW}⚠ Migration counts differ!${NC}"
            echo "  You may need to sync your schema."
            echo ""
            echo "  Run option 'b' for a full sync."
        fi
        
        # Cleanup
        rm -rf $TEMP_DIR
        ;;
        
    b)
        echo ""
        echo "🔄 Full Schema Sync:"
        echo ""
        echo -e "${YELLOW}This will pull the production schema and create new migration files.${NC}"
        read -p "Continue? (y/N) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Backup current migrations
            if [ -d "supabase/migrations" ]; then
                echo "📦 Backing up current migrations..."
                cp -r supabase/migrations supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)
            fi
            
            echo "📥 Pulling production schema..."
            supabase db pull --project-ref $PROJECT_REF
            
            echo ""
            echo -e "${GREEN}✅ Schema pulled successfully!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Review new migrations in supabase/migrations/"
            echo "2. Start local Supabase: supabase start"
            echo "3. Migrations will auto-apply"
            echo ""
            echo "To see what changed:"
            echo "  git diff supabase/migrations/"
        else
            echo "Cancelled."
        fi
        ;;
        
    c)
        echo ""
        echo "🔎 Detailed Schema Diff:"
        echo ""
        
        # Create temp directory for comparison
        TEMP_DIR=$(mktemp -d)
        echo "Creating temporary workspace..."
        
        # Copy current migrations
        if [ -d "supabase/migrations" ]; then
            cp -r supabase/migrations $TEMP_DIR/local_migrations
        else
            mkdir -p $TEMP_DIR/local_migrations
        fi
        
        # Pull remote schema
        cd $TEMP_DIR
        echo "Fetching production schema..."
        supabase db pull --project-ref $PROJECT_REF > /dev/null 2>&1
        
        if [ -d "supabase/migrations" ]; then
            mv supabase/migrations $TEMP_DIR/remote_migrations
        else
            mkdir -p $TEMP_DIR/remote_migrations
        fi
        
        cd - > /dev/null
        
        echo ""
        echo "📊 Schema Comparison:"
        echo "===================="
        
        # Compare migrations
        echo ""
        echo "Local-only migrations:"
        for file in $TEMP_DIR/local_migrations/*.sql; do
            if [ -f "$file" ]; then
                basename_file=$(basename "$file")
                if [ ! -f "$TEMP_DIR/remote_migrations/$basename_file" ]; then
                    echo -e "  ${BLUE}+ $basename_file${NC}"
                fi
            fi
        done
        
        echo ""
        echo "Remote-only migrations:"
        for file in $TEMP_DIR/remote_migrations/*.sql; do
            if [ -f "$file" ]; then
                basename_file=$(basename "$file")
                if [ ! -f "$TEMP_DIR/local_migrations/$basename_file" ]; then
                    echo -e "  ${YELLOW}- $basename_file${NC}"
                fi
            fi
        done
        
        # Check for content differences
        echo ""
        echo "Modified migrations:"
        for file in $TEMP_DIR/local_migrations/*.sql; do
            if [ -f "$file" ]; then
                basename_file=$(basename "$file")
                if [ -f "$TEMP_DIR/remote_migrations/$basename_file" ]; then
                    if ! diff -q "$file" "$TEMP_DIR/remote_migrations/$basename_file" > /dev/null; then
                        echo -e "  ${RED}≠ $basename_file${NC}"
                    fi
                fi
            fi
        done
        
        echo ""
        echo "Summary:"
        LOCAL_COUNT=$(ls -1 $TEMP_DIR/local_migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
        REMOTE_COUNT=$(ls -1 $TEMP_DIR/remote_migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
        echo "  Local:  $LOCAL_COUNT migrations"
        echo "  Remote: $REMOTE_COUNT migrations"
        
        # Cleanup
        rm -rf $TEMP_DIR
        
        echo ""
        echo "💡 If schemas differ, run option 'b' to sync"
        ;;
        
    d)
        echo "Cancelled."
        exit 0
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🏁 Verification complete!"
