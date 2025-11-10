/**
 * Search Result Cache Service
 *
 * Implements an in-memory LRU cache for search results to improve performance
 * for repeated queries. Cache entries expire after 5 minutes.
 */

import { LRUCache } from 'lru-cache';

// Cache configuration
const CACHE_MAX_SIZE = 100; // Maximum number of cached queries
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create LRU cache instance
const searchCache = new LRUCache({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_TTL,
  updateAgeOnGet: true, // Reset TTL when cache is accessed
});

/**
 * Generate a cache key from search parameters
 * @param {string} query - Search query string
 * @param {string} userId - User ID
 * @param {object} options - Additional search options (category, timeRange, etc.)
 * @returns {string} Cache key
 */
const generateCacheKey = (query, userId, options = {}) => {
  const normalizedQuery = query.toLowerCase().trim();
  const optionsStr = JSON.stringify({
    category: options.category || null,
    timeRange: options.timeRange || null,
  });
  return `${userId}:${normalizedQuery}:${optionsStr}`;
};

/**
 * Get cached search results
 * @param {string} query - Search query string
 * @param {string} userId - User ID
 * @param {object} options - Additional search options
 * @returns {object|null} Cached results or null if not found
 */
const getCachedResults = (query, userId, options = {}) => {
  const key = generateCacheKey(query, userId, options);
  const cached = searchCache.get(key);

  if (cached) {
    console.log(`[SearchCache] Cache HIT for query: "${query}"`);
    return cached;
  }

  console.log(`[SearchCache] Cache MISS for query: "${query}"`);
  return null;
};

/**
 * Cache search results
 * @param {string} query - Search query string
 * @param {string} userId - User ID
 * @param {object} results - Search results to cache
 * @param {object} options - Additional search options
 */
const setCachedResults = (query, userId, results, options = {}) => {
  const key = generateCacheKey(query, userId, options);
  searchCache.set(key, results);
  console.log(`[SearchCache] Cached results for query: "${query}"`);
};

/**
 * Invalidate cache for a specific user
 * Called when user uploads, edits, or deletes documents
 * @param {string} userId - User ID
 */
const invalidateUserCache = (userId) => {
  let invalidatedCount = 0;

  // Iterate through cache and remove entries for this user
  for (const key of searchCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      searchCache.delete(key);
      invalidatedCount++;
    }
  }

  if (invalidatedCount > 0) {
    console.log(`[SearchCache] Invalidated ${invalidatedCount} cache entries for user ${userId}`);
  }
};

/**
 * Clear entire cache
 * Use for maintenance or testing
 */
const clearCache = () => {
  searchCache.clear();
  console.log('[SearchCache] Cache cleared');
};

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
const getCacheStats = () => {
  return {
    size: searchCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttl: CACHE_TTL,
  };
};

export {
  getCachedResults,
  setCachedResults,
  invalidateUserCache,
  clearCache,
  getCacheStats,
};
