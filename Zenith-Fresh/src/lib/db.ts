/**
 * Database connection and Prisma Client for Zenith Fresh
 * Implements proper connection management and error handling
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Test database connection on startup
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Graceful database disconnection
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

/**
 * Database health check
 */
export async function databaseHealthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Database is responding'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Execute database operations with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw new Error('Maximum retries exceeded');
}

// Initialize database connection on module load
if (typeof window === 'undefined') {
  // Server-side only
  testDatabaseConnection().catch(error => {
    console.error('Initial database connection failed:', error);
  });
}

export default prisma;