/**
 * Comprehensive test setup for the New Grow Setup testing suite
 * Provides utilities, mocks, and configuration for all test types
 * 
 * @group test-setup
 * @group configuration
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock performance API for Node.js
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    getEntries: () => [],
  } as unknown as Performance;
}

/**
 * Test environment configuration
 */
export const testConfig = {
  timeouts: {
    unit: 5000,        // 5 seconds for unit tests
    integration: 15000, // 15 seconds for integration tests
    e2e: 60000,        // 60 seconds for E2E tests
    performance: 10000, // 10 seconds for performance tests
  },
  retries: {
    unit: 0,           // No retries for unit tests
    integration: 1,    // 1 retry for integration tests
    e2e: 2,           // 2 retries for E2E tests
    performance: 0,    // No retries for performance tests
  },
  thresholds: {
    performance: {
      fast: 50,        // < 50ms for fast operations
      medium: 200,     // < 200ms for medium operations
      slow: 1000,      // < 1s for slow operations
      batch: 5000,     // < 5s for batch operations
    },
    coverage: {
      statements: 80,   // 80% statement coverage
      branches: 70,     // 70% branch coverage
      functions: 80,    // 80% function coverage
      lines: 80,        // 80% line coverage
    },
  },
};

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock function with specific behavior
   */
  createMockFn: <T extends (...args: unknown[]) => unknown>(
    implementation?: T,
    name?: string
  ): jest.MockedFunction<T> => {
    const mockFn = jest.fn(implementation) as unknown as jest.MockedFunction<T>;
    if (name) {
      Object.defineProperty(mockFn, 'name', { value: name });
    }
    return mockFn;
  },

  /**
   * Create a mock promise that resolves after a delay
   */
  createDelayedPromise: <T>(value: T, delay: number = 0): Promise<T> =>
    new Promise(resolve => setTimeout(() => resolve(value), delay)),

  /**
   * Create a mock promise that rejects after a delay
   */
  createDelayedRejection: (error: Error, delay: number = 0): Promise<never> =>
    new Promise((_, reject) => setTimeout(() => reject(error), delay)),

  /**
   * Generate a unique test ID
   */
  generateTestId: (): string => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Create a realistic timestamp
   */
  createTimestamp: (offsetDays: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  },

  /**
   * Deep clone an object for test mutations
   */
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),

  /**
   * Assert that a function throws with a specific message
   */
  expectToThrowWithMessage: async (
    fn: () => Promise<unknown> | unknown,
    expectedMessage: string
  ): Promise<void> => {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(expectedMessage);
    }
  },

  /**
   * Measure execution time of a function
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    return { result, time: endTime - startTime };
  },
};

/**
 * Mock implementations for common services
 */
export const mockImplementations = {
  /**
   * Create a mock Supabase client
   */
  createSupabaseMock: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  }),

  /**
   * Create a mock Auth service
   */
  createAuthServiceMock: () => ({
    requireAuth: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {},
      app_metadata: {},
    }),
    getCurrentUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(true),
    getInstance: jest.fn(),
  }),

  /**
   * Create a mock Error handler
   */
  createErrorHandlerMock: () => ({
    withErrorHandling: jest.fn((fn) => fn()),
    handleError: jest.fn(),
    logError: jest.fn(),
    createError: jest.fn((message: string) => new Error(message)),
  }),

  /**
   * Create mock React 19 hooks
   */
  createReact19Mocks: () => ({
    useOptimistic: jest.fn((initialState, updateFn) => [
      initialState,
      jest.fn((action) => updateFn(initialState, action)),
    ]),
    useTransition: jest.fn(() => [
      false, // isPending
      jest.fn(), // startTransition
    ]),
    use: jest.fn(),
  }),
};

/**
 * Test data builders
 */
export const testDataBuilders = {
  /**
   * Build a test user
   */
  user: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    email: 'test@example.com',
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    ...overrides,
  }),

  /**
   * Build a test farm
   */
  farm: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    name: 'Test Farm',
    location: 'Test Location',
    description: 'A test farm for unit testing',
    total_area: 1000,
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    rows: [],
    ...overrides,
  }),

  /**
   * Build a test species
   */
  species: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    name: 'Test Species',
    scientific_name: 'Testicus speciesus',
    category: 'leafy_greens',
    is_active: true,
    image: '🌱',
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    ...overrides,
  }),

  /**
   * Build a test grow recipe
   */
  growRecipe: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    species_id: 'species-1',
    name: 'Test Recipe',
    difficulty: 'Easy',
    total_grow_days: 30,
    light_hours_per_day: 16,
    is_active: true,
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    ...overrides,
  }),

  /**
   * Build a test grow
   */
  grow: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    name: 'Test Grow',
    grow_recipe_id: 'recipe-1',
    shelf_id: 'shelf-1',
    user_id: 'user-1',
    start_date: testUtils.createTimestamp().split('T')[0],
    status: 'planned',
    is_active: true,
    automation_enabled: true,
    progress_percentage: 0,
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    ...overrides,
  }),

  /**
   * Build a test shelf
   */
  shelf: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: testUtils.generateTestId(),
    name: 'Test Shelf',
    rack_id: 'rack-1',
    level: 1,
    dimensions: {
      width: 2.4,
      depth: 1.2,
      height: 0.4,
    },
    max_plants: 24,
    lighting_type: 'LED_full_spectrum',
    irrigation_type: 'NFT',
    created_at: testUtils.createTimestamp(-30),
    updated_at: testUtils.createTimestamp(),
    ...overrides,
  }),
};

/**
 * Test assertions and matchers
 */
export const testAssertions = {
  /**
   * Assert that a value is within a range
   */
  toBeWithinRange: (actual: number, min: number, max: number) => {
    expect(actual).toBeGreaterThanOrEqual(min);
    expect(actual).toBeLessThanOrEqual(max);
  },

  /**
   * Assert that an array contains items with specific properties
   */
  toContainItemsWithProperties: <T>(
    array: T[],
    properties: Partial<T>
  ) => {
    const matchingItems = array.filter(item =>
      Object.entries(properties).every(([key, value]) =>
        (item as Record<string, unknown>)[key] === value
      )
    );
    expect(matchingItems.length).toBeGreaterThan(0);
  },

  /**
   * Assert that a promise resolves within a time limit
   */
  toResolveWithin: async <T>(
    promise: Promise<T>,
    timeLimit: number
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Promise did not resolve within ${timeLimit}ms`)), timeLimit)
    );

    return Promise.race([promise, timeoutPromise]);
  },

  /**
   * Assert that an object has the required properties
   */
  toHaveRequiredProperties: <T extends Record<string, unknown>>(
    obj: T,
    requiredProperties: (keyof T)[]
  ) => {
    requiredProperties.forEach(prop => {
      expect(obj).toHaveProperty(String(prop));
      expect(obj[prop]).toBeDefined();
    });
  },

  /**
   * Assert that a function is called with specific arguments
   */
  toHaveBeenCalledWithMatching: (
    mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>,
    matcher: (args: unknown[]) => boolean
  ) => {
    const calls = mockFn.mock.calls;
    const matchingCalls = calls.filter(matcher);
    expect(matchingCalls.length).toBeGreaterThan(0);
  },
};

/**
 * Global test setup
 */
beforeAll(async () => {
  // Environment already set to test by Jest
  process.env.JEST = 'true';

  // Configure console for tests
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    // Suppress expected React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
       args[0].includes('ReactDOM.render'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset any global state
  if (global.localStorage) {
    global.localStorage.clear();
  }
  if (global.sessionStorage) {
    global.sessionStorage.clear();
  }
});

afterEach(() => {
  // Clean up any test artifacts
  jest.restoreAllMocks();
});

/**
 * Test setup complete - Jest environment configured
 */

// Custom Jest matchers removed for simplicity

const testSetupExports = {
  testConfig,
  testUtils,
  mockImplementations,
  testDataBuilders,
  testAssertions,
};

export default testSetupExports;