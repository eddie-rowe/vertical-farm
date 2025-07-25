# Production Testing Scripts

This directory contains production testing scripts designed to validate the three major performance features implemented in the vertical farm system:

1. **Supabase Caching (Supavisor)**
2. **HTTP Cache Headers** 
3. **Background Processing with Supabase Queues**

## Scripts Overview

### 1. `database-load-test.js` (k6 Load Testing)
Tests database performance and caching under realistic load conditions.

**Requirements:**
- k6 installed (`brew install k6` or download from k6.io)

**Usage:**
```bash
# Basic test with 50 virtual users for 5 minutes
k6 run --vus 50 --duration 5m database-load-test.js

# Custom environment
BASE_URL=https://your-production-url.com k6 run database-load-test.js
```

**What it tests:**
- Database connection performance
- Cache hit rates (targeting 80%+)
- Query response times (targeting <100ms)
- Real application endpoint performance

### 2. `background-queue-test.py` (Python Async Testing)
Tests background task processing, queue performance, and failure scenarios.

**Requirements:**
- Python 3.8+
- aiohttp (`pip install aiohttp`)

**Usage:**
```bash
# Run comprehensive background queue tests
python background-queue-test.py

# Test with custom base URL
BASE_URL=https://your-production-url.com python background-queue-test.py
```

**What it tests:**
- Real task processing (notifications, sensor data, reports)
- Queue depth monitoring
- Task failure scenarios
- Load burst handling (500 tasks simultaneously)
- Processing time metrics

### 3. `production-health-check.sh` (Continuous Monitoring)
Bash script for continuous production monitoring via cron.

**Requirements:**
- curl
- jq (`brew install jq`)

**Usage:**
```bash
# Manual run
./production-health-check.sh

# Set up cron for every 5 minutes
*/5 * * * * /path/to/production-health-check.sh

# With custom configuration
BASE_URL=https://your-production-url.com \
ALERT_WEBHOOK=https://hooks.slack.com/your-webhook \
./production-health-check.sh
```

**What it monitors:**
- Database connection and response times
- HTTP cache header validation
- Background queue statistics
- Home Assistant integration health
- Overall system status

## Environment Variables

All scripts support these environment variables:

- `BASE_URL`: Target server URL (default: `http://localhost:8000`)
- `ALERT_WEBHOOK`: Slack/Discord webhook for alerts (health check only)
- `LOG_FILE`: Log file path (health check only)

## Success Metrics

### Database Performance
- **Response Time**: <100ms for 95% of requests
- **Cache Hit Rate**: >80%
- **Error Rate**: <1%

### Background Processing
- **Queue Depth**: <100 pending tasks
- **Processing Time**: <30 seconds per task
- **Task Success Rate**: >99%

### HTTP Caching
- **Cache Headers**: Present on all cacheable endpoints
- **ETag Support**: Implemented for conditional requests
- **Cache Invalidation**: Working correctly

## Production Deployment

1. **Gradual Rollout**: Start with canary deployment (10% traffic)
2. **Blue-Green Testing**: Full validation before production switch
3. **Continuous Monitoring**: Health checks every 5 minutes
4. **Automated Alerts**: Webhook notifications for issues

## Troubleshooting

### Common Issues

**k6 test fails with connection errors:**
- Verify BASE_URL is correct
- Check if server is running and accessible
- Ensure firewall allows connections

**Python test shows import errors:**
- Install required packages: `pip install aiohttp`
- Check Python version (3.8+ required)

**Health check script fails:**
- Verify jq is installed: `brew install jq`
- Check curl is available
- Ensure script has execute permissions: `chmod +x production-health-check.sh`

### Logs and Debugging

- k6 results: `database-load-test-results.json`
- Python test output: Console with detailed metrics
- Health check logs: `/var/log/vertical-farm/health-check.log` (configurable)

## Integration with CI/CD

These scripts can be integrated into your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Run Production Tests
  run: |
    k6 run --vus 10 --duration 2m backend/app/tests/production_tests/database-load-test.js
    python backend/app/tests/production_tests/background-queue-test.py
    bash backend/app/tests/production_tests/production-health-check.sh
```

## Next Steps

1. Set up monitoring dashboards (Grafana/DataDog)
2. Implement chaos engineering tests
3. Add performance regression testing
4. Create automated rollback triggers 