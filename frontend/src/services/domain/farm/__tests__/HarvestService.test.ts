/**
 * Comprehensive unit tests for HarvestService
 * Tests singleton pattern, CRUD operations, validation, and domain-specific methods
 *
 * @group unit
 * @group services
 * @group harvests
 */

// Create a stable mock for AuthService that persists across getInstance() calls
const mockRequireAuth = jest.fn();

// Mock supabase client - the actual mock object will be obtained after jest.mock
jest.mock("@/lib/supabaseClient", () => {
  // Create mock functions inside the factory
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockIn = jest.fn();
  const mockGte = jest.fn();
  const mockLte = jest.fn();
  const mockNot = jest.fn();
  const mockIlike = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockSingle = jest.fn();
  const mockMaybeSingle = jest.fn();

  const supabase = {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    not: mockNot,
    ilike: mockIlike,
    order: mockOrder,
    limit: mockLimit,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  return { supabase };
});

jest.mock("../../../core/auth/AuthService", () => ({
  AuthService: {
    getInstance: () => ({
      requireAuth: mockRequireAuth,
      getInstance: jest.fn(),
    }),
  },
}));

jest.mock("../../../core/utils/errorHandler", () => ({
  ErrorHandler: {
    withErrorHandling: jest.fn((fn) => fn()),
  },
}));

import type {
  CreateHarvestInput,
  HarvestFilters,
  HarvestWithDetails,
} from "@/types/farm/harvest";

import { HarvestService } from "../HarvestService";

// Get the mocked supabase client after imports
const { supabase: mockSupabaseClient } = jest.requireMock("@/lib/supabaseClient");

describe("HarvestService", () => {
  let harvestService: HarvestService;

  // Test data fixtures
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
  };

  const mockSession = {
    user: mockUser,
  };

  const mockHarvestData: HarvestWithDetails[] = [
    {
      id: "harvest-1",
      shelf_id: "shelf-1",
      grow_id: "grow-1",
      yield_amount: 500,
      yield_unit: "grams",
      yield_grams: 500,
      harvest_date: "2024-01-15T10:00:00.000Z",
      quality_rating: 8,
      notes: "Excellent yield from first batch",
      photo_urls: ["https://example.com/photo1.jpg"],
      documentation_urls: [],
      created_by: "user-1",
      created_at: "2024-01-15T10:00:00.000Z",
      updated_at: "2024-01-15T10:00:00.000Z",
      grow: {
        id: "grow-1",
        name: "Lettuce Batch A",
        status: "harvested",
        start_date: "2024-01-01",
        estimated_harvest_date: "2024-01-15",
        actual_harvest_date: "2024-01-15",
        grow_recipe: {
          id: "recipe-1",
          name: "Lettuce Standard",
          species_id: "species-1",
          total_grow_days: 14,
          species: {
            id: "species-1",
            name: "Lettuce",
          },
        },
      },
      shelf: {
        id: "shelf-1",
        name: "A1-S1",
        rack_id: "rack-1",
        rack: {
          id: "rack-1",
          name: "Rack A1",
          row_id: "row-1",
          row: {
            id: "row-1",
            name: "Row A",
            farm_id: "farm-1",
            farm: {
              id: "farm-1",
              name: "Farm Alpha",
            },
          },
        },
      },
    },
    {
      id: "harvest-2",
      shelf_id: "shelf-2",
      grow_id: "grow-2",
      yield_amount: 1.2,
      yield_unit: "kg",
      yield_grams: 1200,
      harvest_date: "2024-01-20T14:30:00.000Z",
      quality_rating: 9,
      notes: "Best batch so far",
      photo_urls: [],
      documentation_urls: [],
      created_by: "user-1",
      created_at: "2024-01-20T14:30:00.000Z",
      updated_at: "2024-01-20T14:30:00.000Z",
      grow: {
        id: "grow-2",
        name: "Basil Batch B",
        status: "harvested",
        start_date: "2024-01-05",
        estimated_harvest_date: "2024-01-20",
        actual_harvest_date: "2024-01-20",
        grow_recipe: {
          id: "recipe-2",
          name: "Basil Intensive",
          species_id: "species-2",
          total_grow_days: 15,
          species: {
            id: "species-2",
            name: "Basil",
          },
        },
      },
      shelf: {
        id: "shelf-2",
        name: "A2-S1",
        rack_id: "rack-2",
        rack: {
          id: "rack-2",
          name: "Rack A2",
          row_id: "row-1",
          row: {
            id: "row-1",
            name: "Row A",
            farm_id: "farm-1",
            farm: {
              id: "farm-1",
              name: "Farm Alpha",
            },
          },
        },
      },
    },
    {
      id: "harvest-3",
      shelf_id: "shelf-1",
      grow_id: "grow-3",
      yield_amount: 300,
      yield_unit: "grams",
      yield_grams: 300,
      harvest_date: "2024-01-25T09:00:00.000Z",
      quality_rating: 6,
      notes: "Lower quality due to pest issue",
      photo_urls: [],
      documentation_urls: [],
      created_by: "user-1",
      created_at: "2024-01-25T09:00:00.000Z",
      updated_at: "2024-01-25T09:00:00.000Z",
      grow: {
        id: "grow-3",
        name: "Lettuce Batch C",
        status: "harvested",
        start_date: "2024-01-10",
        estimated_harvest_date: "2024-01-24",
        actual_harvest_date: "2024-01-25",
        grow_recipe: {
          id: "recipe-1",
          name: "Lettuce Standard",
          species_id: "species-1",
          total_grow_days: 14,
          species: {
            id: "species-1",
            name: "Lettuce",
          },
        },
      },
      shelf: {
        id: "shelf-1",
        name: "A1-S1",
        rack_id: "rack-1",
        rack: {
          id: "rack-1",
          name: "Rack A1",
          row_id: "row-1",
          row: {
            id: "row-1",
            name: "Row A",
            farm_id: "farm-1",
            farm: {
              id: "farm-1",
              name: "Farm Alpha",
            },
          },
        },
      },
    },
  ];

  const mockCreateHarvestInput: CreateHarvestInput = {
    shelf_id: "shelf-1",
    grow_id: "grow-1",
    yield_amount: 450,
    yield_unit: "grams",
    harvest_date: "2024-01-15T10:00:00.000Z",
    quality_rating: 7,
    notes: "Good harvest",
    photo_urls: [],
    documentation_urls: [],
  };

  // Helper to setup chainable mock that returns itself for method chaining
  const setupChainableMock = () => {
    // Create a chainable object that contains all methods
    // Each method should return this same object to allow further chaining
    const chainable: any = {};

    // Terminal methods that return promises
    chainable.single = mockSupabaseClient.single;
    chainable.maybeSingle = mockSupabaseClient.maybeSingle;

    // Chainable methods - they need to return the chainable object
    const chainMethods = [
      'select', 'eq', 'in', 'gte', 'lte', 'not',
      'ilike', 'order', 'limit', 'insert', 'update', 'delete'
    ];

    chainMethods.forEach(method => {
      chainable[method] = mockSupabaseClient[method];
      mockSupabaseClient[method].mockReturnValue(chainable);
    });

    // from() starts the chain
    mockSupabaseClient.from.mockReturnValue(chainable);
  };

  beforeEach(() => {
    // Reset the singleton instance for testing BEFORE clearing mocks
    (HarvestService as any).instance = undefined;

    // Clear all mocks - this clears mock return values and call counts
    jest.clearAllMocks();

    // Setup chainable mocks AFTER clearing
    setupChainableMock();

    // Setup default mock implementations for terminal methods
    mockSupabaseClient.single.mockResolvedValue({
      data: mockHarvestData[0],
      error: null,
    });

    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: mockHarvestData[0],
      error: null,
    });

    // Setup auth mock
    mockRequireAuth.mockResolvedValue(mockSession);

    // Get service instance LAST, after all mocks are set up
    harvestService = HarvestService.getInstance();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance when called multiple times", () => {
      const instance1 = HarvestService.getInstance();
      const instance2 = HarvestService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(harvestService);
    });

    it("should use singleton pattern (private constructor)", () => {
      // The singleton pattern ensures consistent instance usage
      // Direct instantiation via `as any` bypasses TypeScript but
      // still creates an instance - the pattern is enforced at compile time
      const instance = HarvestService.getInstance();
      expect(instance).toBeDefined();
      expect(instance).toBe(harvestService);
    });
  });

  describe("Validation", () => {
    describe("validateCreateData", () => {
      it("should validate required fields", async () => {
        const invalidInputs = [
          { ...mockCreateHarvestInput, yield_amount: undefined as any },
          { ...mockCreateHarvestInput, yield_unit: "" as any },
          { ...mockCreateHarvestInput, grow_id: "" },
          { ...mockCreateHarvestInput, shelf_id: "" },
        ];

        for (const input of invalidInputs) {
          await expect(harvestService.createHarvest(input)).rejects.toThrow();
        }
      });

      it("should validate yield_amount is positive", async () => {
        const invalidInputs = [
          { ...mockCreateHarvestInput, yield_amount: 0 },
          { ...mockCreateHarvestInput, yield_amount: -100 },
        ];

        for (const input of invalidInputs) {
          await expect(harvestService.createHarvest(input)).rejects.toThrow(
            "Yield amount must be a positive number"
          );
        }
      });

      it("should validate yield_unit is valid", async () => {
        const invalidInput = {
          ...mockCreateHarvestInput,
          yield_unit: "invalid" as any,
        };

        await expect(harvestService.createHarvest(invalidInput)).rejects.toThrow(
          "Invalid yield unit"
        );
      });

      it("should validate quality_rating is between 1-10", async () => {
        const invalidInputs = [
          { ...mockCreateHarvestInput, quality_rating: 0 },
          { ...mockCreateHarvestInput, quality_rating: 11 },
          { ...mockCreateHarvestInput, quality_rating: -1 },
          { ...mockCreateHarvestInput, quality_rating: 5.5 },
        ];

        for (const input of invalidInputs) {
          await expect(harvestService.createHarvest(input)).rejects.toThrow(
            "Quality rating must be an integer between 1 and 10"
          );
        }
      });

      it("should validate harvest_date format", async () => {
        const invalidInput = {
          ...mockCreateHarvestInput,
          harvest_date: "not-a-date",
        };

        await expect(harvestService.createHarvest(invalidInput)).rejects.toThrow(
          "Invalid harvest date format"
        );
      });

      it("should accept all valid yield units", async () => {
        const validUnits = [
          "grams",
          "g",
          "kilograms",
          "kg",
          "pounds",
          "lbs",
          "ounces",
          "oz",
        ] as const;

        for (const unit of validUnits) {
          const validInput = { ...mockCreateHarvestInput, yield_unit: unit };

          mockSupabaseClient.single.mockResolvedValueOnce({
            data: { ...mockHarvestData[0], yield_unit: unit },
            error: null,
          });

          await expect(
            harvestService.createHarvest(validInput)
          ).resolves.toBeDefined();
        }
      });
    });
  });

  describe("CRUD Operations", () => {
    describe("createHarvest", () => {
      it("should create a harvest successfully", async () => {
        const newHarvest = {
          ...mockCreateHarvestInput,
          id: "new-harvest-id",
          created_by: "user-1",
        };

        mockSupabaseClient.single.mockResolvedValueOnce({
          data: newHarvest,
          error: null,
        });

        const result = await harvestService.createHarvest(mockCreateHarvestInput);

        expect(mockRequireAuth).toHaveBeenCalled();
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("harvests");
        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            ...mockCreateHarvestInput,
            created_by: "user-1",
          }),
        ]);
        expect(result).toEqual(newHarvest);
      });

      it("should use current timestamp if harvest_date not provided", async () => {
        const inputWithoutDate = {
          ...mockCreateHarvestInput,
          harvest_date: undefined,
        };

        mockSupabaseClient.single.mockResolvedValueOnce({
          data: { ...mockHarvestData[0] },
          error: null,
        });

        await harvestService.createHarvest(inputWithoutDate);

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            harvest_date: expect.any(String),
          }),
        ]);
      });
    });

    describe("getById", () => {
      it("should get a harvest by ID", async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: mockHarvestData[0],
          error: null,
        });

        const result = await harvestService.getById("harvest-1");

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", "harvest-1");
        expect(result).toEqual(mockHarvestData[0]);
      });

      it("should return null for non-existent harvest", async () => {
        // The error is thrown with code PGRST116 for not found
        const notFoundError: any = new Error("not found");
        notFoundError.code = "PGRST116";
        mockSupabaseClient.single.mockRejectedValueOnce(notFoundError);

        const result = await harvestService.getById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("update", () => {
      it("should update a harvest successfully", async () => {
        const updateData = {
          yield_amount: 600,
          notes: "Updated notes",
        };

        const updatedHarvest = {
          ...mockHarvestData[0],
          ...updateData,
        };

        mockSupabaseClient.single.mockResolvedValueOnce({
          data: updatedHarvest,
          error: null,
        });

        const result = await harvestService.update("harvest-1", updateData);

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", "harvest-1");
        expect(result).toEqual(updatedHarvest);
      });
    });

    describe("delete", () => {
      it("should delete a harvest successfully", async () => {
        mockSupabaseClient.delete.mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
        });

        await expect(
          harvestService.delete("harvest-1")
        ).resolves.not.toThrow();
      });
    });
  });

  describe("Query Operations", () => {
    describe("getHarvestsByGrow", () => {
      it("should fetch harvests for a specific grow", async () => {
        const growHarvests = mockHarvestData.filter(
          (h) => h.grow_id === "grow-1"
        );
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: growHarvests,
          error: null,
        });

        const result = await harvestService.getHarvestsByGrow("grow-1");

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("harvests");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("grow_id", "grow-1");
        expect(mockSupabaseClient.order).toHaveBeenCalledWith("harvest_date", {
          ascending: false,
        });
        expect(result).toEqual(growHarvests);
      });

      it("should validate growId", async () => {
        await expect(harvestService.getHarvestsByGrow("")).rejects.toThrow();
      });
    });

    describe("getHarvestsByShelf", () => {
      it("should fetch harvests for a specific shelf", async () => {
        const shelfHarvests = mockHarvestData.filter(
          (h) => h.shelf_id === "shelf-1"
        );
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: shelfHarvests,
          error: null,
        });

        const result = await harvestService.getHarvestsByShelf("shelf-1");

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
          "shelf_id",
          "shelf-1"
        );
        expect(result).toEqual(shelfHarvests);
      });
    });

    describe("getHarvestsByDateRange", () => {
      it("should fetch harvests within date range", async () => {
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockHarvestData,
          error: null,
        });

        const result = await harvestService.getHarvestsByDateRange(
          "2024-01-01",
          "2024-01-31"
        );

        expect(mockSupabaseClient.gte).toHaveBeenCalledWith(
          "harvest_date",
          "2024-01-01"
        );
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith(
          "harvest_date",
          "2024-01-31"
        );
        expect(result).toEqual(mockHarvestData);
      });

      it("should validate date formats", async () => {
        await expect(
          harvestService.getHarvestsByDateRange("invalid", "2024-01-31")
        ).rejects.toThrow("Invalid date format");

        await expect(
          harvestService.getHarvestsByDateRange("2024-01-01", "invalid")
        ).rejects.toThrow("Invalid date format");
      });
    });

    describe("getFilteredHarvests", () => {
      it("should apply all filters correctly", async () => {
        const filters: HarvestFilters = {
          grow_id: "grow-1",
          shelf_id: "shelf-1",
          harvest_date_from: "2024-01-01",
          harvest_date_to: "2024-01-31",
          min_quality: 7,
          max_quality: 10,
          min_yield: 100,
          created_by: "user-1",
          search: "excellent",
        };

        mockSupabaseClient.order.mockResolvedValueOnce({
          data: [mockHarvestData[0]],
          error: null,
        });

        const result = await harvestService.getFilteredHarvests(filters);

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("grow_id", "grow-1");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
          "shelf_id",
          "shelf-1"
        );
        expect(mockSupabaseClient.gte).toHaveBeenCalledWith(
          "harvest_date",
          "2024-01-01"
        );
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith(
          "harvest_date",
          "2024-01-31"
        );
        expect(mockSupabaseClient.gte).toHaveBeenCalledWith("quality_rating", 7);
        expect(mockSupabaseClient.lte).toHaveBeenCalledWith(
          "quality_rating",
          10
        );
        expect(mockSupabaseClient.gte).toHaveBeenCalledWith("yield_grams", 100);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
          "created_by",
          "user-1"
        );
        expect(mockSupabaseClient.ilike).toHaveBeenCalledWith(
          "notes",
          "%excellent%"
        );
        expect(result).toEqual([mockHarvestData[0]]);
      });

      it("should handle empty filters", async () => {
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockHarvestData,
          error: null,
        });

        const result = await harvestService.getFilteredHarvests({});

        expect(result).toEqual(mockHarvestData);
      });
    });
  });

  describe("Domain-Specific Methods", () => {
    describe("listCurrentGrows", () => {
      it("should list current (active/planned) grows for a farm", async () => {
        const mockGrows = [
          {
            id: "grow-1",
            name: "Active Grow",
            status: "active",
            start_date: "2024-01-01",
            estimated_harvest_date: "2024-01-15",
            progress_percentage: 50,
            shelf: {
              name: "A1-S1",
              rack: { row: { farm_id: "farm-1", farm: { name: "Farm Alpha" } } },
            },
            grow_recipe: { species: { name: "Lettuce" } },
          },
        ];

        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockGrows,
          error: null,
        });

        const result = await harvestService.listCurrentGrows("farm-1");

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("grows");
        expect(mockSupabaseClient.in).toHaveBeenCalledWith("status", [
          "planned",
          "active",
        ]);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("grow_id", "grow-1");
        expect(result[0]).toHaveProperty("progress_percentage", 50);
      });
    });

    describe("getGrowProgress", () => {
      it("should return progress for a grow", async () => {
        const mockGrow = {
          id: "grow-1",
          name: "Test Grow",
          status: "active",
          start_date: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days ago
          estimated_harvest_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days from now
          progress_percentage: 50,
          shelf: { name: "A1-S1", rack: { row: { farm_id: "farm-1" } } },
          grow_recipe: { total_grow_days: 14, species: { name: "Lettuce" } },
        };

        mockSupabaseClient.single.mockResolvedValueOnce({
          data: mockGrow,
          error: null,
        });

        const result = await harvestService.getGrowProgress("grow-1");

        expect(result).not.toBeNull();
        expect(result?.grow_id).toBe("grow-1");
        expect(result?.progress_percentage).toBeGreaterThan(0);
      });

      it("should return null for non-existent grow", async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        });

        const result = await harvestService.getGrowProgress("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("getHarvestStatus", () => {
      it("should validate shelfId parameter", async () => {
        // Test that empty shelfId is rejected
        await expect(harvestService.getHarvestStatus("")).rejects.toThrow();
      });

      it("should return null for non-existent shelf", async () => {
        // Mock shelf lookup to return not found error
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await harvestService.getHarvestStatus("non-existent");

        expect(result).toBeNull();
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("shelves");
      });
    });

    describe("abort", () => {
      it("should abort a grow with reason", async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: { id: "grow-1" },
          error: null,
        });

        await expect(
          harvestService.abort("grow-1", "Pest infestation detected")
        ).resolves.not.toThrow();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("grows");
        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "failed",
            is_active: false,
            notes: "Pest infestation detected",
          })
        );
      });

      it("should validate required parameters", async () => {
        await expect(harvestService.abort("", "reason")).rejects.toThrow();
        await expect(harvestService.abort("grow-1", "")).rejects.toThrow();
      });
    });

    describe("getDashboardSummary", () => {
      it("should return dashboard summary with correct structure", async () => {
        // getDashboardSummary makes several queries, each ending with different methods
        // First query ends with .eq() - all harvests stats
        mockSupabaseClient.eq.mockResolvedValueOnce({
          data: mockHarvestData.map((h) => ({
            yield_grams: h.yield_grams,
            quality_rating: h.quality_rating,
            harvest_date: h.harvest_date,
          })),
          error: null,
        });

        // Second query ends with .limit() - recent harvests
        mockSupabaseClient.limit.mockResolvedValueOnce({
          data: mockHarvestData.slice(0, 5),
          error: null,
        });

        // Third query for this month ends with .eq() (for date filter) or .gte()
        mockSupabaseClient.gte.mockResolvedValueOnce({
          data: mockHarvestData.slice(0, 2).map((h) => ({
            yield_grams: h.yield_grams,
            quality_rating: h.quality_rating,
          })),
          error: null,
        });

        const result = await harvestService.getDashboardSummary();

        expect(result).toHaveProperty("total_harvests");
        expect(result).toHaveProperty("total_yield_grams");
        expect(result).toHaveProperty("average_quality");
        expect(result).toHaveProperty("recent_harvests");
        expect(result).toHaveProperty("quality_distribution");
      });
    });
  });

  describe("Analytics Methods", () => {
    describe("getTotalYield", () => {
      it("should calculate total yield for a grow", async () => {
        const growHarvests = [
          { yield_grams: 500 },
          { yield_grams: 300 },
          { yield_grams: 200 },
        ];

        // For getTotalYield, the chain ends with .eq() which is then awaited
        // We need to make the last method in the chain return the data
        // Since .eq() is called last, we need to override it to resolve with data
        // But we also need to call setupChainableMock again after to fix the chain
        const originalEq = mockSupabaseClient.eq.getMockImplementation?.();
        mockSupabaseClient.eq.mockResolvedValueOnce({
          data: growHarvests,
          error: null,
        });

        const result = await harvestService.getTotalYield("grow-1");

        expect(result).toBe(1000);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("harvests");
        expect(mockSupabaseClient.select).toHaveBeenCalledWith("yield_grams");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("grow_id", "grow-1");
      });

      it("should return 0 for grow with no harvests", async () => {
        mockSupabaseClient.eq.mockResolvedValueOnce({
          data: [],
          error: null,
        });

        const result = await harvestService.getTotalYield("grow-no-harvests");

        expect(result).toBe(0);
      });
    });

    describe("getAverageQuality", () => {
      it("should calculate average quality for a grow", async () => {
        const growHarvests = [
          { quality_rating: 8 },
          { quality_rating: 9 },
          { quality_rating: 7 },
        ];

        // For getAverageQuality, chain is from().select().eq().not()
        // The .not() is the terminal method that gets awaited
        mockSupabaseClient.not.mockResolvedValueOnce({
          data: growHarvests,
          error: null,
        });

        const result = await harvestService.getAverageQuality("grow-1");

        expect(result).toBe(8);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("harvests");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("grow_id", "grow-1");
        expect(mockSupabaseClient.not).toHaveBeenCalledWith("quality_rating", "is", null);
      });

      it("should return 0 for grow with no quality ratings", async () => {
        mockSupabaseClient.not.mockResolvedValueOnce({
          data: [],
          error: null,
        });

        const result = await harvestService.getAverageQuality("grow-no-ratings");

        expect(result).toBe(0);
      });
    });

    describe("getHarvestAnalytics", () => {
      it("should return comprehensive analytics for a grow", async () => {
        // For growId case: chain is from().select() then .eq() then .order()
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockHarvestData,
          error: null,
        });

        const result = await harvestService.getHarvestAnalytics("grow-1");

        expect(result).toHaveProperty("total_harvests");
        expect(result).toHaveProperty("total_yield_grams");
        expect(result).toHaveProperty("average_quality");
        expect(result).toHaveProperty("average_yield_grams");
        expect(result).toHaveProperty("harvests_by_month");
        expect(result).toHaveProperty("yield_by_species");
      });

      it("should return analytics for all user harvests when growId not provided", async () => {
        // When no growId, it calls requireAuth and then uses user.id
        mockRequireAuth.mockResolvedValue(mockSession);
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockHarvestData,
          error: null,
        });

        const result = await harvestService.getHarvestAnalytics();

        expect(result.total_harvests).toBe(mockHarvestData.length);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors", async () => {
      mockRequireAuth.mockRejectedValueOnce(
        new Error("Authentication failed")
      );

      // Since createHarvest calls requireAuth twice (once in executeWithAuth, once in createHarvest),
      // and the second call is what reads session.user, we need the first to fail
      await expect(
        harvestService.createHarvest(mockCreateHarvestInput)
      ).rejects.toThrow("Authentication failed");
    });

    it("should handle database errors via error response", async () => {
      // Mock successful auth
      mockRequireAuth.mockResolvedValue(mockSession);

      // Clear the default mock value and set up error response
      mockSupabaseClient.single.mockReset();
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      });

      // Re-setup the chain after resetting
      setupChainableMock();
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      });

      await expect(
        harvestService.createHarvest(mockCreateHarvestInput)
      ).rejects.toEqual(expect.objectContaining({ code: "23505" }));
    });
  });
});
