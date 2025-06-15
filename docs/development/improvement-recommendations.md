# Improvement Recommendations – Vertical Farm

_Last Synced: 2025-05-17_

## Overview
This document summarizes actionable recommendations to improve the codebase, architecture, and development workflow.

---

## Backend
- **Migrate all data storage to Supabase** (replace in-memory DB in `routers.py`).
- **Expand test coverage** for all endpoints and business logic.
- **Review and secure all endpoints** (ensure proper authentication/authorization).
- **Add error handling and logging** for all API routes.

## Frontend
- **Document all reusable components** in `src/components/`.
- **Expand test coverage** (unit and integration tests for forms, context, and API calls).
- **Improve accessibility** (ARIA roles, color contrast, keyboard navigation).

## DevOps & CI/CD
- **Automate environment setup** (scripts for local onboarding).
- **Regularly rotate secrets** and audit environment variables.
- **Monitor deployments** with Datadog and review logs for errors.

## Documentation
- **Keep all docs in sync** with codebase changes (use Hermes agent regularly).
- **Add usage examples** to API and architecture docs.

---

## See Also
- [architecture-challenges.md](./architecture-challenges.md)
- [deployment-workflow.md](./deployment-workflow.md) 