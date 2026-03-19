import { NextAuthOptions, getServerSession } from "next-auth"
import { cookies } from "next/headers"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { logLogin, logFailedLogin } from "./activity-logger"
import { verifyMFAToken } from "./mfa-service"
import { createSession, invalidateSession } from "./session-service"
import { validatePasswordStrength } from "./password-strength"
import { logSecurityEvent } from "./audit-logger"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      mfaEnabled: boolean
      mfaVerified: boolean
    }
  }
  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    mfaEnabled: boolean
    requiresMFA: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: string
    mfaEnabled: boolean
    mfaVerified: boolean
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" },
        mfaToken: { label: "รหัสยืนยัน", type: "text" },
        sessionId: { label: "Session ID", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
        } catch (dbError) {
          console.error('Database error during user lookup:', dbError)
          throw new Error('Database connection error. Please try again.')
        }

        if (!user || !user.isActive) {
          await logFailedLogin(credentials.email)
          return null
        }

        let passwordMatch;
        try {
          passwordMatch = await bcrypt.compare(credentials.password, user.password)
        } catch (bcryptError) {
          console.error('Bcrypt error during password comparison:', bcryptError)
          throw new Error('Authentication error. Please try again.')
        }

        if (!passwordMatch) {
          await logFailedLogin(credentials.email, undefined, 'Invalid password')
          return null
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
          // If no MFA token provided, require it
          if (!credentials.mfaToken) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              mfaEnabled: true,
              requiresMFA: true,
            } as const
          }

          // Verify MFA token
          let mfaResult;
          try {
            mfaResult = await verifyMFAToken(user.id, credentials.mfaToken)
          } catch (mfaError) {
            console.error('MFA verification system error:', mfaError)
            throw new Error('MFA system error. Please contact support.')
          }

          if (!mfaResult.valid) {
            await logSecurityEvent(
              user.id,
              'LOGIN_FAILED',
              { reason: 'Invalid MFA token' },
              req?.headers?.['x-forwarded-for'] as string || 'unknown',
              req?.headers?.['user-agent'] as string || 'unknown'
            )
            await logFailedLogin(credentials.email, user.id, 'Invalid MFA')
            throw new Error('Invalid MFA code')
          }
        }

        // Create session in our session table for concurrent session limiting
        const ipAddress = req?.headers?.['x-forwarded-for'] as string || 'unknown'
        const userAgent = req?.headers?.['user-agent'] as string || 'unknown'

        try {
          await createSession(user.id, ipAddress, userAgent)
        } catch (sessionError) {
          console.error('Session creation error:', sessionError)
          // Continue with login even if session tracking fails
        }

        // Update last login and log success - wrapped in try-catch to prevent login failure
        try {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            }),
            prisma.activityLog.create({
              data: {
                userId: user.id,
                action: 'LOGIN',
                module: 'auth',
                status: 'success'
              }
            })
          ])

          await logSecurityEvent(
            user.id,
            'LOGIN',
            { mfaUsed: user.mfaEnabled },
            ipAddress,
            userAgent
          )
        } catch (logError) {
          console.error('Error during post-login logging:', logError)
          // Continue with login even if logging fails
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          requiresMFA: false,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.mfaEnabled = user.mfaEnabled
        token.mfaVerified = !user.requiresMFA
      }
      
      // Handle session rotation on privilege escalation
      if (trigger === 'update' && token.role) {
        try {
          // Log privilege escalation check
          const { logSecurityEvent } = await import('./audit-logger')
          await logSecurityEvent(
            token.id,
            'PRIVILEGE_ESCALATION',
            { role: token.role },
            'unknown',
            'session-update'
          )
        } catch (error) {
          console.error('Error logging privilege escalation:', error)
          // Continue even if logging fails
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id || '',
          email: token.email || '',
          name: token.name || null,
          role: token.role || 'USER',
          mfaEnabled: token.mfaEnabled || false,
          mfaVerified: token.mfaVerified || false,
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET must be set in production environment')
    }
    return 'dev-only-secret-change-in-production'
  })(),
  events: {
    async signOut({ token }) {
      // Invalidate session when user signs out
      if (token?.id) {
        const { invalidateAllUserSessions } = await import('./session-service')
        await invalidateAllUserSessions(token.id)
        
        await logSecurityEvent(
          token.id,
          'LOGOUT',
          {},
          'unknown',
          'signout'
        )
      }
    },
  },
}

/**
 * Register a new user with password strength validation
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: string = 'USER'
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validate password strength
    validatePasswordStrength(password)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid password'
    }
  }

  // Check if email exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    return { success: false, error: 'Email already registered' }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    }
  })

  return { success: true, userId: user.id }
}

/**
 * Reset password with strength validation
 */
export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password strength
    validatePasswordStrength(newPassword)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid password'
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  // Invalidate all sessions for security
  const { invalidateAllUserSessions } = await import('./session-service')
  await invalidateAllUserSessions(userId)

  return { success: true }
}

/**
 * Change password (requires old password)
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // Verify old password
  const passwordMatch = await bcrypt.compare(oldPassword, user.password)
  if (!passwordMatch) {
    return { success: false, error: 'Current password is incorrect' }
  }

  // Check new password is different
  const samePassword = await bcrypt.compare(newPassword, user.password)
  if (samePassword) {
    return { success: false, error: 'New password must be different from old password' }
  }

  return resetPassword(userId, newPassword)
}


/**
 * Get current session (auth helper)
 * Use this in server components and API routes
 */
export async function auth() {
  const session = await getServerSession(authOptions)
  return session
}
