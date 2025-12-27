# /ux - User Experience Analysis

Analyze user experience patterns from Real User Monitoring (RUM) data, including journey completion, friction points, and feature adoption.

## Usage
```
/ux
```

## Examples
```
/ux
```

## Execution

When invoked with `/ux`, execute these steps:

1. **Begin UX Analysis**
   **Output:**
   ```
   👤 Analyzing user experience...
   📊 Gathering RUM data from the past 7 days
   ```

2. **Gather Session Metrics**
   ```
   # Query RUM for session data
   # Total sessions, unique users
   # Session duration distribution
   # Bounce rates by page
   ```
   **Output:**
   ```
   📊 Session Overview (7 days):

   Total Sessions: 1,245
   Unique Users: 342
   Avg Session Duration: 8m 32s
   Bounce Rate: 12%

   Session Distribution:
   | Duration | Sessions | % |
   |----------|----------|---|
   | < 1 min | 156 | 12.5% |
   | 1-5 min | 423 | 34.0% |
   | 5-15 min | 498 | 40.0% |
   | > 15 min | 168 | 13.5% |
   ```

3. **Analyze Core Web Vitals**
   ```
   # LCP (Largest Contentful Paint)
   # FID (First Input Delay)
   # CLS (Cumulative Layout Shift)
   # Compare to thresholds and trends
   ```
   **Output:**
   ```
   🎯 Core Web Vitals:

   | Metric | Value | Target | Status | Trend |
   |--------|-------|--------|--------|-------|
   | LCP | 1.8s | <2.5s | ✅ Good | → |
   | FID | 45ms | <100ms | ✅ Good | ↑ |
   | CLS | 0.08 | <0.1 | ✅ Good | → |

   Pass Rate: 85% of sessions meet all thresholds
   ```

4. **Identify User Journeys**
   ```
   # Track common user paths
   # Identify drop-off points
   # Calculate completion rates
   ```
   **Output:**
   ```
   🛤️ User Journeys:

   Top Journeys:
   | Journey | Sessions | Completion |
   |---------|----------|------------|
   | Login → Dashboard → Farms | 456 | 78% |
   | Dashboard → Devices → Config | 234 | 65% |
   | Farms → Add Device | 189 | 52% |
   | Settings → Integrations | 145 | 88% |

   Drop-off Points:
   | Step | Drop-off Rate |
   |------|---------------|
   | Add Device form | 48% |
   | Farm configuration | 35% |
   | Integration setup | 12% |
   ```

5. **Analyze Friction Points**
   ```
   # Rage clicks (rapid repeated clicks)
   # Error encounters
   # Long wait times
   # Form abandonment
   ```
   **Output:**
   ```
   ⚠️ Friction Points:

   Top Issues by Impact:
   ┌─────────────────────────────────────────────────────────────┐
   │ 1. Add Device Form (48% abandonment)                       │
   │    - Rage clicks: 23 sessions                              │
   │    - Avg time on form: 4m 12s (expected: 1m)               │
   │    - Common exit: Device type selection                    │
   ├─────────────────────────────────────────────────────────────┤
   │ 2. Farm Dashboard Loading (slow on mobile)                 │
   │    - Mobile LCP: 3.2s (target: 2.5s)                       │
   │    - Sessions affected: 156                                │
   ├─────────────────────────────────────────────────────────────┤
   │ 3. Settings Save (errors)                                  │
   │    - Error rate: 2.3%                                      │
   │    - Sessions affected: 28                                 │
   └─────────────────────────────────────────────────────────────┘
   ```

6. **Analyze Feature Adoption**
   ```
   # Track feature usage rates
   # Compare to launch expectations
   # Identify underutilized features
   ```
   **Output:**
   ```
   🚀 Feature Adoption:

   | Feature | Users | % of Active | Trend |
   |---------|-------|-------------|-------|
   | Dashboard | 340 | 99% | → |
   | Device Management | 289 | 85% | → |
   | Farm Visualization | 245 | 72% | ↑ |
   | Grow Recipes | 134 | 39% | ↑ |
   | Automation Rules | 89 | 26% | → |
   | Square Integration | 45 | 13% | → |
   | Home Assistant | 67 | 20% | ↑ |

   New Feature Adoption (last 30 days):
   - Grow Recipes: +12% adoption
   - Home Assistant: +8% adoption
   ```

7. **Analyze Error Impact**
   ```
   # JavaScript errors by page
   # API errors visible to users
   # Error recovery rates
   ```
   **Output:**
   ```
   ❌ Error Impact:

   Sessions with Errors: 3.2% (target: <2%)

   Top Errors by User Impact:
   | Error | Sessions | Recovery |
   |-------|----------|----------|
   | API timeout on /devices | 28 | 65% retry |
   | Form validation error | 45 | 90% fixed |
   | Chart rendering failure | 12 | 0% (left) |

   Error by Page:
   | Page | Error Rate | Trend |
   |------|------------|-------|
   | /devices | 1.8% | ↑ |
   | /farms | 0.5% | → |
   | /dashboard | 0.2% | → |
   ```

8. **Device & Geographic Analysis**
   ```
   # Performance by device type
   # Geographic distribution
   # Browser breakdown
   ```
   **Output:**
   ```
   📱 Device Breakdown:

   | Device | Sessions | Avg LCP | Error Rate |
   |--------|----------|---------|------------|
   | Desktop | 65% | 1.5s | 0.8% |
   | Mobile | 30% | 2.8s | 1.5% |
   | Tablet | 5% | 2.1s | 1.0% |

   ⚠️ Mobile performance below target (LCP > 2.5s)
   ```

9. **Complete UX Analysis**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   👤 UX Analysis Summary
   ═══════════════════════════════════════════════════════════════

   Overall UX Score: 7.2/10

   Key Findings:
     ✅ Core Web Vitals passing for 85% of sessions
     ✅ Feature adoption trending up for key features
     ⚠️ Add Device form has high abandonment (48%)
     ⚠️ Mobile performance needs improvement
     ⚠️ Error rate above target (3.2% vs 2%)

   Priority Recommendations:
     1. Simplify Add Device form flow
     2. Optimize Farm Dashboard for mobile
     3. Investigate /devices API timeouts

   💡 Next steps:
      • '/metrics frontend' - Deep dive frontend performance
      • '/slo frontend' - Check frontend SLO impact
      • '/digest' - Include in weekly report
   ═══════════════════════════════════════════════════════════════
   ```

## Metrics Tracked

### Session Metrics
- Total sessions and unique users
- Session duration distribution
- Bounce rates by page
- Return visit rates

### Core Web Vitals
- LCP (Largest Contentful Paint) - target: <2.5s
- FID (First Input Delay) - target: <100ms
- CLS (Cumulative Layout Shift) - target: <0.1

### User Journeys
- Common paths through the application
- Completion rates for key flows
- Drop-off analysis

### Friction Points
- Rage clicks (rapid repeated clicks)
- Form abandonment rates
- Error encounters
- Long wait times

### Feature Adoption
- Feature usage by percentage of users
- Adoption trends over time
- New feature uptake

## Data Sources

- Datadog RUM (Real User Monitoring)
- Session replay data
- Error tracking
- Custom event tracking

## Integration

### Related Commands
- `/metrics frontend` - Deep dive into frontend metrics
- `/slo frontend` - Check frontend SLO compliance
- `/digest` - Include UX insights in weekly report

## Context Updates

Updates `.claude/context/simple-context.yaml`:
```yaml
observation_phase: ux
observation_context:
  session_error_rate: 3.2
  journey_completion_avg: 71
  cwv_pass_rate: 85
  top_friction_points: ["add-device-form", "mobile-dashboard"]
  last_ux_analysis: "YYYY-MM-DD HH:MM"
```
