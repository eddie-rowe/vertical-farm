"use client";

import { BaseCRUDService } from "../../core/base/BaseCRUDService";

import { Row } from "./types";

export class RowService extends BaseCRUDService<Row> {
  protected readonly tableName = "rows";
  private static instance: RowService;

  private constructor() {
    super();
  }

  static getInstance(): RowService {
    if (!RowService.instance) {
      RowService.instance = new RowService();
    }
    return RowService.instance;
  }

  protected validateCreateData(data: any): void {
    this.validateRequired(data.name, "name");
    this.validateRequired(data.farm_id, "farm_id");
    this.validateRequired(data.position, "position");

    if (data.name.length > 100) {
      throw new Error("Row name must be 100 characters or less");
    }

    if (typeof data.position !== "number" || data.position < 0) {
      throw new Error("Position must be a non-negative number");
    }
  }

  protected validateUpdateData(data: any): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");

      if (data.name.length > 100) {
        throw new Error("Row name must be 100 characters or less");
      }
    }

    if (data.position !== undefined) {
      this.validateRequired(data.position, "position");

      if (typeof data.position !== "number" || data.position < 0) {
        throw new Error("Position must be a non-negative number");
      }
    }
  }

  async getRowsByFarm(farmId: string): Promise<Row[]> {
    this.validateId(farmId, "farmId");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("farm_id", farmId)
        .order("position");

      return {
        data: (result.data || []) as unknown as Row[],
        error: result.error,
      };
    }, "Get rows by farm");
  }

  async reorderRows(
    farmId: string,
    rowOrders: { id: string; position: number }[],
  ): Promise<void> {
    this.validateId(farmId, "farmId");

    return this.executeWithAuth(async () => {
      // Update positions in a transaction-like manner
      for (const { id, position } of rowOrders) {
        await this.update(id, { position });
      }
    }, "Reorder rows");
  }

  async getNextPosition(farmId: string): Promise<number> {
    this.validateId(farmId, "farmId");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select("position")
        .eq("farm_id", farmId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      // Return next position (highest + 1), or 0 if no rows exist
      const nextPosition = result.data ? (result.data as any).position + 1 : 0;
      return { data: nextPosition, error: null };
    }, "Get next position");
  }

  async duplicateRow(rowId: string, newName?: string): Promise<Row> {
    this.validateId(rowId, "rowId");

    const existingRow = await this.getById(rowId);
    if (!existingRow) {
      throw new Error("Row not found");
    }

    const nextPosition = await this.getNextPosition(existingRow.farm_id);

    const duplicateData = {
      name: newName || `${existingRow.name} (Copy)`,
      farm_id: existingRow.farm_id,
      position: nextPosition,
      description: existingRow.description,
    };

    return this.create(duplicateData);
  }
}
