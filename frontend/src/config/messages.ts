/**
 * Centralized UI messages and text content
 * Single source of truth for user-facing strings
 */

export const MESSAGES = {
  /** Processing time estimates */
  PROCESSING: {
    /** Long processing estimate */
    ESTIMATE_LONG: '10-30 seconds',
    /** Short processing estimate */
    ESTIMATE_SHORT: '5-15 seconds',
    /** AI analyzing message */
    AI_ANALYZING: 'AI analyzing document...',
    /** General processing message */
    USUALLY_TAKES: 'This usually takes',
  },

  /** Deletion confirmation messages */
  DELETE: {
    /** Confirmation for deleting all records */
    ALL: 'This will permanently delete ALL your health records from the system. This action cannot be undone and your data cannot be recovered. Are you absolutely sure?',
    /** Confirmation for deleting single document */
    SINGLE: 'This will permanently delete this document from the system. This action cannot be undone and the file cannot be recovered. Are you sure you want to continue?',
  },

  /** Loading states */
  LOADING: {
    /** General loading message */
    DEFAULT: 'Loading...',
    /** Loading health records */
    HEALTH_RECORDS: 'Loading your health records...',
  },

  /** Error messages */
  ERRORS: {
    /** Failed to load documents */
    LOAD_DOCUMENTS: 'Failed to load your documents. Please refresh the page.',
    /** Failed to update document */
    UPDATE_DOCUMENT: 'Failed to update document. Please try again.',
    /** Failed to delete document */
    DELETE_DOCUMENT: 'Failed to delete document. Please try again.',
    /** Failed to save reviewed document */
    SAVE_REVIEWED: 'Failed to save reviewed document. Please try again.',
    /** Failed to save changes */
    SAVE_CHANGES: 'Failed to save changes. Please try again.',
    /** Search failed */
    SEARCH_FAILED: 'Search failed. Please try again.',
    /** Failed to send message */
    SEND_MESSAGE_FAILED: 'Failed to send message. Please try again.',
    /** Failed to sign out */
    SIGN_OUT_FAILED: 'Failed to sign out. Please try again.',
    /** Failed to load document */
    LOAD_DOCUMENT: 'Failed to load document. Please try again.',
  },

  /** Success messages */
  SUCCESS: {
    /** Document deleted */
    DOCUMENT_DELETED: 'Document deleted successfully',
    /** All records deleted */
    ALL_DELETED: 'All records deleted successfully',
  },
} as const;
