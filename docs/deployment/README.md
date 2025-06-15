# Deployment Documentation

This directory contains all documentation related to deploying and managing the vertical-farm application in various environments.

## Contents

### Deployment Guides
- **[workflow.md](./workflow.md)** - Step-by-step deployment procedures
- **[cloudflare-cache-implementation.md](./cloudflare-cache-implementation.md)** - Cloudflare caching setup and configuration

### Infrastructure
- **[infrastructure/](./infrastructure/)** - Infrastructure as code and environment setup
- **[monitoring/](./monitoring/)** - Application monitoring and observability setup

## Purpose

This documentation covers:
- Production deployment procedures
- Infrastructure configuration
- Caching and CDN setup
- Monitoring and observability
- Environment management

## Deployment Environments

The vertical-farm application supports multiple deployment environments:
- **Development** - Local development setup
- **Staging** - Pre-production testing environment  
- **Production** - Live production environment

## Quick Start

1. Review [workflow.md](./workflow.md) for deployment procedures
2. Configure Cloudflare caching using [cloudflare-cache-implementation.md](./cloudflare-cache-implementation.md)
3. Set up monitoring following guides in [monitoring/](./monitoring/)

## Related Documentation

- For CI/CD processes, see [../development/ci-cd-workflow.md](../development/ci-cd-workflow.md)
- For performance optimization, see [../performance/](../performance/)
- For security considerations, see [../security/](../security/)
- For testing in deployment, see [../testing/](../testing/)

## Maintenance

Update deployment documentation when:
- Infrastructure changes are made
- New deployment targets are added
- Monitoring or observability tools change
- Caching strategies are modified 