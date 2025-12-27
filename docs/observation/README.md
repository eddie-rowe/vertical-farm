# Observation Documentation

This directory contains outputs from the Observation Loop, which monitors production systems and generates insights for the PM Loop.

## Directory Structure

```
docs/observation/
├── README.md           # This file
├── digests/            # Weekly synthesis reports
├── incidents/          # Incident documentation
└── postmortems/        # Postmortem analyses
```

## Digest Reports

Weekly observation digests (`digests/YYYY-MM-DD.md`) synthesize production data into actionable insights:

### Report Structure

```markdown
# Observation Digest: Week of YYYY-MM-DD

## System Health Summary
- Overall: GREEN/YELLOW/RED
- SLO status: X of Y services within budget
- Error budget burn: N% consumed

## Trends Requiring Attention
1. [Category] Description with WoW change
2. ...

## User Experience Insights
- Top friction points
- Feature usage patterns
- Error rates by journey

## Recommended Actions (for PM review)
- Consider: Action 1
- Consider: Action 2

## Metrics Appendix
[Detailed data tables]
```

### How Digests Feed PM Loop

The `/audit` command in the PM Loop reads recent digests to inform planning:

```
Observation: /digest creates docs/observation/digests/2025-12-22.md
    │
    ▼
PM Loop: /audit reads latest digests
    │
    ▼
/vision and /roadmap informed by production insights
```

## Incident Documentation

Incident reports (`incidents/INC-{id}.md`) document production issues:

### Incident Template

```markdown
# INC-{id}: Brief Title

## Summary
- **Severity**: SEV1/SEV2/SEV3
- **Status**: Active/Resolved
- **Duration**: Start time → End time
- **Impact**: User-facing description

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Alert triggered |
| HH:MM | Response began |
| ... | ... |

## Root Cause
[Brief description of what went wrong]

## Resolution
[What was done to fix it]

## Action Items
- [ ] Preventive measure 1
- [ ] Preventive measure 2
```

## Postmortem Analyses

Postmortem documents (`postmortems/PM-{id}.md`) provide detailed incident analysis:

### Postmortem Template

```markdown
# Postmortem: INC-{id} - Title

## Incident Overview
- **Date**: YYYY-MM-DD
- **Duration**: X hours Y minutes
- **Severity**: SEV1/SEV2/SEV3
- **Author**: Name
- **Reviewed**: YYYY-MM-DD

## Summary
One paragraph description of what happened.

## Impact
- Users affected: N
- Revenue impact: $X
- SLO budget consumed: N%

## Timeline
Detailed timeline with UTC timestamps.

## Root Cause Analysis
### 5 Whys
1. Why? → Answer
2. Why? → Answer
...

### Contributing Factors
- Factor 1
- Factor 2

## Detection
- How was the issue detected?
- Was alerting effective?
- Detection time: N minutes

## Response
- Response time: N minutes
- Was runbook followed?
- What worked well?
- What could be improved?

## Resolution
Step-by-step description of the fix.

## Action Items
| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| P1 | Preventive action | Name | Date | Open |
| P2 | Improvement | Name | Date | Open |

## Lessons Learned
Key takeaways for the team.

## Related Incidents
Links to similar past incidents.
```

## Data Retention

| Document Type | Retention | Notes |
|--------------|-----------|-------|
| Digests | 12 months | Archive after 1 year |
| Incidents | 24 months | Required for trend analysis |
| Postmortems | Indefinite | Permanent learning record |

## Generating Documents

Documents are created by the observation loop commands:

| Command | Creates |
|---------|---------|
| `/digest` | `digests/YYYY-MM-DD.md` |
| `/incident <id>` | `incidents/INC-{id}.md` |
| `/postmortem <id>` | `postmortems/PM-{id}.md` |

## Integration with Other Systems

### Datadog
- Metrics and logs feed into digests
- Alerts trigger incident documentation
- RUM data informs UX sections

### GitHub
- Incidents may generate GitHub issues
- Postmortem action items become issues
- Digest recommendations inform roadmap

### PM Loop
- `/audit` reads recent digests
- Trends inform `/vision` priorities
- Action items may become `/issues`
