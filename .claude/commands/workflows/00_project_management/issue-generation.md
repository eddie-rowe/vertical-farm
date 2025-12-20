Generate well-structured GitHub issues from the roadmap:

[Extended thinking: This workflow is the handoff point between PM and SDLC loops. It converts roadmap milestones and deliverables into GitHub issues with proper structure, labels, and acceptance criteria. Issues created here are then processed by /plan → /dev → etc.]

**Gather Context**
- Read `docs/planning/roadmap.md` for milestones and deliverables
- Read `docs/planning/vision.md` for acceptance criteria context
- Check existing issues to avoid duplicates: `gh issue list --state all --limit 100`

**Issue Planning**
For each deliverable in the roadmap:
1. Determine if it needs an issue (skip if already exists)
2. Classify issue type: feature, enhancement, bug, chore
3. Estimate complexity: small, medium, large
4. Identify parent milestone
5. Draft acceptance criteria

**User Confirmation**
Use AskUserQuestion to confirm:
- "I've identified N items to create as issues. Review the list?"
- Present summary table of proposed issues
- Allow user to modify before creation

**Issue Creation**
Use gh CLI to create issues:

```bash
# Create feature issue (Linear Method: minimal, clear issues)
gh issue create \
  --title "feat: [Title]" \
  --body "$(cat <<'EOF'
[Context if needed - otherwise omit entirely]

---
*From roadmap by /issues*
EOF
)" \
  --label "enhancement" \
  --milestone "Milestone Name"
```

**Linear Method: Issue Simplicity**
- Titles should be self-explanatory ("feat: Add dark mode toggle")
- Body is OPTIONAL - only add context that isn't obvious from the title
- Trust the assignee to determine implementation details
- If issue needs detailed specs, link to external doc instead
- Avoid "As a user..." format - describe concrete tasks in plain language
- Skip detailed acceptance criteria checklists - they slow momentum

**Issue Types and Labels**
| Type | Title Prefix | Labels |
|------|-------------|--------|
| Feature | `feat:` | enhancement |
| Bug | `fix:` | bug |
| Refactor | `refactor:` | refactor |
| Docs | `docs:` | documentation |
| Chore | `chore:` | chore |

**Sub-issues for Complex Items**
For large items, create parent issue with sub-issues:
1. Create parent issue with overview
2. Create child issues for each component
3. Link children to parent in description
4. Use `gh issue edit` to add sub-issue references

**Output Summary**
After creation, display:

```
═══════════════════════════════════════════════════════════════
📋 Issues Created
═══════════════════════════════════════════════════════════════

✅ Created N new issues:

| # | Title | Type | Milestone |
|---|-------|------|-----------|
| 123 | feat: Add X | enhancement | v2.0 |
| 124 | fix: Fix Y | bug | v2.0 |

⏭️ Next Steps:
   • Pick an issue to work on
   • Run '/plan <issue#>' to analyze and break down
   • Continue with SDLC loop: /dev → /test → /validate → /deploy

🔗 View all issues: https://github.com/{owner}/{repo}/issues
═══════════════════════════════════════════════════════════════
```

Update context with created issue numbers for reference.
