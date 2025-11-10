import { auth } from './firebase';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      if (import.meta.env.DEV) {
        console.warn('No authenticated user found when getting auth token');
      }
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await getAuthToken(false);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    token = await getAuthToken(true);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    response = await fetch(url, {
      ...options,
      headers,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

export async function apiFormRequest(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  let token = await getAuthToken(false);

  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    token = await getAuthToken(true);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

