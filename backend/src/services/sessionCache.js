
import { v4 as uuidv4 } from 'uuid';

const sessionCache = new Map();
const DEFAULT_TTL = 600 * 1000;

class SessionCache {
  constructor() {
    this._cleanupInterval = setInterval(() => this._cleanup(), 60 * 1000);
  }

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
    return session;
  }

  get(sessionId) {
    const session = sessionCache.get(sessionId);
    if (!session) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - session.lastAccessedAt) > session.ttl;

    if (isExpired) {
      this.delete(sessionId);
      return null;
    }

    session.lastAccessedAt = now;
    return session;
  }

  delete(sessionId) {
    return sessionCache.delete(sessionId);
  }

  clear() {
    sessionCache.clear();
  }

  _cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of sessionCache.entries()) {
      if ((now - session.lastAccessedAt) > session.ttl) {
        this.delete(sessionId);
      }
    }
  }
}

export default new SessionCache();
