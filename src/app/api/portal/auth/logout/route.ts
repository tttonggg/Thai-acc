/**
 * POST /api/portal/auth/logout
 * Portal logout — client clears localStorage token.
 * Optionally accepts customerId to update lastLoginAt here.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Portal uses localStorage — server just acknowledges the logout.
    // Client is responsible for clearing token from localStorage.
    // If we wanted to invalidate server-side, we'd need a token blacklist.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Portal logout error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
