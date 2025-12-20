# Development

## Guides

| Guide | Purpose |
|-------|---------|
| [Standard Dev Flow](./standard-dev-flow.md) | Step-by-step development workflow |
| [Contributing](./contributing.md) | How to contribute |
| [Coding Standards](./coding-standards.md) | Style guide and patterns |
| [Testing](./testing.md) | Test strategy |
| [Docker](./docker.md) | Container workflow |
| [Database](./database.md) | Schema management |
| [Debugging](./debugging.md) | Troubleshooting techniques |

## Quick Start

```bash
make up          # Start development
make test-all    # Run all tests
make logs        # View logs
```

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15, React 19, TypeScript |
| Backend | FastAPI, Python 3.13 |
| Database | PostgreSQL via Supabase |
| Testing | Jest, Playwright, pytest |

## Critical Rules

See [CLAUDE.md](/CLAUDE.md) for complete standards. Key rules:

1. **Service layer required** - All data through `services/domain/*`
2. **RLS mandatory** - Row Level Security on all tables
3. **Type everything** - No `any` types

## Quality Gates

All code must pass:
- Linting (ESLint, Black)
- Type checking (TypeScript, mypy)
- Unit tests (>80% coverage)
- Code review (1+ approval)

## Related

- [API Reference](../reference/api/) - Endpoint docs
- [Deployment](../operations/deployment.md) - Production guide
- [New Developer](./new-developer.md) - Onboarding
