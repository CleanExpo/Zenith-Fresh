import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = {
  user: {
    count: () => Promise.resolve(1),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 'mock', email: 'mock', name: 'mock' }),
    deleteMany: () => Promise.resolve({ count: 0 }),
  },
  $disconnect: () => Promise.resolve(),
} as any;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
