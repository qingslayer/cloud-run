/**
 * Centralized constants for the backend application
 * This file consolidates all magic numbers, configuration values, and shared constants
 */

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================
export const CACHE_CONFIG = {
  SESSION_TTL: 10 * 60 * 1000,      // 10 minutes
  SESSION_CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  SEARCH_TTL: 5 * 60 * 1000,        // 5 minutes
  SEARCH_MAX_SIZE: 100,              // Maximum number of cached searches
};

// ============================================================================
// QUERY LIMITS
// ============================================================================
export const QUERY_LIMITS = {
  DEFAULT_LIST: 50,           // Default pagination limit for document lists
  DOCUMENTS_SEARCH: 50,       // Max documents to return in search
  FUZZY_RESULTS: 20,          // Max fuzzy search results
  AI_SUMMARY: 15,             // Max documents for AI summary
  AI_ANSWER: 10,              // Max documents for AI answer
  TOP_RANKED: 50,             // Default top ranked documents
};

// ============================================================================
// TIME DURATIONS
// ============================================================================
export const TIME_DURATIONS = {
  SIGNED_URL_EXPIRY: 60 * 60 * 1000, // 1 hour for signed URLs
  RECENT_DAYS_THRESHOLD: 30,          // Days considered "recent" for boost
  MEDIUM_AGE_THRESHOLD: 90,           // Days for medium age boost
  OLD_AGE_THRESHOLD: 365,             // Days for old age boost
};

// ============================================================================
// DOCUMENT CATEGORIES
// ============================================================================
export const DOCUMENT_CATEGORIES = [
  'Lab Results',
  'Prescriptions',
  'Imaging Reports',
  "Doctor's Notes",
  'Vaccination Records',
  'Other'
];

// ============================================================================
// HTTP STATUS CODES
// ============================================================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
  // Document errors
  DOCUMENT_NOT_FOUND: 'Document not found',
  DOCUMENT_ACCESS_DENIED: 'Forbidden: You do not have access to this document',
  DOCUMENT_FETCH_FAILED: 'Failed to fetch documents',
  DOCUMENT_UPLOAD_FAILED: 'Failed to upload document',
  DOCUMENT_DELETE_FAILED: 'Failed to delete document',
  DOCUMENT_UPDATE_FAILED: 'Failed to edit document',
  DOCUMENT_ANALYZE_FAILED: 'Failed to analyze document',

  // File errors
  NO_FILE_PROVIDED: 'No file provided',

  // Search errors
  SEARCH_FAILED: 'Failed to search documents',

  // Chat errors
  CHAT_FETCH_FAILED: 'Failed to fetch chat history',
  CHAT_SEND_FAILED: 'Failed to send message',

  // Session errors
  SESSION_NOT_FOUND: 'Session not found',
  SESSION_ACCESS_DENIED: 'Forbidden: You do not have access to this session',

  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_ACCESS_DENIED: 'Forbidden: You do not have access to this user',
  USER_FETCH_FAILED: 'Failed to fetch user information',
  USER_UPDATE_FAILED: 'Failed to update user',

  // Auth errors
  NO_TOKEN_PROVIDED: 'No Firebase ID token was passed as a Bearer token in the Authorization header.',
  INVALID_TOKEN: 'Invalid or expired Firebase ID token.',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  INVALID_CATEGORY: 'Invalid document category',
};

// ============================================================================
// SEARCH RANKING CONFIGURATION
// ============================================================================
export const SEARCH_RANKING = {
  // Field weights for search relevance
  FIELD_WEIGHTS: {
    displayName: 10,
    filename: 8,
    category: 6,
    searchSummary: 5,
    notes: 4,
    structuredData: 2,
  },

  // Recency boost multipliers
  RECENCY_BOOST: {
    DAYS_30: 1.2,    // Documents from last 30 days
    DAYS_90: 1.1,    // Documents from last 90 days
    DAYS_365: 1.05,  // Documents from last year
  },

  // Status boost multipliers
  STATUS_BOOST: {
    COMPLETE: 1.1,   // Completed documents get a boost
  },
};

// ============================================================================
// FUZZY SEARCH CONFIGURATION
// ============================================================================
export const FUZZY_SEARCH_CONFIG = {
  THRESHOLD: 0.3,              // Lower = more strict matching
  MIN_MATCH_CHAR_LENGTH: 2,    // Minimum characters to match
  DISTANCE: 100,               // Max distance between matches

  // Field weights for Fuse.js
  KEYS: [
    { name: 'displayName', weight: 0.3 },
    { name: 'filename', weight: 0.25 },
    { name: 'category', weight: 0.2 },
    { name: 'notes', weight: 0.15 },
    { name: 'searchableText', weight: 0.1 },
  ],
};

// ============================================================================
// QUERY ANALYZER CONFIGURATION
// ============================================================================
export const QUERY_ANALYZER_CONFIG = {
  RECENT_DAYS: 90,                // Days considered "recent"
  MIN_KEYWORD_LENGTH: 2,          // Minimum keyword length
  MAX_LEVENSHTEIN_DISTANCE: 2,    // Max edit distance for fuzzy matching
  LENGTH_RATIO_THRESHOLD: 0.5,    // Minimum length ratio for fuzzy match
};

// ============================================================================
// AI TEXT PROCESSING LIMITS
// ============================================================================
export const AI_TEXT_LIMITS = {
  CATEGORIZATION: 10000,  // Max characters for document categorization
  SEARCH_SUMMARY: 8000,   // Max characters for search summary generation
};

// ============================================================================
// PROJECT CONFIGURATION
// ============================================================================
export const PROJECT_CONFIG = {
  DEFAULT_PROJECT_ID: 'helpful-beach-476908-p3',
  DEFAULT_STORAGE_BUCKET: 'helpful-beach-476908-p3.firebasestorage.app',
};
