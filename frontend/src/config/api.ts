/**
 * API Configuration
 * Central configuration for backend API calls
 */

// Get API base URL from environment or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get Firebase ID token for authenticated requests
 * @returns {Promise<string | null>}
 */
export async function getAuthToken(): Promise<string | null> {
  // TODO: Implement Firebase auth token retrieval
  // For now, return null (will need to integrate with Firebase Auth)
  return null;
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

