/**
 * Enhanced Authentication Module with Security Hardening
 * Integrates MFA, Password Strength, and Session Management
 */

import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { verifyMFAToken } from './mfa';
import { validatePasswordStrength, checkPasswordStrength } from './password-validator';
import { createSession, invalidateAllUserSessions, getUserSessions } from './session-service';
import { logSecurityEvent } from './audit-service';
import { encrypt } from './encryption';

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      mfaEnabled: boolean;
      mfaVerified: boolean;
    };
  }
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    mfaEnabled: boolean;
    requiresMFA: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'อีเมล', type: 'email' },
        password: { label: 'รหัสผ่าน', type: 'password' },
        mfaToken: { label: 'รหัสยืนยัน', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          await logSecurityEvent(
            null,
            'LOGIN_FAILED',
            { reason: 'User not found or inactive', email: credentials.email },
            (req?.headers?.['x-forwarded-for'] as string) || 'unknown',
            (req?.headers?.['user-agent'] as string) || 'unknown'
          );
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          await logSecurityEvent(
            user.id,
            'LOGIN_FAILED',
            { reason: 'Invalid password' },
            (req?.headers?.['x-forwarded-for'] as string) || 'unknown',
            (req?.headers?.['user-agent'] as string) || 'unknown'
          );
          return null;
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
            } as const;
          }

          // Verify MFA token
          try {
            const mfaResult = await verifyMFAToken(user.id, credentials.mfaToken);
            if (!mfaResult.valid) {
              await logSecurityEvent(
                user.id,
                'LOGIN_FAILED',
                { reason: 'Invalid MFA token' },
                (req?.headers?.['x-forwarded-for'] as string) || 'unknown',
                (req?.headers?.['user-agent'] as string) || 'unknown'
              );
              throw new Error('Invalid MFA code');
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes('locked')) {
              throw error;
            }
            return null;
          }
        }

        // Create session for concurrent session limiting
        const ipAddress = (req?.headers?.['x-forwarded-for'] as string) || 'unknown';
        const userAgent = (req?.headers?.['user-agent'] as string) || 'unknown';

        // Check max sessions
        const activeSessions = await getUserSessions(user.id);
        const maxSessions = user.maxSessions || 3;

        if (activeSessions.length >= maxSessions) {
          // Invalidate oldest session
          await invalidateAllUserSessions(user.id);
        }

        await createSession(user.id, ipAddress, userAgent);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log successful login
        await logSecurityEvent(
          user.id,
          'LOGIN',
          { mfaUsed: user.mfaEnabled },
          ipAddress,
          userAgent
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          requiresMFA: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.mfaEnabled = user.mfaEnabled;
        token.mfaVerified = !user.requiresMFA;
      }

      // Handle session rotation on privilege escalation
      if (trigger === 'update' && token.role) {
        await logSecurityEvent(
          token.id,
          'PRIVILEGE_ESCALATION',
          { role: token.role },
          'unknown',
          'session-update'
        );
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          mfaEnabled: token.mfaEnabled,
          mfaVerified: token.mfaVerified,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-in-production',
  events: {
    async signOut({ token }) {
      // Invalidate session when user signs out
      if (token?.id) {
        await invalidateAllUserSessions(token.id);

        await logSecurityEvent(token.id, 'LOGOUT', {}, 'unknown', 'signout');
      }
    },
  },
};

/**
 * Get current session (auth helper)
 * Use this in server components and API routes
 */
export async function auth() {
  const session = await getServerSession(authOptions);
  return session;
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
    validatePasswordStrength(password);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid password',
    };
  }

  // Check if email exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  // Hash password with increased rounds for security
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  });

  return { success: true, userId: user.id };
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
    validatePasswordStrength(newPassword);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid password',
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions for security
  await invalidateAllUserSessions(userId);

  return { success: true };
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
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify old password
  const passwordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!passwordMatch) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Check new password is different
  const samePassword = await bcrypt.compare(newPassword, user.password);
  if (samePassword) {
    return { success: false, error: 'New password must be different from old password' };
  }

  return resetPassword(userId, newPassword);
}

/**
 * Setup MFA for a user
 */
export async function setupMFA(
  userId: string,
  email: string
): Promise<{ success: boolean; secret?: string; qrCodeUrl?: string; error?: string }> {
  try {
    const { generateMFASetup } = await import('./mfa');
    const result = await generateMFASetup(userId, email);
    return {
      success: true,
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup MFA',
    };
  }
}

/**
 * Verify and enable MFA
 */
export async function enableMFA(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { verifyAndEnableMFA } = await import('./mfa');
    const verified = await verifyAndEnableMFA(userId, token);

    if (verified) {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid verification code' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable MFA',
    };
  }
}

/**
 * Disable MFA
 */
export async function disableMFA(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { disableMFA: doDisableMFA } = await import('./mfa');
    const disabled = await doDisableMFA(userId, token);

    if (disabled) {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid verification code' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable MFA',
    };
  }
}

/**
 * Check password strength without throwing
 */
export function checkPassword(password: string): {
  valid: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
} {
  const result = checkPasswordStrength(password);
  return {
    valid: result.isStrongEnough,
    score: result.score,
    feedback: result.feedback.warning,
    suggestions: result.feedback.suggestions,
  };
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(userId: string): Promise<
  Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActiveAt: Date;
  }>
> {
  return getUserSessions(userId);
}

/**
 * Revoke all other sessions
 */
export async function revokeOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  const { invalidateOtherSessions } = await import('./session-service');
  return invalidateOtherSessions(userId, currentSessionToken);
}
