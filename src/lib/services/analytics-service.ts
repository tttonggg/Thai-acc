/**
 * API Analytics Service for Thai Accounting ERP
 * Phase D: API Mastery - API Analytics
 * 
 * Features:
 * - Request logging
 * - Metrics calculation (p50, p95, p99)
 * - Error rate tracking
 * - Top users/paths analysis
 */

import { prisma } from '@/lib/db';

// Request log data
interface RequestLogData {
  userId?: string;
  sessionId?: string;
  apiVersion: string;
  method: string;
  path: string;
  query?: string;
  statusCode: number;
  duration: number;
  ipAddress: string;
  userAgent?: string;
  error?: string;
}

// Metrics result
interface ApiMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  errorRate: number;
  averageDuration: number;
  p50: number;
  p95: number;
  p99: number;
  topUsers: Array<{
    userId: string | null;
    userName: string | null;
    requestCount: number;
  }>;
  topPaths: Array<{
    path: string;
    requestCount: number;
    averageDuration: number;
    errorRate: number;
  }>;
  statusCodes: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
}

// Time range options
export type TimeRange = '1h' | '24h' | '7d' | '30d';

/**
 * Get start date based on time range
 */
function getStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

/**
 * Log API request
 */
export async function logRequest(data: RequestLogData): Promise<void> {
  try {
    await prisma.apiRequestLog.create({
      data: {
        timestamp: new Date(),
        userId: data.userId,
        sessionId: data.sessionId,
        apiVersion: data.apiVersion,
        method: data.method,
        path: data.path,
        query: data.query,
        statusCode: data.statusCode,
        duration: Math.round(data.duration),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        error: data.error,
      },
    });
  } catch (error) {
    // Don't throw errors from logging - it shouldn't break the API
    console.error('Failed to log API request:', error);
  }
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Get API metrics for a time range
 */
export async function getMetrics(range: TimeRange = '24h'): Promise<ApiMetrics> {
  const startDate = getStartDate(range);
  const hours = range === '1h' ? 1 : range === '24h' ? 24 : range === '7d' ? 168 : 720;

  // Get all logs in range
  const logs = await prisma.apiRequestLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    select: {
      userId: true,
      method: true,
      path: true,
      statusCode: true,
      duration: true,
      timestamp: true,
    },
  });

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      averageDuration: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      topUsers: [],
      topPaths: [],
      statusCodes: [],
      hourlyDistribution: [],
    };
  }

  // Calculate basic metrics
  const totalRequests = logs.length;
  const errorRequests = logs.filter(l => l.statusCode >= 400).length;
  const durations = logs.map(l => l.duration).sort((a, b) => a - b);
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  // Calculate percentiles
  const p50 = calculatePercentile(durations, 50);
  const p95 = calculatePercentile(durations, 95);
  const p99 = calculatePercentile(durations, 99);

  // Top users
  const userCounts = new Map<string | null, number>();
  for (const log of logs) {
    const count = userCounts.get(log.userId) || 0;
    userCounts.set(log.userId, count + 1);
  }

  // Fetch user names for top users
  const userIds = Array.from(userCounts.keys()).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map(u => [u.id, u.name || u.email]));

  const topUsers = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, requestCount]) => ({
      userId,
      userName: userId ? userMap.get(userId) || userId : 'Anonymous',
      requestCount,
    }));

  // Top paths with error rates
  const pathStats = new Map<string, { count: number; duration: number; errors: number }>();
  for (const log of logs) {
    const stats = pathStats.get(log.path) || { count: 0, duration: 0, errors: 0 };
    stats.count++;
    stats.duration += log.duration;
    if (log.statusCode >= 400) stats.errors++;
    pathStats.set(log.path, stats);
  }

  const topPaths = Array.from(pathStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([path, stats]) => ({
      path,
      requestCount: stats.count,
      averageDuration: Math.round(stats.duration / stats.count),
      errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
    }));

  // Status code distribution
  const statusCounts = new Map<number, number>();
  for (const log of logs) {
    const count = statusCounts.get(log.statusCode) || 0;
    statusCounts.set(log.statusCode, count + 1);
  }

  const statusCodes = Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([statusCode, count]) => ({
      statusCode,
      count,
      percentage: count / totalRequests,
    }));

  // Hourly distribution
  const hourlyCounts = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourlyCounts.set(i, 0);
  }
  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    const count = hourlyCounts.get(hour) || 0;
    hourlyCounts.set(hour, count + 1);
  }

  const hourlyDistribution = Array.from(hourlyCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ hour, count }));

  return {
    totalRequests,
    requestsPerMinute: totalRequests / (hours * 60),
    errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
    averageDuration: Math.round(totalDuration / totalRequests),
    p50,
    p95,
    p99,
    topUsers,
    topPaths,
    statusCodes,
    hourlyDistribution,
  };
}

/**
 * Get recent API requests
 */
export async function getRecentRequests(limit: number = 100, offset: number = 0) {
  return prisma.apiRequestLog.findMany({
    orderBy: { timestamp: 'desc' },
    skip: offset,
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get slow requests (duration > threshold)
 */
export async function getSlowRequests(threshold: number = 1000, limit: number = 50) {
  return prisma.apiRequestLog.findMany({
    where: {
      duration: {
        gt: threshold,
      },
    },
    orderBy: { duration: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get error requests
 */
export async function getErrorRequests(limit: number = 50) {
  return prisma.apiRequestLog.findMany({
    where: {
      statusCode: {
        gte: 400,
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get API usage by version
 */
export async function getVersionUsage() {
  const logs = await prisma.apiRequestLog.groupBy({
    by: ['apiVersion'],
    _count: {
      apiVersion: true,
    },
    orderBy: {
      _count: {
        apiVersion: 'desc',
      },
    },
  });

  return logs.map(l => ({
    version: l.apiVersion,
    requestCount: l._count.apiVersion,
  }));
}

/**
 * Clean up old request logs
 */
export async function cleanupOldLogs(days: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return prisma.apiRequestLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });
}

/**
 * Get request count for a specific endpoint
 */
export async function getEndpointStats(path: string, range: TimeRange = '24h') {
  const startDate = getStartDate(range);

  const [total, errors, avgDuration] = await Promise.all([
    prisma.apiRequestLog.count({
      where: {
        path,
        timestamp: { gte: startDate },
      },
    }),
    prisma.apiRequestLog.count({
      where: {
        path,
        timestamp: { gte: startDate },
        statusCode: { gte: 400 },
      },
    }),
    prisma.apiRequestLog.aggregate({
      where: {
        path,
        timestamp: { gte: startDate },
      },
      _avg: {
        duration: true,
      },
    }),
  ]);

  return {
    path,
    totalRequests: total,
    errorCount: errors,
    errorRate: total > 0 ? errors / total : 0,
    averageDuration: Math.round(avgDuration._avg.duration || 0),
  };
}

/**
 * Export analytics data
 */
export async function exportAnalytics(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
) {
  const logs = await prisma.apiRequestLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'asc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (format === 'csv') {
    const headers = [
      'timestamp',
      'method',
      'path',
      'statusCode',
      'duration',
      'user',
      'ipAddress',
    ];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.method,
      log.path,
      log.statusCode,
      log.duration,
      log.user?.name || log.user?.email || 'Anonymous',
      log.ipAddress,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  return JSON.stringify(logs, null, 2);
}
