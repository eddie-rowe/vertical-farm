#!/usr/bin/env node

/**
 * Master Test Runner for Vertical Farm Application
 * Runs all test suites and provides comprehensive reporting
 */

// Load environment variables from root .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { RealtimeSubscriptionTester } = require('../integration/test-realtime-subscriptions');
const { AuthPermissionTester } = require('../auth/test-auth-permissions');
const { IoTIntegrationTester } = require('../iot/test-iot-integration');

class MasterTestRunner {
  constructor() {
    this.results = {
      realtime: null,
      auth: null,
      iot: null
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 VERTICAL FARM APPLICATION - COMPREHENSIVE TEST SUITE');
    console.log('======================================================');
    console.log(`Started at: ${new Date().toISOString()}\n`);

    try {
      // Run Real-time Subscription Tests
      console.log('1️⃣  REAL-TIME SUBSCRIPTIONS');
      console.log('===========================');
      const realtimeTester = new RealtimeSubscriptionTester();
      this.results.realtime = await realtimeTester.runAllTests();
      realtimeTester.cleanup();

      console.log('\n' + '='.repeat(60) + '\n');

      // Run Authentication & Permission Tests
      console.log('2️⃣  AUTHENTICATION & PERMISSIONS');
      console.log('=================================');
      const authTester = new AuthPermissionTester();
      this.results.auth = await authTester.runAllTests();

      console.log('\n' + '='.repeat(60) + '\n');

      // Run IoT Integration Tests
      console.log('3️⃣  IOT INTEGRATION');
      console.log('===================');
      const iotTester = new IoTIntegrationTester();
      this.results.iot = await iotTester.runAllTests();
      await iotTester.cleanup();

      console.log('\n' + '='.repeat(60) + '\n');

      // Generate comprehensive report
      this.generateMasterReport();

    } catch (error) {
      console.error('\n💥 Master test runner failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  generateMasterReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);

    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    console.log(`Duration: ${duration}s`);
    console.log(`Completed: ${new Date().toISOString()}\n`);

    // Calculate totals
    const totals = {
      total: 0,
      successful: 0,
      failed: 0
    };

    Object.values(this.results).forEach(result => {
      if (result) {
        totals.total += result.total;
        totals.successful += result.successful;
        totals.failed += result.failed;
      }
    });

    // Overall status
    const overallStatus = totals.failed === 0 ? '✅ PASS' : '❌ FAIL';
    const successRate = totals.total > 0 ? ((totals.successful / totals.total) * 100).toFixed(1) : 0;

    console.log(`🎯 OVERALL STATUS: ${overallStatus}`);
    console.log(`📈 SUCCESS RATE: ${successRate}% (${totals.successful}/${totals.total})`);
    console.log(`❌ FAILED TESTS: ${totals.failed}\n`);

    // Detailed breakdown
    console.log('📋 TEST SUITE BREAKDOWN:');
    console.log('========================');

    const suites = [
      { name: 'Real-time Subscriptions', key: 'realtime', icon: '📡' },
      { name: 'Authentication & Permissions', key: 'auth', icon: '🔐' },
      { name: 'IoT Integration', key: 'iot', icon: '🔌' }
    ];

    suites.forEach(suite => {
      const result = this.results[suite.key];
      if (result) {
        const status = result.failed === 0 ? '✅' : '❌';
        const rate = result.total > 0 ? ((result.successful / result.total) * 100).toFixed(1) : 0;
        console.log(`${suite.icon} ${suite.name}: ${status} ${rate}% (${result.successful}/${result.total})`);
      } else {
        console.log(`${suite.icon} ${suite.name}: ⚠️  Not run`);
      }
    });

    // Critical issues summary
    console.log('\n🚨 CRITICAL ISSUES:');
    console.log('==================');

    let hasCriticalIssues = false;

    Object.entries(this.results).forEach(([testType, result]) => {
      if (result && result.failed > 0) {
        const criticalFailures = result.results?.filter(r => 
          !r.success && (
            r.error?.includes('RLS') || 
            r.error?.includes('permission') ||
            r.error?.includes('Channel error') ||
            r.error?.includes('timeout')
          )
        ) || [];

        if (criticalFailures.length > 0) {
          hasCriticalIssues = true;
          console.log(`\n${testType.toUpperCase()}:`);
          criticalFailures.forEach(failure => {
            console.log(`  ❌ ${failure.name || failure.table}: ${failure.error}`);
          });
        }
      }
    });

    if (!hasCriticalIssues) {
      console.log('✅ No critical issues detected!');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');

    if (totals.failed === 0) {
      console.log('🎉 Excellent! All tests passed. Your application is ready for production.');
      console.log('\n📋 Suggested next steps:');
      console.log('  1. Run these tests regularly as part of your CI/CD pipeline');
      console.log('  2. Monitor real-time subscription performance in production');
      console.log('  3. Set up automated alerts for authentication failures');
      console.log('  4. Consider load testing with multiple concurrent users');
    } else {
      console.log('⚠️  Issues detected that need attention:');
      
      // Real-time issues
      if (this.results.realtime?.failed > 0) {
        console.log('\n📡 Real-time Subscriptions:');
        console.log('  • Check RLS policies on tables with real-time enabled');
        console.log('  • Verify user permissions for subscription filters');
        console.log('  • Test with different user roles');
      }

      // Auth issues
      if (this.results.auth?.failed > 0) {
        console.log('\n🔐 Authentication & Permissions:');
        console.log('  • Review RLS policies for role-based access');
        console.log('  • Check security definer functions');
        console.log('  • Verify user role assignments');
      }

      // IoT issues
      if (this.results.iot?.failed > 0) {
        console.log('\n🔌 IoT Integration:');
        console.log('  • Check device assignment table permissions');
        console.log('  • Verify sensor data flow and real-time updates');
        console.log('  • Test Home Assistant integration endpoints');
      }

      console.log('\n🔧 Priority Actions:');
      console.log('  1. Fix RLS policies that are blocking legitimate access');
      console.log('  2. Test with different user roles (admin, farm_manager, operator)');
      console.log('  3. Verify real-time subscriptions work for all critical tables');
      console.log('  4. Re-run tests after fixes to confirm resolution');
    }

    // Exit with appropriate code
    if (totals.failed > 0) {
      console.log('\n❌ Tests failed - see issues above');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAllTests();
}

module.exports = { MasterTestRunner }; 