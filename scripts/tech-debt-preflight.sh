#!/bin/bash
# Tech Debt Pre-Flight Checks
# Usage: ./scripts/tech-debt-preflight.sh <issue_number>
#
# Validates environment before starting tech debt cleanup to catch common
# blockers early (Docker, Supabase, encoding, git state, etc.)

set -e

ISSUE_NUM="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# Results storage
PASS_ITEMS=()
WARN_ITEMS=()
FAIL_ITEMS=()

# Helper functions
pass() {
  echo -e "${GREEN}✅${NC} $1"
  PASS_ITEMS+=("$1")
  ((PASS_COUNT++))
}

warn() {
  echo -e "${YELLOW}⚠️${NC}  $1"
  WARN_ITEMS+=("$1")
  ((WARN_COUNT++))
}

fail() {
  echo -e "${RED}❌${NC} $1"
  FAIL_ITEMS+=("$1")
  ((FAIL_COUNT++))
}

info() {
  echo -e "${BLUE}ℹ️${NC}  $1"
}

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Usage check
if [ -z "$ISSUE_NUM" ]; then
  echo "Usage: $0 <issue_number>"
  echo ""
  echo "Example: $0 114"
  exit 1
fi

# Extract just the number
ISSUE_NUM=$(echo "$ISSUE_NUM" | grep -oE '[0-9]+')

cd "$PROJECT_ROOT"

section "Tech Debt Pre-Flight Checks - Issue #$ISSUE_NUM"

# 1. Environment Validation
section "1. Environment Validation"

# Docker
if docker info >/dev/null 2>&1; then
  pass "Docker is running"
else
  fail "Docker not running"
  info "   Start: open -a Docker"
  info "   Impact: Cannot run local CI tests (/test command)"
fi

# Supabase
if supabase status >/dev/null 2>&1; then
  pass "Supabase is running"
  SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
  info "   API: $SUPABASE_URL"
else
  warn "Supabase not running"
  info "   Start: supabase start"
  info "   Impact: Database tests may fail"
fi

# nektos/act for local CI
if command -v act &> /dev/null; then
  ACT_VERSION=$(act --version 2>&1 | head -1)
  pass "nektos/act installed ($ACT_VERSION)"
else
  warn "nektos/act not installed"
  info "   Install: brew install act"
  info "   Impact: Cannot use /test command"
  info "   Workaround: Use 'make test-all' instead"
fi

# 2. Git Working Directory
section "2. Git Working Directory"

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  pass "Clean working directory"
else
  warn "Uncommitted changes in working directory"
  git status --short | head -10
  info "   Recommendation: Commit or stash changes"
  info "   Command: git stash push -m 'WIP before issue #$ISSUE_NUM'"
fi

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
  pass "On main branch (ready to create feature branch)"
else
  info "Current branch: $CURRENT_BRANCH"
  if [[ "$CURRENT_BRANCH" =~ $ISSUE_NUM ]]; then
    pass "Already on feature branch for issue #$ISSUE_NUM"
  else
    warn "Not on main branch or issue branch"
    info "   Switch to main: git checkout main"
  fi
fi

# 3. Branch Sync Status
section "3. Branch Sync Status"

# Fetch latest
git fetch origin main --quiet 2>/dev/null || true

LOCAL=$(git rev-parse @ 2>/dev/null || echo "unknown")
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "unknown")
BASE=$(git merge-base @ origin/main 2>/dev/null || echo "unknown")

if [ "$LOCAL" = "$REMOTE" ]; then
  pass "Up to date with origin/main"
elif [ "$LOCAL" = "$BASE" ]; then
  BEHIND=$(git rev-list --count HEAD..origin/main)
  warn "Behind origin/main by $BEHIND commit(s)"
  info "   Update: git pull origin main"
elif [ "$REMOTE" = "$BASE" ]; then
  AHEAD=$(git rev-list --count origin/main..HEAD)
  info "Ahead of origin/main by $AHEAD commit(s)"
  pass "Local changes ready to push"
else
  warn "Diverged from origin/main"
  info "   Recommendation: Rebase or merge"
  info "   Command: git rebase origin/main"
fi

# 4. Test Infrastructure
section "4. Test Infrastructure"

# Check for .actrc
if [ -f .actrc ]; then
  pass ".actrc configured"
else
  fail ".actrc missing"
  info "   Required for nektos/act"
fi

# Check for .act-secrets
if [ -f .act-secrets ]; then
  pass ".act-secrets configured"
  SECRETS_COUNT=$(wc -l < .act-secrets)
  info "   Secrets defined: $SECRETS_COUNT"
else
  warn ".act-secrets missing"
  info "   Generate: ./scripts/create-act-secrets.sh"
  info "   Impact: /test command will fail"
fi

# Check for .env.local
if [ -f .env.local ]; then
  pass ".env.local exists"
else
  warn ".env.local missing"
  info "   Create: ./scripts/create-env-local.sh"
fi

# 5. Quick Smoke Test
section "5. Quick Smoke Test"

# Backend syntax check
info "Running backend linting..."
if cd backend && python -m flake8 app/ --max-line-length=88 --ignore=E203,W503 --select=E9,F63,F7,F82 2>&1 | tail -5 && cd ..; then
  pass "Backend syntax valid"
else
  fail "Backend syntax errors found"
  info "   Fix before starting work"
fi

# Python import check
info "Testing Python import system..."
if cd backend && python -c "import sys; sys.path.insert(0, '.'); from app.main import app; print('OK')" >/dev/null 2>&1 && cd ..; then
  pass "Python imports working"
else
  warn "Python import issues detected"
  info "   This may be expected if dependencies not installed"
fi

# 6. Encoding Validation
section "6. Encoding Validation"

# Check for non-UTF-8 files in key directories
info "Checking file encodings..."
NON_UTF8_COUNT=0
for dir in docs backend/app frontend/src; do
  if [ -d "$dir" ]; then
    while IFS= read -r file; do
      if [ -f "$file" ] && ! file "$file" | grep -q "UTF-8\|ASCII"; then
        warn "Non-UTF-8 encoding: $file"
        ((NON_UTF8_COUNT++))
      fi
    done < <(find "$dir" -type f \( -name "*.md" -o -name "*.py" -o -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)
  fi
done

if [ $NON_UTF8_COUNT -eq 0 ]; then
  pass "All checked files are UTF-8 encoded"
else
  warn "Found $NON_UTF8_COUNT non-UTF-8 files"
  info "   Fix: iconv -f UTF-8 -t UTF-8 -c <file> -o <file>"
fi

# Check for corrupted arrow characters (→)
info "Checking for encoding corruption..."
if find docs -type f -name "*.md" -exec grep -l "â†'" {} \; 2>/dev/null | head -1 | grep -q .; then
  warn "Corrupted arrow characters found"
  info "   Common: '→' becomes 'â†''"
  info "   Fix with iconv as above"
else
  pass "No encoding corruption detected"
fi

# 7. Issue Context
section "7. Issue Context"

# Fetch issue details
info "Fetching issue #$ISSUE_NUM..."
if command -v gh &> /dev/null; then
  ISSUE_DATA=$(gh issue view $ISSUE_NUM --json title,labels,state,assignees 2>/dev/null || echo "{}")

  ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title // "Unknown"')
  ISSUE_STATE=$(echo "$ISSUE_DATA" | jq -r '.state // "Unknown"')
  ISSUE_LABELS=$(echo "$ISSUE_DATA" | jq -r '[.labels[]?.name] | join(", ") // "None"')

  echo "   Title: $ISSUE_TITLE"
  echo "   State: $ISSUE_STATE"
  echo "   Labels: $ISSUE_LABELS"

  # Verify it's a tech-debt issue
  if echo "$ISSUE_LABELS" | grep -q "tech-debt"; then
    pass "Confirmed tech-debt issue"
  else
    warn "Not labeled as tech-debt"
    info "   Consider using standard workflow instead"
  fi

  # Check if issue is open
  if [ "$ISSUE_STATE" = "OPEN" ]; then
    pass "Issue is open"
  else
    warn "Issue is $ISSUE_STATE"
    info "   Verify this is the correct issue"
  fi
else
  warn "GitHub CLI (gh) not installed"
  info "   Install: brew install gh"
  info "   Impact: Cannot fetch issue details"
fi

# 8. Port Availability
section "8. Port Availability"

check_port() {
  local port=$1
  local service=$2
  if lsof -i ":$port" >/dev/null 2>&1; then
    if [ "$service" = "Supabase" ]; then
      pass "Port $port in use ($service - expected)"
    else
      warn "Port $port in use ($service)"
      info "   May need to stop: lsof -ti:$port | xargs kill"
    fi
  else
    info "Port $port available ($service)"
  fi
}

check_port 3000 "Frontend"
check_port 8000 "Backend"
check_port 54321 "Supabase"

# Summary
section "Pre-Flight Summary"

echo ""
echo "Issue: #$ISSUE_NUM"
if [ -n "$ISSUE_TITLE" ]; then
  echo "Title: $ISSUE_TITLE"
fi
echo ""
echo "Results:"
echo -e "  ${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "  ${YELLOW}⚠️  Warnings: $WARN_COUNT${NC}"
echo -e "  ${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

# Detailed recommendations
if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${RED}Critical Issues:${NC}"
  for item in "${FAIL_ITEMS[@]}"; do
    echo "  - $item"
  done
  echo ""
  echo "🛑 Fix critical issues before proceeding"
  echo ""
  exit 1
fi

if [ $WARN_COUNT -gt 0 ]; then
  echo -e "${YELLOW}Warnings:${NC}"
  for item in "${WARN_ITEMS[@]}"; do
    echo "  - $item"
  done
  echo ""
  echo "⚠️  Review warnings - they may impact this issue"
  echo ""
fi

# Next steps
echo -e "${GREEN}✅ Pre-flight checks complete${NC}"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Create feature branch (if needed):"
echo "     git checkout -b $ISSUE_NUM-tech-debt-cleanup"
echo "  3. Start planning:"
echo "     /plan $ISSUE_NUM"
echo ""
echo "Suggested workflow:"
echo "  /plan $ISSUE_NUM      → Analyze and create implementation plan"
echo "  /dev $ISSUE_NUM       → Implement changes with validation gates"
echo "  /test                 → Run local CI (requires Docker + act)"
echo "  /validate $ISSUE_NUM  → E2E validation"
echo "  /deploy $ISSUE_NUM    → Create PR"
echo ""

exit 0
