# New Developer Guide

## Prerequisites

| Tool | Install | Purpose |
|------|---------|---------|
| Docker Desktop | [Download](https://docker.com) | Containers |
| Supabase CLI | `brew install supabase/tap/supabase` | Local database |
| Node.js 20+ | `brew install node` | Frontend |
| Git | `brew install git` | Version control |
| GitHub CLI | `brew install gh` | GitHub ops |
| Claude Code | `npm i -g @anthropic-ai/claude-code` | AI assistant |

### Verify Installation
```bash
docker --version && supabase --version && node --version && gh --version && claude --version
```

## Quick Start

```bash
# 1. Clone and enter project
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm

# 2. Start environment
make up   # or: /up in Claude Code

# 3. Access the app
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Supabase Studio: http://localhost:54323
```

**Test Login:** `testuser123@gmail.com` / `password123`

## SDLC Workflow

Every task follows three phases:

```
UNDERSTAND          BUILD              SHIP
───────────        ───────           ──────
/plan <issue>      /dev <issue>      /deploy <issue>
                   /test             /merge <pr#>
                   /validate         /finalize <issue>
```

### Command Reference

| Phase | Command | Purpose |
|-------|---------|---------|
| UNDERSTAND | `/plan 123` | Analyze issue, create plan |
| BUILD | `/dev 123` | Write the code |
| BUILD | `/test` | Run all tests locally |
| BUILD | `/validate 123` | E2E testing |
| SHIP | `/deploy 123` | Create pull request |
| SHIP | `/merge 45` | Merge approved PR |
| SHIP | `/finalize 123` | Close issue |

## Your First Issue

### 1. Setup GitHub
1. Go to [project board](https://github.com/users/eddie-rowe/projects/6)
2. Find a `good first issue`
3. Assign yourself
4. Move to "In Progress"
5. Create branch from issue page

### 2. Development
```bash
# Checkout branch
git fetch origin
git checkout <branch-name>

# Start Claude Code
claude

# Run workflow
/plan <issue>      # Understand the problem
/dev <issue>       # Make changes
/test              # Verify locally
/validate <issue>  # E2E checks
```

### 3. Ship It
```bash
/deploy <issue>    # Creates PR
# Wait for review & CI
/merge <pr#>       # Merge when approved
/finalize <issue>  # Close issue
```

## Project Structure

```
vertical-farm/
├── frontend/src/
│   ├── app/           # Pages (App Router)
│   ├── components/    # UI components
│   ├── services/      # Data access (CRITICAL!)
│   └── types/         # TypeScript
├── backend/app/
│   ├── api/v1/        # Endpoints
│   └── services/      # Business logic
├── supabase/
│   └── migrations/    # Database schema
└── docs/              # Documentation
```

## Critical Rules

1. **Always use service layer** - Never call Supabase directly from components
2. **Read CLAUDE.md** - Contains all coding standards
3. **Ask questions early** - Better to clarify than assume

## Troubleshooting

### Tests Fail
```bash
# Ask Claude
"The tests are failing with [error]. Can you help?"
```

### Merge Conflicts
```bash
# Ask Claude
"There are merge conflicts on the PR. Can you help resolve them?"
```

### Start Over
```bash
git checkout main
git branch -D <branch-name>
# Run /plan again
```

## Next Steps

1. Complete local setup
2. Log in and explore the app
3. Read `CLAUDE.md` for coding guidelines
4. Pick a `good first issue`
5. Ask questions early

Welcome to the team!
