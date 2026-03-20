/**
 * API Analytics Endpoint
 * Phase D: API Mastery - API Analytics
 * 
 * Endpoints:
 * - GET /api/admin/analytics - Get API metrics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getMetrics,
  getRecentRequests,
  getSlowRequests,
  getErrorRequests,
  getVersionUsage,
  TimeRange,
} from '@/lib/services/analytics-service';

// GET /api/admin/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') as TimeRange) || '24h';
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview': {
        const metrics = await getMetrics(range);
        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }

      case 'recent': {
        const limit = parseInt(searchParams.get('limit') || '100');
        const requests = await getRecentRequests(limit);
        return NextResponse.json({
          success: true,
          data: requests,
        });
      }

      case 'slow': {
        const threshold = parseInt(searchParams.get('threshold') || '1000');
        const limit = parseInt(searchParams.get('limit') || '50');
        const requests = await getSlowRequests(threshold, limit);
        return NextResponse.json({
          success: true,
          data: requests,
        });
      }

      case 'errors': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const requests = await getErrorRequests(limit);
        return NextResponse.json({
          success: true,
          data: requests,
        });
      }

      case 'versions': {
        const usage = await getVersionUsage();
        return NextResponse.json({
          success: true,
          data: usage,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error fetching analytics:', error);

    // Check for auth errors first
    if (error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    if (error?.statusCode === 403) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
