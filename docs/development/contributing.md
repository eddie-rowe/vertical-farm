# Contributing to Vertical Farm

Welcome! This comprehensive guide helps you contribute effectively to the Vertical Farm project - a full-stack vertical farming management platform.

## 🚀 Quick Start

### Prerequisites

- **Docker** and Docker Compose
- **Git** 
- **Node.js** (v18+) and npm
- **Python** (3.13+)
- **Claude Code** (claude.ai/code)
- **Cursor IDE** with MCP servers:
  - GitHub MCP server
  - Sequential Thinking MCP server
  - Context7 MCP Server
  - Playwright MCP server
  - Supabase MCP server

### Getting Developer Secrets

Contact @eddie-rowe on GitHub to receive the required secrets for developing on the platform. These include:
- Supabase credentials
- Test user accounts
- API keys

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eddie-rowe/vertical-farm.git
   cd vertical-farm
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment template
   cp .env.example .env
   ```

3. **Configure development values in `.env`:**
   ```bash
   # Supabase Configuration (required)
   SUPABASE_URL=https://PROJECT_ID.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   SUPABASE_ACCESS_TOKEN=your_access_token
   SUPABASE_DB_PASSWORD=your_db_password

   # Next.js Frontend
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8000

   # Backend API
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_jwt_secret
   ```

4. **Start development environment:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or run services individually
   cd backend && uvicorn app.main:app --reload --port 8000
   cd frontend && npm run dev
   ```

5. **Verify services are running:**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs if needed
   docker-compose logs -f [service_name]
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔄 Development Workflow

### 1. Claiming a Task

1. Visit the [Vertical Farm Project Board](https://github.com/users/eddie-rowe/projects/6)
2. Browse tasks in the `Ready` column
3. When selecting a task:
   - Set `Assignee` to your GitHub username
   - Update `Projects` status to `In Progress`
4. Create a feature branch:
   - Click `Create a branch` in the Development section
   - Use auto-generated name
   - Branch from `main`
   - Checkout locally

### 2. Planning Your Work

Use Cursor AI to analyze and plan the implementation:

```markdown
You are a senior full stack software developer.
Your task is to:
1. Use GitHub MCP server to analyze [ISSUE ##]
2. Plan its implementation by breaking it down into smaller, ordered subtasks
3. Ensure full stack implications are considered
4. Create output in this table format:
SUBTASK | DETAILS | REASONING | COMPLEXITY | ETC

Call sequential thinking MCP server to perform your task.
Call context7 MCP server for up-to-date documentation when necessary.
```

### 3. Implementation

#### Critical Architecture Rules

**🚨 MANDATORY: Service Layer Pattern**
```typescript
// ✅ CORRECT: Always use service layer
const farmService = FarmService.getInstance()
const farms = await farmService.getFarmsByUser(userId)

// ❌ WRONG: Never bypass service layer
const { data } = await supabase.from('farms').select('*')  // FORBIDDEN
```

#### Development Guidelines

- **Frontend (Next.js 15 / React 19):**
  - Server Components by default
  - Use `'use client'` only when needed
  - Implement `useOptimistic` for instant UI feedback
  - Follow existing component patterns in `src/components/`

- **Backend (FastAPI / Python 3.13):**
  - Use async/await patterns consistently
  - Implement Pydantic models for validation
  - Follow dependency injection patterns
  - Add comprehensive error handling

- **Database (Supabase):**
  - Always enable RLS (Row Level Security)
  - Use migrations for schema changes
  - Never expose service keys to frontend
  - Test query performance

### 4. Testing Your Work

```bash
# Run all tests
./test-all.sh

# Backend tests
cd backend && pytest -v
cd backend && pytest --cov=app --cov-report=html

# Frontend tests
cd frontend && npm test
cd frontend && npm run test:e2e

# Integration tests
cd tests && node run-all-tests.js

# Type checking
cd backend && pyright
cd frontend && npm run type-check
```

### 5. Committing Changes

Follow conventional commit format:

```bash
# Format: type(scope): description

# Examples:
git commit -m "feat(frontend): add temperature monitoring chart"
git commit -m "fix(backend): resolve sensor data caching issue"
git commit -m "docs(setup): update development environment guide"
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting changes
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### 6. Creating Pull Requests

1. Push your branch:
   ```bash
   git push origin feature-branch-name
   ```

2. Create PR with:
   - Descriptive title
   - Link to issue: `Closes #123`
   - Summary of changes
   - Test results
   - Screenshots (if UI changes)

3. Request review from team member

4. Address feedback and update

5. Merge after approval

## 📚 Code Standards

### Import Organization

Required import order:
```typescript
// 1. Node built-ins
import fs from 'fs'

// 2. React/Next.js
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// 3. External packages
import { createClient } from '@supabase/supabase-js'

// 4. Internal - Services (MOST IMPORTANT)
import { FarmService } from '@/services/domain/farm/FarmService'

// 5. Internal - Types
import type { Farm } from '@/types/farm'

// 6. Internal - Components
import { Button } from '@/components/ui/Button'

// 7. Relative imports
import { FarmCard } from './FarmCard'
```

### Error Handling

```typescript
// Service layer handles all errors
class FarmService extends BaseService {
  async createFarm(data: FarmInput): Promise<Farm> {
    try {
      // Business logic
      return farm
    } catch (error) {
      this.handleError(error, 'Failed to create farm')
      throw new ServiceError('Farm creation failed', error)
    }
  }
}

// Components display user-friendly messages
function FarmCreate() {
  const handleSubmit = async (data) => {
    try {
      await farmService.createFarm(data)
      toast.success('Farm created successfully')
    } catch (error) {
      toast.error('Failed to create farm. Please try again.')
    }
  }
}
```

## 🧪 Testing Strategy

### Test Coverage Goals
- **Backend:** 90%+ for business logic, 80%+ overall
- **Frontend:** 80%+ for components, 70%+ overall
- **Integration:** 100% for critical user paths

### Writing Tests

```python
# Backend test example
async def test_create_farm_with_valid_data():
    """Test farm creation with valid data returns created farm."""
    # Arrange
    farm_data = FarmFactory.build()
    
    # Act
    response = await client.post("/api/v1/farms", json=farm_data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["name"] == farm_data["name"]
```

```typescript
// Frontend test example
describe('FarmCard', () => {
  it('displays farm information correctly', () => {
    render(<FarmCard farm={mockFarm} />)
    expect(screen.getByText(mockFarm.name)).toBeInTheDocument()
    expect(screen.getByText(mockFarm.location)).toBeInTheDocument()
  })
})
```

## 👥 Collaboration Guidelines

### Communication
- **Update issues** with progress regularly
- **Tag team members** when you need input (`@username`)
- **Ask questions early** - don't get stuck
- **Share learnings** in documentation

### Code Review Best Practices
- **Review within 24 hours**
- **Be constructive** and specific
- **Test changes** locally before approving
- **Check for:**
  - Security implications
  - Performance impact
  - Test coverage
  - Documentation updates

### Work Division
- **Frontend:** UI/UX, components, user flows
- **Backend:** APIs, business logic, integrations
- **Shared:** Testing, documentation, code reviews

## 🚨 Emergency Procedures

### If Something Breaks

1. **Stay calm** - issues can be fixed
2. **Check recent changes:**
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```
3. **Rollback if critical:**
   ```bash
   git revert [commit-hash]
   ```
4. **Communicate immediately** - notify team
5. **Document the issue** and resolution

### Getting Help

- Check existing issues for similar problems
- Search documentation in `docs/`
- Ask in team discussions
- Use debugging tools (see debugging.md)

## 🎯 Quality Standards

### Performance Requirements
- **API Response:** <200ms for standard queries
- **Page Load:** <2 seconds
- **Database Queries:** <50ms for indexed queries
- **Cache Hit Rate:** >80% for cacheable content

### Security Requirements
- **Input Validation:** All inputs validated (frontend + backend)
- **Authentication:** JWT tokens with proper expiration
- **Authorization:** RLS policies on all tables
- **Secrets:** Never commit secrets, use environment variables

### Accessibility Requirements
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Proper ARIA labels**

## 📈 Continuous Improvement

### Regular Reviews
- **Weekly:** Team sync on progress
- **Monthly:** Code quality review
- **Quarterly:** Architecture review

### Documentation
- Update docs with significant changes
- Document architectural decisions
- Keep API documentation current
- Add inline comments for complex logic

## 🎉 Recognition

We value every contribution! 
- Thank team members for good work
- Share successes in team discussions
- Learn from challenges together
- Celebrate milestones

---

**Remember:** We're building something amazing together. Every contribution makes the vertical farming system better for users worldwide! 🌱

*Questions? Create an issue or ask in team discussions.*