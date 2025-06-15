# Vertical Farm Performance Test Report

**Generated:** Sat Jun 14 21:13:37 CDT 2025
**Test Environment:** Local Development

## Test Results Summary

### Backend Performance
- **URL:** http://localhost:8000
- **Status:** [0;34mChecking Backend availability...[0m
[0;32m✅ Backend is running[0m
✅ Running

### Frontend Performance  
- **URL:** http://localhost:3000
- **Status:** [0;34mChecking Frontend availability...[0m
[0;32m✅ Frontend is running[0m
✅ Running

### Key Metrics Measured
1. **API Response Times**
   - Average response time
   - P95 and P99 percentiles
   - Cache hit rates

2. **Cache Performance**
   - Cold vs warm cache performance
   - Cache warming effectiveness
   - ETag validation

3. **Concurrent Load**
   - Requests per second
   - Success rate under load
   - Response time distribution

### Files Generated
- `baseline_performance.json` - Detailed metrics
- `test_results.log` - Test execution log

## Next Steps

1. **Implement Cloudflare Workers** for caching optimization
2. **Run comparison tests** using:
   ```bash
   python tests/caching/test_cloudflare_performance.py --compare --production-url https://your-workers-url.com
   ```
3. **Analyze improvements** in response times and cache hit rates

