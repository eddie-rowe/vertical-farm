#!/bin/bash
# Hook script that runs automatically when slash commands are used
# Called by UserPromptSubmit hook in settings.local.json

COMMAND="$1"
CONTEXT_FILE=".claude/context/simple-context.yaml"

# Log the command being executed
echo "🪝 Hook triggered for /$COMMAND command"

# Update git-based context
.claude/hooks/simple-context-hook.sh update

# Set the phase based on command
case "$COMMAND" in
    plan)
        # Starting planning phase
        .claude/hooks/context-phase-update.sh phase "planning"
        echo "📋 Context initialized for issue analysis"
        ;;
    dev)
        # Check if we're continuing from planning
        CURRENT_PHASE=$(grep "phase:" "$CONTEXT_FILE" | awk '{print $2}')
        if [ "$CURRENT_PHASE" = "planning" ]; then
            echo "🔄 Continuing from planning phase with existing context"
        else
            echo "🆕 Starting fresh development workflow"
        fi
        ;;
    validate)
        # Check if we're continuing from development
        CURRENT_PHASE=$(grep "phase:" "$CONTEXT_FILE" | awk '{print $2}')
        if [ "$CURRENT_PHASE" = "development" ]; then
            echo "✅ Ready to validate implementation"
        else
            echo "⚠️  No development context found - validation may be limited"
        fi
        ;;
    reflect|pipeline)
        # These commands don't need phase tracking
        echo "🔍 Context captured for $COMMAND workflow"
        ;;
    *)
        echo "📝 Context updated for command: $COMMAND"
        ;;
esac

# Exit successfully so hook doesn't block
exit 0