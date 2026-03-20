/**
 * MFA (Multi-Factor Authentication) API Routes
 * POST /api/security/mfa/setup - Setup MFA
 * POST /api/security/mfa/verify - Verify and enable MFA
 * POST /api/security/mfa/disable - Disable MFA
 * GET /api/security/mfa/status - Check MFA status
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { generateMFASetup, verifyAndEnableMFA, disableMFA, isMFAEnabled } from '@/lib/mfa'
import { logSecurityEvent } from '@/lib/audit-service'
import { getClientIp } from '@/lib/api-utils'

// POST - Setup MFA (generate secret and QR code)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const body = await request.json()
    const { action, token } = body

    if (action === 'setup') {
      // Generate MFA setup
      const result = await generateMFASetup(user.id, user.email)
      
      await logSecurityEvent(
        user.id,
        'MFA_SETUP',
        { action: 'initiated' },
        ipAddress,
        userAgent
      )

      return NextResponse.json({
        success: true,
        data: {
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
          otpauthUrl: result.otpauthUrl,
        }
      })
    }

    if (action === 'verify') {
      // Verify token and enable MFA
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Verification token required' },
          { status: 400 }
        )
      }

      const verified = await verifyAndEnableMFA(user.id, token)
      
      if (verified) {
        await logSecurityEvent(
          user.id,
          'MFA_SETUP',
          { action: 'enabled', success: true },
          ipAddress,
          userAgent
        )

        return NextResponse.json({
          success: true,
          message: 'MFA enabled successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code' },
          { status: 400 }
        )
      }
    }

    if (action === 'disable') {
      // Disable MFA
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Verification token required' },
          { status: 400 }
        )
      }

      const disabled = await disableMFA(user.id, token)
      
      if (disabled) {
        await logSecurityEvent(
          user.id,
          'MFA_DISABLE',
          { success: true },
          ipAddress,
          userAgent
        )

        return NextResponse.json({
          success: true,
          message: 'MFA disabled successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('MFA API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Check MFA status
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const enabled = await isMFAEnabled(user.id)
    
    return NextResponse.json({
      success: true,
      data: {
        enabled,
        email: user.email,
      }
    })
  } catch (error: any) {
    console.error('MFA status error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
