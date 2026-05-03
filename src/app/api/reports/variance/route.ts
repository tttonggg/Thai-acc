import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';

// GET - Three-Way Match Variance Report
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    // ThreeWayMatch model does not exist in schema - return empty result
    return NextResponse.json({ success: true, data: [], message: 'ThreeWayMatch not available' });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, message: 'Error fetching variance report' }, { status: 500 });
  }
}
