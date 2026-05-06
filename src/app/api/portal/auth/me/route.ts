/**
 * POST /api/portal/auth/me
 * Get current portal user + customer info from stored session token.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();

    if (!user?.customerId) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch (error) {
    console.error('Portal /me error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
