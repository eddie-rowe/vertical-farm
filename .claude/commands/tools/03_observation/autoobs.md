# /autoobs - Autonomous Observation Sweep

Run a complete observation workflow automatically, executing all monitoring commands and generating a comprehensive weekly digest.

## Usage
```
/autoobs
```

## Examples
```
/autoobs
```

## Execution

When invoked with `/autoobs`, execute these steps sequentially:

1. **Begin Autonomous Sweep**
   **Output:**
   ```
   🤖 Starting autonomous observation sweep...
   📊 This will run: status → slo → metrics → ux → digest

   Estimated time: 5-10 minutes
   ```

2. **Execute /status**
   ```
   # Run full status check
   # See status.md for details
   ```
   **Output:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [1/5] Running /status...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 Overall Status: {GREEN/YELLOW/RED}
   Services: {healthy}/{total}
   Alerts: {count}

   ✅ Status check complete
   ```

3. **Execute /slo**
   ```
   # Run SLO compliance check
   # See slo.md for details
   ```
   **Output:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [2/5] Running /slo...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🎯 SLO Status:
   Services in budget: {count}/{total}
   Error budget remaining: {percentage}%
   At-risk: {list or "None"}

   ✅ SLO check complete
   ```

4. **Execute /metrics**
   ```
   # Run full metrics analysis (scope: all)
   # See metrics.md for details
   ```
   **Output:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [3/5] Running /metrics...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📈 Metrics Summary:
   Anomalies detected: {count}
   Trending up: {list}
   Trending down: {list}

   ✅ Metrics analysis complete
   ```

5. **Execute /ux**
   ```
   # Run UX analysis
   # See ux.md for details
   ```
   **Output:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [4/5] Running /ux...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 UX Summary:
   Session error rate: {percentage}%
   Journey completion: {percentage}%
   Core Web Vitals: {PASS/FAIL}
   Friction points: {count}

   ✅ UX analysis complete
   ```

6. **Execute /digest**
   ```
   # Generate weekly digest from all collected data
   # See digest.md for details
   ```
   **Output:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [5/5] Running /digest...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📝 Generating weekly digest...
   Aggregating status, SLO, metrics, and UX data...

   ✅ Digest generated
   ```

7. **Complete Sweep**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   🤖 Autonomous Observation Sweep Complete
   ═══════════════════════════════════════════════════════════════

   Summary:
   ┌────────────────────────────────────────────────────────────┐
   │ System Status:     {GREEN/YELLOW/RED}                     │
   │ SLO Compliance:    {count}/{total} services in budget     │
   │ Anomalies:         {count} detected                       │
   │ UX Score:          {score}/10                             │
   │ Incidents:         {count} this week                      │
   └────────────────────────────────────────────────────────────┘

   Reports Generated:
   📁 docs/observation/digests/{date}.md

   Key Findings:
   {If any issues:}
   ⚠️ {finding_1}
   ⚠️ {finding_2}
   {If healthy:}
   ✅ All systems operating normally

   Recommended Actions:
   - {action_1}
   - {action_2}

   💡 Next steps:
      • '/audit' - Run PM audit with observation insights
      • Review digest: docs/observation/digests/{date}.md
   ═══════════════════════════════════════════════════════════════
   ```

## Error Handling

If any command fails during the sweep:

```
⚠️ /slo encountered an error:
   {error description}

   Options:
   1. Skip and continue with remaining commands
   2. Retry /slo
   3. Abort sweep

   [Default: Skip and continue]
```

The sweep continues with remaining commands unless a critical error occurs.

## Scheduling

While `/autoobs` is manual, it's designed for weekly execution:

**Recommended Schedule:**
- Run every Monday morning
- Before weekly team sync
- After weekend traffic patterns

**Integration with External Schedulers:**
```bash
# Example cron job (not automated, just reference)
# 0 8 * * 1 claude-code /autoobs
```

## Command Flow

```
/autoobs
    │
    ├──► /status    → System health snapshot
    │
    ├──► /slo       → Error budget check
    │
    ├──► /metrics   → Trend analysis
    │
    ├──► /ux        → User experience
    │
    └──► /digest    → Weekly synthesis
              │
              └──► docs/observation/digests/YYYY-MM-DD.md
                          │
                          └──► PM Loop: /audit reads digest
```

## Context Flow

Each command updates context, and `/autoobs` orchestrates the flow:

1. `/status` → Sets `system_status`, `services_healthy`
2. `/slo` → Sets `slo_services_in_budget`, `error_budget_remaining`
3. `/metrics` → Sets `anomalies_detected`, `trending_up/down`
4. `/ux` → Sets `session_error_rate`, `friction_points`
5. `/digest` → Aggregates all context, creates digest

## Integration

### Feeds Into
- PM Loop's `/audit` command reads the generated digest
- Weekly team meetings can use digest as input

### Related Commands
- Individual commands can be run separately for deeper analysis
- `/incident` runs separately for active issues

## Output Locations

- Digest: `docs/observation/digests/YYYY-MM-DD.md`
- Context: `.claude/context/simple-context.yaml`

## Context Updates

After completion, `.claude/context/simple-context.yaml` contains:

```yaml
observation_phase: complete
observation_context:
  last_sweep: "YYYY-MM-DD HH:MM"
  system_status: "green"
  slo_services_in_budget: 4
  slo_services_total: 4
  anomalies_detected: 2
  session_error_rate: 2.1
  friction_points: 3
  last_digest: "YYYY-MM-DD"
  sweep_duration_seconds: 180
```
