/**
 * GET /api/auth/mfa/status
 * Check MFA status for current user
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaVerifiedAt: true,
      },
    });

    return Response.json({
      success: true,
      data: {
        enabled: user?.mfaEnabled ?? false,
        verifiedAt: user?.mfaVerifiedAt,
      },
    });
  } catch (error) {
    console.error('MFA status error:', error);
    return Response.json({ success: false, error: 'Failed to get MFA status' }, { status: 500 });
  }
}
