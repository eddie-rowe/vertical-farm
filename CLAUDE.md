# CLAUDE.md - AI Development Quick Reference

## Project Context
**Vertical Farm**: Full-stack farm management platform with IoT integration.

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15, React 19, TypeScript | Server Components default |
| Backend | FastAPI (Python) | Integrations only |
| Database | Supabase/PostgreSQL | PostgREST for most ops |
| Auth | @supabase/ssr | RLS mandatory |

## Critical Rules (Non-Negotiable)

1. **Service layer required** - ALL data ops through `services/domain/*`
2. **Use PostgREST** - FastAPI only for external integrations
3. **RLS on all tables** - Farm data isolated by `user_id`
4. **Type everything** - No `any`, use proper interfaces

## Service Layer Pattern

```typescript
// CORRECT: Always use domain services
import { FarmService } from "@/services/domain/farm/FarmService";
const service = FarmService.getInstance();
const farm = await service.create(data);

// WRONG: Never bypass
const { data } = await supabase.from("farms").insert(data);
```

**Service Inheritance:**
- `BaseService` - Auth, logging, error handling
- `BaseCRUDService` - Standard CRUD operations
- `BaseRealtimeService` - Real-time subscriptions

## Domain Hierarchy
```
Farm → Rows → Racks → Shelves → [Devices, Schedules, Grows]
```
All relationships must be maintained. Use `farm_id` for RLS.

## File Locations

| Category | Path |
|----------|------|
| Domain services | `frontend/src/services/domain/` |
| Base classes | `frontend/src/services/core/base/` |
| Types | `frontend/src/types/` |
| API routes | `frontend/src/app/api/` |
| Feature components | `frontend/src/components/features/` |
| Migrations | `supabase/migrations/` (never modify existing) |

## Frontend Patterns

**Server vs Client Components:**
- Default: Server Component (no directive)
- Interactive: Add `"use client"` only when needed
- Data fetching: Server Components with `"use cache"`

**Import Order:**
```typescript
// 1. React/Next
import { useState } from "react";
import { useRouter } from "next/navigation";
// 2. External
import toast from "react-hot-toast";
// 3. Services (first in internal imports)
import { FarmService } from "@/services/domain/farm/FarmService";
// 4. Types
import type { Farm } from "@/types/farm";
// 5. Components
import { Button } from "@/components/ui/button";
```

## Backend (FastAPI) - When to Use

**Use FastAPI for:**
- Home Assistant integration
- Square POS integration
- External API orchestration
- Background task processing

**Use Supabase PostgREST for:**
- All CRUD operations
- Real-time subscriptions
- Database-driven features (90% of features)

## Testing Rules

**DO:**
- Jest unit tests for services
- Playwright E2E for user flows
- Mock external dependencies

**DON'T:**
- @testing-library/user-event (forbidden)
- Complex component integration tests
- Tests that bypass service layer

## Quick Commands

```bash
make help           # Show all commands
make test-all       # Full CI pipeline locally
make db-status      # Database & migrations status
make logs           # View service logs
```

**Slash Commands:**
- `/up` - Start development environment
- `/test` - Run tests
- `/plan` - Create implementation plan

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Direct Supabase queries in components | Use domain services |
| `@supabase/auth-helpers-nextjs` | Use `@supabase/ssr` |
| `any` types | Define proper interfaces |
| Modify existing migrations | Create new migrations |
| Hardcode colors/spacing | Use CSS custom properties |
| Service keys in frontend | Use anon key only |

## Type Locations

| Domain | Path |
|--------|------|
| Farm/Layout | `@/types/farm/layout` |
| Grow recipes | `@/types/grow-recipes` |
| Square integration | `@/types/integrations/square` |
| Common utilities | `@/types/common` |

## RLS Policy Pattern

```sql
-- All farm-related tables need this pattern
CREATE POLICY "Users can access their farm data"
ON table_name FOR ALL
USING (farm_id IN (
  SELECT id FROM farms WHERE user_id = auth.uid()
));
```

## Performance Targets

- Lighthouse: >90
- API response: <200ms
- First Contentful Paint: <1.5s
- Use `"use cache"` for expensive ops

## Additional Resources

- Detailed patterns: `.cursor/rules/`
- API docs: `http://localhost:8000/docs` (when backend running)
- Supabase Studio: `http://localhost:54323` (when running locally)
