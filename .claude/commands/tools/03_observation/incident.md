# /incident - Incident Response

Start or continue a structured incident response workflow, documenting the incident timeline and coordinating resolution.

## Usage
```
/incident <id>
/incident new
```

## Examples
```
/incident new
/incident INC-001
/incident 42
```

## Execution

When invoked with `/incident <id>`, execute these steps:

### For New Incidents (`/incident new`)

1. **Initialize Incident**
   **Output:**
   ```
   🚨 Starting new incident...
   📋 Initializing incident documentation
   ```

2. **Gather Initial Information**
   ```
   # Prompt for initial details
   # - What triggered this incident?
   # - What services are affected?
   # - What is the user impact?
   # - When did it start?
   ```
   **Output:**
   ```
   📝 Incident Details Required:

   Please provide:
   1. Trigger: What alerted you to this issue?
   2. Services: Which services are affected?
   3. Impact: What are users experiencing?
   4. Start time: When did this begin (approx)?
   ```

3. **Classify Severity**
   ```
   # SEV1: Complete outage, all users affected
   # SEV2: Major degradation, many users affected
   # SEV3: Minor issue, some users affected
   # SEV4: Low impact, workaround available
   ```
   **Output:**
   ```
   🎚️ Severity Classification:

   Based on impact assessment:
   - Services affected: {count}
   - Users impacted: {estimate}
   - Revenue impact: {yes/no}

   Recommended Severity: SEV{level}

   [Confirm or adjust severity]
   ```

4. **Create Incident Document**
   ```
   # Generate incident ID
   DATE=$(date +%Y%m%d)
   ID="INC-${DATE}-{sequence}"

   # Create document at docs/observation/incidents/INC-{id}.md
   ```
   **Output:**
   ```
   📁 Incident Created: INC-{id}
   📄 Document: docs/observation/incidents/INC-{id}.md

   Timeline Started:
   | Time | Event |
   |------|-------|
   | {now} | Incident declared |
   ```

5. **Initial Response Actions**
   ```
   # Check current system status
   # Identify potential causes
   # List immediate actions to take
   ```
   **Output:**
   ```
   🔍 Initial Assessment:

   Current Status:
   - API: {status}
   - Database: {status}
   - Frontend: {status}

   Potential Causes:
   - {cause_1}
   - {cause_2}

   Recommended Immediate Actions:
   1. {action_1}
   2. {action_2}
   ```

### For Existing Incidents (`/incident <id>`)

1. **Load Incident**
   ```
   # Read existing incident document
   # Display current status and timeline
   ```
   **Output:**
   ```
   🚨 Loading Incident: INC-{id}

   Status: ACTIVE
   Severity: SEV{level}
   Duration: {time since start}

   Current Timeline:
   | Time | Event |
   |------|-------|
   | ... | ... |
   ```

2. **Update Options**
   **Output:**
   ```
   📋 Incident Actions:

   1. Add timeline entry
   2. Update status
   3. Record root cause
   4. Add resolution step
   5. Close incident
   6. Generate postmortem

   What would you like to do?
   ```

3. **Complete Update**
   ```
   # Save changes to incident document
   # Update context
   ```

## Incident Document Template

```markdown
# INC-{id}: {Brief Title}

## Summary
- **Severity**: SEV{level}
- **Status**: Active/Mitigated/Resolved
- **Duration**: {start} → {end or "ongoing"}
- **Impact**: {user-facing description}

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident declared |
| HH:MM | {event} |
| HH:MM | {event} |

## Affected Services
- [ ] API
- [ ] Frontend
- [ ] Database
- [ ] Edge Functions
- [ ] Integrations

## Impact Assessment
- Users affected: {count or estimate}
- Revenue impact: {yes/no, amount if known}
- SLO impact: {which SLOs breached}

## Root Cause
{Description of root cause once identified}

## Resolution Steps
1. {step taken}
2. {step taken}
3. {step taken}

## Action Items
- [ ] {immediate action}
- [ ] {follow-up action}
- [ ] Create postmortem

## Communication
- [ ] Internal notification sent
- [ ] Status page updated
- [ ] Customer communication sent

---
*Last updated: YYYY-MM-DD HH:MM*
*Incident commander: {name}*
```

## Severity Levels

| Level | Criteria | Response Time |
|-------|----------|---------------|
| SEV1 | Complete outage, all users | Immediate |
| SEV2 | Major degradation, many users | < 15 min |
| SEV3 | Partial issue, some users | < 1 hour |
| SEV4 | Minor issue, workaround exists | < 4 hours |

## Incident Lifecycle

```
New → Active → Mitigated → Resolved → Postmortem
```

1. **New**: Incident declared, assessment starting
2. **Active**: Investigation and mitigation in progress
3. **Mitigated**: Impact reduced, root cause may not be fixed
4. **Resolved**: Issue fully resolved, services normal
5. **Postmortem**: Post-incident review completed

## Integration

### Related Commands
- `/status` - Check system health during incident
- `/metrics` - Analyze metrics for root cause
- `/postmortem` - Generate postmortem after resolution

### Feeds Into
- `/postmortem` - Creates detailed analysis
- `/digest` - Incidents summarized in weekly report

## Output Location

`docs/observation/incidents/INC-{id}.md`

## Context Updates

Updates `.claude/context/simple-context.yaml`:
```yaml
observation_phase: incident
observation_context:
  active_incidents: 1
  current_incident: "INC-20251222-001"
  incident_severity: 2
  incident_status: "active"
```
