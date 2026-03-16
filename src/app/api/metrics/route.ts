# ============================================
# Prometheus Metrics Endpoint
# ============================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Simple in-memory metrics storage (use Redis in production)
const metrics = {
  httpRequestsTotal: 0,
  httpRequestDuration: [] as number[],
  activeUsers: 0,
  databaseConnections: 0,
};

/**
 * Format metrics for Prometheus
 */
function formatMetrics(): string {
  const timestamp = Date.now();
  const memoryUsage = process.memoryUsage();
  
  return `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.httpRequestsTotal} ${timestamp}

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum ${metrics.httpRequestDuration.reduce((a, b) => a + b, 0)} ${timestamp}
http_request_duration_seconds_count ${metrics.httpRequestDuration.length} ${timestamp}

# HELP nodejs_memory_usage_bytes Memory usage
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed} ${timestamp}
nodejs_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal} ${timestamp}
nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss} ${timestamp}
nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external} ${timestamp}

# HELP process_uptime_seconds Process uptime
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()} ${timestamp}

# HELP database_connections_active Active database connections
# TYPE database_connections_active gauge
database_connections_active ${metrics.databaseConnections} ${timestamp}
`;
}

/**
 * GET handler for Prometheus metrics
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get database connection count
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
    `;
    metrics.databaseConnections = Number(result[0]?.count || 0);
  } catch {
    metrics.databaseConnections = -1;
  }

  const metricsText = formatMetrics();

  return new NextResponse(metricsText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Record HTTP request metrics (called from middleware)
 */
export function recordHttpRequest(duration: number): void {
  metrics.httpRequestsTotal++;
  metrics.httpRequestDuration.push(duration);
  
  // Keep only last 1000 durations
  if (metrics.httpRequestDuration.length > 1000) {
    metrics.httpRequestDuration.shift();
  }
}
