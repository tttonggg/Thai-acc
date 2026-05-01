/**
 * API Analytics Middleware for Thai Accounting ERP
 * Phase D: API Mastery - API Analytics
 *
 * Tracks all API requests for analytics dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/services/analytics-service';

/**
 * Analytics middleware wrapper for API routes
 */
export function withAnalytics(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    // Get request details
    const url = new URL(req.url);
    const apiVersion = url.pathname.match(/\/api\/(v\d+)\//)?.[1] || 'v1';

    // Execute handler
    const response = await handler(req);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Get user info from headers (set by auth middleware)
    const userId = req.headers.get('x-user-id') || undefined;
    const sessionId = req.headers.get('x-session-id') || undefined;

    // Get client info
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Log request asynchronously (don't wait)
    logRequest({
      userId,
      sessionId,
      apiVersion,
      method: req.method,
      path: url.pathname,
      query: url.searchParams.toString() || undefined,
      statusCode: response.status,
      duration,
      ipAddress: ipAddress.toString().split(',')[0].trim(),
      userAgent,
      error: response.status >= 400 ? await getErrorMessage(response) : undefined,
    }).catch((err) => {
      console.error('Analytics logging error:', err);
    });

    return response;
  };
}

/**
 * Extract error message from response
 */
async function getErrorMessage(response: NextResponse): Promise<string | undefined> {
  try {
    const clone = response.clone();
    const body = await clone.json();
    return body.error || body.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

/**
 * Higher-order function to wrap API route handlers with analytics
 * Usage:
 * export const GET = withAnalyticsHandler(async (req) => {
 *   // Your handler code
 * });
 */
export function withAnalyticsHandler(
  handler: (req: NextRequest, context: { params: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: any }): Promise<NextResponse> => {
    const startTime = Date.now();

    // Get request details
    const url = new URL(req.url);
    const apiVersion = url.pathname.match(/\/api\/(v\d+)\//)?.[1] || 'v1';

    // Execute handler
    const response = await handler(req, context);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Get user info from headers (set by auth middleware)
    const userId = req.headers.get('x-user-id') || undefined;
    const sessionId = req.headers.get('x-session-id') || undefined;

    // Get client info
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Log request asynchronously (don't wait)
    logRequest({
      userId,
      sessionId,
      apiVersion,
      method: req.method,
      path: url.pathname,
      query: url.searchParams.toString() || undefined,
      statusCode: response.status,
      duration,
      ipAddress: ipAddress.toString().split(',')[0].trim(),
      userAgent,
      error: response.status >= 400 ? await getErrorMessage(response) : undefined,
    }).catch((err) => {
      console.error('Analytics logging error:', err);
    });

    return response;
  };
}

/**
 * Analytics wrapper for Next.js App Router
 * Use this to wrap your route handlers
 */
export function createAnalyticsWrapper() {
  const requests = new Map<
    string,
    {
      count: number;
      totalDuration: number;
      errors: number;
    }
  >();

  return {
    track(path: string, duration: number, statusCode: number) {
      const key = `${path}:${Math.floor(Date.now() / 60000)}`; // Track per minute
      const current = requests.get(key) || { count: 0, totalDuration: 0, errors: 0 };
      current.count++;
      current.totalDuration += duration;
      if (statusCode >= 400) current.errors++;
      requests.set(key, current);
    },

    getMetrics(path?: string) {
      const now = Math.floor(Date.now() / 60000);
      const relevant = Array.from(requests.entries())
        .filter(([key]) => !path || key.startsWith(path))
        .filter(([key]) => {
          const minute = parseInt(key.split(':')[1] || '0');
          return now - minute < 60; // Last hour
        });

      const total = relevant.reduce((sum, [, data]) => sum + data.count, 0);
      const errors = relevant.reduce((sum, [, data]) => sum + data.errors, 0);
      const duration = relevant.reduce((sum, [, data]) => sum + data.totalDuration, 0);

      return {
        totalRequests: total,
        errorRate: total > 0 ? errors / total : 0,
        averageDuration: total > 0 ? duration / total : 0,
      };
    },

    clear() {
      requests.clear();
    },
  };
}
