# Schema Management Quick Start

## 🚀 Quick Commands

```bash
# Verify if your schema is up to date
make db-verify         # Compare local vs production

# Sync schema from production
make db-sync          # Pull latest schema

# View your local database
make db-studio        # Opens Supabase Studio
```

## 🔍 Verify Your Schema (Run This First!)

```bash
make db-verify
```

This will:
1. Check your local migration files
2. Connect to production
3. Compare schemas
4. Tell you if they match

### Verification Options:
- **Option a**: Quick check - Just counts migrations
- **Option b**: Full sync - Pulls production schema
- **Option c**: Detailed diff - Shows exact differences

## 📊 Common Scenarios

### Scenario 1: "I don't know if my migrations are current"
```bash
# First, verify
make db-verify
# Choose option 'a' for quick check

# If they don't match:
make db-sync
# Choose option 1 (schema only)
```

### Scenario 2: "Production has changes I don't have locally"
```bash
# Pull the latest schema
make db-sync
# Choose option 1

# Review what changed
git diff supabase/migrations/

# Apply to local database
supabase db reset
```

### Scenario 3: "I want to see exact differences"
```bash
# Run detailed comparison
make db-verify
# Choose option 'c'

# This shows:
# - Local-only migrations (in blue)
# - Remote-only migrations (in yellow)
# - Modified migrations (in red)
```

## 🛠️ Schema Sync Workflow

### Step 1: Check Current State
```bash
# See how many migrations you have
ls -la supabase/migrations/ | wc -l

# Check if Supabase is running
supabase status
```

### Step 2: Verify Against Production
```bash
make db-verify
# Choose 'a' for quick check
```

### Step 3: Sync If Needed
```bash
# If schemas don't match
make db-sync
# Choose option 1 (schema only)
```

### Step 4: Apply to Local Database
```bash
# If Supabase is running
supabase db reset

# If Supabase is not running
make up
```

## ⚠️ Important Notes

1. **Migrations are incremental** - They build on each other
2. **Never edit existing migrations** - Create new ones instead
3. **Always backup before sync** - The script does this automatically
4. **Production data is separate** - Schema sync doesn't copy data

## 🔧 Manual Commands

If you prefer manual control:

```bash
# Pull schema from production
supabase db pull --project-ref your-project-ref

# Generate migration from local changes
supabase db diff -f migration_name

# Apply migrations
supabase migration up

# Reset database (reapplies all migrations)
supabase db reset
```

## 🚨 Troubleshooting

### "Cannot connect to production"
- Check `.env.production` exists
- Verify `SUPABASE_URL` is correct
- Test with: `curl $SUPABASE_URL/rest/v1/`

### "Migrations folder is empty"
- Run `make db-sync` to pull from production
- Or check if you're in the right directory

### "Schema pull creates different migrations"
- This is normal - production might have manual changes
- Review the differences carefully
- Commit the new migrations if they're correct

## 📝 Best Practices

1. **Before starting work**: Run `make db-verify`
2. **After production changes**: Run `make db-sync`
3. **Keep migrations in git**: Always commit migration files
4. **Test locally first**: Apply migrations locally before production
5. **Document changes**: Use descriptive migration names
