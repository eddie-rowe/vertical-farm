# Simple Context Management

## The Problem
Workflows lose context between phases (planning → dev → test → deploy).

## The Solution  
One YAML file that tracks essential context: `.claude/context/simple-context.yaml`

## How It Works

### 1. Update Context
```bash
make context  # Updates context from git state
```

### 2. Workflows Read It
Each workflow is told to check the context file:
```
"Check .claude/context/simple-context.yaml for previous context"
```

### 3. That's It!
No complex scripts, no token management, just a simple YAML file.

## What Gets Tracked

```yaml
session:
  issue: 123          # Current issue number
  branch: feature-123 # Current branch
  phase: development  # Current phase

changes:
  files_modified:     # What files changed
    - src/components/NewGrowSetup.tsx
    - backend/app/api/v1/devices.py

patterns:             # Key rules to remember
  service_layer: "All data operations MUST go through services"
  rls_required: "Every table needs Row Level Security"
```

## Workflow Usage

```bash
# Planning
make plan ISSUE=123
# → Updates context, tells Claude to check it

# Development  
make dev ISSUE=123
# → Updates context with files changed

# Validation
make validate ISSUE=123
# → Context includes what to validate

# Deployment
make deploy ISSUE=123
# → Context has all changes to deploy
```

## Benefits

✅ **Simple** - Just one YAML file  
✅ **Automatic** - Git hooks update it  
✅ **Effective** - Claude reads it naturally  
✅ **No Scripts** - No complex infrastructure  

## Advanced Usage (Optional)

If you need to add a decision manually:
```bash
.claude/hooks/simple-context-hook.sh decision "Using singleton pattern for service"
```

View current context:
```bash
make context-show
```

That's all there is to it. Simple, effective context management.