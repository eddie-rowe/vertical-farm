#!/bin/bash
set -e

echo "⚠️  WARNING: This will pull PRODUCTION DATA into your local environment!"
echo "Make sure you understand the security implications."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "📥 Pulling production data..."

# Create a temporary dump excluding sensitive tables
supabase db dump \
  --db-url "postgresql://postgres.lvjhhvxwxeeupamyahmr:$SUPABASE_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  --data-only \
  -f /tmp/production_data.sql \
  --exclude-table auth.users \
  --exclude-table auth.refresh_tokens \
  --exclude-table auth.sessions

echo "📤 Loading data into local database..."
docker exec -i supabase_db_vertical-farm psql -U postgres < /tmp/production_data.sql

# Clean up
rm /tmp/production_data.sql

echo "✅ Production data synced (excluding auth tables for security)"
