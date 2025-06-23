/**
 * External Session Storage for Zenith Fresh
 * Replaces in-memory session storage for production scalability
 */

class SessionStore {
  constructor() {
    // For now, use in-memory storage with proper cleanup
    // TODO: Replace with Redis in production
    this.sessions = new Map();
    this.cleanup();
  }

  /**
   * Set session data with expiration
   */
  async setSession(sessionId, data, expirationTime = 3600) {
    const expiresAt = Date.now() + (expirationTime * 1000);
    
    this.sessions.set(sessionId, {
      ...data,
      expiresAt: expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });

    return true;
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessed = Date.now();
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Update session expiration
   */
  async renewSession(sessionId, expirationTime = 3600) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.expiresAt = Date.now() + (expirationTime * 1000);
    session.lastAccessed = Date.now();
    this.sessions.set(sessionId, session);

    return true;
  }

  /**
   * Get all active sessions (for admin)
   */
  async getActiveSessions() {
    const now = Date.now();
    const activeSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt > now) {
        activeSessions.push({
          sessionId,
          userId: session.userId,
          role: session.role,
          createdAt: session.createdAt,
          lastAccessed: session.lastAccessed,
          expiresAt: session.expiresAt
        });
      }
    }

    return activeSessions;
  }

  /**
   * Cleanup expired sessions
   */
  cleanup() {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }

    // Schedule next cleanup in 5 minutes
    setTimeout(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get session count for monitoring
   */
  getSessionCount() {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (for testing/emergency)
   */
  async clearAllSessions() {
    this.sessions.clear();
    return true;
  }
}

// Singleton instance
let sessionStoreInstance = null;

function getSessionStore() {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore();
  }
  return sessionStoreInstance;
}

// CommonJS exports
module.exports = {
  getSessionStore,
  SessionStore,
  default: SessionStore
};