# Standard Development Flow

Step-by-step guide for developing features on the Vertical Farm project using Claude Code slash commands.

## Overview

```
Browser Setup -> IDE Development -> PR Review -> Merge & Cleanup
```

| Phase | Location | Actions |
|-------|----------|---------|
| 1. Setup | Browser + IDE | Pick issue, create branch |
| 2. Development | IDE (Claude Code) | Plan, code, test, deploy |
| 3. Review | Text Message + GitHub | Request review, address feedback |
| 4. Finalization | IDE (Claude Code) | Merge, cleanup |

---

## Prerequisites

**IMPORTANT!**

Before starting, complete the [New Developer Guide](./new-developer.md).

---

## Phase 1: Administrative Setup

### 1.1 Select an Issue (Browser)

1. Go to the [GitHub Project Board](https://github.com/eddie-rowe/vertical-farm/projects)
2. Find an issue in the **Ready** column
3. Assign yourself to the issue
4. Move the issue to **In Progress**
5. Note the issue number (e.g., `#123`)

### 1.2 Create a Feature Branch (GitHub)

1. On the issue page, find the **Development** section in the right sidebar
2. Click **"Create a branch"**
3. Keep the default branch name (GitHub auto-generates it from the issue title)
4. Click **"Create branch"**

### 1.3 Checkout the Branch (IDE Terminal)

**Tip:** GitHub shows the exact checkout command after creating the branch - just copy and paste it.

---

## Phase 2: IDE Development Flow

### 2.1 Start Development Environment

```
/tools:02_development:up
```

This starts Docker containers for:
- Frontend (Next.js on port 3000)
- Backend (FastAPI on port 8000)
- Database (Supabase on port 54323)

Wait for all services to be healthy before proceeding.

### 2.2 Plan the Implementation

```
/tools:02_development:plan 123
```

Replace `123` with your issue number. This command:
- Analyzes the GitHub issue
- Creates an implementation plan
- Breaks down into subtasks
- Identifies affected files

**Review the plan before proceeding.** Ask questions if anything is unclear.

### 2.3 Develop the Feature

```
/tools:02_development:dev 123
```

Replace `123` with your issue number. This command:
- Implements the feature based on the plan
- Uses specialized agents for frontend/backend/database
- Follows project coding standards
- Creates necessary tests

**Stay engaged during development.** Claude will ask clarifying questions - answer them to guide the implementation.

### 2.4 Validate with E2E Tests

```
/tools:02_development:validate 123
```

Replace `123` with your issue number. This command:
- Runs Playwright E2E tests
- Tests the actual user flows
- Takes screenshots for verification
- Validates acceptance criteria

### 2.5 Run Local Tests

```
/tools:02_development:test
```

This runs the full test suite:
- Frontend unit tests (Jest)
- Backend unit tests (pytest)
- Type checking (TypeScript, mypy)
- Linting (ESLint, Black)

**All tests must pass before proceeding.** Fix any failures before moving on.

### 2.6 Create Pull Request

```
/tools:02_development:deploy 123
```

Replace `123` with your issue number. This command:
- Commits all changes
- Pushes to remote
- Creates a PR with proper description
- Links the PR to the issue
- Returns the PR URL (e.g., `#68`)

**Note the PR number** - you'll need it for the next steps.

---

## Phase 3: PR Review

### 3.1 Request Review from Eddie

After `/deploy` completes, send Eddie a text message:

```
Hey Eddie - PR ready for review :D
```

### 3.2 Wait for Review

Eddie will either:
- **Approve** the PR - proceed to Phase 4
- **Request changes** - see below

**Feel free to begin working on another branch** while waiting for review. Here's how:

```bash
# Switch to main and get latest changes
git checkout main
git pull origin main

# Start a new issue (repeat Phase 1 steps)
# 1. Pick another issue from the Ready column
# 2. Create a branch from GitHub's issue page
# 3. Checkout the new branch:
git fetch origin
git checkout 456-another-issue-title
```

When Eddie responds to your original PR:
```bash
# Stash any uncommitted work on current branch (if needed)
git stash

# Switch back to original branch
git checkout 123-issue-title-here

# Address feedback and push updates
# Then switch back to continue other work:
git checkout 456-another-issue-title
git stash pop  # Restore stashed changes (if any)
```

**Tip:** Keep track of which branches you're juggling. Use `git branch` to list your local branches.

### 3.3 Reflect on Development

While waiting for review, run a reflection to analyze your work:

```
/tools:02_development:reflect
```

This command:
- Analyzes your recent commits for patterns
- Identifies common errors or debugging sessions
- Reviews code quality and consistency
- Suggests workflow improvements
- Saves a report to `.claude/reports/reflections/`

**Options:**
```
/tools:02_development:reflect 5              # Analyze last 5 commits
/tools:02_development:reflect 10 typescript  # Focus on TypeScript code
/tools:02_development:reflect 20 backend     # Deep dive on Python backend
```

**Available scopes:** `all`, `typescript`, `backend`, `testing`, `infrastructure`, `database`, `security`, `performance`

**Review the reflection report** and note any action items for future work.

### 3.4 Address Requested Changes (If Any)

If Eddie requests changes:

1. Read the review comments on GitHub
2. Make the requested changes in your IDE
3. Run tests again:
   ```
   /tools:02_development:test
   ```
4. Push updates:
   ```bash
   git add .
   git commit -m "Address review feedback"
   git push
   ```
5. Reply to review comments on GitHub
6. Notify Eddie the changes are ready for re-review

---

## Phase 4: Merge and Finalization

### 4.1 Check PR Status (Optional)

```
/tools:02_development:review 68
```

Replace `68` with your PR number. Verifies:
- CI/CD pipeline status
- Review approval status
- Merge readiness

### 4.2 Merge the PR

**Only after Eddie approves:**

```
/tools:02_development:merge 68
```

Replace `68` with your PR number. This command:
- Verifies approval
- Squash merges to main
- Deletes the feature branch on remote

### 4.3 Finalize the Issue

```
/tools:02_development:finalize 123
```

Replace `123` with your issue number. This command:
- Closes the GitHub issue
- Updates documentation if needed
- Links the merged PR

### 4.4 Cleanup

```bash
# Switch back to main
git checkout main

# Pull the latest (includes your merged changes)
git pull origin main

# Stop Docker environment (optional, saves resources)
make down && supabase stop
```

---

## Quick Reference

### Full Command List

| Step | Command | Input |
|------|---------|-------|
| Start environment | `/tools:02_development:up` | None |
| Plan implementation | `/tools:02_development:plan 123` | Issue # |
| Develop feature | `/tools:02_development:dev 123` | Issue # |
| E2E validation | `/tools:02_development:validate 123` | Issue # |
| Run tests | `/tools:02_development:test` | None |
| Create PR | `/tools:02_development:deploy 123` | Issue # |
| Reflect on work | `/tools:02_development:reflect` | Commits, Scope |
| Check PR status | `/tools:02_development:review 68` | PR # |
| Merge PR | `/tools:02_development:merge 68` | PR # |
| Close issue | `/tools:02_development:finalize 123` | Issue # |

### Typical Flow

```
/tools:02_development:up
/tools:02_development:plan 123
/tools:02_development:dev 123
/tools:02_development:validate 123
/tools:02_development:test
/tools:02_development:deploy 123
/tools:02_development:reflect
# ... wait for Eddie's approval ...
/tools:02_development:merge 68
/tools:02_development:finalize 123
```

### Troubleshooting Commands

| Issue | Command |
|-------|---------|
| CI/CD pipeline fails | `/tools:02_development:pipeline 68` |
| Need to debug | Use Claude chat directly |
| Merge conflicts | Ask Claude: "Help me resolve merge conflicts" |

---

## Tips for Success

1. **Read the issue thoroughly** before starting
2. **Ask questions early** - don't guess at requirements
3. **Commit often** - small, logical commits
4. **Test locally first** - don't rely only on CI
5. **Keep PRs focused** - one issue per PR
6. **Respond to reviews quickly** - keeps momentum

## Getting Help

- **Technical questions:** Ask Claude in the IDE
- **Process questions:** Send text message to Eddie

## Related Documentation

- [Coding Standards](./coding-standards.md)
- [Testing Guide](./testing.md)
- [CLAUDE.md](/CLAUDE.md) - Project rules and patterns
