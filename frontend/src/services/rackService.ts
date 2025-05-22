'use client';
import apiClient from '../lib/apiClient';
// import { Row } from '../types'; // Assuming types.ts is in parent dir

// Corresponds to backend app.schemas.rack.Rack
export interface Rack {
    id: string; // UUID
    name: string;
    description?: string | null;
    row_id: string; // UUID, Foreign key to Row
    created_at?: string; // TIMESTAMPTZ
    updated_at?: string; // TIMESTAMPTZ
}

// Corresponds to backend app.schemas.rack.RackCreate
export interface RackCreate {
    name: string;
    description?: string | null;
    row_id: string; // UUID
}

// Corresponds to backend app.schemas.rack.RackUpdate
export interface RackUpdate {
    name?: string;
    description?: string | null;
    row_id?: string; // UUID
}

// --- Rack API Service Functions ---

/**
 * Create a new rack.
 * Calls FastAPI backend: POST /api/v1/racks/
 */
export const createRack = async (rackIn: RackCreate): Promise<Rack> => {
    try {
        return await apiClient<Rack>(`/api/v1/racks/`, {
            method: 'POST',
            body: JSON.stringify(rackIn),
        });
    } catch (error) {
        console.error('Error in createRack service:', error);
        throw error;
    }
};

/**
 * Get a specific rack by its ID.
 * Calls FastAPI backend: GET /api/v1/racks/{rack_id}
 */
export const getRackById = async (rackId: string): Promise<Rack> => {
    try {
        return await apiClient<Rack>(`/api/v1/racks/${rackId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getRackById service for id ${rackId}:`, error);
        throw error;
    }
};

/**
 * Get all racks for a specific row.
 * Calls FastAPI backend: GET /api/v1/racks/row/{row_id}
 */
export const getRacksByRow = async (rowId: string): Promise<Rack[]> => {
    try {
        return await apiClient<Rack[]>(`/api/v1/racks/row/${rowId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getRacksByRow service for row ${rowId}:`, error);
        throw error;
    }
};

/**
 * Update an existing rack.
 * Calls FastAPI backend: PUT /api/v1/racks/{rack_id}
 */
export const updateRack = async (rackId: string, rackIn: RackUpdate): Promise<Rack> => {
    try {
        return await apiClient<Rack>(`/api/v1/racks/${rackId}`, {
            method: 'PUT',
            body: JSON.stringify(rackIn),
        });
    } catch (error) {
        console.error(`Error in updateRack service for id ${rackId}:`, error);
        throw error;
    }
};

/**
 * Delete a rack.
 * Calls FastAPI backend: DELETE /api/v1/racks/{rack_id}
 */
export const deleteRack = async (rackId: string): Promise<Rack> => {
    try {
        // Assuming backend returns the deleted object, if not, change Promise<Rack> to Promise<void>
        // and handle apiClient<void>
        return await apiClient<Rack>(`/api/v1/racks/${rackId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error(`Error in deleteRack service for id ${rackId}:`, error);
        throw error;
    }
}; 