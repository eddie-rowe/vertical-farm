/**
 * Rack Service - Migrated to Supabase PostGREST
 * 
 * This service replaces FastAPI endpoints with direct Supabase calls,
 * leveraging PostGREST for automatic CRUD operations with better performance.
 */

import { supabase } from '@/supabaseClient';
import { UUID } from '@/types/farm-layout';

// =====================================================
// TYPES
// =====================================================

export interface Rack {
  id: UUID;
  name: string;
  row_id: UUID;
  position_in_row?: number;
  width?: number;
  depth?: number;
  height?: number;
  max_shelves?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRackData {
  name: string;
  row_id: UUID;
  position_in_row?: number;
  width?: number;
  depth?: number;
  height?: number;
  max_shelves?: number;
}

export interface UpdateRackData {
  name?: string;
  position_in_row?: number;
  width?: number;
  depth?: number;
  height?: number;
  max_shelves?: number;
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
// RACK OPERATIONS
// =====================================================

/**
 * Create a new rack
 * Replaces: POST /api/v1/racks/
 */
export const createRack = async (rackData: CreateRackData): Promise<Rack> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .insert([rackData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating rack:', error);
    throw error;
  }
  
  return data;
};

/**
 * Get a single rack by ID
 * Replaces: GET /api/v1/racks/{rack_id}
 */
export const getRackById = async (rackId: UUID): Promise<Rack> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .select('*')
    .eq('id', rackId)
    .single();
  
  if (error) {
    console.error(`Error fetching rack ${rackId}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Get all racks for a specific row
 * Replaces: GET /api/v1/racks/row/{row_id}
 */
export const getRacksByRowId = async (rowId: UUID): Promise<Rack[]> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .select('*')
    .eq('row_id', rowId)
    .order('position_in_row', { ascending: true });
  
  if (error) {
    console.error(`Error fetching racks for row ${rowId}:`, error);
    throw error;
  }
  
  return data || [];
};

/**
 * Update an existing rack
 * Replaces: PUT /api/v1/racks/{rack_id}
 */
export const updateRack = async (rackId: UUID, rackData: UpdateRackData): Promise<Rack> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .update(rackData)
    .eq('id', rackId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating rack ${rackId}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Delete a rack
 * Replaces: DELETE /api/v1/racks/{rack_id}
 */
export const deleteRack = async (rackId: UUID): Promise<void> => {
  await requireAuth();
  
  const { error } = await supabase
    .from('racks')
    .delete()
    .eq('id', rackId);
  
  if (error) {
    console.error(`Error deleting rack ${rackId}:`, error);
    throw error;
  }
};

/**
 * Reorder racks within a row
 * Updates position_in_row values for multiple racks
 */
export const reorderRacks = async (rowId: UUID, rackOrders: Array<{ id: UUID; position_in_row: number }>): Promise<Rack[]> => {
  await requireAuth();
  
  // Update positions in a transaction-like manner
  const updatePromises = rackOrders.map(({ id, position_in_row }) =>
    supabase
      .from('racks')
      .update({ position_in_row })
      .eq('id', id)
      .eq('row_id', rowId) // Extra safety check
      .select()
      .single()
  );
  
  try {
    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Error reordering racks:', errors);
      throw new Error('Failed to reorder some racks');
    }
    
    return results.map(result => result.data!);
  } catch (error) {
    console.error('Error in bulk rack reorder:', error);
    throw error;
  }
};

// =====================================================
// RACK STATISTICS & UTILITIES
// =====================================================

/**
 * Get the count of racks in a specific row
 */
export const getRackCount = async (rowId: UUID): Promise<number> => {
  await requireAuth();
  
  const { count, error } = await supabase
    .from('racks')
    .select('*', { count: 'exact', head: true })
    .eq('row_id', rowId);
  
  if (error) {
    console.error(`Error getting rack count for row ${rowId}:`, error);
    throw error;
  }
  
  return count || 0;
};

/**
 * Get the next available position for a new rack in a row
 */
export const getNextRackPosition = async (rowId: UUID): Promise<number> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .select('position_in_row')
    .eq('row_id', rowId)
    .order('position_in_row', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error(`Error getting next rack position for row ${rowId}:`, error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return 1; // First rack
  }
  
  return (data[0].position_in_row || 0) + 1;
};

/**
 * Get all racks for a specific farm (across all rows)
 */
export const getRacksByFarmId = async (farmId: UUID): Promise<Rack[]> => {
  await requireAuth();
  
  const { data, error } = await supabase
    .from('racks')
    .select(`
      *,
      rows!inner(farm_id)
    `)
    .eq('rows.farm_id', farmId)
    .order('position_in_row', { ascending: true });
  
  if (error) {
    console.error(`Error fetching racks for farm ${farmId}:`, error);
    throw error;
  }
  
  return data || [];
};

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

const rackService = {
  createRack,
  getRackById,
  getRacksByRowId,
  updateRack,
  deleteRack,
  reorderRacks,
  getRackCount,
  getNextRackPosition,
  getRacksByFarmId,
};

export default rackService; 