#!/bin/bash
# Simple Context Hook - Minimal context management

CONTEXT_FILE=".claude/context/simple-context.yaml"

# Update context based on git state
update_context() {
    # Get current branch and issue number
    BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    ISSUE=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1)
    
    # Update basic session info
    if [ -n "$ISSUE" ]; then
        sed -i '' "s/issue: .*/issue: $ISSUE/" "$CONTEXT_FILE"
    fi
    sed -i '' "s/branch: .*/branch: $BRANCH/" "$CONTEXT_FILE"
    
    # Get modified files (last 10)
    FILES=$(git diff --name-only 2>/dev/null | head -10 | sed 's/^/    - /' | tr '\n' '|')
    
    # Update files_modified in place
    if [ -n "$FILES" ]; then
        # Replace the files_modified section
        awk -v files="$FILES" '
            /^  files_modified:/ { 
                print "  files_modified:"
                split(files, arr, "|")
                for (i in arr) {
                    if (arr[i] != "") print arr[i]
                }
                in_files = 1
                next
            }
            in_files && /^  [a-z_]+:/ { in_files = 0 }
            !in_files { print }
        ' "$CONTEXT_FILE" > /tmp/context_tmp.yaml
        mv /tmp/context_tmp.yaml "$CONTEXT_FILE"
    fi
    
    echo "Context updated: $CONTEXT_FILE"
}

# Simple function to add a decision
add_decision() {
    DECISION="$1"
    echo "    - \"$DECISION\"" >> "$CONTEXT_FILE"
}

# Main execution
case "${1:-update}" in
    update)
        update_context
        ;;
    decision)
        add_decision "$2"
        ;;
    show)
        cat "$CONTEXT_FILE"
        ;;
    *)
        echo "Usage: $0 [update|decision|show]"
        ;;
esac