# /autodev - Autonomous Development Loop

Run the complete development workflow on a GitHub issue autonomously, from planning through PR creation.

## Usage
```
/autodev <issue_number>
/autodev #<issue_number>
/autodev <github_issue_url>
```

## Examples
```
/autodev 123
/autodev #115
/autodev https://github.com/eddie-rowe/vertical-farm/issues/123
```

## What This Does

Executes the full development loop by invoking each SDLC slash command sequentially:
```
/tools:02_development:up → /tools:02_development:plan → /tools:02_development:dev → /tools:02_development:test → /tools:02_development:validate → /tools:02_development:reflect → /tools:02_development:deploy
```

At the end, you'll have a PR ready for review and a reflection report saved.

## Execution

When invoked with `/autodev <argument>`, execute these phases sequentially:

### Phase 1: Input Validation

```
# If no argument provided:
"❌ Please provide an issue number"
"   /autodev 123"
"   /autodev #123"
"   /autodev https://github.com/owner/repo/issues/123"
# STOP - do not proceed

# Parse issue number from input (handle 123, #123, or URL formats)
# Extract just the number and store as {issue}
```

**Output:**
```
🚀 Starting autonomous development for issue #{issue}

This will run the complete workflow:
  1. Environment Setup (/tools:02_development:up)
  2. Planning & Analysis (/tools:02_development:plan)
  3. Feature Development (/tools:02_development:dev)
  4. Testing (/tools:02_development:test)
  5. E2E Validation (/tools:02_development:validate)
  6. Reflection (/tools:02_development:reflect)
  7. PR Deployment (/tools:02_development:deploy)

You can monitor progress or walk away - PR will be ready when complete.
```

### Phase 2: Environment Setup

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Phase 1/7: Environment Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:up`:
- Starts Supabase and Docker services
- Creates environment files with credentials
- Performs health checks on all services

**On failure:** ABORT - Cannot continue without services running.

**On success:**
```
✅ Environment ready
```

### Phase 3: Planning

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Phase 2/7: Planning & Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:plan {issue}`:
- Fetches issue #{issue} from GitHub
- Analyzes requirements and acceptance criteria
- Breaks down into implementation subtasks
- Identifies files that need to be modified
- Saves context for subsequent phases

**On failure:** ABORT - Cannot develop without a plan.

**On success:**
```
✅ Planning complete - subtasks identified
```

### Phase 4: Development

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 Phase 3/7: Feature Development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:dev {issue}`:
- Reads the plan from Phase 3
- Implements all code changes following CLAUDE.md patterns
- Uses the service layer for all data operations
- Creates or modifies tests as needed
- Returns list of files modified

**On failure:** ABORT - Nothing to test or deploy.

**On success:**
```
✅ Development complete - files modified
```

### Phase 5: Testing

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Phase 4/7: Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:test`:
- Runs full CI with nektos/act
- Executes backend tests (unit, API, integration, schemas)
- Executes frontend tests (Jest unit, integration)
- Reports pass/fail counts

**On failure:** CONTINUE - Document failures, proceed to validation.

**On success/partial:**
```
✅ Testing complete - {pass_count} passed, {fail_count} failed
```

### Phase 6: Validation

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 Phase 5/7: E2E Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:validate {issue}`:
- Uses Playwright to explore and validate features
- Tests user workflows end-to-end
- Takes screenshots for verification
- Validates acceptance criteria from the issue
- Generates validation report with evidence

**On failure:** CONTINUE - Document issues, proceed to reflection.

**On success/partial:**
```
✅ Validation complete - screenshots captured
```

### Phase 7: Reflection

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Phase 6/7: Reflection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:reflect 1 all`:
- Analyzes recent commit patterns
- Reviews code quality and pattern consistency
- Identifies workflow optimizations
- Generates reflection report to `.claude/reports/reflections/`

**On failure:** CONTINUE - Proceed to deployment without report.

**On success:**
```
✅ Reflection report saved to .claude/reports/reflections/YYYY-MM-DD-reflection.md
```

### Phase 8: Deployment

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Phase 7/7: PR Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the SlashCommand tool to invoke `/tools:02_development:deploy {issue}`:
- Runs code quality review
- Stages all changes and creates commit
- Pushes to remote branch
- Creates PR linking to issue #{issue}
- Includes test results and any issues in PR description
- Returns PR URL

**On failure:** ABORT - Report error.

**On success:**
```
✅ PR created successfully
```

### Completion

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 AUTODEV COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: #{issue}
PR: {pr_url}
Reflection: .claude/reports/reflections/YYYY-MM-DD-reflection.md

Next steps:
  1. Review the PR on GitHub
  2. After approval: /tools:02_development:merge {pr_number}
  3. Then: /tools:02_development:finalize {issue}
```

## Error Handling Summary

| Phase | Command | On Failure |
|-------|---------|------------|
| Environment Setup | `/tools:02_development:up` | ABORT |
| Planning | `/tools:02_development:plan {issue}` | ABORT |
| Development | `/tools:02_development:dev {issue}` | ABORT |
| Testing | `/tools:02_development:test` | CONTINUE (note in PR) |
| Validation | `/tools:02_development:validate {issue}` | CONTINUE (note in PR) |
| Reflection | `/tools:02_development:reflect 1 all` | CONTINUE (proceed without report) |
| Deployment | `/tools:02_development:deploy {issue}` | ABORT |

## Notes

- Each phase runs in the same Claude session, sharing conversation memory
- Commands query GitHub directly for authoritative issue/PR state
- The "Current Work" section in CLAUDE.md tracks active issue across sessions
- Progress is visible in Claude Code as each command executes
- If session ends mid-workflow, restart with `/autodev {issue}` - it will detect existing work
- The PR description will include any test failures or validation issues
- Review the PR carefully before merging
