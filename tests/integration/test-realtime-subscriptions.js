#!/usr/bin/env node

/**
 * Real-time Subscription Testing Script
 * Tests all real-time subscriptions after RLS policy changes
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test configuration
const TABLES_TO_TEST = [
  'user_profiles',
  'farms', 
  'device_assignments',
  'sensor_readings',
  'user_home_assistant_configs',
  'user_device_configs',
  'task_logs'
];

const TEST_TIMEOUT = 10000; // 10 seconds

class RealtimeSubscriptionTester {
  constructor() {
    this.results = [];
    this.activeSubscriptions = [];
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth Error:', error.message);
        return false;
      }
      
      if (!session) {
        console.log('⚠️  No active session - testing anonymous access');
        return false;
      }
      
      console.log('✅ Authenticated as:', session.user.email);
      return true;
    } catch (error) {
      console.error('❌ Auth Exception:', error.message);
      return false;
    }
  }

  async testTableSubscription(tableName, filters = {}) {
    console.log(`\n📡 Testing ${tableName} subscription...`);
    
    return new Promise((resolve) => {
      let hasReceived = false;
      let subscription;
      
      const timeout = setTimeout(() => {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (!hasReceived) {
          console.log(`❌ ${tableName}: No real-time events received (timeout)`);
          resolve({ table: tableName, success: false, error: 'Timeout - no events received' });
        }
      }, TEST_TIMEOUT);

      try {
        let query = supabase
          .channel(`test-${tableName}-${Date.now()}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: tableName,
              ...filters
            }, 
            (payload) => {
              hasReceived = true;
              clearTimeout(timeout);
              console.log(`✅ ${tableName}: Real-time event received`, payload.eventType);
              subscription.unsubscribe();
              resolve({ table: tableName, success: true, event: payload.eventType });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`📡 ${tableName}: Subscription active`);
              
              // Trigger a test update to generate an event
              setTimeout(() => {
                this.triggerTestEvent(tableName);
              }, 1000);
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              console.log(`❌ ${tableName}: Subscription error`);
              resolve({ table: tableName, success: false, error: 'Channel error' });
            }
          });

        subscription = query;
        this.activeSubscriptions.push(subscription);

      } catch (error) {
        clearTimeout(timeout);
        console.error(`❌ ${tableName}: Subscription failed -`, error.message);
        resolve({ table: tableName, success: false, error: error.message });
      }
    });
  }

  async triggerTestEvent(tableName) {
    try {
      // Try to trigger a harmless update to test real-time
      switch (tableName) {
        case 'user_profiles':
          // Update last_seen timestamp
          await supabase
            .from('user_profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', (await supabase.auth.getUser()).data.user?.id);
          break;
          
        case 'farms':
          // Try to select farms (should trigger if user has access)
          await supabase.from('farms').select('id').limit(1);
          break;
          
        case 'device_assignments':
          // Try to select device assignments
          await supabase.from('device_assignments').select('id').limit(1);
          break;
          
        default:
          // Generic select to potentially trigger events
          await supabase.from(tableName).select('id').limit(1);
      }
    } catch (error) {
      console.log(`⚠️  Could not trigger test event for ${tableName}:`, error.message);
    }
  }

  async testUserScopedSubscriptions() {
    console.log('\n👤 Testing User-Scoped Subscriptions...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user for user-scoped tests');
      return [];
    }

    const userScopedTests = [
      {
        table: 'user_home_assistant_configs',
        filter: { filter: `user_id=eq.${user.id}` }
      },
      {
        table: 'user_device_configs', 
        filter: { filter: `user_config_id=eq.${user.id}` }
      }
    ];

    const results = [];
    for (const test of userScopedTests) {
      const result = await this.testTableSubscription(test.table, test.filter);
      results.push(result);
    }
    
    return results;
  }

  async testFarmHierarchySubscriptions() {
    console.log('\n🏭 Testing Farm Hierarchy Subscriptions...');
    
    // Test farm-related subscriptions
    const hierarchyTests = ['farms', 'rows', 'racks', 'shelves', 'device_assignments'];
    const results = [];
    
    for (const table of hierarchyTests) {
      const result = await this.testTableSubscription(table);
      results.push(result);
    }
    
    return results;
  }

  async testConnectionStatus() {
    console.log('\n🔌 Testing Real-time Connection Status...');
    
    return new Promise((resolve) => {
      const channel = supabase.channel('connection-test');
      
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);

      channel
        .subscribe((status) => {
          clearTimeout(timeout);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time connection established');
            channel.unsubscribe();
            resolve({ success: true, status });
          } else if (status === 'CHANNEL_ERROR') {
            console.log('❌ Real-time connection failed');
            resolve({ success: false, error: 'Channel error', status });
          }
        });
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Real-time Subscription Tests...\n');
    
    // Test authentication first
    const isAuthenticated = await this.testAuthentication();
    
    // Test connection status
    const connectionResult = await this.testConnectionStatus();
    this.results.push({ test: 'connection', ...connectionResult });
    
    if (!connectionResult.success) {
      console.log('\n❌ Real-time connection failed - skipping subscription tests');
      return this.generateReport();
    }

    // Test basic table subscriptions
    console.log('\n📋 Testing Basic Table Subscriptions...');
    for (const table of TABLES_TO_TEST) {
      const result = await this.testTableSubscription(table);
      this.results.push({ test: 'table_subscription', ...result });
    }

    // Test user-scoped subscriptions if authenticated
    if (isAuthenticated) {
      const userResults = await this.testUserScopedSubscriptions();
      this.results.push(...userResults.map(r => ({ test: 'user_scoped', ...r })));
      
      const farmResults = await this.testFarmHierarchySubscriptions();
      this.results.push(...farmResults.map(r => ({ test: 'farm_hierarchy', ...r })));
    }

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 REAL-TIME SUBSCRIPTION TEST REPORT');
    console.log('=====================================');
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    // Group by test type
    const byType = this.results.reduce((acc, result) => {
      const type = result.test || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(result);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, results]) => {
      console.log(`\n${type.toUpperCase()}:`);
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const table = result.table || result.status || 'connection';
        const error = result.error ? ` (${result.error})` : '';
        console.log(`  ${status} ${table}${error}`);
      });
    });

    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    const failed = this.results.filter(r => !r.success);
    
    if (failed.length === 0) {
      console.log('✅ All real-time subscriptions are working correctly!');
    } else {
      console.log('❌ Issues found with real-time subscriptions:');
      
      failed.forEach(result => {
        if (result.error?.includes('timeout')) {
          console.log(`  • ${result.table}: Check RLS policies - may be blocking subscription`);
        } else if (result.error?.includes('Channel error')) {
          console.log(`  • ${result.table}: Check table permissions and real-time enablement`);
        } else {
          console.log(`  • ${result.table}: ${result.error}`);
        }
      });
      
      console.log('\n💡 Common fixes:');
      console.log('  1. Verify RLS policies allow SELECT for authenticated users');
      console.log('  2. Check that real-time is enabled on tables');
      console.log('  3. Ensure user has proper role/permissions');
      console.log('  4. Test with different user roles (admin, farm_manager, operator)');
    }

    return {
      total,
      successful,
      failed: total - successful,
      results: this.results
    };
  }

  cleanup() {
    // Unsubscribe from any remaining subscriptions
    this.activeSubscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }
}

// Run the tests
async function main() {
  const tester = new RealtimeSubscriptionTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Exit with error code if tests failed
    if (report.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner failed:', error.message);
    process.exit(1);
  } finally {
    tester.cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RealtimeSubscriptionTester }; 