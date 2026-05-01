import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            {
              emit: 'event',
              level: 'query',
            },
            'error',
            'warn',
          ]
        : ['error'],

    // Enable query logging for PostgreSQL performance monitoring
    // In production, only log slow queries
  });

// Track query performance in development
if (process.env.NODE_ENV === 'development') {
  prismaInstance.$on('query' as any, (e: any) => {
    const duration = e.duration;
    const query = e.query;

    // Log queries that take longer than 100ms
    if (duration > 100) {
      console.warn(`[Slow Query] ${duration}ms - ${query}`);
    }

    // Note: Performance monitor tracking removed to avoid Edge Runtime compatibility issues
    // The monitor is still available in API routes that run in Node.js runtime
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;

export const prisma = prismaInstance;
export const db = prismaInstance;
export default prismaInstance;
