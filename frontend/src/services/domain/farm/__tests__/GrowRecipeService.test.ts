/**
 * Comprehensive unit tests for GrowRecipeService
 * Tests singleton pattern, complex queries, filtering, and service-specific methods
 * 
 * @group unit
 * @group services
 * @group grow-recipes
 */

import { GrowRecipeService } from '../GrowRecipeService';
import type { 
  GrowRecipe, 
  CreateGrowRecipeInput, 
  GrowRecipeFilters,
  GrowDifficulty,
  PythiumRisk 
} from '@/types/farm/recipes';

// Mock Supabase client
const mockSupabaseClient = {
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

describe('GrowRecipeService', () => {
  let growRecipeService: GrowRecipeService;

  // Test data fixtures
  const mockGrowRecipeData: GrowRecipe[] = [
    {
      id: 'recipe-1',
      species_id: 'species-1',
      name: 'Lettuce Standard',
      grow_days: 30,
      light_hours_per_day: 16,
      watering_frequency_hours: 4,
      target_temperature_min: 18,
      target_temperature_max: 24,
      target_humidity_min: 60,
      target_humidity_max: 80,
      target_ph_min: 5.5,
      target_ph_max: 6.5,
      target_ec_min: 1.2,
      target_ec_max: 1.8,
      average_yield: 4.5,
      sowing_rate: 85,
      recipe_source: 'Farm Standard',
      germination_days: 3,
      light_days: 27,
      total_grow_days: 30,
      top_coat: 'none',
      pythium_risk: 'low' as PythiumRisk,
      water_intake: 2.1,
      water_frequency: 'every_4_hours',
      lighting: { schedule: 'standard', intensity: 'medium' },
      fridge_storage_temp: 4,
      difficulty: 'Easy' as GrowDifficulty,
      custom_parameters: { custom_setting: 'value' },
      priority: 'high',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      species: {
        id: 'species-1',
        name: 'Lettuce',
        scientific_name: 'Lactuca sativa',
        category: 'leafy_greens',
        image: '🥬',
      },
    },
    {
      id: 'recipe-2',
      species_id: 'species-2',
      name: 'Basil Intensive',
      grow_days: 45,
      light_hours_per_day: 14,
      watering_frequency_hours: 6,
      target_temperature_min: 20,
      target_temperature_max: 28,
      target_humidity_min: 55,
      target_humidity_max: 75,
      target_ph_min: 5.8,
      target_ph_max: 6.8,
      target_ec_min: 1.0,
      target_ec_max: 1.6,
      average_yield: 3.2,
      sowing_rate: 70,
      recipe_source: 'Expert Recipe',
      germination_days: 5,
      light_days: 40,
      total_grow_days: 45,
      top_coat: 'vermiculite',
      pythium_risk: 'medium' as PythiumRisk,
      water_intake: 1.8,
      water_frequency: 'every_6_hours',
      lighting: { schedule: 'intensive', intensity: 'high' },
      fridge_storage_temp: 2,
      difficulty: 'Hard' as GrowDifficulty,
      custom_parameters: { harvest_method: 'selective' },
      priority: 'medium',
      is_active: true,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
      species: {
        id: 'species-2',
        name: 'Basil',
        scientific_name: 'Ocimum basilicum',
        category: 'herbs',
        image: '🌿',
      },
    },
    {
      id: 'recipe-3',
      species_id: 'species-1',
      name: 'Lettuce Quick',
      grow_days: 21,
      light_hours_per_day: 18,
      watering_frequency_hours: 3,
      target_temperature_min: 16,
      target_temperature_max: 22,
      total_grow_days: 21,
      difficulty: 'Medium' as GrowDifficulty,
      is_active: false,
      created_at: '2024-01-03T00:00:00.000Z',
      updated_at: '2024-01-03T00:00:00.000Z',
      species: {
        id: 'species-1',
        name: 'Lettuce',
        scientific_name: 'Lactuca sativa',
        category: 'leafy_greens',
        image: '🥬',
      },
    },
  ];

  const mockCreateGrowRecipeInput: CreateGrowRecipeInput = {
    species_id: 'species-1',
    name: 'New Recipe',
    grow_days: 35,
    light_hours_per_day: 16,
    watering_frequency_hours: 4,
    target_temperature_min: 18,
    target_temperature_max: 25,
    target_humidity_min: 65,
    target_humidity_max: 85,
    target_ph_min: 5.5,
    target_ph_max: 6.5,
    difficulty: 'Medium',
    is_active: true,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance for testing
    (GrowRecipeService as any).instance = undefined;
    
    growRecipeService = GrowRecipeService.getInstance();
    
    // Setup default mock implementations
    mockSupabaseClient.single.mockResolvedValue({
      data: mockGrowRecipeData[0],
      error: null,
    });
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSupabaseClient.select,
      eq: mockSupabaseClient.eq,
      gte: mockSupabaseClient.gte,
      lte: mockSupabaseClient.lte,
      or: mockSupabaseClient.or,
      order: mockSupabaseClient.order,
      limit: mockSupabaseClient.limit,
      range: mockSupabaseClient.range,
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
      const instance1 = GrowRecipeService.getInstance();
      const instance2 = GrowRecipeService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(growRecipeService);
    });

    it('should not allow direct instantiation', () => {
      expect(() => new (GrowRecipeService as any)()).toThrow();
    });
  });

  describe('Complex Query Operations', () => {
    describe('getRecipesBySpecies', () => {
      it('should fetch recipes for a specific species', async () => {
        const lettuce recipes = mockGrowRecipeData.filter(r => r.species_id === 'species-1');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: lettuceRecipes,
          error: null,
        });

        const result = await growRecipeService.getRecipesBySpecies('species-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('grow_recipes');
        expect(mockSupabaseClient.select).toHaveBeenCalledWith(`
    *,
    species:species_id(*)
  `);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('species_id', 'species-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(result).toEqual(lettuceRecipes);
      });

      it('should validate species ID parameter', async () => {
        await expect(growRecipeService.getRecipesBySpecies('')).rejects.toThrow('Invalid species_id: must be a non-empty string');
      });
    });

    describe('getRecipesByDifficulty', () => {
      it('should fetch recipes by difficulty level', async () => {
        const easyRecipes = mockGrowRecipeData.filter(r => r.difficulty === 'Easy');
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: easyRecipes,
          error: null,
        });

        const result = await growRecipeService.getRecipesByDifficulty('Easy');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('difficulty', 'Easy');
        expect(result).toEqual(easyRecipes);
      });

      it('should validate difficulty parameter', async () => {
        await expect(growRecipeService.getRecipesByDifficulty('' as GrowDifficulty)).rejects.toThrow('difficulty is required');
      });
    });

    describe('searchRecipes', () => {
      it('should search recipes by name and recipe source', async () => {
        const searchResults = [mockGrowRecipeData[0]];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: searchResults,
          error: null,
        });

        const result = await growRecipeService.searchRecipes('lettuce');

        expect(mockSupabaseClient.or).toHaveBeenCalledWith(
          'name.ilike.%lettuce%,recipe_source.ilike.%lettuce%'
        );
        expect(result).toEqual(searchResults);
      });

      it('should validate search query parameter', async () => {
        await expect(growRecipeService.searchRecipes('')).rejects.toThrow('query is required');
      });
    });

    describe('getFilteredRecipes', () => {
      it('should apply all filters correctly', async () => {
        const filters: GrowRecipeFilters = {
          species_id: 'species-1',
          difficulty: 'Easy',
          pythium_risk: 'low',
          min_grow_days: 20,
          max_grow_days: 40,
          search: 'standard',
          is_active: true,
          priority: 'high',
        };

        const filteredResults = [mockGrowRecipeData[0]];
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: filteredResults,
          error: null,
        });

        const result = await growRecipeService.getFilteredRecipes(filters);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('species_id', 'species-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('difficulty', 'Easy');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('pythium_risk', 'low');
        expect(mockSupabaseClient.gte).toHaveBeenCalledWith('total_grow_days', 20);
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith('total_grow_days', 40);
        expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%standard%,recipe_source.ilike.%standard%');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('priority', 'high');
        expect(result).toEqual(filteredResults);
      });

      it('should handle empty filters', async () => {
        const emptyFilters: GrowRecipeFilters = {};
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockGrowRecipeData,
          error: null,
        });

        const result = await growRecipeService.getFilteredRecipes(emptyFilters);

        expect(result).toEqual(mockGrowRecipeData);
      });
    });

    describe('getPaginatedRecipes', () => {
      it('should return paginated results with metadata', async () => {
        const paginatedData = mockGrowRecipeData.slice(0, 2);
        mockSupabaseClient.range.mockReturnThis();
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: paginatedData,
          error: null,
          count: 10,
        });

        const result = await growRecipeService.getPaginatedRecipes(1, 2);

        expect(mockSupabaseClient.select).toHaveBeenCalledWith(`
    *,
    species:species_id(*)
  `, { count: 'exact' });
        expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 1); // page 1, limit 2
        expect(result.data).toEqual(paginatedData);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        });
      });

      it('should apply filters in pagination', async () => {
        const filters: GrowRecipeFilters = {
          difficulty: 'Easy',
          is_active: true,
        };

        mockSupabaseClient.range.mockReturnThis();
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: [mockGrowRecipeData[0]],
          error: null,
          count: 1,
        });

        const result = await growRecipeService.getPaginatedRecipes(1, 10, filters);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('difficulty', 'Easy');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(result.pagination.total).toBe(1);
      });
    });
  });

  describe('Advanced Operations', () => {
    describe('duplicateRecipe', () => {
      it('should duplicate recipe with new name', async () => {
        const originalRecipe = mockGrowRecipeData[0];
        const duplicatedRecipe = { 
          ...originalRecipe, 
          id: 'recipe-duplicate',
          name: 'Custom Duplicate Name',
        };

        jest.spyOn(growRecipeService, 'getById').mockResolvedValueOnce(originalRecipe);
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: duplicatedRecipe,
          error: null,
        });

        const result = await growRecipeService.duplicateRecipe('recipe-1', 'Custom Duplicate Name');

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            name: 'Custom Duplicate Name',
            species_id: originalRecipe.species_id,
            grow_days: originalRecipe.grow_days,
            // Should not include id, created_at, updated_at
          })
        ]);
        expect(result.name).toBe('Custom Duplicate Name');
      });

      it('should duplicate recipe with default name', async () => {
        const originalRecipe = mockGrowRecipeData[0];
        const duplicatedRecipe = { 
          ...originalRecipe, 
          id: 'recipe-duplicate',
          name: 'Lettuce Standard (Copy)',
        };

        jest.spyOn(growRecipeService, 'getById').mockResolvedValueOnce(originalRecipe);
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: duplicatedRecipe,
          error: null,
        });

        const result = await growRecipeService.duplicateRecipe('recipe-1');

        expect(result.name).toBe('Lettuce Standard (Copy)');
      });

      it('should throw error if original recipe not found', async () => {
        jest.spyOn(growRecipeService, 'getById').mockResolvedValueOnce(null);

        await expect(growRecipeService.duplicateRecipe('non-existent')).rejects.toThrow('Recipe not found');
      });
    });

    describe('getRecipeRecommendations', () => {
      it('should get recommendations with all parameters', async () => {
        const recommendations = [mockGrowRecipeData[0]];
        mockSupabaseClient.limit.mockResolvedValueOnce({
          data: recommendations,
          error: null,
        });

        const result = await growRecipeService.getRecipeRecommendations('species-1', 'Easy', 35);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('species_id', 'species-1');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('difficulty', 'Easy');
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith('total_grow_days', 35);
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('difficulty', { ascending: true });
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('total_grow_days', { ascending: true });
        expect(mockSupabaseClient.limit).toHaveBeenCalledWith(5);
        expect(result).toEqual(recommendations);
      });

      it('should get recommendations with no filters', async () => {
        const recommendations = mockGrowRecipeData.slice(0, 5);
        mockSupabaseClient.limit.mockResolvedValueOnce({
          data: recommendations,
          error: null,
        });

        const result = await growRecipeService.getRecipeRecommendations();

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
        expect(result).toEqual(recommendations);
      });
    });

    describe('toggleActiveStatus', () => {
      it('should toggle active status', async () => {
        const originalRecipe = { ...mockGrowRecipeData[0], is_active: true };
        const toggledRecipe = { ...originalRecipe, is_active: false };

        jest.spyOn(growRecipeService, 'getById').mockResolvedValueOnce(originalRecipe);
        jest.spyOn(growRecipeService, 'update').mockResolvedValueOnce(toggledRecipe);

        const result = await growRecipeService.toggleActiveStatus('recipe-1');

        expect(result.is_active).toBe(false);
      });
    });
  });

  describe('Data Validation', () => {
    describe('validateCreateData', () => {
      it('should validate required fields', async () => {
        const invalidInputs = [
          { ...mockCreateGrowRecipeInput, name: '' },
          { ...mockCreateGrowRecipeInput, species_id: '' },
        ];

        for (const input of invalidInputs) {
          await expect(growRecipeService.create(input)).rejects.toThrow();
        }
      });

      it('should validate field lengths', async () => {
        const invalidInput = { ...mockCreateGrowRecipeInput, name: 'x'.repeat(101) };

        await expect(growRecipeService.create(invalidInput)).rejects.toThrow('Recipe name must be 100 characters or less');
      });

      it('should validate numeric ranges', async () => {
        const invalidInputs = [
          { ...mockCreateGrowRecipeInput, grow_days: 0 },
          { ...mockCreateGrowRecipeInput, grow_days: 400 },
          { ...mockCreateGrowRecipeInput, light_hours_per_day: -1 },
          { ...mockCreateGrowRecipeInput, light_hours_per_day: 25 },
        ];

        for (const input of invalidInputs) {
          await expect(growRecipeService.create(input)).rejects.toThrow();
        }
      });

      it('should validate temperature ranges', async () => {
        const invalidInput = { 
          ...mockCreateGrowRecipeInput, 
          target_temperature_min: 25,
          target_temperature_max: 20, // max < min
        };

        await expect(growRecipeService.create(invalidInput)).rejects.toThrow('Minimum temperature must be less than maximum temperature');
      });

      it('should validate humidity ranges', async () => {
        const invalidInput = { 
          ...mockCreateGrowRecipeInput, 
          target_humidity_min: 80,
          target_humidity_max: 60, // max < min
        };

        await expect(growRecipeService.create(invalidInput)).rejects.toThrow('Minimum humidity must be less than maximum humidity');
      });

      it('should validate pH ranges', async () => {
        const invalidInput = { 
          ...mockCreateGrowRecipeInput, 
          target_ph_min: 7.0,
          target_ph_max: 6.0, // max < min
        };

        await expect(growRecipeService.create(invalidInput)).rejects.toThrow('Minimum pH must be less than maximum pH');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle complex filtering efficiently', async () => {
      const complexFilters: GrowRecipeFilters = {
        species_id: 'species-1',
        difficulty: 'Easy',
        pythium_risk: 'low',
        min_grow_days: 20,
        max_grow_days: 40,
        search: 'standard',
        is_active: true,
        priority: 'high',
      };

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockGrowRecipeData[0],
        id: `recipe-${i}`,
        name: `Recipe ${i}`,
      }));

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: largeDataset,
        error: null,
      });

      const startTime = Date.now();
      const result = await growRecipeService.getFilteredRecipes(complexFilters);
      const endTime = Date.now();

      expect(result).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(200); // Should process in under 200ms
    });

    it('should handle pagination efficiently', async () => {
      const pageSize = 100;
      const totalPages = 10;

      for (let page = 1; page <= totalPages; page++) {
        mockSupabaseClient.range.mockReturnThis();
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: Array.from({ length: pageSize }, (_, i) => ({
            ...mockGrowRecipeData[0],
            id: `recipe-${page}-${i}`,
          })),
          error: null,
          count: pageSize * totalPages,
        });

        const startTime = Date.now();
        const result = await growRecipeService.getPaginatedRecipes(page, pageSize);
        const endTime = Date.now();

        expect(result.data).toHaveLength(pageSize);
        expect(result.pagination.page).toBe(page);
        expect(endTime - startTime).toBeLessThan(100); // Each page should load in under 100ms
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.select.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(growRecipeService.getAll()).rejects.toThrow('Connection failed');
    });

    it('should handle invalid pagination parameters', async () => {
      await expect(growRecipeService.getPaginatedRecipes(0, 10)).rejects.toThrow();
      await expect(growRecipeService.getPaginatedRecipes(1, 0)).rejects.toThrow();
    });

    it('should handle malformed filter objects', async () => {
      const malformedFilters = {
        invalid_field: 'value',
        // This shouldn't crash the service
      } as any;

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockGrowRecipeData,
        error: null,
      });

      const result = await growRecipeService.getFilteredRecipes(malformedFilters);
      expect(result).toEqual(mockGrowRecipeData);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle real-world recipe creation workflow', async () => {
      // Simulate creating a recipe with validation
      const recipeInput: CreateGrowRecipeInput = {
        species_id: 'species-1',
        name: 'Premium Lettuce',
        grow_days: 28,
        light_hours_per_day: 16,
        watering_frequency_hours: 4,
        target_temperature_min: 18,
        target_temperature_max: 24,
        target_humidity_min: 65,
        target_humidity_max: 80,
        target_ph_min: 5.8,
        target_ph_max: 6.2,
        average_yield: 5.2,
        difficulty: 'Medium',
        priority: 'high',
        is_active: true,
      };

      const createdRecipe = { ...recipeInput, id: 'new-recipe-id' };
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: createdRecipe,
        error: null,
      });

      const result = await growRecipeService.create(recipeInput);

      expect(result).toEqual(createdRecipe);
      expect(mockAuthService.requireAuth).toHaveBeenCalled();
    });

    it('should handle recipe search and filter workflow', async () => {
      // Step 1: Search for lettuce recipes
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [mockGrowRecipeData[0]],
        error: null,
      });

      const searchResults = await growRecipeService.searchRecipes('lettuce');
      expect(searchResults).toHaveLength(1);

      // Step 2: Filter by difficulty
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [mockGrowRecipeData[0]],
        error: null,
      });

      const filteredResults = await growRecipeService.getFilteredRecipes({
        difficulty: 'Easy',
        is_active: true,
      });
      expect(filteredResults).toHaveLength(1);

      // Step 3: Get recommendations
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [mockGrowRecipeData[0]],
        error: null,
      });

      const recommendations = await growRecipeService.getRecipeRecommendations('species-1', 'Easy', 35);
      expect(recommendations).toHaveLength(1);
    });
  });
});