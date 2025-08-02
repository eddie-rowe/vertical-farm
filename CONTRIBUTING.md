# Contributing to Vertical Farm

Welcome! This guide helps you contribute to the Vertical Farm project effectively.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Code editor (Cursor recommended)

### Receiving developer secrets
1. Reach out to Eddie - he will send you the required secrets for developing on the platform

### Setup
1. **Fork and clone** the repository
2. **Set up environment variables:**
   ```bash
   # Copy environment files
   cp .env.example .env
   ```
3. **Configure development values:**
   ```bash
   # Edit .env file with your development values
   # Required for local development:
   
    # Supabase
    SUPABASE_URL=https://PROJECT_ID.supabase.co
    SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_KEY=
    SUPABASE_JWT_SECRET=
    SUPABASE_ACCESS_TOKEN=
    SUPABASE_DB_PASSWORD=

    # Next.js frontend
    NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. **Start development environment:**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   ```
5. **Verify all services are online:**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs if any services failed
   docker-compose logs
   ```
6. **Access the application:**
   - Frontend: http://localhost:3000
7. **Log in with test user:**
   - Email: (See Receiving developer secrets section above)
   - Password: (See Receiving developer secrets above)

## 🔄 Development Workflow

### 0. Docker Development
```bash
# Start development environment
docker-compose up -d

# Stop services
docker-compose down

# Rebuild containers (after dependency changes)
docker-compose up -d --build

# View running services
docker-compose ps
```

### 1. Issue Management
- **Use issue templates** when creating new issues
- **Assign issues** to yourself when starting work
- **Update issue status** as you progress
- **Link PRs** to issues using `Closes #123`

### 2. Branch Strategy
```bash
# Create feature branch
git checkout -b feature/your-initials/description

# Create bugfix branch  
git checkout -b bugfix/your-initials/description

# Create documentation branch
git checkout -b docs/your-initials/description
```

### 3. Code Standards
- **Frontend:** Follow existing React/TypeScript patterns
- **Backend:** Follow FastAPI/Python conventions
- **Database:** Use Supabase migrations for schema changes
- **Tests:** Write tests for new functionality

### 4. Pull Request Process
1. **Create PR** with descriptive title and description
2. **Reference issues** in PR description (`Closes #123`)
3. **Request review** from the other developer
4. **Address feedback** and update as needed
5. **Merge** after approval

## 👥 Collaboration Guidelines

### Work Division
- **Frontend work** (UI, components, user experience)
- **Backend work** (APIs, business logic, database)
- **Shared responsibilities** (code reviews, testing, documentation)

### Communication
- **Update issues** with progress comments
- **Tag team members** when you need input (`@username`)
- **Ask questions early** - don't get stuck for too long
- **Share learnings** - document discoveries for the team

### Code Review
- **Always review each other's work**
- **Be constructive** in feedback
- **Test changes** before approving
- **Check for security** and performance implications

### Thinking at scale
- **Serving each other** by suggesting automated workflows
- **Quality** and **Clarity**
- **How will what I do add value to users or developers?**

## 🧪 Testing

### Running Tests with Docker
```bash
# Run all tests
docker-compose exec backend pytest
docker-compose exec frontend npm test

# Run specific test suites
docker-compose exec backend pytest tests/unit/
docker-compose exec backend pytest tests/integration/
docker-compose exec frontend npm run test:e2e

# Type checking
docker-compose exec backend pyright
docker-compose exec frontend npm run type-check
```

### Manual Testing
```bash
# Access the running application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs

# View logs for debugging
docker-compose logs -f frontend
docker-compose logs -f backend
```

## 📚 Documentation

### Code Documentation
- **Add comments** for complex logic
- **Update README** for new features
- **Document API changes** in relevant docs
- **Include examples** in docstrings

### Project Documentation
- **Update ISSUES.md** if workflow changes
- **Keep setup docs** current
- **Document architecture** decisions
- **Maintain API reference**

## 🏗️ Architecture Guidelines

### Frontend (Next.js)
- **Use server components** when possible
- **Follow component patterns** in existing code
- **Implement proper error boundaries**
- **Optimize for performance** (lazy loading, caching)

### Backend (FastAPI)
- **Use dependency injection** for services
- **Implement proper error handling**
- **Add input validation** with Pydantic
- **Follow async patterns** consistently

### Database (Supabase)
- **Use migrations** for schema changes
- **Implement RLS policies** for security
- **Test queries** for performance
- **Backup data** before major changes

## 🚨 Emergency Procedures

### If Something Breaks
1. **Don't panic** - issues can be fixed
2. **Check recent changes** - what might have caused it?
3. **Rollback if needed** - use git revert
4. **Communicate** - let the team know
5. **Document** - what happened and how it was fixed

### Getting Help
- **Check existing issues** for similar problems
- **Search documentation** for solutions
- **Ask the team** - we're here to help
- **Use debugging tools** - browser dev tools, logs

## 🎯 Quality Standards

### Code Quality
- **Follow existing patterns** - consistency is key
- **Write readable code** - others need to understand it
- **Handle errors gracefully** - don't let things crash
- **Optimize for performance** - especially for IoT data

### Security
- **Validate all inputs** - frontend and backend
- **Use environment variables** for secrets
- **Follow authentication** patterns
- **Test security** for new features

### Performance
- **Monitor response times** - especially API calls
- **Optimize database queries** - use indexes
- **Implement caching** where appropriate
- **Test with real data** - not just small datasets

## 📝 Commit Guidelines

### Commit Messages
```
type(scope): description

Examples:
feat(frontend): add temperature chart to dashboard
fix(backend): resolve sensor data caching issue
docs(setup): update development environment guide
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding tests
- `chore` - Maintenance tasks

## 🎉 Recognition

### Celebrating Contributions
- **Thank each other** for good work
- **Share successes** - what went well?
- **Learn from challenges** - what can we improve?
- **Document wins** - for future reference

---

**Remember:** We're building something amazing together. Every contribution, no matter how small, makes the vertical farming system better for users around the world! 🌱

*For questions about contributing, create an issue or ask in team discussions.* 