import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, rateLimitPresets } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bypass rate limiting for local development
  const isLocalDev = request.headers.get('host')?.includes('localhost:3000')
  if (isLocalDev) {
    return NextResponse.next() // Skip all rate limiting for localhost
  }

  // Bypass rate limiting for automated tests
  const isTest = request.headers.get('x-playwright-test') === 'true' ||
                 process.env.NODE_ENV === 'test' ||
                 process.env.BYPASS_RATE_LIMIT === 'true'

  // Rate limit authentication endpoints (bypass for tests)
  if (!isTest && (pathname.startsWith('/api/auth/signin') || pathname.startsWith('/api/auth/callback'))) {
    const result = await rateLimit(request, rateLimitPresets.strict)

    if (result) {
      return result
    }
  }

  // Rate limit all API routes (bypass for tests)
  if (!isTest && pathname.startsWith('/api/')) {
    // Public routes (no rate limiting)
    const publicRoutes = [
      '/api/auth/signin',
      '/api/auth/signout',
      '/api/auth/session',
    ]

    const isPublic = publicRoutes.some(route => pathname.startsWith(route))

    if (!isPublic) {
      const result = await rateLimit(request, rateLimitPresets.moderate)

      if (result) {
        return result
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
