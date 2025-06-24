/**
 * Redis-based Session Storage for Serverless Environment
 * Replaces in-memory session storage for production scalability
 */

class RedisSessionStore {
  constructor() {
    this.redisClient = null;
    this.initialized = false;
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    if (this.initialized) return;

    try {
      // Use ioredis for better serverless compatibility
      const Redis = require('ioredis');
      
      this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        // Serverless optimizations
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      this.redisClient.on('error', (error) => {
        console.error('[REDIS_SESSION] Connection error:', error);
      });

      this.initialized = true;
      console.log('[REDIS_SESSION] Redis session store initialized');
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Ensure Redis is connected
   */
  async ensureConnection() {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      await this.redisClient.connect();
    }
  }

  /**
   * Set session data with expiration
   */
  async setSession(sessionId, data, expirationTime = 3600) {
    try {
      await this.ensureConnection();
      
      const sessionData = {
        ...data,
        expiresAt: Date.now() + (expirationTime * 1000),
        createdAt: data.createdAt || Date.now(),
        lastAccessed: Date.now()
      };

      const key = `session:${sessionId}`;
      await this.redisClient.setex(key, expirationTime, JSON.stringify(sessionData));
      
      console.log(`[REDIS_SESSION] Session stored: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to set session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    try {
      await this.ensureConnection();
      
      const key = `session:${sessionId}`;
      const sessionData = await this.redisClient.get(key);
      
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      // Check if session is expired (double-check against Redis TTL)
      if (Date.now() > session.expiresAt) {
        await this.deleteSession(sessionId);
        return null;
      }

      // Update last accessed time
      session.lastAccessed = Date.now();
      await this.redisClient.setex(key, await this.redisClient.ttl(key), JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to get session:', error);
      return null; // Return null on error to avoid breaking auth
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    try {
      await this.ensureConnection();
      
      const key = `session:${sessionId}`;
      const result = await this.redisClient.del(key);
      
      console.log(`[REDIS_SESSION] Session deleted: ${sessionId}`);
      return result > 0;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Update session expiration
   */
  async renewSession(sessionId, expirationTime = 3600) {
    try {
      await this.ensureConnection();
      
      const key = `session:${sessionId}`;
      const sessionData = await this.redisClient.get(key);
      
      if (!sessionData) {
        return false;
      }

      const session = JSON.parse(sessionData);
      session.expiresAt = Date.now() + (expirationTime * 1000);
      session.lastAccessed = Date.now();

      await this.redisClient.setex(key, expirationTime, JSON.stringify(session));
      
      console.log(`[REDIS_SESSION] Session renewed: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to renew session:', error);
      return false;
    }
  }

  /**
   * Get all active sessions (for admin)
   */
  async getActiveSessions() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('session:*');
      const activeSessions = [];

      for (const key of keys) {
        try {
          const sessionData = await this.redisClient.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.expiresAt > Date.now()) {
              activeSessions.push({
                sessionId: key.replace('session:', ''),
                userId: session.userId,
                role: session.role,
                createdAt: session.createdAt,
                lastAccessed: session.lastAccessed,
                expiresAt: session.expiresAt
              });
            }
          }
        } catch (parseError) {
          console.error(`[REDIS_SESSION] Failed to parse session ${key}:`, parseError);
        }
      }

      return activeSessions;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Get session count for monitoring
   */
  async getSessionCount() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('session:*');
      return keys.length;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to get session count:', error);
      return 0;
    }
  }

  /**
   * Clear all sessions (for testing/emergency)
   */
  async clearAllSessions() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('session:*');
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      
      console.log(`[REDIS_SESSION] Cleared ${keys.length} sessions`);
      return true;
    } catch (error) {
      console.error('[REDIS_SESSION] Failed to clear sessions:', error);
      return false;
    }
  }

  /**
   * Clean up Redis connection
   */
  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.disconnect();
      this.initialized = false;
      console.log('[REDIS_SESSION] Redis connection closed');
    }
  }
}

// Factory function for creating Redis session store
function createRedisSessionStore() {
  return new RedisSessionStore();
}

// Hybrid session store that falls back to in-memory for development
class HybridSessionStore {
  constructor() {
    this.useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';
    
    if (this.useRedis) {
      this.redisStore = new RedisSessionStore();
    } else {
      // Fallback to original session store for development
      const { SessionStore } = require('./session-store.js');
      this.memoryStore = new SessionStore();
    }
  }

  async setSession(sessionId, data, expirationTime) {
    if (this.useRedis) {
      return await this.redisStore.setSession(sessionId, data, expirationTime);
    } else {
      return await this.memoryStore.setSession(sessionId, data, expirationTime);
    }
  }

  async getSession(sessionId) {
    if (this.useRedis) {
      return await this.redisStore.getSession(sessionId);
    } else {
      return await this.memoryStore.getSession(sessionId);
    }
  }

  async deleteSession(sessionId) {
    if (this.useRedis) {
      return await this.redisStore.deleteSession(sessionId);
    } else {
      return await this.memoryStore.deleteSession(sessionId);
    }
  }

  async renewSession(sessionId, expirationTime) {
    if (this.useRedis) {
      return await this.redisStore.renewSession(sessionId, expirationTime);
    } else {
      return await this.memoryStore.renewSession(sessionId, expirationTime);
    }
  }

  async getActiveSessions() {
    if (this.useRedis) {
      return await this.redisStore.getActiveSessions();
    } else {
      return await this.memoryStore.getActiveSessions();
    }
  }

  getSessionCount() {
    if (this.useRedis) {
      return this.redisStore.getSessionCount();
    } else {
      return this.memoryStore.getSessionCount();
    }
  }

  async clearAllSessions() {
    if (this.useRedis) {
      return await this.redisStore.clearAllSessions();
    } else {
      return await this.memoryStore.clearAllSessions();
    }
  }
}

// Singleton instance
let sessionStoreInstance = null;

function getRedisSessionStore() {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new HybridSessionStore();
  }
  return sessionStoreInstance;
}

// CommonJS exports
module.exports = {
  RedisSessionStore,
  HybridSessionStore,
  getRedisSessionStore,
  createRedisSessionStore,
  default: RedisSessionStore
};

// Example usage and migration guide
/*
MIGRATION STEPS:

1. Install Redis client:
   npm install ioredis

2. Set environment variables:
   REDIS_URL=redis://localhost:6379
   NODE_ENV=production

3. Replace session store import:
   // Old:
   import { getSessionStore } from './session-store.js';
   
   // New:
   import { getRedisSessionStore } from './redis-session-store.js';

4. Update auth system:
   // In AuthSystem constructor:
   this.sessionStore = getRedisSessionStore();

5. Docker Compose for local Redis:
   version: '3.8'
   services:
     redis:
       image: redis:alpine
       ports:
         - "6379:6379"
       command: redis-server --appendonly yes

6. Production Redis options:
   - AWS ElastiCache
   - Redis Cloud
   - Upstash (Serverless Redis)
   - Railway Redis
*/