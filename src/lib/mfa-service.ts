/**
 * MFA (Multi-Factor Authentication) Service
 * Implements TOTP (Time-based One-Time Password) using speakeasy
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { encrypt, decrypt, createHash } from './encryption-service';
import { prisma } from './db';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface MFAVerifyResult {
  valid: boolean;
  remainingAttempts?: number;
}

// Max failed attempts before temporary lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Track failed attempts in memory (in production, use Redis)
const failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

/**
 * Generate MFA secret and QR code for setup
 */
export async function generateMFASetup(userId: string, email: string): Promise<MFASetupResult> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `ThaiAccounting:${email}`,
    issuer: 'Thai Accounting ERP',
    length: 32,
  });

  // Encrypt secret before storing
  const encryptedSecret = encrypt(secret.base32);

  // Store encrypted secret (not enabled yet - needs verification)
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: encryptedSecret },
  });

  // Generate QR code
  const otpauthUrl =
    secret.otpauth_url ||
    speakeasy.otpauthURL({
      secret: secret.ascii,
      label: email,
      issuer: 'Thai Accounting ERP',
      encoding: 'ascii',
    });

  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret: secret.base32,
    qrCodeUrl,
    otpauthUrl,
  };
}

/**
 * Verify TOTP token during setup to enable MFA
 */
export async function verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true },
  });

  if (!user?.mfaSecret) {
    throw new Error('MFA not set up for this user');
  }

  const secret = decrypt(user.mfaSecret);
  if (!secret) {
    throw new Error('Failed to decrypt MFA secret');
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 steps (1 min) time drift
  });

  if (verified) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });
    // Clear any failed attempts
    failedAttempts.delete(userId);
    return true;
  }

  return false;
}

/**
 * Verify TOTP token during login
 */
export async function verifyMFAToken(userId: string, token: string): Promise<MFAVerifyResult> {
  // Check for lockout
  const attemptInfo = failedAttempts.get(userId);
  if (attemptInfo?.lockedUntil && attemptInfo.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((attemptInfo.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user?.mfaEnabled || !user?.mfaSecret) {
    return { valid: true }; // MFA not enabled, pass through
  }

  const secret = decrypt(user.mfaSecret);
  if (!secret) {
    throw new Error('Failed to decrypt MFA secret');
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (verified) {
    // Clear failed attempts on success
    failedAttempts.delete(userId);
    return { valid: true };
  }

  // Track failed attempt
  const currentAttempts = (attemptInfo?.count || 0) + 1;
  const remainingAttempts = MAX_FAILED_ATTEMPTS - currentAttempts;

  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    failedAttempts.set(userId, {
      count: currentAttempts,
      lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
    });
    throw new Error(`Too many failed attempts. Account locked for 15 minutes.`);
  }

  failedAttempts.set(userId, { count: currentAttempts });
  return { valid: false, remainingAttempts };
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user?.mfaEnabled || !user?.mfaSecret) {
    throw new Error('MFA is not enabled for this user');
  }

  const secret = decrypt(user.mfaSecret);
  if (!secret) {
    throw new Error('Failed to decrypt MFA secret');
  }

  // Verify token before disabling
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (verified) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaVerifiedAt: null,
      },
    });
    return true;
  }

  return false;
}

/**
 * Check if MFA is enabled for user
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  return user?.mfaEnabled ?? false;
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Validate backup code (should be stored hashed in database)
 */
export function validateBackupCode(inputCode: string, hashedCodes: string[]): boolean {
  const inputHash = createHash(inputCode.toUpperCase().trim());
  return hashedCodes.includes(inputHash);
}
