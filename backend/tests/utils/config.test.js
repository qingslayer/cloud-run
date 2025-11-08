/**
 * Shared configuration constants for test files
 */

export const API_BASE_URL = 'http://localhost:8080/api';
export const API_DOCUMENTS_URL = `${API_BASE_URL}/documents`;
export const API_CHAT_URL = `${API_BASE_URL}/chat`;
export const API_SEARCH_URL = `${API_DOCUMENTS_URL}/search`;

// Test user credentials (hardcoded for emulator)
export const TEST_EMAIL = 'test@example.com';
export const TEST_PASSWORD = 'password123';

// Firebase Emulator URLs
export const AUTH_EMULATOR_URL = 'http://localhost:9099';
export const FIRESTORE_EMULATOR_HOST = 'localhost:8080';

