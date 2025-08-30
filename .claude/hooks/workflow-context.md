# Simplified Context Management via Hooks

## Hook: Auto-Save Context
Automatically saves relevant context after each workflow phase.

```bash
# After planning phase
echo "issue: $ISSUE_NUMBER" > .claude/context/current.yaml
echo "phase: planning" >> .claude/context/current.yaml
echo "decisions: []" >> .claude/context/current.yaml

# After development phase  
echo "modified_files:" >> .claude/context/current.yaml
git diff --name-only | sed 's/^/  - /' >> .claude/context/current.yaml

# After testing phase
echo "test_results: passed" >> .claude/context/current.yaml
```

## Hook: Load Previous Context
Each workflow reads the previous context:

```bash
# At workflow start
if [ -f .claude/context/current.yaml ]; then
  cat .claude/context/current.yaml
fi
```

## Usage in Workflows

Simply reference the context file in your workflow prompts:

```
"Analyze issue $ISSUE. Previous context available in .claude/context/current.yaml"
```

The AI agent will read and use the context automatically.