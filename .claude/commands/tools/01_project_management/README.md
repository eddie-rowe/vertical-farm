# Project Management Workflow Commands

Plan what to build. These commands form a continuous planning loop that feeds GitHub issues into the SDLC development loop.

## PM Loop — What to build?

```mermaid
flowchart LR
    subgraph IN["📥 Inputs"]
        direction TB
        docs_in[("Previous audits<br/><i>docs/planning/</i>")]
        insights[("Digest reports<br/><i>docs/observation/</i>")]
    end

    subgraph PM["🎯 PM Commands"]
        direction TB
        audit["/audit<br/><i>Snapshot state</i>"] --> vision["/vision<br/><i>Define goals</i>"]
        vision --> research["/research<br/><i>Investigate</i>"]
        research --> roadmap["/roadmap<br/><i>Plan milestones</i>"]
        roadmap --> issues["/issues<br/><i>Create tasks</i>"]
        issues -.-> kanban["/kanban<br/><i>Optimize board</i>"]
        kanban -.-> pm_reflect["/pm-reflect<br/><i>Review process</i>"]
    end

    subgraph OUT["📤 Outputs"]
        direction TB
        gh_issues[("GitHub Issues<br/><i>Ready for dev</i>")]
        gh_milestones[("Milestones<br/><i>Sprint goals</i>")]
        reflections[("Reflections<br/><i>docs/planning/</i>")]
    end

    docs_in --> audit
    insights --> audit
    issues --> gh_issues
    roadmap --> gh_milestones
    pm_reflect --> reflections

    style IN fill:#e3f2fd,stroke:#1976d2
    style PM fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style OUT fill:#fff3e0,stroke:#f57c00
```

## Commands

| Command | Purpose | Input | Process | Output |
|---------|---------|-------|---------|--------|
| [`/audit`](audit.md) | Snapshot project state | None | Agent orchestration (inline) | `docs/planning/audits/{date}.md` |
| [`/vision`](vision.md) | Define product goals | User prompts | Agent orchestration (inline) | `docs/planning/vision.md` |
| [`/research`](research.md) | Deep research | Topic argument | Agent orchestration (inline) | `docs/planning/research/{date}-{topic}.md` |
| [`/roadmap`](roadmap.md) | Plan milestones | None | Agent orchestration (inline) | `docs/planning/roadmap.md`, GitHub milestones |
| [`/issues`](issues.md) | Generate GitHub issues | User confirmation | Agent orchestration (inline) | GitHub issues with labels/milestones |
| [`/kanban`](kanban.md) | Optimize board | User direction | Agent orchestration (inline) | Board updates, health report |
| [`/pm-reflect`](pm-reflect.md) | Review PM effectiveness | None | Agent orchestration (inline) | `docs/planning/reflections/{date}.md` |
| [`/changelog`](changelog.md) | Generate weekly changelog | None | Agent orchestration (inline) | `docs/changelogs/{date}.md` |

## Command Parameters

| Command | Accepts | Examples |
|---------|---------|----------|
| `/audit` | No arguments | `/audit` |
| `/vision` | Interactive prompts | `/vision` |
| `/research` | Topic string (required) | `/research "auth patterns"`, `/research IoT` |
| `/roadmap` | No arguments | `/roadmap` |
| `/issues` | Optional milestone filter | `/issues`, `/issues v2.0` |
| `/kanban` | Optional action | `/kanban`, `/kanban stale`, `/kanban priorities` |
| `/pm-reflect` | No arguments | `/pm-reflect` |

## Workflow Patterns

| Pattern | When to Use | Commands |
|---------|-------------|----------|
| **Full Cycle** | Quarterly planning | `/audit` → `/vision` → `/research` → `/roadmap` → `/issues` |
| **Sprint** | Weekly planning | `/audit` → `/kanban` |
| **Ad-hoc Research** | Exploring a topic | `/research {topic}` → `/issues` |
| **Retrospective** | Process improvement | `/pm-reflect` → `/audit` |

## Output Locations

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

## Handoff to SDLC Loop

After `/issues` creates GitHub issues, transition to development:

```
PM Loop: /issues creates #123
    ↓
SDLC Loop: /plan 123 → /dev 123 → /test → /validate 123 → /deploy 123
```

The PM loop defines **what** to build. The SDLC loop handles **how** to build it.
