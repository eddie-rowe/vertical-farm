# Architectural Challenges & Risks

## Overview
This document summarizes key architectural challenges, technical debt, and potential risks identified during codebase analysis.

---

## Scalability
- **Backend in-memory DB:** The current backend (`routers.py`) uses an in-memory dictionary for items, which is not persistent or scalable. Migration to persistent storage (Supabase) is needed for production.
- **Supabase as single source:** All persistent data is managed via Supabase. Consider fallback or backup strategies for high availability.

---

## Security
- **JWT Secret Management:** Supabase JWT secret is required in backend environment. Ensure secrets are not committed and are securely managed.
- **Auth Coverage:** Only item endpoints are protected. Review all endpoints for proper authentication and authorization.

---

## Maintainability
- **Monorepo Complexity:** The project uses a monorepo structure. Clear documentation and consistent conventions are needed to avoid confusion.
- **Test Coverage:** Some backend tests are commented out or missing. Increase test coverage for critical endpoints and flows.

---

## CI/CD & Deployment
- **Secrets Management:** Render and GitHub Actions require secrets for deployment. Ensure all required secrets are set and rotated regularly.
- **Environment Parity:** Ensure local, staging, and production environments are as similar as possible to avoid deployment issues.

---

## Device Integration
- **Home Assistant Integration:** Device integration is planned but not yet implemented. Define clear interfaces and security boundaries for future work.

---

## Recommendations
- Migrate backend data storage to Supabase for all models
- Expand test coverage (backend and frontend)
- Document and automate environment setup
- Plan for Home Assistant integration with clear API contracts

---

## See Also
- [architecture-summary.md](./architecture-summary.md)
- [database-schema.md](./database-schema.md)
