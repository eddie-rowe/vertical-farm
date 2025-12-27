# /audit - Project State Snapshot

Capture a comprehensive snapshot of the project's current state including codebase, GitHub board, key metrics, and production observation insights.

[Extended thinking: This workflow captures a snapshot of the project including codebase structure, GitHub project board state, open issues/PRs, and key metrics. The output serves as the foundation for vision refinement and roadmap planning.]

## Usage
```
/audit
```

## Agent Orchestration

| Task | Agent | Purpose |
|------|-------|---------|
| Codebase Analysis | **Explore** | Feature completeness, tech debt, architecture health |
| GitHub State | **general-purpose** | Issues, PRs, project board |
| Metrics | **general-purpose** | Test coverage, CI status, dependencies |

## Execution

When invoked with `/audit`, execute these steps:

1. **Begin Audit**
   **Output:**
   ```
   🤖 Starting project audit...
   📊 Gathering codebase, board, metrics, and observation data
   ```

2. **Read Observation Digests**
   - Check for recent observation digests in `docs/observation/digests/*.md` (last 4 weeks)
   - Extract key insights: system health trends, SLO compliance, UX issues, recommended actions

3. **Codebase Analysis** (Explore agent)
   Analyze the vertical-farm codebase structure:
   - Current feature completeness by domain (farms, devices, grows, integrations)
   - Technical debt indicators (TODO comments, deprecated patterns, missing tests)
   - Architecture health (service layer coverage, type safety)
   - Recent changes and their impact

4. **GitHub Project State**
   Use gh CLI to gather:
   ```bash
   gh issue list --state open --limit 50    # Open issues
   gh pr list --state open                  # Open PRs
   gh issue list --state closed --limit 20  # Recently closed
   ```
   - Project board columns and item counts if available

5. **Metrics Collection**
   - Check test coverage if available
   - Check recent CI/CD build status
   - Count files by type and location
   - Identify dependency versions and updates needed

6. **Generate Audit Report**
   Create `docs/planning/audits/YYYY-MM-DD.md`:

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

   ### Architecture Health
   - Service layer coverage: X%
   - Type safety: ...

   ## GitHub State
   ### Open Issues: N
   [Top 5 by priority]

   ### Open PRs: N
   [List with status]

   ## Metrics
   - Test coverage: X%
   - Build status: passing/failing
   - Dependencies needing updates: N

   ## Observation Insights
   - System Status: {GREEN/YELLOW/RED}
   - SLO Compliance: {X}/{Y} services
   - Recommended Actions from Observation Loop

   ## Recommended Focus Areas
   1. ...
   2. ...
   ```

7. **Complete Audit**
   **Output:**
   ```
   ✅ Audit Complete
   📁 Report saved: docs/planning/audits/YYYY-MM-DD.md
   💡 Next steps: '/vision' or '/kanban'
   ```

## Observation Loop Integration

The audit reads from the Observation Loop to inform PM planning:
- **System health trends** - Are services stable or degrading?
- **SLO compliance** - Which services need attention?
- **User experience** - What friction points exist?
- **Recommended actions** - What should PM prioritize?

## Output Location

`docs/planning/audits/YYYY-MM-DD.md`
