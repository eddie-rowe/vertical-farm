# Junior Developer Onboarding Guide

## SDLC Infinity Loop - First Day Walkthrough

**Goal:** Learn Claude Code and the SDLC workflow by completing issue #114

**Estimated Time:** 2-3 hours including learning. Take your time - understanding the workflow is more valuable than speed.

---

## Prerequisites Checklist

Before starting, verify:
- [ ] Development environment running (`make up` or services started)
- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] Access to the repository (`gh repo view eddie-rowe/vertical-farm`)

---

## Part 1: Setup & Understand Claude Code

### Step 1.1: Install Claude Code CLI

```bash
# Using npm (recommended)
npm install -g @anthropic-ai/claude-code

# Or using Homebrew on Mac
brew install claude-code
```

### Step 1.2: Authenticate

```bash
claude login
```

Follow the browser prompts to authenticate with your Anthropic account.

### Step 1.3: Verify Installation

```bash
claude --version
claude --help
```

### Step 1.4: Navigate to Project

```bash
cd ~/Repos/vertical-farm
claude
```

You should see the Claude Code interactive prompt.

---

### The Mental Model: Understand → Build → Ship

Every development task follows this three-phase pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   UNDERSTAND          BUILD              SHIP                   │
│   ───────────        ───────           ──────                   │
│   /plan              /dev              /deploy                  │
│                      /test             /merge                   │
│                      /validate         /finalize                │
│                                                                 │
│   "What needs       "Make it          "Get it to               │
│    to be done?"      work"             production"              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This mental model helps you know where you are in the process and what comes next.

### Command Reference

| Phase | Command | Purpose | Output |
|-------|---------|---------|--------|
| **UNDERSTAND** | `/plan 114` | Analyze issue, create plan | Implementation plan |
| **BUILD** | `/dev 114` | Write the code | Code changes |
| **BUILD** | `/test` | Run all tests locally | Test results |
| **BUILD** | `/validate 114` | E2E testing | Validation report |
| **SHIP** | `/deploy 114` | Create pull request | PR URL |
| **SHIP** | `/merge <pr#>` | Merge to main | Merged PR |
| **SHIP** | `/finalize 114` | Close issue, document | Closed issue |

---

## Part 2: GitHub Project Board Setup

Before writing any code, set up the issue properly on GitHub.

### Your First Issue

| Field | Value |
|-------|-------|
| **Title** | [TECH-DEBT] Remove deprecated Redis processor code |
| **Size** | S (1-2 hours) |
| **Risk** | Low - removing unused code |
| **URL** | https://github.com/eddie-rowe/vertical-farm/issues/114 |

---

### Step 2.1: Open the Issue

1. Navigate to: https://github.com/eddie-rowe/vertical-farm/issues/114
2. Read through the issue description completely
3. Note the **Acceptance Criteria** checklist - this is your definition of done

---

### Step 2.2: Assign Yourself

1. On the right sidebar, find **"Assignees"**
2. Click the gear icon
3. Select your username from the dropdown
4. The issue now shows you as the assignee

**Why This Matters:**
- Team visibility - others know you're working on it
- Prevents duplicate work
- Shows on your GitHub profile activity

---

### Step 2.3: Move to "In Progress" (Project Board)

1. On the right sidebar, find **"Projects"**
2. If not already added, click "Add to project" → select the project board
3. Change the status from "Todo" to **"In Progress"**

**Why This Matters:**
- Kanban board reflects actual work state
- Senior developer can see what you're working on
- Helps with sprint planning and standup meetings

---

### Step 2.4: Create a Branch from GitHub UI

1. On the issue page, look at the right sidebar under **"Development"**
2. Click **"Create a branch"**
3. GitHub will suggest a branch name like: `114-tech-debt-remove-deprecated-redis-processor-code`
4. Keep the default or shorten to: `114-remove-redis-processor`
5. Select **"Checkout locally"** option
6. Click **"Create branch"**

GitHub will show you the commands to run locally:

```bash
git fetch origin
git checkout 114-remove-redis-processor
```

**Copy these commands** - you'll use them in the next section.

---

### Step 2.5: Verify Issue State

Before moving on, confirm:

- [ ] You are assigned to the issue
- [ ] Issue status is "In Progress" on the project board
- [ ] Branch has been created
- [ ] You have the checkout commands copied

---

## Part 3: Development Workflow

Now switch to your IDE/terminal and do the actual work.

```
Part 3 Overview:
├── Phase A: UNDERSTAND ─── Get oriented, make a plan
├── Phase B: BUILD ──────── Write code, verify it works
└── Phase C: SHIP ───────── PR, review, merge, close
```

---

## Phase A: UNDERSTAND

*Goal: Get oriented and create an implementation plan*

---

### Step A.1: Checkout the Branch

Open your terminal and navigate to the project:

```bash
cd ~/Repos/vertical-farm
```

Fetch and checkout the branch you created on GitHub:

```bash
git fetch origin
git checkout 114-remove-redis-processor
```

**Verification:**
```bash
# Confirm you're on the right branch
git branch --show-current
# Should output: 114-remove-redis-processor
```

---

### Step A.2: Start Claude Code

In the same terminal (while in the project directory):

```bash
claude
```

You should see the Claude Code interactive prompt.

---

### Step A.3: Plan the Work

In Claude Code, type:

```
/plan 114
```

**What Happens:**
1. Claude fetches issue #114 from GitHub
2. Analyzes the codebase for relevant files
3. Creates an implementation plan with specific tasks
4. Asks clarifying questions if needed

**Example Output You'll See:**
```
═══════════════════════════════════════════════════════════════
📋 Issue Analysis: #114 - Remove deprecated Redis processor code
═══════════════════════════════════════════════════════════════

📁 Files Identified:
   • backend/app/services/redis_processor.py (deprecated)
   • backend/app/services/redis_queue_handler.py (deprecated)

📝 Implementation Plan:
   1. Verify no imports reference these files
   2. Delete deprecated files
   3. Run tests to confirm nothing breaks

✅ Ready to proceed with /dev 114
═══════════════════════════════════════════════════════════════
```

**What to Look For:**
- A list of files to be modified/deleted
- Clear acceptance criteria from the issue
- Any dependencies or risks identified

**Checkpoint:** You now understand what needs to be done. Move to Phase B.

---

## Phase B: BUILD

*Goal: Make the changes and verify they work*

---

### Step B.1: Develop the Solution

```
/dev 114
```

**What Happens:**
1. Claude sees you're already on a feature branch
2. Explores the files mentioned in the plan
3. Makes the code changes (deletes deprecated files)
4. Commits with descriptive messages

**What to Look For:**
- Claude asking permission before deleting files
- Git commands being executed (add, commit)
- Clear explanations of what's being removed

**Verification:**
```bash
# See what files were deleted
git status

# Verify the Redis processor files are gone
ls backend/app/services/ | grep -i redis

# View the commit that was made
git log --oneline -1
```

---

### Step B.2: Run Local Tests

```
/test
```

**What Happens:**
1. Runs the full test suite (`make test-all`)
2. Includes unit tests, integration tests, linting
3. Reports any failures

**Example Output You'll See:**
```
═══════════════════════════════════════════════════════════════
🧪 Running Tests
═══════════════════════════════════════════════════════════════

✅ Backend unit tests ............ PASSED (42 tests)
✅ Backend integration tests ..... PASSED (18 tests)
✅ Linting (black, ruff) ......... PASSED
✅ Type checking (mypy) .......... PASSED

═══════════════════════════════════════════════════════════════
✅ All tests passed!
═══════════════════════════════════════════════════════════════
```

**What to Look For:**
- All tests passing (green checkmarks)
- No import errors from deleted files
- No linting warnings about missing modules

**If Tests Fail:**
- Read the error message carefully
- Usually means something still imports the deleted code
- Tell Claude: "The tests are failing with [error]. Can you help fix this?"

---

### Step B.3: Validate the Changes

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

**Note:** For this issue (code deletion), validation is mostly test-based. More complex features would involve Playwright browser tests.

**Checkpoint:** Code works and tests pass. Move to Phase C.

---

## Phase C: SHIP

*Goal: Get your changes merged to production*

---

### Step C.1: Create Pull Request

```
/deploy 114
```

**What Happens:**
1. Pushes your branch to GitHub
2. Creates a pull request with:
   - Title linked to issue #114
   - Description from the plan
   - Checklist of changes made
3. Returns the PR URL

**Example Output You'll See:**
```
═══════════════════════════════════════════════════════════════
🚀 Deploying Issue #114
═══════════════════════════════════════════════════════════════

📤 Pushing branch to origin...
✅ Branch pushed successfully

📝 Creating pull request...
✅ PR created: https://github.com/eddie-rowe/vertical-farm/pull/125

PR Title: fix: Remove deprecated Redis processor code (#114)

⏳ CI pipeline starting...
═══════════════════════════════════════════════════════════════
```

**What to Look For:**
- PR title format: `fix: Remove deprecated Redis processor code (#114)`
- Description includes what was deleted and why
- Linked to issue #114

**Write down the PR number** - you'll need it for the next steps.

---

### Step C.2: Request Review & Wait

At this point:
1. **Notify senior developer** that PR is ready for review
2. CI pipeline will run automatically
3. Wait for approval before merging

**Verification:**
```bash
# View your PR
gh pr view

# Check CI status
gh pr checks
```

While waiting, you can:
- Watch the CI checks on the PR page
- Respond to any review comments
- Make additional commits if changes are requested

---

### Step C.3: Merge the PR

Once approved and CI passes:

```
/merge <pr-number>
```

**Note:** Replace `<pr-number>` with the actual PR number (e.g., `/merge 125`).

**What Happens:**
1. Checks if PR is approved
2. Checks if CI passes
3. Merges to main branch
4. Deletes the feature branch

**What to Look For:**
- CI checks all green
- Approval from reviewer
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

### Step C.4: Close the Issue

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
- Project board automatically moves issue to "Done"

**Verification:**
```bash
# Verify issue is closed
gh issue view 114 --json state
```

---

### Step C.5: Final Verification

Go back to GitHub and verify everything is complete:

| Check | Expected State |
|-------|----------------|
| Issue #114 | Closed, with comment linking to PR |
| Pull Request | Merged |
| Project Board | Issue in "Done" column |
| Main branch | Contains your commits |

**Congratulations!** You've completed the full SDLC loop.

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

**Part 1 - Setup & Understanding:**
- [ ] Claude Code installed and authenticated
- [ ] Understand the Understand → Build → Ship mental model

**Part 2 - GitHub Admin:**
- [ ] Assigned yourself to issue #114
- [ ] Moved issue to "In Progress" on project board
- [ ] Created branch from GitHub UI

**Part 3 - Development:**

*Phase A: UNDERSTAND*
- [ ] Checked out the branch locally
- [ ] Started Claude Code
- [ ] Used `/plan` to analyze the issue

*Phase B: BUILD*
- [ ] Used `/dev` to make changes
- [ ] Used `/test` to verify no breakage
- [ ] Used `/validate` to check acceptance criteria

*Phase C: SHIP*
- [ ] Used `/deploy` to create PR
- [ ] Received approval from reviewer
- [ ] Used `/merge` to merge approved PR
- [ ] Used `/finalize` to close the issue
- [ ] Verified final state on GitHub

**Final State:**
- [ ] Issue #114 is closed
- [ ] PR is merged to main
- [ ] Project board shows issue in "Done"
- [ ] ~576 lines of deprecated code removed

---

## Key Takeaways

1. **Three phases: Understand → Build → Ship** - Know where you are in the process
2. **Slash commands orchestrate the workflow** - Each command does one job well
3. **Claude handles the complexity** - Git, tests, PRs are automated
4. **Verification at each step** - Always check output before proceeding
5. **Safe to ask questions** - Type naturally to Claude for help

---

## Next Steps After #114

Once comfortable, try a slightly larger issue:

1. **Issue #115** (S) - Move deviceAssignmentService to domain structure
2. **Issue #116** (S) - Move businessDataService to domain structure

These follow the same Understand → Build → Ship pattern but involve moving files rather than deleting.

---

## Quick Reference Card

```
UNDERSTAND
  /plan <issue>     # Analyze and plan

BUILD
  /dev <issue>      # Write the code
  /test             # Run all tests
  /validate <issue> # E2E verification

SHIP
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
