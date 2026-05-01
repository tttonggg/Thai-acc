/**
 * CSRF Token API Route
 * GET /api/csrf/token - Generate new CSRF token
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // CSRF token generation requires authentication
    // This ensures tokens are only issued to valid sessions
    const user = await requireAuth();

    // Get or create session ID - use user.id as fallback
    // This allows the token to work even if session cookies are lost
    const sessionId = request.headers.get('x-session-id') || user.id;

    // Generate CSRF token bound to this session
    const token = await generateCsrfToken(sessionId);

    return NextResponse.json({
      success: true,
      data: { token },
    });
  } catch (error: any) {
    // Auth errors should return 401, not 500
    if (error?.message?.includes('ไม่ได้รับอนุญาต') || error?.message?.includes('Unauthorized')) {
      console.warn('CSRF token request - unauthenticated:', error.message);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('CSRF token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
