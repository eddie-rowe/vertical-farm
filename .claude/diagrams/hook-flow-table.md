# Hook Flow Table View

## /plan Command Execution Flow

| Step | User Input | UserPromptSubmit Hook | Command Execution | PostToolUse Hook | Stop Hook | Context State |
|------|------------|----------------------|-------------------|------------------|-----------|---------------|
| 0 | Types `/plan 123` | - | - | - | - | `phase: null` |
| 1 | - | 🪝 **Triggered**<br>• Match: `/plan*`<br>• Run: `on-slash-command.sh` | - | - | - | - |
| 2 | - | • Update git state<br>• Set `phase: planning`<br>• Log: "Context initialized" | - | - | - | `phase: planning`<br>`changes: updated` |
| 3 | - | - | **Step 1: Validate**<br>• Parse issue number<br>• Check format | - | - | - |
| 4 | Sees: "🤖 Starting..." | - | **Step 2: Begin**<br>• Show messages<br>• "📋 Analyzing issue: 123" | - | - | - |
| 5 | - | - | **Step 3: Execute**<br>• Run workflow<br>• Call github-issue-analyzer | - | - | - |
| 6 | - | - | - | 🪝 **Triggered**<br>• Match: `Task`<br>• Run: `after-task-complete.sh` | - | - |
| 7 | - | - | - | • Save analysis results<br>• Update requirements<br>• Store subtasks | - | `analysis: populated` |
| 8 | Sees: "📂 Context saved" | - | **Step 4: Complete**<br>• Show final messages<br>• "💡 Use /dev next" | - | - | - |
| 9 | - | - | - | - | 🪝 **Triggered**<br>• Run: `context-phase-update.sh` | - |
| 10 | Ready for `/dev` | - | - | - | • Rotate agents<br>• Finalize context | `agents: rotated`<br>`Ready for /dev` |

## /dev Command Execution Flow

| Step | User Input | UserPromptSubmit Hook | Command Execution | PostToolUse Hook | Stop Hook | Context State |
|------|------------|----------------------|-------------------|------------------|-----------|---------------|
| 0 | Types `/dev 123` | - | - | - | - | `phase: planning`<br>`analysis: exists` |
| 1 | - | 🪝 **Triggered**<br>• Match: `/dev*`<br>• Run: `on-slash-command.sh` | - | - | - | - |
| 2 | - | • Check phase: "planning"<br>• Log: "Continuing from planning" | - | - | - | Context loaded |
| 3 | - | - | **Step 1: Parse**<br>• Determine issue vs feature | - | - | - |
| 4 | - | - | **Step 2: Check Context**<br>• Find existing analysis<br>• Load subtasks | - | - | - |
| 5 | Sees: "⚡ Starting..." | - | **Step 3: Handle Type**<br>• Use prior analysis<br>• Skip re-analysis | - | - | - |
| 6 | - | - | **Step 4: Develop**<br>• Execute agents<br>• Implement features | - | - | - |
| 7 | - | - | - | 🪝 **Triggered**<br>• Save implementation | - | `implementation: populated` |
| 8 | - | - | - | - | 🪝 **Triggered**<br>• Set phase: development | `phase: development` |
| 9 | Ready for `/validate` | - | - | - | - | `Ready for validation` |

## /validate Command Execution Flow

| Step | User Input | UserPromptSubmit Hook | Command Execution | PostToolUse Hook | Stop Hook | Context State |
|------|------------|----------------------|-------------------|------------------|-----------|---------------|
| 0 | Types `/validate 123` | - | - | - | - | `phase: development`<br>`implementation: exists` |
| 1 | - | 🪝 **Triggered**<br>• Check development phase<br>• Log: "Ready to validate" | - | - | - | - |
| 2 | - | - | **Step 1-2: Setup**<br>• Validate input<br>• Load context | - | - | - |
| 3 | - | - | **Step 3: Analyze**<br>• Run git diff<br>• Compare changes | - | - | - |
| 4 | - | - | **Step 4: Test**<br>• Playwright testing<br>• Capture screenshots | - | - | - |
| 5 | - | - | - | 🪝 **Triggered**<br>• Save test results<br>• Store screenshots | - | `validation: populated` |
| 6 | - | - | - | - | 🪝 **Triggered**<br>• Set phase: validation | `phase: validation` |
| 7 | Validation complete | - | - | - | - | `Ready for PR` |

## Hook Summary Matrix

| Hook Type | Trigger | Scripts | Purpose | Updates |
|-----------|---------|---------|---------|---------|
| **UserPromptSubmit** | User types slash command | `on-slash-command.sh` | Initialize context for command | Git state, phase |
| **PostToolUse** | Task tool completes | `after-task-complete.sh` | Save agent results | Analysis/implementation/validation data |
| **Stop** | Claude finishes response | `context-phase-update.sh` | Finalize workflow step | Agent rotation, phase completion |

## Context Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Initial   │     │   Planning  │     │ Development │     │ Validation  │
│   State     │────▶│    Phase    │────▶│    Phase    │────▶│    Phase    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │                    │
      ▼                    ▼                    ▼                    ▼
   phase: null       phase: planning      phase: development   phase: validation
   analysis: []      analysis: ✓          analysis: ✓         analysis: ✓
   implementation: []                     implementation: ✓   implementation: ✓
   validation: []                                            validation: ✓
```

## Key Benefits of Hook Architecture

1. **Automatic Context Management** - No manual script calls needed
2. **Event-Driven Updates** - Hooks respond to Claude's actions
3. **Phase Tracking** - Always know where you are in workflow
4. **Seamless Handoffs** - Each command builds on previous work
5. **Clean Commands** - Focus on logic, not context management
6. **Version Controlled** - Hooks in `.claude/settings.json` are committed
7. **Team Consistency** - Everyone gets same hook behavior