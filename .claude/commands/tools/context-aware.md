# Context-Aware Workflow Helper

This tool helps workflows maintain context between phases using a simple YAML file.

## How It Works

1. **Context File**: `.claude/context/simple-context.yaml`
   - Automatically updated by git hooks
   - Read by workflows to understand previous work
   - Contains only essential information

2. **No Scripts Required**
   - Workflows simply read the YAML file
   - Git hooks update it automatically
   - Claude agents understand YAML natively

## Usage in Workflows

When starting any workflow, include this in your prompt:

```
"Check .claude/context/simple-context.yaml for previous context and decisions."
```

## What Gets Tracked

- **Session Info**: Current issue, branch, phase
- **Changes**: Modified files, created files
- **Decisions**: Important choices made
- **Patterns**: Key architectural rules to follow
- **Validation**: Test results and errors

## Benefits

- ✅ No complex scripts to maintain
- ✅ Single source of truth
- ✅ Git hooks handle updates
- ✅ Human-readable YAML
- ✅ Works with any Claude agent

## Example Context Usage

```yaml
# When planning
"Review the patterns section in .claude/context/simple-context.yaml"

# When developing  
"Check files_modified in .claude/context/simple-context.yaml to see what changed"

# When testing
"Update validation section in .claude/context/simple-context.yaml with results"
```

This approach is simple, effective, and doesn't require any complex infrastructure.