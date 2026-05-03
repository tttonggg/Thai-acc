// Simple in-memory rate limiting for development
// For production, use Upstash Ratelimit or Redis-based solution

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Number of requests allowed in the time window */
  limit: number;
  /** Time window in milliseconds */
  window: number;
  /** Custom identifier generator (defaults to IP-based) */
  identifier?: (request: Request) => string;
  /** Use user-based limiting (per user ID) - requires session lookup */
  useUserBased?: boolean;
  /** Optional function to extract user ID from request/session */
  getUserId?: (request: Request) => string | null;
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
  const { limit, window, identifier, useUserBased, getUserId } = config;

  // Generate identifier from request (IP address, custom, or user-based)
  let key: string;
  if (useUserBased && getUserId) {
    const userId = getUserId(request);
    if (userId) {
      key = `user:${userId}`;
    } else {
      // Fall back to IP-based if no user session found
      key = identifier ? identifier(request) : getClientIdentifier(request);
    }
  } else {
    key = identifier ? identifier(request) : getClientIdentifier(request);
  }

  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + window,
    };
    rateLimitStore.set(key, entry);

    // Clean up old entries periodically
    if (rateLimitStore.size > 1000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    return null; // Allow request
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetTime = Math.ceil((entry.resetTime - now) / 1000);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests',
        retryAfter: resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          'Retry-After': resetTime.toString(),
        },
      }
    );
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  // Add rate limit headers to response (caller should include these)
  return null; // Allow request
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // Fall back to a session-based identifier
  const session = request.headers.get('cookie');
  return session ? `session:${session.slice(0, 20)}` : `ip:${Math.random()}`;
}

/**
 * Extract user ID from session cookie for user-based rate limiting
 * Note: This is a basic implementation - consider using a JWT parser for production
 */
export function extractUserIdFromRequest(request: Request): string | null {
  // Check for session token in cookie
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  // Look for NextAuth session token
  const sessionMatch = cookie.match(/next-auth\.session-token=([^;]+)/);
  if (sessionMatch) {
    // Return the session token as the identifier
    // In production, you should decode the JWT and extract the actual user ID
    return sessionMatch[1].substring(0, 32);
  }

  // Check for Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7).substring(0, 32);
  }

  return null;
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Strict: For sensitive operations (login, password reset)
  // 5 attempts per 15 minutes to prevent brute force attacks
  strict: {
    limit: 5,
    window: 15 * 60 * 1000, // 5 requests per 15 minutes
    useUserBased: false,
  },

  // Moderate: For general API operations
  // 60 requests per minute per IP/user
  moderate: {
    limit: 60,
    window: 60 * 1000, // 60 requests per minute
    useUserBased: true,
    getUserId: extractUserIdFromRequest,
  },

  // Relaxed: For public read operations
  relaxed: {
    limit: 100,
    window: 60 * 1000, // 100 requests per minute
    useUserBased: false,
  },

  // Per hour: For bulk operations
  hourly: {
    limit: 1000,
    window: 60 * 60 * 1000, // 1000 requests per hour
    useUserBased: true,
    getUserId: extractUserIdFromRequest,
  },
};

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (...args: T): Promise<Response> => {
    // Extract Request from args (first argument for Next.js API routes)
    const request = args[0] as unknown as Request;

    if (request instanceof Request) {
      const rateLimitResult = await rateLimit(request, config);

      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    return handler(...args);
  };
}

/**
 * Get rate limit info for a client (for headers)
 */
export function getRateLimitInfo(identifier: string): {
  limit: number;
  remaining: number;
  resetAt: Date;
} | null {
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    return null;
  }

  return {
    limit: 0, // Caller should set this based on their preset
    remaining: Math.max(0, (entry as any).limit - entry.count),
    resetAt: new Date(entry.resetTime),
  };
}
