# /deploy - Issue Deployment

Deploy completed issue implementation with code review, git operations, and pull request creation.

[Extended thinking: Orchestrate the complete deployment process for a successfully implemented GitHub issue. Use deployment-engineer for git/PR operations, code-reviewer for quality checks, and github-issue-analyzer for issue updates.]

## Usage
```
/deploy <issue_number>
```

## Examples
```
/deploy 65
/deploy 123
```

## Agent Orchestration

| Phase | Agent | Purpose |
|-------|-------|---------|
| Pre-deployment | **code-reviewer** | Final quality review, architecture validation |
| Git operations | **deployment-engineer** | Commit, push, PR creation |
| Issue update | **github-issue-analyzer** | Work summary, label updates |
| Review setup | **github-issue-analyzer** | Assign reviewers, notify team |

## Execution

When invoked with `/deploy <issue>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide an issue number"

   # Parse issue number from argument
   ```

2. **Begin Deployment**
   **Output:**
   ```
   🚀 Starting deployment workflow...
   📦 Deploying implementation for issue: {issue}
   ```

3. **Pre-Deployment Validation** (code-reviewer)
   - Perform final code quality review of all changes
   - Validate architectural compliance and patterns
   - Ensure proper error handling and testing coverage
   - Check for security vulnerabilities or anti-patterns

4. **Git Operations** (deployment-engineer)
   - Stage all relevant changes for the issue
   - Create comprehensive commit message with:
     - Clear description of changes
     - Reference to GitHub issue number
     - Summary of technical implementation
     - Breaking changes or migration notes (if any)
   - Validate no sensitive data or secrets included
   - Push feature branch to remote

5. **GitHub Issue Update** (github-issue-analyzer)
   - Generate comprehensive work summary covering:
     - Requirements implemented
     - Technical approach and architecture decisions
     - Database schema changes
     - Service layer enhancements
     - Testing and validation performed
   - Post detailed comment to GitHub issue
   - Update labels: add "ready-for-review", remove "in-progress"

6. **Pull Request Creation** (deployment-engineer)
   Create PR with:

   **PR Template:**
   ```markdown
   ## Summary
   Brief overview of changes

   ## Technical Details
   - Architecture and implementation notes
   - Database migrations and schema changes

   ## Testing
   - What testing was performed
   - Validation results

   ## Review & Validation Steps
   - Key files/areas to focus review on
   - Steps to test locally (commands, URLs)
   - Feature validation checklist
   - Edge cases to test

   ## Screenshots
   Visual evidence of functionality
   ```

7. **Review Assignment** (github-issue-analyzer)
   - Assign reviewers based on code changes:
     - Frontend changes → frontend developers
     - Backend changes → backend developers
     - Database changes → database administrators
     - Full-stack changes → tech leads
   - Post notification comment with review request

8. **Complete Deployment**
   **Output:**
   ```
   🔗 Pull Request created: {pr_url}
   💡 Next steps:
     - Monitor CI/CD pipeline
     - Address review feedback
     - Run '/review {pr}' to check status
     - Run '/finalize {issue}' after merge
   ```

## Success Criteria

- All code changes committed and pushed
- GitHub issue updated with work summary
- PR created with detailed description and evidence
- Appropriate reviewers assigned
- No security vulnerabilities or architectural violations
- All tests pass
