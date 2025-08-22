# Database Sync Guide

## Overview

Supabase CLI provides several ways to keep your local and production databases in sync:

1. **Migrations** (Already in place) - Schema structure
2. **Seed Data** - Sample/test data for development
3. **Production Sync** - Pull latest schema changes from production

## Current Setup

Your project has **40 migration files** that define:
- Tables and columns
- Functions and stored procedures
- Row Level Security (RLS) policies
- Views and indexes
- Queue system setup

When you run `make up`, these migrations are automatically applied to your local database.

## Sync Scenarios

### 1. Fresh Local Setup (Default)
```bash
make up                    # Applies all migrations
supabase studio           # View your database
```

Your local database will have:
- ✅ All tables and schema from migrations
- ✅ Empty tables (no data)
- ✅ Same structure as production

### 2. Sync Latest Production Schema
If production has schema changes not in migrations:

```bash
# Pull latest schema from production
./scripts/sync-production-schema.sh

# This will:
# 1. Connect to production (using .env.production)
# 2. Generate new migration files for any changes
# 3. Apply them to local database
```

### 3. Add Seed Data
Create test data for local development:

```bash
# Create a seed file
cat > supabase/seed.sql << 'EOF'
-- Insert test users
INSERT INTO auth.users (id, email) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test@example.com');

-- Insert test farms
INSERT INTO farms (id, name, user_id, location) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Farm', '00000000-0000-0000-0000-000000000001', 'Test Location');

-- Insert test devices
INSERT INTO devices (id, farm_id, name, type) VALUES 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Test Sensor', 'sensor');
EOF

# Apply seed data
supabase db reset          # Resets DB and applies migrations + seed
```

### 4. Export Production Data (Carefully!)
For specific reference data only:

```bash
# DON'T export user data or sensitive information
# DO export things like:
# - Device types
# - Grow recipes
# - Configuration defaults

# From Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run: SELECT * FROM grow_recipes WHERE is_public = true
# 3. Export as CSV
# 4. Import to local via Supabase Studio
```

## Migration Workflow

### Check Migration Status
```bash
# See which migrations have been applied
supabase migration list

# View migration history
supabase db migrations list
```

### Create New Migrations
```bash
# After making changes in Supabase Studio
supabase db diff -f my_new_feature

# Creates: supabase/migrations/[timestamp]_my_new_feature.sql
```

### Apply Migrations
```bash
# Apply pending migrations
supabase migration up

# Reset and reapply all migrations
supabase db reset
```

## Best Practices

### ✅ DO:
- Keep migrations in version control
- Use migrations for schema changes
- Create seed data for testing
- Pull production schema periodically
- Test migrations locally first

### ❌ DON'T:
- Copy production user data locally
- Edit existing migration files
- Skip migrations and modify DB directly
- Commit .env.production with real credentials
- Use production API keys locally

## Common Commands

```bash
# View your local database
supabase studio

# Check database status
supabase status

# Reset database (drops and recreates)
supabase db reset

# Create a DB dump
supabase db dump -f backup.sql

# Restore from dump
supabase db restore -f backup.sql
```

## Sync Checklist

When starting fresh:
- [ ] Run `make up` to start Supabase
- [ ] Verify migrations applied: `supabase migration list`
- [ ] Check schema in Studio: `supabase studio`
- [ ] Add seed data if needed
- [ ] Run `make test-prod` to test production connection

When production schema changes:
- [ ] Pull latest changes: `./scripts/sync-production-schema.sh`
- [ ] Review new migration files
- [ ] Test locally
- [ ] Commit new migrations

## Troubleshooting

### "Schema out of sync"
```bash
# Pull latest from production
supabase db pull --project-ref [your-project-ref]

# Diff against local
supabase db diff

# Apply changes
supabase migration up
```

### "Migration failed"
```bash
# Check migration status
supabase migration list

# Reset and try again
supabase db reset

# Check logs
supabase logs
```

### "Can't connect to production"
```bash
# Verify credentials
cat .env.production | grep SUPABASE_URL

# Test connection
curl [your-supabase-url]/rest/v1/

# Check project ref
# URL format: https://[project-ref].supabase.co
```
