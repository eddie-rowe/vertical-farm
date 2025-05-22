'use client';
import apiClient from '../lib/apiClient';
// import { Rack } from '../types'; // Assuming types.ts is in parent dir

// Corresponds to backend app.schemas.shelf.Shelf
export interface Shelf {
    id: string; // UUID
    name: string;
    description?: string | null;
    rack_id: string; // UUID, Foreign key to Rack
    created_at?: string; // TIMESTAMPTZ
    updated_at?: string; // TIMESTAMPTZ
}

// Corresponds to backend app.schemas.shelf.ShelfCreate
export interface ShelfCreate {
    name: string;
    description?: string | null;
    rack_id: string; // UUID
}

// Corresponds to backend app.schemas.shelf.ShelfUpdate
export interface ShelfUpdate {
    name?: string;
    description?: string | null;
    rack_id?: string; // UUID
}

// --- Shelf API Service Functions ---

/**
 * Create a new shelf.
 * Calls FastAPI backend: POST /api/v1/shelves/
 */
export const createShelf = async (shelfIn: ShelfCreate): Promise<Shelf> => {
    try {
        return await apiClient<Shelf>(`/api/v1/shelves/`, {
            method: 'POST',
            body: JSON.stringify(shelfIn),
        });
    } catch (error) {
        console.error('Error in createShelf service:', error);
        throw error;
    }
};

/**
 * Get a specific shelf by its ID.
 * Calls FastAPI backend: GET /api/v1/shelves/{shelf_id}
 */
export const getShelfById = async (shelfId: string): Promise<Shelf> => {
    try {
        return await apiClient<Shelf>(`/api/v1/shelves/${shelfId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getShelfById service for id ${shelfId}:`, error);
        throw error;
    }
};

/**
 * Get all shelves for a specific rack.
 * Calls FastAPI backend: GET /api/v1/shelves/rack/{rack_id}
 */
export const getShelvesByRack = async (rackId: string): Promise<Shelf[]> => {
    try {
        return await apiClient<Shelf[]>(`/api/v1/shelves/rack/${rackId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getShelvesByRack service for rack ${rackId}:`, error);
        throw error;
    }
};

/**
 * Update an existing shelf.
 * Calls FastAPI backend: PUT /api/v1/shelves/{shelf_id}
 */
export const updateShelf = async (shelfId: string, shelfIn: ShelfUpdate): Promise<Shelf> => {
    try {
        return await apiClient<Shelf>(`/api/v1/shelves/${shelfId}`, {
            method: 'PUT',
            body: JSON.stringify(shelfIn),
        });
    } catch (error) {
        console.error(`Error in updateShelf service for id ${shelfId}:`, error);
        throw error;
    }
};

/**
 * Delete a shelf.
 * Calls FastAPI backend: DELETE /api/v1/shelves/{shelf_id}
 */
export const deleteShelf = async (shelfId: string): Promise<Shelf> => {
    try {
        // Assuming backend returns the deleted object, if not, change Promise<Shelf> to Promise<void>
        return await apiClient<Shelf>(`/api/v1/shelves/${shelfId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error(`Error in deleteShelf service for id ${shelfId}:`, error);
        throw error;
    }
}; 