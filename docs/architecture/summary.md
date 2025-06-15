# Architecture Summary

## Overview
This document provides a high-level summary of the system architecture for the Vertical Farm project, covering the frontend, backend, database, deployment, and integration points.

---

## System Components
- **Frontend:** Next.js 15 (React 19, TypeScript, Tailwind CSS, Shadcn UI)
- **Backend:** FastAPI (Python 3.13.3)
- **Database:** Supabase (PostgreSQL)
- **Containerization:** Docker Compose
- **CI/CD:** GitHub Actions, Render
- **Monitoring:** Datadog

---

## Component Interactions
- The frontend communicates with the backend via REST API endpoints (FastAPI).
- The backend interacts with Supabase for data storage and authentication.
- Both frontend and backend are containerized and orchestrated via Docker Compose for local development.
- Remote deployment is managed via Render and GitHub Actions workflows.

---

## Data Flow
1. **User Authentication:**
   - Users authenticate via Supabase Auth (frontend uses Supabase JS client, backend validates JWT tokens).
2. **API Requests:**
   - Authenticated frontend requests are sent to FastAPI endpoints.
   - Backend validates tokens, processes business logic, and interacts with Supabase for data operations.
3. **Database:**
   - Supabase manages user, agent, team, tool, session, and log data (see `database-schema.md`).

---

## Authentication Flow
- Frontend uses Supabase JS client for sign-up, login, OAuth, and session management.
- Backend validates JWT tokens from the frontend using the Supabase secret and provides protected endpoints.

---

## Deployment
- **Local:**
  - Use Docker Compose to spin up frontend, backend, and Datadog agent.
  - Environment variables are managed via `.env` files and Docker Compose.
- **Remote/Production:**
  - GitHub Actions workflows build and deploy both frontend and backend to Render.
  - Secrets and service IDs are managed via GitHub repository secrets.

---

## Monitoring
- Datadog agent collects logs and metrics from both frontend and backend containers.

---

## Device Integration
- (Planned) Integration with Home Assistant for device management and automation.

---

## Key Architectural Patterns
- Modular monorepo structure (frontend, backend, shared docs)
- Context-based state management in frontend (React Context API)
- Pydantic models for backend data validation
- RESTful API design
- Environment-based configuration

---

## See Also
- [database-schema.md](./database-schema.md) for detailed data model
- [project-dashboard.txt](./project-dashboard.txt) for project/task tracking
