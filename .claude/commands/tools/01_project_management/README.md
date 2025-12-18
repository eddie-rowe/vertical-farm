# Project Management Workflow Commands

This directory contains the project management workflow slash commands for the Vertical Farm project. These commands form a continuous planning loop that feeds into the SDLC development loop.

## PM ↔ SDLC Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                    PM INFINITY LOOP                              │
│  /audit → /vision → /research → /roadmap → /issues → /kanban    │
│     ↑                                                    │       │
│     └──────────────────── /pm-reflect ───────────────────┘       │
│                              │                                   │
│                              ▼ (creates issues)                  │
├─────────────────────────────────────────────────────────────────┤
│                    SDLC INFINITY LOOP                            │
│  /plan → /dev → /test → /validate → /deploy → /merge → /finalize│
│     ↑                                                     │      │
│     └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Available Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `/audit` | Snapshot project state | `docs/planning/audits/YYYY-MM-DD.md` |
| `/vision` | Define/refine product goals | `docs/planning/vision.md` |
| `/research <topic>` | Research solutions | `docs/planning/research/YYYY-MM-DD-{topic}.md` |
| `/roadmap` | Create/update roadmap | `docs/planning/roadmap.md` + GitHub milestones |
| `/issues` | Generate GitHub issues | GitHub issues (handoff to SDLC) |
| `/kanban` | Optimize project board | Board reorganization |
| `/pm-reflect` | Review PM effectiveness | `docs/planning/reflections/YYYY-MM-DD.md` |

## Workflow Integration

### Full Planning Cycle (Quarterly)

Complete cycle from assessment to issue creation:

```
/audit → /vision → /research → /roadmap → /issues
```

1. **Audit**: Assess current project state
2. **Vision**: Define or refine goals based on audit
3. **Research**: Investigate solutions for vision gaps
4. **Roadmap**: Plan implementation milestones
5. **Issues**: Create GitHub issues for development

### Sprint Planning (Weekly)

Quick cycle for ongoing work management:

```
/audit → /kanban
```

1. **Audit**: Quick status check
2. **Kanban**: Optimize board, reprioritize work

### Ad-hoc Research

When exploring a specific topic:

```
/research {topic} → /issues
```

### Retrospective

Periodic process improvement:

```
/pm-reflect → /audit
```

## Command Details

### `/audit`
Captures a comprehensive snapshot of the project:
- Codebase structure and tech debt analysis
- GitHub project board state via `gh`
- Open issues, PRs, recent activity summary
- Metrics (test coverage, build status)
- Comparison with previous audit

### `/vision`
Manages the product vision document:
- Reviews existing vision if present
- Gathers user input on goals, priorities, constraints
- Defines success metrics
- Identifies gaps between current state and vision

### `/research <topic>`
Deep research on specific topics:
- Web search for best practices
- Analysis of similar implementations
- Technology option evaluation
- Trade-off documentation and recommendations

### `/roadmap`
Creates and maintains the implementation roadmap:
- Breaks vision into epics/milestones
- Prioritizes by dependencies and value
- Defines acceptance criteria
- Creates/updates GitHub milestones via `gh`

### `/issues`
Generates GitHub issues from the roadmap:
- Converts roadmap items to issue specifications
- Applies issue templates (bug, feature, enhancement)
- Sets labels and milestones
- Creates sub-issues for complex items
- **Handoff point to SDLC loop** - user runs `/plan` when ready

### `/kanban`
Optimizes the GitHub project board:
- Identifies stale issues
- Suggests priority reordering
- Flags blocked items
- Archives completed work

### `/pm-reflect`
Reviews PM process effectiveness:
- Analyzes cycle time and throughput
- Reviews roadmap accuracy
- Identifies process bottlenecks
- Suggests workflow improvements

## Output Locations

All PM artifacts are stored in `docs/planning/`:

```
docs/planning/
├── vision.md              # Living vision document
├── roadmap.md             # Current roadmap
├── audits/
│   └── YYYY-MM-DD.md      # Project state snapshots
├── research/
│   └── YYYY-MM-DD-{topic}.md  # Research findings
└── reflections/
    └── YYYY-MM-DD.md      # PM retrospectives
```

## Context Flow

Each command maintains context through `.claude/context/simple-context.yaml`:

```yaml
pm_phase: audit | vision | research | roadmap | issues | kanban | reflect
pm_context:
  last_audit: "2025-12-17"
  vision_gaps: ["feature-a", "feature-b"]
  roadmap_milestones: ["v2.0", "v2.1"]
  pending_issues: 12
  board_health: "good"
```

- `/audit` → captures current state, identifies gaps
- `/vision` → defines goals, stores vision gaps
- `/research` → stores findings, recommendations
- `/roadmap` → creates milestones, tracks priorities
- `/issues` → creates GitHub issues, tracks counts
- `/kanban` → updates board health status
- `/pm-reflect` → analyzes patterns, suggests improvements

## Related Workflows

Each command executes a corresponding workflow:

| Command | Workflow |
|---------|----------|
| `/audit` | `workflows/00_project_management/project-audit.md` |
| `/vision` | `workflows/00_project_management/vision-definition.md` |
| `/research` | `workflows/00_project_management/deep-research.md` |
| `/roadmap` | `workflows/00_project_management/roadmap-planning.md` |
| `/issues` | `workflows/00_project_management/issue-generation.md` |
| `/kanban` | `workflows/00_project_management/kanban-optimization.md` |
| `/pm-reflect` | `workflows/00_project_management/pm-reflection.md` |

## Transitioning to SDLC Loop

After `/issues` creates GitHub issues, transition to the development loop:

```
PM Loop: /issues creates #123
    ↓
SDLC Loop: /plan 123 → /dev 123 → /test → /validate 123 → /deploy 123 → /merge 68 → /finalize 123
```

The PM loop is responsible for **what** to build. The SDLC loop handles **how** to build it.
