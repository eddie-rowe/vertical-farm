import { supabase } from '../supabaseClient';
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

// --- Rack API Service Functions ---

/**
 * Create a new rack.
 * Calls FastAPI backend: POST /api/v1/racks/
 */
export const createRack = async (rackIn: RackCreate): Promise<Rack> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/racks/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(rackIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create rack');
    }
    return response.json();
};

/**
 * Get a specific rack by its ID.
 * Calls FastAPI backend: GET /api/v1/racks/{rack_id}
 */
export const getRackById = async (rackId: string): Promise<Rack> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/racks/${rackId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch rack');
    }
    return response.json();
};

/**
 * Get all racks for a specific row.
 * Calls FastAPI backend: GET /api/v1/racks/row/{row_id}
 */
export const getRacksByRow = async (rowId: string): Promise<Rack[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/racks/row/${rowId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch racks for row');
    }
    return response.json();
};

/**
 * Update an existing rack.
 * Calls FastAPI backend: PUT /api/v1/racks/{rack_id}
 */
export const updateRack = async (rackId: string, rackIn: RackUpdate): Promise<Rack> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/racks/${rackId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(rackIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update rack');
    }
    return response.json();
};

/**
 * Delete a rack.
 * Calls FastAPI backend: DELETE /api/v1/racks/{rack_id}
 */
export const deleteRack = async (rackId: string): Promise<Rack> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/racks/${rackId}`, {
        method: 'DELETE',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete rack');
    }
    return response.json(); // FastAPI returns the deleted object
}; 