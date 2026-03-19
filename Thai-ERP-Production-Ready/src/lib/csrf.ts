/**
 * CSRF (Cross-Site Request Forgery) Protection Service
 * Implements Double Submit Cookie pattern with token rotation
 */

import { prisma } from './db';
import { generateSecureToken } from './encryption';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
 */
export async function validateCsrfToken(
  token: string,
  sessionId: string
): Promise<boolean> {
  if (!token || !sessionId) return false;

  const csrfToken = await prisma.csrfToken.findUnique({
    where: { token },
  });

  if (!csrfToken) return false;
  if (csrfToken.used) return false;
  if (csrfToken.sessionId !== sessionId) return false;
  if (csrfToken.expiresAt < new Date()) return false;

  // Mark token as used (single-use for sensitive operations)
  await prisma.csrfToken.update({
    where: { id: csrfToken.id },
    data: { used: true },
  });

  return true;
}

/**
 * Validate CSRF token without marking as used
 * Use for non-critical operations
 */
export async function peekCsrfToken(
  token: string,
  sessionId: string
): Promise<boolean> {
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
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
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

// HTTP methods that require CSRF protection
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Paths that are exempt from CSRF protection
export const CSRF_EXEMPT_PATHS = [
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/csrf/token',
  '/api/webhooks/', // Webhooks use HMAC signatures
];

/**
 * Check if a request path is CSRF exempt
 */
export function isCsrfExemptPath(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exemptPath => 
    path.startsWith(exemptPath) || path === exemptPath
  );
}

/**
 * Get CSRF token from request headers
 */
export function getCsrfTokenFromHeaders(headers: Headers): string | null {
  // Check custom header first (preferred)
  const customHeader = headers.get('x-csrf-token');
  if (customHeader) return customHeader;

  // Check standard header
  const standardHeader = headers.get('csrf-token');
  if (standardHeader) return standardHeader;

  // Check XSRF-Token (Angular/Axios convention)
  const xsrfHeader = headers.get('xsrf-token');
  if (xsrfHeader) return xsrfHeader;

  return null;
}

/**
 * Middleware helper to validate CSRF for API routes
 */
export async function validateCsrfForRequest(
  request: Request,
  sessionId: string
): Promise<{ valid: boolean; error?: string }> {
  const method = request.method.toUpperCase();
  
  // Skip for safe methods
  if (!CSRF_PROTECTED_METHODS.includes(method)) {
    return { valid: true };
  }

  // Skip for exempt paths
  const url = new URL(request.url);
  if (isCsrfExemptPath(url.pathname)) {
    return { valid: true };
  }

  // Get and validate token
  const token = getCsrfTokenFromHeaders(request.headers);
  if (!token) {
    return { valid: false, error: 'CSRF token missing' };
  }

  const valid = await validateCsrfToken(token, sessionId);
  if (!valid) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }

  return { valid: true };
}

/**
 * Create a CSRF token cookie string
 */
export function createCsrfCookie(token: string): string {
  const expires = new Date(Date.now() + CSRF_TOKEN_EXPIRY_MS);
  return `csrf-token=${token}; Expires=${expires.toUTCString()}; Path=/; HttpOnly; SameSite=Strict`;
}
