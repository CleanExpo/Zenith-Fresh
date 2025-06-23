/**
 * Database Client for Zenith Platform
 * Provides database connectivity with fallback mechanisms
 */

const { PrismaClient } = require('@prisma/client');

// Global database client instance
let prisma = null;
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Initialize Prisma Client with connection retry logic
 */
function initializePrismaClient() {
  if (prisma) {
    return prisma;
  }

  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Add connection event handlers (for older Prisma versions)
    // Note: beforeExit is not available in Prisma 5.0+
    try {
      if (typeof prisma.$on === 'function') {
        // Only add event handler if supported
        process.on('beforeExit', () => {
          console.log('Database connection closing...');
          isConnected = false;
        });
      }
    } catch (error) {
      // Ignore event handler errors
    }

    return prisma;
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error);
    return null;
  }
}

/**
 * Test database connectivity
 */
async function testConnection() {
  if (!prisma) {
    prisma = initializePrismaClient();
  }

  if (!prisma) {
    return false;
  }

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    connectionAttempts = 0;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    isConnected = false;
    connectionAttempts++;
    return false;
  }
}

/**
 * Get database client with connection validation
 */
async function getDbClient() {
  if (!prisma) {
    prisma = initializePrismaClient();
  }

  if (!prisma) {
    throw new Error('Database client not available');
  }

  // Test connection if not connected or too many failed attempts
  if (!isConnected || connectionAttempts > 0) {
    const connected = await testConnection();
    if (!connected && connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      throw new Error('Database connection failed after maximum attempts');
    }
  }

  return prisma;
}

/**
 * Execute database operation with fallback handling
 */
async function executeWithFallback(operation, fallbackFn = null) {
  try {
    const client = await getDbClient();
    return await operation(client);
  } catch (error) {
    console.error('Database operation failed:', error);
    
    // Execute fallback if provided
    if (fallbackFn && typeof fallbackFn === 'function') {
      console.log('Executing fallback operation...');
      return await fallbackFn(error);
    }
    
    // Re-throw if no fallback
    throw error;
  }
}

/**
 * Get database health status
 */
async function getDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    const connected = await testConnection();
    const latency = Date.now() - startTime;
    
    if (connected) {
      return {
        status: 'healthy',
        message: 'Database connection successful',
        latency,
        connectionAttempts,
        lastChecked: new Date().toISOString()
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Database connection failed (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS} attempts)`,
        latency: -1,
        connectionAttempts,
        lastChecked: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      latency: -1,
      connectionAttempts,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Graceful shutdown of database connection
 */
async function closeDatabaseConnection() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed gracefully');
    } catch (error) {
      console.error('Error closing database connection:', error);
    } finally {
      prisma = null;
      isConnected = false;
      connectionAttempts = 0;
    }
  }
}

/**
 * User management operations with database
 */
const userOperations = {
  async createUser(userData) {
    return executeWithFallback(
      async (client) => {
        return await client.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            role: userData.role || 'user'
          }
        });
      },
      async (error) => {
        // Fallback: log the attempt and return mock data
        console.log('User creation failed, using fallback:', error.message);
        return {
          id: `mock_${Date.now()}`,
          email: userData.email,
          username: userData.username,
          role: userData.role || 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    );
  },

  async getUserByUsername(username) {
    return executeWithFallback(
      async (client) => {
        return await client.user.findUnique({
          where: { username }
        });
      },
      async (error) => {
        console.log('User lookup failed, using fallback:', error.message);
        return null;
      }
    );
  },

  async getUserByEmail(email) {
    return executeWithFallback(
      async (client) => {
        return await client.user.findUnique({
          where: { email }
        });
      },
      async (error) => {
        console.log('User lookup failed, using fallback:', error.message);
        return null;
      }
    );
  },

  async updateUser(id, userData) {
    return executeWithFallback(
      async (client) => {
        return await client.user.update({
          where: { id },
          data: userData
        });
      },
      async (error) => {
        console.log('User update failed, using fallback:', error.message);
        return null;
      }
    );
  },

  async getAllUsers() {
    return executeWithFallback(
      async (client) => {
        return await client.user.findMany({
          orderBy: { createdAt: 'desc' }
        });
      },
      async (error) => {
        console.log('User listing failed, using fallback:', error.message);
        return [];
      }
    );
  }
};

/**
 * Session storage operations (for persistent sessions)
 */
const sessionOperations = {
  // In-memory fallback for sessions when database is unavailable
  memoryStore: new Map(),

  async storeSession(sessionId, sessionData, expiresInSeconds = 86400) {
    return executeWithFallback(
      async (client) => {
        // For now, we'll use the in-memory store as the primary method
        // In the future, this could be extended to use a sessions table
        const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));
        this.memoryStore.set(sessionId, {
          ...sessionData,
          expiresAt
        });
        return true;
      },
      async (error) => {
        console.log('Database session storage failed, using memory fallback:', error.message);
        const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));
        this.memoryStore.set(sessionId, {
          ...sessionData,
          expiresAt
        });
        return true;
      }
    );
  },

  async getSession(sessionId) {
    return executeWithFallback(
      async (client) => {
        const session = this.memoryStore.get(sessionId);
        if (!session) return null;
        
        // Check expiration
        if (new Date() > session.expiresAt) {
          this.memoryStore.delete(sessionId);
          return null;
        }
        
        return session;
      },
      async (error) => {
        console.log('Database session retrieval failed, using memory fallback:', error.message);
        const session = this.memoryStore.get(sessionId);
        if (!session) return null;
        
        // Check expiration
        if (new Date() > session.expiresAt) {
          this.memoryStore.delete(sessionId);
          return null;
        }
        
        return session;
      }
    );
  },

  async deleteSession(sessionId) {
    return executeWithFallback(
      async (client) => {
        const existed = this.memoryStore.has(sessionId);
        this.memoryStore.delete(sessionId);
        return existed;
      },
      async (error) => {
        console.log('Database session deletion failed, using memory fallback:', error.message);
        const existed = this.memoryStore.has(sessionId);
        this.memoryStore.delete(sessionId);
        return existed;
      }
    );
  },

  async renewSession(sessionId, expiresInSeconds = 86400) {
    return executeWithFallback(
      async (client) => {
        const session = this.memoryStore.get(sessionId);
        if (!session) return false;
        
        session.expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));
        session.lastActivity = new Date().toISOString();
        this.memoryStore.set(sessionId, session);
        return true;
      },
      async (error) => {
        console.log('Database session renewal failed, using memory fallback:', error.message);
        const session = this.memoryStore.get(sessionId);
        if (!session) return false;
        
        session.expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));
        session.lastActivity = new Date().toISOString();
        this.memoryStore.set(sessionId, session);
        return true;
      }
    );
  },

  async getAllActiveSessions() {
    return executeWithFallback(
      async (client) => {
        const now = new Date();
        const activeSessions = [];
        
        for (const [sessionId, session] of this.memoryStore.entries()) {
          if (session.expiresAt > now) {
            activeSessions.push({
              id: sessionId,
              user: session.user,
              createdAt: session.createdAt,
              lastActivity: session.lastActivity,
              expiresAt: session.expiresAt
            });
          } else {
            // Clean up expired sessions
            this.memoryStore.delete(sessionId);
          }
        }
        
        return activeSessions;
      },
      async (error) => {
        console.log('Database session listing failed, using memory fallback:', error.message);
        const now = new Date();
        const activeSessions = [];
        
        for (const [sessionId, session] of this.memoryStore.entries()) {
          if (session.expiresAt > now) {
            activeSessions.push({
              id: sessionId,
              user: session.user,
              createdAt: session.createdAt,
              lastActivity: session.lastActivity,
              expiresAt: session.expiresAt
            });
          } else {
            // Clean up expired sessions
            this.memoryStore.delete(sessionId);
          }
        }
        
        return activeSessions;
      }
    );
  }
};

/**
 * Analysis operations with database
 */
const analysisOperations = {
  async createAnalysis(analysisData) {
    return executeWithFallback(
      async (client) => {
        return await client.analysis.create({
          data: {
            url: analysisData.url,
            status: analysisData.status || 'pending',
            results: analysisData.results || null
          }
        });
      },
      async (error) => {
        console.log('Analysis creation failed, using fallback:', error.message);
        return {
          id: `mock_${Date.now()}`,
          url: analysisData.url,
          status: analysisData.status || 'pending',
          results: analysisData.results || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    );
  },

  async getAnalysisById(id) {
    return executeWithFallback(
      async (client) => {
        return await client.analysis.findUnique({
          where: { id }
        });
      },
      async (error) => {
        console.log('Analysis lookup failed, using fallback:', error.message);
        return null;
      }
    );
  },

  async updateAnalysis(id, analysisData) {
    return executeWithFallback(
      async (client) => {
        return await client.analysis.update({
          where: { id },
          data: analysisData
        });
      },
      async (error) => {
        console.log('Analysis update failed, using fallback:', error.message);
        return null;
      }
    );
  },

  async getAllAnalyses(limit = 50) {
    return executeWithFallback(
      async (client) => {
        return await client.analysis.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        });
      },
      async (error) => {
        console.log('Analysis listing failed, using fallback:', error.message);
        return [];
      }
    );
  }
};

/**
 * System metrics operations with database
 */
const metricsOperations = {
  // In-memory fallback for metrics when database is unavailable
  memoryStore: {
    current: null,
    history: []
  },

  async storeMetrics(metricsData) {
    return executeWithFallback(
      async (client) => {
        // For now, we'll use the in-memory store as the primary method
        // In the future, this could be extended to use a metrics table
        this.memoryStore.current = {
          ...metricsData,
          timestamp: new Date().toISOString()
        };
        
        // Add to history
        this.memoryStore.history.push(this.memoryStore.current);
        
        // Maintain history size (last 1440 entries = 24 hours at 1 minute intervals)
        if (this.memoryStore.history.length > 1440) {
          this.memoryStore.history.shift();
        }
        
        return true;
      },
      async (error) => {
        console.log('Database metrics storage failed, using memory fallback:', error.message);
        this.memoryStore.current = {
          ...metricsData,
          timestamp: new Date().toISOString()
        };
        
        // Add to history
        this.memoryStore.history.push(this.memoryStore.current);
        
        // Maintain history size
        if (this.memoryStore.history.length > 1440) {
          this.memoryStore.history.shift();
        }
        
        return true;
      }
    );
  },

  async getCurrentMetrics() {
    return executeWithFallback(
      async (client) => {
        return this.memoryStore.current;
      },
      async (error) => {
        console.log('Database metrics retrieval failed, using memory fallback:', error.message);
        return this.memoryStore.current;
      }
    );
  },

  async getMetricsHistory(hours = 1) {
    return executeWithFallback(
      async (client) => {
        const targetEntries = hours * 60; // entries per hour
        const history = this.memoryStore.history.slice(-targetEntries);
        return {
          timeRange: `${hours} hour(s)`,
          dataPoints: history.length,
          data: history
        };
      },
      async (error) => {
        console.log('Database metrics history retrieval failed, using memory fallback:', error.message);
        const targetEntries = hours * 60;
        const history = this.memoryStore.history.slice(-targetEntries);
        return {
          timeRange: `${hours} hour(s)`,
          dataPoints: history.length,
          data: history
        };
      }
    );
  },

  async logRequest(requestData) {
    return executeWithFallback(
      async (client) => {
        // Store request log (in memory for now)
        const logEntry = {
          ...requestData,
          timestamp: new Date().toISOString()
        };
        
        // Could store in database table in the future
        console.log('Request logged:', JSON.stringify(logEntry));
        return true;
      },
      async (error) => {
        console.log('Database request logging failed, using fallback:', error.message);
        const logEntry = {
          ...requestData,
          timestamp: new Date().toISOString()
        };
        console.log('Request logged (fallback):', JSON.stringify(logEntry));
        return true;
      }
    );
  }
};

module.exports = {
  getDbClient,
  executeWithFallback,
  getDatabaseHealth,
  closeDatabaseConnection,
  testConnection,
  userOperations,
  sessionOperations,
  analysisOperations,
  metricsOperations
};