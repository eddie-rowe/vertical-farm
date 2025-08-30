/**
 * Comprehensive unit tests for SpeciesService
 * Tests singleton pattern, CRUD operations, and service-specific methods
 * 
 * @group unit
 * @group services
 * @group species
 */

import type { Species, CreateSpeciesInput } from '@/types/farm/recipes';

import { SpeciesService } from '../SpeciesService';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

// Mock AuthService
const mockAuthService = {
  requireAuth: jest.fn(),
  getInstance: jest.fn(),
};

// Mock ErrorHandler
const mockErrorHandler = {
  withErrorHandling: jest.fn((fn) => fn()),
};

// Mock supabase client import
jest.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

jest.mock('../../core/auth/AuthService', () => ({
  AuthService: {
    getInstance: () => mockAuthService,
  },
}));

jest.mock('../../core/utils/errorHandler', () => ({
  ErrorHandler: mockErrorHandler,
}));

describe('SpeciesService', () => {
  let speciesService: SpeciesService;

  // Test data fixtures
  const mockSpeciesData: Species[] = [
    {
      id: 'species-1',
      name: 'Lettuce',
      description: 'Crispy leafy green vegetable',
      scientific_name: 'Lactuca sativa',
      category: 'leafy_greens',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      image: '🥬',
    },
    {
      id: 'species-2',
      name: 'Basil',
      description: 'Aromatic herb for cooking',
      scientific_name: 'Ocimum basilicum',
      category: 'herbs',
      is_active: true,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
      image: '🌿',
    },
    {
      id: 'species-3',
      name: 'Tomato',
      description: 'Red fruit vegetable',
      scientific_name: 'Solanum lycopersicum',
      category: 'fruiting',
      is_active: false,
      created_at: '2024-01-03T00:00:00.000Z',
      updated_at: '2024-01-03T00:00:00.000Z',
      image: '🍅',
    },
  ];

  const mockCreateSpeciesInput: CreateSpeciesInput = {
    name: 'New Species',
    description: 'A new test species',
    scientific_name: 'Testus speciesus',
    category: 'test',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance for testing
    (SpeciesService as any).instance = undefined;
    
    speciesService = SpeciesService.getInstance();
    
    // Setup default mock implementations
    mockSupabaseClient.single.mockResolvedValue({
      data: mockSpeciesData[0],
      error: null,
    });
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSupabaseClient.select,
      eq: mockSupabaseClient.eq,
      not: mockSupabaseClient.not,
      or: mockSupabaseClient.or,
      order: mockSupabaseClient.order,
      insert: mockSupabaseClient.insert,
      update: mockSupabaseClient.update,
      delete: mockSupabaseClient.delete,
      single: mockSupabaseClient.single,
    });

    mockAuthService.requireAuth.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = SpeciesService.getInstance();
      const instance2 = SpeciesService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(speciesService);
    });

    it('should not allow direct instantiation', () => {
      expect(() => new (SpeciesService as any)()).toThrow();
    });
  });

  describe('CRUD Operations', () => {
    describe('getAll', () => {
      it('should fetch all species successfully', async () => {
        mockSupabaseClient.select.mockResolvedValueOnce({
          data: mockSpeciesData,
          error: null,
        });

        const result = await speciesService.getAll();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
        expect(result).toEqual(mockSpeciesData);
      });

      it('should handle empty results', async () => {
        mockSupabaseClient.select.mockResolvedValueOnce({
          data: null,
          error: null,
        });

        const result = await speciesService.getAll();

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        const mockError = new Error('Database connection failed');
        mockSupabaseClient.select.mockResolvedValueOnce({
          data: null,
          error: mockError,
        });

        await expect(speciesService.getAll()).rejects.toThrow('Database connection failed');
      });
    });

    describe('getById', () => {
      it('should fetch species by ID successfully', async () => {
        const speciesId = 'species-1';
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: mockSpeciesData[0],
          error: null,
        });

        const result = await speciesService.getById(speciesId);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', speciesId);
        expect(result).toEqual(mockSpeciesData[0]);
      });

      it('should return null for non-existent species', async () => {
        mockSupabaseClient.single.mockRejectedValueOnce({
          code: 'PGRST116', // Record not found
        });

        const result = await speciesService.getById('non-existent-id');

        expect(result).toBeNull();
      });

      it('should validate ID parameter', async () => {
        await expect(speciesService.getById('')).rejects.toThrow('Invalid id: must be a non-empty string');
        await expect(speciesService.getById(null as any)).rejects.toThrow('Invalid id: must be a non-empty string');
      });
    });

    describe('create', () => {
      it('should create new species successfully', async () => {
        const newSpecies = { ...mockSpeciesData[0], id: 'new-species-id' };
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: newSpecies,
          error: null,
        });

        const result = await speciesService.create(mockCreateSpeciesInput);

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([mockCreateSpeciesInput]);
        expect(mockAuthService.requireAuth).toHaveBeenCalled();
        expect(result).toEqual(newSpecies);
      });

      it('should validate required fields', async () => {
        const invalidInput = { ...mockCreateSpeciesInput, name: '' };

        await expect(speciesService.create(invalidInput)).rejects.toThrow('name is required');
      });

      it('should validate name length', async () => {
        const invalidInput = { ...mockCreateSpeciesInput, name: 'x'.repeat(101) };

        await expect(speciesService.create(invalidInput)).rejects.toThrow('Species name must be 100 characters or less');
      });

      it('should validate description length', async () => {
        const invalidInput = { 
          ...mockCreateSpeciesInput, 
          description: 'x'.repeat(501),
        };

        await expect(speciesService.create(invalidInput)).rejects.toThrow('Species description must be 500 characters or less');
      });

      it('should validate scientific name length', async () => {
        const invalidInput = { 
          ...mockCreateSpeciesInput, 
          scientific_name: 'x'.repeat(201),
        };

        await expect(speciesService.create(invalidInput)).rejects.toThrow('Scientific name must be 200 characters or less');
      });
    });

    describe('update', () => {
      it('should update species successfully', async () => {
        const updatedSpecies = { ...mockSpeciesData[0], name: 'Updated Lettuce' };
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: updatedSpecies,
          error: null,
        });

        const result = await speciesService.update('species-1', { name: 'Updated Lettuce' });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.update).toHaveBeenCalledWith({ name: 'Updated Lettuce' });
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'species-1');
        expect(mockAuthService.requireAuth).toHaveBeenCalled();
        expect(result).toEqual(updatedSpecies);
      });

      it('should validate update data', async () => {
        await expect(
          speciesService.update('species-1', { name: 'x'.repeat(101) })
        ).rejects.toThrow('Species name must be 100 characters or less');
      });
    });

    describe('delete', () => {
      it('should delete species successfully', async () => {
        mockSupabaseClient.delete.mockResolvedValueOnce({
          data: null,
          error: null,
        });

        await speciesService.delete('species-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'species-1');
        expect(mockAuthService.requireAuth).toHaveBeenCalled();
      });
    });
  });

  describe('Service-Specific Methods', () => {
    describe('getActiveSpecies', () => {
      it('should fetch only active species', async () => {
        const activeSpecies = mockSpeciesData.filter(s => s.is_active);
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: activeSpecies,
          error: null,
        });

        const result = await speciesService.getActiveSpecies();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(result).toEqual(activeSpecies);
      });
    });

    describe('getSpeciesByCategory', () => {
      it('should fetch species by category', async () => {
        const leafyGreens = mockSpeciesData.filter(s => s.category === 'leafy_greens');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: leafyGreens,
          error: null,
        });

        const result = await speciesService.getSpeciesByCategory('leafy_greens');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'leafy_greens');
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(result).toEqual(leafyGreens);
      });

      it('should validate category parameter', async () => {
        await expect(speciesService.getSpeciesByCategory('')).rejects.toThrow('category is required');
      });
    });

    describe('searchSpecies', () => {
      it('should search species by name, scientific name, and description', async () => {
        const searchResults = [mockSpeciesData[0]];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: searchResults,
          error: null,
        });

        const result = await speciesService.searchSpecies('lettuce');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.or).toHaveBeenCalledWith(
          'name.ilike.%lettuce%,scientific_name.ilike.%lettuce%,description.ilike.%lettuce%'
        );
        expect(result).toEqual(searchResults);
      });

      it('should validate search query parameter', async () => {
        await expect(speciesService.searchSpecies('')).rejects.toThrow('query is required');
      });
    });

    describe('getDistinctCategories', () => {
      it('should fetch distinct categories', async () => {
        const mockCategories = [
          { category: 'leafy_greens' },
          { category: 'herbs' },
          { category: 'fruiting' },
        ];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockCategories,
          error: null,
        });

        const result = await speciesService.getDistinctCategories();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('species');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('category');
        expect(mockSupabaseClient.not).toHaveBeenCalledWith('category', 'is', null);
        expect(result).toEqual(['leafy_greens', 'herbs', 'fruiting']);
      });

      it('should handle empty categories', async () => {
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: [],
          error: null,
        });

        const result = await speciesService.getDistinctCategories();

        expect(result).toEqual([]);
      });

      it('should filter out null and invalid categories', async () => {
        const mockCategories = [
          { category: 'leafy_greens' },
          { category: null },
          { category: 'herbs' },
          { category: undefined },
          { category: '' },
        ];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockCategories,
          error: null,
        });

        const result = await speciesService.getDistinctCategories();

        expect(result).toEqual(['leafy_greens', 'herbs']);
      });
    });

    describe('toggleActiveStatus', () => {
      it('should toggle active status from true to false', async () => {
        // Mock getById to return active species
        const mockGetById = jest.spyOn(speciesService, 'getById')
          .mockResolvedValueOnce(mockSpeciesData[0]);
        
        // Mock update method
        const mockUpdate = jest.spyOn(speciesService, 'update')
          .mockResolvedValueOnce({ ...mockSpeciesData[0], is_active: false });

        const result = await speciesService.toggleActiveStatus('species-1');

        expect(mockGetById).toHaveBeenCalledWith('species-1');
        expect(mockUpdate).toHaveBeenCalledWith('species-1', { is_active: false });
        expect(result.is_active).toBe(false);
      });

      it('should toggle active status from false to true', async () => {
        // Mock getById to return inactive species
        const mockGetById = jest.spyOn(speciesService, 'getById')
          .mockResolvedValueOnce({ ...mockSpeciesData[0], is_active: false });
        
        // Mock update method
        const mockUpdate = jest.spyOn(speciesService, 'update')
          .mockResolvedValueOnce({ ...mockSpeciesData[0], is_active: true });

        const result = await speciesService.toggleActiveStatus('species-1');

        expect(mockGetById).toHaveBeenCalledWith('species-1');
        expect(mockUpdate).toHaveBeenCalledWith('species-1', { is_active: true });
        expect(result.is_active).toBe(true);
      });

      it('should throw error if species not found', async () => {
        jest.spyOn(speciesService, 'getById').mockResolvedValueOnce(null);

        await expect(speciesService.toggleActiveStatus('non-existent')).rejects.toThrow('Species not found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      mockAuthService.requireAuth.mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(speciesService.create(mockCreateSpeciesInput)).rejects.toThrow('Authentication failed');
    });

    it('should handle network errors', async () => {
      mockSupabaseClient.select.mockRejectedValueOnce(new Error('Network error'));

      await expect(speciesService.getAll()).rejects.toThrow('Network error');
    });

    it('should handle database constraint errors', async () => {
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });

      await expect(speciesService.create(mockCreateSpeciesInput)).rejects.toEqual(
        expect.objectContaining({ code: '23505' })
      );
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSpeciesData[0],
        id: `species-${i}`,
        name: `Species ${i}`,
      }));

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: largeDataset,
        error: null,
      });

      const startTime = Date.now();
      const result = await speciesService.getAll();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should process in under 100ms
    });
  });

  describe('Logging', () => {
    it('should log operations in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      jest.spyOn(process.env, 'NODE_ENV', 'get').mockReturnValue('development');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockSpeciesData,
        error: null,
      });

      await speciesService.getAll();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SpeciesService] getAll')
      );

      jest.restoreAllMocks();
      consoleSpy.mockRestore();
    });

    it('should not log operations in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      jest.spyOn(process.env, 'NODE_ENV', 'get').mockReturnValue('production');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockSpeciesData,
        error: null,
      });

      await speciesService.getAll();

      expect(consoleSpy).not.toHaveBeenCalled();

      jest.restoreAllMocks();
      consoleSpy.mockRestore();
    });
  });
});