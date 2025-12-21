# New Developer Guide

## Prerequisites

| Tool | Install | Purpose |
|------|---------|---------|
| Docker Desktop | [Download](https://docker.com) | Containers |
| Supabase CLI | `brew install supabase/tap/supabase` | Local database |
| Node.js 20+ | `brew install node` | Frontend |
| Python 3.12 | `brew install python@3.12` | Backend |
| Git | `brew install git` | Version control |
| GitHub CLI | `brew install gh` | GitHub ops |
| Claude Code | `npm i -g @anthropic-ai/claude-code` | AI assistant |
| act | `brew install act` | Local CI runner |
| Playwright | `npx playwright install` | E2E testing |

### Verify Installation
```bash
docker --version && supabase --version && node --version && python3 --version && gh --version && claude --version && act --version
```

### Setup GitHub CLI

Authenticate with GitHub for PR creation and issue management:

```bash
# Login to GitHub (opens browser)
gh auth login

# Select:
# - GitHub.com
# - HTTPS
# - Yes (authenticate Git with GitHub credentials)
# - Login with a web browser
```

Verify authentication:
```bash
gh auth status
```

### Setup act (Local CI)

`act` runs GitHub Actions locally for 1:1 CI parity before pushing.

```bash
# Create local storage directories
mkdir -p .act/artifacts .act/cache

# Generate secrets from Supabase (after running make up)
./scripts/create-act-secrets.sh
```

The `.actrc` file configures act with these paths:
```
--artifact-server-path .act/artifacts
--cache-server-path .act/cache
```

Run local CI with `/tools:02_development:test` or manually:
```bash
act -j backend-tests -W .github/workflows/main-pipeline.yml
```

## Quick Start

```bash
# 1. Clone and enter project
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm

# 2. Start environment
/tools:02_development:up #in Claude Code

# 3. Access the app
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Supabase Studio: http://localhost:54323
```

**Test Logins:**

| User | Email | Password | Purpose |
|------|-------|----------|---------|
| Seeded | `seeded@test.dev` | `password123` | Has sample data (farms, grows, devices) |
| Blank | `blank@test.dev` | `password123` | Empty state (profile only) |

Use different browser sessions or incognito to switch between users.

## Development Workflow

For your first issue and all development tasks, follow the **[Standard Dev Flow](../development/standard-dev-flow.md)**.

This guide covers the complete workflow:
- Picking issues from the project board
- Creating feature branches
- Using Claude Code slash commands
- PR review process
- Merging and cleanup

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

1. **Read CLAUDE.md** - Contains all coding standards
2. **Asking questions is cool** - Better to clarify than assume

## Troubleshooting

### Something Fails
```bash
# Ask Claude
"The tests are failing with [error]. Can you help?"
```

### Start over if something is really messy
```bash
# Get the main working branch
git checkout main
# Delete your old branch
git branch -D <branch-name>
# Run /plan again and continue the process from there
```

## Next Steps

1. Complete local setup (Prerequisites + Quick Start above)
2. Log in and explore the app (http://localhost)
3. Read [CLAUDE.md](/CLAUDE.md) for coding guidelines
4. Read [Standard Dev Flow](../development/standard-dev-flow.md) for the development process
5. Pick a `good first issue` from the [project board](https://github.com/eddie-rowe/vertical-farm/projects)
6. Ask questions early - Eddie on Slack, Claude in IDE

Welcome to the team!
