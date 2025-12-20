---
name: Ready for Development
description: Issue that has been triaged and is ready to be picked up by the team
title: "[READY] "
labels: ["triage:ready-for-dev"]
---

## Readiness Checklist

Before moving an issue from Triage to Ready, ensure ALL items below are complete.

### Requirements & Acceptance Criteria
- [ ] Title is specific and actionable
- [ ] Problem statement is clear and explains what needs to be done
- [ ] Acceptance criteria are defined with measurable outcomes
- [ ] Edge cases and error scenarios are documented
- [ ] Related issues/milestones are linked

### Dependencies
- [ ] All blocking issues are identified in the issue description
- [ ] Blocking issues status is documented (completed, in-progress, or not-critical)
- [ ] Required services/infrastructure are available
- [ ] Database schema or APIs are ready
- [ ] Third-party integrations are accessible

### Technical Approach
- [ ] Implementation strategy is defined (for service/feature issues)
- [ ] Architecture decisions are explained
- [ ] File paths for changes are identified
- [ ] Reference implementations or examples are linked
- [ ] Performance considerations are noted (if applicable)

### Approval & Test Plan
- [ ] Tech lead has reviewed and approved (see comment from tech lead below)
- [ ] Test strategy is documented (unit, integration, E2E)
- [ ] Test cases or scenarios are outlined
- [ ] Manual testing requirements are noted
- [ ] Acceptance test criteria match success metrics

### Labels & Metadata
- [ ] Priority is set (priority-high, priority-medium, or priority-low)
- [ ] Size is set (size: S, M, L, or XL)
- [ ] Milestone is assigned
- [ ] Domain label is added (frontend, backend, database, etc.)

---

## Tech Lead Approval

*This section is filled out by the tech lead during review*

**Tech Lead:** <!-- @mention tech lead -->
**Reviewed on:** <!-- YYYY-MM-DD -->

### Review Checklist
- [ ] Requirements & Acceptance Criteria are clear
- [ ] All dependencies are identified and resolved
- [ ] Technical approach is well-documented
- [ ] Estimate is reasonable for issue size
- [ ] Test plan is feasible

**Approval Status:** <!-- APPROVED / NEEDS MORE WORK / BLOCKED -->

**Notes:**
<!-- Add any notes, concerns, or suggestions here -->

---

## Additional Context

Use this section to provide any additional context that might be helpful:

- **Related PRs:**
- **Related Issues:**
- **Testing Environment:**
- **Performance Impact:**
- **Security Considerations:**

---

## Next Steps

Once this issue is marked as ready:
1. Tech lead will add `triage:approved` label
2. Issue will be moved to the "Ready" column on the project board
3. Issue will be available for team members to pick up in the next sprint
