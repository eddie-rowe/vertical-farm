# Pull Request Guide

Complete guide for creating, reviewing, and merging pull requests in the Vertical Farm project.

## 📝 Creating Pull Requests

### Before Creating a PR

#### Pre-flight Checklist
- [ ] All tests pass locally (`./test-all.sh`)
- [ ] Code follows our [coding standards](coding-standards.md)
- [ ] No console.log or print debug statements
- [ ] Documentation updated if needed
- [ ] Branch is up to date with `main`

#### Branch Naming Convention
```
feature/issue-123-add-sensor-monitoring
fix/issue-456-resolve-cache-bug
docs/issue-789-update-api-docs
refactor/issue-321-optimize-queries
test/issue-654-add-integration-tests
```

### PR Title Format

Follow the conventional commit format:
```
type(scope): Brief description

Examples:
feat(frontend): Add real-time sensor monitoring dashboard
fix(backend): Resolve N+1 query issue in farms endpoint
docs(api): Update authentication flow documentation
refactor(services): Optimize FarmService data fetching
test(integration): Add coverage for device control workflow
```

### PR Description Template

```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

Closes #[issue-number]

## 📋 Changes
- [ ] Added feature X to enable Y
- [ ] Fixed bug where Z happened
- [ ] Refactored A to improve B
- [ ] Updated documentation for C

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests pass

### Test Coverage
- Before: XX%
- After: XX%

## 📸 Screenshots
[If UI changes, include before/after screenshots]

## 🔍 Review Focus
[Guide reviewers on what to focus on]
- Security implications of auth changes
- Performance impact of new queries
- Edge cases in error handling

## ⚡ Performance Impact
[For performance-related changes]
- Baseline: Xms
- After changes: Xms
- Improvement: X%

## 🚀 Deployment Notes
[Any special deployment considerations]
- Database migrations required
- Environment variables added
- Breaking changes
- Feature flags needed

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Mobile responsive
- [ ] Performance tested
```

## 👀 Code Review Process

### For Authors

#### Preparing for Review

1. **Self-Review First**
   ```bash
   # Review your own changes
   git diff main...HEAD
   
   # Check for common issues
   npm run lint
   pytest --tb=short
   ```

2. **Provide Context**
   - Link to the issue
   - Explain complex logic with comments
   - Highlight areas needing special attention
   - Include testing instructions

3. **Keep PRs Small**
   - Aim for <500 lines changed
   - Split large features into multiple PRs
   - One concern per PR

#### Responding to Feedback

```markdown
# Good response examples

## Acknowledging feedback
> "Good catch! I've updated the error handling in commit abc123"

## Explaining decisions
> "I chose this approach because:
> 1. It maintains backward compatibility
> 2. Performance tests show 30% improvement
> 3. It follows our established patterns"

## Asking for clarification
> "I'm not sure I understand the concern about X. 
> Could you elaborate on the potential issue?"
```

### For Reviewers

#### Review Checklist

**🔒 Security**
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization correct
- [ ] RLS policies updated if needed

**🏗️ Architecture**
- [ ] Follows service layer pattern
- [ ] No direct Supabase calls in components
- [ ] Proper error handling
- [ ] Consistent with existing patterns
- [ ] SOLID principles maintained

**⚡ Performance**
- [ ] No N+1 queries
- [ ] Proper indexing for new queries
- [ ] Caching implemented where appropriate
- [ ] No unnecessary re-renders (React)
- [ ] Bundle size impact acceptable

**🧪 Testing**
- [ ] Adequate test coverage
- [ ] Tests are meaningful (not just coverage)
- [ ] Edge cases covered
- [ ] Integration tests for critical paths

**📚 Code Quality**
- [ ] Clear variable/function names
- [ ] Comments for complex logic
- [ ] No code duplication
- [ ] Type safety maintained
- [ ] Error messages helpful

**🎨 Frontend Specific**
- [ ] Accessibility (keyboard, screen reader)
- [ ] Mobile responsive
- [ ] Design tokens used
- [ ] Optimistic updates where appropriate
- [ ] Loading states implemented

**🐍 Backend Specific**
- [ ] Async/await used properly
- [ ] Pydantic validation complete
- [ ] API documentation updated
- [ ] Status codes appropriate
- [ ] Database transactions used correctly

#### Providing Feedback

```markdown
# Effective review comments

## 🚨 Blocking issue (must fix)
**blocking:** This SQL query is vulnerable to injection.
```suggestion
query = text("SELECT * FROM farms WHERE id = :farm_id")
result = await db.execute(query, {"farm_id": farm_id})
```

## 💡 Suggestion (consider changing)
**suggestion:** Consider extracting this logic to a service method for reusability.
```python
# Could be moved to FarmService.calculate_yield()
def calculate_yield(harvest_data):
    ...
```

## 💭 Question (clarification needed)
**question:** Is there a reason we're not using the existing `FarmService.update()` method here?

## ✨ Praise (positive reinforcement)
**praise:** Great error handling! This covers all the edge cases nicely.

## 📝 Nitpick (minor, non-blocking)
**nit:** Typo: "recieve" → "receive"
```

### Review Response Times

| PR Type | Target Response Time |
|---------|---------------------|
| Critical Bug Fix | 2 hours |
| Feature (Small) | 24 hours |
| Feature (Large) | 48 hours |
| Documentation | 72 hours |
| Refactoring | 72 hours |

## 🔄 Merge Process

### Merge Requirements

1. **All Checks Pass**
   - CI/CD pipeline green
   - No merge conflicts
   - Required reviewers approved

2. **Approval Criteria**
   - At least 1 approval for standard PRs
   - 2 approvals for:
     - Breaking changes
     - Security-related changes
     - Database migrations
     - Critical business logic

### Merge Strategies

```bash
# Standard feature merge (squash and merge)
# Use for feature branches with multiple commits
git checkout main
git pull origin main
git merge --squash feature-branch
git commit -m "feat: Add sensor monitoring (#123)"

# Hotfix merge (create a merge commit)
# Preserves history for tracking
git checkout main
git merge --no-ff hotfix-branch

# Small fixes (rebase and merge)
# Keeps linear history for simple changes
git checkout feature-branch
git rebase main
git checkout main
git merge feature-branch
```

### Post-Merge Actions

1. **Delete Branch**
   ```bash
   # Delete local branch
   git branch -d feature-branch
   
   # Delete remote branch (automatic on GitHub)
   ```

2. **Update Project Board**
   - Move issue to "Done"
   - Add release notes if needed

3. **Monitor Deployment**
   - Check deployment pipeline
   - Verify in staging/production
   - Monitor error rates

## 🚀 Automated Checks

### CI/CD Pipeline

Our GitHub Actions run automatically on every PR:

```yaml
# What runs on your PR
- Linting (ESLint, Black, isort)
- Type checking (TypeScript, mypy)
- Unit tests (Jest, pytest)
- Integration tests
- Coverage reports
- Bundle size analysis
- Security scanning
- Documentation build
```

### Required Status Checks

All PRs must pass:
- ✅ `backend-tests`
- ✅ `frontend-tests`
- ✅ `integration-tests`
- ✅ `type-check`
- ✅ `lint`
- ✅ `build`

### AI Code Review

Automatic AI reviewers provide feedback on:
- **Code Quality** (frontend/ and backend/)
- **Documentation** (docs/)
- **UI/UX** (frontend/ components)

## 📊 PR Metrics

### Healthy PR Indicators

| Metric | Good | Needs Attention |
|--------|------|-----------------|
| Lines Changed | <500 | >1000 |
| Files Changed | <20 | >50 |
| Review Cycles | <3 | >5 |
| Time to Merge | <3 days | >1 week |
| Comments | 5-15 | >30 |
| Commits | <10 | >20 |

### PR Size Guidelines

```markdown
# XS (Extra Small): <10 lines
- Typo fixes
- Config updates
- Small bug fixes

# S (Small): 10-100 lines
- Simple features
- Minor refactoring
- Test additions

# M (Medium): 100-500 lines
- Standard features
- Multiple file changes
- Integration updates

# L (Large): 500-1000 lines
- Complex features
- Major refactoring
- Consider splitting

# XL (Extra Large): >1000 lines
- Should be split into multiple PRs
- Requires architectural review
- Needs detailed documentation
```

## 🎯 Best Practices

### DO's ✅

- **Do** keep PRs focused on a single concern
- **Do** write descriptive commit messages
- **Do** update tests with code changes
- **Do** respond to feedback promptly
- **Do** test locally before pushing
- **Do** rebase on main regularly
- **Do** use draft PRs for work in progress
- **Do** celebrate merged PRs! 🎉

### DON'Ts ❌

- **Don't** mix refactoring with features
- **Don't** leave commented-out code
- **Don't** ignore failing tests
- **Don't** merge without review
- **Don't** force push after review starts
- **Don't** include unrelated changes
- **Don't** merge with conflicts
- **Don't** skip documentation updates

## 🔥 Handling Conflicts

### Merge Conflicts

```bash
# Update your branch with latest main
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main

# Resolve conflicts
# Edit conflicted files
git add .
git rebase --continue

# If rebase gets messy
git rebase --abort
git merge main  # Use merge instead
```

### Review Conflicts

When reviewers disagree:

1. **Discuss in PR comments**
2. **Schedule a quick sync if needed**
3. **Involve a third reviewer if deadlocked**
4. **Document the decision made**

## 📚 PR Examples

### Excellent PR Example

**Title:** `feat(frontend): Add real-time sensor monitoring with WebSocket support (#234)`

**Description:**
- Clear purpose linked to issue
- Comprehensive testing details
- Performance metrics included
- Screenshots of UI changes
- Deployment notes about WebSocket configuration

**Code:**
- Small, focused changes
- Well-commented complex logic
- Tests included
- Documentation updated

### Poor PR Example

**Title:** `Updates`

**Description:** `Fixed stuff`

**Issues:**
- No issue linked
- No testing information
- Mixed concerns (bug fix + feature + refactoring)
- 2000+ lines changed
- No documentation

## 🆘 Getting Help

### When Stuck on a PR

1. **Mark as Draft** if not ready
2. **Ask for early feedback** on approach
3. **Request pair programming** for complex issues
4. **Break down** into smaller PRs
5. **Document blockers** in PR comments

### Resources

- [GitHub PR Documentation](https://docs.github.com/en/pull-requests)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)
- Team Discord/Slack for quick questions

---

*Remember: PRs are a collaboration tool. Be kind, be thorough, and help each other build better software!*