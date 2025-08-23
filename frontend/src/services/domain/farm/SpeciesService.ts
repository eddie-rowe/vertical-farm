"use client";

import type { Species, CreateSpeciesInput } from "@/types/farm/recipes";

import { BaseCRUDService, type BaseEntity } from "../../core/base/BaseCRUDService";

interface SpeciesEntity extends BaseEntity {
  name: string;
  description?: string | null;
  scientific_name?: string;
  category?: string;
  is_active?: boolean;
}

export class SpeciesService extends BaseCRUDService<SpeciesEntity> {
  protected readonly tableName = "species";
  protected readonly selectFields = "*";
  private static instance: SpeciesService;

  private constructor() {
    super();
  }

  static getInstance(): SpeciesService {
    if (!SpeciesService.instance) {
      SpeciesService.instance = new SpeciesService();
    }
    return SpeciesService.instance;
  }

  protected validateCreateData(data: CreateSpeciesInput): void {
    this.validateRequired(data.name, "name");

    if (data.name.length > 100) {
      throw new Error("Species name must be 100 characters or less");
    }

    if (data.description && data.description.length > 500) {
      throw new Error("Species description must be 500 characters or less");
    }

    if (data.scientific_name && data.scientific_name.length > 200) {
      throw new Error("Scientific name must be 200 characters or less");
    }
  }

  protected validateUpdateData(data: Partial<CreateSpeciesInput>): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");
      if (data.name.length > 100) {
        throw new Error("Species name must be 100 characters or less");
      }
    }

    if (data.description && data.description.length > 500) {
      throw new Error("Species description must be 500 characters or less");
    }

    if (data.scientific_name && data.scientific_name.length > 200) {
      throw new Error("Scientific name must be 200 characters or less");
    }
  }

  async getActiveSpecies(): Promise<Species[]> {
    this.logOperation("getActiveSpecies");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("is_active", true)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as Species[],
        error: result.error,
      };
    }, "Get active species");
  }

  async getSpeciesByCategory(category: string): Promise<Species[]> {
    this.validateRequired(category, "category");
    this.logOperation("getSpeciesByCategory", { category });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("category", category)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as Species[],
        error: result.error,
      };
    }, "Get species by category");
  }

  async searchSpecies(query: string): Promise<Species[]> {
    this.validateRequired(query, "query");
    this.logOperation("searchSpecies", { query });

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .or(`name.ilike.%${query}%,scientific_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order("name", { ascending: true });

      return {
        data: (result.data || []) as unknown as Species[],
        error: result.error,
      };
    }, "Search species");
  }

  async getDistinctCategories(): Promise<string[]> {
    this.logOperation("getDistinctCategories");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select("category")
        .not("category", "is", null)
        .order("category", { ascending: true });

      if (result.error) {
        return { data: [], error: result.error };
      }

      // Extract unique categories
      const categories = [...new Set(
        (result.data || [])
          .map((item: any) => item.category)
          .filter((cat: any) => cat && typeof cat === 'string')
      )] as string[];

      return { data: categories, error: null };
    }, "Get distinct categories");
  }

  async toggleActiveStatus(id: string): Promise<Species> {
    this.validateId(id, "id");
    this.logOperation("toggleActiveStatus", { id });

    return this.executeWithAuth(async () => {
      // First get current status
      const current = await this.getById(id);
      if (!current) {
        throw new Error("Species not found");
      }

      // Toggle the status
      const newStatus = !current.is_active;
      
      return this.update(id, { is_active: newStatus } as Partial<SpeciesEntity>);
    }, "Toggle species active status");
  }
}