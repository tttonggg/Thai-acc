/**
 * CSRF Token API Route
 * GET /api/csrf/token - Generate new CSRF token
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/csrf'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get or create session ID
    const sessionId = request.headers.get('x-session-id') || user.id
    
    const token = await generateCsrfToken(sessionId)
    
    return NextResponse.json({
      success: true,
      data: { token },
    })
  } catch (error: any) {
    console.error('CSRF token error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
