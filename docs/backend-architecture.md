# Backend Architecture

## Framework & Stack
- **Framework:** FastAPI (Python 3.13.3)
- **Containerization:** Docker
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase JWT validation

---

## Main Files
- `main.py` — FastAPI app entry, CORS, health checks, router inclusion
- `routers.py` — API endpoints for item CRUD (protected by auth)
- `models.py` — Pydantic models (e.g., Item)
- `auth.py` — JWT validation using Supabase secret
- `supabase_client.py` — Supabase client setup

---

## API Endpoints
- `/health`, `/healthz` — Health checks
- `/supabase-items` — Fetches items from Supabase table
- `/items/` — CRUD endpoints for items (protected)

---

## Data Flow
- Frontend sends authenticated requests (JWT) to FastAPI endpoints
- Backend validates JWT, processes logic, interacts with Supabase
- Data is returned to frontend or stored in Supabase

---

## Authentication Flow
- JWT tokens issued by Supabase (frontend)
- Backend validates tokens using Supabase secret and `jose.jwt`
- Protected endpoints require valid JWT in Authorization header

---

## Testing
- Uses `pytest` and FastAPI TestClient for endpoint tests
- Example: health check, supabase-items, (commented) item creation

---

## See Also
- [architecture-summary.md](./architecture-summary.md)
- [database-schema.md](./database-schema.md)
