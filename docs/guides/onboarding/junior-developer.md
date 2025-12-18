# Junior Developer Onboarding Guide

Welcome to the Vertical Farm project! This guide will help you set up your local development environment and get started contributing.

## Prerequisites

Before starting, ensure you have these tools installed:

| Tool | Version | Install Command | Purpose |
|------|---------|-----------------|---------|
| VS Code | Latest | [Download](https://code.visualstudio.com/download) | Code editor |
| Docker Desktop | Latest | [Download](https://www.docker.com/products/docker-desktop) | Container runtime |
| Supabase CLI | Latest | `brew install supabase/tap/supabase` | Local database |
| Node.js | 20+ | `brew install node` | Frontend runtime |
| jq | Latest | `brew install jq` | JSON parsing |
| Git | Latest | `brew install git` | Version control |
| GitHub CLI | Latest | `brew install gh` | GitHub operations |
| act | Latest | `brew install act` | Local CI testing |
| Claude Code | Latest | `npm install -g @anthropic-ai/claude-code` | AI development assistant |

### Verify Prerequisites

```bash
# Check all tools are installed
docker --version
supabase --version
node --version
jq --version
git --version
gh --version
act --version  # Optional - for local CI testing
claude --version
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

## Working on GitHub Issues

### 1. Find an Issue

Head to the [Vertical Farm project board](https://github.com/users/eddie-rowe/projects/6)

Look for issues labeled:
- `good first issue` - Great for beginners
- `help wanted` - Ready for contribution
- `bug` - Fix something broken
- `enhancement` - Add new features

Take ownership of an issue.

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
2. Define what you want done to look like
3. Run the [AI assisted workflow](../../../.claude/commands/tools/02_development/README.md)
4. Test your changes locally

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

## Next Steps

1. Complete the local setup
2. Log in and explore the application
3. Read through `CLAUDE.md` for coding guidelines
4. Pick a `good first issue` to work on
5. Ask questions early

Welcome to the team!
