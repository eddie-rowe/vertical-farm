# Environment Switching Guide

## Overview

This project uses separate environment configurations for local development and production:

- **Local Development**: Uses Supabase CLI with `.env.local` (auto-generated)
- **Production Testing**: Uses production Supabase with `.env.production` (manual setup)
- **Actual Production**: Uses GitHub Secrets (no local files)

## Quick Commands

```bash
# Start local development (default)
make up                    # Uses .env.local automatically

# Test with production config locally
make test-prod            # Uses .env.production

# Check current environment
make env-check            # Shows active containers and env files

# Switch back to local
make env-local            # Stops everything and restarts with local config

# Create environment templates
make env-templates        # Creates .env.*.example files
```

## Environment Files

### .env.local (Auto-generated)
- Created automatically by `setup-local-dev.sh`
- Contains Supabase CLI keys
- Used for local development
- DO NOT edit manually - will be overwritten

### .env.production (Manual)
- Create from `.env.production.example`
- Contains real production values
- Used for testing production config locally
- NEVER commit to Git!

### .env (Legacy)
- If you have this file with production values:
  1. Rename it: `mv .env .env.production`
  2. Run: `make env-templates`
  3. Start local dev: `make up`

## Switching Scenarios

### Scenario 1: Fresh Local Development
```bash
make up                   # Auto-creates .env.local with Supabase CLI
```

### Scenario 2: Test Production Config
```bash
# One-time setup
cp .env.production.example .env.production
# Edit .env.production with real values

# Test with production
make test-prod
```

### Scenario 3: Switch Back to Local
```bash
make env-local            # or just: make down && make up
```

### Scenario 4: Debug Environment Issues
```bash
make env-check            # Shows what's running and available
docker ps                 # See all containers
supabase status          # Check Supabase CLI
```

## Security Best Practices

1. **NEVER commit** `.env.production` or any file with real secrets
2. **Use different API keys** for local vs production Datadog
3. **Keep production values** in password manager or secure location
4. **Rotate secrets** if accidentally exposed

## Common Issues

### "Cannot find .env.local"
```bash
make up                   # This will create it automatically
```

### "Cannot find .env.production"
```bash
make env-templates        # Creates template
cp .env.production.example .env.production
# Fill in your production values
```

### "Wrong environment is running"
```bash
make down                 # Stop everything
make env-check           # Verify state
make up                  # Start fresh with local
```

### "Supabase keys are wrong"
```bash
supabase stop
supabase start
make up                  # Regenerates .env.local
```

## Docker Compose Direct Usage

If you prefer using docker-compose directly:

```bash
# Local development
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

# Production config test
docker-compose -f docker-compose.local.yml --env-file .env.production up -d

# View logs with correct env
docker-compose -f docker-compose.local.yml --env-file .env.local logs -f
```

## Environment Variable Priority

Docker Compose loads variables in this order (later overrides earlier):
1. Environment variables from shell
2. `.env` file (if exists - deprecated)
3. `--env-file` specified file (.env.local or .env.production)
4. Environment variables in docker-compose.yml
5. Shell environment variables override all

This is why we use `--env-file` to be explicit about which environment to use.
