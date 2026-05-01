/**
 * Session Management Service
 * Handles concurrent session limiting and session rotation
 */

import { prisma } from './db';
import { generateSecureToken } from './encryption-service';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const ROTATION_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

export interface SessionInfo {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * Create a new session for a user
 * Enforces concurrent session limits
 */
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<string> {
  // Get user's max sessions limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { maxSessions: true },
  });

  const maxSessions = user?.maxSessions ?? 3;

  // Clean up expired sessions first
  await cleanupExpiredSessions(userId);

  // Count active sessions
  const activeSessions = await prisma.userSession.count({
    where: {
      userId,
      isValid: true,
      expiresAt: { gt: new Date() },
    },
  });

  // If at limit, invalidate oldest session
  if (activeSessions >= maxSessions) {
    const oldestSession = await prisma.userSession.findFirst({
      where: {
        userId,
        isValid: true,
      },
      orderBy: { lastActiveAt: 'asc' },
    });

    if (oldestSession) {
      await prisma.userSession.update({
        where: { id: oldestSession.id },
        data: { isValid: false },
      });
    }
  }

  // Create new session
  const sessionToken = generateSecureToken(48);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
      isValid: true,
    },
  });

  return sessionToken;
}

/**
 * Validate and update a session
 */
export async function validateSession(
  sessionToken: string
): Promise<{ valid: boolean; userId?: string; rotated?: boolean; newToken?: string }> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return { valid: false };
  }

  if (!session.isValid) {
    return { valid: false };
  }

  if (session.expiresAt < new Date()) {
    return { valid: false };
  }

  // Update last active timestamp
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  });

  return { valid: true, userId: session.userId };
}

/**
 * Rotate session token (for privilege escalation or security events)
 * Returns new token while maintaining session continuity
 */
export async function rotateSession(
  oldToken: string,
  reason?: string
): Promise<{ success: boolean; newToken?: string }> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken: oldToken },
  });

  if (!session || !session.isValid) {
    return { success: false };
  }

  // Generate new token
  const newToken = generateSecureToken(48);
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // Update session with new token
  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      sessionToken: newToken,
      expiresAt: newExpiresAt,
      rotatedFrom: oldToken,
      lastActiveAt: new Date(),
    },
  });

  // Log rotation event
  const { logSecurityEvent } = await import('./audit-logger');
  await logSecurityEvent(
    session.userId,
    'SESSION_TERMINATED',
    { reason: reason || 'Session rotation', rotatedTo: newToken.slice(0, 8) + '...' },
    session.ipAddress,
    session.userAgent
  );

  return { success: true, newToken };
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { sessionToken },
    data: { isValid: false },
  });
}

/**
 * Invalidate all sessions for a user except current
 */
export async function invalidateOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      sessionToken: { not: currentSessionToken },
      isValid: true,
    },
    data: { isValid: false },
  });

  return result.count;
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      isValid: true,
    },
    data: { isValid: false },
  });

  return result.count;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  await cleanupExpiredSessions(userId);

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      isValid: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
  });

  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt,
  }));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(userId?: string): Promise<number> {
  const where: Record<string, unknown> = {
    expiresAt: { lt: new Date() },
  };

  if (userId) {
    where.userId = userId;
  }

  const result = await prisma.userSession.deleteMany({ where });
  return result.count;
}

/**
 * Extend session duration
 */
export async function extendSession(
  sessionToken: string,
  additionalMs: number = SESSION_DURATION_MS
): Promise<boolean> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
  });

  if (!session || !session.isValid) {
    return false;
  }

  const currentExpiry = session.expiresAt.getTime();
  const newExpiry = Math.max(currentExpiry, Date.now()) + additionalMs;

  await prisma.userSession.update({
    where: { id: session.id },
    data: { expiresAt: new Date(newExpiry) },
  });

  return true;
}

/**
 * Check if session should be rotated (security best practice)
 */
export async function shouldRotateSession(sessionToken: string): Promise<boolean> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
  });

  if (!session) return false;

  // Rotate if session is more than 1 hour old
  const sessionAge = Date.now() - session.createdAt.getTime();
  const rotationThreshold = 60 * 60 * 1000; // 1 hour

  return sessionAge > rotationThreshold;
}
