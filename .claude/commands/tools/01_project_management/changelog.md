# /changelog - Generate Weekly Changelog

Generate a changelog from recent GitHub activity to track progress and maintain accountability.

## Usage
```
/changelog
```

## Examples
```
/changelog
```

## Execution

When invoked with `/changelog`, execute these steps:

1. **Begin Changelog Generation**
   **Output:**
   ```
   🤖 Starting changelog generation...
   📝 Summarizing recent activity
   ```

2. **Execute Changelog Workflow**
   ```
   # Execute the workflow in: .claude/commands/workflows/00_project_management/changelog-generation.md
   ```
   **Output:**
   ```
   🔍 Gathering GitHub activity...

   Claude will now:
     1. Collect merged PRs from the past week
     2. Collect closed issues from the past week
     3. Calculate shipping metrics
     4. Generate changelog document
   ```

3. **Complete Changelog**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   ✅ Changelog Generated
   ═══════════════════════════════════════════════════════════════

   📁 Saved: docs/changelogs/YYYY-MM-DD.md

   📊 This Week:
      • N features shipped
      • N bugs fixed
      • N issues closed

   💡 Why changelogs matter (Linear Method):
      • Weekly accountability
      • Combat "slow progress" feelings
      • Track actual vs planned delivery

   ⏭️ Next steps:
      • Share with stakeholders
      • Run '/pm-reflect' for deeper analysis
   ═══════════════════════════════════════════════════════════════
   ```

## Output Location

`docs/changelogs/YYYY-MM-DD.md`

## When to Use

- Weekly (every Friday or Monday)
- After major releases
- When progress feels slow (morale boost)

## Linear Method Principle

*"At times, when you feel things not moving as fast, you can look back
at how much you achieved already."*

Publishing changelogs regularly:
- Creates weekly accountability
- Combats demoralization during slow periods
- Builds credibility with stakeholders
- Tracks actual vs planned delivery
