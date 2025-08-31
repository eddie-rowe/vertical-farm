/**
 * Shelf Service - Migrated to Supabase PostGREST
 *
 * This service replaces FastAPI endpoints with direct Supabase calls,
 * leveraging PostGREST for automatic CRUD operations with better performance.
 */

import { supabase } from "@/lib/supabaseClient";
import { UUID } from "@/types/farm-layout";

// =====================================================
// TYPES
// =====================================================

export interface Shelf {
  id: UUID;
  name: string;
  rack_id: UUID;
  position_in_rack?: number;
  width?: number;
  depth?: number;
  max_weight?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateShelfData {
  name: string;
  rack_id: UUID;
  position_in_rack?: number;
  width?: number;
  depth?: number;
  max_weight?: number;
}

export interface UpdateShelfData {
  name?: string;
  position_in_rack?: number;
  width?: number;
  depth?: number;
  max_weight?: number;
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
// SHELF OPERATIONS
// =====================================================

/**
 * Create a new shelf
 * Replaces: POST /api/v1/shelves/
 */
export const createShelf = async (
  shelfData: CreateShelfData,
): Promise<Shelf> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .insert([shelfData])
    .select()
    .single();

  if (error) {
    // Error logged
    throw error;
  }

  return data;
};

/**
 * Get a single shelf by ID
 * Replaces: GET /api/v1/shelves/{shelf_id}
 */
export const getShelfById = async (shelfId: UUID): Promise<Shelf> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("id", shelfId)
    .single();

  if (error) {
    // Error logged
    throw error;
  }

  return data;
};

/**
 * Get all shelves for a specific rack
 * Replaces: GET /api/v1/shelves/rack/{rack_id}
 */
export const getShelvesByRackId = async (rackId: UUID): Promise<Shelf[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("rack_id", rackId)
    .order("position_in_rack", { ascending: true });

  if (error) {
    // Error logged
    throw error;
  }

  return data || [];
};

/**
 * Update an existing shelf
 * Replaces: PUT /api/v1/shelves/{shelf_id}
 */
export const updateShelf = async (
  shelfId: UUID,
  shelfData: UpdateShelfData,
): Promise<Shelf> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .update(shelfData)
    .eq("id", shelfId)
    .select()
    .single();

  if (error) {
    // Error logged
    throw error;
  }

  return data;
};

/**
 * Delete a shelf
 * Replaces: DELETE /api/v1/shelves/{shelf_id}
 */
export const deleteShelf = async (shelfId: UUID): Promise<void> => {
  await requireAuth();

  const { error } = await supabase.from("shelves").delete().eq("id", shelfId);

  if (error) {
    // Error logged
    throw error;
  }
};

/**
 * Reorder shelves within a rack
 * Updates position_in_rack values for multiple shelves
 */
export const reorderShelves = async (
  rackId: UUID,
  shelfOrders: Array<{ id: UUID; position_in_rack: number }>,
): Promise<Shelf[]> => {
  await requireAuth();

  // Update positions in a transaction-like manner
  const updatePromises = shelfOrders.map(({ id, position_in_rack }) =>
    supabase
      .from("shelves")
      .update({ position_in_rack })
      .eq("id", id)
      .eq("rack_id", rackId) // Extra safety check
      .select()
      .single(),
  );

  try {
    const results = await Promise.all(updatePromises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      // Error logged
      throw new Error("Failed to reorder some shelves");
    }

    return results.map((result) => result.data!);
  } catch (error) {
    // Error logged
    throw error;
  }
};

// =====================================================
// SHELF STATISTICS & UTILITIES
// =====================================================

/**
 * Get the count of shelves in a specific rack
 */
export const getShelfCount = async (rackId: UUID): Promise<number> => {
  await requireAuth();

  const { count, error } = await supabase
    .from("shelves")
    .select("*", { count: "exact", head: true })
    .eq("rack_id", rackId);

  if (error) {
    // Error logged
    throw error;
  }

  return count || 0;
};

/**
 * Get the next available position for a new shelf in a rack
 */
export const getNextShelfPosition = async (rackId: UUID): Promise<number> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select("position_in_rack")
    .eq("rack_id", rackId)
    .order("position_in_rack", { ascending: false })
    .limit(1);

  if (error) {
    // Error getting next shelf position
    throw error;
  }

  if (!data || data.length === 0) {
    return 1; // First shelf
  }

  return (data[0].position_in_rack || 0) + 1;
};

/**
 * Get all shelves for a specific row (across all racks in that row)
 */
export const getShelvesByRowId = async (rowId: UUID): Promise<Shelf[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select(
      `
      *,
      racks!inner(row_id)
    `,
    )
    .eq("racks.row_id", rowId)
    .order("position_in_rack", { ascending: true });

  if (error) {
    // Error logged
    throw error;
  }

  return data || [];
};

/**
 * Get all shelves for a specific farm (across all rows and racks)
 */
export const getShelvesByFarmId = async (farmId: UUID): Promise<Shelf[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select(
      `
      *,
      racks!inner(
        row_id,
        rows!inner(farm_id)
      )
    `,
    )
    .eq("racks.rows.farm_id", farmId)
    .order("position_in_rack", { ascending: true });

  if (error) {
    // Error logged
    throw error;
  }

  return data || [];
};

/**
 * Get shelf with its full hierarchy (farm -> row -> rack -> shelf)
 */
export const getShelfWithHierarchy = async (shelfId: UUID) => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select(
      `
      *,
      racks!inner(
        id,
        name,
        position_in_row,
        rows!inner(
          id,
          name,
          position,
          farms!inner(
            id,
            name
          )
        )
      )
    `,
    )
    .eq("id", shelfId)
    .single();

  if (error) {
    // Error logged
    throw error;
  }

  return data;
};

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

const shelfService = {
  createShelf,
  getShelfById,
  getShelvesByRackId,
  updateShelf,
  deleteShelf,
  reorderShelves,
  getShelfCount,
  getNextShelfPosition,
  getShelvesByRowId,
  getShelvesByFarmId,
  getShelfWithHierarchy,
};

export default shelfService;
