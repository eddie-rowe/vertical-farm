# /tech-debt-dev - Optimized Tech Debt Development

Specialized development workflow for tech debt cleanup tasks with encoding safety, validation gates, and quick iteration cycles.

## Usage

```bash
/tech-debt-dev <issue>
```

## Optimizations vs Standard /dev

This workflow is optimized for tech debt tasks:

1. **Encoding Safety**: Validates UTF-8 before/after edits
2. **Validation Gates**: Checks pass before moving to next phase
3. **Quick Iteration**: Faster feedback loops
4. **Clean History**: Atomic commits with clear messages
5. **No Surprises**: Pre-validates all changes

## Workflow Phases

### Phase 1: Pre-Development Validation

**Run Pre-Flight Checklist**
```bash
# Ensure environment is ready
./scripts/tech-debt-preflight.sh <issue>

# Stop if critical issues found
if [ $? -ne 0 ]; then
  echo "❌ Pre-flight checks failed"
  echo "   Fix issues before proceeding"
  exit 1
fi
```

**Create Isolated Branch**
```bash
ISSUE_NUM=$(echo "$1" | grep -oE '[0-9]+')
BRANCH_NAME="$ISSUE_NUM-tech-debt-cleanup"

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create fresh branch
git checkout -b $BRANCH_NAME

echo "✅ Created isolated branch: $BRANCH_NAME"
```

**Capture Baseline Metrics**
```bash
# Capture before-state for comparison
echo "📊 Capturing baseline metrics..."

# Line counts
TOTAL_LINES=$(git ls-files | xargs wc -l | tail -1 | awk '{print $1}')
echo "Total lines: $TOTAL_LINES"

# Encoding check
echo "🔍 Checking file encodings..."
git ls-files | while read file; do
  if ! file "$file" | grep -q "UTF-8\|ASCII"; then
    echo "⚠️  Non-UTF-8: $file"
  fi
done

# Save baseline
cat > .claude/logs/baseline-issue-$ISSUE_NUM.json <<EOF
{
  "issue": "$ISSUE_NUM",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_lines": $TOTAL_LINES,
  "branch": "$BRANCH_NAME"
}
EOF
```

### Phase 2: Safe File Operations

**File Deletion Protocol**

When deleting files (most common tech debt task):

```bash
# 1. Verify file exists
FILE_TO_DELETE="$1"
if [ ! -f "$FILE_TO_DELETE" ]; then
  echo "❌ File not found: $FILE_TO_DELETE"
  exit 1
fi

# 2. Check for imports/references
echo "🔍 Checking for references to $(basename $FILE_TO_DELETE)..."
BASENAME=$(basename "$FILE_TO_DELETE" .py)
REFS=$(git grep -l "$BASENAME" --exclude="$FILE_TO_DELETE" || true)

if [ -n "$REFS" ]; then
  echo "⚠️  Found references in:"
  echo "$REFS"
  echo ""
  echo "Review these files before deleting!"
  exit 1
fi

# 3. Safe deletion
git rm "$FILE_TO_DELETE"
echo "✅ Deleted: $FILE_TO_DELETE"

# 4. Immediate validation
python -c "import sys; sys.path.insert(0, 'backend'); from app.services import *; print('✅ Import system intact')" || {
  echo "❌ Import system broken!"
  git restore --staged "$FILE_TO_DELETE"
  git restore "$FILE_TO_DELETE"
  exit 1
}
```

**File Edit Protocol**

When editing files:

```bash
# 1. Check encoding BEFORE edit
FILE_TO_EDIT="$1"
BEFORE_ENCODING=$(file "$FILE_TO_EDIT")

# 2. Perform edit with Edit tool
# [Use Edit tool here]

# 3. Check encoding AFTER edit
AFTER_ENCODING=$(file "$FILE_TO_EDIT")

if [ "$BEFORE_ENCODING" != "$AFTER_ENCODING" ]; then
  echo "⚠️  Encoding changed!"
  echo "   Before: $BEFORE_ENCODING"
  echo "   After:  $AFTER_ENCODING"

  # Fix encoding corruption
  iconv -f UTF-8 -t UTF-8 -c "$FILE_TO_EDIT" -o "${FILE_TO_EDIT}.fixed"
  mv "${FILE_TO_EDIT}.fixed" "$FILE_TO_EDIT"

  echo "✅ Encoding fixed"
fi

# 4. Validate syntax (language-specific)
if [[ "$FILE_TO_EDIT" == *.py ]]; then
  python -m py_compile "$FILE_TO_EDIT" || {
    echo "❌ Python syntax error in $FILE_TO_EDIT"
    exit 1
  }
elif [[ "$FILE_TO_EDIT" == *.ts ]] || [[ "$FILE_TO_EDIT" == *.tsx ]]; then
  npx tsc --noEmit "$FILE_TO_EDIT" || {
    echo "⚠️  TypeScript errors in $FILE_TO_EDIT"
  }
fi
```

### Phase 3: Incremental Testing

**Fast Validation Loop**

Run tests incrementally, not all at once:

```bash
echo "🧪 Phase 3: Incremental Testing"

# Step 1: Syntax check (5 seconds)
echo "Step 1/4: Syntax validation..."
make test-lint-backend
if [ $? -ne 0 ]; then
  echo "❌ Syntax errors found - fix before continuing"
  exit 1
fi
echo "✅ Syntax valid"

# Step 2: Import check (10 seconds)
echo "Step 2/4: Import system validation..."
cd backend && python -c "from app.services import *; print('✅ Imports OK')" && cd ..
if [ $? -ne 0 ]; then
  echo "❌ Import system broken - rollback changes"
  exit 1
fi

# Step 3: Unit tests (30 seconds)
echo "Step 3/4: Unit tests..."
make test-backend
if [ $? -ne 0 ]; then
  echo "❌ Tests failing - investigate"
  exit 1
fi
echo "✅ Tests passing"

# Step 4: Full validation (optional, 2 minutes)
read -p "Run full test suite? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Step 4/4: Full test suite..."
  make test-all
fi
```

**Test Result Caching**

```bash
# Cache test results to avoid re-running on success
TEST_CACHE=".claude/cache/test-results-issue-$ISSUE_NUM.json"
mkdir -p .claude/cache

if [ -f "$TEST_CACHE" ]; then
  LAST_RUN=$(jq -r '.timestamp' "$TEST_CACHE")
  echo "ℹ️  Last test run: $LAST_RUN"
  echo "   Skip with: --skip-tests (use with caution)"
fi

# Save test results
cat > "$TEST_CACHE" <<EOF
{
  "issue": "$ISSUE_NUM",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "passed",
  "duration_seconds": $DURATION
}
EOF
```

### Phase 4: Atomic Commits

**Clean Commit Protocol**

```bash
# 1. Stage only intentional changes
git add -p  # Interactive staging

# 2. Verify staged changes
echo "📋 Staged changes:"
git diff --cached --stat

# 3. Check for unintended changes
if git diff --cached | grep -q "seed.sql\|.env\|secret"; then
  echo "⚠️  Warning: Sensitive files staged"
  echo "   Review carefully before committing"
fi

# 4. Create descriptive commit
ISSUE_TITLE=$(gh issue view $ISSUE_NUM --json title --jq .title)

git commit -m "$(cat <<EOF
chore: Remove deprecated Redis processor code

Issue: #$ISSUE_NUM
Title: $ISSUE_TITLE

Changes:
- Deleted: backend/app/services/background_processor_redis_deprecated.py (576 lines)
- Updated: docs/planning/vision/2025-12-17-project-vision.md

Verification:
- No import references found (verified via grep)
- Import system intact (verified via Python import)
- All tests passing (make test-backend)
- No encoding issues

Closes #$ISSUE_NUM

Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

echo "✅ Commit created"
```

### Phase 5: Pre-Push Validation

**Final Checks Before Push**

```bash
echo "🔍 Pre-push validation..."

# 1. Verify commit message
COMMIT_MSG=$(git log -1 --pretty=%B)
if ! echo "$COMMIT_MSG" | grep -q "#$ISSUE_NUM"; then
  echo "⚠️  Commit message missing issue reference"
fi

# 2. Verify no debug code
if git diff HEAD~1 | grep -qE "console\.log|debugger|pdb\.set_trace|import pdb"; then
  echo "⚠️  Debug code detected in changes"
  echo "   Review before pushing"
fi

# 3. Verify encoding safety
CHANGED_FILES=$(git diff HEAD~1 --name-only)
for file in $CHANGED_FILES; do
  if [ -f "$file" ] && ! file "$file" | grep -q "UTF-8\|ASCII"; then
    echo "❌ Encoding issue in: $file"
    exit 1
  fi
done

# 4. Run fast smoke test
echo "🧪 Running smoke test..."
make test-lint-backend && make test-backend
if [ $? -ne 0 ]; then
  echo "❌ Smoke test failed"
  exit 1
fi

echo "✅ Pre-push validation complete"
```

## Encoding Safety Checklist

Critical for preventing UTF-8 corruption like issue #114:

1. **Before ANY Edit tool call**:
   ```bash
   file <target_file> | tee .claude/logs/encoding-before.txt
   ```

2. **After Edit tool call**:
   ```bash
   file <target_file> | tee .claude/logs/encoding-after.txt
   diff .claude/logs/encoding-before.txt .claude/logs/encoding-after.txt
   ```

3. **If encoding changed**:
   ```bash
   iconv -f UTF-8 -t UTF-8 -c <file> -o <file>.fixed
   mv <file>.fixed <file>
   ```

4. **Validate visual characters**:
   ```bash
   # Check for arrow corruption (→ becomes â†')
   grep -n "â†'" <file> && echo "❌ Corrupted arrows found"
   grep -n "→" <file> && echo "✅ Arrows intact"
   ```

## Time Optimization Metrics

Based on issue #114 analysis:

| Phase | Standard | Optimized | Savings |
|-------|----------|-----------|---------|
| Pre-flight | 0 min | 2 min | -2 min (investment) |
| Planning | 5 min | 3 min | +2 min (cached context) |
| Development | 15 min | 10 min | +5 min (quick validation) |
| Validation | 10 min | 5 min | +5 min (incremental tests) |
| Testing | 2 min (failed) | 3 min | +1 min (working Docker) |
| Merge | 3 min | 2 min | +1 min (clean commits) |
| **Total** | **35 min** | **25 min** | **+10 min (28% faster)** |

**Blockers Prevented**:
- Docker not running: Caught in pre-flight (30s)
- UTF-8 corruption: Prevented by encoding checks (13 min saved)
- Unrelated changes: Caught by staging review (varies)

## Lessons from Issue #114

1. **UTF-8 Encoding**: Edit tool can corrupt non-ASCII characters
   - Solution: Validate encoding before/after edits
   - Check: `file <path>` should always say "UTF-8"

2. **Docker Not Running**: Prevented local CI testing
   - Solution: Pre-flight checks catch this immediately
   - Check: `docker info` before starting work

3. **Unrelated Changes**: seed.sql had uncommitted changes
   - Solution: Git status check in pre-flight
   - Check: `git status --porcelain` should be empty

4. **Test Strategy**: Full test-all is slow and can fail
   - Solution: Incremental testing (syntax → imports → unit → all)
   - Check: Each gate must pass before next

## Integration with Standard Workflow

This workflow extends `/dev` for tech debt:

- **When to use `/tech-debt-dev`**: Deleting files, refactoring, cleanup
- **When to use `/dev`**: New features, bug fixes, enhancements
- **Key differences**:
  - More validation gates
  - Encoding safety
  - Faster iteration
  - Atomic commits only

## Success Criteria

A successful tech debt cleanup should:

1. Delete code without breaking imports
2. Maintain UTF-8 encoding throughout
3. Pass all tests incrementally
4. Have clean, atomic commits
5. Complete in 20-25 minutes (vs 35 baseline)

## Related Commands

- `/tech-debt-preflight <issue>` - Pre-flight checks
- `/test --quick` - Fast validation
- `/validate <issue>` - Final E2E validation
- `/deploy <issue>` - Create PR with clean history
