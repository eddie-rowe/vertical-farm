#!/bin/bash
# Hook script that runs automatically after Task tool completes
# Called by PostToolUse hook in settings.local.json

CONTEXT_FILE=".claude/context/simple-context.yaml"

# Get current phase to determine what to update
CURRENT_PHASE=$(grep "phase:" "$CONTEXT_FILE" | awk '{print $2}')

echo "🪝 Task completed - updating context for phase: $CURRENT_PHASE"

case "$CURRENT_PHASE" in
    planning)
        # After github-issue-analyzer completes
        echo "📊 Saving analysis results to context..."
        # The Task tool output should contain requirements, subtasks, etc.
        # These will be parsed and saved by Claude when it processes results
        ;;
    development)
        # After development agents complete
        echo "💾 Saving implementation details to context..."
        # Track files created, services updated, etc.
        ;;
    validation)
        # After playwright-tester completes
        echo "✅ Saving validation results to context..."
        # Track test results, screenshots, metrics
        ;;
    *)
        echo "📝 Context updated after task completion"
        ;;
esac

# Update last_used agents
.claude/hooks/context-phase-update.sh rotate_agents

# Exit successfully
exit 0