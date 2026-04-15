import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, rateLimitPresets } from './lib/rate-limit';
import { isCsrfExemptPath, getCsrfTokenFromHeaders } from './lib/csrf-service';
import { logError } from './lib/errors';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Start performance tracking (manual tracking without Edge Runtime dependencies)
  const startTime = Date.now();

  // DEV ONLY: Bypass rate limiting for local development
  // WARNING: Remove or disable this in production!
  const isLocalDev =
    process.env.NODE_ENV === 'development' &&
    (request.headers.get('host')?.includes('localhost:3000') ||
      request.headers.get('host')?.includes('127.0.0.1:3000'));

  // Bypass for automated tests
  const isTest =
    request.headers.get('x-playwright-test') === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.BYPASS_RATE_LIMIT === 'true';

  try {
    // Add security headers to all responses
    const response = NextResponse.next();
  
    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Content Security Policy (CSP) - adjust as needed
    // Allow WebSocket connections in development
    const wsUrl = process.env.NODE_ENV === 'development' ? ' ws://localhost:3001' : '';
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self'${wsUrl}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);

    // Rate limiting for authentication endpoints
    if (
      !isTest &&
      !isLocalDev &&
      (pathname.startsWith('/api/auth/signin') ||
        pathname.startsWith('/api/auth/callback'))
    ) {
      const result = await rateLimit(request, rateLimitPresets.strict);
      if (result) return result;
    }

    // Rate limiting for all API routes
    if (!isTest && !isLocalDev && pathname.startsWith('/api/')) {
      const publicRoutes = [
        '/api/auth/signin',
        '/api/auth/signout',
        '/api/auth/session',
        '/api/csrf/token',
      ];

      const isPublic = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (!isPublic) {
        const result = await rateLimit(request, rateLimitPresets.moderate);
        if (result) return result;
      }
    }

    // CSRF Protection for state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (stateChangingMethods.includes(method) && pathname.startsWith('/api/')) {
      // Skip CSRF for exempt paths
      if (!isCsrfExemptPath(pathname)) {
        const csrfToken = getCsrfTokenFromHeaders(request.headers);

        if (!csrfToken) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: 'CSRF token required',
              code: 'CSRF_MISSING',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Get session ID from cookie or header
        const sessionId =
          request.cookies.get('next-auth.session-token')?.value ||
          request.cookies.get('__Secure-next-auth.session-token')?.value ||
          request.headers.get('x-session-id');

        if (!sessionId) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: 'Session required',
              code: 'SESSION_MISSING',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Note: Actual token validation happens in the route handlers
        // because we need to use the prisma client which is not available in edge middleware
      }
    }

    // Track performance for API routes (manual tracking)
    if (pathname.startsWith('/api/')) {
      const duration = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${duration}ms`);
    }

    return response;
  } catch (error) {
    // Log errors
    logError(error as Error, {
      url: request.url,
      method: request.method,
      pathname: request.nextUrl.pathname,
    });

    // Track performance for failed requests (manual tracking)
    // Note: Can't set headers on error responses here, but timing is tracked

    // Return error response
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    // Skip static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
