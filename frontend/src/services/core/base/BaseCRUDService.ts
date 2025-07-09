'use client';

import { BaseService } from './BaseService';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

export interface BaseEntity {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CRUDOperations<T extends BaseEntity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T>;
  delete(id: string): Promise<void>;
}

export abstract class BaseCRUDService<T extends BaseEntity> extends BaseService implements CRUDOperations<T> {
  protected abstract readonly tableName: string;
  protected readonly selectFields: string = '*';

  async getAll(): Promise<T[]> {
    this.logOperation('getAll');
    
    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields);
      
      return { data: (result.data || []) as unknown as T[], error: result.error };
    }, `Get all ${this.tableName}`);
  }

  async getById(id: string): Promise<T | null> {
    this.validateId(id);
    this.logOperation('getById', { id });
    
    try {
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .select(this.selectFields)
          .eq('id', id)
          .single();
      }, `Get ${this.tableName} by ID`);
      
      return result as unknown as T;
    } catch (error: any) {
      // Handle case where record is not found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    this.validateCreateData(data);
    this.logOperation('create', data);
    
    return this.executeWithAuth(async () => {
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .insert([data])
          .select(this.selectFields)
          .single();
      }, `Create ${this.tableName}`);
      
      return result as unknown as T;
    }, `Create ${this.tableName}`);
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T> {
    this.validateId(id);
    this.validateUpdateData(data);
    this.logOperation('update', { id, data });
    
    return this.executeWithAuth(async () => {
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select(this.selectFields)
          .single();
      }, `Update ${this.tableName}`);
      
      return result as unknown as T;
    }, `Update ${this.tableName}`);
  }

  async delete(id: string): Promise<void> {
    this.validateId(id);
    this.logOperation('delete', { id });
    
    return this.executeWithAuth(async () => {
      await this.executeQuery(async () => {
        const result = await this.getSupabaseClient()
          .from(this.tableName)
          .delete()
          .eq('id', id);
        
        return { data: undefined, error: result.error };
      }, `Delete ${this.tableName}`);
    }, `Delete ${this.tableName}`);
  }

  // Hook methods that can be overridden by subclasses
  protected validateCreateData(data: any): void {
    // Override in subclasses for specific validation
  }

  protected validateUpdateData(data: any): void {
    // Override in subclasses for specific validation
  }

  // Helper methods for common query patterns
  protected async findByField(field: string, value: any): Promise<T[]> {
    this.logOperation('findByField', { field, value });
    
    return this.executeQuery(async () => {
      const result = await this.getSupabaseClient()
        .from(this.tableName)
        .select(this.selectFields)
        .eq(field, value);
      
      return { data: (result.data || []) as unknown as T[], error: result.error };
    }, `Find ${this.tableName} by ${field}`);
  }

  protected async findOneByField(field: string, value: any): Promise<T | null> {
    this.logOperation('findOneByField', { field, value });
    
    try {
      const result = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from(this.tableName)
          .select(this.selectFields)
          .eq(field, value)
          .single();
      }, `Find one ${this.tableName} by ${field}`);
      
      return result as unknown as T;
    } catch (error: any) {
      // Handle case where record is not found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
  }

  protected async count(): Promise<number> {
    this.logOperation('count');
    
    return this.executeQuery(async () => {
      const { count, error } = await this.getSupabaseClient()
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      return { data: count || 0, error };
    }, `Count ${this.tableName}`);
  }

  protected async exists(id: string): Promise<boolean> {
    this.validateId(id);
    this.logOperation('exists', { id });
    
    try {
      const item = await this.getById(id);
      return item !== null;
    } catch (error) {
      return false;
    }
  }
} 