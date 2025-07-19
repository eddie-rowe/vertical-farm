"use client";

import { BaseCRUDService } from "../../core/base/BaseCRUDService";
import { Farm, FarmStatistics } from "./types";

export class FarmService extends BaseCRUDService<Farm> {
  protected readonly tableName = "farms";
  private static instance: FarmService;

  private constructor() {
    super();
  }

  static getInstance(): FarmService {
    if (!FarmService.instance) {
      FarmService.instance = new FarmService();
    }
    return FarmService.instance;
  }

  protected validateCreateData(data: any): void {
    this.validateRequired(data.name, "name");

    if (data.name.length > 100) {
      throw new Error("Farm name must be 100 characters or less");
    }

    if (data.location && data.location.length > 255) {
      throw new Error("Farm location must be 255 characters or less");
    }
  }

  protected validateUpdateData(data: any): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");

      if (data.name.length > 100) {
        throw new Error("Farm name must be 100 characters or less");
      }
    }

    if (
      data.location !== undefined &&
      data.location !== null &&
      data.location.length > 255
    ) {
      throw new Error("Farm location must be 255 characters or less");
    }
  }

  async getFarmsByUser(userId: string): Promise<Farm[]> {
    this.validateId(userId, "userId");

    return this.findByField("user_id", userId);
  }

  async getFarmsByLocation(location: string): Promise<Farm[]> {
    this.validateRequired(location, "location");

    return this.findByField("location", location);
  }

  async getFarmStatistics(farmId: string): Promise<FarmStatistics> {
    this.validateId(farmId, "farmId");

    return this.executeQuery(async () => {
      const [rowCount, rackCount, shelfCount] = await Promise.all([
        this.countRelatedRecords("rows", "farm_id", farmId),
        this.countRelatedRecords("racks", "row_id", farmId, "farm_id"),
        this.countRelatedRecords("shelves", "rack_id", farmId, "farm_id"),
      ]);

      const statistics: FarmStatistics = {
        totalRows: rowCount,
        totalRacks: rackCount,
        totalShelves: shelfCount,
        lastUpdated: new Date().toISOString(),
      };

      return { data: statistics, error: null };
    }, "Get farm statistics");
  }

  async searchFarms(query: string): Promise<Farm[]> {
    this.validateRequired(query, "query");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`);

      return {
        data: (result.data || []) as unknown as Farm[],
        error: result.error,
      };
    }, "Search farms");
  }

  private async countRelatedRecords(
    table: string,
    foreignKey: string,
    value: string,
    joinField?: string,
  ): Promise<number> {
    if (joinField) {
      // For nested relationships, we need to use a different approach
      // This is a simplified version - in production, you'd want to use SQL joins
      const { count, error } = await this.getSupabaseClient()
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(foreignKey, value);

      if (error) {
        throw error;
      }

      return count || 0;
    } else {
      const { count, error } = await this.getSupabaseClient()
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(foreignKey, value);

      if (error) {
        throw error;
      }

      return count || 0;
    }
  }
}
