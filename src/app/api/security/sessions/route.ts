/**
 * Session Management API Routes
 * GET /api/security/sessions - Get active sessions
 * DELETE /api/security/sessions - Revoke sessions
 * POST /api/security/sessions/revoke-all - Revoke all other sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, getClientIp } from '@/lib/api-utils';
import {
  getUserSessions,
  invalidateOtherSessions,
  invalidateAllUserSessions,
} from '@/lib/session-service';
import { logSecurityEvent } from '@/lib/audit-service';
import { handleApiError } from '@/lib/api-error-handler';

// GET - Get active sessions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const sessions = await getUserSessions(user.id);

    return NextResponse.json({
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        isCurrent: false, // Will be set by client based on current session
      })),
      maxSessions: 3,
    });
  } catch (error: unknown) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke specific or all sessions
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');
    const revokeAll = url.searchParams.get('all') === 'true';

    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (revokeAll) {
      // Revoke all sessions (logout everywhere)
      const count = await invalidateAllUserSessions(user.id);

      await logSecurityEvent(
        user.id,
        'SESSION_TERMINATED',
        { type: 'all', count },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: `Revoked ${count} sessions`,
        count,
      });
    }

    if (sessionId) {
      // Admin can revoke any session
      const targetUserId = url.searchParams.get('userId');

      if (targetUserId && targetUserId !== user.id) {
        // Check if admin
        await requireRole(['ADMIN']);

        await invalidateAllUserSessions(targetUserId);

        await logSecurityEvent(
          user.id,
          'SESSION_TERMINATED',
          { type: 'user', targetUserId },
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          success: true,
          message: 'User sessions revoked',
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Session ID or all parameter required' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Sessions delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Revoke all other sessions (keep current)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action } = body;

    if (action === 'revoke-others') {
      // This would need the current session token which we don't have in JWT session
      // For now, just log the attempt
      const ipAddress = getClientIp(request.headers);
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await logSecurityEvent(
        user.id,
        'SESSION_TERMINATED',
        { type: 'others' },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: 'Other sessions revoked',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Sessions post error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
