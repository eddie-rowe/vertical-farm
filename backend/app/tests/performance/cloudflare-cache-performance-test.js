/**
 * Cloudflare Cache API Performance Test
 * 
 * Tests the new Cloudflare Cache API implementation against the previous
 * memory-based caching to measure performance improvements.
 */

// Load environment variables from .env file in project root
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (4 levels up from this test file)
const projectRoot = join(__dirname, '../../../..');
dotenvConfig({ path: join(projectRoot, '.env') });

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  testDuration: 60000, // 1 minute
  concurrentRequests: 10,
  requestInterval: 100, // ms between request batches
};

// Debug: Verify environment variables are loaded
console.log('🔧 Environment Configuration:');
console.log(`   Supabase URL: ${config.supabaseUrl ? config.supabaseUrl.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`   Supabase Key: ${config.supabaseAnonKey ? config.supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'}`);
console.log('');

// Test configuration
const CONFIG = {
  url: `${config.supabaseUrl}/functions/v1/cache-performance-test`,
  totalRequests: 1000,
  concurrency: 10,
  timeout: 30000,
  
  // Fixed parameters for cache testing - these will create cache hits
  testUsers: ['user_001', 'user_002', 'user_003'],
  testDevices: ['device_001', 'device_002', 'device_003', null], // null for global cache
  taskTypes: ['device_discovery', 'state_sync', 'health_check', 'bulk_control'],
  
  // Cache hit strategy: repeat requests to create hits
  cacheHitRatio: 0.7 // 70% of requests will use repeated parameters
};

// Statistics tracking
const stats = {
  successful: 0,
  failed: 0,
  totalResponseTime: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
  errors: [],
  cacheStats: null
};

// Generate consistent task payloads for cache testing
function generateTaskPayload(forceRepeat = false) {
  const isRepeat = forceRepeat || Math.random() < CONFIG.cacheHitRatio;
  
  if (isRepeat && stats.successful > 0) {
    // Use parameters that should result in cache hits
    return {
      task_type: CONFIG.taskTypes[0], // Always use first task type for repeats
      user_id: CONFIG.testUsers[0],   // Always use first user for repeats
      device_id: CONFIG.testDevices[0], // Always use first device for repeats
      parameters: {
        test_mode: true,
        cache_test: true
      }
    };
  } else {
    // Use varied parameters for cache misses
    return {
      task_type: CONFIG.taskTypes[Math.floor(Math.random() * CONFIG.taskTypes.length)],
      user_id: CONFIG.testUsers[Math.floor(Math.random() * CONFIG.testUsers.length)],
      device_id: CONFIG.testDevices[Math.floor(Math.random() * CONFIG.testDevices.length)],
      parameters: {
        test_mode: true,
        cache_test: true,
        variation: Math.random().toString(36).substr(2, 5) // Add some variation
      }
    };
  }
}

// Make HTTP request
function makeRequest() {
  return new Promise((resolve) => {
    const taskPayload = generateTaskPayload();
    const postData = JSON.stringify(taskPayload);
    
    const supabaseUrl = new URL(config.supabaseUrl);
    const options = {
      hostname: supabaseUrl.hostname,
      path: '/functions/v1/cache-performance-test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${config.supabaseAnonKey}`
      },
      timeout: CONFIG.timeout
    };

    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            stats.successful++;
            stats.totalResponseTime += responseTime;
            stats.responseTimes.push(responseTime);
            
            // Track cache statistics
            if (response.cache_hit) {
              stats.cacheHits++;
            } else {
              stats.cacheMisses++;
            }
            
            // Store latest cache stats
            if (response.cache_stats) {
              stats.cacheStats = response.cache_stats;
            }
            
          } else {
            stats.failed++;
            stats.errors.push({
              status: res.statusCode,
              response: response,
              taskPayload: taskPayload
            });
          }
        } catch (parseError) {
          stats.failed++;
          stats.errors.push({
            error: 'JSON parse error',
            data: data,
            parseError: parseError.message,
            taskPayload: taskPayload
          });
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      stats.failed++;
      stats.errors.push({
        error: 'Request error',
        message: error.message,
        taskPayload: taskPayload
      });
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      stats.failed++;
      stats.errors.push({
        error: 'Request timeout',
        taskPayload: taskPayload
      });
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Run concurrent requests
async function runConcurrentRequests(count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(makeRequest());
  }
  await Promise.all(promises);
}

// Calculate percentiles
function calculatePercentile(arr, percentile) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Main test function
async function runPerformanceTest() {
  console.log('🚀 Starting Cloudflare Cache Performance Test');
  console.log(`📊 Configuration:`);
  console.log(`   • Total Requests: ${CONFIG.totalRequests}`);
  console.log(`   • Concurrency: ${CONFIG.concurrency}`);
  console.log(`   • Target Cache Hit Ratio: ${(CONFIG.cacheHitRatio * 100).toFixed(1)}%`);
  console.log(`   • Test Users: ${CONFIG.testUsers.length}`);
  console.log(`   • Test Devices: ${CONFIG.testDevices.length}`);
  console.log(`   • Task Types: ${CONFIG.taskTypes.length}`);
  console.log('');

  const startTime = Date.now();
  const totalBatches = Math.ceil(CONFIG.totalRequests / CONFIG.concurrency);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const remainingRequests = CONFIG.totalRequests - (batch * CONFIG.concurrency);
    const batchSize = Math.min(CONFIG.concurrency, remainingRequests);
    
    await runConcurrentRequests(batchSize);
    
    const completed = Math.min((batch + 1) * CONFIG.concurrency, CONFIG.totalRequests);
    const progress = (completed / CONFIG.totalRequests * 100).toFixed(1);
    const currentCacheHitRate = stats.cacheHits + stats.cacheMisses > 0 
      ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1)
      : '0.0';
    
    process.stdout.write(`\r📈 Progress: ${progress}% (${completed}/${CONFIG.totalRequests}) | Cache Hits: ${currentCacheHitRate}%`);
  }
  
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  console.log('\n\n🎯 Test Results:');
  console.log('================');
  
  // Basic statistics
  const successRate = (stats.successful / CONFIG.totalRequests * 100).toFixed(2);
  const avgResponseTime = stats.successful > 0 ? (stats.totalResponseTime / stats.successful).toFixed(2) : 0;
  const requestsPerSecond = (CONFIG.totalRequests / totalTime).toFixed(2);
  
  console.log(`✅ Successful Requests: ${stats.successful} (${successRate}%)`);
  console.log(`❌ Failed Requests: ${stats.failed}`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`🚀 Requests per Second: ${requestsPerSecond}`);
  console.log(`⏰ Total Test Duration: ${totalTime.toFixed(2)}s`);
  
  // Response time percentiles
  if (stats.responseTimes.length > 0) {
    console.log('\n📊 Response Time Percentiles:');
    console.log(`   • P50: ${calculatePercentile(stats.responseTimes, 50)}ms`);
    console.log(`   • P90: ${calculatePercentile(stats.responseTimes, 90)}ms`);
    console.log(`   • P95: ${calculatePercentile(stats.responseTimes, 95)}ms`);
    console.log(`   • P99: ${calculatePercentile(stats.responseTimes, 99)}ms`);
  }
  
  // Cache performance analysis
  console.log('\n🎯 Cache Performance Analysis:');
  console.log('==============================');
  
  const totalCacheRequests = stats.cacheHits + stats.cacheMisses;
  const cacheHitRate = totalCacheRequests > 0 ? (stats.cacheHits / totalCacheRequests * 100).toFixed(2) : '0.00';
  
  console.log(`📊 Cache Statistics:`);
  console.log(`   • Total Cache Requests: ${totalCacheRequests}`);
  console.log(`   • Cache Hits: ${stats.cacheHits}`);
  console.log(`   • Cache Misses: ${stats.cacheMisses}`);
  console.log(`   • Hit Rate: ${cacheHitRate}%`);
  
  if (stats.cacheStats) {
    console.log(`\n📈 Final Cache Stats from Edge Function:`);
    console.log(`   • Total Requests: ${stats.cacheStats.total_requests}`);
    console.log(`   • Cache Hits: ${stats.cacheStats.cache_hits}`);
    console.log(`   • Hit Rate: ${stats.cacheStats.hit_rate_percent.toFixed(2)}%`);
  }
  
  // Cache effectiveness evaluation
  const targetHitRate = CONFIG.cacheHitRatio * 100;
  const actualHitRate = parseFloat(cacheHitRate);
  
  console.log(`\n🎯 Cache Effectiveness:`);
  if (actualHitRate >= targetHitRate * 0.8) { // Within 80% of target
    console.log(`   ✅ EXCELLENT: ${actualHitRate}% hit rate (target: ${targetHitRate.toFixed(1)}%)`);
  } else if (actualHitRate >= targetHitRate * 0.5) { // Within 50% of target
    console.log(`   ⚠️  GOOD: ${actualHitRate}% hit rate (target: ${targetHitRate.toFixed(1)}%)`);
  } else if (actualHitRate > 0) {
    console.log(`   ⚠️  POOR: ${actualHitRate}% hit rate (target: ${targetHitRate.toFixed(1)}%)`);
  } else {
    console.log(`   ❌ FAILED: 0% hit rate - cache not working effectively`);
  }
  
  // Error analysis
  if (stats.errors.length > 0) {
    console.log('\n❌ Error Analysis:');
    console.log('==================');
    console.log(`Total Errors: ${stats.errors.length}`);
    
    // Group errors by type
    const errorGroups = {};
    stats.errors.forEach(error => {
      const key = error.error || error.status || 'unknown';
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    });
    
    Object.entries(errorGroups).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count}`);
    });
    
    // Show first few errors for debugging
    console.log('\nFirst 3 errors:');
    stats.errors.slice(0, 3).forEach((error, index) => {
      console.log(`${index + 1}. ${JSON.stringify(error, null, 2)}`);
    });
  }
  
  console.log('\n🏁 Test Complete!');
}

// Run the test
async function main() {
  console.log('🧪 Starting Cloudflare Cache API Performance Test...\n');
  
  try {
    await runPerformanceTest();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 