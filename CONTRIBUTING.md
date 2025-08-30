# Contributing to Vertical Farm

Welcome! This guide helps you contribute to the Vertical Farm project effectively.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Supabase CLI ([Install guide](https://supabase.com/docs/guides/cli))
- Claude Code
- Cursor IDE (with MCP servers: GitHub, Sequential Thinking, Context7, Playwright, Supabase)

### Development Environment Setup

**⚡ First time setup:** Follow the [**Quickstart Guide**](docs/getting-started/quickstart.md) to get your development environment running in 5 minutes.

**🔄 Already set up:** Use these commands for daily development:
```bash
# Start development environment
make up

# Stop when done
make down
```

## 🔄 Development Workflow

### Quick workflow

1. Clone and change directory into repository in your terminal
```sh
git clone https://github.com/eddie-rowe/vertical-farm.git
cd vertical-farm
```
2. Open up the [Vertical Farm GitHub Project](https://github.com/users/eddie-rowe/projects/6) in your browser 
3. and find the Issue you're going to work on then click "Create a branch for this issue"
4. Run the generated content in your terminal
```sh
git fetch origin
git checkout THE-BRANCH-NAME-THAT-GETS-GENERATED
```

1. Open up Claude Code and ask it to run each of these commands in order to develop the feature
   1. `make up` to stand up the local development environment
   2. `make plan ISSUE=###` then review/modify plan
   3. `make dev ISSUE=###` then guide agents to develop the feature
   4. `make validate ISSUE=###` and ensure everything works as expected
   5. `make test` to run comprehensive testing (linting + security + tests)
   6. `make deploy ISSUE=###`
   7. `make pipeline PR=###` to troubleshoot GitHub CI/CD errors
   8. `make reflect` intention:
      1. reflect on errors/challenges we encountered along the way and update the agent/workflow definitions to prevent errors/challenges of their nature from being introduced into the code in the future.
      2. check similar files to ensure the style is consistent and maintains project practices.
   9.  `make finalize ISSUE=###` to update docs and close the GitHub issue
       1.  Updates relevant technical documentation
       2.  Creates a prompting log in `.claude/logs/YYYY-MM-DD/issue-###.md`:
        ```md
        ## Prompt
        [Original issue description]

        ## Todos that were generated
        [List of subtasks completed]

        ## Summary
        [What was implemented, key decisions, files changed]

        ## Next Steps
        [Follow-up work or improvements]

        ## Follow up prompt
        [Suggested prompt for continuing the work]
        ```
       3.  Generates comprehensive closing comment for GitHub
       4.  Archives context for future reference  
       5.  Resets context for next issue

### 1. Grabbing a task

1. Go to the [Vertical Farm Project Page](https://github.com/users/eddie-rowe/projects/6)

2. Browse tasks in the `Ready` column. 

3. When you have decided on the task you'd like to work on, click on the task and fill out the following fields on the right sidebar.
   1. `Assignee:` Your GitHub username
   2. `Projects:` Set status to `In Progress`

4. In the `Development` section on the task's right sidebar, click the blue `Create a branch` link
   1. `Branch Name:` Leave as the auto-generated name
   2. `Repository destination:` eddie-rowe/vertical-farm
   3. `Branch source:` main
   4. `What's next?:` checkout locally
   5. Click the green `Create Branch` button

5. In Cursor, verify you are on your new branch
    ```bash
    git status
    ```

### 2. Planning the work

1. Ask the Cursor AI agent to evaluate for completion with this prompt:

```markdown
You are a senior full stack software developer.
Your task is to:
1. Use GitHub MCP server to analyze [ISSUE ##]
2. Plan its implementation by breaking it down into smaller, ordered subtasks.
3. Ensure the full stack implications are considered.
4. Create the final output in this table format:
SUBTASK | DETAILS | REASONING | COMPLEXITY | ETC

Call sequential thinking MCP server to perform your task.
Call context7 MCP server to retrieve relevant up to date dcoumentation when necessary.
```

- Review the returned ISSUE TASK breakdown. Modify where required/desired.
- Use the Cursor AI Agent to update your issue [ISSUE ##] with the subtask breakdown using GitHub MCP server.

### 3. Doing the work

- Systematically perform these subtasks with the Cursor AI agent.
- - **Update issue status** as you progress
- When complete, ask the Cursor AI agent to evaluate for completion with this prompt:

```markdown
You are a senior full stack code reviewer.

Your task is to...

Call sequential thinking MCP server to perform your task.
Call context7 MCP server to retrieve relevant up to date dcoumentation when necessary.
```

- Many of the code standards below are implemented when using this project's Cursor Rules. As long as you're coding with Cursor's AI agent, you don't have to spend many of your thinking cycles on these:
- **Frontend:** Follow existing React/TypeScript patterns
- **Backend:** Follow FastAPI/Python conventions
- **Database:** Use Supabase migrations for schema changes
- **Tests:** Write tests for new functionality


### 4. 🧪 Testing the work

- AI Agent prompt
- Human Workflow

    ```bash
    # Start development environment
    # First ensure Supabase is running
    supabase status  # Check if running
    supabase start   # Start if needed
    
    # Then start your app containers
    docker-compose -f docker-compose.yml up -d

    # Stop services
    docker-compose -f docker-compose.yml down
    supabase stop  # Also stop Supabase when done

    # Rebuild containers (after dependency changes)
    docker-compose -f docker-compose.yml up -d --build

    # View running services
    docker-compose ps
    supabase status  # Check Supabase services
    ```

- Running Tests with Docker

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

- Manual Testing

    ```bash
    # Access the running application
    # Frontend: http://localhost:3000
    # Backend API: http://localhost:8000
    # API Docs: http://localhost:8000/docs
    # Supabase Studio: http://localhost:54323

    # View logs for debugging
    docker-compose logs -f frontend
    docker-compose logs -f backend
    ```

- GitHub Actions workflows
  - main pipeline
  - testing components
  - in-line style guide AI reviewer (docs/ only)
  - in-line code quality AI reviewer (frontend/ and backend/)
  - in-line UI/UX AI reviewer (frontend/ only)

### 5. Committing the work

- Commit changes to your branch and create a draft PR
    ```bash
    git add .
    git commit -m "[ISSUE##] Implement this rad new feature"
    git push
    ```

-  **Link PRs** to issues using `Closes #123`
  
1. **Create PR** with descriptive title and description
2. **Reference issues** in PR description (`Closes #123`)
3. **Request review** from the other developer
4. **Address feedback** and update as needed
5. **Merge** after approval

### 6. Review phase

- this happens

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

#### Working with Supabase Locally
```bash
# Create a new migration
supabase migration new your_migration_name

# Apply migrations (happens automatically on start)
supabase start

# Reset database to clean state
supabase db reset

# Check migration status
supabase migration list

# Generate TypeScript types from your schema
supabase gen types typescript --local > frontend/types/database.ts

# Access database directly
supabase db dump  # Export schema
psql postgresql://postgres:postgres@localhost:54322/postgres  # Direct connection
```

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