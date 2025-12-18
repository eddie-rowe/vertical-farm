# /audit - Project State Snapshot

Capture a comprehensive snapshot of the project's current state including codebase, GitHub board, and key metrics.

## Usage
```
/audit
```

## Examples
```
/audit
```

## Execution

When invoked with `/audit`, execute these steps:

1. **Begin Audit**
   **Output:**
   ```
   🤖 Starting project audit...
   📊 Gathering codebase, board, and metrics data
   ```

2. **Execute Audit Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/project-audit.md
   ```
   **Output:**
   ```
   🔍 Analyzing project state...

   Claude will now:
     1. Analyze codebase structure and tech debt
     2. Pull GitHub project board state
     3. Summarize open issues and PRs
     4. Capture key metrics
     5. Compare against previous audit
   ```

3. **Complete Audit**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Audit Complete
   ═══════════════════════════════════════════════════════════════

   📁 Report saved: docs/planning/audits/YYYY-MM-DD.md
   📂 Context updated for next steps

   💡 Next steps:
      • '/vision' - Define or refine product goals
      • '/kanban' - Optimize project board
      • '/pm-reflect' - Review PM effectiveness
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

`docs/planning/audits/YYYY-MM-DD.md`
