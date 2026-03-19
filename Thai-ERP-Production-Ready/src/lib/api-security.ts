/**
 * API Security Utilities
 * CSRF validation, request signing, and security helpers
 */

import { NextRequest } from 'next/server'
import { validateCsrfToken } from './csrf-service-server'
import { verifyTimestampedSignature } from './webhook-service'

/**
 * Validate CSRF token for a request
 * Call this in API routes that require CSRF protection
 */
export async function validateRequestCsrf(req: NextRequest): Promise<{
  valid: boolean
  error?: string
}> {
  const csrfToken = req.headers.get('x-csrf-token') ||
                   req.headers.get('csrf-token') ||
                   req.headers.get('xsrf-token')

  if (!csrfToken) {
    return { valid: false, error: 'CSRF token required' }
  }

  const sessionCookie = req.cookies.get('next-auth.session-token')?.value ||
                       req.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionCookie) {
    return { valid: false, error: 'Session not found' }
  }

  const valid = await validateCsrfToken(csrfToken, sessionCookie)
  
  if (!valid) {
    return { valid: false, error: 'Invalid or expired CSRF token' }
  }

  return { valid: true }
}

/**
 * Verify webhook request signature
 */
export function verifyWebhookRequest(
  req: NextRequest,
  payload: string,
  secret: string
): boolean {
  const signature = req.headers.get('x-webhook-signature')
  if (!signature) return false

  return verifyTimestampedSignature(payload, signature, secret)
}

/**
 * Get client IP address
 */
export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown'
}

/**
 * Security-related response headers
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Check if request is from a trusted origin
 */
export function isTrustedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://localhost:3000',
  ].filter(Boolean)

  if (!origin) return false
  return allowedOrigins.some(allowed => origin.startsWith(allowed || ''))
}

/**
 * Rate limit key generator (IP + user agent fingerprint)
 */
export function generateRateLimitKey(req: NextRequest): string {
  const ip = getClientIp(req)
  const userAgent = req.headers.get('user-agent') || ''
  const fingerprint = userAgent.slice(0, 50) // First 50 chars
  return `${ip}:${fingerprint}`
}

/**
 * Sanitize user input for logging
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .slice(0, 1000) // Limit length
}

/**
 * Parse authorization header
 */
export function parseAuthorizationHeader(
  req: NextRequest
): { type: string; token: string } | null {
  const auth = req.headers.get('authorization')
  if (!auth) return null

  const parts = auth.split(' ')
  if (parts.length !== 2) return null

  return { type: parts[0].toLowerCase(), token: parts[1] }
}

/**
 * Check if request method is safe (read-only)
 */
export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}
