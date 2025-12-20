# Docker Guide

## Quick Reference

| Command | Purpose |
|---------|---------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `supabase status` | Check Supabase status |
| `supabase db reset` | Reset database |

## Local Development

### Prerequisites
- Docker Desktop
- Supabase CLI: `brew install supabase/tap/supabase`

### Start Development
```bash
make up
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Supabase Studio: http://localhost:54323

### Daily Workflow
```bash
make up                  # Morning: start everything
make logs               # Check for errors
make down               # End of day: stop everything
```

### Common Tasks
```bash
# Restart a service
docker-compose -f docker-compose.local.yml restart backend

# View specific service logs
docker logs vf-backend-local -f

# Rebuild container
docker-compose -f docker-compose.local.yml build --no-cache backend

# Include Datadog monitoring
docker-compose -f docker-compose.local.yml --profile monitoring up -d
```

## Production (unRAID)

### Deployment
- **Automatic**: Push to `main` triggers `deploy-unraid.yml`
- **Manual**: GitHub Actions workflow dispatch

### Required Secrets
Configure in GitHub repository settings:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`, `GHCR_TOKEN`
- `DD_API_KEY`, `DD_SITE`, `DD_SERVICE`

### Manual Container Management
```bash
# View running containers
docker ps --filter "network=vertical-farm-network"

# View logs
docker logs backend -f --tail=100

# Restart service
docker restart backend

# Update a service
docker pull ghcr.io/eddie-rowe/vertical-farm/backend:latest
docker rm -f backend
docker run -d --name backend --network vertical-farm-network -p 8000:8000 ...
```

## Local vs Production

| Aspect | Local | Production |
|--------|-------|------------|
| Deployment | docker-compose | Individual containers |
| Supabase | Local CLI | Cloud instance |
| Hot Reload | Enabled | Disabled |
| Monitoring | Optional | Always enabled |
| Runner | Local | Self-hosted on unRAID |

## Troubleshooting

### Supabase Issues
```bash
supabase status          # Check status
supabase stop && supabase start  # Reset
```

### Port Conflicts
```bash
lsof -i :3000           # Find process using port
kill -9 <PID>           # Kill it
```

### Container Issues
```bash
docker-compose -f docker-compose.local.yml logs backend  # Check logs
docker-compose -f docker-compose.local.yml build --no-cache backend  # Rebuild
```

### Connection to Supabase
- From container: `http://host.docker.internal:54321`
- From host: `http://localhost:54321`
