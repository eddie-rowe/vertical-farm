/**
 * Row Service - Migrated to Supabase PostGREST
 *
 * This service replaces FastAPI endpoints with direct Supabase calls,
 * leveraging PostGREST for automatic CRUD operations with better performance.
 */

import { supabase } from "@/lib/supabaseClient";
import { UUID } from "@/types/farm-layout";

// =====================================================
// TYPES
// =====================================================

export interface Row {
  id: UUID;
  name: string;
  farm_id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRowData {
  name: string;
  farm_id: UUID;
}

export interface UpdateRowData {
  name?: string;
}

// =====================================================
// AUTHENTICATION HELPER
// =====================================================

const requireAuth = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("User not authenticated");
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
    .from("rows")
    .insert([rowData])
    .select()
    .single();

  if (error) {
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
    .from("rows")
    .select("*")
    .eq("id", rowId)
    .single();

  if (error) {
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
    .from("rows")
    .select("*")
    .eq("farm_id", farmId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Update an existing row
 * Replaces: PUT /api/v1/rows/{row_id}
 */
export const updateRow = async (
  rowId: UUID,
  rowData: UpdateRowData,
): Promise<Row> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("rows")
    .update(rowData)
    .eq("id", rowId)
    .select()
    .single();

  if (error) {
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

  const { error } = await supabase.from("rows").delete().eq("id", rowId);

  if (error) {
    throw error;
  }
};

// Note: Row reordering functionality removed as position column no longer exists
// Rows are now ordered by creation date

// =====================================================
// ROW STATISTICS & UTILITIES
// =====================================================

/**
 * Get row count for a farm
 */
export const getRowCount = async (farmId: UUID): Promise<number> => {
  await requireAuth();

  const { count, error } = await supabase
    .from("rows")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", farmId);

  if (error) {
    throw error;
  }

  return count || 0;
};

// Note: Position-based functionality removed - rows are now ordered by creation date

/**
 * Generate a unique row name for a farm
 * Checks existing row names and finds the next available "Row X" name
 */
export const generateUniqueRowName = async (farmId: UUID): Promise<string> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("rows")
    .select("name")
    .eq("farm_id", farmId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return "Row 1"; // First row
  }

  // Extract existing row numbers from names that match "Row X" pattern
  const existingNumbers = new Set<number>();
  const rowPattern = /^Row (\d+)$/i;

  data.forEach((row) => {
    const match = row.name.match(rowPattern);
    if (match) {
      existingNumbers.add(parseInt(match[1], 10));
    }
  });

  // Find the next available number starting from 1
  let nextNumber = 1;
  while (existingNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return `Row ${nextNumber}`;
};

// =====================================================
// BACKWARDS COMPATIBILITY
// =====================================================

// Export aliases for any existing code that might use different names
export { createRow as addRow };
export { getRowsByFarmId as getRowsByFarm };
export { deleteRow as removeRow };
