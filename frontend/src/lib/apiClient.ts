'use client'; // Added 'use client' as it uses supabase.auth.getSession which is client-side
import { supabase } from '@/supabaseClient';

// NEXT_PUBLIC_API_URL should point to the base of the backend, e.g., http://localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { useAuth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (useAuth) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('User is not authenticated or session expired.', { sessionError, hasSession: !!sessionData?.session });
      throw new Error('Authentication required. Please log in to continue.');
    } else {
      headers.append('Authorization', `Bearer ${sessionData.session.access_token}`);
    }
  }

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  // Ensure the endpoint starts with a slash if it doesn't have one, to avoid issues with URL joining.
  const fullPathEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${fullPathEndpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorBody);
    } catch {
      // ignore
    }
    const errorMessage = errorJson?.detail || 
                         (typeof errorJson === 'string' ? errorJson : null) || 
                         response.statusText || 
                         `API request to ${fullPathEndpoint} failed with status ${response.status}`;
    console.error('API Error:', { 
        status: response.status, 
        statusText: response.statusText, 
        endpoint: fullPathEndpoint, 
        errorBody: errorJson || errorBody 
    });
    throw new Error(errorMessage);
  }

  if (response.status === 204) { // No Content
    return undefined as T;
  }
  try {
    return await response.json() as Promise<T>;
  } catch (e) {
    // Handle cases where response is OK but not JSON (e.g. plain text success message)
    // Or if JSON parsing fails for other reasons despite response.ok
    console.warn(`Response from ${fullPathEndpoint} was not valid JSON, despite successful status.`, e);
    // Depending on expectation, you might return null, an empty object, or rethrow
    return undefined as T; // Or throw new Error('Failed to parse successful response as JSON');
  }
}

// Example Usage (assuming Task types are defined elsewhere):
// interface Task { id: string; title: string; /* ... other fields */ }
// interface CreateTaskDto { title: string; /* ... other fields */ }

// export const getTasks = () => request<Task[]>('/tasks');
// export const createTask = (data: CreateTaskDto) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });
// export const getTaskById = (id: string) => request<Task>(`/tasks/${id}`);
// export const updateTask = (id: string, data: Partial<CreateTaskDto>) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
// export const deleteTask = (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' });

// Import FarmPageData type
import { FarmPageData, UUID } from '@/types/farm-layout';

// Define a type for the basic farm information
export interface FarmBasicInfo {
  id: UUID;
  name: string;
}

// Define a type for the response of the farm list endpoint
export interface FarmBasicListResponse {
  farms: FarmBasicInfo[];
  total: number;
}

/**
 * Fetches the full details for a specific farm, including its nested rows, racks, and shelves.
 * @param farmId The UUID of the farm to fetch.
 * @returns A Promise resolving to FarmPageData.
 */
export const getFarmDetails = async (farmId: UUID): Promise<FarmPageData> => {
  // Backend returns a flat farm object, but frontend expects { farm: {...} }
  const farmData = await request<any>(`/api/v1/farms/${farmId}`);
  
  // Transform the response to match FarmPageData structure
  return {
    farm: {
      ...farmData,
      rows: farmData.rows || []
    }
  };
};

/**
 * Fetches a list of farms with basic information (id and name).
 * @returns A Promise resolving to FarmBasicListResponse.
 */
export const getFarmsList = () => request<FarmBasicListResponse>('/api/v1/farms/');

// Define a type for creating a new farm
export interface CreateFarmData {
  name: string;
  location?: string;
  plan_image_url?: string;
  width?: number;
  depth?: number;
}

// Define a type for the farm creation response
export interface FarmResponse {
  id: UUID;
  name: string;
  user_id: UUID;
  location?: string | null;
  plan_image_url?: string | null;
  width?: number | null;
  depth?: number | null;
  rows?: any[]; // Will be empty array for new farms
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Creates a new farm with the provided data.
 * @param farmData The data for the new farm.
 * @returns A Promise resolving to FarmResponse.
 */
export const createFarm = (farmData: CreateFarmData) => 
  request<FarmResponse>('/api/v1/farms/', { 
    method: 'POST', 
    body: JSON.stringify(farmData) 
  });

export default request; 