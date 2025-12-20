# Issue Readiness Workflow

## Overview

This document defines the criteria and process for moving issues from **Triage** to **Ready** status on the project board. The goal is to ensure only well-defined, unblocked issues are picked up by the team for development.

**Board Workflow:** Triage → Ready → In Progress → Review → Done

---

## Column Definitions & Transition Conditions

### Triage
Issues in Triage are newly created or need clarification before they can be worked on.

**Issues stay in Triage if:**
- Missing required information (acceptance criteria, requirements)
- Under stakeholder review or decision-making
- Waiting for dependency completion
- Blocked by external factors
- Need technical approach documentation

**Move to Triage when:**
- Issue is first created
- Issue returns from Ready due to missing information

### Ready
Issues in Ready meet ALL readiness criteria and are approved for development.

**Issues move to Ready when:**
- ✅ Requirements & Acceptance Criteria are clear
- ✅ All dependencies are identified and resolved
- ✅ Technical approach is documented
- ✅ Tech lead has approved
- ✅ Test plan is defined
- ✅ All required labels are applied

**Issues stay in Ready when:**
- Waiting for developer assignment
- Waiting for sprint planning to include in upcoming sprint

**Move back to Triage if:**
- Requirements change significantly
- New blockers emerge
- Tech approach needs revision

### In Progress
Issues in In Progress are actively being worked on.

**Issues move to In Progress when:**
- Developer is assigned
- Work has started
- Branch created (for code changes)
- Issue is included in current sprint

### Review
Issues in Review are awaiting feedback or approval before completion.

**Issues move to Review when:**
- PR is created (for code work)
- Implementation is complete
- Tests are passing
- Waiting for code review/approval

### Done
Issues are complete and deployed/released.

**Issues move to Done when:**
- PR is merged (for code work)
- Deployment is complete (if applicable)
- Tests passing in production
- Stakeholder verification complete

---

## Readiness Criteria Checklist

All 5 categories below must be complete for an issue to move to Ready:

### 1. Clear Requirements & Acceptance Criteria
**What we're checking:**
- Title is specific and actionable (e.g., "Add dark mode toggle to user settings" vs "Improve UI")
- Description clearly explains what needs to be done and why
- Acceptance criteria are measurable and testable
- Edge cases and error scenarios are documented
- Related issues, dependencies, and milestones are linked

**Examples of ready:**
- ✅ "Implement JWT refresh token rotation in authentication flow"
  - Why: Clear scope, specific requirement, measurable
- ✅ "Add data export to CSV/JSON formats in analytics dashboard"
  - Why: Specific outputs defined, clear use case

**Examples of NOT ready:**
- ❌ "Improve performance"
  - Why: Vague, no metrics, unclear scope
- ❌ "Add new feature"
  - Why: No description of what feature or why

### 2. Dependencies Resolved
**What we're checking:**
- All blocking issues are identified
- Blocking issues are either completed or marked as non-critical
- Required services/infrastructure are available
- Database schema or APIs are ready
- Third-party integrations are accessible

**Examples of ready:**
- ✅ "Integrate Stripe payments" (Stripe account setup ✅, API keys configured ✅)
- ✅ "Add device metrics dashboard" (device data endpoint ✅, real-time subscription ✅)

**Examples of NOT ready:**
- ❌ "Integrate Home Assistant" (blocked on #150 "Setup HA authentication")
- ❌ "Add farm scheduling" (blocked on database schema changes in #142)

### 3. Technical Approach Documented
**What we're checking:**
- Implementation strategy is defined (architecture, patterns)
- Architecture decisions are explained (why this approach vs alternatives)
- File paths for changes are identified
- Reference implementations or examples are linked
- Performance considerations are noted

**Examples of ready:**
- ✅ "Add real-time device metrics" - "Use WebSocket subscriptions via Supabase realtime. Updates dashboard every 5s."
- ✅ "Refactor farm hierarchy component" - "Split into smaller components: FarmCard, RackCard, etc. Use context for state."

**Examples of NOT ready:**
- ❌ "Build new settings page" - No mention of component structure, routing, or state management
- ❌ "Optimize API response time" - No specific bottleneck identified or approach suggested

### 4. Stakeholder Approval
**What we're checking:**
- Issue has been reviewed by tech lead or project owner
- Priority level has been confirmed
- Scope has been validated against team capacity
- No conflicting requirements exist
- Business value/impact is documented

**Examples of ready:**
- ✅ Issue has comment: "✅ Ready for dev - approved by @tech-lead"
- ✅ Priority confirmed as P0, scope validated for current sprint

**Examples of NOT ready:**
- ❌ No tech lead review or approval
- ❌ Priority unclear or disputed

### 5. Test Plan Defined
**What we're checking:**
- Testing strategy is documented (unit, integration, E2E)
- Test cases or scenarios are outlined
- Manual testing requirements are noted
- Regression test needs identified
- Acceptance test criteria match success metrics

**Examples of ready:**
- ✅ "Unit tests for auth service. E2E test for login flow. Manual: test 2FA codes, password reset."
- ✅ "Jest tests for form validation. Playwright E2E for checkout flow."

**Examples of NOT ready:**
- ❌ "Test it" - No specific test strategy
- ❌ No testing details provided

---

## Readiness Assessment Scoring

When in doubt, use this quick scoring rubric:

| Criteria | Not Ready (0) | Needs Work (1) | Ready (2) |
|----------|---------------|----------------|-----------|
| **Requirements** | Missing acceptance criteria | Partial criteria, some ambiguity | Clear, measurable, complete |
| **Dependencies** | Blocking issues not identified | Some blockers identified, not resolved | All blockers identified, resolved |
| **Tech Approach** | No documentation | Vague approach, needs detail | Clear strategy, examples linked |
| **Approval** | No tech lead review | Awaiting final approval | Tech lead approved ✅ |
| **Test Plan** | No plan mentioned | Partial plan, needs detail | Complete strategy with test cases |

**Score 10/10:** Ready to move to Ready column
**Score 8-9/10:** Good progress, minor gaps - discuss with tech lead
**Score < 8/10:** Stay in Triage, needs more work

---

## Transition Workflow & Process

### Step 1: Self-Assessment (Team Member)
1. Review issue against 5 readiness criteria
2. Complete missing information or sections
3. Add `size:` and `priority-*` labels if not present
4. When ready, add label: `triage:ready-for-dev`

### Step 2: Tech Lead Review (Tech Lead Only)
1. Check issue against all 5 criteria
2. **If approved:**
   - Add comment: "✅ Ready for dev - approved by @tech-lead"
   - Add label: `triage:approved`
   - Manually move issue to "Ready" column
3. **If needs more work:**
   - Add label: `triage:needs-info`
   - Add comment with specific gaps to fix
   - Issue stays in Triage
4. **If blocked:**
   - Add label: `triage:blocked`
   - Add comment explaining blocker and when it will be resolved
   - Issue stays in Triage

### Step 3: Ready Column
- Issue is now available for team members to pick up
- During sprint planning, team pulls items from Ready column
- As developer starts work, move to "In Progress"

---

## Labels Used

| Label | Color | Purpose | Who Sets |
|-------|-------|---------|----------|
| `triage:ready-for-dev` | Green | Issue meets criteria, ready for tech lead review | Team member |
| `triage:needs-info` | Yellow | Needs clarification or more details | Tech lead |
| `triage:blocked` | Red | Blocked by dependency or external factor | Tech lead |
| `triage:approved` | Blue | Tech lead approved, can move to Ready | Tech lead |
| `priority-high` | Red | P0 - Critical, must do | Team member/Tech lead |
| `priority-medium` | Orange | P1 - Important, should do | Team member/Tech lead |
| `priority-low` | Yellow | P2 - Nice to have | Team member/Tech lead |
| `size: S` | Light | Small task (1-2 days) | Team member/Tech lead |
| `size: M` | Light | Medium task (3-5 days) | Team member/Tech lead |
| `size: L` | Light | Large task (1-2 weeks) | Team member/Tech lead |
| `size: XL` | Light | Extra large (2+ weeks) | Team member/Tech lead |

---

## Common Issues & Solutions

### Issue: "My issue got labeled `triage:needs-info` - what do I do?"
**Solution:** Tech lead's comment explains what's missing. Add that information to the issue, then ping tech lead in comments when ready for re-review.

### Issue: "My issue is blocked - how long will it stay blocked?"
**Solution:** Tech lead's comment on the issue will explain the blocker and expected resolution date. Check back when the blocking issue is resolved.

### Issue: "I have an issue ready to move but no tech lead available"
**Solution:** Add the `triage:ready-for-dev` label and a comment mentioning @tech-lead. They'll review when available. For urgent items, reach out directly in Slack.

### Issue: "What if I disagree with the tech lead's feedback?"
**Solution:** Comment on the issue with your reasoning. Discussion is encouraged! The goal is clarity, not gatekeeping.

---

## Decision Tree for Transitions

```
START: Issue in Triage
│
├─ Missing required information?
│  └─ YES → Stay in Triage (tag triage:needs-info)
│  └─ NO → Continue
│
├─ Has blocking dependencies?
│  └─ YES → Stay in Triage (tag triage:blocked)
│  └─ NO → Continue
│
├─ Has acceptance criteria defined?
│  └─ NO → Stay in Triage (tag triage:needs-info)
│  └─ YES → Continue
│
├─ Has technical approach documented?
│  └─ NO → Stay in Triage (tag triage:needs-info)
│  └─ YES → Continue
│
├─ Has test plan defined?
│  └─ NO → Stay in Triage (tag triage:needs-info)
│  └─ YES → Continue
│
├─ Has tech lead approval?
│  └─ NO → Waiting (tag triage:ready-for-dev)
│  └─ YES → Continue
│
└─ READY: Move to Ready column (tag triage:approved)
```

---

## Example: Moving an Issue to Ready

### Before (Triage)
```
Issue #42: Add dark mode toggle to user settings

❌ Acceptance criteria: Vague
❌ Dependencies: Not documented
❌ Tech approach: Missing
❌ Tech lead approval: None
❌ Test plan: Missing

Labels: None
Status: Triage
```

### Work by Team Member
```
Issue #42: Add dark mode toggle to user settings

Acceptance Criteria:
- [ ] Toggle in settings page header
- [ ] Stores preference in user profile
- [ ] Applies theme across all pages
- [ ] Works on mobile and desktop

Dependencies: None identified
Tech Approach: Use CSS custom properties, React context for theme state
Test Plan: Jest tests for theme context, Playwright E2E for toggle interaction
```

### Tech Lead Review
```
✅ Ready for dev - approved by @tech-lead

All criteria met:
✅ Requirements clear
✅ No blockers
✅ Tech approach documented
✅ Test plan defined
✅ Ready for implementation
```

### After (Ready)
```
Issue #42: Add dark mode toggle to user settings

✅ Complete requirements
✅ No dependencies
✅ Tech approach: Context + CSS variables
✅ Tech lead approved ✅
✅ Test plan: Unit + E2E

Labels: priority-medium, size: M, triage:approved
Status: Ready → (waiting for sprint planning)
```

---

## Metrics & Success Criteria

Track these metrics to monitor workflow health:

- **Triage → Ready time:** < 1 day for HIGH priority, < 3 days for MEDIUM
- **Ready → In Progress time:** Should match sprint planning cycle
- **Issues ready for sprint:** 80%+ of planned items meet all criteria
- **Team satisfaction:** > 4/5 on clarity of Ready issues
- **Blocker resolution:** Average resolution time for blocked issues

---

## Questions?

- For readiness criteria questions, ask your tech lead
- For workflow process questions, check this document
- For project board questions, contact the product manager
