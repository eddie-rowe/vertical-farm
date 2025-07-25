# Tests Directory

This directory contains all test files organized by category for better maintainability and clarity.

## Directory Structure

```
tests/
├── auth/                    # Authentication & authorization tests
│   └── test-auth-permissions.js
├── caching/                 # Cache implementation tests
│   ├── test_caching.py
│   └── test_cloudflare_performance.py  # NEW: Cloudflare Workers performance testing
├── integration/             # Integration & end-to-end tests
│   ├── test_integration_features.py
│   └── test-realtime-subscriptions.js
├── iot/                     # IoT device integration tests
│   └── test-iot-integration.js
├── queues/                  # Queue system tests
│   ├── test_supabase_queues.js
│   ├── queue_integration_example.js
│   └── test_queue_system.sql
├── results/                 # Test results and performance reports
└── scripts/                 # Test runner scripts
    ├── run-all-tests.js
    ├── run_performance_tests.sh  # NEW: Performance testing suite
    ├── manual_test_features.sh
    └── run_integration_tests.sh
```

## Running Tests

### All Tests
```bash
# Run all tests using the main test runner
node tests/scripts/run-all-tests.js
```

### 🚀 Performance Testing (NEW)

#### Baseline Performance Tests (Before Cloudflare Workers)
```bash
# Run comprehensive performance baseline
bash tests/scripts/run_performance_tests.sh baseline

# Or run the Python script directly
python tests/caching/test_cloudflare_performance.py --baseline
```

#### Production Performance Tests (After Cloudflare Workers)
```bash
# Test production performance with Cloudflare Workers
bash tests/scripts/run_performance_tests.sh production https://your-workers-url.com

# Or run comparison tests
bash tests/scripts/run_performance_tests.sh compare https://your-workers-url.com
```

#### Performance Metrics Measured
- **API Response Times**: Average, P95, P99 percentiles
- **Cache Hit Rates**: Cloudflare cache effectiveness
- **Cache Warming**: Cold vs warm cache performance
- **Concurrent Load**: Requests per second under load
- **Error Rates**: Success rates and error handling

### Category-Specific Tests

#### Caching Tests
```bash
# Test the three-layer caching implementation
python tests/caching/test_caching.py

# Test Cloudflare Workers performance impact
python tests/caching/test_cloudflare_performance.py --baseline
```

#### Authentication Tests
```bash
# Test auth permissions and security
node tests/auth/test-auth-permissions.js
```

#### IoT Integration Tests
```bash
# Test IoT device connectivity and control
node tests/iot/test-iot-integration.js
```

#### Queue System Tests
```bash
# Test Supabase queue functionality
node tests/queues/test_supabase_queues.js

# Run SQL queue tests
psql -f tests/queues/test_queue_system.sql
```

#### Integration Tests
```bash
# Run comprehensive integration tests
python tests/integration/test_integration_features.py

# Test realtime subscriptions
node tests/integration/test-realtime-subscriptions.js

# Run integration test suite
bash tests/scripts/run_integration_tests.sh
```

### Manual Testing
```bash
# Run manual feature tests
bash tests/scripts/manual_test_features.sh
```

## Test Categories

### 🔐 Authentication Tests (`auth/`)
- User authentication flows
- Permission validation
- Role-based access control
- JWT token handling

### ⚡ Caching Tests (`caching/`)
- Frontend cache validation
- Backend middleware testing
- Cloudflare CDN integration
- Cache invalidation strategies
- **NEW**: Cloudflare Workers performance measurement

### 🔗 Integration Tests (`integration/`)
- End-to-end user workflows
- API integration testing
- Real-time subscription validation
- Cross-service communication

### 🌐 IoT Tests (`iot/`)
- Device connectivity
- Sensor data validation
- Control system testing
- Home Assistant integration

### 📋 Queue Tests (`queues/`)
- Background job processing
- Queue reliability testing
- Message handling validation
- Supabase queue integration

### 📊 Performance Tests (`results/`)
- Baseline performance metrics
- Production performance comparison
- Automated performance reports
- Historical performance tracking

## Prerequisites

### Python Tests
```bash
pip install -r backend/requirements.txt
pip install aiohttp requests  # For performance tests
```

### Node.js Tests
```bash
npm install
```

### Environment Setup
Ensure the following environment variables are set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

## Performance Testing Workflow

### 1. Establish Baseline
```bash
# Start your backend and frontend
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
cd frontend && npm run dev &

# Run baseline performance tests
bash tests/scripts/run_performance_tests.sh baseline
```

### 2. Implement Cloudflare Workers
- Deploy your Cloudflare Workers for caching
- Configure your production domain

### 3. Measure Improvements
```bash
# Run comparison tests
bash tests/scripts/run_performance_tests.sh compare https://your-production-url.com
```

### 4. Analyze Results
- Check `tests/results/` for detailed JSON reports
- Review generated performance reports
- Compare baseline vs production metrics

## Test Data

Test files use mock data and test databases to avoid affecting production data. Each test category includes setup and teardown procedures to maintain test isolation.

## Contributing

When adding new tests:
1. Place them in the appropriate category directory
2. Follow existing naming conventions
3. Include setup/teardown procedures
4. Update this README if adding new categories
5. Ensure tests can run independently

## Troubleshooting

### Common Issues
- **Connection errors**: Verify environment variables are set
- **Permission errors**: Check Supabase RLS policies for test users
- **Timeout errors**: Increase timeout values for slow network conditions
- **Performance test failures**: Ensure backend/frontend are running locally

### Debug Mode
Most test scripts support a debug flag:
```bash
node tests/scripts/run-all-tests.js --debug
python tests/caching/test_caching.py --verbose
python tests/caching/test_cloudflare_performance.py --baseline --verbose
```

### Performance Testing Tips
- Run baseline tests multiple times for consistent results
- Ensure stable network conditions during testing
- Close unnecessary applications to avoid resource contention
- Use production-like data volumes for realistic results 