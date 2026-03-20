/**
 * CSRF (Cross-Site Request Forgery) Protection Service
 * Implements Double Submit Cookie pattern with token rotation
 *
 * NOTE: This file is imported by middleware (Edge Runtime).
 * DO NOT import anything that uses PrismaClient or Node.js APIs.
 */

export const CSRF_TOKEN_LENGTH = 32;
export const CSRF_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
 * Server-only CSRF functions have been moved to csrf-service-server.ts
 * Import them from there for server-side usage:
 *
 * import {
 *   generateCsrfToken,
 *   validateCsrfToken,
 *   peekCsrfToken,
 *   cleanupExpiredTokens,
 *   revokeSessionTokens
 * } from './csrf-service-server';
 */
