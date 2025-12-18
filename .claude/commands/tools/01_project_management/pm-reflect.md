# /pm-reflect - PM Process Reflection

Review PM process effectiveness, analyze metrics, and identify improvements.

## Usage
```
/pm-reflect
```

## Examples
```
/pm-reflect
```

## Execution

When invoked with `/pm-reflect`, execute these steps:

1. **Begin Reflection**
   **Output:**
   ```
   🤖 Starting PM reflection workflow...
   📊 Analyzing planning effectiveness
   ```

2. **Execute Reflection Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/pm-reflection.md
   ```
   **Output:**
   ```
   🔍 Gathering historical data...

   Claude will now:
     1. Analyze cycle times and throughput
     2. Compare roadmap plans to actual delivery
     3. Identify process bottlenecks
     4. Review planning quality
     5. Generate improvement recommendations
   ```

3. **Complete Reflection**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   📊 PM Reflection Complete
   ═══════════════════════════════════════════════════════════════

   📈 Key Metrics:
      • Cycle Time: X days (↑/↓ from previous)
      • Throughput: N issues/week
      • Roadmap Accuracy: X%

   💡 Top Insights:
      1. [Insight 1]
      2. [Insight 2]

   🎯 Recommendations:
      1. [Recommendation 1]
      2. [Recommendation 2]

   📁 Full report: docs/planning/reflections/YYYY-MM-DD.md

   ⏭️ Next: Run '/audit' to start next planning cycle
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

`docs/planning/reflections/YYYY-MM-DD.md`

## When to Use

- After completing major milestones
- At sprint/iteration boundaries
- When process feels inefficient
- Quarterly for continuous improvement

## Completes the PM Loop

```
/audit → /vision → /research → /roadmap → /issues → /kanban
   ↑                                                    │
   └──────────────── /pm-reflect ───────────────────────┘
```
