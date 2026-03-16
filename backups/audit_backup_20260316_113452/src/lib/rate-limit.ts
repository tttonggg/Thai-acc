// Simple in-memory rate limiting for development
// For production, use Upstash Ratelimit or Redis-based solution

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  /** Number of requests allowed in the time window */
  limit: number
  /** Time window in milliseconds */
  window: number
  /** Custom identifier generator */
  identifier?: (request: Request) => string
}

/**
 * Rate limiting middleware for API routes
 * @param config Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const { limit, window, identifier } = config

  // Completely bypass rate limiting for localhost development
  const url = new URL(request.url)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return null
  }

  // Generate identifier from request (IP address or custom)
  const key = identifier ? identifier(request) : getClientIdentifier(request)

  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + window
    }
    rateLimitStore.set(key, entry)

    // Clean up old entries periodically
    if (rateLimitStore.size > 1000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k)
        }
      }
    }

    return null // Allow request
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetTime = Math.ceil((entry.resetTime - now) / 1000)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests',
        retryAfter: resetTime
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          'Retry-After': resetTime.toString()
        }
      }
    )
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  // Add rate limit headers to response (caller should include these)
  return null // Allow request
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (cfConnectingIp) return cfConnectingIp
  if (realIp) return realIp
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  // Fall back to a session-based identifier
  const session = request.headers.get('cookie')
  return session ? `session:${session.slice(0, 20)}` : `ip:${Math.random()}`
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Strict: For sensitive operations (login, password reset)
  strict: {
    limit: 100,
    window: 60 * 1000 // 100 requests per minute
  },

  // Moderate: For general API operations
  moderate: {
    limit: 500,
    window: 60 * 1000 // 500 requests per minute
  },

  // Relaxed: For public read operations
  relaxed: {
    limit: 100,
    window: 60 * 1000 // 100 requests per minute
  },

  // Per hour: For bulk operations
  hourly: {
    limit: 1000,
    window: 60 * 60 * 1000 // 1000 requests per hour
  }
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (...args: T): Promise<Response> => {
    // Extract Request from args (first argument for Next.js API routes)
    const request = args[0] as unknown as Request

    if (request instanceof Request) {
      const rateLimitResult = await rateLimit(request, config)

      if (rateLimitResult) {
        return rateLimitResult
      }
    }

    return handler(...args)
  }
}

/**
 * Get rate limit info for a client (for headers)
 */
export function getRateLimitInfo(identifier: string): {
  limit: number
  remaining: number
  resetAt: Date
} | null {
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    return null
  }

  return {
    limit: 0, // Caller should set this based on their preset
    remaining: Math.max(0, entry.limit - entry.count),
    resetAt: new Date(entry.resetTime)
  }
}
