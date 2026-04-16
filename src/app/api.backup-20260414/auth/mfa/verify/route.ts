/**
 * POST /api/auth/mfa/verify
 * Verify TOTP token and enable MFA
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyAndEnableMFA, generateBackupCodes } from '@/lib/mfa-service'
import { createHash } from '@/lib/encryption-service'
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

    const body = await req.json()
    
    if (!body.token || !/^\d{6}$/.test(body.token)) {
      return Response.json(
        { success: false, error: 'Invalid token format. Must be 6 digits.' },
        { status: 400 }
      )
    }

    const verified = await verifyAndEnableMFA(session.user.id, body.token)

    if (!verified) {
      return Response.json(
        { success: false, error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      )
    }

    const backupCodes = generateBackupCodes(10)
    const hashedCodes = backupCodes.map(code => createHash(code))

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    await logSecurityEvent(
      session.user.id,
      'MFA_SETUP',
      { method: 'TOTP' },
      ipAddress,
      userAgent
    )

    return Response.json({
      success: true,
      data: {
        message: 'MFA enabled successfully',
        backupCodes,
      },
    })
  } catch (error) {
    console.error('MFA verify error:', error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify MFA'
      },
      { status: 500 }
    )
  }
}
