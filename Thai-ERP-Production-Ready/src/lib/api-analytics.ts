/**
 * API Analytics Middleware
 * Phase D: API Mastery - API Analytics
 * 
 * Tracks request metrics:
 * - Request count, latency, errors
 * - Rate limit usage
 * - Endpoint performance
 */

import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// In-memory cache for real-time metrics (last 1000 requests)
const metricsCache: {
  requests: Array<{
    timestamp: number;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    apiVersion: string;
  }>;
  maxSize: number;
} = {
  requests: [],
  maxSize: 10000,
};

/**
 * Track API request in database and cache
 */
export async function trackApiRequest(
  request: NextRequest,
  response: Response,
  duration: number,
  userId?: string
): Promise<void> {
  try {
    const method = request.method;
    const path = new URL(request.url).pathname;
    const statusCode = response.status;
    const apiVersion = extractApiVersion(path);
    const sessionId = request.headers.get('x-session-id') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Add to cache for real-time metrics
    const requestData = {
      timestamp: Date.now(),
      method,
      path,
      statusCode,
      duration,
      userId,
      apiVersion,
    };

    metricsCache.requests.push(requestData);
    if (metricsCache.requests.length > metricsCache.maxSize) {
      metricsCache.requests.shift();
    }

    // Persist to database asynchronously (fire and forget)
    prisma.apiRequestLog.create({
      data: {
        userId,
        sessionId,
        apiVersion,
        method,
        path,
        statusCode,
        duration,
        ipAddress: ipAddress.toString().split(',')[0].trim(),
        userAgent,
        error: statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
      },
    }).catch(err => {
      console.error('Failed to log API request:', err);
    });
  } catch (error) {
    // Analytics should never break the app
    console.error('Error tracking API request:', error);
  }
}

/**
 * Extract API version from path
 */
function extractApiVersion(path: string): string {
  const match = path.match(/^\/api\/(v\d+)/);
  return match ? match[1] : 'v1';
}

/**
 * Get API metrics for the specified time range
 */
export async function getApiMetrics(
  startDate: Date,
  endDate: Date,
  path?: string
) {
  const where = {
    timestamp: { gte: startDate, lte: endDate },
    ...(path && { path }),
  };

  const [
    totalRequests,
    errorRequests,
    avgDuration,
    percentileStats,
    pathStats,
    statusStats,
  ] = await Promise.all([
    prisma.apiRequestLog.count({ where }),
    prisma.apiRequestLog.count({ where: { ...where, statusCode: { gte: 400 } } }),
    prisma.apiRequestLog.aggregate({
      where,
      _avg: { duration: true },
    }),
    getPercentiles(where),
    getPathStats(where),
    getStatusStats(where),
  ]);

  return {
    totalRequests,
    errorRequests,
    errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
    averageDuration: avgDuration._avg.duration || 0,
    percentiles: percentileStats,
    topPaths: pathStats.slice(0, 10),
    statusDistribution: statusStats,
    timeRange: { startDate, endDate },
  };
}

/**
 * Calculate percentiles (p50, p95, p99)
 */
async function getPercentiles(where: any) {
  const logs = await prisma.apiRequestLog.findMany({
    where,
    select: { duration: true },
    orderBy: { duration: 'asc' },
  });

  if (logs.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const durations = logs.map(l => l.duration);
  return {
    p50: calculatePercentile(durations, 0.5),
    p95: calculatePercentile(durations, 0.95),
    p99: calculatePercentile(durations, 0.99),
  };
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  const index = Math.ceil(sortedValues.length * percentile) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Get stats grouped by path
 */
async function getPathStats(where: any) {
  const logs = await prisma.apiRequestLog.groupBy({
    by: ['path'],
    where,
    _count: { id: true },
    _avg: { duration: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return logs.map(log => ({
    path: log.path,
    requestCount: log._count.id,
    averageDuration: log._avg.duration || 0,
  }));
}

/**
 * Get stats grouped by status code
 */
async function getStatusStats(where: any) {
  const logs = await prisma.apiRequestLog.groupBy({
    by: ['statusCode'],
    where,
    _count: { id: true },
  });

  return logs.map(log => ({
    statusCode: log.statusCode,
    count: log._count.id,
  }));
}

/**
 * Get rate limit usage for an identifier
 */
export async function getRateLimitUsage(
  identifier: string,
  windowMinutes: number = 60
): Promise<{
  currentRequests: number;
  windowStart: Date;
  blocked: boolean;
}> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const [currentRequests, latestBlock] = await Promise.all([
    prisma.rateLimitLog.count({
      where: {
        identifier,
        windowStart: { gte: windowStart },
      },
    }),
    prisma.rateLimitLog.findFirst({
      where: {
        identifier,
        blocked: true,
        blockedUntil: { gt: new Date() },
      },
      orderBy: { windowStart: 'desc' },
    }),
  ]);

  return {
    currentRequests,
    windowStart,
    blocked: !!latestBlock,
  };
}

/**
 * Get real-time metrics from cache
 */
export function getRealtimeMetrics(minutes: number = 5) {
  const cutoff = Date.now() - minutes * 60 * 1000;
  const recentRequests = metricsCache.requests.filter(r => r.timestamp >= cutoff);

  if (recentRequests.length === 0) {
    return {
      requestsPerMinute: 0,
      errorRate: 0,
      averageDuration: 0,
      totalRequests: 0,
    };
  }

  const totalRequests = recentRequests.length;
  const errorRequests = recentRequests.filter(r => r.statusCode >= 400).length;
  const totalDuration = recentRequests.reduce((sum, r) => sum + r.duration, 0);

  return {
    requestsPerMinute: totalRequests / minutes,
    errorRate: errorRequests / totalRequests,
    averageDuration: totalDuration / totalRequests,
    totalRequests,
  };
}

/**
 * Record rate limit hit
 */
export async function recordRateLimit(
  identifier: string,
  endpoint: string,
  blocked: boolean = false,
  blockDurationMinutes?: number
): Promise<void> {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0); // Start of current hour

    await prisma.rateLimitLog.upsert({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint,
          windowStart,
        },
      },
      update: {
        requestCount: { increment: 1 },
        ...(blocked && {
          blocked: true,
          blockedUntil: new Date(Date.now() + (blockDurationMinutes || 60) * 60 * 1000),
        }),
      },
      create: {
        identifier,
        endpoint,
        windowStart,
        requestCount: 1,
        blocked,
        ...(blocked && {
          blockedUntil: new Date(Date.now() + (blockDurationMinutes || 60) * 60 * 1000),
        }),
      },
    });
  } catch (error) {
    console.error('Error recording rate limit:', error);
  }
}

/**
 * Get dashboard summary for API analytics
 */
export async function getAnalyticsDashboard() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    lastHour,
    last24Hours,
    last7Days,
    topEndpoints,
    errorBreakdown,
    versionUsage,
  ] = await Promise.all([
    getApiMetrics(oneHourAgo, now),
    getApiMetrics(oneDayAgo, now),
    getApiMetrics(sevenDaysAgo, now),
    getTopEndpoints(10),
    getErrorBreakdown(oneDayAgo, now),
    getVersionUsage(oneDayAgo, now),
  ]);

  return {
    summary: {
      lastHour: {
        requests: lastHour.totalRequests,
        errorRate: lastHour.errorRate,
        avgDuration: lastHour.averageDuration,
      },
      last24Hours: {
        requests: last24Hours.totalRequests,
        errorRate: last24Hours.errorRate,
        avgDuration: last24Hours.averageDuration,
      },
      last7Days: {
        requests: last7Days.totalRequests,
        errorRate: last7Days.errorRate,
        avgDuration: last7Days.averageDuration,
      },
    },
    percentiles: last24Hours.percentiles,
    topEndpoints,
    errorBreakdown,
    versionUsage,
    realtime: getRealtimeMetrics(5),
  };
}

async function getTopEndpoints(limit: number) {
  return prisma.apiRequestLog.groupBy({
    by: ['path', 'method'],
    _count: { id: true },
    _avg: { duration: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
}

async function getErrorBreakdown(startDate: Date, endDate: Date) {
  const errors = await prisma.apiRequestLog.groupBy({
    by: ['statusCode', 'path'],
    where: {
      timestamp: { gte: startDate, lte: endDate },
      statusCode: { gte: 400 },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  });

  return errors.map(e => ({
    statusCode: e.statusCode,
    path: e.path,
    count: e._count.id,
  }));
}

async function getVersionUsage(startDate: Date, endDate: Date) {
  const versions = await prisma.apiRequestLog.groupBy({
    by: ['apiVersion'],
    where: { timestamp: { gte: startDate, lte: endDate } },
    _count: { id: true },
  });

  return versions.map(v => ({
    version: v.apiVersion,
    requests: v._count.id,
  }));
}
