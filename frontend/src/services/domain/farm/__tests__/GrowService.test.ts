/**
 * Comprehensive unit tests for GrowService
 * Tests singleton pattern, multiple grow creation, status management, and complex queries
 * 
 * @group unit
 * @group services
 * @group grows
 */

// Mock supabase client import
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

jest.mock('../../../core/auth/AuthService', () => ({
  AuthService: {
    getInstance: () => ({
      requireAuth: jest.fn(),
      getInstance: jest.fn(),
    }),
  },
}));

jest.mock('../../../core/utils/errorHandler', () => ({
  ErrorHandler: {
    withErrorHandling: jest.fn((fn) => fn()),
  },
}));

import type { GrowStatus } from '@/types/automation/grow';

import { GrowService, type CreateGrowInput, type GrowFilters, type GrowWithDetails } from '../GrowService';

// Get mocked instances for testing
const mockSupabaseClient = require('@/lib/supabaseClient').supabase;
const mockAuthService = require('../../../core/auth/AuthService').AuthService.getInstance();
const mockErrorHandler = require('../../../core/utils/errorHandler').ErrorHandler;

describe('GrowService', () => {
  let growService: GrowService;

  // Test data fixtures
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const mockGrowData: GrowWithDetails[] = [
    {
      id: 'grow-1',
      name: 'Lettuce Batch A',
      grow_recipe_id: 'recipe-1',
      shelf_id: 'shelf-1',
      user_id: 'user-1',
      start_date: '2024-01-01',
      estimated_harvest_date: '2024-01-31',
      status: 'active' as GrowStatus,
      notes: 'First batch of lettuce',
      is_active: true,
      automation_enabled: true,
      current_stage: 'vegetative',
      progress_percentage: 45,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      grow_recipe: {
        id: 'recipe-1',
        name: 'Lettuce Standard',
        species_id: 'species-1',
        total_grow_days: 30,
        difficulty: 'Easy',
        species: {
          id: 'species-1',
          name: 'Lettuce',
          image: '🥬',
        },
      },
      shelf: {
        id: 'shelf-1',
        name: 'A1-S1',
        rack_id: 'rack-1',
        rack: {
          id: 'rack-1',
          name: 'Rack A1',
          row_id: 'row-1',
          row: {
            id: 'row-1',
            name: 'Row A',
            farm_id: 'farm-1',
            farm: {
              id: 'farm-1',
              name: 'Farm Alpha',
            },
          },
        },
      },
    },
    {
      id: 'grow-2',
      name: 'Basil Batch B',
      grow_recipe_id: 'recipe-2',
      shelf_id: 'shelf-2',
      user_id: 'user-1',
      start_date: '2024-01-05',
      estimated_harvest_date: '2024-02-19',
      status: 'planned' as GrowStatus,
      notes: 'Herb experiment',
      is_active: true,
      automation_enabled: false,
      current_stage: 'planning',
      progress_percentage: 0,
      created_at: '2024-01-05T00:00:00.000Z',
      updated_at: '2024-01-05T00:00:00.000Z',
      grow_recipe: {
        id: 'recipe-2',
        name: 'Basil Intensive',
        species_id: 'species-2',
        total_grow_days: 45,
        difficulty: 'Hard',
        species: {
          id: 'species-2',
          name: 'Basil',
          image: '🌿',
        },
      },
      shelf: {
        id: 'shelf-2',
        name: 'A2-S1',
        rack_id: 'rack-2',
        rack: {
          id: 'rack-2',
          name: 'Rack A2',
          row_id: 'row-1',
          row: {
            id: 'row-1',
            name: 'Row A',
            farm_id: 'farm-1',
            farm: {
              id: 'farm-1',
              name: 'Farm Alpha',
            },
          },
        },
      },
    },
    {
      id: 'grow-3',
      name: 'Lettuce Batch C',
      grow_recipe_id: 'recipe-1',
      shelf_id: 'shelf-3',
      user_id: 'user-1',
      start_date: '2023-12-01',
      estimated_harvest_date: '2023-12-31',
      actual_harvest_date: '2024-01-02',
      status: 'harvested' as GrowStatus,
      notes: 'Completed successfully',
      is_active: false,
      yield_actual: 4.8,
      yield_unit: 'kg',
      automation_enabled: true,
      current_stage: 'harvested',
      progress_percentage: 100,
      created_at: '2023-12-01T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
      grow_recipe: {
        id: 'recipe-1',
        name: 'Lettuce Standard',
        species_id: 'species-1',
        total_grow_days: 30,
        difficulty: 'Easy',
        species: {
          id: 'species-1',
          name: 'Lettuce',
          image: '🥬',
        },
      },
      shelf: {
        id: 'shelf-3',
        name: 'B1-S1',
        rack_id: 'rack-3',
        rack: {
          id: 'rack-3',
          name: 'Rack B1',
          row_id: 'row-2',
          row: {
            id: 'row-2',
            name: 'Row B',
            farm_id: 'farm-1',
            farm: {
              id: 'farm-1',
              name: 'Farm Alpha',
            },
          },
        },
      },
    },
  ];

  const mockCreateGrowInput: CreateGrowInput = {
    name: 'Test Grow',
    grow_recipe_id: 'recipe-1',
    shelf_id: 'shelf-1',
    start_date: '2024-01-15',
    estimated_harvest_date: '2024-02-14',
    notes: 'Test grow for unit tests',
    automation_enabled: true,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance for testing
    (GrowService as any).instance = undefined;
    
    growService = GrowService.getInstance();
    
    // Setup default mock implementations
    mockSupabaseClient.single.mockResolvedValue({
      data: mockGrowData[0],
      error: null,
    });
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSupabaseClient.select,
      eq: mockSupabaseClient.eq,
      in: mockSupabaseClient.in,
      gte: mockSupabaseClient.gte,
      lte: mockSupabaseClient.lte,
      or: mockSupabaseClient.or,
      order: mockSupabaseClient.order,
      insert: mockSupabaseClient.insert,
      update: mockSupabaseClient.update,
      delete: mockSupabaseClient.delete,
      single: mockSupabaseClient.single,
    });

    mockAuthService.requireAuth.mockResolvedValue(mockUser);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = GrowService.getInstance();
      const instance2 = GrowService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(growService);
    });

    it('should not allow direct instantiation', () => {
      expect(() => new (GrowService as any)()).toThrow();
    });
  });

  describe('Create Grow Operations', () => {
    describe('createGrow', () => {
      it('should create a single grow successfully', async () => {
        const newGrow = { 
          ...mockCreateGrowInput, 
          id: 'new-grow-id',
          user_id: 'user-1',
          status: 'planned' as GrowStatus,
          is_active: true,
          progress_percentage: 0,
        };
        
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: newGrow,
          error: null,
        });

        const result = await growService.createGrow(mockCreateGrowInput);

        expect(mockAuthService.requireAuth).toHaveBeenCalled();
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('grows');
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            ...mockCreateGrowInput,
            user_id: 'user-1',
            status: 'planned',
            is_active: true,
            progress_percentage: 0,
          })
        ]);
        expect(result).toEqual(newGrow);
      });

      it('should validate required fields', async () => {
        const invalidInputs = [
          { ...mockCreateGrowInput, name: '' },
          { ...mockCreateGrowInput, grow_recipe_id: '' },
          { ...mockCreateGrowInput, shelf_id: '' },
          { ...mockCreateGrowInput, start_date: '' },
        ];

        for (const input of invalidInputs) {
          await expect(growService.createGrow(input)).rejects.toThrow();
        }
      });

      it('should validate name length', async () => {
        const invalidInput = { ...mockCreateGrowInput, name: 'x'.repeat(101) };

        await expect(growService.createGrow(invalidInput)).rejects.toThrow('Grow name must be 100 characters or less');
      });

      it('should validate date formats', async () => {
        const invalidInputs = [
          { ...mockCreateGrowInput, start_date: 'invalid-date' },
          { ...mockCreateGrowInput, estimated_harvest_date: 'not-a-date' },
        ];

        for (const input of invalidInputs) {
          await expect(growService.createGrow(input)).rejects.toThrow();
        }
      });

      it('should validate harvest date is after start date', async () => {
        const invalidInput = { 
          ...mockCreateGrowInput, 
          start_date: '2024-02-01',
          estimated_harvest_date: '2024-01-01', // Before start date
        };

        await expect(growService.createGrow(invalidInput)).rejects.toThrow('Estimated harvest date must be after start date');
      });
    });

    describe('startMultipleGrows', () => {
      it('should create multiple grows successfully', async () => {
        const growInputs: CreateGrowInput[] = [
          { ...mockCreateGrowInput, shelf_id: 'shelf-1', name: 'Batch A' },
          { ...mockCreateGrowInput, shelf_id: 'shelf-2', name: 'Batch B' },
          { ...mockCreateGrowInput, shelf_id: 'shelf-3', name: 'Batch C' },
        ];

        const createdGrows = growInputs.map((input, index) => ({
          ...input,
          id: `grow-${index + 1}`,
          user_id: 'user-1',
          status: 'planned' as GrowStatus,
          is_active: true,
          progress_percentage: 0,
        }));

        mockSupabaseClient.insert.mockResolvedValueOnce({
          data: createdGrows,
          error: null,
        });

        const result = await growService.startMultipleGrows(growInputs);

        expect(mockAuthService.requireAuth).toHaveBeenCalled();
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
          growInputs.map(input => expect.objectContaining({
            ...input,
            user_id: 'user-1',
            status: 'planned',
            is_active: true,
            progress_percentage: 0,
          }))
        );
        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('Batch A');
        expect(result[1].name).toBe('Batch B');
        expect(result[2].name).toBe('Batch C');
      });

      it('should validate all inputs before creating', async () => {
        const invalidGrowInputs = [
          { ...mockCreateGrowInput, name: 'Valid Grow' },
          { ...mockCreateGrowInput, name: '', shelf_id: 'shelf-2' }, // Invalid
          { ...mockCreateGrowInput, name: 'Another Valid', shelf_id: 'shelf-3' },
        ];

        await expect(growService.startMultipleGrows(invalidGrowInputs)).rejects.toThrow('Validation error for grow 2');
      });

      it('should handle empty array', async () => {
        await expect(growService.startMultipleGrows([])).rejects.toThrow('No grows to create');
      });

      it('should handle large batch creation efficiently', async () => {
        const largeGrowInputs: CreateGrowInput[] = Array.from({ length: 100 }, (_, i) => ({
          ...mockCreateGrowInput,
          name: `Batch ${i + 1}`,
          shelf_id: `shelf-${i + 1}`,
        }));

        const createdGrows = largeGrowInputs.map((input, index) => ({
          ...input,
          id: `grow-${index + 1}`,
          user_id: 'user-1',
          status: 'planned' as GrowStatus,
          is_active: true,
          progress_percentage: 0,
        }));

        mockSupabaseClient.insert.mockResolvedValueOnce({
          data: createdGrows,
          error: null,
        });

        const startTime = Date.now();
        const result = await growService.startMultipleGrows(largeGrowInputs);
        const endTime = Date.now();

        expect(result).toHaveLength(100);
        expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
      });
    });
  });

  describe('Query Operations', () => {
    describe('getGrowsByUser', () => {
      it('should fetch grows for a specific user', async () => {
        const userGrows = mockGrowData.filter(g => g.user_id === 'user-1');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: userGrows,
          error: null,
        });

        const result = await growService.getGrowsByUser('user-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('grows');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toEqual(userGrows);
      });
    });

    describe('getGrowsByShelf', () => {
      it('should fetch grows for a specific shelf', async () => {
        const shelfGrows = mockGrowData.filter(g => g.shelf_id === 'shelf-1');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: shelfGrows,
          error: null,
        });

        const result = await growService.getGrowsByShelf('shelf-1');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('shelf_id', 'shelf-1');
        expect(result).toEqual(shelfGrows);
      });
    });

    describe('getGrowsByStatus', () => {
      it('should fetch grows by status', async () => {
        const activeGrows = mockGrowData.filter(g => g.status === 'active');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: activeGrows,
          error: null,
        });

        const result = await growService.getGrowsByStatus('active');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
        expect(result).toEqual(activeGrows);
      });
    });

    describe('getActiveGrows', () => {
      it('should fetch only active grows', async () => {
        const activeGrows = mockGrowData.filter(g => g.is_active && ['planned', 'active'].includes(g.status));
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: activeGrows,
          error: null,
        });

        const result = await growService.getActiveGrows();

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['planned', 'active']);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('start_date', { ascending: true });
        expect(result).toEqual(activeGrows);
      });
    });

    describe('getFilteredGrows', () => {
      it('should apply all filters correctly', async () => {
        const filters: GrowFilters = {
          status: 'active',
          shelf_id: 'shelf-1',
          grow_recipe_id: 'recipe-1',
          user_id: 'user-1',
          start_date_from: '2024-01-01',
          start_date_to: '2024-01-31',
          is_active: true,
          search: 'lettuce',
        };

        const filteredResults = [mockGrowData[0]];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: filteredResults,
          error: null,
        });

        const result = await growService.getFilteredGrows(filters);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('shelf_id', 'shelf-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('grow_recipe_id', 'recipe-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockSupabaseClient.gte).toHaveBeenCalledWith('start_date', '2024-01-01');
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith('start_date', '2024-01-31');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%lettuce%,notes.ilike.%lettuce%');
        expect(result).toEqual(filteredResults);
      });

      it('should handle empty filters', async () => {
        const emptyFilters: GrowFilters = {};
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockGrowData,
          error: null,
        });

        const result = await growService.getFilteredGrows(emptyFilters);

        expect(result).toEqual(mockGrowData);
      });
    });
  });

  describe('Status Management', () => {
    describe('updateGrowStatus', () => {
      it('should update status to active', async () => {
        const updatedGrow = { ...mockGrowData[1], status: 'active' as GrowStatus, is_active: true };
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: updatedGrow,
          error: null,
        });

        const result = await growService.updateGrowStatus('grow-2', 'active');

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'active', is_active: true })
        );
        expect(result.status).toBe('active');
      });

      it('should update status to harvested with completion data', async () => {
        const updatedGrow = { 
          ...mockGrowData[0], 
          status: 'harvested' as GrowStatus,
          actual_harvest_date: expect.any(String),
          progress_percentage: 100,
          is_active: false,
        };
        
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: updatedGrow,
          error: null,
        });

        const result = await growService.updateGrowStatus('grow-1', 'harvested');

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'harvested',
            actual_harvest_date: expect.any(String),
            progress_percentage: 100,
            is_active: false,
          })
        );
        expect(result.status).toBe('harvested');
        expect(result.progress_percentage).toBe(100);
      });

      it('should update status to failed and mark inactive', async () => {
        const updatedGrow = { 
          ...mockGrowData[0], 
          status: 'failed' as GrowStatus,
          is_active: false,
        };
        
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: updatedGrow,
          error: null,
        });

        const result = await growService.updateGrowStatus('grow-1', 'failed');

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'failed',
            is_active: false,
          })
        );
        expect(result.status).toBe('failed');
        expect(result.is_active).toBe(false);
      });

      it('should validate parameters', async () => {
        await expect(growService.updateGrowStatus('', 'active')).rejects.toThrow('Invalid id: must be a non-empty string');
        await expect(growService.updateGrowStatus('grow-1', '' as GrowStatus)).rejects.toThrow('status is required');
      });
    });
  });

  describe('Progress Calculation', () => {
    describe('calculateGrowProgress', () => {
      it('should return 100 for harvested grows', async () => {
        jest.spyOn(growService, 'getById').mockResolvedValueOnce({
          ...mockGrowData[2],
          status: 'harvested' as GrowStatus,
        });

        const progress = await growService.calculateGrowProgress('grow-3');

        expect(progress).toBe(100);
      });

      it('should return 0 for failed grows', async () => {
        jest.spyOn(growService, 'getById').mockResolvedValueOnce({
          ...mockGrowData[0],
          status: 'failed' as GrowStatus,
        });

        const progress = await growService.calculateGrowProgress('grow-1');

        expect(progress).toBe(0);
      });

      it('should return 0 for planned grows', async () => {
        jest.spyOn(growService, 'getById').mockResolvedValueOnce({
          ...mockGrowData[1],
          status: 'planned' as GrowStatus,
        });

        const progress = await growService.calculateGrowProgress('grow-2');

        expect(progress).toBe(0);
      });

      it('should calculate progress for active grows', async () => {
        // Mock a grow that started 15 days ago with 30 total days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 15);
        
        const mockGrow = {
          ...mockGrowData[0],
          status: 'active' as GrowStatus,
          start_date: startDate.toISOString().split('T')[0],
        };

        jest.spyOn(growService, 'getById').mockResolvedValueOnce(mockGrow);
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: {
            ...mockGrow,
            grow_recipe: {
              total_grow_days: 30,
            },
          },
          error: null,
        });

        jest.spyOn(growService, 'update').mockResolvedValueOnce(mockGrow);

        const progress = await growService.calculateGrowProgress('grow-1');

        // Should be approximately 50% (15 days / 30 days)
        expect(progress).toBeGreaterThan(40);
        expect(progress).toBeLessThan(60);
      });

      it('should handle grows without recipe data', async () => {
        jest.spyOn(growService, 'getById').mockResolvedValueOnce({
          ...mockGrowData[0],
          status: 'active' as GrowStatus,
        });
        
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: {
            ...mockGrowData[0],
            grow_recipe: null,
          },
          error: null,
        });

        jest.spyOn(growService, 'update').mockResolvedValueOnce(mockGrowData[0]);

        const progress = await growService.calculateGrowProgress('grow-1');

        // Should use default 30 days
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });

      it('should throw error for non-existent grow', async () => {
        jest.spyOn(growService, 'getById').mockResolvedValueOnce(null);

        await expect(growService.calculateGrowProgress('non-existent')).rejects.toThrow('Grow not found');
      });
    });
  });

  describe('Summary and Analytics', () => {
    describe('getGrowSummary', () => {
      it('should return grow summary for specific user', async () => {
        // Mock total count
        mockSupabaseClient.select.mockResolvedValueOnce({
          count: 10,
          error: null,
        });

        // Mock status counts
        const statusCounts = [
          { count: 3 },  // active
          { count: 2 },  // planned
          { count: 4 },  // harvested
          { count: 1 },  // failed
        ];

        mockSupabaseClient.select
          .mockResolvedValueOnce(statusCounts[0]) // active
          .mockResolvedValueOnce(statusCounts[1]) // planned
          .mockResolvedValueOnce(statusCounts[2]) // harvested
          .mockResolvedValueOnce(statusCounts[3]); // failed

        const result = await growService.getGrowSummary('user-1');

        expect(result).toEqual({
          total: 10,
          active: 3,
          planned: 2,
          harvested: 4,
          failed: 1,
        });
      });

      it('should return grow summary for all users', async () => {
        // Mock total count without user filter
        mockSupabaseClient.select.mockResolvedValueOnce({
          count: 25,
          error: null,
        });

        // Mock status counts without user filter
        const statusCounts = [
          { count: 8 },  // active
          { count: 5 },  // planned
          { count: 10 }, // harvested
          { count: 2 },  // failed
        ];

        mockSupabaseClient.select
          .mockResolvedValueOnce(statusCounts[0])
          .mockResolvedValueOnce(statusCounts[1])
          .mockResolvedValueOnce(statusCounts[2])
          .mockResolvedValueOnce(statusCounts[3]);

        const result = await growService.getGrowSummary();

        expect(result).toEqual({
          total: 25,
          active: 8,
          planned: 5,
          harvested: 10,
          failed: 2,
        });
      });

      it('should handle zero counts', async () => {
        mockSupabaseClient.select.mockResolvedValue({
          count: 0,
          error: null,
        });

        const result = await growService.getGrowSummary('user-with-no-grows');

        expect(result).toEqual({
          total: 0,
          active: 0,
          planned: 0,
          harvested: 0,
          failed: 0,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      mockAuthService.requireAuth.mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(growService.createGrow(mockCreateGrowInput)).rejects.toThrow('Authentication failed');
    });

    it('should handle database connection errors', async () => {
      mockSupabaseClient.insert.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(growService.createGrow(mockCreateGrowInput)).rejects.toThrow('Connection failed');
    });

    it('should handle constraint violations', async () => {
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      await expect(growService.createGrow(mockCreateGrowInput)).rejects.toEqual(
        expect.objectContaining({ code: '23505' })
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent grow creation efficiently', async () => {
      const batchSize = 50;
      const batches = Array.from({ length: 5 }, () => 
        Array.from({ length: batchSize }, (_, i) => ({
          ...mockCreateGrowInput,
          name: `Concurrent Grow ${i}`,
          shelf_id: `shelf-${i}`,
        }))
      );

      // Mock successful responses for all batches
      batches.forEach(() => {
        mockSupabaseClient.insert.mockResolvedValueOnce({
          data: Array.from({ length: batchSize }, (_, i) => ({
            id: `grow-${i}`,
            ...mockCreateGrowInput,
          })),
          error: null,
        });
      });

      const startTime = Date.now();
      
      // Create all batches concurrently
      const promises = batches.map(batch => growService.startMultipleGrows(batch));
      const results = await Promise.all(promises);
      
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toHaveLength(batchSize));
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should handle large filter operations efficiently', async () => {
      const complexFilters: GrowFilters = {
        status: 'active',
        start_date_from: '2024-01-01',
        start_date_to: '2024-12-31',
        is_active: true,
        search: 'test',
      };

      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockGrowData[0],
        id: `grow-${i}`,
        name: `Grow ${i}`,
      }));

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: largeDataset,
        error: null,
      });

      const startTime = Date.now();
      const result = await growService.getFilteredGrows(complexFilters);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should process in under 100ms
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete grow lifecycle', async () => {
      // 1. Create grow
      const newGrow = { 
        ...mockCreateGrowInput, 
        id: 'lifecycle-grow',
        user_id: 'user-1',
        status: 'planned' as GrowStatus,
      };
      
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: newGrow,
        error: null,
      });

      const createdGrow = await growService.createGrow(mockCreateGrowInput);
      expect(createdGrow.status).toBe('planned');

      // 2. Start the grow (update to active)
      const activeGrow = { ...createdGrow, status: 'active' as GrowStatus };
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: activeGrow,
        error: null,
      });

      const startedGrow = await growService.updateGrowStatus('lifecycle-grow', 'active');
      expect(startedGrow.status).toBe('active');

      // 3. Calculate progress
      jest.spyOn(growService, 'getById').mockResolvedValueOnce(activeGrow);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...activeGrow, grow_recipe: { total_grow_days: 30 } },
        error: null,
      });
      jest.spyOn(growService, 'update').mockResolvedValueOnce(activeGrow);

      const progress = await growService.calculateGrowProgress('lifecycle-grow');
      expect(progress).toBeGreaterThanOrEqual(0);

      // 4. Harvest the grow
      const harvestedGrow = { 
        ...activeGrow, 
        status: 'harvested' as GrowStatus,
        actual_harvest_date: new Date().toISOString(),
        progress_percentage: 100,
        is_active: false,
      };
      
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: harvestedGrow,
        error: null,
      });

      const finalGrow = await growService.updateGrowStatus('lifecycle-grow', 'harvested');
      expect(finalGrow.status).toBe('harvested');
      expect(finalGrow.is_active).toBe(false);
    });

    it('should handle batch grow setup workflow', async () => {
      // Simulate setting up multiple grows for different shelves with same recipe
      const shelfIds = ['shelf-1', 'shelf-2', 'shelf-3', 'shelf-4', 'shelf-5'];
      const batchInputs: CreateGrowInput[] = shelfIds.map((shelfId, index) => ({
        ...mockCreateGrowInput,
        name: `Lettuce Batch ${String.fromCharCode(65 + index)}`, // A, B, C, D, E
        shelf_id: shelfId,
        start_date: '2024-01-15',
        estimated_harvest_date: '2024-02-14',
      }));

      const createdBatch = batchInputs.map((input, index) => ({
        ...input,
        id: `batch-grow-${index + 1}`,
        user_id: 'user-1',
        status: 'planned' as GrowStatus,
        is_active: true,
        progress_percentage: 0,
      }));

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: createdBatch,
        error: null,
      });

      const result = await growService.startMultipleGrows(batchInputs);

      expect(result).toHaveLength(5);
      expect(result[0].name).toBe('Lettuce Batch A');
      expect(result[4].name).toBe('Lettuce Batch E');
      expect(result.every(grow => grow.status === 'planned')).toBe(true);
      expect(result.every(grow => grow.is_active === true)).toBe(true);
    });
  });
});