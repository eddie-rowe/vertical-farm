# Claude Code Commands for Vertical Farm

Production-ready commands and workflows specifically configured for the Vertical Farm Management Platform.

## 🔄 Workflow Overview

Three interconnected loops form a continuous cycle: **Plan → Build → Observe → Plan...**

### System Diagram 

Shows `Input → Process → Output` for each process loop.

#### 🎯 PM Loop — What to build?

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

More details: [PM Commands](tools/01_project_management/README.md)

#### 🔧 SDLC Loop — How to build?

```mermaid
flowchart LR
    subgraph IN["📥 Inputs"]
        direction TB
        gh_issue[("GitHub Issue<br/><i>Task to implement</i>")]
    end

    subgraph SDLC["🔧 SDLC Commands"]
        direction TB
        plan["/plan<br/><i>Analyze issue</i>"] --> up["/up<br/><i>Start env</i>"]
        up --> dev["/dev<br/><i>Implement</i>"]
        dev --> test["/test<br/><i>Run tests</i>"]
        test --> validate["/validate<br/><i>E2E testing</i>"]
        validate --> reflect["/reflect<br/><i>Review patterns</i>"]
        reflect --> deploy["/deploy<br/><i>Create PR</i>"]
        deploy --> review["/review<br/><i>Check status</i>"]
        review --> merge["/merge<br/><i>Merge PR</i>"]
        merge --> finalize["/finalize<br/><i>Close issue</i>"]
    end

    subgraph OUT["📤 Outputs"]
        direction TB
        gh_pr[("GitHub PR<br/><i>Code review</i>")]
        gh_actions[("CI/CD<br/><i>Automated checks</i>")]
        deployed[("Deployed<br/><i>Live in prod</i>")]
    end

    gh_issue --> plan
    deploy --> gh_pr
    merge --> gh_actions
    finalize --> deployed

    style IN fill:#e3f2fd,stroke:#1976d2
    style SDLC fill:#e0f2f1,stroke:#00897b,stroke-width:2px
    style OUT fill:#fff3e0,stroke:#f57c00
```

More details: [SDLC Commands](tools/02_development/README.md)

#### 📊 Observation Loop — Is it working?

```mermaid
flowchart LR
    subgraph IN["📥 Inputs"]
        direction TB
        dd_apm[("APM<br/><i>Performance traces</i>")]
        dd_rum[("RUM<br/><i>User sessions</i>")]
        dd_metrics[("Metrics<br/><i>System stats</i>")]
        dd_logs[("Logs<br/><i>Error details</i>")]
    end

    subgraph OBS["📊 Observation Commands"]
        direction TB
        status["/status<br/><i>Health check</i>"] --> digest["/digest<br/><i>Weekly synthesis</i>"]
        slo["/slo<br/><i>Error budgets</i>"] --> digest
        metrics["/metrics<br/><i>Trend analysis</i>"] --> digest
        ux["/ux<br/><i>User experience</i>"] --> digest
        incident["/incident<br/><i>Response</i>"] --> postmortem["/postmortem<br/><i>Root cause</i>"]
        postmortem --> digest
        autoobs["/autoobs<br/><i>Auto sweep</i>"] -.-> digest
    end

    subgraph OUT["📤 Outputs"]
        direction TB
        docs_digest[("Weekly Digest<br/><i>docs/observation/</i>")]
        docs_pm[("Postmortems<br/><i>docs/observation/</i>")]
    end

    dd_apm --> status
    dd_apm --> slo
    dd_metrics --> metrics
    dd_rum --> ux
    dd_logs --> incident
    digest --> docs_digest
    postmortem --> docs_pm

    style IN fill:#e3f2fd,stroke:#1976d2
    style OBS fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style OUT fill:#fff3e0,stroke:#f57c00
```

More details: [Observation Commands](tools/03_observation/README.md)

### Artifact Flow

How artifacts flow between loops and systems during a development cycle:

```mermaid
sequenceDiagram
    autonumber

    participant PM as 🎯 PM Loop
    participant GH as GitHub
    participant SDLC as 🔧 SDLC Loop
    participant DD as Datadog
    participant OBS as 📊 Observation
    participant DOCS as Local Docs

    %% ═══════════════════════════════════════════════════════════════
    %% PM PHASE - Planning what to build
    %% ═══════════════════════════════════════════════════════════════
    rect rgb(252, 228, 236)
        Note over PM,DOCS: PM Phase - What to build?
        DOCS->>PM: Previous insights & audits
        PM->>PM: /audit → /vision → /research → /roadmap
        PM->>GH: Create issues & milestones
        PM->>GH: /issues, /kanban
    end

    %% ═══════════════════════════════════════════════════════════════
    %% SDLC PHASE - Building the feature
    %% ═══════════════════════════════════════════════════════════════
    rect rgb(227, 242, 253)
        Note over GH,SDLC: SDLC Phase - How to build?
        GH->>SDLC: Issue to implement
        SDLC->>SDLC: /up → /plan → /dev → /test → /validate
        SDLC->>GH: Create PR (/deploy)
        GH->>GH: CI/CD runs (Actions)
        SDLC->>GH: /review → /merge → /finalize
        GH->>DD: Deployment triggers monitoring
    end

    %% ═══════════════════════════════════════════════════════════════
    %% OBSERVATION PHASE - Monitoring production
    %% ═══════════════════════════════════════════════════════════════
    rect rgb(232, 245, 233)
        Note over DD,DOCS: Observation Phase - Is it working?
        DD->>OBS: Metrics, logs, RUM data
        OBS->>OBS: /status, /slo, /metrics, /ux
        alt Incident Occurs
            DD->>OBS: Alert triggered
            OBS->>OBS: /incident → /postmortem
            OBS->>DOCS: Postmortem report
        end
        OBS->>DOCS: /digest - Weekly synthesis
    end

    %% ═══════════════════════════════════════════════════════════════
    %% CYCLE COMPLETES - Feed back to PM
    %% ═══════════════════════════════════════════════════════════════
    Note over PM,DOCS: 🔄 Cycle repeats - insights feed next sprint
    DOCS-->>PM: Digest informs next /audit
```

**Cycle Summary:**
1. **PM** reads docs → plans work → creates GitHub issues
2. **SDLC** picks up issue → develops → ships via PR/CI
3. **Observation** monitors Datadog → writes insights to docs
4. **Repeat**: insights inform next PM planning cycle

### Command Reference

Each slash command has specific inputs, processes, and outputs. These tables provide quick reference for what each command does internally.

#### PM Loop Commands

| Command | Purpose | Input | Process | Output |
|---------|---------|-------|---------|--------|
| [`/audit`](tools/01_project_management/audit.md) | Snapshot project state | None | [project-audit](workflows/00_project_management/project-audit.md), Explore agent | `docs/planning/audits/{date}.md` |
| [`/vision`](tools/01_project_management/vision.md) | Define product goals | User prompts | [vision-definition](workflows/00_project_management/vision-definition.md) | `docs/planning/vision.md` |
| [`/research`](tools/01_project_management/research.md) | Deep research | Topic argument | [deep-research](workflows/00_project_management/deep-research.md), search-specialist | `docs/planning/research/{date}-{topic}.md` |
| [`/roadmap`](tools/01_project_management/roadmap.md) | Plan milestones | None | [roadmap-planning](workflows/00_project_management/roadmap-planning.md) | `docs/planning/roadmap.md`, GitHub milestones |
| [`/issues`](tools/01_project_management/issues.md) | Generate GitHub issues | User confirmation | [issue-generation](workflows/00_project_management/issue-generation.md) | GitHub issues with labels/milestones |
| [`/kanban`](tools/01_project_management/kanban.md) | Optimize board | User direction | [kanban-optimization](workflows/00_project_management/kanban-optimization.md) | Board updates, health report |
| [`/pm-reflect`](tools/01_project_management/pm-reflect.md) | Review PM effectiveness | None | [pm-reflection](workflows/00_project_management/pm-reflection.md), business-analyst | `docs/planning/reflections/{date}.md` |

#### SDLC Loop Commands

| Command | Purpose | Input | Process | Output |
|---------|---------|-------|---------|--------|
| [`/up`](tools/02_development/up.md) | Start dev environment | None | Supabase, Docker, health checks | Running services, `.env.local` |
| [`/plan`](tools/02_development/plan.md) | Analyze issue | Issue # or URL | Agent orchestration (inline) | Implementation plan, updated issue |
| [`/dev`](tools/02_development/dev.md) | Feature development | Issue # or description | Agent orchestration (inline) | Code changes, tests |
| [`/test`](tools/02_development/test.md) | Run local CI | `--quick`, `--security` | nektos/act (GitHub Actions locally) | Test results, artifacts |
| [`/validate`](tools/02_development/validate.md) | E2E validation | Issue # | Agent orchestration (inline) | Validation report, screenshots |
| [`/reflect`](tools/02_development/reflect.md) | Development reflection | Commits, scope | Agent orchestration (inline) | `.claude/reports/reflections/{date}.md` |
| [`/deploy`](tools/02_development/deploy.md) | Create PR | Issue # | Agent orchestration (inline) | GitHub PR with review guide |
| [`/review`](tools/02_development/review.md) | Check PR status | PR # | code-reviewer agent | Review summary, PR comments |
| [`/merge`](tools/02_development/merge.md) | Merge PR | PR #, strategy | Pre-merge validation, `gh pr merge` | Merged PR, local sync |
| [`/finalize`](tools/02_development/finalize.md) | Close issue | Issue # | Agent orchestration (inline) | Issue closed, prompting log |
| [`/pipeline`](tools/02_development/pipeline.md) | Debug CI failures | PR # | Agent orchestration (inline) | Applied fixes, re-triggered workflow |

#### Observation Loop Commands

| Command | Purpose | Input | Process | Output |
|---------|---------|-------|---------|--------|
| [`/status`](tools/03_observation/status.md) | System health check | None | Health endpoints, alert queries | Service status table, trends |
| [`/slo`](tools/03_observation/slo.md) | Error budget tracking | Service (optional) | 30-day SLO calculation, burn rate | Budget table, forecast |
| [`/metrics`](tools/03_observation/metrics.md) | Trend analysis | Scope (optional) | 4-week baseline, anomaly (>2σ) | Metric tables, anomaly report |
| [`/ux`](tools/03_observation/ux.md) | User experience | None | RUM data, journey completion | Session stats, UX score |
| [`/incident`](tools/03_observation/incident.md) | Incident response | `new` or ID | Severity classification, timeline | `docs/observation/incidents/INC-{id}.md` |
| [`/postmortem`](tools/03_observation/postmortem.md) | Incident postmortem | Incident ID | 5 Whys, impact calculation | `docs/observation/postmortems/PM-{id}.md` |
| [`/digest`](tools/03_observation/digest.md) | Weekly synthesis | None | Aggregates metrics, UX, incidents | `docs/observation/digests/{date}.md` |
| [`/autoobs`](tools/03_observation/autoobs.md) | Autonomous sweep | None | Runs: status→slo→metrics→ux→digest | Complete state, digest |

## 📁 Directory Structure

```
.claude/commands/
├── README.md                       # This file
└── tools/
    ├── 01_project_management/      # 🎯 PM Loop
    │   ├── audit.md
    │   ├── vision.md
    │   ├── research.md
    │   ├── roadmap.md
    │   ├── issues.md
    │   ├── kanban.md
    │   ├── pm-reflect.md
    │   └── autopm.md               # Autonomous PM sweep
    ├── 02_development/             # 🔧 SDLC Loop
    │   ├── up.md
    │   ├── plan.md
    │   ├── dev.md
    │   ├── test.md
    │   ├── validate.md
    │   ├── reflect.md
    │   ├── deploy.md
    │   ├── review.md
    │   ├── merge.md
    │   ├── finalize.md
    │   ├── pipeline.md
    │   └── autodev.md              # Autonomous dev cycle
    └── 03_observation/             # 📊 Observation Loop
        ├── status.md
        ├── slo.md
        ├── metrics.md
        ├── ux.md
        ├── incident.md
        ├── postmortem.md
        ├── digest.md
        └── autoobs.md              # Autonomous observation sweep
```