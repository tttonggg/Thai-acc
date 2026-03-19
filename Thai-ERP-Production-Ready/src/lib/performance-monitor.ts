/**
 * Performance Monitoring for API Routes
 *
 * Tracks request/response times, database query performance,
 * and identifies bottlenecks in the application
 */

import { NextResponse } from 'next/server';

// ============================================================================
// Performance Metrics
// ============================================================================

interface MetricData {
  path: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
}

interface QueryMetrics {
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
}

// ============================================================================
// Performance Monitor Class
// ============================================================================

class PerformanceMonitor {
  private metrics: MetricData[] = [];
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private slowRequestThreshold: number = 3000; // 3 seconds
  private maxMetrics: number = 1000;

  // ============================================================================
  // Request Tracking
  // ============================================================================

  startRequest(): number {
    return Date.now();
  }

  endRequest(
    startTime: number,
    path: string,
    method: string,
    statusCode: number
  ): number {
    const duration = Date.now() - startTime;

    // Safely get memory usage only in Node.js server environment
    // Not available in: Edge Runtime, Client Components, Browser
    let memoryUsage: NodeJS.MemoryUsage | undefined;
    try {
      // Check for Node.js environment (not Edge, not browser)
      if (typeof process !== 'undefined' &&
          process.versions &&
          process.versions.node &&
          typeof process.memoryUsage === 'function') {
        memoryUsage = process.memoryUsage();
      }
    } catch {
      // memoryUsage not available in this environment
      memoryUsage = undefined;
    }

    const metric: MetricData = {
      path,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
      memoryUsage,
    };

    this.addMetric(metric);

    // Log slow requests
    if (duration > this.slowRequestThreshold) {
      console.warn(
        `[Performance] Slow Request: ${method} ${path} - ${duration}ms (> ${this.slowRequestThreshold}ms)`
      );
    }

    return duration;
  }

  // ============================================================================
  // Query Tracking
  // ============================================================================

  trackQuery(model: string, operation: string, duration: number): void {
    const metric: QueryMetrics = {
      model,
      operation,
      duration,
      timestamp: new Date(),
    };

    this.queryMetrics.push(metric);

    // Keep only last 1000 queries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(
        `[Performance] Slow Query: ${model}.${operation} - ${duration}ms (> ${this.slowQueryThreshold}ms)`
      );
    }
  }

  // ============================================================================
  // Metric Management
  // ============================================================================

  private addMetric(metric: MetricData): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  // ============================================================================
  // Statistics & Reporting
  // ============================================================================

  getRequestStats(path?: string) {
    let filteredMetrics = this.metrics;

    if (path) {
      filteredMetrics = this.metrics.filter(
        (m) => m.path === path || m.path.startsWith(path)
      );
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map((m) => m.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    return {
      count: filteredMetrics.length,
      avg: this.average(durations),
      min: sortedDurations[0],
      max: sortedDurations[sortedDurations.length - 1],
      p50: sortedDurations[Math.floor(sortedDurations.length * 0.5)],
      p95: sortedDurations[Math.floor(sortedDurations.length * 0.95)],
      p99: sortedDurations[Math.floor(sortedDurations.length * 0.99)],
      successRate:
        (filteredMetrics.filter((m) => m.statusCode < 400).length /
          filteredMetrics.length) *
        100,
    };
  }

  getSlowRequests(threshold?: number): MetricData[] {
    const ms = threshold || this.slowRequestThreshold;
    return this.metrics.filter((m) => m.duration > ms);
  }

  getSlowQueries(threshold?: number): QueryMetrics[] {
    const ms = threshold || this.slowQueryThreshold;
    return this.queryMetrics.filter((m) => m.duration > ms);
  }

  getTopSlowPaths(limit: number = 10): Array<{
    path: string;
    avgDuration: number;
    count: number;
  }> {
    const pathMap = new Map<
      string,
      { totalDuration: number; count: number }
    >();

    this.metrics.forEach((m) => {
      const existing = pathMap.get(m.path) || {
        totalDuration: 0,
        count: 0,
      };
      pathMap.set(m.path, {
        totalDuration: existing.totalDuration + m.duration,
        count: existing.count + 1,
      });
    });

    return Array.from(pathMap.entries())
      .map(([path, data]) => ({
        path,
        avgDuration: data.totalDuration / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  clear(): void {
    this.metrics = [];
    this.queryMetrics = [];
  }

  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  getQueryMetrics(): QueryMetrics[] {
    return [...this.queryMetrics];
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// Request Timing Wrapper
// ============================================================================

/**
 * Wraps an API route handler with performance tracking
 *
 * @example
 * ```typescript
 * export const GET = withPerformanceTracking(async (req) => {
 *   const data = await prisma.user.findMany();
 *   return NextResponse.json({ success: true, data });
 * });
 * ```
 */
export function withPerformanceTracking<T>(
  handler: (req: Request) => Promise<NextResponse>,
  options?: {
    path?: string;
    logSlowRequests?: boolean;
  }
) {
  return async (req: Request): Promise<NextResponse> => {
    const url = new URL(req.url);
    const path = options?.path || url.pathname;

    const startTime = performanceMonitor.startRequest();

    try {
      const response = await handler(req);

      // Extract status code from response
      const statusCode = response.status;
      performanceMonitor.endRequest(startTime, path, req.method, statusCode);

      // Add performance headers
      const duration = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    } catch (error) {
      performanceMonitor.endRequest(startTime, path, req.method, 500);
      throw error;
    }
  };
}

// ============================================================================
// Query Timing Wrapper
// ============================================================================

/**
 * Wraps a database query with performance tracking
 *
 * @example
 * ```typescript
 * const users = await trackQuery(
 *   'User',
 *   'findMany',
 *   prisma.user.findMany()
 * );
 * ```
 */
export async function trackQuery<T>(
  model: string,
  operation: string,
  query: Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await query;
    const duration = Date.now() - startTime;

    performanceMonitor.trackQuery(model, operation, duration);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery(model, operation, duration);
    throw error;
  }
}

// ============================================================================
// Performance Reporter
// ============================================================================

export function generatePerformanceReport() {
  const stats = performanceMonitor.getRequestStats();
  const slowRequests = performanceMonitor.getSlowRequests();
  const slowQueries = performanceMonitor.getSlowQueries();
  const topPaths = performanceMonitor.getTopSlowPaths();

  return {
    summary: stats,
    slowRequests: {
      count: slowRequests.length,
      requests: slowRequests.slice(0, 20).map((r) => ({
        path: r.path,
        method: r.method,
        duration: r.duration,
        statusCode: r.statusCode,
        timestamp: r.timestamp,
      })),
    },
    slowQueries: {
      count: slowQueries.length,
      queries: slowQueries.slice(0, 20).map((q) => ({
        model: q.model,
        operation: q.operation,
        duration: q.duration,
        timestamp: q.timestamp,
      })),
    },
    topSlowPaths: topPaths,
  };
}

// ============================================================================
// Performance Health Check
// ============================================================================

export function checkPerformanceHealth() {
  const stats = performanceMonitor.getRequestStats();
  const slowRequests = performanceMonitor.getSlowRequests();

  if (!stats) {
    return { status: 'unknown', message: 'No metrics available' };
  }

  const avgResponseTime = stats.avg;
  const p95ResponseTime = stats.p95;

  if (p95ResponseTime > 5000) {
    return {
      status: 'critical',
      message: 'P95 response time > 5s',
      avgResponseTime,
      p95ResponseTime,
    };
  }

  if (avgResponseTime > 2000) {
    return {
      status: 'warning',
      message: 'Average response time > 2s',
      avgResponseTime,
      p95ResponseTime,
    };
  }

  return {
    status: 'healthy',
    message: 'Performance is good',
    avgResponseTime,
    p95ResponseTime,
  };
}
