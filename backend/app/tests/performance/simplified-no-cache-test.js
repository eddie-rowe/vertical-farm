#!/usr/bin/env node

/**
 * Simplified No-Cache Performance Test
 * 
 * Tests only the background-task-processor function with caching completely disabled.
 * This provides a clean baseline to compare against cached performance.
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
  concurrentRequests: 10
};

// Debug configuration
console.log('🔧 Configuration:');
console.log(`   Supabase URL: ${config.supabaseUrl}`);
console.log(`   Supabase Key: ${config.supabaseKey ? config.supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`);
console.log('');

class SimplifiedNoCacheTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testDuration: config.testDuration,
      scenarios: {},
      testType: 'NO_CACHE_SIMPLIFIED'
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

  async testBackgroundTaskProcessor() {
    console.log('⚙️ Testing Background Task Processor Performance (NO CACHE)...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Test various task types that the function actually supports
    const taskTypes = [
      { type: 'home_assistant_sync', payload: { action: 'fetch_config', disable_cache: true, force_fresh: true } },
      { type: 'home_assistant_sync', payload: { action: 'sync_device_states', device_ids: ['light.test'], disable_cache: true, force_fresh: true } },
      { type: 'sensor_reading', payload: { sensor_id: 'test_sensor', disable_cache: true, force_fresh: true } },
      { type: 'notification_send', payload: { message: 'test', disable_cache: true, force_fresh: true } }
    ];
    
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        const taskType = taskTypes[i % taskTypes.length];
        promises.push(
          this.makeRequest(url, {
            body: {
              ...taskType,
              payload: {
                ...taskType.payload,
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

    return this.analyzeResults('background-task-processor', testResults);
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

  async runTest() {
    console.log('🚀 Starting Simplified No-Cache Performance Test');
    console.log(`📊 Test Duration: ${config.testDuration / 1000}s, Concurrent Requests: ${config.concurrentRequests}`);
    console.log('============================================================');

    // Run the test
    await this.testBackgroundTaskProcessor();

    console.log('\n============================================================\n');
    
    return this.calculateOverallSummary();
  }

  calculateOverallSummary() {
    const scenarios = Object.values(this.results.scenarios);
    
    if (scenarios.length === 0) {
      console.log('❌ No test scenarios completed successfully');
      return null;
    }

    const scenario = scenarios[0]; // Only one scenario in simplified test
    const summary = {
      totalRequests: parseInt(scenario.totalRequests),
      successfulRequests: parseInt(scenario.successfulRequests),
      errorRate: scenario.errorRate,
      avgResponseTime: scenario.avgResponseTime,
      p95ResponseTime: scenario.p95ResponseTime,
      throughput: scenario.throughput
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

    console.log('# Simplified No-Cache Performance Test Report\n');
    console.log(`**Test Date:** ${this.results.timestamp}`);
    console.log(`**Test Duration:** ${this.results.testDuration / 1000} seconds`);
    console.log(`**Concurrent Requests:** ${config.concurrentRequests}`);
    console.log(`**Test Type:** ${this.results.testType}\n`);
    
    console.log('## Summary (NO CACHE)\n');
    console.log(`- **Total Requests:** ${summary.totalRequests}`);
    console.log(`- **Successful Requests:** ${summary.successfulRequests}`);
    console.log(`- **Error Rate:** ${summary.errorRate}%`);
    console.log(`- **Average Response Time:** ${summary.avgResponseTime}ms`);
    console.log(`- **95th Percentile Response Time:** ${summary.p95ResponseTime}ms`);
    console.log(`- **Overall Throughput:** ${summary.throughput} req/s\n`);
    
    console.log('## Performance Baseline Established (NO CACHE)\n');
    console.log('This report establishes the true baseline performance with caching completely disabled.');
    console.log('Compare these results with cached implementation to see the real impact.\n');

    // Save results to file
    const timestamp = Date.now();
    const filename = `simplified-no-cache-${timestamp}.json`;
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
    const test = new SimplifiedNoCacheTest();
    await test.runTest();
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

module.exports = SimplifiedNoCacheTest; 