import { supabase } from '../supabaseClient'; // Assuming supabaseClient.ts is in the parent directory

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'; // Default to local FastAPI

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { useAuth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (useAuth) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error('User is not authenticated or session expired.');
    }
    headers.append('Authorization', `Bearer ${sessionData.session.access_token}`);
  }

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Try to parse as JSON, if not, use text
    let errorJson;
    try {
      errorJson = JSON.parse(errorBody);
    } catch {
      // ignore if not JSON
    }
    console.error('API Error:', errorJson || errorBody);
    throw new Error(errorJson?.detail || response.statusText || 'API request failed');
  }

  if (response.status === 204) { // No Content
    return undefined as T; 
  }
  return response.json() as Promise<T>;
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