import { supabase } from '../supabaseClient';
import { Rack } from './rackService'; // Assuming Rack type is needed for context

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper function to get the authorization header.
 */
const getAuthHeader = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
        throw new Error('User not authenticated');
    }
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };
};

// --- Shelf API Service Functions ---

/**
 * Create a new shelf.
 * Calls FastAPI backend: POST /api/v1/shelves/
 */
export const createShelf = async (shelfIn: ShelfCreate): Promise<Shelf> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/shelves/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(shelfIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create shelf');
    }
    return response.json();
};

/**
 * Get a specific shelf by its ID.
 * Calls FastAPI backend: GET /api/v1/shelves/{shelf_id}
 */
export const getShelfById = async (shelfId: string): Promise<Shelf> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/shelves/${shelfId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch shelf');
    }
    return response.json();
};

/**
 * Get all shelves for a specific rack.
 * Calls FastAPI backend: GET /api/v1/shelves/rack/{rack_id}
 */
export const getShelvesByRack = async (rackId: string): Promise<Shelf[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/shelves/rack/${rackId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch shelves for rack');
    }
    return response.json();
};

/**
 * Update an existing shelf.
 * Calls FastAPI backend: PUT /api/v1/shelves/{shelf_id}
 */
export const updateShelf = async (shelfId: string, shelfIn: ShelfUpdate): Promise<Shelf> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/shelves/${shelfId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(shelfIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update shelf');
    }
    return response.json();
};

/**
 * Delete a shelf.
 * Calls FastAPI backend: DELETE /api/v1/shelves/{shelf_id}
 */
export const deleteShelf = async (shelfId: string): Promise<Shelf> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/shelves/${shelfId}`, {
        method: 'DELETE',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete shelf');
    }
    return response.json(); // FastAPI returns the deleted object
}; 