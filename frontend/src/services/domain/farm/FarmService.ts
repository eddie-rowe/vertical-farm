"use client";

import { BaseCRUDService } from "../../core/base/BaseCRUDService";

import { Farm, FarmStatistics, FarmCapacity, FarmStatus, FarmWithCapacity } from "./types";

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

  async getFarmCapacity(farmId: string): Promise<FarmCapacity> {
    this.validateId(farmId, "farmId");

    return this.executeQuery(async () => {
      // Get total shelves in farm (through rows -> racks -> shelves)
      const { data: shelves, error: shelvesError } = await this.getSupabaseClient()
        .from("shelves")
        .select(`
          id,
          racks!inner(
            id,
            rows!inner(
              id,
              farm_id
            )
          )
        `)
        .eq("racks.rows.farm_id", farmId);

      if (shelvesError) throw shelvesError;

      const totalShelves = shelves?.length || 0;

      // Get occupied shelves using grow_location_assignments (correct schema)
      const { data: activeGrows, error: growsError } = await this.getSupabaseClient()
        .from("grow_location_assignments")
        .select(`
          id,
          grow_locations!inner(
            id,
            type
          ),
          grows!inner(
            id,
            status
          )
        `)
        .eq("grow_locations.type", "shelf")
        .in("grows.status", ["planned", "active", "harvested"])
        .is("removed_at", null);

      if (growsError) throw growsError;

      const usedShelves = activeGrows?.length || 0;
      const percentage = totalShelves > 0 ? Math.round((usedShelves / totalShelves) * 100) : 0;

      const capacity: FarmCapacity = {
        used: usedShelves,
        total: totalShelves,
        percentage
      };

      return { data: capacity, error: null };
    }, "Get farm capacity");
  }

  async getFarmStatus(farmId: string): Promise<FarmStatus> {
    this.validateId(farmId, "farmId");

    return this.executeQuery(async () => {
      // Check if farm has any device assignments
      const { data: devices, error: devicesError } = await this.getSupabaseClient()
        .from("device_assignments")
        .select(`
          id,
          is_active,
          shelves!inner(
            id,
            racks!inner(
              id,
              rows!inner(
                id,
                farm_id
              )
            )
          )
        `)
        .eq("shelves.racks.rows.farm_id", farmId);

      if (devicesError) throw devicesError;

      if (!devices || devices.length === 0) {
        return { data: FarmStatus.OFFLINE, error: null };
      }

      // Count device statuses (using is_active instead of status)
      const activeDevices = devices.filter(d => d.is_active === true).length;
      const inactiveDevices = devices.filter(d => d.is_active === false).length;

      const totalDevices = devices.length;
      const activePercentage = (activeDevices / totalDevices) * 100;

      // Determine overall farm status based on active devices
      let status: FarmStatus;
      if (activePercentage >= 80) {
        status = FarmStatus.ONLINE;
      } else if (activePercentage >= 20) {
        status = FarmStatus.PARTIAL;
      } else {
        status = FarmStatus.OFFLINE;
      }

      return { data: status, error: null };
    }, "Get farm status");
  }

  async getFarmsWithCapacity(userId: string): Promise<FarmWithCapacity[]> {
    this.validateId(userId, "userId");

    const farms = await this.getFarmsByUser(userId);
    
    const farmsWithCapacity: FarmWithCapacity[] = await Promise.all(
      farms.map(async (farm) => {
        const [capacity, status] = await Promise.all([
          this.getFarmCapacity(farm.id),
          this.getFarmStatus(farm.id)
        ]);

        return {
          ...farm,
          status,
          capacity,
          image: this.getIconForFarm(farm.name)
        };
      })
    );

    return farmsWithCapacity;
  }

  private getIconForFarm(farmName: string): string {
    if (farmName.toLowerCase().includes('alpha')) return '🏢';
    if (farmName.toLowerCase().includes('beta')) return '🌿';
    if (farmName.toLowerCase().includes('gamma')) return '🔧';
    return '🏭';
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
