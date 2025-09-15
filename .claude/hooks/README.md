# Claude Code Hooks System

This directory contains automated hooks that integrate with Claude Code to manage context and workflow state automatically.

## How Hooks Work

Claude Code hooks are **event-driven scripts** that run automatically at specific points during your interaction with Claude. They're configured in `.claude/settings.local.json` and execute without manual intervention.

## Configured Hooks

### 1. UserPromptSubmit Hooks
**Trigger:** When you use slash commands (`/plan`, `/dev`, `/validate`)
**Script:** `on-slash-command.sh`
**Purpose:** 
- Captures current git state
- Sets workflow phase
- Initializes context for the command

### 2. PostToolUse Hooks  
**Trigger:** After Task tool completes
**Script:** `after-task-complete.sh`
**Purpose:**
- Saves agent results to context
- Updates phase-specific data
- Rotates agent recommendations

### 3. Stop Hook
**Trigger:** When Claude finishes responding
**Script:** `context-phase-update.sh rotate_agents`
**Purpose:**
- Finalizes context updates
- Moves recommended agents to last_used

## Hook Scripts

### `simple-context-hook.sh`
Basic context management that captures:
- Current git branch and issue number
- Modified files
- Session information

### `context-phase-update.sh`
Phase-specific context updates for:
- Planning phase (requirements, subtasks)
- Development phase (files created, services)
- Validation phase (test results, metrics)

### `on-slash-command.sh`
Automatically runs when slash commands are used to:
- Initialize appropriate workflow phase
- Check for existing context
- Provide feedback about workflow state

### `after-task-complete.sh`
Runs after agents complete to:
- Save results based on current phase
- Update implementation details
- Track validation outcomes

## Context Flow

```
/plan → UserPromptSubmit hook → Initialize planning context
      → Task completes → PostToolUse hook → Save analysis
      
/dev  → UserPromptSubmit hook → Check for planning context
      → Agents complete → PostToolUse hook → Save implementation
      
/validate → UserPromptSubmit hook → Check for dev context
         → Tests complete → PostToolUse hook → Save results
```

## Key Benefits

1. **Automatic Context Management** - No manual script calls needed
2. **Phase Tracking** - Knows where you are in the workflow
3. **Seamless Handoffs** - Each command builds on previous work
4. **Event-Driven** - Responds to Claude's actions automatically

## Configuration

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [...],
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

## Security Note

⚠️ **USE AT YOUR OWN RISK** - Hooks execute shell commands automatically. Always review hook scripts before enabling them.

## Debugging

To see hook output, look for lines starting with 🪝 in Claude's responses. Hooks run silently but log key actions for visibility.