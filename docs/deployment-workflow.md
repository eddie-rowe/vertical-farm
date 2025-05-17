# Deployment Documentation

## Local Development

### Prerequisites
- Docker & Docker Compose installed
- Node.js (for frontend, if running outside Docker)
- Python 3.13+ (for backend, if running outside Docker)

### Steps
1. Copy `.env.example` to `.env` and fill in required environment variables (Supabase, Datadog, etc.)
2. Run `docker-compose up --build` from the project root
3. Access services:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Datadog Agent: http://localhost:8126 (APM)

---

## Remote/Production Deployment (Render)

### CI/CD Pipeline
- GitHub Actions workflows build and deploy both frontend and backend to Render on push to `main` or manual trigger
- Secrets required in GitHub repo:
  - `RENDER_API_KEY`
  - `RENDER_FRONTEND_SERVICE_ID`
  - `RENDER_BACKEND_SERVICE_ID`

### Steps
1. Set up Render services for frontend and backend
2. Add required secrets to GitHub repository
3. On push to `main`, GitHub Actions will:
   - Build frontend (Node.js/Next.js)
   - Build backend (Python/FastAPI)
   - Deploy both to Render using the deploy-to-render-action

---

## Monitoring
- Datadog agent runs as a container, collecting logs and metrics from both frontend and backend
- Environment variables for Datadog are set in `docker-compose.yml`

---

## References
- [docker-compose.yml](../docker-compose.yml)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [.github/workflows/render-deploy.md](../.github/workflows/render-deploy.md)
