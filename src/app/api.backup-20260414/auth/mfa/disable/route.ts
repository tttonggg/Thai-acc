/**
 * POST /api/auth/mfa/disable
 * Disable MFA for a user (requires TOTP verification)
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { disableMFA } from '@/lib/mfa-service'
import { logSecurityEvent } from '@/lib/audit-logger'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { token } = await req.json()
    
    if (!token || !/^\d{6}$/.test(token)) {
      return Response.json(
        { success: false, error: 'Valid 6-digit TOTP token required' },
        { status: 400 }
      )
    }

    const disabled = await disableMFA(session.user.id, token)

    if (!disabled) {
      return Response.json(
        { success: false, error: 'Invalid verification code. MFA not disabled.' },
        { status: 400 }
      )
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    await logSecurityEvent(
      session.user.id,
      'MFA_DISABLE',
      {},
      ipAddress,
      userAgent
    )

    return Response.json({
      success: true,
      data: { message: 'MFA disabled successfully' },
    })
  } catch (error) {
    console.error('MFA disable error:', error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to disable MFA'
      },
      { status: 500 }
    )
  }
}
