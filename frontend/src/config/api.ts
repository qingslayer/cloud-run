/**
 * API Configuration
 * Central configuration for backend API calls
 */

import { auth } from './firebase';

// Get API base URL from environment or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated requests
 * @returns {Promise<string | null>}
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user found when getting auth token');
      return null;
    }
    
    // Get the ID token, forcing refresh to ensure it's valid
    // Setting forceRefresh=true ensures we always get a fresh, valid token
    const token = await user.getIdToken(true);
    console.log('Got auth token for user:', user.email);
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
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

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
  const token = await getAuthToken();

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

  const response = await fetch(url, {
    ...options,
    method: 'POST', // FormData requests are typically POST
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

