# /metrics - Trend Analysis

Analyze performance trends with anomaly detection, comparing current metrics against statistical baselines.

## Usage
```
/metrics [scope]
```

## Examples
```
/metrics
/metrics api
/metrics frontend
/metrics database
/metrics edge-functions
```

## Execution

When invoked with `/metrics [scope]`, execute these steps:

1. **Parse Parameters**
   ```
   # Default scope: all
   # Valid scopes: all, api, frontend, database, edge-functions
   ```

2. **Begin Metrics Analysis**
   **Output:**
   ```
   📊 Analyzing metrics trends...
   🔬 Scope: {scope}
   📅 Comparing: This week vs. 4-week baseline
   ```

3. **Gather Baseline Data**
   ```
   # Calculate 4-week rolling averages for each metric
   # Calculate standard deviation for anomaly detection
   # Threshold: Flag changes > 2 standard deviations
   ```

4. **Analyze API Metrics** (if scope includes API)
   ```
   # Latency percentiles (p50, p95, p99)
   # Throughput (requests/sec)
   # Error rates by endpoint
   # Response size trends
   ```
   **Output:**
   ```
   🔌 API Metrics:

   Latency (ms):
   | Percentile | Current | Baseline | Change | Status |
   |------------|---------|----------|--------|--------|
   | p50 | 45 | 42 | +7% | ✅ |
   | p95 | 180 | 165 | +9% | ✅ |
   | p99 | 350 | 280 | +25% | ⚠️ |

   Throughput: 125 req/s (baseline: 110 req/s) ↑ +14%
   Error Rate: 0.02% (baseline: 0.05%) ✅ -60%

   Top Endpoints by Latency:
   | Endpoint | p95 | Trend |
   |----------|-----|-------|
   | GET /api/farms | 95ms | → |
   | GET /api/devices | 145ms | ↑ |
   | POST /api/readings | 210ms | ↑ |
   ```

5. **Analyze Frontend Metrics** (if scope includes frontend)
   ```
   # Core Web Vitals (LCP, FID, CLS)
   # Page load times
   # Bundle sizes
   # JavaScript errors
   ```
   **Output:**
   ```
   🖥️ Frontend Metrics:

   Core Web Vitals:
   | Metric | Current | Target | Status |
   |--------|---------|--------|--------|
   | LCP | 1.8s | <2.5s | ✅ |
   | FID | 45ms | <100ms | ✅ |
   | CLS | 0.08 | <0.1 | ✅ |

   Page Performance:
   | Page | Load Time | Trend |
   |------|-----------|-------|
   | /dashboard | 1.2s | → |
   | /farms | 1.8s | ↓ |
   | /devices | 2.1s | ↓ |

   Bundle Size: 245KB (baseline: 240KB) +2%
   JS Errors: 0.1% sessions (baseline: 0.12%) ✅
   ```

6. **Analyze Database Metrics** (if scope includes database)
   ```
   # Query latency by type
   # Connection pool utilization
   # Cache hit rates
   # RLS policy performance
   ```
   **Output:**
   ```
   🗄️ Database Metrics:

   Query Performance (p95):
   | Query Type | Current | Baseline | Change |
   |------------|---------|----------|--------|
   | SELECT | 12ms | 10ms | +20% | ✅ |
   | INSERT | 8ms | 7ms | +14% | ✅ |
   | UPDATE | 15ms | 12ms | +25% | ⚠️ |
   | RLS Check | 3ms | 2ms | +50% | ⚠️ |

   Connection Pool: 15/100 (15%)
   Cache Hit Rate: 94% (baseline: 92%) ✅
   Slow Queries (>100ms): 3 this week
   ```

7. **Analyze Edge Function Metrics** (if scope includes edge-functions)
   ```
   # Execution time
   # Cold start frequency
   # Error rates by function
   # Invocation counts
   ```
   **Output:**
   ```
   ⚡ Edge Function Metrics:

   Execution Time (p95):
   | Function | Current | Baseline | Change |
   |----------|---------|----------|--------|
   | auth-callback | 120ms | 100ms | +20% | ✅ |
   | device-sync | 450ms | 300ms | +50% | ⚠️ |
   | notification | 85ms | 80ms | +6% | ✅ |

   Cold Starts: 12% of invocations (baseline: 10%)
   Error Rate: 0.5% (baseline: 0.2%) ⚠️
   Total Invocations: 15,420 this week (+8%)
   ```

8. **Anomaly Detection**
   ```
   # Flag metrics with > 2σ deviation
   # Correlate anomalies across services
   # Identify potential root causes
   ```
   **Output:**
   ```
   🔍 Anomaly Detection:

   Significant Deviations (>2σ):
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️ API p99 latency: +25% (threshold: ±15%)                 │
   │    Correlation: Increased POST /api/readings volume        │
   │    Recommendation: Review batch processing strategy        │
   ├─────────────────────────────────────────────────────────────┤
   │ ⚠️ Edge function device-sync: +50% execution time          │
   │    Correlation: New device registrations spike             │
   │    Recommendation: Investigate sync logic                  │
   └─────────────────────────────────────────────────────────────┘
   ```

9. **Complete Metrics Analysis**
   **Output:**
   ```
   ═══════════════════════════════════════════════════════════════
   📊 Metrics Summary
   ═══════════════════════════════════════════════════════════════

   Scope: {scope}
   Period: {date range}
   Anomalies Detected: 2

   Key Findings:
     ✅ Overall system performance stable
     ⚠️ API p99 latency trending up
     ⚠️ Edge function device-sync degraded

   💡 Next steps:
      • '/slo' - Check if anomalies affect SLOs
      • '/ux' - See user impact of performance changes
      • '/digest' - Include in weekly report
   ═══════════════════════════════════════════════════════════════
   ```

## Scope Options

| Scope | Metrics Analyzed |
|-------|------------------|
| `all` | Complete analysis across all services |
| `api` | Backend API latency, throughput, errors |
| `frontend` | Core Web Vitals, page performance, bundle size |
| `database` | Query performance, connections, cache |
| `edge-functions` | Execution time, cold starts, errors |

## Statistical Methods

### Baseline Calculation
- 4-week rolling average for trend comparison
- Standard deviation calculated over same period
- Weekday vs. weekend patterns considered

### Anomaly Detection
- Flag metrics with > 2 standard deviations from baseline
- Correlate anomalies across services
- Consider seasonal patterns (time of day, day of week)

## Data Sources

- Datadog APM for latency and throughput
- RUM for frontend metrics
- Database metrics from Supabase
- Edge function logs

## Integration

### Related Commands
- `/status` - Quick health check
- `/slo` - SLO impact of metric changes
- `/ux` - User experience correlation
- `/digest` - Weekly summary

## Context Updates

Updates `.claude/context/simple-context.yaml`:
```yaml
observation_phase: metrics
observation_context:
  metrics_scope: "all"
  anomalies_detected: 2
  trending_up: ["api_throughput"]
  trending_down: ["edge_function_performance"]
  last_metrics_check: "YYYY-MM-DD HH:MM"
```
