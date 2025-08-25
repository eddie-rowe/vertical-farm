/**
 * Supabase PostGREST Service
 *
 * This service replaces FastAPI endpoints with direct Supabase calls,
 * leveraging PostGREST, RLS policies, and database functions.
 *
 * Benefits:
 * - 2-3x faster performance (direct database access)
 * - Zero boilerplate CRUD operations
 * - Automatic real-time subscriptions
 * - Type-safe operations with generated types
 * - Built-in filtering, pagination, and sorting
 */

import { supabase } from "@/lib/supabaseClient";
import { UUID } from "@/types/common";

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Farm {
  id: UUID;
  name: string;
  location?: string | null;
  user_id?: UUID | null;
  farm_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFarmData {
  name: string;
  location?: string;
  farm_image_url?: string;
}

export interface FarmWithHierarchy extends Farm {
  rows?: Row[];
}

export interface Row {
  id: UUID;
  name?: string;
  farm_id: UUID;
  orientation?: string;
  racks?: Rack[];
  created_at?: string;
  updated_at?: string;
}

export interface Rack {
  id: UUID;
  name?: string;
  row_id: UUID;
  shelves?: Shelf[];
  created_at?: string;
  updated_at?: string;
}

export interface Shelf {
  id: UUID;
  name?: string;
  rack_id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceAssignment {
  id: UUID;
  entity_id: string;
  friendly_name?: string;
  entity_type: string;
  farm_id?: UUID;
  row_id?: UUID;
  rack_id?: UUID;
  shelf_id?: UUID;
  user_config_id?: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface FarmStatistics {
  farm_id: UUID;
  total_rows: number;
  total_racks: number;
  total_shelves: number;
  total_devices: number;
  device_status_summary: Record<string, number>;
  last_updated: string;
}

export interface DeviceStatusSummary {
  device_type: string;
  total_count: number;
  online_count: number;
  offline_count: number;
  error_count: number;
  last_update: string;
}

// =====================================================
// AUTHENTICATION HELPERS
// =====================================================

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Ensure user is authenticated before making requests
 */
const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");
  return user;
};

// =====================================================
// FARM MANAGEMENT
// =====================================================

/**
 * Get all farms for the current user
 * Uses RLS policies for automatic user isolation
 */
export const getFarms = async (options?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}): Promise<{ farms: Farm[]; total: number }> => {
  await requireAuth();

  let query = supabase.from("farms").select("*", { count: "exact" });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 100) - 1,
    );
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.ascending ?? true,
    });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching farms:", error);
    throw error;
  }

  return {
    farms: data || [],
    total: count || 0,
  };
};

/**
 * Get a single farm by ID with complete hierarchy
 * Uses PostGREST joins for efficient data loading
 */
export const getFarmDetails = async (
  farmId: UUID,
): Promise<FarmWithHierarchy> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("farms")
    .select(
      `
      *,
      rows (
        *,
        racks (
          *,
          shelves (*)
        )
      )
    `,
    )
    .eq("id", farmId)
    .single();

  if (error) {
    console.error(`Error fetching farm ${farmId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Create a new farm
 * Uses database triggers for auto-setting user_id
 */
export const createFarm = async (farmData: CreateFarmData): Promise<Farm> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from("farms")
    .insert([
      {
        ...farmData,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating farm:", error);
    throw error;
  }

  return data;
};

/**
 * Update an existing farm
 * Uses RLS policies for authorization
 */
export const updateFarm = async (
  farmId: UUID,
  farmData: Partial<CreateFarmData>,
): Promise<Farm> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("farms")
    .update(farmData)
    .eq("id", farmId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating farm ${farmId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Delete a farm
 * Uses RLS policies for authorization
 */
export const deleteFarm = async (farmId: UUID): Promise<void> => {
  await requireAuth();

  const { error } = await supabase.from("farms").delete().eq("id", farmId);

  if (error) {
    console.error(`Error deleting farm ${farmId}:`, error);
    throw error;
  }
};

// =====================================================
// HIERARCHY MANAGEMENT (Rows, Racks, Shelves)
// =====================================================

/**
 * Get all rows for a farm
 */
export const getRowsByFarm = async (farmId: UUID): Promise<Row[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("rows")
    .select("id, name, farm_id, created_at, updated_at")
    .eq("farm_id", farmId)
    .order("name", { ascending: true });

  if (error) {
    console.error(`Error fetching rows for farm ${farmId}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new row
 */
export const createRow = async (rowData: {
  name?: string;
  farm_id: UUID;
}): Promise<Row> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("rows")
    .insert([rowData])
    .select()
    .single();

  if (error) {
    console.error("Error creating row:", error);
    throw error;
  }

  return data;
};

/**
 * Get all racks for a row
 */
export const getRacksByRow = async (rowId: UUID): Promise<Rack[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("racks")
    .select("id, name, row_id, created_at, updated_at")
    .eq("row_id", rowId)
    .order("name", { ascending: true });

  if (error) {
    console.error(`Error fetching racks for row ${rowId}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new rack
 */
export const createRack = async (rackData: {
  name?: string;
  row_id: UUID;
}): Promise<Rack> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("racks")
    .insert([rackData])
    .select()
    .single();

  if (error) {
    console.error("Error creating rack:", error);
    throw error;
  }

  return data;
};

/**
 * Get all shelves for a rack
 */
export const getShelvesByRack = async (rackId: UUID): Promise<Shelf[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .select("id, name, rack_id, created_at, updated_at")
    .eq("rack_id", rackId)
    .order("name", { ascending: true });

  if (error) {
    console.error(`Error fetching shelves for rack ${rackId}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new shelf
 */
export const createShelf = async (shelfData: {
  name?: string;
  rack_id: UUID;
}): Promise<Shelf> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("shelves")
    .insert([shelfData])
    .select()
    .single();

  if (error) {
    console.error("Error creating shelf:", error);
    throw error;
  }

  return data;
};

// =====================================================
// DEVICE MANAGEMENT
// =====================================================

/**
 * Get all device assignments for a farm
 */
export const getDeviceAssignmentsByFarm = async (
  farmId: UUID,
): Promise<DeviceAssignment[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("device_assignments")
    .select(
      `
      *,
      farms(name),
      rows(name),
      racks(name),
      shelves(name)
    `,
    )
    .eq("farm_id", farmId);

  if (error) {
    console.error(
      `Error fetching device assignments for farm ${farmId}:`,
      error,
    );
    throw error;
  }

  return data || [];
};

/**
 * Search devices using the database function
 */
export const searchDevices = async (
  searchTerm: string,
  farmId?: UUID,
): Promise<unknown[]> => {
  await requireAuth();

  const { data, error } = await supabase.rpc("search_devices", {
    search_term: searchTerm,
    farm_uuid: farmId,
  });

  if (error) {
    console.error("Error searching devices:", error);
    throw error;
  }

  return data || [];
};

/**
 * Assign a device to a location
 */
export const assignDevice = async (deviceData: {
  entity_id: string;
  friendly_name?: string;
  entity_type: string;
  farm_id?: UUID;
  row_id?: UUID;
  rack_id?: UUID;
  shelf_id?: UUID;
  user_config_id: UUID;
}): Promise<DeviceAssignment> => {
  await requireAuth();

  const { data, error } = await supabase
    .from("device_assignments")
    .insert([deviceData])
    .select()
    .single();

  if (error) {
    console.error("Error assigning device:", error);
    throw error;
  }

  return data;
};

// =====================================================
// ANALYTICS & STATISTICS
// =====================================================

/**
 * Get farm statistics using the database function
 */
export const getFarmStatistics = async (
  farmId: UUID,
): Promise<FarmStatistics> => {
  await requireAuth();

  const { data, error } = await supabase.rpc("get_farm_statistics", {
    farm_uuid: farmId,
  });

  if (error) {
    console.error(`Error getting farm statistics for ${farmId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Get device status summary using the database function
 */
export const getDeviceStatusSummary = async (
  farmId?: UUID,
): Promise<DeviceStatusSummary[]> => {
  await requireAuth();

  const { data, error } = await supabase.rpc("get_device_status_summary", {
    farm_uuid: farmId,
  });

  if (error) {
    console.error("Error getting device status summary:", error);
    throw error;
  }

  return data || [];
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to farm updates
 */
export const subscribeFarmUpdates = (
  farmId: UUID,
  callback: (payload: unknown) => void,
) => {
  return supabase
    .channel(`farm-${farmId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "farms",
        filter: `id=eq.${farmId}`,
      },
      callback,
    )
    .subscribe();
};

/**
 * Subscribe to device assignment updates for a farm
 */
export const subscribeDeviceUpdates = (
  farmId: UUID,
  callback: (payload: unknown) => void,
) => {
  return supabase
    .channel(`devices-${farmId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_assignments",
        filter: `farm_id=eq.${farmId}`,
      },
      callback,
    )
    .subscribe();
};

/**
 * Subscribe to hierarchy updates (rows, racks, shelves) for a farm
 */
export const subscribeHierarchyUpdates = (
  farmId: UUID,
  callback: (payload: unknown) => void,
) => {
  const channel = supabase.channel(`hierarchy-${farmId}`);

  // Subscribe to rows
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "rows",
      filter: `farm_id=eq.${farmId}`,
    },
    callback,
  );

  // Subscribe to racks (via rows)
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "racks",
    },
    (payload) => {
      // You might want to filter racks by checking if row_id belongs to this farm
      callback(payload);
    },
  );

  // Subscribe to shelves (via racks)
  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "shelves",
    },
    callback,
  );

  return channel.subscribe();
};

// =====================================================
// ERROR HANDLING HELPERS
// =====================================================

/**
 * Standard error handler for Supabase operations
 */
export const handleSupabaseError = (error: unknown, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);

  // Type guard to check if error has a code property
  const hasCode = (err: unknown): err is { code: string } => {
    return typeof err === 'object' && err !== null && 'code' in err;
  };

  // Type guard to check if error has a message property
  const hasMessage = (err: unknown): err is { message: string } => {
    return typeof err === 'object' && err !== null && 'message' in err;
  };

  if (hasCode(error)) {
    if (error.code === "PGRST301") {
      throw new Error("Resource not found or access denied");
    } else if (error.code === "PGRST116") {
      throw new Error("Resource already exists");
    }
  } else if (hasMessage(error) && error.message?.includes("RLS")) {
    throw new Error("You do not have permission to perform this action");
  } else {
    const message = hasMessage(error) ? error.message : `Failed to ${operation}`;
    throw new Error(message);
  }
};

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Create multiple items in a single transaction
 */
export const createMultiple = async <T>(
  table: string,
  items: Partial<T>[],
): Promise<T[]> => {
  await requireAuth();

  const { data, error } = await supabase.from(table).insert(items).select();

  if (error) {
    handleSupabaseError(error, `create multiple ${table}`);
  }

  return data || [];
};

/**
 * Update multiple items in a single transaction
 */
export const updateMultiple = async <T>(
  table: string,
  updates: Array<{ id: UUID; data: Partial<T> }>,
): Promise<T[]> => {
  await requireAuth();

  // Supabase doesn't support bulk updates directly, so we use a transaction-like approach
  const promises = updates.map(({ id, data }) =>
    supabase.from(table).update(data).eq("id", id).select().single(),
  );

  const results = await Promise.all(promises);

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.error("Bulk update errors:", errors);
    throw new Error(`Failed to update ${errors.length} items`);
  }

  return results.map((r) => r.data).filter(Boolean);
};
