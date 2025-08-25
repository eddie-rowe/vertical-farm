#!/usr/bin/env node

/**
 * Comprehensive test runner for the New Grow Setup test suite
 * Orchestrates unit, integration, E2E, and performance tests
 * 
 * Usage:
 *   node run-comprehensive-tests.js [options]
 * 
 * Options:
 *   --unit          Run unit tests only
 *   --integration   Run integration tests only
 *   --e2e           Run E2E tests only
 *   --performance   Run performance tests only
 *   --coverage      Generate coverage report
 *   --watch         Run in watch mode
 *   --ci            Run in CI mode with strict settings
 *   --verbose       Verbose output
 *   --help          Show help
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testTypes: {
    unit: {
      pattern: '**/__tests__/**/*.test.ts',
      exclude: ['**/e2e/**', '**/performance.test.ts'],
      timeout: 10000,
      maxConcurrency: 4,
    },
    integration: {
      pattern: '**/__tests__/**/*.test.tsx',
      exclude: ['**/e2e/**'],
      timeout: 30000,
      maxConcurrency: 2,
    },
    e2e: {
      pattern: '**/tests/e2e/**/*.spec.ts',
      timeout: 120000,
      maxConcurrency: 1,
    },
    performance: {
      pattern: '**/__tests__/**/performance.test.ts',
      timeout: 60000,
      maxConcurrency: 1,
    },
  },
  coverage: {
    threshold: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    exclude: [
      '**/node_modules/**',
      '**/__tests__/**',
      '**/tests/**',
      '**/*.d.ts',
      '**/coverage/**',
    ],
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  unit: args.includes('--unit'),
  integration: args.includes('--integration'),
  e2e: args.includes('--e2e'),
  performance: args.includes('--performance'),
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help'),
};

// Show help
if (options.help) {
  console.log(`
New Grow Setup Comprehensive Test Runner

Usage: node run-comprehensive-tests.js [options]

Options:
  --unit          Run unit tests only
  --integration   Run integration tests only  
  --e2e           Run E2E tests only
  --performance   Run performance tests only
  --coverage      Generate coverage report
  --watch         Run in watch mode
  --ci            Run in CI mode with strict settings
  --verbose       Verbose output
  --help          Show this help

Examples:
  node run-comprehensive-tests.js                    # Run all tests
  node run-comprehensive-tests.js --unit --coverage  # Run unit tests with coverage
  node run-comprehensive-tests.js --e2e --ci         # Run E2E tests in CI mode
  node run-comprehensive-tests.js --watch            # Run all tests in watch mode
`);
  process.exit(0);
}

// Determine which test types to run
const testTypesToRun = [];
if (options.unit) testTypesToRun.push('unit');
if (options.integration) testTypesToRun.push('integration');
if (options.e2e) testTypesToRun.push('e2e');
if (options.performance) testTypesToRun.push('performance');

// If no specific test types specified, run all
if (testTypesToRun.length === 0) {
  testTypesToRun.push('unit', 'integration', 'e2e', 'performance');
}

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const runCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    if (options.verbose || options.ci) {
      log(`Running: ${command}`);
    }

    // Sanitize command to prevent injection attacks
    const [cmd, ...args] = command.split(' ').filter(arg => arg.trim() !== '');
    
    // Whitelist of allowed commands for test execution
    const allowedCommands = ['npm', 'npx', 'node', 'jest', 'eslint', 'tsc', 'playwright'];
    if (!allowedCommands.some(allowed => cmd === allowed || cmd.endsWith(`/${allowed}`) || cmd.endsWith(`\\${allowed}`))) {
      reject(new Error(`Command '${cmd}' is not in the allowed list for security reasons`));
      return;
    }

    // Security: Using spawn with separated args and validated cmd (not shell: true)
    // The command is validated against allowlist above to prevent injection
    const child = spawn(cmd, args, {
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    if (!options.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

const generateTestReport = (results) => {
  const reportPath = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
    results,
    environment: {
      node: process.version,
      platform: process.platform,
      ci: !!process.env.CI,
    },
  };

  const reportFile = path.join(reportPath, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`Test report generated: ${reportFile}`, 'info');
  return report;
};

// Test runners
const runners = {
  async unit() {
    log('Running unit tests...');
    
    const jestConfig = {
      testMatch: [config.testTypes.unit.pattern],
      testPathIgnorePatterns: config.testTypes.unit.exclude,
      testTimeout: config.testTypes.unit.timeout,
      maxConcurrency: config.testTypes.unit.maxConcurrency,
      collectCoverage: options.coverage,
      coverageThreshold: options.coverage ? config.coverage.threshold : undefined,
      verbose: options.verbose,
    };

    const jestCommand = `npx jest ${Object.entries(jestConfig)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}` : '';
        }
        if (Array.isArray(value)) {
          return `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()} ${value.join(' ')}`;
        }
        return `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()} ${value}`;
      })
      .filter(Boolean)
      .join(' ')}`;

    try {
      const result = await runCommand(jestCommand, { verbose: options.verbose });
      log('Unit tests completed successfully', 'success');
      return { type: 'unit', success: true, output: result.stdout };
    } catch (error) {
      log(`Unit tests failed: ${error.message}`, 'error');
      return { type: 'unit', success: false, error: error.message };
    }
  },

  async integration() {
    log('Running integration tests...');
    
    const jestCommand = `npx jest --testMatch="**/__tests__/**/*.test.tsx" --testTimeout=${config.testTypes.integration.timeout} --maxConcurrency=${config.testTypes.integration.maxConcurrency}${options.verbose ? ' --verbose' : ''}`;

    try {
      const result = await runCommand(jestCommand, { verbose: options.verbose });
      log('Integration tests completed successfully', 'success');
      return { type: 'integration', success: true, output: result.stdout };
    } catch (error) {
      log(`Integration tests failed: ${error.message}`, 'error');
      return { type: 'integration', success: false, error: error.message };
    }
  },

  async e2e() {
    log('Running E2E tests...');
    
    // Check if Playwright is available
    try {
      await runCommand('npx playwright --version', { verbose: false });
    } catch (error) {
      log('Playwright not found, installing...', 'warning');
      await runCommand('npx playwright install', { verbose: options.verbose });
    }

    const playwrightCommand = `npx playwright test --timeout=${config.testTypes.e2e.timeout} --workers=${config.testTypes.e2e.maxConcurrency}${options.ci ? ' --reporter=github' : ''}${options.verbose ? ' --verbose' : ''}`;

    try {
      const result = await runCommand(playwrightCommand, { 
        verbose: options.verbose,
        env: {
          CI: options.ci ? 'true' : 'false',
        },
      });
      log('E2E tests completed successfully', 'success');
      return { type: 'e2e', success: true, output: result.stdout };
    } catch (error) {
      log(`E2E tests failed: ${error.message}`, 'error');
      return { type: 'e2e', success: false, error: error.message };
    }
  },

  async performance() {
    log('Running performance tests...');
    
    const jestCommand = `npx jest --testMatch="**/__tests__/**/performance.test.ts" --testTimeout=${config.testTypes.performance.timeout} --maxConcurrency=${config.testTypes.performance.maxConcurrency} --silent${options.verbose ? ' --verbose' : ''}`;

    try {
      const result = await runCommand(jestCommand, { verbose: options.verbose });
      log('Performance tests completed successfully', 'success');
      return { type: 'performance', success: true, output: result.stdout };
    } catch (error) {
      log(`Performance tests failed: ${error.message}`, 'error');
      return { type: 'performance', success: false, error: error.message };
    }
  },
};

// Main execution function
async function main() {
  log('Starting comprehensive test suite...', 'info');
  log(`Test types to run: ${testTypesToRun.join(', ')}`);
  
  if (options.ci) {
    log('Running in CI mode with strict settings', 'info');
  }
  
  if (options.watch) {
    log('Watch mode is not supported for comprehensive test runner', 'warning');
    log('Use individual test commands with --watch for watch mode', 'info');
    process.exit(1);
  }

  const results = [];
  let hasFailures = false;

  // Run tests sequentially to avoid resource conflicts
  for (const testType of testTypesToRun) {
    if (runners[testType]) {
      try {
        const result = await runners[testType]();
        results.push(result);
        
        if (!result.success) {
          hasFailures = true;
          if (options.ci) {
            // In CI mode, fail fast
            log('Failing fast in CI mode due to test failure', 'error');
            break;
          }
        }
      } catch (error) {
        log(`Failed to run ${testType} tests: ${error.message}`, 'error');
        results.push({ type: testType, success: false, error: error.message });
        hasFailures = true;
        
        if (options.ci) {
          break;
        }
      }
    } else {
      log(`Unknown test type: ${testType}`, 'error');
      hasFailures = true;
    }
  }

  // Generate test report
  const report = generateTestReport(results);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total test suites: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log('='.repeat(60));

  // Print detailed results
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${result.type.toUpperCase()} tests`);
    
    if (!result.success && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('\n');

  // Coverage report location
  if (options.coverage && !hasFailures) {
    const coveragePath = path.join(process.cwd(), 'coverage');
    if (fs.existsSync(coveragePath)) {
      log(`Coverage report available at: ${path.join(coveragePath, 'lcov-report/index.html')}`, 'info');
    }
  }

  // Exit with appropriate code
  if (hasFailures) {
    log('Some tests failed', 'error');
    process.exit(1);
  } else {
    log('All tests passed!', 'success');
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('Test runner interrupted', 'warning');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('Test runner terminated', 'warning');
  process.exit(143);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});