/**
 * API Configuration
 * Central configuration for backend API calls
 */

import { auth } from './firebase';

// Get API base URL from environment or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated requests
 * @param forceRefresh - Force token refresh (default: false)
 * @returns {Promise<string | null>}
 */
export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      if (import.meta.env.DEV) {
        console.warn('No authenticated user found when getting auth token');
      }
      return null;
    }

    // Get the ID token from cache unless forceRefresh is requested
    // Cached tokens are valid for 1 hour and automatically refreshed by Firebase
    const token = await user.getIdToken(forceRefresh);

    if (import.meta.env.DEV) {
      console.log('Got auth token for user:', user.email, forceRefresh ? '(forced refresh)' : '(cached)');
    }

    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/ai/chat')
 * @param options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // First attempt with cached token
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

  // If we get 401 Unauthorized, try once more with a fresh token
  if (response.status === 401) {
    if (import.meta.env.DEV) {
      console.log('Got 401, retrying with fresh token...');
    }

    token = await getAuthToken(true); // Force refresh

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

/**
 * Make an authenticated API request with FormData (for file uploads)
 * @param endpoint - API endpoint
 * @param formData - The FormData object to send
 * @param options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFormRequest(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  // First attempt with cached token
  let token = await getAuthToken(false);

  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // When using FormData, the browser automatically sets the 'Content-Type'
  // to 'multipart/form-data' with the correct boundary.
  // Do not set it manually.

  const url = `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    method: 'POST', // FormData requests are typically POST
    headers,
    body: formData,
  });

  // If we get 401 Unauthorized, try once more with a fresh token
  if (response.status === 401) {
    if (import.meta.env.DEV) {
      console.log('Got 401 on form request, retrying with fresh token...');
    }

    token = await getAuthToken(true); // Force refresh

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

