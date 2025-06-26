import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Connection pool configuration for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Middleware to log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    if (duration > 100) {
      console.warn(`Slow query (${duration}ms): ${params.model}.${params.action}`);
    }

    return result;
  });
}

// Connection management
export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnection failed:', error);
    throw error;
  }
}

// Query helpers with built-in error handling
export const db = {
  // Transactional helper
  transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
    return prisma.$transaction(fn);
  },

  // Batch operations helper
  batchCreate: async <T>(model: any, data: any[]): Promise<T[]> => {
    const batchSize = 100;
    const results: T[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const created = await model.createMany({ data: batch });
      results.push(...created);
    }

    return results;
  },

  // Query with retry logic
  withRetry: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (
          error.code === 'P2002' || // Unique constraint violation
          error.code === 'P2025' || // Record not found
          error.code === 'P2003'    // Foreign key constraint violation
        ) {
          throw error;
        }

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError;
  },
};

export default prisma;