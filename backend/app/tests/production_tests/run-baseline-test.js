#!/usr/bin/env node

/**
 * Baseline Performance Test (No Caching)
 * 
 * This script runs the edge functions performance test with caching disabled
 * to establish a baseline for comparison with cached performance.
 */

// Load environment variables from root .env file
require('dotenv').config({ path: '../../../../.env' });

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration for baseline test (no caching)
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  testDuration: 30000, // 30 seconds for baseline
  concurrentRequests: 5, // Lower concurrency for baseline
  testScenarios: [
    'home-assistant-config-fetch',
    'device-state-sync',
    'background-task-processing',
    'queue-operations'
  ]
};

// Debug configuration
console.log('🔧 Baseline Test Configuration (No Caching):');
console.log(`   Supabase URL: ${config.supabaseUrl}`);
console.log(`   Supabase Key: ${config.supabaseKey ? config.supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`   Test Duration: ${config.testDuration / 1000}s`);
console.log(`   Concurrent Requests: ${config.concurrentRequests}`);
console.log('');

class BaselinePerformanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'baseline-without-cache',
      testDuration: config.testDuration,
      scenarios: {}
    };
  }

  async makeRequest(url, options = {}) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Force no caching
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options.headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const result = {
            statusCode: res.statusCode,
            responseTime: endTime - startTime,
            dataSize: data.length,
            headers: res.headers,
            data: data
          };
          
          // Log errors for debugging
          if (res.statusCode >= 400) {
            console.log(`❌ HTTP ${res.statusCode} for ${url}: ${data.substring(0, 200)}`);
            result.error = `HTTP ${res.statusCode}: ${data}`;
          }
          
          resolve(result);
        });
      });

      req.on('error', (err) => {
        console.log(`❌ Request error for ${url}: ${err.message}`);
        reject(err);
      });
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async testHomeAssistantConfigFetch() {
    console.log('🏠 Testing Home Assistant Config Fetch (Baseline - No Cache)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate multiple config fetch requests with no caching
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              type: 'home_assistant_sync',
              payload: {
                action: 'fetch_config',
                force_refresh: true, // Force fresh fetch
                disable_cache: true, // Explicitly disable caching
                timestamp: Date.now() + i // Ensure unique requests
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return this.analyzeResults('home-assistant-config-fetch', testResults);
  }

  async testDeviceStateSync() {
    console.log('📱 Testing Device State Sync (Baseline - No Cache)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate device state sync requests with no caching
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              type: 'home_assistant_sync',
              payload: {
                action: 'sync_device_states',
                device_ids: ['light.grow_light_1', 'switch.water_pump_1', 'fan.exhaust_fan_1'],
                disable_cache: true,
                timestamp: Date.now() + i
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return this.analyzeResults('device-state-sync', testResults);
  }

  async testBackgroundTaskProcessing() {
    console.log('⚙️ Testing Background Task Processing (Baseline - No Cache)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate various background tasks with no caching
    const taskTypes = ['sensor_reading', 'notification_send', 'data_cleanup'];
    
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        const taskType = taskTypes[i % taskTypes.length];
        promises.push(
          this.makeRequest(url, {
            body: {
              type: taskType,
              payload: {
                timestamp: Date.now() + i,
                data: { test: true, disable_cache: true }
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    return this.analyzeResults('background-task-processing', testResults);
  }

  async testQueueOperations() {
    console.log('📋 Testing Queue Operations (Baseline - No Cache)...');
    
    const url = `${config.supabaseUrl}/functions/v1/queue-scheduler`;
    const testResults = [];
    const startTime = Date.now();

    // Test queue operations with no caching
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              action: 'process_queue',
              queue_name: 'normal_tasks',
              disable_cache: true,
              timestamp: Date.now() + i
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return this.analyzeResults('queue-operations', testResults);
  }

  analyzeResults(scenarioName, results) {
    const validResults = results.filter(r => !r.error && r.responseTime > 0);
    const errorResults = results.filter(r => r.error);

    if (validResults.length === 0) {
      console.log(`❌ ${scenarioName}: No valid results`);
      return { scenario: scenarioName, error: 'No valid results' };
    }

    const responseTimes = validResults.map(r => r.responseTime);
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    
    const analysis = {
      scenario: scenarioName,
      totalRequests: results.length,
      successfulRequests: validResults.length,
      errorCount: errorResults.length,
      errorRate: (errorResults.length / results.length) * 100,
      
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
        p90: sortedTimes[Math.floor(sortedTimes.length * 0.9)],
        p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
        p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
      },
      
      throughput: {
        requestsPerSecond: validResults.length / (config.testDuration / 1000),
        avgDataSize: validResults.reduce((sum, r) => sum + (r.dataSize || 0), 0) / validResults.length
      }
    };

    console.log(`✅ ${scenarioName}: ${analysis.successfulRequests}/${analysis.totalRequests} requests, avg: ${analysis.responseTime.avg.toFixed(2)}ms, p95: ${analysis.responseTime.p95.toFixed(2)}ms`);
    
    return analysis;
  }

  async runAllTests() {
    console.log('🚀 Starting Baseline Performance Test (No Caching)');
    console.log(`📊 Test Duration: ${config.testDuration / 1000}s, Concurrent Requests: ${config.concurrentRequests}`);
    console.log('='.repeat(60));

    try {
      // Run all test scenarios
      this.results.scenarios.homeAssistantConfig = await this.testHomeAssistantConfigFetch();
      this.results.scenarios.deviceStateSync = await this.testDeviceStateSync();
      this.results.scenarios.backgroundTaskProcessing = await this.testBackgroundTaskProcessing();
      this.results.scenarios.queueOperations = await this.testQueueOperations();

      // Calculate overall metrics
      this.results.summary = this.calculateOverallSummary();
      
      return this.results;
    } catch (error) {
      console.error('❌ Baseline test execution failed:', error);
      throw error;
    }
  }

  calculateOverallSummary() {
    const scenarios = Object.values(this.results.scenarios).filter(s => !s.error);
    
    if (scenarios.length === 0) {
      return { error: 'No successful test scenarios' };
    }

    const totalRequests = scenarios.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalSuccessful = scenarios.reduce((sum, s) => sum + s.successfulRequests, 0);
    const totalErrors = scenarios.reduce((sum, s) => sum + s.errorCount, 0);
    
    const avgResponseTimes = scenarios.map(s => s.responseTime.avg);
    const p95ResponseTimes = scenarios.map(s => s.responseTime.p95);
    
    return {
      totalRequests,
      totalSuccessful,
      totalErrors,
      overallErrorRate: (totalErrors / totalRequests) * 100,
      avgResponseTime: avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length,
      avgP95ResponseTime: p95ResponseTimes.reduce((a, b) => a + b, 0) / p95ResponseTimes.length,
      overallThroughput: totalSuccessful / (config.testDuration / 1000)
    };
  }
}

// Main execution
async function main() {
  const test = new BaselinePerformanceTest();
  
  try {
    const results = await test.runAllTests();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASELINE TEST RESULTS (NO CACHING)');
    console.log('='.repeat(60));
    
    if (results.summary && !results.summary.error) {
      console.log(`Total Requests: ${results.summary.totalRequests}`);
      console.log(`Successful: ${results.summary.totalSuccessful}`);
      console.log(`Error Rate: ${results.summary.overallErrorRate.toFixed(2)}%`);
      console.log(`Avg Response Time: ${results.summary.avgResponseTime.toFixed(2)}ms`);
      console.log(`P95 Response Time: ${results.summary.avgP95ResponseTime.toFixed(2)}ms`);
      console.log(`Throughput: ${results.summary.overallThroughput.toFixed(2)} req/s`);
    }
    
    // Save raw results as JSON
    const jsonFile = `baseline-without-cache-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`📄 Baseline results saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('❌ Baseline performance test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BaselinePerformanceTest; 