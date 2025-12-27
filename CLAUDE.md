# CLAUDE.md

## Project Context
**Vertical Farm**: Full-stack vertical farm management platform: includes business-focused and IoT hardware integrations.

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15, React 19, TypeScript | Server Components default |
| Backend | FastAPI (Python) | Integrations only |
| Database | Supabase/PostgreSQL | PostgREST for most ops |
| Auth | @supabase/ssr | RLS mandatory |

## Directory Structure

```
vertical-farm/
├── frontend/src/
│   ├── app/                  # Next.js App Router (pages & API routes)
│   │   ├── (app)/            # Authenticated routes (dashboard, farms, devices, etc.)
│   │   ├── (auth)/           # Auth routes (login, signup)
│   │   └── api/              # API route handlers
│   ├── components/
│   │   ├── features/         # Domain components (agriculture, business, devices, monitoring)
│   │   ├── ui/               # Shadcn/ui primitives (50+ components)
│   │   ├── layout/           # Header, Sidebar, MobileNavigation
│   │   └── shared/           # Reusable utilities (charts, forms, metrics)
│   ├── services/
│   │   ├── domain/           # Business services (farm/, devices/, business/, integrations/)
│   │   └── core/base/        # BaseService, BaseCRUDService, BaseRealtimeService
│   ├── types/                # TypeScript interfaces by domain
│   │   ├── farm/layout       # Farm hierarchy types
│   │   ├── integrations/     # Square, Home Assistant types
│   │   ├── grow-recipes.ts   # Recipe management types
│   │   └── common.ts         # Shared utility types
│   ├── contexts/             # React contexts (Auth, Device, Realtime, Theme)
│   ├── hooks/                # Custom hooks (useGrowAutomation, useRealtimeTable, etc.)
│   └── lib/                  # Utilities, Supabase client, validation schemas
├── backend/app/
│   ├── api/v1/endpoints/     # FastAPI routes (home_assistant, square, farm_automation)
│   ├── services/             # Integration services (HA client, Square, caching)
│   ├── models/               # Pydantic models
│   ├── schemas/              # API request/response schemas
│   └── tests/                # Backend tests (unit/, integration/, api/)
├── supabase/
│   ├── migrations/           # SQL migrations (append-only, never modify existing)
│   └── functions/            # Edge Functions (Deno)
├── tests/                    # Root-level integration tests
├── scripts/                  # Setup & deployment utilities
├── docs/                     # Architecture, guides, and reference docs
├── .claude/                  # Claude Code agents, commands, and workflows
└── .github/workflows/        # CI/CD pipelines
```

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

**Slash Commands** (see `.claude/commands/` for details):

**PM Loop** - Project planning & issue creation:
| Command | Purpose |
|---------|---------|
| `/audit` | Snapshot project state (codebase, board, metrics) |
| `/vision` | Define/refine product goals |
| `/research <topic>` | Research solutions for vision gaps |
| `/roadmap` | Create/update implementation roadmap |
| `/issues` | Generate GitHub issues from roadmap |
| `/kanban` | Optimize project board |
| `/pm-reflect` | Review PM effectiveness |

**SDLC Loop** - Development & deployment:
| Command | Purpose |
|---------|---------|
| `/up` | Start development environment |
| `/plan <issue #>` | Analyze issue & create implementation plan |
| `/dev <issue #>` | Feature development with specialized agents |
| `/test` | Run comprehensive local tests |
| `/validate <issue #>` | E2E testing with Playwright |
| `/deploy <issue #>` | Create PR for issue |
| `/review <pr #>` | Check PR review status |
| `/merge <pr #>` | Merge approved PR |
| `/finalize <issue #>` | Finalize approved PR |
| `/pipeline <pr>` | (Optional) Debug CI/CD failures |
| `/reflect` | (Optional) Review development patterns |

**Observation Loop** - Production monitoring & feedback:
| Command | Purpose |
|---------|---------|
| `/status` | Real-time system health check |
| `/slo [service]` | SLO compliance & error budgets |
| `/metrics [scope]` | Trend analysis & anomaly detection |
| `/ux` | User experience patterns (RUM) |
| `/incident <id>` | Incident response workflow |
| `/postmortem <id>` | Generate incident postmortem |
| `/digest` | Weekly synthesis → PM loop input |
| `/autoobs` | Full autonomous observation sweep |

**PM workflow:** `/audit` → `/vision` → `/research` → `/roadmap` → `/issues`
**SDLC workflow:** `/plan 123` → `/dev 123` → `/test` → `/validate 123` → `/deploy 123` → `/merge 68` → `/finalize 123`
**Observation workflow:** `/status` → `/slo` → `/metrics` → `/ux` → `/digest` (or `/autoobs`)

**Three-Loop System:**
```
PM (What to build) → SDLC (How to build) → Observation (Is it working?) → PM
```

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Direct Supabase queries in components | Use domain services |
| `@supabase/auth-helpers-nextjs` | Use `@supabase/ssr` |
| `any` types | Define proper interfaces |
| Modify existing migrations | Create new migrations |
| Hardcode colors/spacing | Use CSS custom properties |
| Service keys in frontend | Use anon key only |

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

- Detailed guides: `docs/` (architecture, development, operations)
- Workflow commands: `.claude/commands/tools/02_development/README.md`
- API docs: `http://localhost:8000/docs` (when backend running)
- Supabase Studio: `http://localhost:54323` (when running locally)

## Current Work

<!-- Updated by slash commands. Query GitHub for authoritative state. -->

| Key | Value |
|-----|-------|
| Issue | - |
| Phase | - |
| PR | - |
| Last Digest | - |
