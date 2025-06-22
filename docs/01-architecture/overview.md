# Architecture Overview

## System Summary

This document provides a comprehensive overview of the Vertical Farm project architecture, covering components, interactions, challenges, and recommendations.

## System Components

- **Frontend:** Next.js 15 (React 19, TypeScript, Tailwind CSS, Shadcn UI)
- **Backend:** FastAPI (Python 3.13.3)
- **Database:** Supabase (PostgreSQL)
- **Containerization:** Docker Compose
- **CI/CD:** GitHub Actions, Render
- **Monitoring:** Datadog

## Component Interactions

- The frontend communicates with the backend via REST API endpoints (FastAPI)
- The backend interacts with Supabase for data storage and authentication
- Both frontend and backend are containerized and orchestrated via Docker Compose for local development
- Remote deployment is managed via Render and GitHub Actions workflows

## Data Flow

### 1. User Authentication
- Users authenticate via Supabase Auth (frontend uses Supabase JS client, backend validates JWT tokens)

### 2. API Requests
- Authenticated frontend requests are sent to FastAPI endpoints
- Backend validates tokens, processes business logic, and interacts with Supabase for data operations

### 3. Database Operations
- Supabase manages user, agent, team, tool, session, and log data (see `database-schema.md`)

## Authentication Flow

- Frontend uses Supabase JS client for sign-up, login, OAuth, and session management
- Backend validates JWT tokens from the frontend using the Supabase secret and provides protected endpoints

## Deployment Architecture

### Local Development
- Use Docker Compose to spin up frontend, backend, and Datadog agent
- Environment variables are managed via `.env` files and Docker Compose

### Production
- GitHub Actions workflows build and deploy both frontend and backend to Render
- Secrets and service IDs are managed via GitHub repository secrets

## Monitoring & Observability

- Datadog agent collects logs and metrics from both frontend and backend containers

## Future Integrations

- (Planned) Integration with Home Assistant for device management and automation

## Key Architectural Patterns

- Modular monorepo structure (frontend, backend, shared docs)
- Context-based state management in frontend (React Context API)
- Pydantic models for backend data validation
- RESTful API design
- Environment-based configuration

## Architectural Challenges & Risks

### Scalability Concerns

#### Backend Data Storage
- **Challenge**: The current backend (`routers.py`) uses an in-memory dictionary for items, which is not persistent or scalable
- **Risk**: Data loss and performance issues in production
- **Recommendation**: Complete migration to persistent storage (Supabase) for all models

#### Database Dependency
- **Challenge**: All persistent data is managed via Supabase as single source
- **Risk**: Single point of failure
- **Recommendation**: Consider fallback or backup strategies for high availability

### Security Considerations

#### JWT Secret Management
- **Challenge**: Supabase JWT secret is required in backend environment
- **Risk**: Security compromise if secrets are exposed
- **Recommendation**: Ensure secrets are not committed and are securely managed with regular rotation

#### Authentication Coverage
- **Challenge**: Only item endpoints are currently protected
- **Risk**: Unauthorized access to unprotected endpoints
- **Recommendation**: Review all endpoints for proper authentication and authorization

### Maintainability Issues

#### Monorepo Complexity
- **Challenge**: The project uses a monorepo structure
- **Risk**: Configuration confusion and development overhead
- **Recommendation**: Maintain clear documentation and consistent conventions

#### Test Coverage
- **Challenge**: Some backend tests are commented out or missing
- **Risk**: Undetected bugs and regression issues
- **Recommendation**: Increase test coverage for critical endpoints and flows

### CI/CD & Deployment Risks

#### Secrets Management
- **Challenge**: Render and GitHub Actions require secrets for deployment
- **Risk**: Service disruption if secrets are compromised or expired
- **Recommendation**: Ensure all required secrets are set and rotated regularly

#### Environment Parity
- **Challenge**: Differences between local, staging, and production environments
- **Risk**: Deployment failures and unexpected behavior
- **Recommendation**: Ensure environments are as similar as possible

### Future Integration Challenges

#### Home Assistant Integration
- **Challenge**: Device integration is planned but not yet implemented
- **Risk**: Security vulnerabilities and performance issues
- **Recommendation**: Define clear interfaces and security boundaries for future work

## Priority Recommendations

### High Priority
1. **Complete Supabase Migration**: Migrate all backend data storage to Supabase
2. **Expand Test Coverage**: Implement comprehensive backend and frontend testing
3. **Security Audit**: Review and protect all API endpoints

### Medium Priority
1. **Environment Documentation**: Document and automate environment setup
2. **Monitoring Enhancement**: Expand monitoring coverage and alerting
3. **Backup Strategy**: Implement database backup and recovery procedures

### Future Planning
1. **Home Assistant Integration**: Plan integration with clear API contracts
2. **Performance Optimization**: Implement caching and performance monitoring
3. **High Availability**: Design fallback and redundancy strategies

## Related Documentation

- [Database Schema](./database-schema.md) - Detailed data model
- [Frontend Architecture](./frontend.md) - Frontend-specific details
- [Backend Architecture](./backend.md) - Backend-specific details
- [Security Model](../06-security/model.md) - Security implementation details
- [Testing Strategy](../05-testing/README.md) - Testing approach and coverage

---

*Last Updated: [Current Date]*
*Consolidated from: summary.md, challenges.md* 