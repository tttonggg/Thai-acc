/**
 * Password Security API Routes
 * POST /api/security/password/check - Check password strength
 * POST /api/security/password/change - Change password
 * POST /api/security/password/reset - Reset password (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole, getClientIp } from '@/lib/api-utils'
import { checkPasswordStrength, validatePasswordStrength } from '@/lib/password-validator'
import { changePassword, resetPassword } from '@/lib/auth-full'
import { logSecurityEvent } from '@/lib/audit-service'

// POST - Check password strength or change password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'check') {
      // Check password strength (no auth required)
      const { password } = body
      
      if (!password || typeof password !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Password required' },
          { status: 400 }
        )
      }

      const result = checkPasswordStrength(password)
      
      return NextResponse.json({
        success: true,
        data: {
          score: result.score,
          isStrongEnough: result.isStrongEnough,
          feedback: result.feedback,
          crackTimeDisplay: result.crackTimeDisplay,
        }
      })
    }

    if (action === 'change') {
      // Change password (auth required)
      const user = await requireAuth()
      const { oldPassword, newPassword } = body
      
      if (!oldPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Old and new password required' },
          { status: 400 }
        )
      }

      const result = await changePassword(user.id, oldPassword, newPassword)
      
      if (result.success) {
        const ipAddress = getClientIp(request.headers)
        const userAgent = request.headers.get('user-agent') || 'unknown'
        
        await logSecurityEvent(
          user.id,
          'PASSWORD_RESET',
          { type: 'change' },
          ipAddress,
          userAgent
        )

        return NextResponse.json({
          success: true,
          message: 'Password changed successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
    }

    if (action === 'reset') {
      // Reset password (admin only)
      const admin = await requireRole(['ADMIN'])
      const { userId, newPassword } = body
      
      if (!userId || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'User ID and new password required' },
          { status: 400 }
        )
      }

      try {
        validatePasswordStrength(newPassword)
      } catch (error) {
        return NextResponse.json(
          { success: false, error: error instanceof Error ? error.message : 'Invalid password' },
          { status: 400 }
        )
      }

      const result = await resetPassword(userId, newPassword)
      
      if (result.success) {
        const ipAddress = getClientIp(request.headers)
        const userAgent = request.headers.get('user-agent') || 'unknown'
        
        await logSecurityEvent(
          admin.id,
          'PASSWORD_RESET',
          { type: 'admin_reset', targetUserId: userId },
          ipAddress,
          userAgent
        )

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Password API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
