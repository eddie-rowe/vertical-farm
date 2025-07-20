#!/usr/bin/env node

/**
 * No-Cache Performance Test
 * 
 * Tests the performance of Supabase Edge Functions with caching completely disabled.
 * This provides a true baseline to compare against cached performance.
 */

// Load environment variables from root .env file
require('dotenv').config({ path: '../../../../.env' });

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  testDuration: 60000, // 1 minute
  concurrentRequests: 10,
  testScenarios: [
    'home-assistant-config-fetch',
    'device-state-sync',
    'background-task-processing',
    'queue-operations'
  ]
};

// Debug configuration
console.log('🔧 Configuration:');
console.log(`   Supabase URL: ${config.supabaseUrl}`);
console.log(`   Supabase Key: ${config.supabaseKey ? config.supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`);
console.log('');

class NoCachePerformanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testDuration: config.testDuration,
      scenarios: {},
      testType: 'NO_CACHE_BASELINE'
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
          // Force no caching at all levels
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Disable-Cache': 'true',
          'X-Force-Fresh': 'true',
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
    console.log('🏠 Testing Home Assistant Config Fetch Performance (NO CACHE)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate multiple config fetch requests with cache disabled
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              type: 'home_assistant_sync',
              payload: {
                action: 'fetch_config',
                force_refresh: true,
                disable_cache: true, // Explicitly disable caching
                cache_bypass: true,
                timestamp: Date.now() + Math.random() // Ensure unique requests
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.analyzeResults('home-assistant-config-fetch', testResults);
  }

  async testDeviceStateSync() {
    console.log('📱 Testing Device State Sync Performance (NO CACHE)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate device state sync requests with cache disabled
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
                force_fresh: true,
                timestamp: Date.now() + Math.random()
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.analyzeResults('device-state-sync', testResults);
  }

  async testBackgroundTaskProcessing() {
    console.log('⚙️ Testing Background Task Processing Performance (NO CACHE)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate various background tasks with cache disabled
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
                timestamp: Date.now() + Math.random(),
                data: { test: true },
                disable_cache: true,
                force_fresh: true
              }
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return this.analyzeResults('background-task-processing', testResults);
  }

  async testQueueOperations() {
    console.log('📋 Testing Queue Operations Performance (NO CACHE)...');
    
    const url = `${config.supabaseUrl}/functions/v1/queue-scheduler`;
    const testResults = [];
    const startTime = Date.now();

    // Test queue operations with cache disabled
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              action: 'process_queue',
              priority: 'normal',
              disable_cache: true,
              force_fresh: true,
              timestamp: Date.now() + Math.random()
            }
          }).catch(err => ({ error: err.message, responseTime: 0 }))
        );
      }

      const results = await Promise.all(promises);
      testResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return this.analyzeResults('queue-operations', testResults);
  }

  analyzeResults(scenarioName, results) {
    const validResults = results.filter(r => !r.error && r.responseTime > 0);
    const errorResults = results.filter(r => r.error);
    
    if (validResults.length === 0) {
      console.log(`❌ ${scenarioName}: No valid results`);
      return {
        scenario: scenarioName,
        totalRequests: results.length,
        successfulRequests: 0,
        errorRate: 100,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0
      };
    }

    const responseTimes = validResults.map(r => r.responseTime).sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || responseTimes[responseTimes.length - 1];
    const p99ResponseTime = responseTimes[p99Index] || responseTimes[responseTimes.length - 1];
    const throughput = (validResults.length / (config.testDuration / 1000));
    const errorRate = (errorResults.length / results.length) * 100;

    const analysis = {
      scenario: scenarioName,
      totalRequests: results.length,
      successfulRequests: validResults.length,
      errorRate: errorRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      p95ResponseTime: p95ResponseTime.toFixed(2),
      p99ResponseTime: p99ResponseTime.toFixed(2),
      throughput: throughput.toFixed(2)
    };

    console.log(`✅ ${scenarioName}: ${validResults.length}/${results.length} requests, avg: ${analysis.avgResponseTime}ms, p95: ${analysis.p95ResponseTime}ms`);
    
    this.results.scenarios[scenarioName] = analysis;
    return analysis;
  }

  async runAllTests() {
    console.log('🚀 Starting No-Cache Performance Baseline Test');
    console.log(`📊 Test Duration: ${config.testDuration / 1000}s, Concurrent Requests: ${config.concurrentRequests}`);
    console.log('============================================================');

    // Run all test scenarios
    await this.testHomeAssistantConfigFetch();
    await this.testDeviceStateSync();
    await this.testBackgroundTaskProcessing();
    await this.testQueueOperations();

    console.log('\n============================================================\n');
    
    return this.calculateOverallSummary();
  }

  calculateOverallSummary() {
    const scenarios = Object.values(this.results.scenarios);
    
    if (scenarios.length === 0) {
      console.log('❌ No test scenarios completed successfully');
      return null;
    }

    const totalRequests = scenarios.reduce((sum, s) => sum + parseInt(s.totalRequests), 0);
    const successfulRequests = scenarios.reduce((sum, s) => sum + parseInt(s.successfulRequests), 0);
    const avgResponseTime = scenarios.reduce((sum, s) => sum + parseFloat(s.avgResponseTime), 0) / scenarios.length;
    const avgP95ResponseTime = scenarios.reduce((sum, s) => sum + parseFloat(s.p95ResponseTime), 0) / scenarios.length;
    const overallThroughput = scenarios.reduce((sum, s) => sum + parseFloat(s.throughput), 0);
    const overallErrorRate = ((totalRequests - successfulRequests) / totalRequests) * 100;

    const summary = {
      totalRequests,
      successfulRequests,
      errorRate: overallErrorRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      p95ResponseTime: avgP95ResponseTime.toFixed(2),
      throughput: overallThroughput.toFixed(2)
    };

    this.results.summary = summary;
    return summary;
  }

  generateReport() {
    const summary = this.results.summary;
    
    if (!summary) {
      console.log('❌ Cannot generate report - no summary data available');
      return;
    }

    console.log('# No-Cache Performance Baseline Test Report\n');
    console.log(`**Test Date:** ${this.results.timestamp}`);
    console.log(`**Test Duration:** ${this.results.testDuration / 1000} seconds`);
    console.log(`**Concurrent Requests:** ${config.concurrentRequests}`);
    console.log(`**Test Type:** ${this.results.testType}\n`);
    
    console.log('## Summary\n');
    console.log(`- **Total Requests:** ${summary.totalRequests}`);
    console.log(`- **Successful Requests:** ${summary.successfulRequests}`);
    console.log(`- **Error Rate:** ${summary.errorRate}%`);
    console.log(`- **Average Response Time:** ${summary.avgResponseTime}ms`);
    console.log(`- **95th Percentile Response Time:** ${summary.p95ResponseTime}ms`);
    console.log(`- **Overall Throughput:** ${summary.throughput} req/s\n`);
    
    console.log('## Detailed Results\n');
    
    Object.values(this.results.scenarios).forEach(scenario => {
      console.log(`### ${scenario.scenario}`);
      console.log(`- **Requests:** ${scenario.successfulRequests}/${scenario.totalRequests}`);
      console.log(`- **Error Rate:** ${scenario.errorRate}%`);
      console.log(`- **Response Time (avg/p95/p99):** ${scenario.avgResponseTime}ms / ${scenario.p95ResponseTime}ms / ${scenario.p99ResponseTime}ms`);
      console.log(`- **Throughput:** ${scenario.throughput} req/s\n`);
    });

    console.log('\n## Performance Baseline Established (NO CACHE)\n');
    console.log('This report establishes the true baseline performance with caching completely disabled.');
    console.log('Use this data to compare against cached implementation results.\n');

    // Save results to file
    const timestamp = Date.now();
    const filename = `no-cache-baseline-${timestamp}.json`;
    const fs = require('fs');
    
    try {
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
      console.log(`📊 Raw results saved to: ${filename}\n`);
    } catch (error) {
      console.log(`❌ Failed to save results: ${error.message}`);
    }
  }
}

async function main() {
  try {
    const test = new NoCachePerformanceTest();
    await test.runAllTests();
    test.generateReport();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = NoCachePerformanceTest; 