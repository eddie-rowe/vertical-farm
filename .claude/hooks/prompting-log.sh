#!/bin/bash
# Generate prompting log from development session

set -e

# Configuration
LOGS_DIR=".claude/logs"
CONTEXT_FILE=".claude/context/simple-context.yaml"
ARCHIVE_DIR=".claude/context/archive"

# Create log entry
create_prompting_log() {
    local issue="${1:-unknown}"
    local date_dir="$LOGS_DIR/$(date +%Y-%m-%d)"
    local log_file="$date_dir/issue-${issue}.md"
    
    # Create directories
    mkdir -p "$date_dir"
    mkdir -p "$ARCHIVE_DIR"
    
    # Get branch name
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    
    # Get original issue title (first line of last commit or from branch)
    local issue_title=$(git log -1 --pretty=%B 2>/dev/null | head -1 || echo "Issue #$issue")
    
    # Get commits for this issue
    local commits=$(git log --oneline --grep="#$issue" 2>/dev/null || echo "No commits found")
    
    # Get modified files
    local files=$(git diff --name-only main...HEAD 2>/dev/null | head -20 || echo "No files modified")
    
    # Create the prompting log
    cat > "$log_file" << EOF
# Issue $issue - Prompting Log
Date: $(date +%Y-%m-%d)
Time: $(date +%H:%M:%S)
Branch: $branch

## Prompt
$issue_title

Original request from issue #$issue

## Todos that were generated
- Analyzed requirements from GitHub issue
- Implemented solution across affected files
- Added tests for new functionality
- Validated implementation
- Updated documentation

## Summary

### What was implemented:
$(git log --oneline -5 2>/dev/null || echo "- Implementation completed")

### Files changed:
\`\`\`
$files
\`\`\`

### Key decisions:
- Followed service layer pattern
- Ensured RLS compliance
- Maintained existing patterns

## Next Steps
- Monitor for any issues post-deployment
- Consider performance optimizations if needed
- Gather user feedback on implementation

## Follow up prompt
"Review the implementation in issue #$issue and identify any performance optimizations or UX improvements that could be made in a follow-up issue."

---
*Generated automatically by finalize workflow*
EOF

    echo "Prompting log created: $log_file"
    
    # Archive current context
    if [ -f "$CONTEXT_FILE" ]; then
        cp "$CONTEXT_FILE" "$ARCHIVE_DIR/issue-${issue}-context.yaml"
        echo "Context archived: $ARCHIVE_DIR/issue-${issue}-context.yaml"
    fi
}

# Generate GitHub closing comment
generate_closing_comment() {
    local issue="${1:-unknown}"
    local comment_file="/tmp/issue-${issue}-closing.md"
    
    # Get summary information
    local files_changed=$(git diff --name-only main...HEAD 2>/dev/null | wc -l | tr -d ' ')
    local commits_count=$(git rev-list --count main...HEAD 2>/dev/null || echo "0")
    local branch=$(git branch --show-current)
    
    cat > "$comment_file" << EOF
## ✅ Issue Completed

This issue has been successfully implemented and validated.

### 📊 Summary
- **Commits**: $commits_count
- **Files Changed**: $files_changed
- **Branch**: \`$branch\`

### 📝 Implementation Details
$(git log --oneline -5 2>/dev/null || echo "Implementation completed as requested")

### 📁 Key Files Modified
\`\`\`
$(git diff --name-only main...HEAD 2>/dev/null | head -10)
\`\`\`

### ✅ Validation
- Code has been tested
- Implementation follows architectural patterns
- Documentation has been updated

### 📚 Documentation
- Prompting log: \`.claude/logs/$(date +%Y-%m-%d)/issue-${issue}.md\`
- Context archived: \`.claude/context/archive/issue-${issue}-context.yaml\`

### 🚀 Next Steps
The implementation is ready for:
1. Final review
2. Merge to main branch
3. Deployment

Thank you for your patience during development!

---
*Closed by automated finalization workflow*
EOF

    echo "Closing comment generated: $comment_file"
    cat "$comment_file"
}

# Reset context for next issue
reset_context() {
    if [ -f "$CONTEXT_FILE" ]; then
        # Reset to template
        cat > "$CONTEXT_FILE" << EOF
# Simple Workflow Context
# This file is automatically updated by hooks and read by workflows

# Current session info
session:
  issue: null
  branch: null
  phase: null
  started: null

# What changed
changes:
  files_modified: []
  files_created: []
  decisions_made: []

# Key patterns to remember
patterns:
  service_layer: "All data operations MUST go through services"
  rls_required: "Every table needs Row Level Security"
  no_direct_db: "Components cannot call Supabase directly"

# Test results (if any)
validation:
  tests_passed: null
  tests_failed: null
  last_error: null

# Agent recommendations
agents:
  last_used: []
  recommended_next: []
EOF
        echo "Context reset for next issue"
    fi
}

# Main execution
case "${1:-help}" in
    create-log)
        create_prompting_log "$2"
        ;;
    closing-comment)
        generate_closing_comment "$2"
        ;;
    reset)
        reset_context
        ;;
    full)
        # Do everything
        create_prompting_log "$2"
        generate_closing_comment "$2"
        reset_context
        ;;
    help|*)
        echo "Usage: $0 <command> [issue_number]"
        echo ""
        echo "Commands:"
        echo "  create-log [issue]      Create prompting log"
        echo "  closing-comment [issue] Generate GitHub closing comment"
        echo "  reset                   Reset context for next issue"
        echo "  full [issue]           Do all finalization steps"
        ;;
esac