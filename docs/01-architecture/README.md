# Architecture Documentation

This directory contains comprehensive documentation about the Vertical Farm system architecture, including technical design decisions, component interactions, and architectural patterns.

## 📁 Architecture Documents

### Core Architecture
- **[overview.md](./overview.md)** - Comprehensive system architecture overview including components, challenges, and recommendations
- **[database-schema.md](./database-schema.md)** - Database schema design and relationships
- **[frontend.md](./frontend.md)** - Frontend architecture and component structure
- **[backend.md](./backend.md)** - Backend API architecture and design patterns

### Technical Specifications
- **[edge-computing.md](./edge-computing.md)** - Edge computing implementation details
- **[project-dashboard.txt](./project-dashboard.txt)** - Project tracking and dashboard configuration

## 🏗️ Architecture Overview

The Vertical Farm project follows a modern full-stack architecture:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python 3.13.3
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Deployment**: Docker containerization with GitHub Actions CI/CD
- **Monitoring**: Datadog for observability

## 🔗 Key Architectural Patterns

- **Modular Monorepo**: Organized frontend, backend, and shared documentation
- **API-First Design**: RESTful API with OpenAPI documentation
- **Real-time Updates**: WebSocket subscriptions for live data
- **Row Level Security**: Database-level access control
- **Edge Computing**: Distributed processing capabilities

## 📋 Quick Navigation

- **New to the project?** Start with [overview.md](./overview.md)
- **Database questions?** See [database-schema.md](./database-schema.md)
- **Frontend development?** Check [frontend.md](./frontend.md)
- **Backend development?** Review [backend.md](./backend.md)

## 🔄 Related Documentation

- [Development Guides](../02-development/) - Development workflow and setup
- [API Documentation](../03-api/) - API endpoints and usage
- [Testing Strategy](../05-testing/) - Testing approach and coverage
- [Security Model](../06-security/) - Security implementation details

---

*For the most up-to-date architectural decisions and patterns, refer to the individual documents in this directory.* 