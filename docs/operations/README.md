# Operations

## Deployment

| Doc | Description |
|-----|-------------|
| [Deployment Guide](./deployment.md) | Production deployment (Cloudflare, unRAID) |

## Key Metrics

| Service | Target | Response Time |
|---------|--------|---------------|
| API | 99.9% uptime | <200ms p95 |
| Frontend | 99.9% uptime | <1s FCP |
| Database | 99.95% uptime | <50ms p95 |

## Quick Reference

```bash
# View production logs (on unRAID)
docker logs backend -f --tail=100
docker logs frontend -f --tail=100

# Check service health
docker ps --filter "network=vertical-farm-network"

# Restart services
docker restart backend
docker restart frontend
```

## Related

- [Docker Guide](../development/docker.md) - Container workflow
- [Database Guide](../development/database.md) - Schema management
- [CLAUDE.md](/CLAUDE.md) - Architecture standards
