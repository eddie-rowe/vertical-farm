# Junior Developer Onboarding Guide

## SDLC Infinity Loop - First Day Walkthrough

**Goal:** Learn Claude Code and the SDLC workflow by completing issue #114
**Time:** ~2-3 hours (including learning)

---

## Prerequisites Checklist

Before starting, verify:
- [ ] Development environment running (`make up` or services started)
- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] Access to the repository (`gh repo view eddie-rowe/vertical-farm`)

---

## Part 1: Install Claude Code (~15 min)

### Step 1: Install Claude Code CLI

```bash
# Using npm (recommended)
npm install -g @anthropic-ai/claude-code

# Or using Homebrew on Mac
brew install claude-code
```

### Step 2: Authenticate

```bash
claude login
```

Follow the browser prompts to authenticate with your Anthropic account.

### Step 3: Verify Installation

```bash
claude --version
claude --help
```

### Step 4: Navigate to Project

```bash
cd ~/Repos/vertical-farm
claude
```

You should see the Claude Code interactive prompt.

---

## Part 2: Understand the SDLC Loop (~10 min)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SDLC INFINITY LOOP                           │
│                                                                 │
│  /plan → /dev → /test → /validate → /deploy → /merge → /finalize│
│     ↑                                                      │    │
│     └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

| Step | Command | Purpose | Output |
|------|---------|---------|--------|
| 1 | `/plan 114` | Analyze issue, create plan | Implementation plan |
| 2 | `/dev 114` | Write the code | Code changes |
| 3 | `/test` | Run all tests locally | Test results |
| 4 | `/validate 114` | E2E testing | Validation report |
| 5 | `/deploy 114` | Create pull request | PR URL |
| 6 | `/merge <pr#>` | Merge to main | Merged PR |
| 7 | `/finalize 114` | Close issue, document | Closed issue |

---

## Part 3: Your First Issue - #114 (~90 min)

### Issue Summary
**Title:** [TECH-DEBT] Remove deprecated Redis processor code
**Size:** S (1-2 hours)
**Risk:** Low - removing unused code

### What You'll Learn
- How Claude Code analyzes issues
- How to navigate the codebase with AI assistance
- How to verify changes don't break anything
- The full PR workflow

---

## Step-by-Step Walkthrough

### STEP 1: Plan the Work

In Claude Code, type:

```
/plan 114
```

**What Happens:**
1. Claude fetches issue #114 from GitHub
2. Analyzes the codebase for relevant files
3. Creates an implementation plan with specific tasks
4. Asks clarifying questions if needed

**What to Look For:**
- A list of files to be modified/deleted
- Clear acceptance criteria from the issue
- Any dependencies or risks identified

**Verification:**
- Plan should mention `backend/app/services/` directory
- Should list specific Redis processor files to remove
- Should note the verification commands to run

---

### STEP 2: Develop the Solution

```
/dev 114
```

**What Happens:**
1. Claude creates a feature branch (if not on one)
2. Explores the files mentioned in the plan
3. Makes the code changes
4. Commits with descriptive messages

**What to Look For:**
- Claude asking permission before deleting files
- Git commands being executed (branch, add, commit)
- Clear explanations of what's being removed

**Verification Before Proceeding:**
```bash
# Check you're on a feature branch
git branch --show-current

# See what files were deleted
git status

# Verify the Redis processor files are gone
ls backend/app/services/ | grep -i redis
```

---

### STEP 3: Run Local Tests

```
/test
```

**What Happens:**
1. Runs the full test suite (`make test-all`)
2. Includes unit tests, integration tests, linting
3. Reports any failures

**What to Look For:**
- All tests passing (green checkmarks)
- No import errors from deleted files
- No linting warnings about missing modules

**Verification:**
```bash
# If you want to run manually:
make test-all

# Or just backend tests:
cd backend && pytest
```

**If Tests Fail:**
- Read the error message carefully
- Usually means something still imports the deleted code
- Claude will help fix any issues found

---

### STEP 4: Validate the Changes

```
/validate 114
```

**What Happens:**
1. Runs E2E tests if applicable
2. Checks that the app still works
3. Verifies acceptance criteria are met

**What to Look For:**
- Acceptance criteria checklist being verified
- No runtime errors
- Clean validation report

**Verification:**
- For this issue (code deletion), validation is mostly test-based
- More complex features would involve Playwright browser tests

---

### STEP 5: Create Pull Request

```
/deploy 114
```

**What Happens:**
1. Pushes branch to GitHub
2. Creates a pull request with:
   - Title linked to issue #114
   - Description from the plan
   - Checklist of changes made
3. Returns the PR URL

**What to Look For:**
- PR title format: `fix: Remove deprecated Redis processor code (#114)`
- Description includes what was deleted and why
- Linked to issue #114

**Verification:**
```bash
# View your PR
gh pr view

# Check CI status
gh pr checks
```

---

### STEP 6: Wait for Review & Merge

```
/merge <pr-number>
```

**Note:** Replace `<pr-number>` with the actual PR number from step 5.

**What Happens:**
1. Checks if PR is approved (may need senior review first)
2. Checks if CI passes
3. Merges to main branch
4. Deletes the feature branch

**What to Look For:**
- CI checks all green
- Approval from reviewer (if required)
- Successful merge message

**Verification:**
```bash
# Confirm merge
gh pr view <pr-number> --json state

# Switch back to main
git checkout main
git pull
```

---

### STEP 7: Close the Issue

```
/finalize 114
```

**What Happens:**
1. Closes issue #114 on GitHub
2. Adds closing comment linking to the PR
3. Updates any documentation if needed

**What to Look For:**
- Issue status changes to "Closed"
- Comment added with PR reference
- Clean wrap-up

**Verification:**
```bash
# Verify issue is closed
gh issue view 114 --json state
```

---

## Troubleshooting

### If Tests Fail After `/dev`

```
# Ask Claude to investigate
"The tests are failing with [error]. Can you help fix this?"
```

### If PR Has Merge Conflicts

```
# Ask Claude to resolve
"There are merge conflicts on the PR. Can you help resolve them?"
```

### If You Need to Start Over

```bash
# Abandon the branch and start fresh
git checkout main
git branch -D <your-branch-name>
```

Then run `/plan 114` again.

---

## Success Checklist

By the end of this walkthrough, you should have:

- [ ] Claude Code installed and working
- [ ] Used all 7 SDLC slash commands
- [ ] Removed deprecated Redis code (~576 lines)
- [ ] Created and merged a PR
- [ ] Closed issue #114

---

## Key Takeaways

1. **Slash commands orchestrate the workflow** - Each command does one job well
2. **Claude handles the complexity** - Git, tests, PRs are automated
3. **Verification at each step** - Always check the output before proceeding
4. **Safe to ask questions** - Type naturally to Claude for help

---

## Next Steps After #114

Once comfortable, try a slightly larger issue:

1. **Issue #115** (S) - Move deviceAssignmentService to domain structure
2. **Issue #116** (S) - Move businessDataService to domain structure

These follow the same pattern but involve moving files rather than deleting.

---

## Quick Reference Card

```
/plan <issue>     # Analyze and plan
/dev <issue>      # Write the code
/test             # Run all tests
/validate <issue> # E2E verification
/deploy <issue>   # Create PR
/merge <pr>       # Merge PR
/finalize <issue> # Close issue
```

---

## Additional Resources

- **SDLC Workflow Commands:** `.claude/commands/tools/02_development/README.md`
- **PM Workflow Commands:** `.claude/commands/tools/01_project_management/README.md`
- **Project Vision:** `docs/planning/vision/2025-12-17-project-vision.md`
- **Good First Issues:** Filter by `good first issue` label on GitHub

---

*Guide created: 2025-12-17*
*For: Junior Developer Onboarding*
*First issue: #114 - Remove deprecated Redis processor code*
