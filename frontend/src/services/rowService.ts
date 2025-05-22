'use client';
import apiClient from '../lib/apiClient';
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

// --- Row API Service Functions ---

/**
 * Create a new row.
 * Calls FastAPI backend: POST /api/v1/rows/
 */
export const createRow = async (rowIn: RowCreate): Promise<Row> => {
    try {
        return await apiClient<Row>(`/api/v1/rows/`, {
            method: 'POST',
            body: JSON.stringify(rowIn),
        });
    } catch (error) {
        console.error('Error in createRow service:', error);
        throw error;
    }
};

/**
 * Get a specific row by its ID.
 * Calls FastAPI backend: GET /api/v1/rows/{row_id}
 */
export const getRowById = async (rowId: string): Promise<Row> => {
    try {
        return await apiClient<Row>(`/api/v1/rows/${rowId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getRowById service for id ${rowId}:`, error);
        throw error;
    }
};

/**
 * Get all rows for a specific farm.
 * Calls FastAPI backend: GET /api/v1/rows/farm/{farm_id}
 */
export const getRowsByFarm = async (farmId: string): Promise<Row[]> => {
    try {
        return await apiClient<Row[]>(`/api/v1/rows/farm/${farmId}`, {
            method: 'GET',
        });
    } catch (error) {
        console.error(`Error in getRowsByFarm service for farm ${farmId}:`, error);
        throw error;
    }
};

/**
 * Update an existing row.
 * Calls FastAPI backend: PUT /api/v1/rows/{row_id}
 */
export const updateRow = async (rowId: string, rowIn: RowUpdate): Promise<Row> => {
    try {
        return await apiClient<Row>(`/api/v1/rows/${rowId}`, {
            method: 'PUT',
            body: JSON.stringify(rowIn),
        });
    } catch (error) {
        console.error(`Error in updateRow service for id ${rowId}:`, error);
        throw error;
    }
};

/**
 * Delete a row.
 * Calls FastAPI backend: DELETE /api/v1/rows/{row_id}
 */
export const deleteRow = async (rowId: string): Promise<Row> => {
    try {
        // Assuming backend returns the deleted object, if not, change Promise<Row> to Promise<void>
        return await apiClient<Row>(`/api/v1/rows/${rowId}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error(`Error in deleteRow service for id ${rowId}:`, error);
        throw error;
    }
}; 