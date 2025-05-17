# Security Model – Vertical Farm

_Last Synced: 2025-05-17_

## Overview
This document outlines the security architecture, authentication flows, secret management, and best practices for the Vertical Farm project.

---

## Authentication & Authorization
- **Supabase JWT Auth:**
  - All protected backend endpoints require a valid Supabase JWT token in the `Authorization: Bearer <token>` header.
  - Tokens are validated server-side using the Supabase JWT secret (see `auth.py`).
- **Frontend:**
  - Uses Supabase JS client for sign-up, login, OAuth, and session management.
- **Backend:**
  - Validates JWT tokens for all protected endpoints.
  - Only `/health` and `/healthz` are public.

---

## Secret Management
- **Environment Variables:**
  - Secrets (Supabase JWT, API keys) are stored in `.env` files (local) and as secrets in Render/GitHub Actions (production).
  - Never commit secrets to version control.
- **Rotation:**
  - Rotate secrets regularly and update deployment environments accordingly.

---

## Security Best Practices
- **Least Privilege:** Only expose required endpoints and data.
- **Input Validation:** All request data is validated using Pydantic models.
- **CORS:** Only trusted origins are allowed (see `main.py`).
- **HTTPS:** Enforced in production deployments.
- **Audit:** Monitor logs for suspicious activity (Datadog integration).

---

## Recommendations
- Review all endpoints for proper authentication and authorization.
- Regularly audit secrets and environment variables.
- Expand test coverage for security-critical flows.

---

## See Also
- [backend-architecture.md](./backend-architecture.md)
- [deployment-workflow.md](./deployment-workflow.md) 