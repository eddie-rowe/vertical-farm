# Tech Debt Pre-Flight Checklist

A pre-flight checklist for tech debt cleanup tasks to catch common issues before starting work.

## Usage

Run this checklist before starting any tech debt cleanup issue to ensure your environment is ready and to identify potential blockers early.

```bash
/tech-debt-preflight <issue>
```

## Pre-Flight Checks

### 1. Environment Validation

**Docker Status**
```bash
docker info >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Docker not running"
  echo "   Start Docker Desktop before running tests"
  echo "   Command: open -a Docker"
  exit 1
fi
echo "✅ Docker is running"
```

**Supabase Status**
```bash
supabase status >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  Supabase not running"
  echo "   Start with: supabase start"
  echo "   Or skip if not needed for this task"
else
  echo "✅ Supabase is running"
fi
```

**Git Working Directory**
```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes in working directory:"
  git status --short
  echo ""
  echo "   Recommendation: Commit or stash changes before starting"
  echo "   Command: git stash push -m 'WIP before issue #114'"
else
  echo "✅ Clean working directory"
fi
```

### 2. Branch Verification

**Sync with Main**
```bash
git fetch origin main
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse origin/main)
BASE=$(git merge-base @ origin/main)

if [ $LOCAL = $REMOTE ]; then
  echo "✅ Up to date with origin/main"
elif [ $LOCAL = $BASE ]; then
  echo "⚠️  Behind origin/main by $(git rev-list --count HEAD..origin/main) commits"
  echo "   Recommendation: Pull latest changes"
  echo "   Command: git pull origin main"
elif [ $REMOTE = $BASE ]; then
  echo "⚠️  Ahead of origin/main by $(git rev-list --count origin/main..HEAD) commits"
  echo "   Push or resolve before starting new work"
else
  echo "⚠️  Diverged from origin/main"
  echo "   Recommendation: Rebase or merge before starting"
fi
```

**Create Feature Branch**
```bash
# Extract issue number from argument
ISSUE_NUM=$(echo "$1" | grep -oE '[0-9]+')
BRANCH_NAME="$ISSUE_NUM-tech-debt-cleanup"

if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
  echo "✅ Branch '$BRANCH_NAME' exists"
  echo "   Current branch: $(git branch --show-current)"
else
  echo "📋 Creating branch: $BRANCH_NAME"
  echo "   Command: git checkout -b $BRANCH_NAME"
fi
```

### 3. Test Infrastructure

**Check nektos/act Installation**
```bash
if ! command -v act &> /dev/null; then
  echo "⚠️  nektos/act not installed (local CI testing)"
  echo "   Install: brew install act"
  echo "   Impact: Cannot run local CI tests (/test command)"
  echo "   Workaround: Use 'make test-all' instead"
else
  echo "✅ nektos/act installed ($(act --version))"
fi
```

**Verify Test Scripts**
```bash
if [ ! -f .act-secrets ]; then
  echo "⚠️  .act-secrets missing (required for /test)"
  echo "   Generate: ./scripts/create-act-secrets.sh"
else
  echo "✅ .act-secrets configured"
fi

if [ ! -f .actrc ]; then
  echo "❌ .actrc missing (required for act configuration)"
else
  echo "✅ .actrc configured"
fi
```

**Quick Test Run**
```bash
# Run a fast smoke test to verify environment
echo "🧪 Running quick smoke test..."
make test-lint-backend 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ Backend linting passes"
else
  echo "❌ Backend linting fails - fix before starting"
fi
```

### 4. Encoding Validation

**Check for UTF-8 Issues**
```bash
# Issue #114 exposed UTF-8 encoding corruption in project files
echo "🔍 Checking for common encoding issues..."

# Check for non-UTF-8 files
find . -type f -name "*.md" -o -name "*.py" -o -name "*.ts" | while read file; do
  if ! file "$file" | grep -q "UTF-8"; then
    echo "⚠️  Non-UTF-8 encoding: $file"
  fi
done

# Check for corrupted arrow characters (→)
if grep -r "â†'" docs/ 2>/dev/null | head -5; then
  echo "⚠️  Corrupted arrow characters found in docs/"
  echo "   Common corruption: '→' becomes 'â†''"
  echo "   Fix with: iconv -f UTF-8 -t UTF-8 -c <file> -o <file>"
fi
```

### 5. Dependency Check

**Python Dependencies**
```bash
cd backend
if [ -f requirements.txt ]; then
  echo "🔍 Checking Python dependencies..."
  pip list --outdated | head -10

  # Check for critical security vulnerabilities
  pip-audit --desc 2>/dev/null | grep -i "critical" && \
    echo "⚠️  Critical vulnerabilities found" || \
    echo "✅ No critical vulnerabilities"
fi
cd ..
```

**Node Dependencies**
```bash
cd frontend
if [ -f package.json ]; then
  echo "🔍 Checking Node dependencies..."
  npm outdated | head -10 || echo "✅ Dependencies up to date"

  # Check for critical vulnerabilities
  npm audit --audit-level=critical 2>/dev/null | grep -i "critical" && \
    echo "⚠️  Critical vulnerabilities found" || \
    echo "✅ No critical vulnerabilities"
fi
cd ..
```

### 6. Issue Context

**Fetch Issue Details**
```bash
ISSUE_NUM=$(echo "$1" | grep -oE '[0-9]+')
echo "📋 Fetching issue #$ISSUE_NUM details..."

gh issue view $ISSUE_NUM --json title,body,labels,assignees,milestone \
  --jq '{
    title: .title,
    labels: [.labels[].name],
    assignee: .assignees[0].login // "unassigned",
    milestone: .milestone.title // "none"
  }'
```

**Verify Issue Type**
```bash
# Confirm this is actually a tech debt issue
LABELS=$(gh issue view $ISSUE_NUM --json labels --jq '[.labels[].name]')
if echo "$LABELS" | grep -q "tech-debt"; then
  echo "✅ Confirmed tech-debt issue"
else
  echo "⚠️  Not labeled as tech-debt"
  echo "   Consider using standard workflow instead"
fi
```

### 7. Estimated Blockers

**Common Tech Debt Blockers**
```bash
echo "🔍 Checking for common blockers..."

# Check for large uncommitted files
LARGE_FILES=$(find . -type f -size +1M ! -path "./.git/*" ! -path "./node_modules/*" ! -path "./.next/*")
if [ -n "$LARGE_FILES" ]; then
  echo "⚠️  Large uncommitted files detected:"
  echo "$LARGE_FILES" | head -5
fi

# Check for running processes that might interfere
if lsof -i :3000 >/dev/null 2>&1; then
  echo "⚠️  Port 3000 in use (frontend)"
fi

if lsof -i :8000 >/dev/null 2>&1; then
  echo "⚠️  Port 8000 in use (backend)"
fi

if lsof -i :54321 >/dev/null 2>&1; then
  echo "✅ Port 54321 in use (Supabase - expected)"
fi
```

## Pre-Flight Summary

After running all checks, provide a summary:

```bash
echo ""
echo "========================================"
echo "Tech Debt Pre-Flight Summary"
echo "========================================"
echo ""
echo "Issue: #$ISSUE_NUM"
echo "Branch: $BRANCH_NAME"
echo ""
echo "Environment Status:"
echo "  Docker:    [✅/❌]"
echo "  Supabase:  [✅/⚠️/❌]"
echo "  Git:       [✅/⚠️]"
echo "  Tests:     [✅/❌]"
echo "  Encoding:  [✅/⚠️]"
echo ""
echo "Recommendations:"
echo "  1. [Fix any ❌ items before proceeding]"
echo "  2. [Address ⚠️ items if they impact this issue]"
echo "  3. [Proceed with /plan $ISSUE_NUM when ready]"
echo ""
echo "========================================"
```

## Integration with Workflow

This checklist should be run:

1. **Before `/plan`** - Ensures environment is ready
2. **After identifying blockers** - Documents what needs fixing
3. **As part of onboarding** - Teaches new developers the setup

## Automation Opportunity

Create a simple script: `/Users/jamesedge/Repos/vertical-farm/scripts/tech-debt-preflight.sh`

```bash
#!/bin/bash
# Tech Debt Pre-Flight Checks
# Usage: ./scripts/tech-debt-preflight.sh <issue_number>

ISSUE_NUM="$1"

if [ -z "$ISSUE_NUM" ]; then
  echo "Usage: $0 <issue_number>"
  exit 1
fi

# Run all checks from this document
# Exit with non-zero if critical issues found
# Generate report in .claude/logs/preflight-${ISSUE_NUM}.md
```

## Success Metrics

Track how pre-flight checks reduce workflow friction:

- **Before pre-flight**: 35 min total, 13 min lost to Docker issue
- **After pre-flight**: Should catch Docker issue in 30 seconds
- **Time savings**: ~12.5 min per tech debt task
- **Reduced context switches**: Developer stays focused

## Related Tools

- `/up` - Start development environment
- `/test` - Run local CI with nektos/act
- `/plan <issue>` - Analyze and plan implementation
- `make env-check` - Environment status check
