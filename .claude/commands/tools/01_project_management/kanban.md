# /kanban - Optimize Project Board

Analyze and optimize the GitHub project board for effective work management.

## Usage
```
/kanban
```

## Examples
```
/kanban
```

## Execution

When invoked with `/kanban`, execute these steps:

1. **Begin Board Optimization**
   **Output:**
   ```
   🤖 Starting kanban optimization workflow...
   📊 Analyzing project board health
   ```

2. **Execute Kanban Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/kanban-optimization.md
   ```
   **Output:**
   ```
   🔍 Gathering board state...

   Claude will now:
     1. Analyze all open issues and PRs
     2. Identify stale and blocked items
     3. Check priority alignment
     4. Flag orphaned items
     5. Suggest optimizations
   ```

3. **Complete Optimization**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   📊 Board Health Report
   ═══════════════════════════════════════════════════════════════

   📈 Summary:
      • Open Issues: N
      • Open PRs: N
      • Stale Items: N
      • Blocked Items: N

   Board Health: [Good/Needs Attention/Critical]

   Actions Taken:
      • [Action 1]
      • [Action 2]

   💡 Recommendations:
      • [Recommendation 1]
      • [Recommendation 2]

   ⏭️ Next steps:
      • '/audit' - Full project state audit
      • '/pm-reflect' - Review PM effectiveness
   ═══════════════════════════════════════════════════════════════
   ```

## Board Health Indicators

| Status | Meaning |
|--------|---------|
| Good ✅ | Active work, clear priorities, no blockers |
| Needs Attention ⚠️ | Some stale items or unclear priorities |
| Critical 🔴 | Many stale items, blockers, or priority issues |

## Actions Available

- Add status check comments to stale issues
- Label items needing triage
- Close abandoned issues
- Assign milestones to orphaned items
