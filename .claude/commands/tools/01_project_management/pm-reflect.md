# /pm-reflect - PM Process Reflection

Review PM process effectiveness, analyze metrics, and identify improvements.

[Extended thinking: This workflow analyzes the PM loop's performance by examining cycle times, roadmap accuracy, and process bottlenecks. It generates insights and recommendations for improving the planning process.]

## Usage
```
/pm-reflect
```

## When to Use
- After completing major milestones
- At sprint/iteration boundaries
- When process feels inefficient
- Quarterly for continuous improvement

## Agent Orchestration

| Task | Agent | Purpose |
|------|-------|---------|
| Metrics Analysis | **business-analyst** | Cycle time, throughput, trends |

## Execution

When invoked with `/pm-reflect`, execute these steps:

1. **Begin Reflection**
   **Output:**
   ```
   📊 Starting PM reflection workflow...
   ```

2. **Gather Historical Data**
   ```bash
   # Closed issues with timeline
   gh issue list --state closed --limit 50 --json number,title,createdAt,closedAt,labels,milestone

   # Merged PRs with timeline
   gh pr list --state merged --limit 30 --json number,title,createdAt,mergedAt
   ```

3. **Read Previous Planning Artifacts**
   - Read recent audits from `docs/planning/audits/`
   - Read `docs/planning/roadmap.md` for planned vs actual
   - Read previous reflections from `docs/planning/reflections/`

4. **Analysis Dimensions**

   | Dimension | Questions |
   |-----------|-----------|
   | Cycle Time | Avg time from issue creation to close? |
   | Roadmap Accuracy | Planned vs actual delivery? |
   | Process Bottlenecks | Where do issues get stuck? |
   | Planning Quality | Were descriptions sufficient? |
   | Momentum Health | Daily shipping frequency? Items stuck >3 days? |

5. **Momentum Score (Linear Method)**
   - **HIGH**: Daily commits, issues closed within cycle, no blockers
   - **MEDIUM**: Weekly shipping, some items slow, minor blockers
   - **LOW**: Multi-week stalls, many stuck items, major blockers

6. **Generate Insights** (business-analyst)
   Analyze data and identify:
   - Trends in cycle time and throughput
   - Patterns in what gets delivered vs planned
   - Process improvement opportunities

7. **Generate Reflection Report**
   Create `docs/planning/reflections/YYYY-MM-DD.md`:

   ```markdown
   # PM Reflection - YYYY-MM-DD

   ## Executive Summary
   [2-3 sentences on overall PM effectiveness]

   ## Metrics
   | Metric | Value | Trend |
   |--------|-------|-------|
   | Avg issue cycle time | X days | ↑/↓/→ |
   | Throughput | N issues/week | - |
   | Roadmap Accuracy | X% | - |

   ## Momentum Health
   | Indicator | Value | Status |
   |-----------|-------|--------|
   | Daily commit rate | X/day | ✅/⚠️ |
   | Items stuck >3 days | N | ✅/⚠️ |

   ## Roadmap vs Actual
   - [x] Item 1 - Completed
   - [ ] Item 2 - Slipped

   ## Recommendations
   1. [Recommendation] - Expected impact
   ```

8. **Complete Reflection**
   **Output:**
   ```
   ✅ PM Reflection Complete

   📈 Key Metrics:
      • Cycle Time: X days
      • Throughput: N issues/week
      • Roadmap Accuracy: X%

   📁 Full report: docs/planning/reflections/YYYY-MM-DD.md
   ⏭️ Next: Run '/audit' to start next planning cycle
   ```

## Completes the PM Loop

```
/audit → /vision → /research → /roadmap → /issues → /kanban
   ↑                                                    │
   └──────────────── /pm-reflect ───────────────────────┘
```

## Output Location

`docs/planning/reflections/YYYY-MM-DD.md`
