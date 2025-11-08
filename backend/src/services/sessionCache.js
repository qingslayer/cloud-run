
import { v4 as uuidv4 } from 'uuid';

const sessionCache = new Map();
const DEFAULT_TTL = 600 * 1000; // 10 minutes

/**
 * Manages in-memory session storage with automatic cleanup.
 */
class SessionCache {
  constructor() {
    this._cleanupInterval = setInterval(() => this._cleanup(), 60 * 1000); // Run cleanup every minute
  }

  /**
   * Store session data with a given sessionId.
   * @param {string} sessionId - The unique identifier for the session.
   * @param {object} sessionData - The data to store in the session.
   * @param {number} [ttl=DEFAULT_TTL] - Time-to-live in milliseconds.
   * @returns {object} The stored session data.
   */
  set(sessionId, sessionData, ttl = DEFAULT_TTL) {
    const now = Date.now();
    const session = {
      ...sessionData,
      sessionId,
      createdAt: now,
      lastAccessedAt: now,
      ttl,
    };
    sessionCache.set(sessionId, session);
    console.log(`[Cache SET] Session ${sessionId} cached. Documents: ${sessionData.documents.length}, TTL: ${ttl}ms`);
    return session;
  }

  /**
   * Retrieve session data by sessionId.
   * @param {string} sessionId - The unique identifier for the session.
   * @returns {object|null} The session data or null if not found or expired.
   */
  get(sessionId) {
    const session = sessionCache.get(sessionId);
    if (!session) {
      console.log(`[Cache MISS] Session ${sessionId} not found.`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - session.lastAccessedAt) > session.ttl;

    if (isExpired) {
      console.log(`[Cache EXPIRED] Session ${sessionId} has expired.`);
      this.delete(sessionId);
      return null;
    }

    session.lastAccessedAt = now; // Sliding TTL
    console.log(`[Cache HIT] Session ${sessionId} retrieved.`);
    return session;
  }

  /**
   * Remove session data for a given sessionId.
   * @param {string} sessionId - The unique identifier for the session.
   * @returns {boolean} True if deleted, false if not found.
   */
  delete(sessionId) {
    const deleted = sessionCache.delete(sessionId);
    if (deleted) {
      console.log(`[Cache DELETE] Session ${sessionId} removed.`);
    }
    return deleted;
  }

  /**
   * Remove all sessions from the cache.
   */
  clear() {
    sessionCache.clear();
    console.log('[Cache CLEAR] All sessions removed.');
  }

  /**
   * Private method to clean up expired sessions.
   */
  _cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [sessionId, session] of sessionCache.entries()) {
      if ((now - session.lastAccessedAt) > session.ttl) {
        this.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`[Cache CLEANUP] Removed ${cleanedCount} expired sessions.`);
    }
  }
}

export default new SessionCache();
