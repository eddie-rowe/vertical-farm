#!/usr/bin/env node

/**
 * Authentication & User Role Permission Testing Script
 * Tests user authentication and role-based access after RLS policy changes
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
const ROLE_TESTS = {
  admin: {
    should_access: ['user_profiles', 'farms', 'device_assignments', 'user_home_assistant_configs'],
    should_modify: ['farms', 'device_assignments'],
    description: 'Admin should have full access to all resources'
  },
  farm_manager: {
    should_access: ['farms', 'device_assignments', 'user_home_assistant_configs'],
    should_modify: ['farms', 'device_assignments'],
    description: 'Farm manager should access their own farms and devices'
  },
  operator: {
    should_access: ['farms', 'device_assignments'],
    should_modify: ['device_assignments'],
    description: 'Operator should have limited access to farm operations'
  },
  ha_power_user: {
    should_access: ['user_home_assistant_configs', 'user_device_configs', 'device_assignments'],
    should_modify: ['user_home_assistant_configs', 'user_device_configs'],
    description: 'HA power user should manage Home Assistant integrations'
  }
};

class AuthPermissionTester {
  constructor() {
    this.results = [];
    this.currentUser = null;
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error getting current user:', error.message);
        return null;
      }
      
      if (!user) {
        console.log('⚠️  No authenticated user');
        return null;
      }

      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error getting user profile:', profileError.message);
        return { ...user, role: 'unknown' };
      }

      return { ...user, ...profile };
    } catch (error) {
      console.error('❌ Exception getting user:', error.message);
      return null;
    }
  }

  async testTableAccess(tableName, operation = 'SELECT') {
    console.log(`  📋 Testing ${operation} access to ${tableName}...`);
    
    try {
      let query;
      
      switch (operation.toLowerCase()) {
        case 'select':
          query = supabase.from(tableName).select('id').limit(1);
          break;
        case 'insert':
          // Test with minimal data - will likely fail but we want to see the error type
          query = supabase.from(tableName).insert({ test: true });
          break;
        case 'update':
          query = supabase.from(tableName).update({ updated_at: new Date().toISOString() }).eq('id', 'test');
          break;
        case 'delete':
          query = supabase.from(tableName).delete().eq('id', 'test');
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      const { data, error } = await query;
      
      if (error) {
        // Check if it's a permission error vs other error
        if (error.message.includes('RLS') || 
            error.message.includes('permission') || 
            error.message.includes('policy') ||
            error.code === 'PGRST116') {
          return { success: false, error: 'RLS_BLOCKED', message: error.message };
        } else {
          return { success: false, error: 'OTHER_ERROR', message: error.message };
        }
      }
      
      return { success: true, data: data };
      
    } catch (error) {
      return { success: false, error: 'EXCEPTION', message: error.message };
    }
  }

  async testUserScopedAccess() {
    console.log('\n👤 Testing User-Scoped Access...');
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user for user-scoped tests');
      return [];
    }

    const tests = [
      {
        name: 'Own Profile Access',
        test: async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', this.currentUser.id);
          return { success: !error, error: error?.message };
        }
      },
      {
        name: 'Other User Profile Access',
        test: async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .neq('id', this.currentUser.id)
            .limit(1);
          // Should fail for non-admin users
          return { 
            success: this.currentUser.role === 'admin' ? !error : !!error,
            error: error?.message,
            expected: this.currentUser.role === 'admin' ? 'success' : 'blocked'
          };
        }
      },
      {
        name: 'Own HA Configs Access',
        test: async () => {
          const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .select('*')
            .eq('user_id', this.currentUser.id);
          return { success: !error, error: error?.message };
        }
      },
      {
        name: 'Other User HA Configs Access',
        test: async () => {
          const { data, error } = await supabase
            .from('user_home_assistant_configs')
            .select('*')
            .neq('user_id', this.currentUser.id)
            .limit(1);
          // Should fail for non-admin users
          return { 
            success: this.currentUser.role === 'admin' ? !error : !!error,
            error: error?.message,
            expected: this.currentUser.role === 'admin' ? 'success' : 'blocked'
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
      const expected = result.expected ? ` (expected: ${result.expected})` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${expected}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testFarmAccess() {
    console.log('\n🏭 Testing Farm Access...');
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user for farm tests');
      return [];
    }

    const tests = [
      {
        name: 'Farm List Access',
        test: async () => {
          const { data, error } = await supabase
            .from('farms')
            .select('id, name, manager_id');
          return { success: !error, error: error?.message, count: data?.length || 0 };
        }
      },
      {
        name: 'Managed Farms Only',
        test: async () => {
          const { data, error } = await supabase
            .from('farms')
            .select('*')
            .eq('manager_id', this.currentUser.id);
          return { success: !error, error: error?.message, count: data?.length || 0 };
        }
      },
      {
        name: 'Farm Creation Test',
        test: async () => {
          const testFarm = {
            name: `Test Farm ${Date.now()}`,
            manager_id: this.currentUser.id,
            location: 'Test Location'
          };
          
          const { data, error } = await supabase
            .from('farms')
            .insert(testFarm)
            .select();
            
          // Clean up if successful
          if (data && data[0]) {
            await supabase.from('farms').delete().eq('id', data[0].id);
          }
          
          return { success: !error, error: error?.message };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} records)` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testDeviceAssignmentAccess() {
    console.log('\n🔌 Testing Device Assignment Access...');
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user for device tests');
      return [];
    }

    const tests = [
      {
        name: 'Device Assignment List',
        test: async () => {
          const { data, error } = await supabase
            .from('device_assignments')
            .select('*');
          return { success: !error, error: error?.message, count: data?.length || 0 };
        }
      },
      {
        name: 'Device Assignment Creation',
        test: async () => {
          const testAssignment = {
            entity_id: `test.device_${Date.now()}`,
            entity_type: 'test',
            friendly_name: 'Test Device',
            farm_id: null // Will need a real farm ID in practice
          };
          
          const { data, error } = await supabase
            .from('device_assignments')
            .insert(testAssignment)
            .select();
            
          // Clean up if successful
          if (data && data[0]) {
            await supabase.from('device_assignments').delete().eq('id', data[0].id);
          }
          
          return { success: !error, error: error?.message };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const count = result.count !== undefined ? ` (${result.count} records)` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${count}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testStorageAccess() {
    console.log('\n📁 Testing Storage Access...');
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user for storage tests');
      return [];
    }

    const tests = [
      {
        name: 'User Uploads Bucket',
        test: async () => {
          try {
            const { data, error } = await supabase.storage
              .from('user-uploads')
              .list(this.currentUser.id);
            return { success: !error, error: error?.message };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'Farm Documentation Bucket',
        test: async () => {
          try {
            const { data, error } = await supabase.storage
              .from('farm-documentation')
              .list();
            return { success: !error, error: error?.message };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'Device Manuals Bucket (Public)',
        test: async () => {
          try {
            const { data, error } = await supabase.storage
              .from('device-manuals')
              .list();
            return { success: !error, error: error?.message };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async testSecurityDefinerFunctions() {
    console.log('\n🔒 Testing Security Definer Functions...');
    
    const tests = [
      {
        name: 'is_admin() Function',
        test: async () => {
          try {
            const { data, error } = await supabase.rpc('is_admin');
            return { 
              success: !error, 
              error: error?.message,
              result: data,
              expected: this.currentUser?.role === 'admin'
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'get_user_accessible_farms() Function',
        test: async () => {
          try {
            const { data, error } = await supabase.rpc('get_user_accessible_farms');
            return { 
              success: !error, 
              error: error?.message,
              count: data?.length || 0
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'check_user_permissions() Function',
        test: async () => {
          try {
            const { data, error } = await supabase.rpc('check_user_permissions', { 
              target_table_name: 'farms' 
            });
            return { 
              success: !error, 
              error: error?.message,
              permissions: data
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      console.log(`  🔍 ${test.name}...`);
      const result = await test.test();
      results.push({ name: test.name, ...result });
      
      const status = result.success ? '✅' : '❌';
      const extra = result.count !== undefined ? ` (${result.count} items)` : 
                   result.result !== undefined ? ` (result: ${result.result})` : '';
      console.log(`    ${status} ${result.success ? 'Passed' : 'Failed'}${extra}`);
      if (result.error) {
        console.log(`    📝 ${result.error}`);
      }
    }

    return results;
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication & Permission Tests...\n');
    
    // Get current user
    this.currentUser = await this.getCurrentUser();
    
    if (!this.currentUser) {
      console.log('❌ No authenticated user - cannot run permission tests');
      console.log('💡 Please sign in to test user permissions');
      return { total: 0, successful: 0, failed: 0, results: [] };
    }

    console.log(`👤 Testing as: ${this.currentUser.email}`);
    console.log(`🏷️  Role: ${this.currentUser.role || 'unknown'}`);
    console.log(`🆔 User ID: ${this.currentUser.id}\n`);

    // Run all test suites
    const userScopedResults = await this.testUserScopedAccess();
    const farmResults = await this.testFarmAccess();
    const deviceResults = await this.testDeviceAssignmentAccess();
    const storageResults = await this.testStorageAccess();
    const functionResults = await this.testSecurityDefinerFunctions();

    // Combine all results
    this.results = [
      ...userScopedResults.map(r => ({ category: 'user_scoped', ...r })),
      ...farmResults.map(r => ({ category: 'farm_access', ...r })),
      ...deviceResults.map(r => ({ category: 'device_access', ...r })),
      ...storageResults.map(r => ({ category: 'storage_access', ...r })),
      ...functionResults.map(r => ({ category: 'security_functions', ...r }))
    ];

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 AUTHENTICATION & PERMISSION TEST REPORT');
    console.log('==========================================');
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    if (this.currentUser) {
      console.log(`👤 User: ${this.currentUser.email} (${this.currentUser.role})`);
    }

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

    // Role-specific recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    const failed = this.results.filter(r => !r.success);
    
    if (failed.length === 0) {
      console.log('✅ All authentication and permission tests passed!');
    } else {
      console.log('❌ Issues found with authentication/permissions:');
      
      failed.forEach(result => {
        if (result.error?.includes('RLS') || result.error?.includes('policy')) {
          console.log(`  • ${result.name}: RLS policy may be too restrictive`);
        } else if (result.error?.includes('permission')) {
          console.log(`  • ${result.name}: Check user role and permissions`);
        } else {
          console.log(`  • ${result.name}: ${result.error}`);
        }
      });
      
      console.log('\n💡 Common fixes:');
      console.log('  1. Verify user has correct role in user_profiles table');
      console.log('  2. Check RLS policies match user role expectations');
      console.log('  3. Ensure security definer functions are working');
      console.log('  4. Test with different user roles to verify role-based access');
      console.log('  5. Check storage bucket policies for file access');
    }

    return {
      total,
      successful,
      failed: total - successful,
      results: this.results,
      user: this.currentUser
    };
  }
}

// Run the tests
async function main() {
  const tester = new AuthPermissionTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Exit with error code if tests failed
    if (report.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AuthPermissionTester }; 