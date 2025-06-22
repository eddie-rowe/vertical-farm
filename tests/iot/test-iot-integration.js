#!/usr/bin/env node

/**
 * IoT Device Integration Testing Script
 * Tests device assignments, sensor data flow, and Home Assistant integration
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

class IoTIntegrationTester {
  constructor() {
    this.results = [];
    this.currentUser = null;
    this.testDeviceId = null;
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('⚠️  No authenticated user - testing anonymous access');
        return null;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { ...user, ...profile };
    } catch (error) {
      console.error('❌ Exception getting user:', error.message);
      return null;
    }
  }

  async testDeviceAssignmentAccess() {
    console.log('\n🔌 Testing Device Assignment Access...');
    
    const tests = [
      {
        name: 'List Device Assignments',
        test: async () => {
          const { data, error } = await supabase
            .from('device_assignments')
            .select(`
              id,
              entity_id,
              entity_type,
              friendly_name,
              farm_id,
              rack_id,
              shelf_id,
              created_at
            `);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0,
            data: data?.slice(0, 3) // Show first 3 for debugging
          };
        }
      },
      {
        name: 'Filter Devices by Farm',
        test: async () => {
          // First get a farm ID
          const { data: farms } = await supabase
            .from('farms')
            .select('id')
            .limit(1);
            
          if (!farms || farms.length === 0) {
            return { success: false, error: 'No farms available for testing' };
          }
          
          const { data, error } = await supabase
            .from('device_assignments')
            .select('*')
            .eq('farm_id', farms[0].id);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0,
            farmId: farms[0].id
          };
        }
      },
      {
        name: 'Create Test Device Assignment',
        test: async () => {
          const testDevice = {
            entity_id: `test.device_${Date.now()}`,
            entity_type: 'sensor',
            friendly_name: 'Test Temperature Sensor',
            device_class: 'temperature',
            unit_of_measurement: '°C'
          };
          
          const { data, error } = await supabase
            .from('device_assignments')
            .insert(testDevice)
            .select();
            
          if (data && data[0]) {
            this.testDeviceId = data[0].id;
          }
          
          return { 
            success: !error, 
            error: error?.message,
            deviceId: data?.[0]?.id
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} devices)` : '';
      const extra = result.farmId ? ` [Farm: ${result.farmId}]` : 
                   result.deviceId ? ` [Device: ${result.deviceId}]` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}${extra}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testSensorDataFlow() {
    console.log('\n📊 Testing Sensor Data Flow...');
    
    const tests = [
      {
        name: 'Read Sensor Readings',
        test: async () => {
          const { data, error } = await supabase
            .from('sensor_readings')
            .select(`
              id,
              entity_id,
              state,
              attributes,
              last_changed,
              last_updated
            `)
            .order('last_updated', { ascending: false })
            .limit(10);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0,
            latestReading: data?.[0]
          };
        }
      },
      {
        name: 'Insert Test Sensor Reading',
        test: async () => {
          if (!this.testDeviceId) {
            return { success: false, error: 'No test device available' };
          }
          
          const testReading = {
            entity_id: `test.device_${Date.now()}`,
            state: '23.5',
            attributes: {
              unit_of_measurement: '°C',
              device_class: 'temperature',
              friendly_name: 'Test Temperature'
            },
            last_changed: new Date().toISOString(),
            last_updated: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('sensor_readings')
            .insert(testReading)
            .select();
          
          return { 
            success: !error, 
            error: error?.message,
            readingId: data?.[0]?.id
          };
        }
      },
      {
        name: 'Query Recent Sensor Data',
        test: async () => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          const { data, error } = await supabase
            .from('sensor_readings')
            .select('entity_id, state, last_updated')
            .gte('last_updated', oneHourAgo)
            .order('last_updated', { ascending: false });
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0,
            timeRange: 'last hour'
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} readings)` : '';
      const extra = result.readingId ? ` [Reading: ${result.readingId}]` : 
                   result.timeRange ? ` [${result.timeRange}]` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}${extra}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testHomeAssistantIntegration() {
    console.log('\n🏠 Testing Home Assistant Integration...');
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user for HA integration tests');
      return [];
    }

    const tests = [
      {
        name: 'User HA Config Access',
        test: async () => {
          const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .select(`
              id,
              user_id,
              ha_url,
              ha_token_preview,
              is_active,
              last_sync,
              created_at
            `)
            .eq('user_id', this.currentUser.id);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0,
            hasActiveConfig: data?.some(config => config.is_active)
          };
        }
      },
      {
        name: 'User Device Configs',
        test: async () => {
          const { data, error } = await supabase
            .from('user_device_configs')
            .select(`
              id,
              user_config_id,
              entity_id,
              custom_name,
              is_monitored,
              alert_thresholds,
              created_at
            `);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0
          };
        }
      },
      {
        name: 'Create Test HA Config',
        test: async () => {
          const testConfig = {
            user_id: this.currentUser.id,
            ha_url: 'http://test.homeassistant.local:8123',
            ha_token_preview: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
            is_active: false, // Don't activate test config
            connection_status: 'testing'
          };
          
          const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .insert(testConfig)
            .select();
          
          return { 
            success: !error, 
            error: error?.message,
            configId: data?.[0]?.id
          };
        }
      },
      {
        name: 'Test Device Config Creation',
        test: async () => {
          // Get a user config first
          const { data: configs } = await supabase
            .from('user_home_assistant_configs')
            .select('id')
            .eq('user_id', this.currentUser.id)
            .limit(1);
            
          if (!configs || configs.length === 0) {
            return { success: false, error: 'No HA config available for device config test' };
          }
          
          const testDeviceConfig = {
            user_config_id: configs[0].id,
            entity_id: `sensor.test_temperature_${Date.now()}`,
            custom_name: 'Test Temperature Sensor',
            is_monitored: true,
            alert_thresholds: {
              min: 18,
              max: 28,
              unit: '°C'
            }
          };
          
          const { data, error } = await supabase
            .from('user_device_configs')
            .insert(testDeviceConfig)
            .select();
          
          return { 
            success: !error, 
            error: error?.message,
            deviceConfigId: data?.[0]?.id
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} items)` : '';
      const extra = result.hasActiveConfig ? ' [Active Config Found]' : 
                   result.configId ? ` [Config: ${result.configId}]` :
                   result.deviceConfigId ? ` [Device Config: ${result.deviceConfigId}]` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}${extra}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testRealtimeDeviceUpdates() {
    console.log('\n📡 Testing Real-time Device Updates...');
    
    return new Promise((resolve) => {
      const tests = [];
      let completedTests = 0;
      const totalTests = 2;
      
      // Test 1: Device assignment real-time
      const deviceChannel = supabase
        .channel('test-device-assignments')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'device_assignments'
          }, 
          (payload) => {
            tests.push({
              name: 'Device Assignment Real-time',
              success: true,
              event: payload.eventType,
              entityId: payload.new?.entity_id || payload.old?.entity_id
            });
            completedTests++;
            if (completedTests >= totalTests) {
              cleanup();
            }
          }
        )
        .subscribe();

      // Test 2: Sensor readings real-time
      const sensorChannel = supabase
        .channel('test-sensor-readings')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sensor_readings'
          }, 
          (payload) => {
            tests.push({
              name: 'Sensor Readings Real-time',
              success: true,
              event: payload.eventType,
              entityId: payload.new?.entity_id || payload.old?.entity_id
            });
            completedTests++;
            if (completedTests >= totalTests) {
              cleanup();
            }
          }
        )
        .subscribe();

      // Trigger test events after a delay
      setTimeout(async () => {
        try {
          // Trigger device assignment update
          if (this.testDeviceId) {
            await supabase
              .from('device_assignments')
              .update({ friendly_name: `Updated Test Device ${Date.now()}` })
              .eq('id', this.testDeviceId);
          }
          
          // Trigger sensor reading insert
          await supabase
            .from('sensor_readings')
            .insert({
              entity_id: `test.realtime_sensor_${Date.now()}`,
              state: '25.0',
              attributes: { unit_of_measurement: '°C' },
              last_changed: new Date().toISOString(),
              last_updated: new Date().toISOString()
            });
        } catch (error) {
          console.log('⚠️  Could not trigger test events:', error.message);
        }
      }, 2000);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        // Add failed tests for any that didn't complete
        if (tests.length === 0) {
          tests.push({
            name: 'Device Assignment Real-time',
            success: false,
            error: 'No real-time events received (timeout)'
          });
        }
        if (tests.length === 1) {
          tests.push({
            name: 'Sensor Readings Real-time',
            success: false,
            error: 'No real-time events received (timeout)'
          });
        }
        cleanup();
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        deviceChannel.unsubscribe();
        sensorChannel.unsubscribe();
        
        // Log results
        tests.forEach(test => {
          const status = test.success ? '✅' : '❌';
          const event = test.event ? ` [${test.event}]` : '';
          const entity = test.entityId ? ` [${test.entityId}]` : '';
          console.log(`  ${status} ${test.name}${event}${entity}`);
          if (test.error) {
            console.log(`    📝 ${test.error}`);
          }
        });
        
        resolve(tests);
      };
    });
  }

  async testTaskLogging() {
    console.log('\n📝 Testing Task Logging...');
    
    const tests = [
      {
        name: 'Read Task Logs',
        test: async () => {
          const { data, error } = await supabase
            .from('task_logs')
            .select(`
              id,
              task_type,
              status,
              details,
              created_at,
              completed_at
            `)
            .order('created_at', { ascending: false })
            .limit(10);
          
          return { 
            success: !error, 
            error: error?.message,
            count: data?.length || 0
          };
        }
      },
      {
        name: 'Create Test Task Log',
        test: async () => {
          const testTask = {
            task_type: 'device_sync',
            status: 'pending',
            details: {
              description: 'Test device synchronization task',
              device_count: 5,
              created_by: 'test_script'
            }
          };
          
          const { data, error } = await supabase
            .from('task_logs')
            .insert(testTask)
            .select();
          
          return { 
            success: !error, 
            error: error?.message,
            taskId: data?.[0]?.id
          };
        }
      },
      {
        name: 'Update Task Status',
        test: async () => {
          // Get a recent task to update
          const { data: tasks } = await supabase
            .from('task_logs')
            .select('id')
            .eq('status', 'pending')
            .limit(1);
            
          if (!tasks || tasks.length === 0) {
            return { success: false, error: 'No pending tasks to update' };
          }
          
          const { data, error } = await supabase
            .from('task_logs')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              details: { result: 'Test completed successfully' }
            })
            .eq('id', tasks[0].id)
            .select();
          
          return { 
            success: !error, 
            error: error?.message,
            updatedTaskId: tasks[0].id
          };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} tasks)` : '';
      const extra = result.taskId ? ` [Task: ${result.taskId}]` :
                   result.updatedTaskId ? ` [Updated: ${result.updatedTaskId}]` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}${extra}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up test device assignment
      if (this.testDeviceId) {
        await supabase
          .from('device_assignments')
          .delete()
          .eq('id', this.testDeviceId);
        console.log(`  ✅ Cleaned up test device: ${this.testDeviceId}`);
      }
      
      // Clean up test sensor readings
      await supabase
        .from('sensor_readings')
        .delete()
        .like('entity_id', 'test.%');
      console.log('  ✅ Cleaned up test sensor readings');
      
      // Clean up test HA configs
      if (this.currentUser) {
        await supabase
          .from('user_home_assistant_configs')
          .delete()
          .eq('user_id', this.currentUser.id)
          .eq('is_active', false)
          .like('ha_url', '%test%');
        console.log('  ✅ Cleaned up test HA configs');
      }
      
      // Clean up test task logs
      await supabase
        .from('task_logs')
        .delete()
        .eq('task_type', 'device_sync')
        .like('details->created_by', 'test_script');
      console.log('  ✅ Cleaned up test task logs');
      
    } catch (error) {
      console.log(`  ⚠️  Cleanup warning: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting IoT Integration Tests...\n');
    
    // Get current user
    this.currentUser = await this.getCurrentUser();
    
    if (this.currentUser) {
      console.log(`👤 Testing as: ${this.currentUser.email}`);
      console.log(`🏷️  Role: ${this.currentUser.role || 'unknown'}\n`);
    } else {
      console.log('👤 Testing as: Anonymous user\n');
    }

    // Run all test suites
    const deviceResults = await this.testDeviceAssignmentAccess();
    const sensorResults = await this.testSensorDataFlow();
    const haResults = await this.testHomeAssistantIntegration();
    const realtimeResults = await this.testRealtimeDeviceUpdates();
    const taskResults = await this.testTaskLogging();

    // Combine all results
    this.results = [
      ...deviceResults.map(r => ({ category: 'device_assignments', ...r })),
      ...sensorResults.map(r => ({ category: 'sensor_data', ...r })),
      ...haResults.map(r => ({ category: 'home_assistant', ...r })),
      ...realtimeResults.map(r => ({ category: 'realtime_updates', ...r })),
      ...taskResults.map(r => ({ category: 'task_logging', ...r }))
    ];

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 IOT INTEGRATION TEST REPORT');
    console.log('==============================');
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);

    // Group by category
    const byCategory = this.results.reduce((acc, result) => {
      const category = result.category || 'unknown';
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, results]) => {
      console.log(`\n${category.toUpperCase().replace('_', ' ')}:`);
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const name = result.name;
        console.log(`  ${status} ${name}`);
        if (result.error && !result.success) {
          console.log(`    📝 ${result.error}`);
        }
      });
    });

    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    const failed = this.results.filter(r => !r.success);
    
    if (failed.length === 0) {
      console.log('✅ All IoT integration tests passed!');
    } else {
      console.log('❌ Issues found with IoT integration:');
      
      failed.forEach(result => {
        if (result.error?.includes('RLS') || result.error?.includes('policy')) {
          console.log(`  • ${result.name}: Check RLS policies for IoT tables`);
        } else if (result.error?.includes('timeout')) {
          console.log(`  • ${result.name}: Real-time subscription may be blocked`);
        } else {
          console.log(`  • ${result.name}: ${result.error}`);
        }
      });
      
      console.log('\n💡 Common fixes:');
      console.log('  1. Verify device_assignments table has proper RLS policies');
      console.log('  2. Check sensor_readings table permissions and real-time enablement');
      console.log('  3. Ensure Home Assistant integration tables are accessible');
      console.log('  4. Test real-time subscriptions for device updates');
      console.log('  5. Verify task logging system is working correctly');
    }

    return {
      total,
      successful,
      failed: total - successful,
      results: this.results
    };
  }
}

// Run the tests
async function main() {
  const tester = new IoTIntegrationTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Cleanup test data
    await tester.cleanup();
    
    // Exit with error code if tests failed
    if (report.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner failed:', error.message);
    await tester.cleanup();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { IoTIntegrationTester }; 