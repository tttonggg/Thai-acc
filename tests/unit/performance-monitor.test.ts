/**
 * Unit Tests for Performance Monitor
 * Tests for src/lib/performance-monitor.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  performanceMonitor,
  withPerformanceTracking,
  trackQuery,
  generatePerformanceReport,
  checkPerformanceHealth,
} from '../../src/lib/performance-monitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  describe('Request Tracking', () => {
    it('should start and end request timing', () => {
      const startTime = performanceMonitor.startRequest();
      expect(typeof startTime).toBe('number');

      // Simulate some work
      const duration = performanceMonitor.endRequest(
        startTime,
        '/api/test',
        'GET',
        200
      );

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should track request metrics', () => {
      const startTime = performanceMonitor.startRequest();
      performanceMonitor.endRequest(startTime, '/api/users', 'GET', 200);

      const stats = performanceMonitor.getRequestStats('/api/users');

      expect(stats).toBeDefined();
      expect(stats?.count).toBe(1);
      expect(stats?.avg).toBeGreaterThan(0);
    });

    it('should track multiple requests', () => {
      for (let i = 0; i < 5; i++) {
        const startTime = performanceMonitor.startRequest();
        performanceMonitor.endRequest(startTime, '/api/products', 'GET', 200);
      }

      const stats = performanceMonitor.getRequestStats('/api/products');

      expect(stats?.count).toBe(5);
    });

    it('should calculate statistics correctly', () => {
      const durations = [100, 200, 300, 400, 500];

      durations.forEach((duration) => {
        performanceMonitor.endRequest(
          Date.now() - duration,
          '/api/stats',
          'GET',
          200
        );
      });

      const stats = performanceMonitor.getRequestStats('/api/stats');

      expect(stats?.count).toBe(5);
      expect(stats?.avg).toBe(300);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(500);
    });

    it('should handle paths with same prefix', () => {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/users/123',
        'GET',
        200
      );
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/users/456',
        'GET',
        200
      );

      const stats = performanceMonitor.getRequestStats('/api/users');

      expect(stats?.count).toBe(2);
    });

    it('should return null for paths with no metrics', () => {
      const stats = performanceMonitor.getRequestStats('/nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('Query Tracking', () => {
    it('should track query performance', () => {
      performanceMonitor.trackQuery('User', 'findMany', 150);

      const queries = performanceMonitor.getQueryMetrics();

      expect(queries).toHaveLength(1);
      expect(queries[0].model).toBe('User');
      expect(queries[0].operation).toBe('FINDMANY');
      expect(queries[0].duration).toBe(150);
    });

    it('should track multiple queries', () => {
      performanceMonitor.trackQuery('User', 'findMany', 100);
      performanceMonitor.trackQuery('Invoice', 'findFirst', 200);
      performanceMonitor.trackQuery('User', 'create', 150);

      const queries = performanceMonitor.getQueryMetrics();

      expect(queries).toHaveLength(3);
    });

    it('should limit query metrics to 1000', () => {
      for (let i = 0; i < 1100; i++) {
        performanceMonitor.trackQuery('User', 'findMany', i);
      }

      const queries = performanceMonitor.getQueryMetrics();

      expect(queries.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Slow Request Detection', () => {
    it('should identify slow requests (>3s)', () => {
      const startTime = performanceMonitor.startRequest();
      performanceMonitor.endRequest(
        startTime - 3500,
        '/api/slow',
        'GET',
        200
      );

      const slowRequests = performanceMonitor.getSlowRequests();

      expect(slowRequests).toHaveLength(1);
      expect(slowRequests[0].duration).toBeGreaterThan(3000);
    });

    it('should identify fast requests', () => {
      const startTime = performanceMonitor.startRequest();
      performanceMonitor.endRequest(startTime - 100, '/api/fast', 'GET', 200);

      const slowRequests = performanceMonitor.getSlowRequests();

      expect(slowRequests).toHaveLength(0);
    });

    it('should use custom threshold', () => {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest() - 2000,
        '/api/custom',
        'GET',
        200
      );

      const slowRequests = performanceMonitor.getSlowRequests(1500);

      expect(slowRequests).toHaveLength(1);
    });
  });

  describe('Slow Query Detection', () => {
    it('should identify slow queries (>1s)', () => {
      performanceMonitor.trackQuery('User', 'findMany', 1500);

      const slowQueries = performanceMonitor.getSlowQueries();

      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].duration).toBeGreaterThan(1000);
    });

    it('should identify fast queries', () => {
      performanceMonitor.trackQuery('User', 'findMany', 100);

      const slowQueries = performanceMonitor.getSlowQueries();

      expect(slowQueries).toHaveLength(0);
    });
  });

  describe('Top Slow Paths', () => {
    beforeEach(() => {
      // Track some requests with different durations
      const paths = [
        { path: '/api/slow1', duration: 5000, count: 2 },
        { path: '/api/slow2', duration: 4000, count: 3 },
        { path: '/api/slow3', duration: 3000, count: 1 },
        { path: '/api/fast', duration: 100, count: 10 },
      ];

      paths.forEach(({ path, duration, count }) => {
        for (let i = 0; i < count; i++) {
          performanceMonitor.endRequest(
            performanceMonitor.startRequest() - duration,
            path,
            'GET',
            200
          );
        }
      });
    });

    it('should get top slow paths by average duration', () => {
      const topPaths = performanceMonitor.getTopSlowPaths(5);

      expect(topPaths).toHaveLength(4);
      expect(topPaths[0].path).toBe('/api/slow1');
      expect(topPaths[0].avgDuration).toBe(5000);
    });

    it('should limit results', () => {
      const topPaths = performanceMonitor.getTopSlowPaths(2);

      expect(topPaths).toHaveLength(2);
    });

    it('should include count in results', () => {
      const topPaths = performanceMonitor.getTopSlowPaths();

      topPaths.forEach((path) => {
        expect(path).toHaveProperty('path');
        expect(path).toHaveProperty('avgDuration');
        expect(path).toHaveProperty('count');
      });
    });
  });

  describe('Metrics Management', () => {
    it('should clear all metrics', () => {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/test',
        'GET',
        200
      );

      performanceMonitor.clear();

      expect(performanceMonitor.getRequestStats('/api/test')).toBeNull();
      expect(performanceMonitor.getQueryMetrics()).toHaveLength(0);
    });

    it('should get copy of metrics', () => {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/test',
        'GET',
        200
      );

      const metrics = performanceMonitor.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics).not.toBe(performanceMonitor['metrics']); // Different reference
    });

    it('should limit metrics to 1000', () => {
      for (let i = 0; i < 1100; i++) {
        performanceMonitor.endRequest(
          performanceMonitor.startRequest(),
          `/api/test/${i}`,
          'GET',
          200
        );
      }

      const metrics = performanceMonitor.getMetrics();

      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });
});

describe('withPerformanceTracking', () => {
  it('should add X-Response-Time header', async () => {
    const handler = async () => {
      return NextResponse.json({ success: true });
    };

    const wrappedHandler = withPerformanceTracking(handler);
    const request = new Request('http://localhost:3000/api/test');

    const response = await wrappedHandler(request);

    expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
  });

  it('should track successful requests', async () => {
    const handler = async () => {
      return NextResponse.json({ success: true });
    };

    const wrappedHandler = withPerformanceTracking(handler, {
      path: '/api/wrapped',
    });

    await wrappedHandler(new Request('http://localhost:3000/api/wrapped'));

    const stats = performanceMonitor.getRequestStats('/api/wrapped');

    expect(stats?.count).toBe(1);
  });

  it('should track failed requests', async () => {
    const handler = async () => {
      throw new Error('Test error');
    };

    const wrappedHandler = withPerformanceTracking(handler, {
      path: '/api/error',
    });

    try {
      await wrappedHandler(
        new Request('http://localhost:3000/api/error')
      );
    } catch (error) {
      // Expected to throw
    }

    const stats = performanceMonitor.getRequestStats('/api/error');

    expect(stats?.count).toBe(1);
  });

  it('should use custom path from options', async () => {
    const handler = async () => {
      return NextResponse.json({ success: true });
    };

    const wrappedHandler = withPerformanceTracking(handler, {
      path: '/api/custom',
    });

    await wrappedHandler(
      new Request('http://localhost:3000/api/different')
    );

    const stats = performanceMonitor.getRequestStats('/api/custom');

    expect(stats?.count).toBe(1);
  });
});

describe('trackQuery', () => {
  it('should track query execution time', async () => {
    const mockQuery = new Promise((resolve) =>
      setTimeout(() => resolve('result'), 100)
    );

    const result = await trackQuery('User', 'findMany', mockQuery);

    expect(result).toBe('result');

    const queries = performanceMonitor.getQueryMetrics();
    expect(queries).toHaveLength(1);
    expect(queries[0].model).toBe('User');
    expect(queries[0].operation).toBe('FINDMANY');
    expect(queries[0].duration).toBeGreaterThanOrEqual(100);
  });

  it('should track failed queries', async () => {
    const mockQuery = Promise.reject(new Error('Query failed'));

    await expect(
      trackQuery('User', 'findMany', mockQuery)
    ).rejects.toThrow('Query failed');

    const queries = performanceMonitor.getQueryMetrics();
    expect(queries).toHaveLength(1);
  });

  it('should be usable with Prisma queries', async () => {
    // Mock Prisma query
    const mockPrismaQuery = Promise.resolve([
      { id: '1', name: 'Test' },
      { id: '2', name: 'Test 2' },
    ]);

    const users = await trackQuery('User', 'findMany', mockPrismaQuery);

    expect(users).toHaveLength(2);
  });
});

describe('generatePerformanceReport', () => {
  beforeEach(() => {
    // Add some test data
    for (let i = 0; i < 10; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest() - (i * 100 + 100),
        '/api/test',
        'GET',
        200
      );
    }

    performanceMonitor.trackQuery('User', 'findMany', 150);
    performanceMonitor.trackQuery('Invoice', 'findFirst', 1200);
  });

  it('should generate complete report', () => {
    const report = generatePerformanceReport();

    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('slowRequests');
    expect(report).toHaveProperty('slowQueries');
    expect(report).toHaveProperty('topSlowPaths');
  });

  it('should include summary statistics', () => {
    const report = generatePerformanceReport();

    expect(report.summary).toBeDefined();
    expect(report.summary?.count).toBe(10);
  });

  it('should include slow queries', () => {
    const report = generatePerformanceReport();

    expect(report.slowQueries.count).toBeGreaterThan(0);
    expect(report.slowQueries.queries).toBeInstanceOf(Array);
  });

  it('should include top slow paths', () => {
    const report = generatePerformanceReport();

    expect(report.topSlowPaths).toBeInstanceOf(Array);
  });
});

describe('checkPerformanceHealth', () => {
  it('should return healthy for good performance', () => {
    performanceMonitor.endRequest(
      performanceMonitor.startRequest() - 100,
      '/api/fast',
      'GET',
      200
    );

    const health = checkPerformanceHealth();

    expect(health.status).toBe('healthy');
    expect(health.avgResponseTime).toBeDefined();
  });

  it('should return warning for degraded performance', () => {
    for (let i = 0; i < 5; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest() - 2500,
        '/api/slow',
        'GET',
        200
      );
    }

    const health = checkPerformanceHealth();

    expect(health.status).toBe('warning');
  });

  it('should return critical for poor performance', () => {
    for (let i = 0; i < 5; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest() - 5500,
        '/api/critical',
        'GET',
        200
      );
    }

    const health = checkPerformanceHealth();

    expect(health.status).toBe('critical');
  });

  it('should return unknown when no metrics', () => {
    performanceMonitor.clear();

    const health = checkPerformanceHealth();

    expect(health.status).toBe('unknown');
    expect(health.message).toBe('No metrics available');
  });
});

describe('Percentile Calculations', () => {
  beforeEach(() => {
    // Add requests with known durations for percentile testing
    const durations = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

    durations.forEach((duration) => {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest() - duration,
        '/api/percentile',
        'GET',
        200
      );
    });
  });

  it('should calculate P50 correctly', () => {
    const stats = performanceMonitor.getRequestStats('/api/percentile');

    // Median of 10 values should be around 500-600
    expect(stats?.p50).toBeGreaterThanOrEqual(500);
    expect(stats?.p50).toBeLessThanOrEqual(600);
  });

  it('should calculate P95 correctly', () => {
    const stats = performanceMonitor.getRequestStats('/api/percentile');

    // 95th percentile should be close to max
    expect(stats?.p95).toBeGreaterThan(800);
  });

  it('should calculate P99 correctly', () => {
    const stats = performanceMonitor.getRequestStats('/api/percentile');

    // 99th percentile should be at or near max
    expect(stats?.p99).toBeGreaterThanOrEqual(900);
  });
});

describe('Success Rate Calculation', () => {
  it('should calculate 100% success rate', () => {
    for (let i = 0; i < 10; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/success',
        'GET',
        200
      );
    }

    const stats = performanceMonitor.getRequestStats('/api/success');

    expect(stats?.successRate).toBe(100);
  });

  it('should calculate mixed success rate', () => {
    for (let i = 0; i < 7; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/mixed',
        'GET',
        i < 5 ? 200 : 500
      );
    }

    const stats = performanceMonitor.getRequestStats('/api/mixed');

    expect(stats?.successRate).toBeCloseTo(71.43, 1);
  });

  it('should calculate 0% success rate', () => {
    for (let i = 0; i < 5; i++) {
      performanceMonitor.endRequest(
        performanceMonitor.startRequest(),
        '/api/fail',
        'GET',
        500
      );
    }

    const stats = performanceMonitor.getRequestStats('/api/fail');

    expect(stats?.successRate).toBe(0);
  });
});
