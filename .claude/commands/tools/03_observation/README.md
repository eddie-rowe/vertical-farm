# Observation Workflow Commands

Monitor production and close the feedback loop. These commands surface insights that feed back into PM planning.

## Observation Loop — Is it working?

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

## Commands

| Command | Purpose | Input | Process | Output |
|---------|---------|-------|---------|--------|
| [`/status`](status.md) | System health check | None | Health endpoints, alert queries | Service status table, trends |
| [`/slo`](slo.md) | Error budget tracking | Service (optional) | 30-day SLO calculation, burn rate | Budget table, forecast |
| [`/metrics`](metrics.md) | Trend analysis | Scope (optional) | 4-week baseline, anomaly (>2σ) | Metric tables, anomaly report |
| [`/ux`](ux.md) | User experience | None | RUM data, journey completion | Session stats, UX score |
| [`/incident`](incident.md) | Incident response | `new` or ID | Severity classification, timeline | `docs/observation/incidents/INC-{id}.md` |
| [`/postmortem`](postmortem.md) | Incident postmortem | Incident ID | 5 Whys, impact calculation | `docs/observation/postmortems/PM-{id}.md` |
| [`/digest`](digest.md) | Weekly synthesis | None | Aggregates metrics, UX, incidents | `docs/observation/digests/{date}.md` |
| [`/autoobs`](autoobs.md) | Autonomous sweep | None | Runs: status→slo→metrics→ux→digest | Complete state, digest |

## Core Principle: Signal Over Noise

All commands query **aggregated, trend-based metrics** to surface meaningful patterns:

- **Statistical baselines**: Compare against 4-week rolling averages
- **Percentile focus**: Use p50, p95, p99 instead of individual requests
- **Week-over-week deltas**: Surface patterns, not transient spikes
- **Impact categorization**: User-affecting issues prioritized over infra noise
- **Significance threshold**: Only surface >2σ deviations from baseline

## Workflow Patterns

| Pattern | When to Use | Commands |
|---------|-------------|----------|
| **Weekly Cycle** | Standard observation | `/status` → `/slo` → `/metrics` → `/ux` → `/digest` |
| **Incident Response** | When alerts fire | `/incident new` → Resolution → `/postmortem {id}` |
| **Full Sweep** | Autonomous mode | `/autoobs` |

## Command Parameters

| Command | Accepts | Examples |
|---------|---------|----------|
| `/status` | No arguments | `/status` |
| `/slo` | Optional service filter | `/slo`, `/slo api`, `/slo edge-functions` |
| `/metrics` | Optional scope | `/metrics`, `/metrics frontend`, `/metrics database` |
| `/ux` | No arguments | `/ux` |
| `/incident` | `new` or incident ID | `/incident new`, `/incident INC-42` |
| `/postmortem` | Incident ID (required) | `/postmortem INC-42` |
| `/digest` | No arguments | `/digest` |
| `/autoobs` | No arguments | `/autoobs` |

## Output Locations

```
docs/observation/
├── digests/
│   └── YYYY-MM-DD.md      # Weekly synthesis reports
├── incidents/
│   └── INC-{id}.md        # Incident documentation
└── postmortems/
    └── PM-{id}.md         # Postmortem analyses
```

## Datadog Integration

**Environment Variables:**
- `DD_API_KEY` - Datadog API key
- `DD_APP_KEY` - Datadog application key
- `DD_SITE` - Datadog site (default: datadoghq.com)

**Data Sources:**
- APM traces and metrics
- RUM (Real User Monitoring)
- Infrastructure metrics
- Log aggregations

## Handoff to PM Loop

Observation digests inform the next planning cycle:

```
Observation Loop: /digest creates docs/observation/digests/{date}.md
    ↓
PM Loop: /audit reads digests → /vision → /roadmap
```

The Observation loop monitors **is it working**. The PM loop decides **what to build next**.
