'use client';

import { BaseCRUDService } from '../../core/base/BaseCRUDService';
import { Rack } from './types';

export class RackService extends BaseCRUDService<Rack> {
  protected readonly tableName = 'racks';
  private static instance: RackService;

  private constructor() {
    super();
  }

  static getInstance(): RackService {
    if (!RackService.instance) {
      RackService.instance = new RackService();
    }
    return RackService.instance;
  }

  protected validateCreateData(data: any): void {
    this.validateRequired(data.name, 'name');
    this.validateRequired(data.row_id, 'row_id');
    this.validateRequired(data.position, 'position');
    
    if (data.name.length > 100) {
      throw new Error('Rack name must be 100 characters or less');
    }
    
    if (typeof data.position !== 'number' || data.position < 0) {
      throw new Error('Position must be a non-negative number');
    }
  }

  protected validateUpdateData(data: any): void {
    if (data.name !== undefined) {
      this.validateRequired(data.name, 'name');
      
      if (data.name.length > 100) {
        throw new Error('Rack name must be 100 characters or less');
      }
    }
    
    if (data.position !== undefined) {
      this.validateRequired(data.position, 'position');
      
      if (typeof data.position !== 'number' || data.position < 0) {
        throw new Error('Position must be a non-negative number');
      }
    }
  }

  async getRacksByRow(rowId: string): Promise<Rack[]> {
    this.validateId(rowId, 'rowId');
    
    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq('row_id', rowId)
        .order('position');
      
      return { data: (result.data || []) as unknown as Rack[], error: result.error };
    }, 'Get racks by row');
  }

  async reorderRacks(rowId: string, rackOrders: { id: string; position: number }[]): Promise<void> {
    this.validateId(rowId, 'rowId');
    
    return this.executeWithAuth(async () => {
      // Update positions in a transaction-like manner
      for (const { id, position } of rackOrders) {
        await this.update(id, { position });
      }
    }, 'Reorder racks');
  }

  async getNextPosition(rowId: string): Promise<number> {
    this.validateId(rowId, 'rowId');
    
    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select('position')
        .eq('row_id', rowId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
      
      // Return next position (highest + 1), or 0 if no racks exist
      const nextPosition = result.data ? (result.data as any).position + 1 : 0;
      return { data: nextPosition, error: null };
    }, 'Get next position');
  }

  async duplicateRack(rackId: string, newName?: string): Promise<Rack> {
    this.validateId(rackId, 'rackId');
    
    const existingRack = await this.getById(rackId);
    if (!existingRack) {
      throw new Error('Rack not found');
    }

    const nextPosition = await this.getNextPosition(existingRack.row_id);
    
    const duplicateData = {
      name: newName || `${existingRack.name} (Copy)`,
      row_id: existingRack.row_id,
      position: nextPosition,
      description: existingRack.description
    };

    return this.create(duplicateData);
  }
} 