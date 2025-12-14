# Junior Developer Onboarding Guide

Welcome to the Vertical Farm project! This guide will help you set up your local development environment and get started contributing.

## Prerequisites

Before starting, ensure you have these tools installed:

| Tool | Version | Install Command | Purpose |
|------|---------|-----------------|---------|
| Docker Desktop | Latest | [Download](https://www.docker.com/products/docker-desktop) | Container runtime |
| Supabase CLI | Latest | `brew install supabase/tap/supabase` | Local database |
| Node.js | 20+ | `brew install node` | Frontend runtime |
| jq | Latest | `brew install jq` | JSON parsing (recommended) |
| Git | Latest | `brew install git` | Version control |
| act | Latest | `brew install act` | Local CI testing (optional) |

### Verify Prerequisites

```bash
# Check all tools are installed
docker --version
supabase --version
node --version
jq --version
git --version
act --version  # Optional - for local CI testing
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm
```

### 2. Start the Development Environment

If you have Claude Code installed, simply run:

```
/up
```

**Or manually:**

```bash
# Start Supabase (local database)
supabase start

# Create environment file with credentials
./scripts/create-env-local.sh

# Update URLs for Docker networking
sed -i '' 's|SUPABASE_URL=http://localhost:54321|SUPABASE_URL=http://host.docker.internal:54321|g' .env.local

# Initialize database with migrations and seed data
supabase db reset

# Start application containers
docker-compose -f docker-compose.local.yml --env-file .env.local up -d
```

### 3. Access the Application

After setup completes, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js application |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Supabase Studio | http://localhost:54323 | Database admin |

### 4. Log In

Use these test credentials:

- **Email:** `testuser123@gmail.com`
- **Password:** `password123`

## Project Structure

```
vertical-farm/
├── frontend/                 # Next.js 15 application
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   │   ├── features/    # Business domain components
│   │   │   └── ui/          # Reusable UI (shadcn/ui)
│   │   ├── services/        # Data access layer (IMPORTANT!)
│   │   │   ├── core/        # Base services
│   │   │   └── domain/      # Business logic
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── models/          # Pydantic models
│   └── pyproject.toml
├── supabase/                 # Database
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # Test data
└── docs/                     # Documentation
```

## Key Concepts

### Service Layer (Critical!)

**All data operations MUST go through services.** Never call Supabase directly from components.

```typescript
// CORRECT: Use the service
import { FarmService } from '@/services/domain/farm/FarmService';

const farms = await FarmService.getInstance().getAll();

// WRONG: Direct Supabase call
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('farms').select('*'); // NO!
```

### Farm Hierarchy

Data follows this structure:
```
Farm → Rows → Racks → Shelves → Grows/Devices
```

Each level has its own service (FarmService, RowService, RackService, etc.).

### Server vs Client Components

- **Server Components** (default): For data fetching, no interactivity
- **Client Components** (`'use client'`): For interactive features

```tsx
// Server Component (default) - good for data fetching
export default async function FarmsPage() {
  const farms = await FarmService.getInstance().getAll();
  return <FarmList farms={farms} />;
}

// Client Component - for interactivity
'use client';
export default function FarmForm() {
  const [name, setName] = useState('');
  // ...
}
```

## Working on GitHub Issues

### 1. Find an Issue

Look for issues labeled:
- `good first issue` - Great for beginners
- `help wanted` - Ready for contribution
- `bug` - Fix something broken
- `enhancement` - Add new features

### 2. Create a Branch

```bash
# Update main branch
git checkout main
git pull

# Create feature branch
git checkout -b <issue-number>-<short-description>
# Example: git checkout -b 42-add-species-filter
```

### 3. Make Changes

1. Read the issue carefully
2. Understand existing code patterns (check similar features)
3. Use the service layer for data operations
4. Follow TypeScript types strictly
5. Test your changes locally

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add species filter to grow recipes

Closes #42"
git push -u origin <branch-name>
```

### 5. Create Pull Request

- Use the PR template
- Link the issue
- Add screenshots for UI changes
- Request review from team

## Common Commands

### Development

```bash
# View logs
docker-compose -f docker-compose.local.yml logs -f

# Restart containers
docker-compose -f docker-compose.local.yml restart

# Rebuild after code changes (if hot reload fails)
docker-compose -f docker-compose.local.yml up -d --build

# Stop everything
docker-compose -f docker-compose.local.yml down
supabase stop
```

### Database

```bash
# Reset database (rerun migrations + seed)
supabase db reset

# View database in browser
open http://localhost:54323

# Create new migration
supabase migration new <migration_name>

# Apply migrations only (no reset)
supabase migration up
```

### Testing

```bash
# Run full local CI (mirrors GitHub Actions) - RECOMMENDED
/test              # Claude Code command

# Or run local CI manually with act
act -W .github/workflows/test-backend.yml -j test-matrix

# Individual tests (for quick iteration)
cd frontend && npm test
cd backend && pytest

# E2E tests (Playwright)
cd frontend && npm run test:e2e
```

### Local CI with act

The `/test` command runs GitHub Actions locally using [nektos/act](https://github.com/nektos/act). This ensures your code will pass CI before you push.

```bash
/test              # Full CI (tests + security scans)
/test --quick      # Quick mode (unit tests only)
/test --security   # Security scans only
```

## Seed Data Available

Your local environment includes test data for all major features:

| Entity | Count | Notes |
|--------|-------|-------|
| Farms | 3 | farm01, Test Farm 2, Microgreens Lab |
| Species | 9 | basil, lettuce, spinach, arugula, kale, etc. |
| Grow Recipes | 5 | Various crop types and durations |
| Grows | 5 | Different stages: active, germination, harvested |
| Shelves | 12 | Across multiple farms |

## Integrations (Not Configured Locally)

**Home Assistant** and **Square POS** integrations require additional configuration and real services. In local development:

- Integration pages will show "Not Connected"
- This is expected behavior
- Focus on core farm management features
- See team lead if you need to test integrations

## Troubleshooting

### "Cannot connect to Supabase"

```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start
```

### "Port already in use"

```bash
# Find what's using the port
lsof -i :3000  # or :8000, :54321, etc.

# Kill the process
kill -9 <PID>
```

### "Database migration failed"

```bash
# Check migration status
supabase migration list

# Reset everything
supabase db reset
```

### "Docker container won't start"

```bash
# View detailed logs
docker-compose -f docker-compose.local.yml logs <service-name>

# Rebuild containers
docker-compose -f docker-compose.local.yml up -d --build

# Nuclear option: remove everything and restart
docker-compose -f docker-compose.local.yml down -v
docker system prune -f
./scripts/create-env-local.sh
docker-compose -f docker-compose.local.yml up -d
```

### "Environment variables not loading"

```bash
# Regenerate .env.local
rm .env.local
./scripts/create-env-local.sh

# Verify keys exist
cat .env.local | grep SUPABASE
```

## Getting Help

- **Slack/Discord:** Ask in #dev-help channel
- **Code Questions:** Tag your PR reviewer
- **Architecture Questions:** Check CLAUDE.md
- **API Questions:** Visit http://localhost:8000/docs

## Next Steps

1. Complete the local setup
2. Log in and explore the application
3. Read through CLAUDE.md for coding guidelines
4. Pick a `good first issue` to work on
5. Ask questions early - we're here to help!

Welcome to the team!
