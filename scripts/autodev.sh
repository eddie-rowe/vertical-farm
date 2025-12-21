#!/bin/bash
#
# autodev.sh - Autonomous development loop for GitHub issues
#
# Usage: ./scripts/autodev.sh <issue_number>
#
# This script runs the full development workflow in a background tmux session:
#   /up → /plan → /dev → /test → /validate → /deploy
#
# Monitor progress:  tmux attach -t autodev-<issue>
# View logs:         tail -f logs/autodev-<issue>-*.log
# Kill session:      tmux kill-session -t autodev-<issue>
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POLL_INTERVAL=5  # seconds between completion checks
MAX_WAIT_TIME=3600  # max seconds to wait for a single phase (1 hour)
CLAUDE_INIT_WAIT=10  # seconds to wait for Claude to initialize

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    local level=$1
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] $*" | tee -a "$LOG_FILE"
}

log_info() { log "${BLUE}INFO${NC}" "$@"; }
log_success() { log "${GREEN}SUCCESS${NC}" "$@"; }
log_warn() { log "${YELLOW}WARN${NC}" "$@"; }
log_error() { log "${RED}ERROR${NC}" "$@"; }

# Validation
validate_args() {
    if [[ $# -lt 1 ]]; then
        echo "Usage: $0 <issue_number>"
        echo ""
        echo "Example: $0 123"
        exit 1
    fi

    if ! [[ "$1" =~ ^[0-9]+$ ]]; then
        echo "Error: Issue number must be a positive integer"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing=()

    if ! command -v tmux &> /dev/null; then
        missing+=("tmux")
    fi

    if ! command -v claude &> /dev/null; then
        missing+=("claude (Claude Code CLI)")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "Error: Missing dependencies: ${missing[*]}"
        exit 1
    fi
}

# Check if session already exists
check_existing_session() {
    if tmux has-session -t "$SESSION" 2>/dev/null; then
        echo "Error: Session '$SESSION' already exists"
        echo ""
        echo "Options:"
        echo "  - Attach to it:  tmux attach -t $SESSION"
        echo "  - Kill it:       tmux kill-session -t $SESSION"
        exit 1
    fi
}

# Wait for Claude prompt to be ready
wait_for_prompt() {
    local timeout=${1:-60}
    local elapsed=0

    log_info "Waiting for Claude to be ready..."

    while [[ $elapsed -lt $timeout ]]; do
        # Capture current tmux pane content
        local content=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null || echo "")

        # Check for the Claude prompt indicator (>)
        # The prompt appears at the start of a line when Claude is ready for input
        if echo "$content" | grep -qE '^\s*>' 2>/dev/null; then
            log_success "Claude is ready"
            return 0
        fi

        sleep "$POLL_INTERVAL"
        elapsed=$((elapsed + POLL_INTERVAL))
    done

    log_error "Timeout waiting for Claude to initialize"
    return 1
}

# Wait for a command to complete
wait_for_completion() {
    local phase=$1
    local elapsed=0
    local last_content=""
    local stable_count=0
    local required_stable=3  # require 3 consecutive stable checks

    log_info "Waiting for '$phase' to complete..."

    while [[ $elapsed -lt $MAX_WAIT_TIME ]]; do
        sleep "$POLL_INTERVAL"
        elapsed=$((elapsed + POLL_INTERVAL))

        # Capture current tmux pane content (last 50 lines)
        local content=$(tmux capture-pane -t "$SESSION" -p -S -50 2>/dev/null || echo "")

        # Check for error indicators
        if echo "$content" | grep -qiE '(fatal error|panic|segmentation fault)'; then
            log_error "Critical error detected during '$phase'"
            return 2
        fi

        # Check for prompt indicator (>) at end of output
        # This suggests Claude is waiting for next input
        if echo "$content" | tail -5 | grep -qE '^\s*>'; then
            # Make sure output has stabilized (not still streaming)
            if [[ "$content" == "$last_content" ]]; then
                stable_count=$((stable_count + 1))
                if [[ $stable_count -ge $required_stable ]]; then
                    log_success "'$phase' completed"
                    return 0
                fi
            else
                stable_count=0
            fi
        fi

        last_content="$content"

        # Progress indicator every minute
        if [[ $((elapsed % 60)) -eq 0 ]]; then
            log_info "Still waiting for '$phase'... (${elapsed}s elapsed)"
        fi
    done

    log_error "Timeout waiting for '$phase' to complete"
    return 1
}

# Send a command to the tmux session
send_command() {
    local cmd=$1
    log_info "Executing: $cmd"
    tmux send-keys -t "$SESSION" "$cmd" Enter
}

# Run a phase of the workflow
run_phase() {
    local phase_name=$1
    local cmd=$2
    local critical=${3:-false}

    echo ""
    log_info "========== Phase: $phase_name =========="

    send_command "$cmd"

    if ! wait_for_completion "$phase_name"; then
        if [[ "$critical" == "true" ]]; then
            log_error "Critical phase '$phase_name' failed - aborting workflow"
            return 1
        else
            log_warn "Phase '$phase_name' had issues - continuing anyway"
            return 0
        fi
    fi

    return 0
}

# Notify completion
notify_complete() {
    local status=$1
    local pr_url=${2:-""}

    # Terminal bell
    echo -e '\a'

    if [[ "$status" == "success" ]]; then
        log_success "Workflow completed successfully!"
        if [[ -n "$pr_url" ]]; then
            log_info "PR URL: $pr_url"
        fi
    else
        log_warn "Workflow completed with issues - check logs"
    fi

    log_info "Log file: $LOG_FILE"
    log_info "tmux session: $SESSION (attach with: tmux attach -t $SESSION)"
}

# Cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script exited with code $exit_code"
        echo -e '\a'  # Bell on error too
    fi
}

# Main execution
main() {
    validate_args "$@"
    check_dependencies

    ISSUE=$1
    SESSION="autodev-$ISSUE"
    LOG_FILE="$PROJECT_DIR/logs/autodev-$ISSUE-$(date +%Y%m%d-%H%M%S).log"

    check_existing_session

    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"

    trap cleanup EXIT

    echo ""
    log_info "Starting autonomous development for issue #$ISSUE"
    log_info "Session: $SESSION"
    log_info "Log file: $LOG_FILE"
    echo ""

    # Create tmux session
    log_info "Creating tmux session..."
    tmux new-session -d -s "$SESSION" -x 200 -y 50 -c "$PROJECT_DIR"

    # Start Claude Code
    log_info "Starting Claude Code..."
    tmux send-keys -t "$SESSION" "claude 2>&1 | tee -a '$LOG_FILE'" Enter

    # Wait for Claude to initialize
    sleep "$CLAUDE_INIT_WAIT"
    if ! wait_for_prompt 60; then
        log_error "Failed to initialize Claude Code"
        exit 1
    fi

    # Run the workflow phases
    local workflow_status="success"

    # Critical phases (abort on failure)
    if ! run_phase "Environment Setup" "/up" true; then
        workflow_status="failed"
        notify_complete "$workflow_status"
        exit 1
    fi

    if ! run_phase "Planning" "/plan $ISSUE" true; then
        workflow_status="failed"
        notify_complete "$workflow_status"
        exit 1
    fi

    # Development phase (critical - can't continue without code)
    if ! run_phase "Development" "/dev $ISSUE" true; then
        workflow_status="failed"
        notify_complete "$workflow_status"
        exit 1
    fi

    # Non-critical phases (continue even on failure)
    if ! run_phase "Testing" "/test" false; then
        workflow_status="partial"
    fi

    if ! run_phase "Validation" "/validate $ISSUE" false; then
        workflow_status="partial"
    fi

    # Deploy phase (critical - this is our goal)
    if ! run_phase "Deployment" "/deploy $ISSUE" true; then
        workflow_status="failed"
        notify_complete "$workflow_status"
        exit 1
    fi

    # Success!
    notify_complete "$workflow_status"

    echo ""
    log_success "=========================================="
    log_success "PR should be ready for review!"
    log_success "=========================================="
    echo ""
    log_info "Next steps:"
    log_info "  1. Check the PR on GitHub"
    log_info "  2. Review the changes"
    log_info "  3. After approval: /merge <pr_number>"
    log_info "  4. Then: /finalize $ISSUE"
    echo ""
}

main "$@"
