# /issues - Generate GitHub Issues

Generate well-structured GitHub issues from the roadmap. This is the handoff point to the SDLC loop.

[Extended thinking: This workflow is the handoff point between PM and SDLC loops. It converts roadmap milestones and deliverables into GitHub issues with proper structure, labels, and acceptance criteria. Issues created here are then processed by /plan → /dev → etc.]

## Usage
```
/issues
```

## Execution

When invoked with `/issues`, execute these steps:

1. **Begin Issue Generation**
   **Output:**
   ```
   📋 Starting issue generation workflow...
   ```

2. **Gather Context**
   - Read `docs/planning/roadmap.md` for milestones and deliverables
   - Read `docs/planning/vision.md` for acceptance criteria context
   - Check existing issues to avoid duplicates: `gh issue list --state all --limit 100`

3. **Issue Planning**
   For each deliverable in the roadmap:
   - Determine if it needs an issue (skip if already exists)
   - Classify issue type: feature, enhancement, bug, chore
   - Estimate complexity: small, medium, large
   - Identify parent milestone

4. **Linear Method: Issue Simplicity**
   - Titles should be self-explanatory ("feat: Add dark mode toggle")
   - Body is OPTIONAL - only add context that isn't obvious from title
   - Trust the assignee to determine implementation details
   - Avoid "As a user..." format - describe concrete tasks

5. **User Confirmation**
   Use AskUserQuestion to confirm:
   - "I've identified N items to create as issues. Review the list?"
   - Present summary table of proposed issues
   - Allow user to modify before creation

6. **Issue Creation**
   ```bash
   gh issue create \
     --title "feat: [Title]" \
     --body "[Context if needed]" \
     --label "enhancement" \
     --milestone "Milestone Name"
   ```

   **Issue Types and Labels:**
   | Type | Title Prefix | Labels |
   |------|-------------|--------|
   | Feature | `feat:` | enhancement |
   | Bug | `fix:` | bug |
   | Refactor | `refactor:` | refactor |
   | Docs | `docs:` | documentation |
   | Chore | `chore:` | chore |

7. **Sub-issues for Complex Items**
   For large items:
   - Create parent issue with overview
   - Create child issues for each component
   - Link children to parent in description

8. **Complete Issue Generation**
   **Output:**
   ```
   ✅ Issues Created

   📋 Created N new issues:
   | # | Title | Type | Milestone |
   |---|-------|------|-----------|
   | 123 | feat: Feature X | enhancement | v2.0 |

   ⏭️ Ready for SDLC Loop:
      • Run '/plan <issue#>' to analyze
      • Continue: /dev → /test → /validate → /deploy

   🔗 View issues: https://github.com/eddie-rowe/vertical-farm/issues
   ```

## Handoff to SDLC

```
/issues creates #123
    ↓
/plan 123 → /dev 123 → /test → /validate 123 → /deploy 123
```
