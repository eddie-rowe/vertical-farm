// k6 Load Test for Database Performance with Supavisor
// Run with: k6 run --vus 50 --duration 5m database-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const dbResponseTime = new Trend('db_response_time');
const cacheHitRate = new Rate('cache_hit_rate');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    db_response_time: ['p(95)<100'],  // 95% of DB queries under 100ms
    cache_hit_rate: ['rate>0.8'],    // 80% cache hit rate
    error_rate: ['rate<0.01'],       // Less than 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // Test 1: Database connection with caching
  const dbConnResponse = http.get(`${BASE_URL}/api/v1/test/db-connection`);
  
  check(dbConnResponse, {
    'DB connection status is 200': (r) => r.status === 200,
    'DB connection has cache headers': (r) => r.headers['Cache-Control'] !== undefined,
    'DB connection response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  dbResponseTime.add(dbConnResponse.timings.duration);
  errorRate.add(dbConnResponse.status !== 200);
  
  // Check if response was cached (ETag indicates caching)
  const isCached = dbConnResponse.headers['ETag'] !== undefined;
  cacheHitRate.add(isCached);
  
  // Test 2: Database query performance
  const queryResponse = http.get(`${BASE_URL}/api/v1/test/db-query`);
  
  check(queryResponse, {
    'Query status is 200': (r) => r.status === 200,
    'Query has cache headers': (r) => r.headers['Cache-Control'] !== undefined,
    'Query response time < 50ms (cached)': (r) => {
      const body = JSON.parse(r.body);
      return body.cached ? r.timings.duration < 50 : true;
    },
  });
  
  dbResponseTime.add(queryResponse.timings.duration);
  errorRate.add(queryResponse.status !== 200);
  
  // Test 3: Simulate real application queries
  const endpoints = [
    '/api/v1/farms',
    '/api/v1/devices',
    '/api/v1/sensors/latest',
    '/api/v1/grow-parameters',
  ];
  
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const appResponse = http.get(`${BASE_URL}${randomEndpoint}`);
  
  check(appResponse, {
    'App endpoint responds': (r) => r.status === 200 || r.status === 404, // 404 is OK for test
    'App endpoint has reasonable response time': (r) => r.timings.duration < 1000,
  });
  
  // Small delay between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function handleSummary(data) {
  return {
    'database-load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
📊 Database Load Test Results
=============================
🎯 Virtual Users: ${data.metrics.vus.values.max}
⏱️  Duration: ${Math.round(data.state.testRunDurationMs / 1000)}s
📈 Requests: ${data.metrics.http_reqs.values.count}
💾 DB Response Time (p95): ${Math.round(data.metrics.db_response_time.values['p(95)'])}ms
🎯 Cache Hit Rate: ${Math.round(data.metrics.cache_hit_rate.values.rate * 100)}%
❌ Error Rate: ${Math.round(data.metrics.error_rate.values.rate * 100)}%
🚀 HTTP Duration (p95): ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms

${data.metrics.checks.values.rate === 1 ? '✅ All checks passed!' : '⚠️  Some checks failed'}
    `,
  };
} 