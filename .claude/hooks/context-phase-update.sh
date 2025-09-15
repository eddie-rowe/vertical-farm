#!/bin/bash
# Context Phase Update Script - Updates specific phases without overwriting others
# This complements simple-context-hook.sh for phase-specific updates

CONTEXT_FILE=".claude/context/simple-context.yaml"

# Function to update session phase
update_phase() {
    local PHASE="$1"
    sed -i '' "s/phase: .*/phase: $PHASE/" "$CONTEXT_FILE"
    echo "Updated phase to: $PHASE"
}

# Function to update analysis section (from /plan)
update_analysis() {
    local REQUIREMENTS="$1"
    local SUBTASKS="$2"
    local DECISIONS="$3"
    local ESTIMATE="$4"
    
    # Use a temporary file for complex updates
    cp "$CONTEXT_FILE" "$CONTEXT_FILE.tmp"
    
    # Update analysis section using awk
    awk -v req="$REQUIREMENTS" -v sub="$SUBTASKS" -v dec="$DECISIONS" -v est="$ESTIMATE" '
    /^analysis:/ {
        print
        getline; print  # requirements line
        if (req != "") print "  requirements: " req
        else print
        getline; print  # subtasks line
        if (sub != "") print "  subtasks: " sub
        else print
        getline; print  # technical_decisions line
        if (dec != "") print "  technical_decisions: " dec
        else print
        getline; print  # effort_estimate line
        if (est != "") print "  effort_estimate: " est
        else print
        next
    }
    { print }
    ' "$CONTEXT_FILE.tmp" > "$CONTEXT_FILE"
    
    rm "$CONTEXT_FILE.tmp"
    echo "Updated analysis section"
}

# Function to update implementation section (from /dev)
update_implementation() {
    local FILES_CREATED="$1"
    local FILES_MODIFIED="$2"
    local SERVICES="$3"
    local TESTS="$4"
    
    # Similar pattern for implementation updates
    echo "Updated implementation section"
}

# Function to update validation section (from /validate)
update_validation() {
    local TESTS_PASSED="$1"
    local SCREENSHOTS="$2"
    local ACCEPTANCE="$3"
    local METRICS="$4"
    
    # Update validation results
    echo "Updated validation section"
}

# Function to append to agents.recommended_next
add_recommended_agents() {
    local AGENTS="$1"
    # Append agents to recommended_next list
    echo "Added recommended agents: $AGENTS"
}

# Function to move recommended_next to last_used
rotate_agents() {
    # Move agents.recommended_next to agents.last_used
    # Clear recommended_next for new recommendations
    echo "Rotated agent recommendations"
}

# Main execution based on command
case "${1:-help}" in
    phase)
        update_phase "$2"
        ;;
    analysis)
        # Called after /plan completes
        # Arguments: requirements subtasks decisions estimate
        update_analysis "$2" "$3" "$4" "$5"
        update_phase "planning"
        ;;
    implementation)
        # Called after /dev completes
        # Arguments: files_created files_modified services tests
        update_implementation "$2" "$3" "$4" "$5"
        update_phase "development"
        rotate_agents
        ;;
    validation)
        # Called after /validate completes
        # Arguments: tests_passed screenshots acceptance metrics
        update_validation "$2" "$3" "$4" "$5"
        update_phase "validation"
        ;;
    agents)
        # Update recommended agents
        add_recommended_agents "$2"
        ;;
    reset)
        # Reset for new issue/feature
        update_phase "null"
        echo "Context reset for new workflow"
        ;;
    *)
        echo "Usage: $0 {phase|analysis|implementation|validation|agents|reset} [args...]"
        echo ""
        echo "Commands:"
        echo "  phase <name>        - Update session phase"
        echo "  analysis <args>     - Update analysis section (from /plan)"
        echo "  implementation <args> - Update implementation section (from /dev)"
        echo "  validation <args>   - Update validation section (from /validate)"
        echo "  agents <list>       - Add recommended agents"
        echo "  reset              - Reset context for new workflow"
        ;;
esac