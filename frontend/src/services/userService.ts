import { apiRequest } from '../config/api';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Initialize or update user profile on first login
 * This should be called automatically when a user signs in
 */
export const initializeUserProfile = async (): Promise<UserProfile> => {
  const response = await apiRequest('/api/users', {
    method: 'POST',
  });
  const data = await response.json();
  return data.user;
};

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  const response = await apiRequest(`/api/users/${uid}`, {
    method: 'GET',
  });
  return await response.json();
};

/**
 * Update user profile (displayName and/or photoURL)
 */
export const updateUserProfile = async (
  uid: string,
  updates: { displayName?: string; photoURL?: string | null }
): Promise<UserProfile> => {
  const response = await apiRequest(`/api/users/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  return data.user;
};
