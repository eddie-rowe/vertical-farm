"use client";

import type { 
  GrowRecipe, 
  CreateGrowRecipeInput,
  GrowRecipeFilters,
  PaginatedGrowRecipes,
  GrowDifficulty,
  PythiumRisk
} from "@/types/farm/recipes";

import type { Priority } from "@/types/common";
import type { Species } from "@/types/farm/recipes";

import { BaseCRUDService, type BaseEntity } from "../../core/base/BaseCRUDService";

import type { YieldEstimate, ProfitEstimate } from "./types";

interface GrowRecipeEntity extends BaseEntity {
  species_id: string;
  name: string;
  grow_days?: number | null;
  light_hours_per_day?: number | null;
  watering_frequency_hours?: number | null;
  target_temperature_min?: number | null;
  target_temperature_max?: number | null;
  target_humidity_min?: number | null;
  target_humidity_max?: number | null;
  target_ph_min?: number | null;
  target_ph_max?: number | null;
  target_ec_min?: number | null;
  target_ec_max?: number | null;
  average_yield?: number | null;
  sowing_rate?: number | null;
  recipe_source?: string | null;
  germination_days?: number | null;
  light_days?: number | null;
  total_grow_days?: number | null;
  top_coat?: string | null;
  pythium_risk?: PythiumRisk | null;
  water_intake?: number | null;
  water_frequency?: string | null;
  lighting?: any | null;
  fridge_storage_temp?: number | null;
  difficulty?: GrowDifficulty | null;
  custom_parameters?: any | null;
  priority?: Priority;
  is_active?: boolean;
  species?: Species;
}

export class GrowRecipeService extends BaseCRUDService<GrowRecipeEntity> {
  protected readonly tableName = "grow_recipes";
  protected readonly selectFields = `
    *,
    species:species_id(*)
  `;
  private static instance: GrowRecipeService;

  private constructor() {
    super();
  }

  static getInstance(): GrowRecipeService {
    if (!GrowRecipeService.instance) {
      GrowRecipeService.instance = new GrowRecipeService();
    }
    return GrowRecipeService.instance;
  }

  protected validateCreateData(data: CreateGrowRecipeInput): void {
    this.validateRequired(data.name, "name");
    this.validateRequired(data.species_id, "species_id");

    if (data.name.length > 100) {
      throw new Error("Recipe name must be 100 characters or less");
    }

    if (data.grow_days && (data.grow_days < 1 || data.grow_days > 365)) {
      throw new Error("Grow days must be between 1 and 365");
    }

    if (data.light_hours_per_day && (data.light_hours_per_day < 0 || data.light_hours_per_day > 24)) {
      throw new Error("Light hours per day must be between 0 and 24");
    }

    if (data.target_temperature_min && data.target_temperature_max) {
      if (data.target_temperature_min >= data.target_temperature_max) {
        throw new Error("Minimum temperature must be less than maximum temperature");
      }
    }

    if (data.target_humidity_min && data.target_humidity_max) {
      if (data.target_humidity_min >= data.target_humidity_max) {
        throw new Error("Minimum humidity must be less than maximum humidity");
      }
    }

    if (data.target_ph_min && data.target_ph_max) {
      if (data.target_ph_min >= data.target_ph_max) {
        throw new Error("Minimum pH must be less than maximum pH");
      }
    }
  }

  protected validateUpdateData(data: Partial<CreateGrowRecipeInput>): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");
      if (data.name.length > 100) {
        throw new Error("Recipe name must be 100 characters or less");
      }
    }

    if (data.grow_days && (data.grow_days < 1 || data.grow_days > 365)) {
      throw new Error("Grow days must be between 1 and 365");
    }

    if (data.light_hours_per_day && (data.light_hours_per_day < 0 || data.light_hours_per_day > 24)) {
      throw new Error("Light hours per day must be between 0 and 24");
    }
  }

  async getRecipesBySpecies(speciesId: string): Promise<GrowRecipe[]> {
    this.validateId(speciesId, "speciesId");
    this.logOperation("getRecipesBySpecies", { speciesId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("species_id", speciesId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Get recipes by species");
  }

  async getRecipesByDifficulty(difficulty: GrowDifficulty): Promise<GrowRecipe[]> {
    this.validateRequired(difficulty, "difficulty");
    this.logOperation("getRecipesByDifficulty", { difficulty });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("difficulty", difficulty)
        .eq("is_active", true)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Get recipes by difficulty");
  }

  async searchRecipes(query: string): Promise<GrowRecipe[]> {
    this.validateRequired(query, "query");
    this.logOperation("searchRecipes", { query });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .or(`name.ilike.%${query}%,recipe_source.ilike.%${query}%`)
        .eq("is_active", true)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Search recipes");
  }

  async getFilteredRecipes(filters: GrowRecipeFilters): Promise<GrowRecipe[]> {
    this.logOperation("getFilteredRecipes", { filters });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields);

      // Apply filters
      if (filters.species_id) {
        query = query.eq("species_id", filters.species_id);
      }

      if (filters.difficulty) {
        query = query.eq("difficulty", filters.difficulty);
      }

      if (filters.pythium_risk) {
        query = query.eq("pythium_risk", filters.pythium_risk);
      }

      if (filters.min_grow_days) {
        query = query.gte("total_grow_days", filters.min_grow_days);
      }

      if (filters.max_grow_days) {
        query = query.lte("total_grow_days", filters.max_grow_days);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,recipe_source.ilike.%${filters.search}%`);
      }

      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }

      const result = await query.order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Get filtered recipes");
  }

  async getPaginatedRecipes(
    page: number = 1,
    limit: number = 10,
    filters?: GrowRecipeFilters
  ): Promise<PaginatedGrowRecipes> {
    this.logOperation("getPaginatedRecipes", { page, limit, filters });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields, { count: "exact" });

      // Apply filters if provided
      if (filters) {
        if (filters.species_id) {
          query = query.eq("species_id", filters.species_id);
        }
        if (filters.difficulty) {
          query = query.eq("difficulty", filters.difficulty);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,recipe_source.ilike.%${filters.search}%`);
        }
        if (filters.is_active !== undefined) {
          query = query.eq("is_active", filters.is_active);
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Order results
      query = query.order("name", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const paginatedResponse: PaginatedGrowRecipes = {
        data: (data || []) as unknown as GrowRecipe[],
        success: true,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      };

      return { data: paginatedResponse, error: null };
    }, "Get paginated recipes");
  }

  async duplicateRecipe(id: string, newName?: string): Promise<GrowRecipe> {
    this.validateId(id, "id");
    this.logOperation("duplicateRecipe", { id, newName });

    return this.executeWithAuth(async () => {
      // Get the original recipe
      const original = await this.getById(id);
      if (!original) {
        throw new Error("Recipe not found");
      }

      // Create duplicate data
      const { id: _, created_at: __, updated_at: ___, ...duplicateData } = original;
      const duplicatedRecipe = {
        ...duplicateData,
        name: newName || `${original.name} (Copy)`,
      };

      // Create the duplicate
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .insert([duplicatedRecipe])
          .select(this.selectFields)
          .single();
      }, "Duplicate recipe");

      return result as unknown as GrowRecipe;
    }, "Duplicate recipe");
  }

  async getActiveRecipes(): Promise<GrowRecipe[]> {
    this.logOperation("getActiveRecipes");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("is_active", true)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Get active recipes");
  }

  async toggleActiveStatus(id: string): Promise<GrowRecipe> {
    this.validateId(id, "id");
    this.logOperation("toggleActiveStatus", { id });

    return this.executeWithAuth(async () => {
      // First get current status
      const current = await this.getById(id);
      if (!current) {
        throw new Error("Recipe not found");
      }

      // Toggle the status
      const newStatus = !current.is_active;
      
      return this.update(id, { is_active: newStatus } as Partial<GrowRecipeEntity>) as Promise<GrowRecipe>;
    }, "Toggle recipe active status");
  }

  async getRecipeRecommendations(
    speciesId?: string,
    difficulty?: GrowDifficulty,
    maxGrowDays?: number
  ): Promise<GrowRecipe[]> {
    this.logOperation("getRecipeRecommendations", { speciesId, difficulty, maxGrowDays });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("is_active", true);

      if (speciesId) {
        query = query.eq("species_id", speciesId);
      }

      if (difficulty) {
        query = query.eq("difficulty", difficulty);
      }

      if (maxGrowDays) {
        query = query.lte("total_grow_days", maxGrowDays);
      }

      // Order by difficulty (Easy first) and then by total grow days
      const result = await query
        .order("difficulty", { ascending: true })
        .order("total_grow_days", { ascending: true })
        .limit(5);

      return {
        data: (result.data || []) as unknown as GrowRecipe[],
        error: result.error,
      };
    }, "Get recipe recommendations");
  }

  async getYieldEstimate(recipeId: string, shelfCount: number = 1): Promise<YieldEstimate> {
    this.validateId(recipeId, "recipeId");
    
    return this.executeQuery(async () => {
      const recipe = await this.getById(recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }

      // Get historical yield data for this recipe
      const { data: historicalYields, error: yieldsError } = await this.getSupabaseClient()
        .from("grows")
        .select("actual_yield")
        .eq("grow_recipe_id", recipeId)
        .eq("status", "completed")
        .not("actual_yield", "is", null);

      if (yieldsError) throw yieldsError;

      let baseYield = recipe.average_yield || 4;
      let confidence = 60; // Default confidence

      // If we have historical data, calculate more accurate estimates
      if (historicalYields && historicalYields.length > 0) {
        const yields = historicalYields.map(g => g.actual_yield).filter(y => y > 0);
        if (yields.length > 0) {
          baseYield = yields.reduce((sum, y) => sum + y, 0) / yields.length;
          confidence = Math.min(90, 60 + (yields.length * 5)); // Higher confidence with more data
        }
      }

      // Determine unit based on species category
      const unit = recipe.species?.category === 'leafy_greens' ? 'heads' : 'lbs';
      
      // Calculate range with variance based on confidence
      const variance = confidence > 80 ? 0.1 : confidence > 60 ? 0.2 : 0.3;
      const minYield = Math.max(1, Math.floor(baseYield * (1 - variance) * shelfCount));
      const maxYield = Math.ceil(baseYield * (1 + variance) * shelfCount);

      const estimate: YieldEstimate = {
        min: minYield,
        max: maxYield,
        unit,
        confidence
      };

      return { data: estimate, error: null };
    }, "Get yield estimate");
  }

  async getProfitEstimate(recipeId: string, shelfCount: number = 1): Promise<ProfitEstimate> {
    this.validateId(recipeId, "recipeId");

    return this.executeQuery(async () => {
      const recipe = await this.getById(recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }

      // Get market price data (this would come from a market prices table in real implementation)
      const baseMarketPrice = this.getEstimatedMarketPrice(recipe.species?.category || 'leafy_greens');
      
      // Get yield estimate
      const yieldEstimate = await this.getYieldEstimate(recipeId, shelfCount);
      
      // Calculate costs (simplified - in reality this would be much more detailed)
      const fixedCosts = this.calculateFixedCosts(recipe);
      const variableCosts = this.calculateVariableCosts(recipe, shelfCount);
      
      // Calculate revenue range
      const minRevenue = yieldEstimate.min * baseMarketPrice * 0.8; // Conservative pricing
      const maxRevenue = yieldEstimate.max * baseMarketPrice * 1.1; // Optimistic pricing
      
      // Calculate profit range
      const totalCosts = fixedCosts + variableCosts;
      const minProfit = Math.max(0, Math.floor(minRevenue - totalCosts));
      const maxProfit = Math.ceil(maxRevenue - totalCosts);

      const estimate: ProfitEstimate = {
        min: minProfit,
        max: maxProfit,
        currency: "USD",
        timeframe: "per cycle"
      };

      return { data: estimate, error: null };
    }, "Get profit estimate");
  }

  private getEstimatedMarketPrice(category: string): number {
    // Simplified market pricing - in reality this would come from market data APIs
    const marketPrices: Record<string, number> = {
      'leafy_greens': 3.50, // per head
      'herbs': 8.00, // per bunch
      'microgreens': 12.00, // per lb
      'fruits': 4.50, // per lb
      'root_vegetables': 2.80, // per lb
    };
    
    return marketPrices[category] || 4.00;
  }

  private calculateFixedCosts(recipe: GrowRecipeEntity): number {
    // Simplified cost calculation based on recipe complexity
    const baseCost = 15.00; // Base cost per shelf cycle
    
    let multiplier = 1.0;
    if (recipe.difficulty === 'Hard') multiplier = 1.3;
    if (recipe.difficulty === 'Medium') multiplier = 1.1;
    
    // Factor in grow time
    const growDays = recipe.total_grow_days || recipe.grow_days || 30;
    const timeMultiplier = Math.max(0.5, Math.min(2.0, growDays / 30));
    
    return Math.round(baseCost * multiplier * timeMultiplier);
  }

  private calculateVariableCosts(recipe: GrowRecipeEntity, shelfCount: number): number {
    // Variable costs that scale with shelf count
    const seedCost = 2.50; // per shelf
    const nutrientCost = 3.00; // per shelf
    const energyCost = (recipe.light_hours_per_day || 12) * 0.15; // per shelf based on lighting
    
    return Math.round((seedCost + nutrientCost + energyCost) * shelfCount);
  }

  async getRecipeWithEstimates(recipeId: string, shelfCount: number = 1): Promise<GrowRecipe & {
    yield_estimate: string;
    profit_estimate: string;
  }> {
    this.validateId(recipeId, "recipeId");

    const recipe = await this.getById(recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const [yieldEstimate, profitEstimate] = await Promise.all([
      this.getYieldEstimate(recipeId, shelfCount),
      this.getProfitEstimate(recipeId, shelfCount)
    ]);

    return {
      ...(recipe as GrowRecipe),
      yield_estimate: `${yieldEstimate.min}-${yieldEstimate.max} ${yieldEstimate.unit} per shelf`,
      profit_estimate: `$${profitEstimate.min}-$${profitEstimate.max} ${profitEstimate.timeframe}`
    };
  }

  async getAllRecipesWithEstimates(shelfCount: number = 1): Promise<Array<GrowRecipe & {
    yield_estimate: string;
    profit_estimate: string;
  }>> {
    const recipes = await this.getActiveRecipes();
    
    const recipesWithEstimates = await Promise.all(
      recipes.map(async (recipe) => {
        const [yieldEstimate, profitEstimate] = await Promise.all([
          this.getYieldEstimate(recipe.id, shelfCount),
          this.getProfitEstimate(recipe.id, shelfCount)
        ]);

        return {
          ...recipe,
          yield_estimate: `${yieldEstimate.min}-${yieldEstimate.max} ${yieldEstimate.unit} per shelf`,
          profit_estimate: `$${profitEstimate.min}-$${profitEstimate.max} ${profitEstimate.timeframe}`
        };
      })
    );

    return recipesWithEstimates;
  }
}