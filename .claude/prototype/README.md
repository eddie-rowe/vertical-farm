# claude-workflow

Workflow visualization tool for Claude Code sessions.

Captures traces during Claude Code sessions and generates rich HTML reports showing commands, tool calls, files touched, and systems used.

## Features

- **Trace Capture**: Intercepts Claude Code API calls and logs to JSONL
- **Workflow Visualization**: Generates mermaid flowchart of session activity
- **System Detection**: Identifies interactions with GitHub, Supabase, Datadog, etc.
- **File Tracking**: Shows all files read and written
- **Self-contained Reports**: Single HTML file with embedded Tailwind + Mermaid

## Installation

```bash
cd .claude/prototype
npm install
npm run build
```

## Usage

### Run Claude with Tracing

```bash
# From your project directory
npx claude-workflow

# Pass arguments to Claude
npx claude-workflow --dangerously-skip-permissions
```

This will:
1. Start Claude Code with trace interception
2. Log all API calls to `.claude-workflow/session-{timestamp}.jsonl`
3. Generate HTML report when session ends

### Generate Report from Existing JSONL

```bash
npx claude-workflow --generate .claude-workflow/session-2025-12-22.jsonl
```

### View Report

```bash
open .claude-workflow/session-2025-12-22.html
```

## Output

### JSONL Format

Each line contains a request/response pair:

```json
{
  "timestamp": "2025-12-22T16:30:00.000Z",
  "duration_ms": 1234,
  "request": {
    "url": "https://api.anthropic.com/v1/messages",
    "method": "POST",
    "body": { "messages": [...] }
  },
  "response": {
    "status": 200,
    "body": { "content": [...] }
  }
}
```

### HTML Report

The report includes:

1. **Stats Overview** - Event counts, files read/written, bash commands
2. **Workflow Diagram** - Mermaid flowchart of significant events
3. **Systems Touched** - GitHub, Supabase, local files, bash
4. **Timeline** - Chronological event list with details

## Architecture

```
src/
├── cli.ts             # Entry point, spawns Claude with interceptor
├── interceptor.ts     # Fetch proxy, logs to JSONL
├── workflow-parser.ts # Extracts events from raw traces
└── html-generator.ts  # Generates HTML report
```

## Event Types

| Type | Description | Example |
|------|-------------|---------|
| `command` | Slash commands | `/dev`, `/plan` |
| `file_read` | File read operations | `Read: src/app.tsx` |
| `file_write` | File write/edit operations | `Write: package.json` |
| `bash` | Shell commands | `$ npm test` |
| `system_interaction` | External system calls | `gh pr create` |
| `tool_call` | Other tool invocations | `Glob`, `Grep` |

## Detected Systems

- **github** - `gh` commands, GitHub MCP tools
- **supabase** - Supabase CLI, MCP tools
- **datadog** - Datadog CLI commands
- **local** - File operations
- **web** - WebFetch, WebSearch

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Test locally
node dist/cli.js
```

## Inspiration

Based on [claude-trace](https://github.com/badlogic/lemmy/tree/main/apps/claude-trace) by badlogic.

Key differences:
- **Focus on workflow visualization** vs raw trace debugging
- **Mermaid diagrams** showing command flow
- **System detection** for GitHub, Supabase, etc.
- **Simpler output** - single HTML file

## Business Value

### Why This Matters

AI coding assistants generate tremendous value, but the *how* of that value creation is ephemeral. Sessions end, context is lost, and institutional knowledge never gets captured.

**claude-workflow solves this by turning sessions into artifacts.**

| Value Driver | Description |
|--------------|-------------|
| **Knowledge Capture** | Turn ephemeral AI sessions into persistent, searchable documentation |
| **Onboarding Acceleration** | New team members see visual maps of how work gets done |
| **Process Optimization** | Identify bottlenecks and inefficiencies in AI-assisted workflows |
| **Compliance & Audit** | Document how AI influenced decisions for regulatory requirements |
| **Best Practice Codification** | Capture successful patterns and share them across teams |

### Market Positioning

| Tool | Focus | What's Missing |
|------|-------|----------------|
| **Datadog LLM Observability** | Operational metrics, cost tracking, debugging | No workflow visualization or knowledge capture |
| **LangSmith** | Agent chain tracing, evaluation | Chain-focused, not session/workflow focused |
| **Comet Opik** | Prompt logging, A/B testing | No process documentation or team patterns |
| **Weights & Biases** | Experiment tracking, model metrics | ML-focused, not developer workflow |

**claude-workflow fills the gap**: `Session → Workflow → Knowledge`

Existing tools answer *"Did the API call succeed?"*
We answer *"How does our team use AI to ship features?"*

## Path to Productization

### Phase 1: Open Source CLI (Current)
- Single-user workflow capture
- Self-contained HTML reports
- Build community, gather feedback
- **Goal**: Validate core value proposition

### Phase 2: Team Features
- Aggregate workflow patterns across team members
- Shared report storage (S3, GCS, or self-hosted)
- Workflow templates and best practices library
- Compare workflows: "How did Alice solve this vs Bob?"
- **Goal**: Prove team-level value

### Phase 3: SaaS Platform
- Cloud storage with search and filtering
- Team dashboards and analytics
- Integration with existing observability (Datadog, Grafana)
- AI-powered workflow recommendations
- Compliance reporting and audit trails
- **Goal**: Scalable revenue

### Monetization Options

| Model | Description | Target |
|-------|-------------|--------|
| **Open Core** | CLI free forever, team features paid | Developers → Teams |
| **Usage-Based** | Free tier (10 sessions/mo), then per-session | Individual → Scale |
| **Enterprise** | Self-hosted deployment + support contracts | Regulated industries |

### Competitive Moat

1. **First-mover** in workflow visualization for AI coding tools
2. **Open source community** builds trust and adoption
3. **Integration depth** with Claude Code ecosystem
4. **Knowledge graph** from aggregated workflows (with permission)

## License

MIT
