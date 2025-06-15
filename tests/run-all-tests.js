// run-all-tests.js - Enhanced Test Runner with Authentication
import testConfig, { 
    setupTestDatabase, 
    cleanupTestDatabase, 
    logTest,
    TEST_CONFIG,
    createAuthenticatedChannel
} from './test-config.js';

// Use configured Supabase client with authentication
const { supabase } = testConfig;

// Test Results Tracking
let results = {
    realtime: { passed: 0, failed: 0, total: 0 },
    auth: { passed: 0, failed: 0, total: 0 },
    iot: { passed: 0, failed: 0, total: 0 },
    overall: { passed: 0, failed: 0, total: 0 }
};

// Enhanced test runner with error handling
async function runTest(testName, testFunction, category = 'overall') {
    results[category].total++;
    results.overall.total++;
    
    try {
        logTest(testName, 'RUNNING');
        await testFunction();
        logTest(testName, 'PASSED');
        results[category].passed++;
        results.overall.passed++;
        return true;
    } catch (error) {
        logTest(testName, 'FAILED', error.message);
        results[category].failed++;
        results.overall.failed++;
        return false;
    }
}

// Real-time Subscriptions Tests
async function testRealtimeSubscriptions() {
    console.log('\n🔄 Testing Real-time Subscriptions...\n');
    
    await runTest('Realtime Channel Connection', async () => {
        const channel = createAuthenticatedChannel('test-channel');
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Channel connection timeout'));
            }, 5000);
            
            channel
                .on('presence', { event: 'sync' }, () => {
                    clearTimeout(timeout);
                    resolve();
                })
                .subscribe();
        });
    }, 'realtime');

    await runTest('Device Assignments Subscription', async () => {
        const channel = createAuthenticatedChannel('device_assignments', {
            event: '*',
            schema: 'public',
            table: 'device_assignments'
        });
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Device assignments subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'device_assignments' }, 
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    }
                )
                .subscribe();
        });
    }, 'realtime');

    await runTest('Sensor Readings Subscription', async () => {
        const channel = createAuthenticatedChannel('sensor_readings', {
            event: '*',
            schema: 'public',
            table: 'sensor_readings'
        });
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Sensor readings subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'sensor_readings' }, 
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    }
                )
                .subscribe();
        });
    }, 'realtime');

    await runTest('Schedules Subscription', async () => {
        const channel = createAuthenticatedChannel('schedules', {
            event: '*',
            schema: 'public',
            table: 'schedules'
        });
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Schedules subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'schedules' }, 
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    }
                )
                .subscribe();
        });
    }, 'realtime');

    await runTest('Automation Rules Subscription', async () => {
        const channel = createAuthenticatedChannel('automation_rules', {
            event: '*',
            schema: 'public',
            table: 'automation_rules'
        });
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Automation rules subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'automation_rules' }, 
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    }
                )
                .subscribe();
        });
    }, 'realtime');

    await runTest('Home Assistant Configs Subscription', async () => {
        const channel = createAuthenticatedChannel('user_home_assistant_configs', {
            event: '*',
            schema: 'public',
            table: 'user_home_assistant_configs'
        });
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Home Assistant configs subscription timeout'));
            }, 5000);
            
            channel
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'user_home_assistant_configs' }, 
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    }
                )
                .subscribe();
        });
    }, 'realtime');
}

// Authentication & Permissions Tests
async function testAuthenticationAndPermissions() {
    console.log('\n🔐 Testing Authentication & Permissions...\n');
    
    await runTest('User Authentication Status', async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw new Error(`Auth error: ${error.message}`);
        if (!user) throw new Error('No authenticated user found');
        console.log(`✓ Authenticated as: ${user.email || user.id}`);
    }, 'auth');

    await runTest('Read Device Assignments', async () => {
        const { data, error } = await supabase
            .from('device_assignments')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Device assignments read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} device assignments`);
    }, 'auth');

    await runTest('Read Sensor Readings', async () => {
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Sensor readings read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} sensor readings`);
    }, 'auth');

    await runTest('Read Task Logs', async () => {
        const { data, error } = await supabase
            .from('task_logs')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Task logs read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} task logs`);
    }, 'auth');

    await runTest('Read User Profiles', async () => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`User profiles read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} user profiles`);
    }, 'auth');

    await runTest('Read Farms', async () => {
        const { data, error } = await supabase
            .from('farms')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Farms read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} farms`);
    }, 'auth');

    await runTest('Read Schedules', async () => {
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Schedules read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} schedules`);
    }, 'auth');

    await runTest('Read Home Assistant Configs', async () => {
        const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Home Assistant configs read error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} Home Assistant configs`);
    }, 'auth');
}

// IoT Integration Tests (Updated for Fixed Schema)
async function testIoTIntegration() {
    console.log('\n🔌 Testing IoT Integration...\n');
    
    await runTest('Device Assignments Schema', async () => {
        const { data, error } = await supabase
            .from('device_assignments')
            .select('id, entity_id, entity_type, device_class, friendly_name')
            .limit(1);
        
        if (error) throw new Error(`Schema test error: ${error.message}`);
        
        if (data.length > 0) {
            const device = data[0];
            if (!device.hasOwnProperty('device_class')) {
                throw new Error('Missing device_class column');
            }
        }
        console.log('✓ Device assignments schema is correct');
    }, 'iot');

    await runTest('Sensor Readings Schema', async () => {
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('id, device_assignment_id, entity_id, reading_type, value, unit, timestamp')
            .limit(1);
        
        if (error) throw new Error(`Schema test error: ${error.message}`);
        
        // Check if we can query with entity_id (new column)
        const { error: entityError } = await supabase
            .from('sensor_readings')
            .select('entity_id')
            .not('entity_id', 'is', null)
            .limit(1);
        
        if (entityError) throw new Error(`Entity ID column test error: ${entityError.message}`);
        console.log('✓ Sensor readings schema is correct');
    }, 'iot');

    await runTest('Task Logs Schema', async () => {
        const { data, error } = await supabase
            .from('task_logs')
            .select('id, task_id, task_type, status, details, priority, success')
            .limit(1);
        
        if (error) throw new Error(`Schema test error: ${error.message}`);
        
        if (data.length > 0) {
            const log = data[0];
            if (!log.hasOwnProperty('status') || !log.hasOwnProperty('details')) {
                throw new Error('Missing status or details columns');
            }
        }
        console.log('✓ Task logs schema is correct');
    }, 'iot');

    await runTest('Insert Test Sensor Reading', async () => {
        const { data: deviceData } = await supabase
            .from('device_assignments')
            .select('id, entity_id')
            .limit(1)
            .single();
        
        if (!deviceData) {
            // Create test device first
            const { data: newDevice, error: deviceError } = await supabase
                .from('device_assignments')
                .insert({
                    entity_id: 'test-sensor-001',
                    entity_type: 'sensor',
                    device_class: 'temperature',
                    friendly_name: 'Test Temperature Sensor'
                })
                .select()
                .single();
            
            if (deviceError) throw new Error(`Device creation error: ${deviceError.message}`);
            deviceData = newDevice;
        }
        
        const { error } = await supabase
            .from('sensor_readings')
            .insert({
                device_assignment_id: deviceData.id,
                entity_id: deviceData.entity_id,
                reading_type: 'temperature',
                value: 23.5,
                unit: '°C'
            });
        
        if (error) throw new Error(`Insert error: ${error.message}`);
        console.log('✓ Test sensor reading inserted successfully');
    }, 'iot');

    await runTest('Insert Test Task Log', async () => {
        const { error } = await supabase
            .from('task_logs')
            .insert({
                task_id: `test-task-${Date.now()}`,
                task_type: 'sensor_reading',
                status: 'completed',
                details: { result: 'success', timestamp: new Date().toISOString() },
                priority: 'normal',
                success: true,
                execution_time: 150
            });
        
        if (error) throw new Error(`Insert error: ${error.message}`);
        console.log('✓ Test task log inserted successfully');
    }, 'iot');

    await runTest('Query by Entity ID', async () => {
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .not('entity_id', 'is', null)
            .limit(5);
        
        if (error) throw new Error(`Query error: ${error.message}`);
        console.log(`✓ Found ${data.length} sensor readings with entity_id`);
    }, 'iot');

    await runTest('Query by Device Class', async () => {
        const { data, error } = await supabase
            .from('device_assignments')
            .select('*')
            .not('device_class', 'is', null)
            .limit(5);
        
        if (error) throw new Error(`Query error: ${error.message}`);
        console.log(`✓ Found ${data.length} devices with device_class`);
    }, 'iot');

    await runTest('Query Task Logs by Status', async () => {
        const { data, error } = await supabase
            .from('task_logs')
            .select('*')
            .eq('status', 'completed')
            .limit(5);
        
        if (error) throw new Error(`Query error: ${error.message}`);
        console.log(`✓ Found ${data.length} completed task logs`);
    }, 'iot');

    await runTest('Integrations Table Access', async () => {
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .limit(5);
        
        if (error) throw new Error(`Integrations access error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} integration records`);
    }, 'iot');

    await runTest('Home Assistant Integration Test', async () => {
        const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .select('id, name, url, enabled, last_tested')
            .limit(3);
        
        if (error) throw new Error(`HA integration error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} Home Assistant configurations`);
    }, 'iot');

    await runTest('Device Config Integration', async () => {
        const { data, error } = await supabase
            .from('user_device_configs')
            .select('id, entity_id, device_type, friendly_name')
            .limit(3);
        
        if (error) throw new Error(`Device config error: ${error.message}`);
        console.log(`✓ Retrieved ${data.length} device configurations`);
    }, 'iot');
}

// Helper function to print results summary
function printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const categories = [
        { name: 'Real-time Subscriptions', key: 'realtime' },
        { name: 'Authentication & Permissions', key: 'auth' },
        { name: 'IoT Integration', key: 'iot' }
    ];
    
    categories.forEach(category => {
        const result = results[category.key];
        const successRate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : '0.0';
        const status = successRate >= 95 ? '🟢' : successRate >= 70 ? '🟡' : '🔴';
        
        console.log(`${status} ${category.name}:`);
        console.log(`   Passed: ${result.passed}/${result.total} (${successRate}%)`);
    });
    
    const overallSuccessRate = results.overall.total > 0 ? 
        ((results.overall.passed / results.overall.total) * 100).toFixed(1) : '0.0';
    
    console.log('\n📊 OVERALL RESULTS:');
    console.log(`   Total Tests: ${results.overall.total}`);
    console.log(`   Passed: ${results.overall.passed}`);
    console.log(`   Failed: ${results.overall.failed}`);
    console.log(`   Success Rate: ${overallSuccessRate}%`);
    
    const status = overallSuccessRate >= 95 ? '🎉 EXCELLENT' : 
                  overallSuccessRate >= 80 ? '✅ GOOD' : 
                  overallSuccessRate >= 60 ? '⚠️  NEEDS IMPROVEMENT' : '❌ CRITICAL ISSUES';
    
    console.log(`   Status: ${status}`);
    console.log('='.repeat(60));
    
    // Health assessment
    if (overallSuccessRate >= 95) {
        console.log('🎯 System is healthy and ready for production!');
    } else if (overallSuccessRate >= 80) {
        console.log('✅ System is mostly healthy with minor issues.');
    } else if (overallSuccessRate >= 60) {
        console.log('⚠️  System has significant issues that need attention.');
    } else {
        console.log('❌ System has critical issues requiring immediate fixes.');
    }
}

// Main test execution
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite...');
    console.log(`📊 Target Success Rate: 95%+ (Healthy Application Benchmark)`);
    
    try {
        // Setup test environment
        await setupTestDatabase();
        
        // Run test suites
        await testRealtimeSubscriptions();
        await testAuthenticationAndPermissions();
        await testIoTIntegration();
        
        // Cleanup
        await cleanupTestDatabase();
        
        // Print final results
        printResults();
        
        // Exit with appropriate code
        const successRate = (results.overall.passed / results.overall.total) * 100;
        process.exit(successRate >= 95 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Test suite failed to complete:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
} 