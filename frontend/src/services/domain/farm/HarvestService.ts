"use client";

import type {
  HarvestEntity,
  CreateHarvestInput,
  UpdateHarvestInput,
  HarvestWithDetails,
  HarvestFilters,
  HarvestAnalytics,
  HarvestDashboardSummary,
  GrowProgress,
  ShelfHarvestStatus,
  YieldUnit,
  GrowQueryResult,
  HarvestStatsRow,
  QualityRatingRow,
} from "@/types/farm/harvest";

import { BaseCRUDService, type BaseEntity } from "../../core/base/BaseCRUDService";

// Re-export types for convenience
export type {
  HarvestEntity,
  CreateHarvestInput,
  UpdateHarvestInput,
  HarvestWithDetails,
  HarvestFilters,
  HarvestAnalytics,
  HarvestDashboardSummary,
  GrowProgress,
  ShelfHarvestStatus,
};

// Internal entity type that extends BaseEntity for BaseCRUDService compatibility
interface HarvestBaseEntity extends BaseEntity {
  shelf_id: string;
  grow_id: string;
  yield_amount: number;
  yield_unit: YieldUnit;
  yield_grams?: number;
  harvest_date: string;
  quality_rating?: number;
  notes?: string;
  photo_urls?: string[];
  documentation_urls?: string[];
  created_by?: string;
}

const VALID_YIELD_UNITS: YieldUnit[] = ["grams", "g", "kilograms", "kg", "pounds", "lbs", "ounces", "oz"];

export class HarvestService extends BaseCRUDService<HarvestBaseEntity> {
  protected readonly tableName = "harvests";
  protected readonly selectFields = `
    *,
    grow:grow_id(
      id,
      name,
      status,
      start_date,
      estimated_harvest_date,
      actual_harvest_date,
      grow_recipe:grow_recipe_id(
        id,
        name,
        species_id,
        total_grow_days,
        species:species_id(
          id,
          name
        )
      )
    ),
    shelf:shelf_id(
      id,
      name,
      rack_id,
      rack:rack_id(
        id,
        name,
        row_id,
        row:row_id(
          id,
          name,
          farm_id,
          farm:farm_id(
            id,
            name
          )
        )
      )
    )
  `;

  private static instance: HarvestService;

  private constructor() {
    super();
  }

  static getInstance(): HarvestService {
    if (!HarvestService.instance) {
      HarvestService.instance = new HarvestService();
    }
    return HarvestService.instance;
  }

  // ==================== Validation Methods ====================

  protected validateCreateData(data: CreateHarvestInput): void {
    this.validateRequired(data.yield_amount, "yield_amount");
    this.validateRequired(data.yield_unit, "yield_unit");
    this.validateRequired(data.grow_id, "grow_id");
    this.validateRequired(data.shelf_id, "shelf_id");

    if (typeof data.yield_amount !== "number" || data.yield_amount <= 0) {
      throw new Error("Yield amount must be a positive number");
    }

    if (!VALID_YIELD_UNITS.includes(data.yield_unit)) {
      throw new Error(`Invalid yield unit. Must be one of: ${VALID_YIELD_UNITS.join(", ")}`);
    }

    if (data.quality_rating !== undefined) {
      if (!Number.isInteger(data.quality_rating) || data.quality_rating < 1 || data.quality_rating > 10) {
        throw new Error("Quality rating must be an integer between 1 and 10");
      }
    }

    if (data.harvest_date && !this.isValidDate(data.harvest_date)) {
      throw new Error("Invalid harvest date format");
    }
  }

  protected validateUpdateData(data: Partial<UpdateHarvestInput>): void {
    if (data.yield_amount !== undefined) {
      if (typeof data.yield_amount !== "number" || data.yield_amount <= 0) {
        throw new Error("Yield amount must be a positive number");
      }
    }

    if (data.yield_unit !== undefined && !VALID_YIELD_UNITS.includes(data.yield_unit)) {
      throw new Error(`Invalid yield unit. Must be one of: ${VALID_YIELD_UNITS.join(", ")}`);
    }

    if (data.quality_rating !== undefined) {
      if (!Number.isInteger(data.quality_rating) || data.quality_rating < 1 || data.quality_rating > 10) {
        throw new Error("Quality rating must be an integer between 1 and 10");
      }
    }

    if (data.harvest_date && !this.isValidDate(data.harvest_date)) {
      throw new Error("Invalid harvest date format");
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // ==================== CRUD Operations ====================

  async createHarvest(data: CreateHarvestInput): Promise<HarvestWithDetails> {
    this.validateCreateData(data);
    this.logOperation("createHarvest", data);

    return this.executeWithAuth(async () => {
      const session = await this.authService.requireAuth();
      const harvestData = {
        ...data,
        created_by: session.user.id,
        harvest_date: data.harvest_date || new Date().toISOString(),
      };

      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .insert([harvestData])
          .select(this.selectFields)
          .single();
      }, "Create harvest");

      return result as unknown as HarvestWithDetails;
    }, "Create harvest");
  }

  // ==================== Query Methods ====================

  async getHarvestsByGrow(growId: string): Promise<HarvestWithDetails[]> {
    this.validateId(growId, "growId");
    this.logOperation("getHarvestsByGrow", { growId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("grow_id", growId)
        .order("harvest_date", { ascending: false });

      return {
        data: (result.data || []) as unknown as HarvestWithDetails[],
        error: result.error,
      };
    }, "Get harvests by grow");
  }

  async getHarvestsByShelf(shelfId: string): Promise<HarvestWithDetails[]> {
    this.validateId(shelfId, "shelfId");
    this.logOperation("getHarvestsByShelf", { shelfId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("shelf_id", shelfId)
        .order("harvest_date", { ascending: false });

      return {
        data: (result.data || []) as unknown as HarvestWithDetails[],
        error: result.error,
      };
    }, "Get harvests by shelf");
  }

  async getHarvestsByDateRange(from: string, to: string): Promise<HarvestWithDetails[]> {
    if (!this.isValidDate(from) || !this.isValidDate(to)) {
      throw new Error("Invalid date format for date range");
    }
    this.logOperation("getHarvestsByDateRange", { from, to });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .gte("harvest_date", from)
        .lte("harvest_date", to)
        .order("harvest_date", { ascending: false });

      return {
        data: (result.data || []) as unknown as HarvestWithDetails[],
        error: result.error,
      };
    }, "Get harvests by date range");
  }

  async getFilteredHarvests(filters: HarvestFilters): Promise<HarvestWithDetails[]> {
    this.logOperation("getFilteredHarvests", { filters });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields);

      if (filters.grow_id) {
        query = query.eq("grow_id", filters.grow_id);
      }

      if (filters.shelf_id) {
        query = query.eq("shelf_id", filters.shelf_id);
      }

      if (filters.harvest_date_from) {
        query = query.gte("harvest_date", filters.harvest_date_from);
      }

      if (filters.harvest_date_to) {
        query = query.lte("harvest_date", filters.harvest_date_to);
      }

      if (filters.min_quality !== undefined) {
        query = query.gte("quality_rating", filters.min_quality);
      }

      if (filters.max_quality !== undefined) {
        query = query.lte("quality_rating", filters.max_quality);
      }

      if (filters.min_yield !== undefined) {
        query = query.gte("yield_grams", filters.min_yield);
      }

      if (filters.created_by) {
        query = query.eq("created_by", filters.created_by);
      }

      if (filters.search) {
        query = query.ilike("notes", `%${filters.search}%`);
      }

      const result = await query.order("harvest_date", { ascending: false });

      return {
        data: (result.data || []) as unknown as HarvestWithDetails[],
        error: result.error,
      };
    }, "Get filtered harvests");
  }

  // ==================== Issue Requirements: Domain-Specific Methods ====================

  /**
   * Lists current (active/planned) grows for a specific farm
   * Requirement: listCurrentGrows(farmId)
   */
  async listCurrentGrows(farmId: string): Promise<GrowProgress[]> {
    this.validateId(farmId, "farmId");
    this.logOperation("listCurrentGrows", { farmId });

    return this.executeQuery(async () => {
      // Query grows through the shelf -> rack -> row -> farm hierarchy
      const result = await this.getSupabaseClient()
        .from("grows")
        .select(`
          id,
          name,
          status,
          start_date,
          estimated_harvest_date,
          progress_percentage,
          shelf:shelf_id(
            id,
            name,
            rack:rack_id(
              row:row_id(
                farm_id,
                farm:farm_id(name)
              )
            )
          ),
          grow_recipe:grow_recipe_id(
            species:species_id(name)
          )
        `)
        .in("status", ["planned", "active"])
        .order("start_date", { ascending: true });

      if (result.error) {
        return { data: [], error: result.error };
      }

      // Cast through unknown to handle Supabase's complex nested type inference
      // Filter to only grows belonging to the specified farm
      const grows = ((result.data as unknown as GrowQueryResult[]) || []).filter((grow) => {
        return grow.shelf?.rack?.row?.farm_id === farmId;
      });

      // Transform to GrowProgress format
      const progressData: GrowProgress[] = grows.map((grow) => {
        const startDate = new Date(grow.start_date);
        const now = new Date();
        const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        let daysRemaining: number | undefined;
        let isOverdue = false;

        if (grow.estimated_harvest_date) {
          const harvestDate = new Date(grow.estimated_harvest_date);
          daysRemaining = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          isOverdue = daysRemaining < 0;
        }

        return {
          grow_id: grow.id,
          grow_name: grow.name,
          status: grow.status,
          start_date: grow.start_date,
          estimated_harvest_date: grow.estimated_harvest_date,
          days_elapsed: Math.max(0, daysElapsed),
          days_remaining: daysRemaining,
          progress_percentage: grow.progress_percentage || 0,
          is_overdue: isOverdue,
          shelf_location: grow.shelf?.name,
          species_name: grow.grow_recipe?.species?.name,
        };
      });

      return { data: progressData, error: null };
    }, "List current grows");
  }

  /**
   * Lists historical grows with filtering
   * Requirement: listHistoricalGrows(filters)
   */
  async listHistoricalGrows(filters: HarvestFilters): Promise<GrowProgress[]> {
    this.logOperation("listHistoricalGrows", { filters });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from("grows")
        .select(`
          id,
          name,
          status,
          start_date,
          estimated_harvest_date,
          actual_harvest_date,
          progress_percentage,
          shelf:shelf_id(
            id,
            name,
            rack:rack_id(
              row:row_id(
                farm_id,
                farm:farm_id(name)
              )
            )
          ),
          grow_recipe:grow_recipe_id(
            species:species_id(name)
          )
        `)
        .in("status", ["harvested", "failed"]);

      if (filters.farm_id) {
        // We'll filter after the query due to nested relationship
      }

      if (filters.harvest_date_from) {
        query = query.gte("actual_harvest_date", filters.harvest_date_from);
      }

      if (filters.harvest_date_to) {
        query = query.lte("actual_harvest_date", filters.harvest_date_to);
      }

      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const result = await query.order("actual_harvest_date", { ascending: false });

      if (result.error) {
        return { data: [], error: result.error };
      }

      // Cast through unknown to handle Supabase's complex nested type inference
      let grows: GrowQueryResult[] = (result.data as unknown as GrowQueryResult[]) || [];

      // Filter by farm_id if provided
      if (filters.farm_id) {
        grows = grows.filter((grow) => {
          return grow.shelf?.rack?.row?.farm_id === filters.farm_id;
        });
      }

      // Transform to GrowProgress format
      const progressData: GrowProgress[] = grows.map((grow) => {
        const startDate = new Date(grow.start_date);
        const endDate = grow.actual_harvest_date ? new Date(grow.actual_harvest_date) : new Date();
        const daysElapsed = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          grow_id: grow.id,
          grow_name: grow.name,
          status: grow.status,
          start_date: grow.start_date,
          estimated_harvest_date: grow.estimated_harvest_date,
          days_elapsed: Math.max(0, daysElapsed),
          days_remaining: 0,
          progress_percentage: grow.progress_percentage || 100,
          is_overdue: false,
          shelf_location: grow.shelf?.name,
          species_name: grow.grow_recipe?.species?.name,
        };
      });

      return { data: progressData, error: null };
    }, "List historical grows");
  }

  /**
   * Gets progress information for a specific grow
   * Requirement: getGrowProgress(growId)
   */
  async getGrowProgress(growId: string): Promise<GrowProgress | null> {
    this.validateId(growId, "growId");
    this.logOperation("getGrowProgress", { growId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from("grows")
        .select(`
          id,
          name,
          status,
          start_date,
          estimated_harvest_date,
          actual_harvest_date,
          progress_percentage,
          shelf:shelf_id(
            id,
            name,
            rack:rack_id(
              row:row_id(
                farm_id,
                farm:farm_id(name)
              )
            )
          ),
          grow_recipe:grow_recipe_id(
            total_grow_days,
            species:species_id(name)
          )
        `)
        .eq("id", growId)
        .single();

      if (result.error) {
        if (result.error.code === "PGRST116") {
          return { data: null, error: null };
        }
        return { data: null, error: result.error };
      }

      // Cast through unknown to handle Supabase's complex nested type inference
      const grow = result.data as unknown as GrowQueryResult;
      const startDate = new Date(grow.start_date);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      let daysRemaining: number | undefined;
      let isOverdue = false;
      let progressPercentage = grow.progress_percentage || 0;

      if (grow.estimated_harvest_date) {
        const harvestDate = new Date(grow.estimated_harvest_date);
        daysRemaining = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0 && grow.status !== "harvested";
      }

      // Calculate progress if not stored
      const totalGrowDays = grow.grow_recipe?.total_grow_days;
      if (!progressPercentage && totalGrowDays) {
        progressPercentage = Math.min(100, Math.round((daysElapsed / totalGrowDays) * 100));
      }

      if (grow.status === "harvested") {
        progressPercentage = 100;
      }

      const progressData: GrowProgress = {
        grow_id: grow.id,
        grow_name: grow.name,
        status: grow.status,
        start_date: grow.start_date,
        estimated_harvest_date: grow.estimated_harvest_date,
        days_elapsed: Math.max(0, daysElapsed),
        days_remaining: daysRemaining,
        progress_percentage: progressPercentage,
        is_overdue: isOverdue,
        shelf_location: grow.shelf?.name,
        species_name: grow.grow_recipe?.species?.name,
      };

      return { data: progressData, error: null };
    }, "Get grow progress");
  }

  /**
   * Gets harvest status for a specific shelf
   * Requirement: getHarvestStatus(shelfId)
   */
  async getHarvestStatus(shelfId: string): Promise<ShelfHarvestStatus | null> {
    this.validateId(shelfId, "shelfId");
    this.logOperation("getHarvestStatus", { shelfId });

    return this.executeQuery(async () => {
      // Get shelf info
      const shelfResult = await this.getSupabaseClient()
        .from("shelves")
        .select("id, name")
        .eq("id", shelfId)
        .single();

      if (shelfResult.error) {
        if (shelfResult.error.code === "PGRST116") {
          return { data: null, error: null };
        }
        return { data: null, error: shelfResult.error };
      }

      // Get current grow on shelf
      const currentGrowResult = await this.getSupabaseClient()
        .from("grows")
        .select("id, name, status, progress_percentage, estimated_harvest_date")
        .eq("shelf_id", shelfId)
        .in("status", ["planned", "active"])
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get last harvest
      const lastHarvestResult = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("shelf_id", shelfId)
        .order("harvest_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get harvest stats for this shelf
      const statsResult = await this.getSupabaseClient()
        .from(this.tableName)
        .select("yield_grams, quality_rating")
        .eq("shelf_id", shelfId);

      let totalHarvests = 0;
      let totalYieldGrams = 0;
      let averageQuality = 0;

      if (statsResult.data && statsResult.data.length > 0) {
        const statsData = statsResult.data as HarvestStatsRow[];
        totalHarvests = statsData.length;
        totalYieldGrams = statsData.reduce((sum: number, h: HarvestStatsRow) => sum + (h.yield_grams || 0), 0);
        const qualitySum = statsData.reduce((sum: number, h: HarvestStatsRow) => sum + (h.quality_rating || 0), 0);
        const qualityCount = statsData.filter((h: HarvestStatsRow) => h.quality_rating).length;
        averageQuality = qualityCount > 0 ? qualitySum / qualityCount : 0;
      }

      const status: ShelfHarvestStatus = {
        shelf_id: shelfResult.data.id,
        shelf_name: shelfResult.data.name,
        current_grow: currentGrowResult.data
          ? {
              id: currentGrowResult.data.id,
              name: currentGrowResult.data.name,
              status: currentGrowResult.data.status,
              progress_percentage: currentGrowResult.data.progress_percentage || 0,
              estimated_harvest_date: currentGrowResult.data.estimated_harvest_date,
            }
          : undefined,
        last_harvest: lastHarvestResult.data as unknown as HarvestWithDetails | undefined,
        total_harvests: totalHarvests,
        total_yield_grams: totalYieldGrams,
        average_quality: Math.round(averageQuality * 10) / 10,
      };

      return { data: status, error: null };
    }, "Get harvest status");
  }

  /**
   * Aborts a grow with a reason
   * Requirement: abort(growId, reason)
   */
  async abort(growId: string, reason: string): Promise<void> {
    this.validateId(growId, "growId");
    this.validateRequired(reason, "reason");
    this.logOperation("abort", { growId, reason });

    return this.executeWithAuth(async () => {
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("grows")
          .update({
            status: "failed",
            is_active: false,
            notes: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", growId)
          .select("id")
          .single();
      }, "Abort grow");

      return result as unknown as void;
    }, "Abort grow");
  }

  /**
   * Gets a dashboard summary of harvest data
   * Requirement: getDashboardSummary()
   */
  async getDashboardSummary(): Promise<HarvestDashboardSummary> {
    this.logOperation("getDashboardSummary");

    return this.executeWithAuth(async () => {
      const session = await this.authService.requireAuth();
      const userId = session.user.id;

      // Get all harvests for this user
      const allHarvestsResult = await this.getSupabaseClient()
        .from(this.tableName)
        .select("yield_grams, quality_rating, harvest_date")
        .eq("created_by", userId);

      // Get recent harvests with details
      const recentResult = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("created_by", userId)
        .order("harvest_date", { ascending: false })
        .limit(5);

      // Calculate this month's data
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const thisMonthResult = await this.getSupabaseClient()
        .from(this.tableName)
        .select("yield_grams, quality_rating")
        .eq("created_by", userId)
        .gte("harvest_date", firstOfMonth);

      // Process all harvests stats
      const allHarvests = (allHarvestsResult.data || []) as HarvestStatsRow[];
      const totalHarvests = allHarvests.length;
      const totalYieldGrams = allHarvests.reduce((sum: number, h: HarvestStatsRow) => sum + (h.yield_grams || 0), 0);
      const qualityRatings = allHarvests.filter((h: HarvestStatsRow) => h.quality_rating).map((h: HarvestStatsRow) => h.quality_rating as number);
      const averageQuality = qualityRatings.length > 0
        ? qualityRatings.reduce((sum: number, q: number) => sum + q, 0) / qualityRatings.length
        : 0;

      // Process this month's stats
      const thisMonthHarvests = (thisMonthResult.data || []) as HarvestStatsRow[];
      const harvestsThisMonth = thisMonthHarvests.length;
      const yieldThisMonthGrams = thisMonthHarvests.reduce((sum: number, h: HarvestStatsRow) => sum + (h.yield_grams || 0), 0);

      // Calculate quality distribution
      const qualityDistribution = {
        excellent: 0, // 9-10
        good: 0, // 7-8
        average: 0, // 5-6
        poor: 0, // 1-4
      };

      allHarvests.forEach((h: HarvestStatsRow) => {
        const rating = h.quality_rating;
        if (rating !== null && rating !== undefined) {
          if (rating >= 9) qualityDistribution.excellent++;
          else if (rating >= 7) qualityDistribution.good++;
          else if (rating >= 5) qualityDistribution.average++;
          else if (rating >= 1) qualityDistribution.poor++;
        }
      });

      const summary: HarvestDashboardSummary = {
        total_harvests: totalHarvests,
        total_yield_grams: totalYieldGrams,
        average_quality: Math.round(averageQuality * 10) / 10,
        recent_harvests: (recentResult.data || []) as unknown as HarvestWithDetails[],
        harvests_this_month: harvestsThisMonth,
        yield_this_month_grams: yieldThisMonthGrams,
        quality_distribution: qualityDistribution,
      };

      return summary;
    }, "Get dashboard summary");
  }

  // ==================== Analytics Methods ====================

  /**
   * Gets total yield for a grow (sum of all harvests)
   */
  async getTotalYield(growId: string): Promise<number> {
    this.validateId(growId, "growId");
    this.logOperation("getTotalYield", { growId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select("yield_grams")
        .eq("grow_id", growId);

      if (result.error) {
        return { data: 0, error: result.error };
      }

      const total = ((result.data || []) as HarvestStatsRow[]).reduce((sum: number, h: HarvestStatsRow) => sum + (h.yield_grams || 0), 0);
      return { data: total, error: null };
    }, "Get total yield");
  }

  /**
   * Gets average quality rating for a grow
   */
  async getAverageQuality(growId: string): Promise<number> {
    this.validateId(growId, "growId");
    this.logOperation("getAverageQuality", { growId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select("quality_rating")
        .eq("grow_id", growId)
        .not("quality_rating", "is", null);

      if (result.error) {
        return { data: 0, error: result.error };
      }

      const ratings = (result.data || []) as QualityRatingRow[];
      if (ratings.length === 0) {
        return { data: 0, error: null };
      }

      const avg = ratings.reduce((sum: number, h: QualityRatingRow) => sum + h.quality_rating, 0) / ratings.length;
      return { data: Math.round(avg * 10) / 10, error: null };
    }, "Get average quality");
  }

  /**
   * Gets harvest analytics for a grow or user
   */
  async getHarvestAnalytics(growId?: string): Promise<HarvestAnalytics> {
    this.logOperation("getHarvestAnalytics", { growId });

    return this.executeWithAuth(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields);

      if (growId) {
        this.validateId(growId, "growId");
        query = query.eq("grow_id", growId);
      } else {
        const session = await this.authService.requireAuth();
        query = query.eq("created_by", session.user.id);
      }

      const result = await query.order("harvest_date", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      const harvests = (result.data || []) as unknown as HarvestWithDetails[];

      // Calculate analytics
      const totalHarvests = harvests.length;
      const totalYieldGrams = harvests.reduce((sum, h) => sum + (h.yield_grams || 0), 0);
      const ratingsWithValue = harvests.filter((h) => h.quality_rating);
      const averageQuality = ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, h) => sum + (h.quality_rating || 0), 0) / ratingsWithValue.length
        : 0;
      const averageYieldGrams = totalHarvests > 0 ? totalYieldGrams / totalHarvests : 0;

      // Find best quality and highest yield
      const bestQualityHarvest = harvests.reduce<HarvestWithDetails | undefined>((best, h) => {
        if (!best || (h.quality_rating || 0) > (best.quality_rating || 0)) {
          return h;
        }
        return best;
      }, undefined);

      const highestYieldHarvest = harvests.reduce<HarvestWithDetails | undefined>((best, h) => {
        if (!best || (h.yield_grams || 0) > (best.yield_grams || 0)) {
          return h;
        }
        return best;
      }, undefined);

      // Group by month
      const harvestsByMonth: Record<string, number> = {};
      harvests.forEach((h) => {
        const month = h.harvest_date.substring(0, 7); // YYYY-MM
        harvestsByMonth[month] = (harvestsByMonth[month] || 0) + 1;
      });

      // Group yield by species
      const yieldBySpecies: Record<string, number> = {};
      harvests.forEach((h) => {
        const speciesName = h.grow?.grow_recipe?.species?.name || "Unknown";
        yieldBySpecies[speciesName] = (yieldBySpecies[speciesName] || 0) + (h.yield_grams || 0);
      });

      const analytics: HarvestAnalytics = {
        total_harvests: totalHarvests,
        total_yield_grams: totalYieldGrams,
        average_quality: Math.round(averageQuality * 10) / 10,
        average_yield_grams: Math.round(averageYieldGrams * 10) / 10,
        best_quality_harvest: bestQualityHarvest,
        highest_yield_harvest: highestYieldHarvest,
        harvests_by_month: harvestsByMonth,
        yield_by_species: yieldBySpecies,
      };

      return analytics;
    }, "Get harvest analytics");
  }
}
