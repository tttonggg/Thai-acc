/**
 * POST /api/portal/auth/login
 * Validates portal credentials and returns session info.
 * Does NOT set NextAuth cookie — portal uses localStorage for SPA auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/portal-auth';
import { logLogin, logFailedLogin } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    // Find user with CUSTOMER_PORTAL role
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'CUSTOMER_PORTAL' || !user.isActive) {
      await logFailedLogin(email, undefined, 'Invalid portal credentials');
      return NextResponse.json({ success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await logFailedLogin(email, user.id, 'Invalid password');
      return NextResponse.json({ success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Get portal account + customer
    const portalAccount = await prisma.customerPortalAccount.findUnique({
      where: { userId: user.id },
      include: { customer: true },
    });

    if (!portalAccount || !portalAccount.isActive) {
      await logFailedLogin(email, user.id, 'Portal account inactive');
      return NextResponse.json({ success: false, error: 'บัญชีพอร์ทัลถูกระงับ กรุณาติดต่อฝ่ายบัญชี' }, { status: 403 });
    }

    // Update last login
    await prisma.customerPortalAccount.update({
      where: { id: portalAccount.id },
      data: { lastLoginAt: new Date() },
    });

    await logLogin(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: portalAccount.customer.name,
        role: user.role,
        customerId: portalAccount.customerId,
        customerName: portalAccount.customer.name,
      },
    });
  } catch (error) {
    console.error('Portal login error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
