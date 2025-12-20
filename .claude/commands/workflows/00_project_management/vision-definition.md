Define or refine the product vision and identify gaps between current state and goals:

[Extended thinking: This workflow manages the living vision document. It reviews existing vision, gathers user input on goals and priorities, defines success metrics, and identifies gaps that need to be addressed. The vision gaps feed into research and roadmap planning.]

**Review Existing Vision**
- Read `docs/planning/vision.md` if it exists
- Read recent audit from `docs/planning/audits/` for current state context
- Identify what has changed since last vision update

**Gather User Input**
Use AskUserQuestion tool to clarify:
1. "What are your top 3 priorities for this project right now?"
2. "Are there any new goals or features you want to add to the vision?"
3. "What constraints should we consider (time, budget, technical)?"
4. "What does success look like for the next milestone?"

**Define Success Metrics**
Based on user input, define measurable success criteria:
- User-facing metrics (features, UX improvements)
- Technical metrics (performance, coverage, reliability)
- Business metrics if applicable (integrations, automation)

**Gap Analysis with Enabler/Blocker Classification (Linear Method)**
Compare current state (from audit) with desired state (from user input).

For each gap, classify using the Linear Method framework:

| Classification | Question | Priority |
|----------------|----------|----------|
| **BLOCKER** | Does this prevent users from adopting/using the product? | Immediate |
| **HIGH ENABLER** | Does this significantly increase value? | This cycle |
| **LOW ENABLER** | Nice-to-have improvement? | Parking lot |

Examples:
- "No login flow" = BLOCKER (can't use product)
- "Real-time updates" = HIGH ENABLER (major value add)
- "Dark mode" = LOW ENABLER (workaround exists)

Gap categories to analyze:
- What features are missing?
- What technical improvements are needed?
- What integrations are not yet complete?

**Output Format**
Create or update `docs/planning/vision.md`:

```markdown
# Product Vision

## Mission Statement
[One sentence describing the project's purpose]

## Current Version Goals
**Target:** [version or milestone name]
**Timeframe:** [if known]

### Priority 1: [Goal Name]
- Description: ...
- Success Criteria: ...
- Current Status: [from audit]

### Priority 2: [Goal Name]
...

### Priority 3: [Goal Name]
...

## Success Metrics
| Metric | Target | Current |
|--------|--------|---------|
| ... | ... | ... |

## Constraints
- Time: ...
- Technical: ...
- Other: ...

## Vision Gaps
Areas requiring attention to achieve vision (sorted by classification):

### Gap 1: [Name]
- **Classification:** BLOCKER | HIGH ENABLER | LOW ENABLER
- Current State: ...
- Desired State: ...
- Research Needed: [yes/no]

### Gap 2: [Name]
- **Classification:** BLOCKER | HIGH ENABLER | LOW ENABLER
- Current State: ...
- Desired State: ...
- Research Needed: [yes/no]

## Future Considerations
[Items not in current scope but on the horizon]

---
*Last Updated: YYYY-MM-DD*
```

Update context with vision gaps for `/research` and `/roadmap` commands.
