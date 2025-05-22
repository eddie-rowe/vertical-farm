'use client'; // Added 'use client' as it uses supabase.auth.getSession which is client-side
import { supabase } from '../supabaseClient';

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
      // Allow requests to proceed without auth if useAuth is explicitly false OR if it's a login/signup attempt
      // For other auth-required endpoints, this will lead to a 401/403 from the backend if token is missing.
      // Consider if specific public endpoints should always have useAuth = false.
      if (useAuth) { // Only throw if auth was explicitly expected and failed
        console.warn('User is not authenticated or session expired. Proceeding without auth header for this request.');
        // Depending on strictness, you might still want to throw new Error('User is not authenticated or session expired.');
      } 
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

export default request; 