/**
 * CSRF Service - Server-only functions
 * These functions require PrismaClient and can only run on the server.
 * Do NOT import this file in middleware or client components.
 */

import { prisma } from './db';
import { generateSecureToken } from './encryption-service';
import {
  CSRF_TOKEN_LENGTH,
  CSRF_TOKEN_EXPIRY_MS,
  CSRF_PROTECTED_METHODS,
  CSRF_EXEMPT_PATHS,
  isCsrfExemptPath,
  getCsrfTokenFromHeaders,
} from './csrf-service';

// Re-export edge-compatible functions for convenience
export {
  CSRF_TOKEN_LENGTH,
  CSRF_TOKEN_EXPIRY_MS,
  CSRF_PROTECTED_METHODS,
  CSRF_EXEMPT_PATHS,
  isCsrfExemptPath,
  getCsrfTokenFromHeaders,
};

/**
 * Generate a new CSRF token
 */
export async function generateCsrfToken(sessionId: string): Promise<string> {
  // Clean up expired tokens first
  await cleanupExpiredTokens();

  const token = generateSecureToken(CSRF_TOKEN_LENGTH);

  await prisma.csrfToken.create({
    data: {
      token,
      sessionId,
      expiresAt: new Date(Date.now() + CSRF_TOKEN_EXPIRY_MS),
    },
  });

  return token;
}

/**
 * Validate CSRF token
 * Marks token as used after validation (one-time use)
 */
export async function validateCsrfToken(token: string, sessionId: string): Promise<boolean> {
  if (!token || !sessionId) return false;

  const csrfToken = await prisma.csrfToken.findUnique({
    where: { token },
  });

  if (!csrfToken) return false;
  if (csrfToken.used) return false;
  if (csrfToken.sessionId !== sessionId) return false;
  if (csrfToken.expiresAt < new Date()) return false;

  // Mark as used
  await prisma.csrfToken.update({
    where: { token },
    data: { used: true },
  });

  return true;
}

/**
 * Validate CSRF token without marking as used
 * Use for non-critical operations
 */
export async function peekCsrfToken(token: string, sessionId: string): Promise<boolean> {
  if (!token || !sessionId) return false;

  const csrfToken = await prisma.csrfToken.findUnique({
    where: { token },
  });

  if (!csrfToken) return false;
  if (csrfToken.used) return false;
  if (csrfToken.sessionId !== sessionId) return false;
  if (csrfToken.expiresAt < new Date()) return false;

  return true;
}

/**
 * Clean up expired CSRF tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.csrfToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
    },
  });

  return result.count;
}

/**
 * Revoke all CSRF tokens for a session
 */
export async function revokeSessionTokens(sessionId: string): Promise<void> {
  await prisma.csrfToken.deleteMany({
    where: { sessionId },
  });
}
