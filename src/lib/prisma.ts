import { PrismaClient } from '@prisma/client';
import { createDatabaseMonitor } from './monitoring/database-performance-monitor';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbMonitor: any;
};

// Enterprise Database Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

// Enterprise-grade Prisma configuration with optimizations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn', 'info'] 
      : ['error', 'warn'],
    
    // Enterprise Performance Optimizations
    errorFormat: 'pretty'
  });

// Initialize advanced database monitoring
if (!globalForPrisma.dbMonitor) {
  globalForPrisma.dbMonitor = createDatabaseMonitor(prisma);
}

export const dbMonitor = globalForPrisma.dbMonitor;

// Global Prisma instance management
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
