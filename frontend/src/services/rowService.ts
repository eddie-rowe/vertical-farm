/**
 * Row Service - Migrated to Supabase PostGREST
 * 
 * This service replaces FastAPI endpoints with direct Supabase calls,
 * leveraging PostGREST for automatic CRUD operations with better performance.
 */

import { supabase } from '../supabaseClient';
import { UUID } from '@/types/farm-layout';

// =====================================================
// TYPES
// =====================================================

export interface Row {
  id: UUID;
  name: string;
  farm_id: UUID;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRowData {
  name: string;
  farm_id: UUID;
  position?: number;
}

export interface UpdateRowData {
  name?: string;
  position?: number;
}

// =====================================================
// AUTHENTICATION HELPER
// =====================================================

const requireAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// =====================================================
// ROW OPERATIONS
// =====================================================

/**
 * Create a new row
 * Replaces: POST /api/v1/rows/
 */
export const createRow = async (rowData: CreateRowData): Promise<Row> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('rows')
    .insert([rowData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating row:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get a single row by ID
 * Replaces: GET /api/v1/rows/{row_id}
 */
export const getRowById = async (rowId: UUID): Promise<Row> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('rows')
    .select('*')
    .eq('id', rowId)
    .single();
  
  if (error) {
    console.error(`Error fetching row ${rowId}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Get all rows for a specific farm
 * Replaces: GET /api/v1/rows/farm/{farm_id}
 */
export const getRowsByFarmId = async (farmId: UUID): Promise<Row[]> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('rows')
    .select('*')
    .eq('farm_id', farmId)
    .order('position', { ascending: true });
  
  if (error) {
    console.error(`Error fetching rows for farm ${farmId}:`, error);
    throw error;
  }
  
  return data || [];
};

/**
 * Update an existing row
 * Replaces: PUT /api/v1/rows/{row_id}
 */
export const updateRow = async (rowId: UUID, rowData: UpdateRowData): Promise<Row> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('rows')
    .update(rowData)
    .eq('id', rowId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating row ${rowId}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Delete a row
 * Replaces: DELETE /api/v1/rows/{row_id}
 */
export const deleteRow = async (rowId: UUID): Promise<void> => {
  await requireAuth();
  
  const { error } = await supabase
    .from('rows')
    .delete()
    .eq('id', rowId);
  
  if (error) {
    console.error(`Error deleting row ${rowId}:`, error);
    throw error;
  }
};

/**
 * Reorder rows within a farm
 * Updates position values for multiple rows
 */
export const reorderRows = async (farmId: UUID, rowOrders: Array<{ id: UUID; position: number }>): Promise<Row[]> => {
  await requireAuth();
  
  // Update positions in a transaction-like manner
  const updatePromises = rowOrders.map(({ id, position }) =>
    supabase
      .from('rows')
      .update({ position })
      .eq('id', id)
      .eq('farm_id', farmId) // Extra safety check
      .select()
      .single()
  );
  
  try {
    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Error reordering rows:', errors);
      throw new Error('Failed to reorder some rows');
    }
    
    return results.map(result => result.data!);
  } catch (error) {
    console.error('Error in bulk row reorder:', error);
    throw error;
  }
};

// =====================================================
// ROW STATISTICS & UTILITIES
// =====================================================

/**
 * Get row count for a farm
 */
export const getRowCount = async (farmId: UUID): Promise<number> => {
  await requireAuth();
  
  const { count, error } = await supabase
    .from('rows')
    .select('*', { count: 'exact', head: true })
    .eq('farm_id', farmId);
  
  if (error) {
    console.error(`Error getting row count for farm ${farmId}:`, error);
    throw error;
  }
  
  return count || 0;
};

/**
 * Get next available position for a new row in a farm
 */
export const getNextRowPosition = async (farmId: UUID): Promise<number> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('rows')
    .select('position')
    .eq('farm_id', farmId)
    .order('position', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error(`Error getting next row position for farm ${farmId}:`, error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return 1; // First row
  }
  
  const maxPosition = data[0].position || 0;
  return maxPosition + 1;
};

// =====================================================
// BACKWARDS COMPATIBILITY
// =====================================================

// Export aliases for any existing code that might use different names
export { createRow as addRow };
export { getRowsByFarmId as getRowsByFarm };
export { deleteRow as removeRow }; 