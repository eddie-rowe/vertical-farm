# Standard PM Flow

Step-by-step guide for project management on the Vertical Farm project using Claude Code slash commands.

## Overview

```
Audit -> Vision -> Research -> Roadmap -> Issues -> Development
   ^                                         |
   +--------------- Reflect <----------------+
```

| Phase | Commands | Purpose |
|-------|----------|---------|
| 1. Audit | `/audit` | Capture project state |
| 2. Vision | `/vision` | Define goals and gaps |
| 3. Research | `/research <topic>` | Investigate solutions |
| 4. Roadmap | `/roadmap` | Plan milestones |
| 5. Issues | `/issues` | Create GitHub issues |
| 6. Optimize | `/kanban`, `/changelog` | Maintain board health |
| 7. Reflect | `/pm-reflect` | Improve process |

---

## Prerequisites

**Before starting:**
- Access to the [GitHub Project Board](https://github.com/eddie-rowe/vertical-farm/projects)
- Familiarity with [CLAUDE.md](/CLAUDE.md) project standards
- Understanding of the [Standard Dev Flow](../development/standard-dev-flow.md)

---

## Phase 1: Project Audit

### 1.1 Run the Audit

```
/tools:01_project_management:audit
```

This command:
- Analyzes codebase structure and health
- Reviews GitHub board state (open issues, PRs)
- Collects metrics (test coverage, dependencies)
- Compares to previous audits for trends

### 1.2 Review Output

The audit creates `docs/planning/audits/YYYY-MM-DD.md` with:
- Executive summary
- Feature completeness by domain
- Technical debt checklist
- Architecture health assessment
- Recommended focus areas

**Use this as the foundation for all planning decisions.**

---

## Phase 2: Vision Definition

### 2.1 Define or Update Vision

```
/tools:01_project_management:vision
```

This command:
- Reviews existing vision document (if present)
- Asks for your top 3 priorities
- Defines success metrics
- Identifies gaps between current and desired state

### 2.2 Answer the Questions

Claude will ask:
1. "What are your top 3 priorities for this project right now?"
2. "Are there any new goals or features you want to add?"
3. "What constraints should we consider?"
4. "What does success look like for the next milestone?"

**Be specific.** Clear answers lead to better planning.

### 2.3 Review Gap Classification

Each gap is classified using the Linear Method framework:

| Classification | Meaning | Priority |
|----------------|---------|----------|
| **BLOCKER** | Prevents users from using the product | Immediate |
| **HIGH ENABLER** | Significantly increases value | This cycle |
| **LOW ENABLER** | Nice-to-have improvement | Parking lot |

---

## Phase 3: Research (Optional)

### 3.1 Research Specific Topics

```
/tools:01_project_management:research real-time notifications
```

Replace the topic with your specific research need. This command:
- Searches for best practices
- Evaluates technology options
- Checks compatibility with your stack
- Provides recommendations with justification

### 3.2 Common Research Topics

```
/tools:01_project_management:research Next.js 15 caching strategies
/tools:01_project_management:research Supabase real-time subscriptions
/tools:01_project_management:research Home Assistant integration patterns
```

### 3.3 Review Research Output

Research creates `docs/planning/research/YYYY-MM-DD-{topic}.md` with:
- Executive summary
- Technology options with pros/cons
- Recommended approach
- Implementation notes
- Estimated effort

---

## Phase 4: Roadmap Planning

### 4.1 Create the Roadmap

```
/tools:01_project_management:roadmap
```

This command:
- Reviews vision goals and research findings
- Breaks work into milestones
- Prioritizes by dependencies and value
- Creates/updates GitHub milestones

### 4.2 Scoping Checklist (Linear Method)

Before finalizing each milestone, verify:

1. Can it be completed in **1-3 weeks** with **1-3 people**?
2. Can individual tasks be done in **hours**, not days?
3. If NO to either: break into sequential **stages**

**Example:**
- TOO BIG: "Build complete IoT integration"
- RIGHT SIZE: "Stage 1: Device discovery API" (1 week)

### 4.3 Review Output

The roadmap creates `docs/planning/roadmap.md` with:
- Current focus
- Milestones with deliverables
- Dependencies map
- Risks and mitigations

---

## Phase 5: Issue Generation

### 5.1 Generate Issues

```
/tools:01_project_management:issues
```

This command:
- Reviews roadmap milestones
- Checks for existing issues (avoids duplicates)
- Drafts issue specifications
- Asks for confirmation before creating

### 5.2 Confirm Creation

Claude will show a table of proposed issues:

| # | Title | Type | Milestone |
|---|-------|------|-----------|
| - | feat: Add device discovery | enhancement | v2.0 |
| - | fix: Resolve auth timeout | bug | v2.0 |

**Review carefully.** Confirm to create the issues.

### 5.3 Handoff to Development

After `/issues` completes, you're ready to start the development loop:

```
/tools:02_development:plan 123
```

See [Standard Dev Flow](../development/standard-dev-flow.md) for the full development process.

---

## Phase 6: Board Optimization

### 6.1 Optimize the Kanban Board

```
/tools:01_project_management:kanban
```

This command:
- Identifies stale issues (14+ days inactive)
- Detects blocked items
- Checks priority alignment
- Flags orphaned items (no milestone/labels)

### 6.2 Generate Changelog

```
/tools:01_project_management:changelog
```

This command:
- Collects merged PRs from the past week
- Collects closed issues from the past week
- Calculates shipping metrics
- Creates weekly progress report

**Run weekly** to maintain accountability and track momentum.

---

## Phase 7: Reflection

### 7.1 Review PM Effectiveness

```
/tools:01_project_management:pm-reflect
```

This command:
- Analyzes cycle times and throughput
- Compares roadmap to actual delivery
- Identifies process bottlenecks
- Generates improvement recommendations

### 7.2 Review Momentum Health

The reflection includes momentum tracking:

| Indicator | Good | Warning | Critical |
|-----------|------|---------|----------|
| Daily commit rate | >2/day | 1/day | <1/day |
| Items stuck >3 days | 0 | 1-2 | 3+ |
| Shipping frequency | Daily | Weekly | Monthly |

**Key insight:** "Startups rarely die because they made too much progress, but they do die when they move too slow."

### 7.3 Start Next Cycle

After reflection, return to Phase 1:

```
/tools:01_project_management:audit
```

---

## Quick Reference

### Full Command List

| Step | Command | Input |
|------|---------|-------|
| Audit project | `/tools:01_project_management:audit` | None |
| Define vision | `/tools:01_project_management:vision` | None |
| Research topic | `/tools:01_project_management:research <topic>` | Topic |
| Plan roadmap | `/tools:01_project_management:roadmap` | None |
| Generate issues | `/tools:01_project_management:issues` | None |
| Optimize board | `/tools:01_project_management:kanban` | None |
| Generate changelog | `/tools:01_project_management:changelog` | None |
| Reflect on process | `/tools:01_project_management:pm-reflect` | None |

### Full Planning Cycle (Quarterly)

```
/tools:01_project_management:audit
/tools:01_project_management:vision
/tools:01_project_management:research <topic>
/tools:01_project_management:roadmap
/tools:01_project_management:issues
```

### Quick Sprint Planning (Weekly)

```
/tools:01_project_management:audit
/tools:01_project_management:kanban
```

### Weekly Maintenance

```
/tools:01_project_management:changelog
/tools:01_project_management:kanban
```

### Retrospective

```
/tools:01_project_management:pm-reflect
/tools:01_project_management:audit
```

---

## Tips for Success

1. **Run audits regularly** - they catch drift before it becomes debt
2. **Classify gaps honestly** - blockers vs enablers determines priority
3. **Scope ruthlessly** - 1-3 weeks max per milestone
4. **Ship early, ship often** - momentum matters more than perfection
5. **Track changelogs** - combat "nothing's happening" feelings
6. **Reflect and iterate** - the process improves with feedback

## Linear Method Principles

This workflow incorporates Linear Method principles:

| Principle | How It's Applied |
|-----------|------------------|
| Write Issues, Not User Stories | Simple titles, optional descriptions |
| Scope Projects Down | 1-3 weeks, 1-3 people checklist |
| Generate Momentum | Changelog tracking, momentum metrics |
| Prioritize Enablers & Blockers | Gap classification framework |
| Decide and Move On | Bias to action over analysis paralysis |

## Getting Help

- **Planning questions:** Ask Claude in the IDE
- **Process questions:** Text Eddie
- **Tool issues:** Check `.claude/commands/tools/01_project_management/`

## Related Documentation

- [Standard Dev Flow](../development/standard-dev-flow.md) - Development workflow
- [CLAUDE.md](/CLAUDE.md) - Project rules and patterns
- [Vision Document](./vision.md) - Current product vision
- [Roadmap](./roadmap.md) - Implementation roadmap
