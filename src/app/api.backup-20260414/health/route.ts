/**
 * Health Check API Endpoint
 * Provides health status for the application and its dependencies
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk?: HealthCheck;
    redis?: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

const START_TIME = Date.now();
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'pass',
      responseTime: Date.now() - start,
      message: 'Database connection is healthy',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const heapUsed = used.heapUsed;
  const heapUsedPercent = (heapUsed / total) * 100;

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let message = 'Memory usage is normal';

  if (heapUsedPercent > 90) {
    status = 'fail';
    message = `Critical memory usage: ${heapUsedPercent.toFixed(2)}%`;
  } else if (heapUsedPercent > 75) {
    status = 'warn';
    message = `High memory usage: ${heapUsedPercent.toFixed(2)}%`;
  }

  return {
    status,
    message,
    details: {
      heapUsed: formatBytes(heapUsed),
      heapTotal: formatBytes(total),
      heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
      rss: formatBytes(used.rss),
      external: formatBytes(used.external),
    },
  };
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * GET handler for health check
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const checkReady = searchParams.has('ready');
  const checkLive = searchParams.has('live');

  // Run health checks
  const [databaseCheck, memoryCheck] = await Promise.all([
    checkDatabase(),
    checkMemory(),
  ]);

  // Determine overall status
  const checks = {
    database: databaseCheck,
    memory: memoryCheck,
  };

  const failedChecks = Object.values(checks).filter(c => c.status === 'fail');
  const warningChecks = Object.values(checks).filter(c => c.status === 'warn');

  let status: HealthStatus['status'] = 'healthy';
  if (failedChecks.length > 0) {
    status = 'unhealthy';
  } else if (warningChecks.length > 0) {
    status = 'degraded';
  }

  // For liveness probe - only check if process is running
  if (checkLive) {
    return NextResponse.json(
      { status: 'alive', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }

  // For readiness probe - check if ready to serve traffic
  if (checkReady) {
    if (status === 'unhealthy') {
      return NextResponse.json(
        { status: 'not ready', checks },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { status: 'ready', checks },
      { status: 200 }
    );
  }

  // Full health check response
  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: Date.now() - START_TIME,
    checks,
  };

  const statusCode = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * POST handler for deep health check (authenticated)
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Only allow authenticated admin users for deep health checks
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.role || !['ADMIN', 'DEVOPS'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const health = await GET(request);
  const body = await health.json();

  // Add additional diagnostic information for authenticated requests
  const diagnosticInfo = {
    ...body,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    ppid: process.ppid,
  };

  return NextResponse.json(diagnosticInfo, { status: health.status });
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
