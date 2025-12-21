# /autopm - Autonomous PM Loop

Run the complete project management workflow autonomously, from audit through issue generation.

## Usage
```
/autopm [mode] [--milestone <name>]
```

## Examples
```
/autopm                           # Full planning cycle, all milestones
/autopm full                      # Explicit full cycle
/autopm quick                     # Quick sprint planning (audit + kanban only)
/autopm --milestone "v2.0"        # Focus on specific milestone
/autopm full --milestone "MVP"    # Full cycle scoped to MVP milestone
/autopm quick --milestone "v2.1"  # Quick mode for v2.1 only
```

## What This Does

Executes the full PM loop without intervention:
```
Audit → Vision → Roadmap → Issues → Kanban → Changelog
```

At the end, you'll have GitHub issues ready for development.

## Execution

When invoked with `/autopm [mode] [--milestone <name>]`, execute these phases sequentially:

### Phase 1: Input Validation

```
# Parse arguments:
# - mode: full (default) or quick
# - milestone: optional, filter scope to specific milestone

# If invalid mode:
"❌ Invalid mode. Use 'full' or 'quick'"
"   /autopm full                    - Complete planning cycle"
"   /autopm quick                   - Sprint planning (audit + kanban)"
"   /autopm --milestone 'v2.0'      - Scope to specific milestone"
# STOP - do not proceed

# If milestone specified, verify it exists:
gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title == "{milestone}")'
# If not found: WARN but continue (will create if needed in roadmap phase)
```

**Output:**
```
🚀 Starting autonomous PM loop ({mode} mode)
📍 Scope: {milestone or "All milestones"}

This will run the complete workflow:
  1. Project Audit
  2. Vision Definition      (full only)
  3. Roadmap Planning       (full only)
  4. Issue Generation       (scoped to: {milestone or "all"})
  5. Board Optimization
  6. Changelog Generation

You can monitor progress or walk away - issues will be ready when complete.
```

### Phase 2: Project Audit

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Phase 1/6: Project Audit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Task tool with `subagent_type="general-purpose"`:
- Analyze codebase structure and health
- Review GitHub board state (open issues, PRs)
- Collect metrics (test coverage, dependencies)
- Compare to previous audits for trends
- Save audit to `docs/planning/audits/YYYY-MM-DD.md`

**On failure:** ABORT - Cannot plan without understanding current state.

**On success:**
```
✅ Audit complete - saved to docs/planning/audits/{date}.md
```

### Phase 3: Vision Definition (Full Mode Only)

**If quick mode:** SKIP to Phase 5

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Phase 2/6: Vision Definition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Task tool with `subagent_type="general-purpose"`:
- Review existing vision document (if present)
- Identify gaps using enabler/blocker classification
- Update `docs/planning/vision.md`

**Note:** Use AskUserQuestion for priority input if vision document doesn't exist.

**On failure:** CONTINUE - Can proceed with existing vision or skip.

**On success:**
```
✅ Vision updated - {gap_count} gaps identified
```

### Phase 4: Roadmap Planning (Full Mode Only)

**If quick mode:** SKIP to Phase 5

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ Phase 3/6: Roadmap Planning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Task tool with `subagent_type="general-purpose"`:
- Review vision goals and gaps
- Break into milestones (1-3 weeks each per Linear Method)
- Prioritize by dependencies and value
- Create/update GitHub milestones
- Save to `docs/planning/roadmap.md`

**On failure:** CONTINUE - Can generate issues from existing roadmap.

**On success:**
```
✅ Roadmap updated - {milestone_count} milestones defined
```

### Phase 5: Issue Generation

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Phase 4/6: Issue Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scope: {milestone or "All milestones"}
```

Use the Task tool with `subagent_type="general-purpose"`:
- **If milestone specified:** Only generate issues for that milestone
- **If no milestone:** Review all roadmap milestones (or kanban board for quick mode)
- Check for existing issues (avoid duplicates)
- Create issues using Linear Method format (simple titles, optional body)
- Assign to appropriate milestones
- Return list of created issues

**Scoping behavior:**
- `--milestone "v2.0"`: Only create issues tagged to v2.0 milestone
- No milestone: Create issues for all milestones in roadmap (prioritized by blockers first)

**On failure:** CONTINUE - Document issues in summary.

**On success:**
```
✅ Issues created - {issue_count} new issues for {milestone or "all milestones"}
```

### Phase 6: Board Optimization

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Phase 5/6: Board Optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Task tool with `subagent_type="general-purpose"`:
- Identify stale issues (14+ days inactive)
- Detect blocked items
- Check priority alignment
- Flag orphaned items (no milestone/labels)
- Add status check comments where needed

**On failure:** CONTINUE - Board health is informational.

**On success:**
```
✅ Board optimized - {action_count} items addressed
```

### Phase 7: Changelog Generation

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Phase 6/6: Changelog Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Use the Task tool with `subagent_type="general-purpose"`:
- Collect merged PRs from the past week
- Collect closed issues from the past week
- Calculate shipping metrics
- Generate changelog at `docs/changelogs/YYYY-MM-DD.md`

**On failure:** CONTINUE - Changelog is informational.

**On success:**
```
✅ Changelog generated - {pr_count} PRs, {issue_count} issues shipped
```

### Completion

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 AUTOPM COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode: {mode}
Scope: {milestone or "All milestones"}

Artifacts Created:
  📊 Audit: docs/planning/audits/{date}.md
  🎯 Vision: docs/planning/vision.md         (full only)
  🗺️ Roadmap: docs/planning/roadmap.md       (full only)
  📝 Changelog: docs/changelogs/{date}.md

Issues Ready for Development ({milestone or "all"}):
  • #{issue1}: {title}
  • #{issue2}: {title}
  • ...

Next steps:
  1. Review created issues on GitHub
  2. Pick an issue to work on
  3. Run: /autodev {issue_number}

"Startups rarely die because they made too much progress,
 but they do die when they move too slow." - Linear Method
```

## Error Handling Summary

| Phase | On Failure |
|-------|------------|
| Project Audit | ABORT |
| Vision Definition | CONTINUE |
| Roadmap Planning | CONTINUE |
| Issue Generation | CONTINUE |
| Board Optimization | CONTINUE |
| Changelog Generation | CONTINUE |

## Mode Comparison

| Phase | Full Mode | Quick Mode |
|-------|-----------|------------|
| Project Audit | ✅ | ✅ |
| Vision Definition | ✅ | ⏭️ Skip |
| Roadmap Planning | ✅ | ⏭️ Skip |
| Issue Generation | ✅ | ✅ |
| Board Optimization | ✅ | ✅ |
| Changelog Generation | ✅ | ✅ |

## When to Use Each Mode

**Full Mode (`/autopm full`):**
- Quarterly planning
- Starting a new project phase
- After major milestones
- When vision needs refinement

**Quick Mode (`/autopm quick`):**
- Weekly sprint planning
- Board maintenance
- Catching up after time away
- Rapid iteration cycles

## When to Use Milestone Scoping

**Use `--milestone` when:**
- Focusing on a specific release (e.g., `--milestone "v2.0"`)
- Sprint planning for one milestone at a time
- Avoiding issue overwhelm on large projects
- Working on parallel workstreams with different teams

**Skip `--milestone` when:**
- Doing quarterly planning across all milestones
- Initial project setup
- You want a holistic view of all work

## Notes

- Each Task agent runs autonomously with full tool access
- Progress is visible in Claude Code via `/tasks`
- Review created issues before starting development
- Use `/pm-reflect` after several cycles to improve the process
