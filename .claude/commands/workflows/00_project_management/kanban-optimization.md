Optimize the GitHub project board for effective work management:

[Extended thinking: This workflow analyzes the project board state, identifies issues needing attention (stale, blocked, misprioritized), and suggests or performs optimizations to keep work flowing smoothly.]

**Gather Board State**
Use gh CLI to collect current state:

```bash
# Get all open issues with details
gh issue list --state open --json number,title,labels,milestone,createdAt,updatedAt,assignees --limit 100

# Get open PRs
gh pr list --state open --json number,title,createdAt,updatedAt,isDraft,reviewDecision

# Get project board if using GitHub Projects
gh project item-list {project-number} --owner {owner} --format json
```

**Analysis Categories**

1. **Stale Issues** (no activity in 14+ days)
   - Identify issues with old updatedAt
   - Check if blocked or just forgotten
   - Suggest: close, update, or reassign

2. **Blocked Items**
   - Look for "blocked" label or mentions
   - Identify dependency chains
   - Suggest: resolve blocker or document why blocked

3. **Priority Assessment**
   - Review issue labels and milestones
   - Check if high-priority items are actually being worked
   - Identify priority inversions (low priority getting attention over high)

4. **WIP Limits**
   - Count items in progress
   - Flag if too many items are "in progress"
   - Suggest: focus on completing before starting new

5. **Orphaned Items**
   - Issues without milestone
   - Issues without labels
   - Suggest: categorize or close

**User Interaction**
Present findings and get direction:

```
═══════════════════════════════════════════════════════════════
📊 Board Health Report
═══════════════════════════════════════════════════════════════

📈 Summary:
   • Open Issues: N
   • Open PRs: N
   • Stale Items: N
   • Blocked Items: N

⚠️ Attention Needed:

🕐 Stale Issues (14+ days inactive):
   #123 - Title (last activity: 21 days ago)
   #124 - Title (last activity: 18 days ago)

🚫 Potentially Blocked:
   #125 - Title (mentions "waiting on")

❓ Needs Categorization:
   #126 - No milestone assigned
   #127 - No labels

═══════════════════════════════════════════════════════════════
```

Use AskUserQuestion:
- "Would you like me to add comments to stale issues asking for status?"
- "Should I close any of these stale issues?"
- "Would you like to assign milestones to orphaned issues?"

**Board Actions**
Based on user direction, execute:

```bash
# Add comment to stale issue
gh issue comment 123 --body "👋 Status check: This issue has been inactive for 2+ weeks. Is it still relevant? Please update or close if no longer needed."

# Add label
gh issue edit 123 --add-label "needs-triage"

# Close stale issue
gh issue close 123 --comment "Closing due to inactivity. Reopen if still needed."

# Move to milestone
gh issue edit 123 --milestone "Backlog"
```

**Output Summary**

```
═══════════════════════════════════════════════════════════════
✅ Board Optimization Complete
═══════════════════════════════════════════════════════════════

Actions Taken:
   • Added status check comments to 3 stale issues
   • Labeled 2 issues as needs-triage
   • Closed 1 abandoned issue

Board Health: Good ✅
   • Active issues with recent updates
   • Clear priorities in current milestone
   • No blocked items

💡 Recommendations:
   • Focus on completing #123 before starting new work
   • Review #125 next week if still no update

═══════════════════════════════════════════════════════════════
```

Update context with board health status.
