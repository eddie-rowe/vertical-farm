# /review - Pull Request Review

Request and manage code reviews for pull requests, with automated review checks and status monitoring.

## Usage
```
/review <pr_number>
```

## Examples
```
/review 68
/review 123
/review 42
```

## Execution

When invoked with `/review <pr>`, execute these steps:

1. **Validate Input**
   ```
   # If no argument provided, show error:
   "❌ Please provide a PR number"

   # Show usage examples:
   "   /review 68"
   "   /review 123"

   # Parse PR number from argument
   ```

2. **Begin Review Process**
   **Output:**
   ```
   🔍 Starting pull request review workflow...
   📋 Reviewing PR: #{pr}
   ```

   *Note: Context is automatically initialized by UserPromptSubmit hook*

3. **Fetch PR Status**
   ```
   # Get PR details using GitHub CLI
   gh pr view {pr} --json title,state,reviewDecision,statusCheckRollup,mergeable,reviews

   # Check:
   # - PR state (open/closed/merged)
   # - Review decision (approved/changes_requested/review_required)
   # - CI status (all checks passing?)
   # - Mergeable state
   ```
   **Output:**
   ```
   📊 PR Status:
     Title: {title}
     State: {state}
     Reviews: {review_count} ({approved}/{changes_requested}/{pending})
     CI Status: {passing|failing|pending}
     Mergeable: {yes|no|conflicted}
   ```

4. **Analyze Review Requirements**
   ```
   # Check branch protection rules
   gh api repos/{owner}/{repo}/branches/main/protection

   # Determine:
   # - Required approvals count
   # - Required status checks
   # - Dismiss stale reviews setting
   ```
   **Output:**
   ```
   📋 Review Requirements:
     Required Approvals: {count}
     Required Checks: {check_list}
     Current Status: {met|not_met}
   ```

5. **Request Reviews (if needed)**
   ```
   # If no reviews requested yet, suggest reviewers
   # Based on:
   # - CODEOWNERS file
   # - Recent contributors to changed files
   # - Team assignments

   gh pr edit {pr} --add-reviewer {reviewer1},{reviewer2}
   ```
   **Output:**
   ```
   👥 Review Requests:
     Requested: {reviewer_list}
     Status: Awaiting review
   ```

6. **Perform Automated Code Review**
   ```
   # Launch code-reviewer agent to analyze changes
   # Check for:
   # - Code quality issues
   # - Security vulnerabilities
   # - Architectural compliance
   # - Test coverage
   # - Documentation completeness
   ```
   **Output:**
   ```
   🤖 Automated Review Results:

   ✅ Code Quality: {score}/10
   ✅ Security: No vulnerabilities found
   ✅ Architecture: Compliant with patterns
   ⚠️ Test Coverage: {coverage}% (target: 80%)
   ✅ Documentation: Complete

   📝 Suggestions:
     - {suggestion_1}
     - {suggestion_2}
   ```

7. **Generate Review Summary**
   ```
   # Create comprehensive review summary
   # Post as PR comment if significant findings
   ```
   **Output:**
   ```
   📝 Review Summary:

   This PR is {ready for merge|needs attention|blocked}

   ✅ Passing: {list}
   ⚠️ Warnings: {list}
   ❌ Blocking: {list}

   💡 Next Steps:
     - {action_1}
     - {action_2}
   ```

8. **Complete Review**
   **Output:**
   ```
   ✅ Review complete for PR #{pr}

   📊 Final Status:
     Ready to Merge: {yes|no}
     Blocking Issues: {count}

   💡 Commands:
     - '/merge {pr}' - Merge when ready
     - '/review {pr}' - Re-run review after changes
   ```

   *Note: Review status is automatically saved by PostToolUse hook*

## Review Checklist

The automated review checks for:

### Code Quality
- [ ] No ESLint/TypeScript errors
- [ ] Consistent code style
- [ ] No dead code or unused imports
- [ ] Proper error handling

### Security
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention

### Architecture
- [ ] Service layer patterns followed
- [ ] RLS policies for new tables
- [ ] Proper type definitions
- [ ] No circular dependencies

### Testing
- [ ] Unit tests for new functions
- [ ] Integration tests for APIs
- [ ] E2E tests for user flows
- [ ] Adequate coverage

### Documentation
- [ ] Code comments where needed
- [ ] Updated README if applicable
- [ ] API documentation current
- [ ] Migration notes included
