#!/bin/bash
# Create a new baseline migration from production schema

echo "🔄 Creating Production Schema Baseline"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if supabase is linked
if [ ! -f supabase/.temp/project-ref ]; then
    echo -e "${RED}❌ Project not linked. Run 'supabase link' first${NC}"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo "📍 Project: $PROJECT_REF"
echo ""

# Step 1: Backup current migrations
echo "1️⃣ Backing up current migrations..."
BACKUP_DIR="supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "supabase/migrations" ]; then
    cp -r supabase/migrations "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backed up to $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠ No existing migrations to backup${NC}"
fi

# Step 2: Create fresh migrations directory
echo ""
echo "2️⃣ Creating fresh migrations directory..."
rm -rf supabase/migrations
mkdir -p supabase/migrations

# Step 3: Dump production schema
echo ""
echo "3️⃣ Dumping production schema..."
echo -e "${YELLOW}Enter your database password when prompted:${NC}"

# Create a comprehensive baseline migration
supabase db dump \
  --db-url "postgresql://postgres:[password]@db.$PROJECT_REF.supabase.co:5432/postgres" \
  -f supabase/migrations/00000000000000_production_baseline.sql \
  --use-copy \
  --data-only=false

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to dump production schema${NC}"
    echo "You'll need to get the database URL from your Supabase dashboard:"
    echo "1. Go to Settings > Database"
    echo "2. Copy the connection string"
    echo "3. Run: supabase db dump --db-url 'YOUR_CONNECTION_STRING' -f supabase/migrations/00000000000000_production_baseline.sql"
    exit 1
fi

# Step 4: Clean up the dump
echo ""
echo "4️⃣ Cleaning up baseline migration..."

# Remove Supabase-managed schemas and extensions from dump
sed -i.bak '
/CREATE SCHEMA IF NOT EXISTS "auth"/d
/CREATE SCHEMA IF NOT EXISTS "storage"/d
/CREATE SCHEMA IF NOT EXISTS "extensions"/d
/ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/d
/GRANT ALL ON SCHEMA "public" TO "postgres"/d
/GRANT USAGE ON SCHEMA "public" TO "anon"/d
/GRANT USAGE ON SCHEMA "public" TO "authenticated"/d
/GRANT USAGE ON SCHEMA "public" TO "service_role"/d
' supabase/migrations/00000000000000_production_baseline.sql

rm supabase/migrations/00000000000000_production_baseline.sql.bak

echo -e "${GREEN}✓ Created baseline migration${NC}"

# Step 5: Test locally
echo ""
echo "5️⃣ Next steps:"
echo "   1. Stop Supabase: supabase stop"
echo "   2. Start fresh: supabase start"
echo "   3. Your local DB will now match production exactly!"
echo ""
echo -e "${GREEN}✅ Baseline creation complete!${NC}"
echo ""
echo "Your old migrations are backed up in: $BACKUP_DIR"
echo "You can now work from a clean production baseline."
