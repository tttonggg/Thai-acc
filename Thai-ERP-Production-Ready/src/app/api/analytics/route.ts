/**
 * API Analytics Dashboard Endpoint
 * Phase D: API Mastery - API Analytics
 * 
 * Endpoints:
 * - GET /api/analytics - Get analytics dashboard data
 * - GET /api/analytics?path=/api/invoices - Get metrics for specific path
 * - GET /api/analytics?startDate=2024-01-01&endDate=2024-01-31 - Custom date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getApiMetrics, getAnalyticsDashboard, getRateLimitUsage } from '@/lib/api-analytics';

// GET /api/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    // Check authentication - only ADMIN and ACCOUNTANT can access analytics
    const session = await auth();
    if (!session?.user || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const view = searchParams.get('view') || 'dashboard'; // dashboard, realtime, ratelimits

    // Real-time metrics
    if (view === 'realtime') {
      const { getRealtimeMetrics } = await import('@/lib/api-analytics');
      return NextResponse.json({
        success: true,
        data: getRealtimeMetrics(5),
      });
    }

    // Rate limit usage
    if (view === 'ratelimits') {
      const identifier = searchParams.get('identifier');
      if (!identifier) {
        return NextResponse.json(
          { error: 'identifier required' },
          { status: 400 }
        );
      }
      const usage = await getRateLimitUsage(identifier);
      return NextResponse.json({
        success: true,
        data: usage,
      });
    }

    // Custom date range metrics
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const metrics = await getApiMetrics(startDate, endDate, path);
      return NextResponse.json({
        success: true,
        data: metrics,
      });
    }

    // Default: dashboard view
    const dashboard = await getAnalyticsDashboard();
    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
