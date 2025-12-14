/**
 * Performance tests for service layer operations
 * Tests response times, throughput, and scalability under various load conditions
 * 
 * @group performance
 * @group services
 * @group load-testing
 */

// Mock imports
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

jest.mock('../../../core/auth/AuthService', () => ({
  AuthService: {
    getInstance: () => ({
      requireAuth: jest.fn().mockResolvedValue({
        id: 'test-user',
        email: 'test@example.com',
      }),
      getInstance: jest.fn(),
    }),
  },
}));

jest.mock('../../../core/utils/errorHandler', () => ({
  ErrorHandler: {
    withErrorHandling: jest.fn((fn) => fn()),
  },
}));

import { generateLargeDatasets } from '../../../../__tests__/mocks/database-fixtures';
import { GrowRecipeService } from '../GrowRecipeService';
import { GrowService, type CreateGrowInput } from '../GrowService';
import { SpeciesService } from '../SpeciesService';
import type { Priority } from '@/types/common';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  FAST_OPERATION: 50,    // < 50ms for simple operations
  MEDIUM_OPERATION: 200, // < 200ms for complex queries
  SLOW_OPERATION: 1000,  // < 1s for heavy operations
  BATCH_OPERATION: 5000, // < 5s for batch operations
};

const LOAD_TEST_SIZES = {
  SMALL: 100,
  MEDIUM: 500,
  LARGE: 1000,
  XLARGE: 5000,
};

describe('Service Layer Performance Tests', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = require('@/lib/supabaseClient').supabase;
    
    // Setup default mock responses with simulated delays
    mockSupabaseClient.select.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          data: generateLargeDatasets.species(10),
          error: null,
        }), Math.random() * 10); // Random 0-10ms delay
      });
    });

    mockSupabaseClient.single.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          data: generateLargeDatasets.species(1)[0],
          error: null,
        }), Math.random() * 5); // Random 0-5ms delay
      });
    });

    mockSupabaseClient.insert.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          data: generateLargeDatasets.species(1),
          error: null,
        }), Math.random() * 20); // Random 0-20ms delay for writes
      });
    });
  });

  /**
   * Utility function to measure execution time
   */
  const measureExecutionTime = async (operation: () => Promise<any>): Promise<number> => {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    return endTime - startTime;
  };

  /**
   * Utility function to run multiple operations concurrently
   */
  const runConcurrentOperations = async <T>(
    operation: () => Promise<T>,
    concurrency: number
  ): Promise<{ results: T[]; totalTime: number; avgTime: number }> => {
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrency }, operation);
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / concurrency;
    
    return { results, totalTime, avgTime };
  };

  describe('SpeciesService Performance', () => {
    let speciesService: SpeciesService;

    beforeEach(() => {
      (SpeciesService as any).instance = undefined;
      speciesService = SpeciesService.getInstance();
    });

    test('should retrieve all species within performance threshold', async () => {
      const executionTime = await measureExecutionTime(() => speciesService.getAll());
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });

    test('should handle concurrent species retrieval efficiently', async () => {
      const { avgTime } = await runConcurrentOperations(
        () => speciesService.getAll(),
        10
      );
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should scale with large species datasets', async () => {
      // Mock large dataset
      const largeDataset = generateLargeDatasets.species(LOAD_TEST_SIZES.LARGE);
      mockSupabaseClient.select.mockResolvedValue({
        data: largeDataset,
        error: null,
      });

      const executionTime = await measureExecutionTime(() => speciesService.getAll());
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should perform species search efficiently', async () => {
      const executionTime = await measureExecutionTime(() => 
        speciesService.searchSpecies('test')
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });

    test('should handle high frequency species lookups', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => 
        () => speciesService.getById(`species-${i}`)
      );

      const startTime = performance.now();
      await Promise.all(operations.map(op => op()));
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_OPERATION);
    });

    test('should maintain performance under memory pressure', async () => {
      // Create multiple service instances to test memory usage
      const services = Array.from({ length: 100 }, () => SpeciesService.getInstance());
      
      // All should be the same instance (singleton pattern)
      expect(services.every(service => service === speciesService)).toBe(true);
      
      // Performance should not degrade
      const executionTime = await measureExecutionTime(() => speciesService.getAll());
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });
  });

  describe('GrowRecipeService Performance', () => {
    let growRecipeService: GrowRecipeService;

    beforeEach(() => {
      (GrowRecipeService as any).instance = undefined;
      growRecipeService = GrowRecipeService.getInstance();
    });

    test('should retrieve recipes within performance threshold', async () => {
      const executionTime = await measureExecutionTime(() => 
        growRecipeService.getAll()
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });

    test('should handle complex filtering efficiently', async () => {
      const filters = {
        species_id: 'species-1',
        difficulty: 'Easy' as const,
        min_grow_days: 20,
        max_grow_days: 40,
        search: 'lettuce',
        is_active: true,
        priority: 'high' as Priority,
      };

      const executionTime = await measureExecutionTime(() => 
        growRecipeService.getFilteredRecipes(filters)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should handle pagination efficiently', async () => {
      const executionTime = await measureExecutionTime(() => 
        growRecipeService.getPaginatedRecipes(1, 50)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });

    test('should scale pagination with large datasets', async () => {
      // Test multiple pages
      const pagePromises = Array.from({ length: 20 }, (_, i) =>
        () => growRecipeService.getPaginatedRecipes(i + 1, 25)
      );

      const { avgTime } = await runConcurrentOperations(
        () => Promise.all(pagePromises.map(p => p())),
        1
      );

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_OPERATION);
    });

    test('should handle recipe search with large result sets', async () => {
      // Mock large search results
      const largeResultSet = generateLargeDatasets.recipes(LOAD_TEST_SIZES.MEDIUM);
      mockSupabaseClient.order.mockResolvedValue({
        data: largeResultSet,
        error: null,
      });

      const executionTime = await measureExecutionTime(() => 
        growRecipeService.searchRecipes('test')
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should duplicate recipes efficiently', async () => {
      const executionTime = await measureExecutionTime(() => 
        growRecipeService.duplicateRecipe('recipe-1', 'Duplicated Recipe')
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });
  });

  describe('GrowService Performance', () => {
    let growService: GrowService;

    beforeEach(() => {
      (GrowService as any).instance = undefined;
      growService = GrowService.getInstance();
    });

    test('should create single grow within performance threshold', async () => {
      const growInput: CreateGrowInput = {
        name: 'Performance Test Grow',
        grow_recipe_id: 'recipe-1',
        shelf_id: 'shelf-1',
        start_date: '2024-01-01',
        automation_enabled: true,
      };

      const executionTime = await measureExecutionTime(() => 
        growService.createGrow(growInput)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should handle batch grow creation efficiently', async () => {
      const batchSize = 50;
      const growInputs: CreateGrowInput[] = Array.from({ length: batchSize }, (_, i) => ({
        name: `Batch Grow ${i}`,
        grow_recipe_id: 'recipe-1',
        shelf_id: `shelf-${i}`,
        start_date: '2024-01-01',
        automation_enabled: true,
      }));

      // Mock batch response
      mockSupabaseClient.insert.mockResolvedValue({
        data: generateLargeDatasets.grows(batchSize),
        error: null,
      });

      const executionTime = await measureExecutionTime(() => 
        growService.startMultipleGrows(growInputs)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_OPERATION);
    });

    test('should scale batch operations linearly', async () => {
      const batchSizes = [10, 50, 100];
      const results: { size: number; time: number }[] = [];

      for (const size of batchSizes) {
        const growInputs: CreateGrowInput[] = Array.from({ length: size }, (_, i) => ({
          name: `Scale Test Grow ${i}`,
          grow_recipe_id: 'recipe-1',
          shelf_id: `shelf-${i}`,
          start_date: '2024-01-01',
          automation_enabled: true,
        }));

        mockSupabaseClient.insert.mockResolvedValue({
          data: generateLargeDatasets.grows(size),
          error: null,
        });

        const executionTime = await measureExecutionTime(() => 
          growService.startMultipleGrows(growInputs)
        );

        results.push({ size, time: executionTime });
      }

      // Check that time scales roughly linearly with size
      const timePerItem = results.map(r => r.time / r.size);
      const avgTimePerItem = timePerItem.reduce((a, b) => a + b, 0) / timePerItem.length;
      
      // Variance should be reasonable (within 50% of average)
      timePerItem.forEach(time => {
        expect(time).toBeLessThan(avgTimePerItem * 1.5);
        expect(time).toBeGreaterThan(avgTimePerItem * 0.5);
      });
    });

    test('should handle concurrent grow queries efficiently', async () => {
      const { avgTime } = await runConcurrentOperations(
        () => growService.getActiveGrows(),
        20
      );

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should perform complex grow filtering efficiently', async () => {
      const complexFilters = {
        status: 'active' as const,
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31',
        is_active: true,
        search: 'test',
      };

      const executionTime = await measureExecutionTime(() => 
        growService.getFilteredGrows(complexFilters)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });

    test('should calculate grow progress efficiently for large datasets', async () => {
      const progressPromises = Array.from({ length: 100 }, (_, i) =>
        () => growService.calculateGrowProgress(`grow-${i}`)
      );

      const { avgTime } = await runConcurrentOperations(
        () => Promise.all(progressPromises.map(p => p())),
        1
      );

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW_OPERATION);
    });

    test('should handle grow summary calculations efficiently', async () => {
      // Mock complex aggregation response
      mockSupabaseClient.select.mockResolvedValue({
        count: 1000,
        error: null,
      });

      const executionTime = await measureExecutionTime(() => 
        growService.getGrowSummary('user-1')
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });
  });

  describe('Cross-Service Integration Performance', () => {
    let farmService: any;
    let speciesService: SpeciesService;
    let growRecipeService: GrowRecipeService;
    let growService: GrowService;

    beforeEach(() => {
      // Reset singletons
      (SpeciesService as any).instance = undefined;
      (GrowRecipeService as any).instance = undefined;
      (GrowService as any).instance = undefined;

      speciesService = SpeciesService.getInstance();
      growRecipeService = GrowRecipeService.getInstance();
      growService = GrowService.getInstance();
    });

    test('should handle full new grow setup workflow efficiently', async () => {
      // Simulate the complete workflow from NewGrowSetup component
      const workflowOperation = async () => {
        // Step 1: Load initial data (parallel)
        await Promise.all([
          speciesService.getActiveSpecies(),
          growRecipeService.getActiveRecipes(),
        ]);

        // Step 2: Filter recipes based on species selection
        await growRecipeService.getRecipesBySpecies('species-1');

        // Step 3: Create multiple grows
        const growInputs: CreateGrowInput[] = Array.from({ length: 5 }, (_, i) => ({
          name: `Workflow Grow ${i}`,
          grow_recipe_id: 'recipe-1',
          shelf_id: `shelf-${i}`,
          start_date: '2024-01-01',
          automation_enabled: true,
        }));

        await growService.startMultipleGrows(growInputs);
      };

      const executionTime = await measureExecutionTime(workflowOperation);
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION);
    });

    test('should maintain performance under concurrent user scenarios', async () => {
      // Simulate 10 concurrent users going through the workflow
      const userWorkflows = Array.from({ length: 10 }, (_, userId) => async () => {
        // Each user loads data and creates a grow
        await Promise.all([
          speciesService.getActiveSpecies(),
          growRecipeService.getActiveRecipes(),
        ]);

        const growInput: CreateGrowInput = {
          name: `User ${userId} Grow`,
          grow_recipe_id: 'recipe-1',
          shelf_id: `shelf-user-${userId}`,
          start_date: '2024-01-01',
          automation_enabled: true,
        };

        await growService.createGrow(growInput);
      });

      const { totalTime, avgTime } = await runConcurrentOperations(
        () => Promise.all(userWorkflows.map(workflow => workflow())),
        1
      );

      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION);
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION);
    });

    test('should handle service initialization overhead efficiently', async () => {
      // Test cold start performance
      const coldStartTime = await measureExecutionTime(async () => {
        // Reset all singletons to simulate cold start
        (SpeciesService as any).instance = undefined;
        (GrowRecipeService as any).instance = undefined;
        (GrowService as any).instance = undefined;

        // Initialize and use services
        const species = SpeciesService.getInstance();
        const recipes = GrowRecipeService.getInstance();
        const grows = GrowService.getInstance();

        await Promise.all([
          species.getAll(),
          recipes.getAll(),
          grows.getActiveGrows(),
        ]);
      });

      expect(coldStartTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });
  });

  describe('Memory and Resource Management', () => {
    test('should not leak memory during repeated operations', async () => {
      const speciesService = SpeciesService.getInstance();
      
      // Simulate repeated operations
      for (let i = 0; i < 100; i++) {
        await speciesService.getAll();
        await speciesService.getActiveSpecies();
        await speciesService.searchSpecies(`query-${i}`);
      }

      // Memory usage should remain stable (singleton pattern ensures no new instances)
      const instance1 = SpeciesService.getInstance();
      const instance2 = SpeciesService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should handle large payloads efficiently', async () => {
      const growService = GrowService.getInstance();
      
      // Create a very large batch
      const largeGrowInputs: CreateGrowInput[] = Array.from(
        { length: LOAD_TEST_SIZES.LARGE }, 
        (_, i) => ({
          name: `Large Batch Grow ${i}`,
          grow_recipe_id: 'recipe-1',
          shelf_id: `shelf-${i}`,
          start_date: '2024-01-01',
          notes: 'A'.repeat(500), // Large note field
          automation_enabled: true,
        })
      );

      // Mock response with large dataset
      mockSupabaseClient.insert.mockResolvedValue({
        data: generateLargeDatasets.grows(LOAD_TEST_SIZES.LARGE),
        error: null,
      });

      const executionTime = await measureExecutionTime(() => 
        growService.startMultipleGrows(largeGrowInputs)
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATION);
    });

    test('should maintain performance with complex nested data', async () => {
      const growService = GrowService.getInstance();
      
      // Mock response with complex nested relationships
      const complexGrowData = Array.from({ length: 100 }, (_, i) => ({
        id: `grow-${i}`,
        name: `Complex Grow ${i}`,
        grow_recipe: {
          id: `recipe-${i}`,
          name: `Recipe ${i}`,
          species: {
            id: `species-${i}`,
            name: `Species ${i}`,
            // ... more nested data
          },
          // ... more recipe data
        },
        shelf: {
          id: `shelf-${i}`,
          rack: {
            id: `rack-${i}`,
            row: {
              id: `row-${i}`,
              farm: {
                id: `farm-${i}`,
                // ... more nested data
              },
            },
          },
        },
        // ... more grow data
      }));

      mockSupabaseClient.order.mockResolvedValue({
        data: complexGrowData,
        error: null,
      });

      const executionTime = await measureExecutionTime(() => 
        growService.getActiveGrows()
      );
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });
  });

  describe('Error Handling Performance', () => {
    test('should fail fast on validation errors', async () => {
      const growService = GrowService.getInstance();
      
      const invalidInput = {
        name: '', // Invalid - empty name
        grow_recipe_id: 'recipe-1',
        shelf_id: 'shelf-1',
        start_date: '2024-01-01',
        automation_enabled: true,
      };

      const executionTime = await measureExecutionTime(async () => {
        try {
          await growService.createGrow(invalidInput);
        } catch (error) {
          // Expected to fail
        }
      });

      // Should fail quickly without network calls
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FAST_OPERATION);
    });

    test('should handle network errors efficiently', async () => {
      const speciesService = SpeciesService.getInstance();
      
      // Mock network error
      mockSupabaseClient.select.mockRejectedValue(new Error('Network error'));

      const executionTime = await measureExecutionTime(async () => {
        try {
          await speciesService.getAll();
        } catch (error) {
          // Expected to fail
        }
      });

      // Should fail within reasonable time
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION);
    });
  });

  describe('Performance Regression Detection', () => {
    test('should maintain baseline performance for critical operations', async () => {
      const operations = [
        { name: 'Species.getAll', fn: () => SpeciesService.getInstance().getAll(), threshold: PERFORMANCE_THRESHOLDS.FAST_OPERATION },
        { name: 'GrowRecipe.getAll', fn: () => GrowRecipeService.getInstance().getAll(), threshold: PERFORMANCE_THRESHOLDS.FAST_OPERATION },
        { name: 'Grow.getActiveGrows', fn: () => GrowService.getInstance().getActiveGrows(), threshold: PERFORMANCE_THRESHOLDS.MEDIUM_OPERATION },
        { name: 'GrowRecipe.searchRecipes', fn: () => GrowRecipeService.getInstance().searchRecipes('test'), threshold: PERFORMANCE_THRESHOLDS.FAST_OPERATION },
        { name: 'Species.searchSpecies', fn: () => SpeciesService.getInstance().searchSpecies('test'), threshold: PERFORMANCE_THRESHOLDS.FAST_OPERATION },
      ];

      const performanceResults: Array<{ name: string; time: number; threshold: number }> = [];

      for (const operation of operations) {
        const executionTime = await measureExecutionTime(operation.fn);
        performanceResults.push({
          name: operation.name,
          time: executionTime,
          threshold: operation.threshold,
        });

        expect(executionTime).toBeLessThan(operation.threshold);
      }

      // Log performance results for monitoring
      console.table(performanceResults);
    });
  });
});