/**
 * Thai Accounting ERP - Query Performance Monitor
 * โปรแกรมบัญชีมาตรฐานไทย - เครื่องมือตรวจสอบประสิทธิภาพ Query
 * Version: 2.0 - Database Perfection Phase
 */

import { prisma } from './connection-pool';

// ============================================
// Query Performance Types
// ============================================

interface QueryPerformanceMetrics {
  operation: string;
  duration: number;
  rowsAffected: number;
  query: string;
  timestamp: Date;
  slow: boolean;
}

interface SlowQueryReport {
  query: string;
  avgDuration: number;
  maxDuration: number;
  callCount: number;
  lastCalled: Date;
}

interface NPlusOneWarning {
  model: string;
  operation: string;
  parentQuery: string;
  childQueries: number;
  suggestedFix: string;
}

// ============================================
// Query Monitor Class
// ============================================

export class QueryMonitor {
  private static instance: QueryMonitor;
  private queryLog: QueryPerformanceMetrics[] = [];
  private maxLogSize: number = 1000;
  private slowQueryThreshold: number = 500; // ms
  private enabled: boolean = true;

  private constructor() {
    this.setupQueryLogging();
  }

  static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor();
    }
    return QueryMonitor.instance;
  }

  private setupQueryLogging() {
    // Prisma middleware is set up in connection-pool.ts
    // This class receives data through the logQuery method
  }

  logQuery(metrics: QueryPerformanceMetrics) {
    if (!this.enabled) return;

    this.queryLog.push(metrics);

    // Keep log size manageable
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize);
    }

    // Log slow queries immediately in production
    if (metrics.slow && process.env.NODE_ENV === 'production') {
      console.warn(`[SLOW QUERY] ${metrics.operation}: ${metrics.duration}ms`);
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  setSlowQueryThreshold(ms: number) {
    this.slowQueryThreshold = ms;
  }

  // ============================================
  // Analysis Methods
  // ============================================

  /**
   * Get all slow queries
   */
  getSlowQueries(): QueryPerformanceMetrics[] {
    return this.queryLog.filter((q) => q.slow);
  }

  /**
   * Get query statistics by operation
   */
  getQueryStats(): Map<string, { count: number; avgDuration: number; maxDuration: number }> {
    const stats = new Map();

    for (const query of this.queryLog) {
      const existing = stats.get(query.operation);
      if (existing) {
        existing.count++;
        existing.totalDuration += query.duration;
        existing.avgDuration = existing.totalDuration / existing.count;
        existing.maxDuration = Math.max(existing.maxDuration, query.duration);
      } else {
        stats.set(query.operation, {
          count: 1,
          totalDuration: query.duration,
          avgDuration: query.duration,
          maxDuration: query.duration,
        });
      }
    }

    return stats;
  }

  /**
   * Detect N+1 query patterns
   */
  detectNPlusOne(): NPlusOneWarning[] {
    const warnings: NPlusOneWarning[] = [];
    const modelAccesses = new Map<string, number>();

    // Group queries by timestamp window (within 1 second)
    const timeWindows = this.groupQueriesByTimeWindow(1000);

    for (const window of timeWindows) {
      const modelCounts = new Map<string, { count: number; queries: string[] }>();

      for (const query of window) {
        const model = query.operation.split('.')[0];
        const existing = modelCounts.get(model);
        if (existing) {
          existing.count++;
          existing.queries.push(query.operation);
        } else {
          modelCounts.set(model, { count: 1, queries: [query.operation] });
        }
      }

      // Check for patterns that suggest N+1
      for (const [model, data] of modelCounts) {
        if (data.count > 5 && data.queries.every((q) => q.includes('findUnique'))) {
          warnings.push({
            model,
            operation: 'findUnique',
            parentQuery: window[0]?.operation || 'unknown',
            childQueries: data.count,
            suggestedFix: `Use include/select to fetch ${model} in parent query`,
          });
        }
      }
    }

    return warnings;
  }

  private groupQueriesByTimeWindow(windowMs: number): QueryPerformanceMetrics[][] {
    const windows: QueryPerformanceMetrics[][] = [];
    let currentWindow: QueryPerformanceMetrics[] = [];
    let windowStart = 0;

    for (const query of this.queryLog) {
      const queryTime = query.timestamp.getTime();

      if (windowStart === 0 || queryTime - windowStart > windowMs) {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [query];
        windowStart = queryTime;
      } else {
        currentWindow.push(query);
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getQueryStats();
    const slowQueries = this.getSlowQueries();
    const nPlusOne = this.detectNPlusOne();

    let report = '=== Query Performance Report ===\n\n';

    // Summary
    report += `Total Queries: ${this.queryLog.length}\n`;
    report += `Slow Queries (>${this.slowQueryThreshold}ms): ${slowQueries.length}\n`;
    report += `N+1 Patterns Detected: ${nPlusOne.length}\n\n`;

    // Top slow operations
    report += '=== Slowest Operations ===\n';
    const sortedStats = Array.from(stats.entries())
      .sort((a, b) => b[1].maxDuration - a[1].maxDuration)
      .slice(0, 10);

    for (const [operation, data] of sortedStats) {
      report += `${operation.padEnd(40)} avg: ${data.avgDuration.toFixed(1)}ms max: ${data.maxDuration}ms calls: ${data.count}\n`;
    }

    // N+1 warnings
    if (nPlusOne.length > 0) {
      report += '\n=== N+1 Query Warnings ===\n';
      for (const warning of nPlusOne) {
        report += `Model: ${warning.model}\n`;
        report += `  ${warning.childQueries} queries detected\n`;
        report += `  Fix: ${warning.suggestedFix}\n\n`;
      }
    }

    return report;
  }

  /**
   * Clear query log
   */
  clearLog() {
    this.queryLog = [];
  }
}

// ============================================
// Query Optimization Helpers
// ============================================

export class QueryOptimizer {
  /**
   * Wrap a query with timing and logging
   */
  static async measure<T>(operation: string, queryFn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const monitor = QueryMonitor.getInstance();

    try {
      const result = await queryFn();
      const duration = Date.now() - start;

      monitor.logQuery({
        operation,
        duration,
        rowsAffected: Array.isArray(result) ? result.length : 1,
        query: operation,
        timestamp: new Date(),
        slow: duration > 500,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      monitor.logQuery({
        operation,
        duration,
        rowsAffected: 0,
        query: operation,
        timestamp: new Date(),
        slow: false,
      });
      throw error;
    }
  }

  /**
   * Optimize query with proper includes
   */
  static withIncludes<T>(baseQuery: any, includes: Record<string, boolean | object>): T {
    return baseQuery.include(includes);
  }

  /**
   * Add select to reduce data transfer
   */
  static withSelect<T>(baseQuery: any, select: Record<string, boolean>): T {
    return baseQuery.select(select);
  }

  /**
   * Batch load related records to avoid N+1
   */
  static async batchLoad<T extends { id: string }, R extends { parentId: string }>(
    parentIds: string[],
    loadFn: (ids: string[]) => Promise<R[]>,
    mapFn: (record: R) => string // returns parentId
  ): Promise<Map<string, R[]>> {
    const records = await loadFn(parentIds);
    const result = new Map<string, R[]>();

    for (const record of records) {
      const parentId = mapFn(record);
      const existing = result.get(parentId) || [];
      existing.push(record);
      result.set(parentId, existing);
    }

    return result;
  }
}

// ============================================
// Database Performance Tests
// ============================================

export class PerformanceTests {
  /**
   * Test query performance for common operations
   */
  static async runCommonQueryTests(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    // Test 1: Customer list with invoices
    results.customerWithInvoices = await this.timeQuery(async () => {
      return prisma.customer.findMany({
        take: 100,
        include: {
          invoices: {
            where: { status: { in: ['ISSUED', 'PARTIAL'] } },
            select: { id: true, totalAmount: true },
          },
        },
      });
    });

    // Test 2: Trial balance query
    results.trialBalance = await this.timeQuery(async () => {
      return prisma.journalLine.groupBy({
        by: ['accountId'],
        _sum: { debit: true, credit: true },
        where: {
          entry: { status: 'POSTED' },
        },
      });
    });

    // Test 3: Recent invoices with customer
    results.recentInvoices = await this.timeQuery(async () => {
      return prisma.invoice.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, code: true } },
          lines: { take: 5 },
        },
      });
    });

    // Test 4: Stock balance query
    results.stockBalance = await this.timeQuery(async () => {
      return prisma.stockBalance.findMany({
        take: 100,
        include: {
          product: { select: { name: true, code: true } },
          warehouse: { select: { name: true } },
        },
      });
    });

    // Test 5: AR aging query
    results.arAging = await this.timeQuery(async () => {
      return prisma.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'PARTIAL'] },
          deletedAt: null,
        },
        select: {
          id: true,
          dueDate: true,
          netAmount: true,
          paidAmount: true,
          customer: { select: { name: true } },
        },
      });
    });

    return results;
  }

  private static async timeQuery<T>(fn: () => Promise<T>): Promise<number> {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  }

  /**
   * Benchmark report queries
   */
  static async benchmarkReports(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    // Monthly sales report
    results.monthlySales = await this.timeQuery(async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      return prisma.invoice.groupBy({
        by: ['invoiceDate'],
        _sum: { totalAmount: true },
        where: {
          invoiceDate: { gte: startDate },
          status: { in: ['ISSUED', 'PARTIAL', 'PAID'] },
        },
      });
    });

    // Top products report
    results.topProducts = await this.timeQuery(async () => {
      return prisma.invoiceLine.groupBy({
        by: ['productId'],
        _sum: { quantity: true, amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 20,
      });
    });

    // Customer balance report
    results.customerBalances = await this.timeQuery(async () => {
      return prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          creditLimit: true,
          _count: { invoices: true },
          invoices: {
            where: { status: { in: ['ISSUED', 'PARTIAL'] } },
            select: { netAmount: true, paidAmount: true },
          },
        },
      });
    });

    return results;
  }
}

// ============================================
// Export singleton
// ============================================

export const queryMonitor = QueryMonitor.getInstance();

// ============================================
// Express middleware for query monitoring (optional)
// ============================================

export function queryMonitoringMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    const monitor = QueryMonitor.getInstance();

    res.on('finish', () => {
      const duration = Date.now() - start;

      // Log API endpoint performance
      monitor.logQuery({
        operation: `API:${req.method}:${req.path}`,
        duration,
        rowsAffected: 0,
        query: `${req.method} ${req.path}`,
        timestamp: new Date(),
        slow: duration > 1000,
      });
    });

    next();
  };
}
