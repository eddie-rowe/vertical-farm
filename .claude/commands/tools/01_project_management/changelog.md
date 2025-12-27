# /changelog - Generate Weekly Changelog

Generate a changelog from recent GitHub activity to track progress and maintain accountability.

[Extended thinking: This workflow creates a changelog to track progress and maintain momentum. Per Linear Method, publishing updates regularly combats the psychological challenge when momentum feels slow.]

## Usage
```
/changelog
```

## When to Use
- Weekly (every Friday or Monday)
- After major releases
- When progress feels slow (morale boost)

## Execution

When invoked with `/changelog`, execute these steps:

1. **Begin Changelog Generation**
   **Output:**
   ```
   📝 Starting changelog generation...
   ```

2. **Gather Activity Data**
   Collect GitHub activity from the past 7 days:
   ```bash
   # Merged PRs (past 7 days)
   gh pr list --state merged --limit 30 --json number,title,mergedAt,labels,author

   # Closed issues (past 7 days)
   gh issue list --state closed --limit 50 --json number,title,closedAt,labels

   # Recent commits
   git log --since="7 days ago" --oneline --format="%h %s" | head -30
   ```

3. **Categorize by Type**
   Group items by label/prefix:
   | Category | Prefix/Label |
   |----------|--------------|
   | Features | `feat:`, `enhancement` |
   | Fixes | `fix:`, `bug` |
   | Improvements | `refactor:`, `chore:`, `docs:` |

4. **Calculate Metrics**
   - Total PRs merged this week
   - Total issues closed this week
   - Compare to previous week if data exists

5. **Generate Changelog**
   Create `docs/changelogs/YYYY-MM-DD.md`:

   ```markdown
   # Changelog - Week of YYYY-MM-DD

   ## Shipped This Week

   ### Features
   - feat: [Title] (#123) - @author

   ### Fixes
   - fix: [Title] (#124) - @author

   ### Improvements
   - refactor: [Title] (#125) - @author

   ## Metrics
   | Metric | This Week | Trend |
   |--------|-----------|-------|
   | PRs merged | N | ↑/↓/→ |
   | Issues closed | N | ↑/↓/→ |

   ## Highlights
   [Notable achievements or milestones]

   ## Next Week Focus
   [From current roadmap - top priorities]
   ```

6. **Complete Changelog**
   **Output:**
   ```
   ✅ Changelog Generated
   📁 Saved: docs/changelogs/YYYY-MM-DD.md

   📊 This Week:
      • N features shipped
      • N bugs fixed
      • N issues closed

   💡 Next steps: Share with stakeholders or '/pm-reflect'
   ```

## Linear Method Principle

*"At times, when you feel things not moving as fast, you can look back at how much you achieved already."*

Publishing changelogs regularly:
- Creates weekly accountability
- Combats demoralization during slow periods
- Builds credibility with stakeholders

## Output Location

`docs/changelogs/YYYY-MM-DD.md`
