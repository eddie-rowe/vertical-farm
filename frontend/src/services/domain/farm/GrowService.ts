"use client";

import type { GrowStatus } from "@/types/automation/grow";

import { BaseCRUDService, type BaseEntity } from "../../core/base/BaseCRUDService";

interface GrowEntity extends BaseEntity {
  name: string;
  grow_recipe_id: string;
  shelf_id: string;
  user_id?: string;
  start_date: string;
  estimated_harvest_date?: string;
  actual_harvest_date?: string;
  status: GrowStatus;
  notes?: string;
  is_active?: boolean;
  yield_actual?: number;
  yield_unit?: string;
  automation_enabled?: boolean;
  current_stage?: string;
  progress_percentage?: number;
}

export interface CreateGrowInput {
  name: string;
  grow_recipe_id: string;
  shelf_id: string;
  start_date: string;
  estimated_harvest_date?: string;
  notes?: string;
  automation_enabled?: boolean;
}

export interface UpdateGrowInput extends Partial<CreateGrowInput> {
  id: string;
  status?: GrowStatus;
  actual_harvest_date?: string;
  yield_actual?: number;
  yield_unit?: string;
  current_stage?: string;
  progress_percentage?: number;
}

export interface GrowWithDetails extends GrowEntity {
  grow_recipe?: {
    id: string;
    name: string;
    species_id: string;
    total_grow_days?: number;
    difficulty?: string;
    species?: {
      id: string;
      name: string;
      image?: string;
    };
  };
  shelf?: {
    id: string;
    name: string;
    rack_id: string;
    rack?: {
      id: string;
      name: string;
      row_id: string;
      row?: {
        id: string;
        name: string;
        farm_id: string;
        farm?: {
          id: string;
          name: string;
        };
      };
    };
  };
}

export interface GrowFilters {
  status?: GrowStatus;
  shelf_id?: string;
  grow_recipe_id?: string;
  user_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  is_active?: boolean;
  search?: string;
}

export class GrowService extends BaseCRUDService<GrowEntity> {
  protected readonly tableName = "grows";
  protected readonly selectFields = `
    *,
    grow_recipe:grow_recipe_id(
      id,
      name,
      species_id,
      total_grow_days,
      difficulty,
      species:species_id(
        id,
        name
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
  private static instance: GrowService;

  private constructor() {
    super();
  }

  static getInstance(): GrowService {
    if (!GrowService.instance) {
      GrowService.instance = new GrowService();
    }
    return GrowService.instance;
  }

  protected validateCreateData(data: CreateGrowInput): void {
    this.validateRequired(data.name, "name");
    this.validateRequired(data.grow_recipe_id, "grow_recipe_id");
    this.validateRequired(data.shelf_id, "shelf_id");
    this.validateRequired(data.start_date, "start_date");

    if (data.name.length > 100) {
      throw new Error("Grow name must be 100 characters or less");
    }

    // Validate date format
    if (!this.isValidDate(data.start_date)) {
      throw new Error("Invalid start date format");
    }

    if (data.estimated_harvest_date && !this.isValidDate(data.estimated_harvest_date)) {
      throw new Error("Invalid estimated harvest date format");
    }

    // Validate that harvest date is after start date
    if (data.estimated_harvest_date) {
      const startDate = new Date(data.start_date);
      const harvestDate = new Date(data.estimated_harvest_date);
      if (harvestDate <= startDate) {
        throw new Error("Estimated harvest date must be after start date");
      }
    }
  }

  protected validateUpdateData(data: Partial<CreateGrowInput>): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");
      if (data.name.length > 100) {
        throw new Error("Grow name must be 100 characters or less");
      }
    }

    if (data.start_date && !this.isValidDate(data.start_date)) {
      throw new Error("Invalid start date format");
    }

    if (data.estimated_harvest_date && !this.isValidDate(data.estimated_harvest_date)) {
      throw new Error("Invalid estimated harvest date format");
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  async createGrow(data: CreateGrowInput): Promise<GrowWithDetails> {
    this.validateCreateData(data);
    this.logOperation("createGrow", data);

    return this.executeWithAuth(async () => {
      // Add user_id automatically
      const user = await this.authService.requireAuth();
      const growData = {
        ...data,
        user_id: user.id,
        status: "planned" as GrowStatus,
        is_active: true,
        progress_percentage: 0,
      };

      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .insert([growData])
          .select(this.selectFields)
          .single();
      }, "Create grow");

      return result as unknown as GrowWithDetails;
    }, "Create grow");
  }

  async getGrowsByUser(userId: string): Promise<GrowWithDetails[]> {
    this.validateId(userId, "userId");
    this.logOperation("getGrowsByUser", { userId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      return {
        data: (result.data || []) as unknown as GrowWithDetails[],
        error: result.error,
      };
    }, "Get grows by user");
  }

  async getGrowsByShelf(shelfId: string): Promise<GrowWithDetails[]> {
    this.validateId(shelfId, "shelfId");
    this.logOperation("getGrowsByShelf", { shelfId });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("shelf_id", shelfId)
        .order("created_at", { ascending: false });

      return {
        data: (result.data || []) as unknown as GrowWithDetails[],
        error: result.error,
      };
    }, "Get grows by shelf");
  }

  async getGrowsByStatus(status: GrowStatus): Promise<GrowWithDetails[]> {
    this.validateRequired(status, "status");
    this.logOperation("getGrowsByStatus", { status });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("status", status)
        .order("created_at", { ascending: false });

      return {
        data: (result.data || []) as unknown as GrowWithDetails[],
        error: result.error,
      };
    }, "Get grows by status");
  }

  async getActiveGrows(): Promise<GrowWithDetails[]> {
    this.logOperation("getActiveGrows");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("is_active", true)
        .in("status", ["planned", "active"])
        .order("start_date", { ascending: true });

      return {
        data: (result.data || []) as unknown as GrowWithDetails[],
        error: result.error,
      };
    }, "Get active grows");
  }

  async getFilteredGrows(filters: GrowFilters): Promise<GrowWithDetails[]> {
    this.logOperation("getFilteredGrows", { filters });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields);

      // Apply filters
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.shelf_id) {
        query = query.eq("shelf_id", filters.shelf_id);
      }

      if (filters.grow_recipe_id) {
        query = query.eq("grow_recipe_id", filters.grow_recipe_id);
      }

      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      if (filters.start_date_from) {
        query = query.gte("start_date", filters.start_date_from);
      }

      if (filters.start_date_to) {
        query = query.lte("start_date", filters.start_date_to);
      }

      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const result = await query.order("created_at", { ascending: false });

      return {
        data: (result.data || []) as unknown as GrowWithDetails[],
        error: result.error,
      };
    }, "Get filtered grows");
  }

  async updateGrowStatus(id: string, status: GrowStatus): Promise<GrowWithDetails> {
    this.validateId(id, "id");
    this.validateRequired(status, "status");
    this.logOperation("updateGrowStatus", { id, status });

    return this.executeWithAuth(async () => {
      const updateData: Partial<GrowEntity> = { status };

      // If harvesting, set actual harvest date
      if (status === "harvested") {
        updateData.actual_harvest_date = new Date().toISOString();
        updateData.progress_percentage = 100;
      }

      // If activating, update progress
      if (status === "active" || status === "planned") {
        updateData.is_active = true;
      }

      // If failed or harvested, mark as inactive
      if (status === "failed" || status === "harvested") {
        updateData.is_active = false;
      }

      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .update(updateData)
          .eq("id", id)
          .select(this.selectFields)
          .single();
      }, "Update grow status");

      return result as unknown as GrowWithDetails;
    }, "Update grow status");
  }

  async startMultipleGrows(growInputs: CreateGrowInput[]): Promise<GrowWithDetails[]> {
    this.logOperation("startMultipleGrows", { count: growInputs.length });

    if (growInputs.length === 0) {
      throw new Error("No grows to create");
    }

    // Validate all inputs first
    growInputs.forEach((input, index) => {
      try {
        this.validateCreateData(input);
      } catch (error) {
        throw new Error(`Validation error for grow ${index + 1}: ${error}`);
      }
    });

    return this.executeWithAuth(async () => {
      const user = await this.authService.requireAuth();
      
      const growsData = growInputs.map((input) => ({
        ...input,
        user_id: user.id,
        status: "planned" as GrowStatus,
        is_active: true,
        progress_percentage: 0,
      }));

      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .insert(growsData)
          .select(this.selectFields);
      }, "Start multiple grows");

      return (result || []) as unknown as GrowWithDetails[];
    }, "Start multiple grows");
  }

  async calculateGrowProgress(id: string): Promise<number> {
    this.validateId(id, "id");
    this.logOperation("calculateGrowProgress", { id });

    const grow = await this.getById(id);
    if (!grow) {
      throw new Error("Grow not found");
    }

    if (grow.status === "harvested") {
      return 100;
    }

    if (grow.status === "failed" || grow.status === "planned") {
      return 0;
    }

    const startDate = new Date(grow.start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get estimated total days from the recipe
    const growWithDetails = await this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("id", id)
        .single();

      return { data: result.data, error: result.error };
    }, "Get grow for progress calculation");

    const growDetails = growWithDetails as unknown as GrowWithDetails;
    const totalGrowDays = growDetails?.grow_recipe?.total_grow_days || 30; // Default 30 days

    const progress = Math.min(100, Math.max(0, (daysSinceStart / totalGrowDays) * 100));
    
    // Update the progress in the database
    await this.update(id, { progress_percentage: Math.round(progress) } as Partial<GrowEntity>);

    return Math.round(progress);
  }

  async getGrowSummary(userId?: string): Promise<{
    total: number;
    active: number;
    planned: number;
    harvested: number;
    failed: number;
  }> {
    this.logOperation("getGrowSummary", { userId });

    return this.executeQuery(async () => {
      let query = this.getSupabaseClient()
        .from(this.tableName)
        .select("status", { count: "exact" });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { count: total, error: totalError } = await query;

      if (totalError) {
        return { data: null, error: totalError };
      }

      // Get counts by status
      const statuses = ["active", "planned", "harvested", "failed"] as GrowStatus[];
      const statusCounts = await Promise.all(
        statuses.map(async (status) => {
          let statusQuery = this.getSupabaseClient()
            .from(this.tableName)
            .select("*", { count: "exact", head: true })
            .eq("status", status);

          if (userId) {
            statusQuery = statusQuery.eq("user_id", userId);
          }

          const { count } = await statusQuery;
          return { status, count: count || 0 };
        })
      );

      const summary = statusCounts.reduce(
        (acc, { status, count }) => {
          acc[status] = count;
          return acc;
        },
        { total: total || 0, active: 0, planned: 0, harvested: 0, failed: 0 }
      );

      return { data: summary, error: null };
    }, "Get grow summary");
  }
}