# Docker Quick Reference

## 🚀 Most Common Commands

### Local Development
```bash
# Start everything (recommended)
make up

# View logs
make logs                # All services
docker logs vf-backend-local -f    # Specific service

# Stop everything
make down

# Restart a service
docker-compose -f docker-compose.local.yml restart backend
```

### Supabase CLI
```bash
# Check status
supabase status

# View Supabase logs
supabase logs

# Reset database
supabase db reset

# Run migrations
supabase migration up
```

## 🔧 Environment Setup

### First Time Setup
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Run: `make up`
3. Done! Keys are auto-populated in `.env.local`

### Manual Environment Override
```bash
# Create .env.local with custom values
cp .env.local.example .env.local
# Edit .env.local with your values

# Start with custom env
docker-compose -f docker-compose.local.yml --env-file .env.local up
```

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
```bash
# From container, Supabase is at:
http://host.docker.internal:54321

# From host machine:
http://localhost:54321
```

### "Port already in use"
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### "Container won't start"
```bash
# Check logs
docker-compose -f docker-compose.local.yml logs backend

# Rebuild if needed
docker-compose -f docker-compose.local.yml build --no-cache backend
```

## 📊 Monitoring

### Include Datadog Locally
```bash
# Start with monitoring profile
docker-compose -f docker-compose.local.yml --profile monitoring up -d
```

### View Container Stats
```bash
# Real-time stats
docker stats

# Container details
docker inspect vf-backend-local
```

## 🔄 Daily Workflow

### Morning Start
```bash
make up                  # Start everything
make logs               # Check for errors
```

### During Development
```bash
# Backend changes - auto-reload enabled
# Frontend changes - auto-reload enabled

# If you need to restart a service
docker-compose -f docker-compose.local.yml restart backend
```

### End of Day
```bash
make down               # Stops everything
# Choose 'N' to keep Supabase running
```

## 🚢 Production Commands

### Deploy to Production
```bash
# Automatic: Push to main branch triggers deploy-unraid.yml workflow
# Manual: Use GitHub Actions workflow dispatch
```

### View Production Logs (on unRAID)
```bash
# SSH to unRAID server, then:
docker logs backend -f --tail=100
docker logs frontend -f --tail=100
docker logs dd-agent -f --tail=100
```

### Emergency Rollback
```bash
# On unRAID server
# Pull previous image tag
docker pull ghcr.io/eddie-rowe/vertical-farm/backend:previous-sha
docker rm -f backend
docker run -d --name backend ... # with all env vars

# Or trigger workflow with specific image tag
```

### Container Management
```bash
# View all vertical farm containers
docker ps --filter "network=vertical-farm-network"

# Restart a service
docker restart backend

# Update a single service (example)
docker pull ghcr.io/eddie-rowe/vertical-farm/frontend:latest
docker rm -f frontend
docker run -d --name frontend ... # redeploy
```
