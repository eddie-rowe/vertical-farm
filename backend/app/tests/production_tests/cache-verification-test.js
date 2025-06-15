#!/usr/bin/env node

/**
 * Cache Verification Test
 * 
 * Quick test to verify that caching is working correctly by checking cache statistics
 * and hit rates in the Edge Functions responses.
 */

// Load environment variables
require('dotenv').config({ path: '../../../../.env' });

const https = require('https');

const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
};

console.log('🔍 Cache Verification Test');
console.log('='.repeat(50));

async function makeRequest(url, body = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            parseError: true
          });
        }
      });
    });

    req.on('error', reject);
    
    if (Object.keys(body).length > 0) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testCacheHitRates() {
  console.log('📊 Testing Cache Hit Rates...\n');
  
  const backgroundTaskUrl = `${config.supabaseUrl}/functions/v1/background-task-processor`;
  
  // Make multiple requests to the same endpoint to test caching
  console.log('🔄 Making initial requests (should be cache misses)...');
  
  for (let i = 1; i <= 3; i++) {
    const result = await makeRequest(backgroundTaskUrl, {
      action: 'get_home_assistant_config'
    });
    
    console.log(`Request ${i}:`);
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.data && result.data.cache_stats) {
      console.log(`  Cache Stats:`, result.data.cache_stats);
    } else if (result.data && typeof result.data === 'object') {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    } else {
      console.log(`  Response: ${result.data.substring(0, 100)}...`);
    }
    console.log('');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🔄 Making follow-up requests (should show cache hits)...');
  
  for (let i = 4; i <= 6; i++) {
    const result = await makeRequest(backgroundTaskUrl, {
      action: 'get_home_assistant_config'
    });
    
    console.log(`Request ${i}:`);
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.data && result.data.cache_stats) {
      console.log(`  Cache Stats:`, result.data.cache_stats);
      
      // Calculate hit rate
      const stats = result.data.cache_stats;
      if (stats.ha_config_hits !== undefined && stats.ha_config_misses !== undefined) {
        const total = stats.ha_config_hits + stats.ha_config_misses;
        const hitRate = total > 0 ? (stats.ha_config_hits / total * 100).toFixed(1) : 0;
        console.log(`  Hit Rate: ${hitRate}%`);
      }
    } else if (result.data && typeof result.data === 'object') {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    } else {
      console.log(`  Response: ${result.data.substring(0, 100)}...`);
    }
    console.log('');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testDeviceStateCache() {
  console.log('📱 Testing Device State Cache...\n');
  
  const backgroundTaskUrl = `${config.supabaseUrl}/functions/v1/background-task-processor`;
  
  // Test device state sync caching
  for (let i = 1; i <= 3; i++) {
    const result = await makeRequest(backgroundTaskUrl, {
      action: 'sync_device_states',
      devices: ['light.living_room', 'switch.kitchen']
    });
    
    console.log(`Device Sync Request ${i}:`);
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.data && result.data.cache_stats) {
      console.log(`  Cache Stats:`, result.data.cache_stats);
    } else if (result.data && typeof result.data === 'object') {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  try {
    await testCacheHitRates();
    await testDeviceStateCache();
    
    console.log('✅ Cache verification test completed!');
    console.log('\n📋 Summary:');
    console.log('- Check the cache statistics in the responses above');
    console.log('- Look for increasing hit rates in subsequent requests');
    console.log('- Verify that cache_stats object is present in responses');
    
  } catch (error) {
    console.error('❌ Cache verification test failed:', error);
    process.exit(1);
  }
}

main(); 