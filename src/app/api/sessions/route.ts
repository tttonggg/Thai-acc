/**
 * GET /api/sessions
 * Get all active sessions for current user
 *
 * DELETE /api/sessions
 * Invalidate specific or all sessions
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserSessions,
  invalidateSession,
  invalidateOtherSessions,
  invalidateAllUserSessions,
} from '@/lib/session-service';
import { logSecurityEvent } from '@/lib/audit-logger';

// GET - List active sessions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getUserSessions(session.user.id);

    return Response.json({
      success: true,
      data: sessions,
    });
  } catch (error: unknown) {
    console.error('Get sessions error:', error);
    return Response.json({ success: false, error: 'Failed to get sessions' }, { status: 500 });
  }
}

// DELETE - Invalidate sessions
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, allExceptCurrent, all } = body;

    let invalidatedCount = 0;

    if (all) {
      // Invalidate all sessions (logout everywhere)
      invalidatedCount = await invalidateAllUserSessions(session.user.id);

      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      await logSecurityEvent(
        session.user.id,
        'SESSION_TERMINATED',
        { scope: 'all', count: invalidatedCount },
        ipAddress,
        userAgent
      );
    } else if (allExceptCurrent && sessionId) {
      // Invalidate all except current
      invalidatedCount = await invalidateOtherSessions(session.user.id, sessionId);

      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      await logSecurityEvent(
        session.user.id,
        'SESSION_TERMINATED',
        { scope: 'others', count: invalidatedCount },
        ipAddress,
        userAgent
      );
    } else if (sessionId) {
      // Invalidate specific session
      await invalidateSession(sessionId);
      invalidatedCount = 1;
    } else {
      return Response.json(
        { success: false, error: 'sessionId, allExceptCurrent, or all parameter required' },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      data: {
        message: 'Sessions invalidated successfully',
        count: invalidatedCount,
      },
    });
  } catch (error: unknown) {
    console.error('Delete sessions error:', error);
    return Response.json(
      { success: false, error: 'Failed to invalidate sessions' },
      { status: 500 }
    );
  }
}
