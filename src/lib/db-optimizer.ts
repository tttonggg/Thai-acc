/**
 * Database Query Optimizer
 *
 * Provides utilities to analyze and optimize database queries,
 * detect N+1 problems, and suggest improvements
 */

import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from './performance-monitor';

// ============================================================================
// Query Analysis Types
// ============================================================================

interface QueryAnalysis {
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
  isSlow: boolean;
  recommendations: string[];
}

interface N1Detection {
  path: string;
  model: string;
  queryCount: number;
  expectedQueries: number;
  severity: 'low' | 'medium' | 'high';
  fix: string;
}

// ============================================================================
// Query Analyzer
// ============================================================================

export class QueryOptimizer {
  private prisma: PrismaClient;
  private queryLog: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================================================
  // Query Monitoring
  // ============================================================================

  /**
   * Start monitoring queries for a specific operation
   */
  startMonitoring() {
    const startTime = Date.now();
    const queries: string[] = [];

    const handler = (e: any) => {
      queries.push(e.query);
    };

    (this.prisma.$on as any)('query', handler as any);

    return () => {
      const duration = Date.now() - startTime;
      (this.prisma as any).$off('query', handler);

      return {
        queryCount: queries.length,
        duration,
        queries,
      };
    };
  }

  // ============================================================================
  // Query Analysis
  // ============================================================================

  /**
   * Analyze recent query performance
   */
  analyzeRecentQueries(limit: number = 100): QueryAnalysis[] {
    const queries = performanceMonitor.getQueryMetrics().slice(-limit);

    return queries.map((q) => ({
      model: q.model,
      operation: q.operation,
      duration: q.duration,
      timestamp: q.timestamp,
      isSlow: q.duration > 1000,
      recommendations: this.getRecommendations(q),
    }));
  }

  /**
   * Get optimization recommendations for a query
   */
  private getRecommendations(query: {
    model: string;
    operation: string;
    duration: number;
  }): string[] {
    const recommendations: string[] = [];

    // Slow SELECT queries
    if (query.operation === 'SELECT' && query.duration > 1000) {
      recommendations.push('Consider adding an index on filtered columns');
      recommendations.push('Use select() to fetch only required fields');
      recommendations.push('Consider using cursor-based pagination for large result sets');
    }

    // Multiple COUNT queries
    if (query.operation === 'COUNT' && query.duration > 500) {
      recommendations.push('Cache count results when possible');
      recommendations.push('Consider using materialized views for frequent counts');
    }

    // UPDATE/DELETE operations
    if ((query.operation === 'UPDATE' || query.operation === 'DELETE') && query.duration > 1000) {
      recommendations.push('Ensure the WHERE clause uses indexed columns');
      recommendations.push('Consider batch operations for multiple records');
    }

    return recommendations;
  }

  // ============================================================================
  // N+1 Detection
  // ============================================================================

  /**
   * Detect potential N+1 query problems
   */
  detectN1Problems(): N1Detection[] {
    const problems: N1Detection[] = [];
    const queries = performanceMonitor.getQueryMetrics();

    // Group queries by model and operation
    const queryGroups = new Map<string, number>();

    queries.forEach((q) => {
      const key = `${q.model}.${q.operation}`;
      queryGroups.set(key, (queryGroups.get(key) || 0) + 1);
    });

    // Detect patterns
    queryGroups.forEach((count, key) => {
      const [model, operation] = key.split('.');

      // More than 10 similar queries might indicate N+1
      if (count > 10 && operation === 'SELECT') {
        problems.push({
          path: `/${model.toLowerCase()}`,
          model,
          queryCount: count,
          expectedQueries: Math.ceil(count / 10), // Rough estimate
          severity: count > 50 ? 'high' : count > 20 ? 'medium' : 'low',
          fix: `Use include() or select() to fetch related ${model} records in a single query`,
        });
      }
    });

    return problems;
  }

  // ============================================================================
  // Index Suggestions
  // ============================================================================

  /**
   * Suggest indexes based on query patterns
   */
  suggestIndexes(): Array<{
    table: string;
    column: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      table: string;
      column: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    const queries = performanceMonitor.getQueryMetrics();

    // Analyze WHERE clauses
    const whereColumns = new Map<string, number>();

    queries.forEach((q) => {
      if (q.operation === 'SELECT') {
        // This is a simplified check
        // In production, you'd parse the actual query SQL
        const likelyWhereColumns = this.extractWhereColumns(q.model);
        likelyWhereColumns.forEach((col) => {
          const key = `${q.model}.${col}`;
          whereColumns.set(key, (whereColumns.get(key) || 0) + 1);
        });
      }
    });

    // Suggest indexes for frequently filtered columns
    whereColumns.forEach((count, key) => {
      const [table, column] = key.split('.');

      if (count > 50) {
        suggestions.push({
          table,
          column,
          reason: `Used in WHERE clause ${count} times`,
          priority: 'high',
        });
      } else if (count > 20) {
        suggestions.push({
          table,
          column,
          reason: `Used in WHERE clause ${count} times`,
          priority: 'medium',
        });
      }
    });

    return suggestions;
  }

  /**
   * Extract likely WHERE columns from model name
   */
  private extractWhereColumns(model: string): string[] {
    const commonFilters: Record<string, string[]> = {
      User: ['roleId', 'isActive', 'email'],
      Customer: ['companyId', 'isActive'],
      Vendor: ['companyId', 'isActive'],
      Invoice: ['customerId', 'status', 'invoiceDate'],
      Receipt: ['customerId', 'receiptDate'],
      Payment: ['vendorId', 'paymentDate'],
      JournalEntry: ['date', 'companyId'],
      ChartOfAccount: ['type', 'isActive', 'parentId'],
    };

    return commonFilters[model] || ['id', 'createdAt'];
  }

  // ============================================================================
  // Performance Optimization Functions
  // ============================================================================

  /**
   * Optimize a query by adding select/include hints
   */
  optimizeQuery<T>(
    query: any,
    options: {
      select?: string[];
      include?: string[];
      orderBy?: string;
      limit?: number;
    }
  ): any {
    let optimizedQuery = query;

    // Add select to fetch only required fields
    if (options.select && options.select.length > 0) {
      const selectObject = options.select.reduce((obj, field) => {
        obj[field] = true;
        return obj;
      }, {} as any);

      optimizedQuery = optimizedQuery.select(selectObject);
    }

    // Add include for related data (prevents N+1)
    if (options.include && options.include.length > 0) {
      const includeObject = options.include.reduce((obj, relation) => {
        obj[relation] = true;
        return obj;
      }, {} as any);

      optimizedQuery = optimizedQuery.include(includeObject);
    }

    // Add ordering
    if (options.orderBy) {
      optimizedQuery = optimizedQuery.orderBy({
        [options.orderBy]: 'asc',
      });
    }

    // Add limit
    if (options.limit) {
      optimizedQuery = optimizedQuery.take(options.limit);
    }

    return optimizedQuery;
  }

  /**
   * Batch query execution to reduce round trips
   */
  async batchQuery<T>(queries: Array<Promise<T>>, batchSize: number = 10): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  }

  // ============================================================================
  // Caching Helpers
  // ============================================================================

  /**
   * Simple in-memory cache for query results
   */
  private cache = new Map<string, { data: any; expiry: number }>();

  /**
   * Get cached result
   */
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache with TTL
   */
  setCached(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Execute query with caching
   */
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.getCached<T>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await queryFn();
    this.setCached(key, result, ttlSeconds);

    return result;
  }

  // ============================================================================
  // Connection Pooling
  // ============================================================================

  /**
   * Check connection pool status
   */
  async getConnectionStatus() {
    // For PostgreSQL
    try {
      const result = await this.prisma.$queryRaw`
        SELECT
          count(*) as connections,
          state
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      return result;
    } catch (error) {
      return null;
    }
  }

  // ============================================================================
  // Report Generation
  // ============================================================================

  /**
   * Generate optimization report
   */
  generateReport() {
    const n1Problems = this.detectN1Problems();
    const indexSuggestions = this.suggestIndexes();
    const slowQueries = this.analyzeRecentQueries(50).filter((q) => q.isSlow);

    return {
      n1Problems: {
        count: n1Problems.length,
        problems: n1Problems.slice(0, 10),
      },
      indexSuggestions: {
        count: indexSuggestions.length,
        suggestions: indexSuggestions.slice(0, 10),
      },
      slowQueries: {
        count: slowQueries.length,
        queries: slowQueries.slice(0, 10),
      },
      summary: {
        totalIssues: n1Problems.length + indexSuggestions.length,
        highPriority:
          n1Problems.filter((p) => p.severity === 'high').length +
          indexSuggestions.filter((s) => s.priority === 'high').length,
      },
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

let optimizerInstance: QueryOptimizer | null = null;

export function getOptimizer(prisma: PrismaClient): QueryOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new QueryOptimizer(prisma);
  }
  return optimizerInstance;
}
