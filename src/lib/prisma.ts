import { PrismaClient } from '@prisma/client';
// TEMPORARILY DISABLED: Database monitor causing server errors
// import { createDatabaseMonitor } from './monitoring/database-performance-monitor';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbMonitor: any;
};

// Enterprise Database Configuration with fallback
const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

// Validate DATABASE_URL format
function validateDatabaseUrl(url: string): string {
  if (url.startsWith('file:')) {
    return url; // SQLite is valid
  }
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return url; // PostgreSQL is valid
  }
  // If invalid, fallback to SQLite
  console.warn('Invalid DATABASE_URL format, falling back to SQLite');
  return 'file:./dev.db';
}

const validatedDatabaseUrl = validateDatabaseUrl(DATABASE_URL);

// Enterprise-grade Prisma configuration with optimizations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: validatedDatabaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn', 'info'] 
      : ['error', 'warn'],
    
    // Enterprise Performance Optimizations
    errorFormat: 'pretty'
  });

// TEMPORARILY DISABLED: Database monitoring causing server errors
// Initialize advanced database monitoring
// if (!globalForPrisma.dbMonitor) {
//   globalForPrisma.dbMonitor = createDatabaseMonitor(prisma);
// }

// export const dbMonitor = globalForPrisma.dbMonitor;
export const dbMonitor = null; // Disabled for debugging

// Global Prisma instance management
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
