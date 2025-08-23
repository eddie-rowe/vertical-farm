# Architecture Reference Documentation

This directory contains comprehensive technical documentation for the VerticalFarm OS architecture. These documents provide in-depth coverage of system design, implementation patterns, and architectural decisions.

## 📚 Documentation Structure

### Core Architecture
- **[System Architecture](./system-architecture.md)** - Complete system design and component interactions
- **[Service Layer Architecture](./service-layer.md)** - Critical service layer patterns and implementation
- **[Data Flow Patterns](./data-flow.md)** - How data moves through the system
- **[Architecture Patterns](./patterns.md)** - Key architectural patterns and principles

### Component Architecture
- **[Frontend Architecture](./frontend-architecture.md)** - Next.js 15 application architecture
- **[Backend Architecture](./backend-architecture.md)** - FastAPI service architecture
- **[Database Design](./database-design.md)** - PostgreSQL schema and relationships
- **[Edge Computing](./edge-computing.md)** - Cloudflare Workers and Edge Functions

### Feature Architecture
- **[Authentication & Authorization](./authentication.md)** - Security and access control
- **[Automation System](./automation-architecture.md)** - Scheduled tasks and rules engine
- **[Caching Strategy](./caching-strategy.md)** - Performance optimization through caching
- **[Layer Overlay System](./layer-overlay-system.md)** - Visual information layers

### Integration & Deployment
- **[Service Integration](./service-integration.md)** - How services communicate
- **[Deployment Architecture](./deployment.md)** - Infrastructure and deployment patterns
- **[Monitoring & Observability](./monitoring.md)** - System health and performance tracking

### Patterns & Best Practices
- **[Component Patterns](./component-patterns.md)** - React component architecture
- **[API Design Patterns](./api-patterns.md)** - RESTful API conventions
- **[Security Patterns](./security-patterns.md)** - Security best practices
- **[Performance Patterns](./performance-patterns.md)** - Optimization strategies

## 🎯 How to Use This Documentation

### For New Developers
1. Start with [System Architecture](./system-architecture.md) for the big picture
2. Read the architecture relevant to your role (Frontend/Backend/Full-Stack)
3. Study [Architecture Patterns](./patterns.md) to understand our conventions
4. Review [Service Layer Architecture](./service-layer.md) - this is critical!

### For Experienced Developers
- Use these documents as reference when implementing new features
- Ensure new code follows the patterns documented here
- Update documentation when making architectural changes
- Consult specific sections as needed

### For Architects & Tech Leads
- Review all documents for complete system understanding
- Use for architectural decision making
- Reference in design reviews
- Keep documentation updated with architectural evolution

## 🔑 Critical Concepts

### Service Layer (Most Important!)
**NEVER bypass the service layer** - All data operations MUST go through services. This is our most critical architectural pattern.

```typescript
// ✅ CORRECT
const farmService = FarmService.getInstance()
const farms = await farmService.getFarmsByUser(userId)

// ❌ WRONG - Never direct Supabase calls
const { data } = await supabase.from('farms').select('*')
```

### Multi-Tenant Architecture
Each farm is completely isolated, ensuring:
- Data privacy between users
- Independent automation execution
- Failure isolation
- Scalable operations

### Real-time Architecture
The system uses a hybrid approach:
- **Cached data** for static/slow-changing content
- **Real-time subscriptions** for live updates
- **Service layer** for business logic

## 📋 Quick Reference

### Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, React 19 | User interface |
| Backend | FastAPI, Python 3.13 | Business logic |
| Database | PostgreSQL (Supabase) | Data persistence |
| Edge | Cloudflare Workers | Caching & IoT |
| Real-time | Supabase Realtime | Live updates |
| Auth | Supabase Auth | Authentication |

### Key Patterns
- **Singleton Services** - `getInstance()` pattern
- **Server Components** - Default for pages
- **Row Level Security** - Database isolation
- **Event-Driven Updates** - Real-time subscriptions
- **Layered Architecture** - Clear separation of concerns

### Performance Targets
- Initial page load: < 1s
- API response time: < 200ms
- Real-time latency: < 100ms
- Cache hit ratio: > 80%

## 🔄 Document Maintenance

These documents are living references that should be updated when:
- Making significant architectural changes
- Adding new system components
- Changing core patterns
- Deprecating existing patterns

Last comprehensive review: January 2025

## 📚 Related Documentation

- [Getting Started Guide](/docs/getting-started/)
- [API Documentation](/docs/03-api/)
- [Development Guide](/docs/02-development/)
- [Deployment Guide](/docs/04-deployment/)
- [Security Documentation](/docs/06-security/)

---

*For questions about the architecture or suggestions for improvements, please consult the development team or submit a pull request with proposed changes.*