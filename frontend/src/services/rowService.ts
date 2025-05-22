import { supabase } from '../supabaseClient';
// import { Farm } from '../types'; // Assuming types.ts is in parent dir

// Corresponds to backend app.schemas.row.Row
export interface Row {
    id: string; // UUID
    name: string;
    description?: string | null;
    farm_id: string; // UUID
    created_at?: string; // TIMESTAMPTZ
    updated_at?: string; // TIMESTAMPTZ
}

// Corresponds to backend app.schemas.row.RowCreate
export interface RowCreate {
    name: string;
    description?: string | null;
    farm_id: string; // UUID
}

// Corresponds to backend app.schemas.row.RowUpdate
export interface RowUpdate {
    name?: string;
    description?: string | null;
    farm_id?: string; // UUID
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

// --- Row API Service Functions ---

/**
 * Create a new row.
 * Calls FastAPI backend: POST /api/v1/rows/
 */
export const createRow = async (rowIn: RowCreate): Promise<Row> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/rows/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(rowIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create row');
    }
    return response.json();
};

/**
 * Get a specific row by its ID.
 * Calls FastAPI backend: GET /api/v1/rows/{row_id}
 */
export const getRowById = async (rowId: string): Promise<Row> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/rows/${rowId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch row');
    }
    return response.json();
};

/**
 * Get all rows for a specific farm.
 * Calls FastAPI backend: GET /api/v1/rows/farm/{farm_id}
 */
export const getRowsByFarm = async (farmId: string): Promise<Row[]> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/rows/farm/${farmId}`, {
        method: 'GET',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch rows for farm');
    }
    return response.json();
};

/**
 * Update an existing row.
 * Calls FastAPI backend: PUT /api/v1/rows/{row_id}
 */
export const updateRow = async (rowId: string, rowIn: RowUpdate): Promise<Row> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/rows/${rowId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(rowIn),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update row');
    }
    return response.json();
};

/**
 * Delete a row.
 * Calls FastAPI backend: DELETE /api/v1/rows/{row_id}
 */
export const deleteRow = async (rowId: string): Promise<Row> => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/api/v1/rows/${rowId}`, {
        method: 'DELETE',
        headers: headers,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete row');
    }
    return response.json(); // FastAPI returns the deleted object
}; 