#!/usr/bin/env node

/**
 * Edge Functions Performance Test
 * 
 * Tests the performance of Supabase Edge Functions before and after caching implementation.
 * Measures key metrics like response times, throughput, and resource usage.
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

class PerformanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
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
    console.log('🏠 Testing Home Assistant Config Fetch Performance...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate multiple config fetch requests
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              type: 'home_assistant_sync',
              payload: {
                action: 'fetch_config',
                force_refresh: true // Force fresh fetch to test uncached performance
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
    console.log('📱 Testing Device State Sync Performance...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate device state sync requests
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              type: 'home_assistant_sync',
              payload: {
                action: 'sync_device_states',
                device_ids: ['light.grow_light_1', 'switch.water_pump_1', 'fan.exhaust_fan_1']
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
    console.log('⚙️ Testing Background Task Processing Performance...');
    
    const url = `${config.supabaseUrl}/functions/v1/background-task-processor`;
    const testResults = [];
    const startTime = Date.now();

    // Simulate various background tasks
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
                timestamp: Date.now(),
                data: { test: true }
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
    console.log('📋 Testing Queue Operations Performance...');
    
    const url = `${config.supabaseUrl}/functions/v1/queue-scheduler`;
    const testResults = [];
    const startTime = Date.now();

    // Test queue scheduling and processing
    while (Date.now() - startTime < config.testDuration) {
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        promises.push(
          this.makeRequest(url, {
            body: {
              action: 'process_queues'
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
      return {
        scenario: scenarioName,
        error: 'No valid results',
        totalRequests: results.length,
        errors: errorResults.length
      };
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
    console.log('🚀 Starting Edge Functions Performance Baseline Test');
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
      console.error('❌ Test execution failed:', error);
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

  generateReport() {
    // Check if we have valid summary data
    if (!this.results.summary || this.results.summary.error) {
      return `
# Edge Functions Performance Test Report

**Test Date:** ${this.results.timestamp}
**Test Duration:** ${config.testDuration / 1000} seconds
**Concurrent Requests:** ${config.concurrentRequests}

## Summary

❌ **Test Failed:** ${this.results.summary?.error || 'No summary data available'}

## Scenario Results

${Object.entries(this.results.scenarios).map(([name, data]) => {
  if (data.error) {
    return `### ${name}\n❌ **Error:** ${data.error}\n`;
  }
  return `### ${name}\n✅ **Success:** ${data.successfulRequests}/${data.totalRequests} requests\n`;
}).join('\n')}
`;
    }

    const report = `
# Edge Functions Performance Test Report

**Test Date:** ${this.results.timestamp}
**Test Duration:** ${config.testDuration / 1000} seconds
**Concurrent Requests:** ${config.concurrentRequests}

## Summary

- **Total Requests:** ${this.results.summary.totalRequests}
- **Successful Requests:** ${this.results.summary.totalSuccessful}
- **Error Rate:** ${this.results.summary.overallErrorRate.toFixed(2)}%
- **Average Response Time:** ${this.results.summary.avgResponseTime.toFixed(2)}ms
- **95th Percentile Response Time:** ${this.results.summary.avgP95ResponseTime.toFixed(2)}ms
- **Overall Throughput:** ${this.results.summary.overallThroughput.toFixed(2)} req/s

## Detailed Results

${Object.entries(this.results.scenarios).map(([name, data]) => {
  if (data.error) {
    return `### ${name}\n❌ **Error:** ${data.error}\n`;
  }
  
  return `### ${name}
- **Requests:** ${data.successfulRequests}/${data.totalRequests}
- **Error Rate:** ${data.errorRate.toFixed(2)}%
- **Response Time (avg/p95/p99):** ${data.responseTime.avg.toFixed(2)}ms / ${data.responseTime.p95.toFixed(2)}ms / ${data.responseTime.p99.toFixed(2)}ms
- **Throughput:** ${data.throughput.requestsPerSecond.toFixed(2)} req/s
`;
}).join('\n')}

## Performance Baseline Established

This report establishes the baseline performance before implementing caching strategies.
Use this data to compare against post-caching implementation results.
`;

    return report;
  }
}

// Main execution
async function main() {
  if (process.argv.includes('--help')) {
    console.log(`
Edge Functions Performance Test

Usage: node edge-functions-performance-test.js [options]

Environment Variables:
  SUPABASE_URL      - Your Supabase project URL
  SUPABASE_ANON_KEY - Your Supabase anonymous key

Options:
  --help            - Show this help message
  --output FILE     - Save results to file (default: console only)
  --duration MS     - Test duration in milliseconds (default: 60000)
  --concurrent N    - Concurrent requests (default: 10)
`);
    process.exit(0);
  }

  const test = new PerformanceTest();
  
  try {
    const results = await test.runAllTests();
    const report = test.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    
    // Save to file if requested
    const outputFile = process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1];
    if (outputFile) {
      const fs = require('fs');
      fs.writeFileSync(outputFile, report);
      console.log(`📄 Report saved to: ${outputFile}`);
    }
    
    // Save raw results as JSON
    const jsonFile = `edge-functions-baseline-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`📊 Raw results saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTest; 