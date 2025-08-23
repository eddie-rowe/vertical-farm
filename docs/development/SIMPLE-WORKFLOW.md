# Simple Developer Workflow

## Core Commands Only

### 🚀 Start Local Development
```bash
# Start Supabase (includes database, auth, storage, etc.)
supabase start

# Start application containers
docker-compose -f docker-compose.local.yml --env-file .env.local up -d
```

### 🔍 Check Schema Status
```bash
# See if production has new changes
supabase db pull --project-ref YOUR_PROJECT_REF

# View local database
supabase studio
```

### 🛑 Stop Everything
```bash
# Stop containers
docker-compose -f docker-compose.local.yml down

# Stop Supabase
supabase stop
```

## Environment Setup

### First Time Only
```bash
# 1. Start Supabase
supabase start

# 2. Get your keys (copy these)
supabase status

# 3. Create .env.local with the keys from step 2
```

### Switch Between Environments
```bash
# Local development (default)
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

# Test with production config
docker-compose -f docker-compose.local.yml --env-file .env.production up -d
```

## That's It!

No scripts, no wrappers. Just:
- `supabase` for database
- `docker-compose` for containers
- `.env.local` or `.env.production` for config
