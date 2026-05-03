/**
 * Thai Accounting ERP - Database Connection Pool Configuration
 * โปรแกรมบัญชีมาตรฐานไทย - การตั้งค่า Connection Pool
 * Version: 2.0 - Database Perfection Phase
 */

import { PrismaClient } from '@prisma/client';

// ============================================
// Connection Pool Configuration
// ============================================

interface PoolConfig {
  // Maximum number of connections in the pool
  maxConnections: number;
  // Minimum number of connections to maintain
  minConnections: number;
  // Connection timeout in seconds
  connectionTimeout: number;
  // Idle connection timeout in seconds
  idleTimeout: number;
  // Connection lifetime in seconds
  maxLifetime: number;
  // Number of connection retries
  retries: number;
  // Delay between retries in milliseconds
  retryDelay: number;
}

// Environment-specific configurations
const poolConfigs: Record<string, PoolConfig> = {
  development: {
    maxConnections: 10,
    minConnections: 2,
    connectionTimeout: 30,
    idleTimeout: 600,
    maxLifetime: 3600,
    retries: 3,
    retryDelay: 1000,
  },
  test: {
    maxConnections: 5,
    minConnections: 1,
    connectionTimeout: 10,
    idleTimeout: 60,
    maxLifetime: 300,
    retries: 1,
    retryDelay: 100,
  },
  production: {
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '50'),
    minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '900'),
    maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '3600'),
    retries: 5,
    retryDelay: 2000,
  },
};

// ============================================
// Connection Pool Manager
// ============================================

export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private prisma: PrismaClient | null = null;
  private config: PoolConfig;
  private metrics: ConnectionMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    this.config = poolConfigs[env];
    this.metrics = new ConnectionMetrics();

    this.initializePrisma();
    this.startHealthChecks();
  }

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  private initializePrisma() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse connection parameters based on database type
    const isPostgreSQL = databaseUrl.includes('postgresql');

    if (isPostgreSQL) {
      // Add connection pool parameters to URL
      const url = new URL(databaseUrl);
      url.searchParams.set('connection_limit', this.config.maxConnections.toString());
      url.searchParams.set('pool_timeout', this.config.connectionTimeout.toString());

      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: url.toString(),
          },
        },
        log: this.getLogConfig() as any,
      });
    } else {
      // SQLite doesn't need pooling
      this.prisma = new PrismaClient({
        log: this.getLogConfig() as any,
      });
    }

    // Setup middleware for metrics
    this.setupMiddleware();
  }

  private getLogConfig() {
    if (process.env.NODE_ENV === 'production') {
      return ['error', 'warn'] as const;
    }
    return ['query', 'error', 'warn'] as const;
  }

  private setupMiddleware() {
    if (!this.prisma) return;

    (this.prisma as any).$use(async (params, next) => {
      const start = Date.now();
      const operation = `${params.model}.${params.action}`;

      try {
        this.metrics.recordQueryStart(operation);
        const result = await next(params);
        const duration = Date.now() - start;

        this.metrics.recordQueryEnd(operation, duration, true);

        // Log slow queries in production
        if (process.env.NODE_ENV === 'production' && duration > 1000) {
          console.warn(`[SLOW QUERY] ${operation}: ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.metrics.recordQueryEnd(operation, duration, false);
        throw error;
      }
    });
  }

  private startHealthChecks() {
    // Skip for SQLite
    if (!process.env.DATABASE_URL?.includes('postgresql')) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        const prisma = this.prisma;
        if (prisma) {
          await prisma.$queryRaw`SELECT 1`;
        }
        this.metrics.recordHealthCheck(true);
      } catch (error) {
        this.metrics.recordHealthCheck(false);
        console.error('[Connection Pool] Health check failed:', error);

        // Attempt to reconnect
        await this.reconnect();
      }
    }, 30000); // Every 30 seconds
  }

  private async reconnect() {
    console.log('[Connection Pool] Attempting to reconnect...');

    try {
      await this.prisma?.$disconnect();
    } catch {
      // Ignore disconnect errors
    }

    // Retry with exponential backoff
    for (let i = 0; i < this.config.retries; i++) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, i))
        );
        this.initializePrisma();
        const prisma = this.prisma;
        if (prisma) {
          await prisma.$queryRaw`SELECT 1`;
        }
        console.log('[Connection Pool] Reconnected successfully');
        return;
      } catch (error) {
        console.error(`[Connection Pool] Reconnection attempt ${i + 1} failed`);
      }
    }

    console.error('[Connection Pool] All reconnection attempts failed');
  }

  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized');
    }
    return this.prisma;
  }

  getMetrics(): ConnectionMetricsData {
    return this.metrics.getData();
  }

  async shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    ConnectionPoolManager.instance = null as any;
  }
}

// ============================================
// Connection Metrics
// ============================================

interface QueryMetric {
  operation: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  errors: number;
  slowQueries: number;
}

interface ConnectionMetricsData {
  totalQueries: number;
  avgResponseTime: number;
  errorRate: number;
  activeConnections: number;
  healthCheckSuccess: number;
  healthCheckFailed: number;
  topQueries: QueryMetric[];
  slowQueries: Array<{ operation: string; duration: number; timestamp: Date }>;
}

class ConnectionMetrics {
  private queries: Map<string, QueryMetric> = new Map();
  private slowQueries: Array<{ operation: string; duration: number; timestamp: Date }> = [];
  private healthCheckSuccess = 0;
  private healthCheckFailed = 0;
  private readonly maxSlowQueries = 100;

  recordQueryStart(operation: string) {
    // Just track that a query started (for active connection count if needed)
  }

  recordQueryEnd(operation: string, duration: number, success: boolean) {
    const existing = this.queries.get(operation);

    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      if (!success) existing.errors++;
      if (duration > 1000) existing.slowQueries++;
    } else {
      this.queries.set(operation, {
        operation,
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        errors: success ? 0 : 1,
        slowQueries: duration > 1000 ? 1 : 0,
      });
    }

    // Track slow queries
    if (duration > 1000) {
      this.slowQueries.push({ operation, duration, timestamp: new Date() });
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift();
      }
    }
  }

  recordHealthCheck(success: boolean) {
    if (success) {
      this.healthCheckSuccess++;
    } else {
      this.healthCheckFailed++;
    }
  }

  getData(): ConnectionMetricsData {
    let totalQueries = 0;
    let totalDuration = 0;
    let totalErrors = 0;

    for (const metric of this.queries.values()) {
      totalQueries += metric.count;
      totalDuration += metric.totalDuration;
      totalErrors += metric.errors;
    }

    const sortedQueries = Array.from(this.queries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries,
      avgResponseTime: totalQueries > 0 ? totalDuration / totalQueries : 0,
      errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0,
      activeConnections: 0, // Would need to query PostgreSQL for this
      healthCheckSuccess: this.healthCheckSuccess,
      healthCheckFailed: this.healthCheckFailed,
      topQueries: sortedQueries,
      slowQueries: [...this.slowQueries].reverse(),
    };
  }
}

// ============================================
// Query Optimization Utilities
// ============================================

export class QueryOptimizer {
  /**
   * Add query hints for PostgreSQL optimization
   */
  static addOptimizationHints(query: string): string {
    // Add parallel query hints for large tables
    if (query.includes('JournalLine') || query.includes('Invoice')) {
      return `/*+ PARALLEL(4) */ ${query}`;
    }
    return query;
  }

  /**
   * Build efficient pagination query
   */
  static buildPaginationQuery(
    baseQuery: string,
    orderBy: string,
    cursor?: { field: string; value: any },
    limit: number = 50
  ): string {
    let query = baseQuery;

    if (cursor) {
      query += ` AND ${cursor.field} > $cursorValue`;
    }

    query += ` ORDER BY ${orderBy}`;
    query += ` LIMIT ${limit}`;

    return query;
  }

  /**
   * Build bulk insert query with conflict handling
   */
  static buildBulkInsertQuery(
    table: string,
    columns: string[],
    rows: any[][],
    conflictTarget?: string
  ): { query: string; params: any[] } {
    const placeholders = rows
      .map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`)
      .join(', ');

    let query = `
      INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')})
      VALUES ${placeholders}
    `;

    if (conflictTarget) {
      query += `
        ON CONFLICT (${conflictTarget}) DO NOTHING
      `;
    }

    const params = rows.flat();

    return { query, params };
  }

  /**
   * Optimize search query with full-text search
   */
  static buildSearchQuery(
    table: string,
    searchFields: string[],
    searchTerm: string,
    language: string = 'thai'
  ): { query: string; params: any[] } {
    const searchVector = searchFields.map((f) => `COALESCE("${f}", '')`).join(" || ' ' || ");

    const query = `
      SELECT *, ts_rank(to_tsvector('${language}', ${searchVector}), plainto_tsquery('${language}', $1)) as rank
      FROM "${table}"
      WHERE to_tsvector('${language}', ${searchVector}) @@ plainto_tsquery('${language}', $1)
      ORDER BY rank DESC
    `;

    return { query, params: [searchTerm] };
  }
}

// ============================================
// Export singleton instance
// ============================================

export const poolManager = ConnectionPoolManager.getInstance();
export const prisma = poolManager.getPrisma();

// ============================================
// Graceful shutdown handler
// ============================================

process.on('SIGTERM', async () => {
  console.log('[Connection Pool] SIGTERM received, shutting down gracefully...');
  await poolManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Connection Pool] SIGINT received, shutting down gracefully...');
  await poolManager.shutdown();
  process.exit(0);
});
