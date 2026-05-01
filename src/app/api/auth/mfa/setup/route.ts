/**
 * POST /api/auth/mfa/setup
 * Generate MFA secret and QR code for setup
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateMFASetup } from '@/lib/mfa-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await generateMFASetup(session.user.id, session.user.email);

    return Response.json({
      success: true,
      data: {
        qrCodeUrl: result.qrCodeUrl,
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
      },
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup MFA',
      },
      { status: 500 }
    );
  }
}
