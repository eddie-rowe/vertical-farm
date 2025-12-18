Perform a comprehensive audit of the project's current state:

[Extended thinking: This workflow captures a snapshot of the project including codebase structure, GitHub project board state, open issues/PRs, and key metrics. The output serves as the foundation for vision refinement and roadmap planning.]

Use multiple Task tools to gather project state in parallel:

**Codebase Analysis**
- Use Task tool with subagent_type="Explore"
- Prompt: "Analyze the vertical-farm codebase structure. Identify:
  1. Current feature completeness by domain (farms, devices, grows, integrations)
  2. Technical debt indicators (TODO comments, deprecated patterns, missing tests)
  3. Architecture health (service layer coverage, type safety)
  4. Recent changes and their impact
  Provide a structured summary suitable for project planning."

**GitHub Project State**
- Use gh CLI to gather:
  - `gh issue list --state open --limit 50` - Open issues
  - `gh pr list --state open` - Open PRs
  - `gh issue list --state closed --limit 20` - Recently closed
  - Project board columns and item counts if available

**Metrics Collection**
- Check test coverage if available
- Check recent CI/CD build status
- Count files by type and location
- Identify dependency versions and updates needed

**Output Format**
Create `docs/planning/audits/YYYY-MM-DD.md` with:

```markdown
# Project Audit - YYYY-MM-DD

## Executive Summary
[2-3 sentence overview of project health]

## Codebase State
### Feature Completeness
| Domain | Status | Notes |
|--------|--------|-------|
| Farms | ... | ... |

### Technical Debt
- [ ] Item 1
- [ ] Item 2

### Architecture Health
- Service layer coverage: X%
- Type safety: ...

## GitHub State
### Open Issues: N
[Top 5 by priority]

### Open PRs: N
[List with status]

### Recent Activity
[Last 2 weeks summary]

## Metrics
- Test coverage: X%
- Build status: passing/failing
- Dependencies needing updates: N

## Comparison to Previous Audit
[If previous audit exists, highlight changes]

## Recommended Focus Areas
1. ...
2. ...
3. ...
```

Save the audit and update context with key findings for subsequent PM commands.
