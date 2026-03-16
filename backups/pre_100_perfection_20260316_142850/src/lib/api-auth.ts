import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

/**
 * Require authentication - returns user object or throws error
 * Use this for all protected API routes
 */
export async function requireAuth(request?: NextRequest): Promise<AuthUser> {
  // Pass request context to getServerSession so it can read cookies
  const opts = request
    ? { ...authOptions, req: { headers: request.headers } }
    : authOptions

  const session = await getServerSession(opts)

  if (!session || !session.user) {
    throw new AuthError('Unauthorized', 401)
  }

  return session.user as AuthUser
}

/**
 * Require specific role(s)
 * Throws 403 if user doesn't have required role
 */
export async function requireRole(
  roles: UserRole | UserRole[],
  request?: NextRequest
): Promise<AuthUser> {
  const user = await requireAuth(request)

  const requiredRoles = Array.isArray(roles) ? roles : [roles]

  if (!requiredRoles.includes(user.role as UserRole)) {
    throw new AuthError('Forbidden: Insufficient permissions', 403)
  }

  return user
}

/**
 * Check if user has permission (doesn't throw)
 */
export async function hasRole(
  roles: UserRole | UserRole[],
  request?: NextRequest
): Promise<boolean> {
  try {
    await requireRole(roles, request)
    return true
  } catch {
    return false
  }
}

/**
 * Custom error class for auth failures
 */
export class AuthError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * Standard API error response
 * Format: { success: false, error: string }
 */
export function apiError(
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status: statusCode }
  )
}

/**
 * Standard success response
 * Format: { success: true, data: T }
 */
export function apiSuccess<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  )
}

/**
 * Forbidden error response
 */
export function forbiddenError(message: string = 'ไม่มีสิทธิ์เข้าถึง'): NextResponse {
  return apiError(message, 403)
}

/**
 * Unauthorized error response
 */
export function unauthorizedError(message: string = 'กรุณาเข้าสู่ระบบ'): NextResponse {
  return apiError(message, 401)
}

/**
 * Not found error response
 */
export function notFoundError(message: string = 'ไม่พบข้อมูล'): NextResponse {
  return apiError(message, 404)
}

/**
 * Server error response
 */
export function serverError(message: string = 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'): NextResponse {
  return apiError(message, 500)
}

/**
 * Wrap API handler with authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthUser, ...args: T) => Promise<NextResponse>,
  options?: {
    roles?: UserRole | UserRole[]
  }
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const user = options?.roles
        ? await requireRole(options.roles)
        : await requireAuth()

      return await handler(user, ...args)
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.message, error.statusCode)
      }

      console.error('API Error:', error)
      return serverError()
    }
  }
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return '0.0.0.0'
}
