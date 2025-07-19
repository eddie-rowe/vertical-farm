"use client";

import { BaseCRUDService } from "../../core/base/BaseCRUDService";
import { Shelf } from "./types";

export class ShelfService extends BaseCRUDService<Shelf> {
  protected readonly tableName = "shelves";
  private static instance: ShelfService;

  private constructor() {
    super();
  }

  static getInstance(): ShelfService {
    if (!ShelfService.instance) {
      ShelfService.instance = new ShelfService();
    }
    return ShelfService.instance;
  }

  protected validateCreateData(data: any): void {
    this.validateRequired(data.name, "name");
    this.validateRequired(data.rack_id, "rack_id");
    this.validateRequired(data.position, "position");

    if (data.name.length > 100) {
      throw new Error("Shelf name must be 100 characters or less");
    }

    if (typeof data.position !== "number" || data.position < 0) {
      throw new Error("Position must be a non-negative number");
    }
  }

  protected validateUpdateData(data: any): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, "name");

      if (data.name.length > 100) {
        throw new Error("Shelf name must be 100 characters or less");
      }
    }

    if (data.position !== undefined) {
      this.validateRequired(data.position, "position");

      if (typeof data.position !== "number" || data.position < 0) {
        throw new Error("Position must be a non-negative number");
      }
    }
  }

  async getShelvesByRack(rackId: string): Promise<Shelf[]> {
    this.validateId(rackId, "rackId");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq("rack_id", rackId)
        .order("position");

      return {
        data: (result.data || []) as unknown as Shelf[],
        error: result.error,
      };
    }, "Get shelves by rack");
  }

  async reorderShelves(
    rackId: string,
    shelfOrders: { id: string; position: number }[],
  ): Promise<void> {
    this.validateId(rackId, "rackId");

    return this.executeWithAuth(async () => {
      // Update positions in a transaction-like manner
      for (const { id, position } of shelfOrders) {
        await this.update(id, { position });
      }
    }, "Reorder shelves");
  }

  async getNextPosition(rackId: string): Promise<number> {
    this.validateId(rackId, "rackId");

    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select("position")
        .eq("rack_id", rackId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      // Return next position (highest + 1), or 0 if no shelves exist
      const nextPosition = result.data ? (result.data as any).position + 1 : 0;
      return { data: nextPosition, error: null };
    }, "Get next position");
  }

  async duplicateShelf(shelfId: string, newName?: string): Promise<Shelf> {
    this.validateId(shelfId, "shelfId");

    const existingShelf = await this.getById(shelfId);
    if (!existingShelf) {
      throw new Error("Shelf not found");
    }

    const nextPosition = await this.getNextPosition(existingShelf.rack_id);

    const duplicateData = {
      name: newName || `${existingShelf.name} (Copy)`,
      rack_id: existingShelf.rack_id,
      position: nextPosition,
      description: existingShelf.description,
    };

    return this.create(duplicateData);
  }
}
