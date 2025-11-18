import { DocumentCategory } from '../types';

/**
 * Centralized timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  /** Interval for polling document processing updates */
  POLL_INTERVAL: 5000,
  /** Default duration for toast notifications */
  TOAST_DEFAULT: 4000,
  /** Duration for success toast notifications */
  SUCCESS_TOAST: 3000,
  /** Duration to show settings save success message */
  SETTINGS_SAVE_HIDE: 3000,
  /** Delay before checking scroll buttons */
  SCROLL_CHECK: 300,
  /** Initial delay before fetching documents */
  INITIAL_FETCH: 100,
} as const;

/**
 * Centralized localStorage keys
 */
export const STORAGE_KEYS = {
  /** User's theme preference (light/dark/system) */
  THEME: 'theme',
  /** Set of document IDs that user has viewed */
  VIEWED_DOCS: 'viewedDocuments',
  /** Onboarding state tracking */
  ONBOARDING: 'healthvault_onboarding',
} as const;

/**
 * All available document categories
 * This is the single source of truth for categories across the app
 */
export const CATEGORIES: readonly DocumentCategory[] = [
  'Lab Results',
  'Prescriptions',
  'Imaging Reports',
  "Doctor's Notes",
  'Vaccination Records',
  'Other',
] as const;
