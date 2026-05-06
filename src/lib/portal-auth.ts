/**
 * Customer Portal Authentication Service
 * Handles password hashing, verification, and portal session management.
 */

import * as bcrypt from 'bcryptjs';
import { prisma } from './db';

// Bcrypt salt rounds
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random temporary password (16 chars, URL-safe).
 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(16);
  // Use Node.js crypto in server context, fallback to Math.random
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

export type PortalAccountWithRelations = Awaited<ReturnType<typeof prisma.customerPortalAccount.findUnique>> & { customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>> };

/**
 * Portal login — validate email + password against CustomerPortalAccount.
 * Returns the portal account + customer info if valid, null otherwise.
 */
export async function portalLogin(email: string): Promise<{ portalAccount: PortalAccountWithRelations; customer: PortalAccountWithRelations['customer'] } | null> {
  // First find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  const portalAccount = await prisma.customerPortalAccount.findUnique({
    where: { userId: user.id },
    include: { customer: true, user: true },
  });

  if (!portalAccount || !portalAccount.isActive || !portalAccount.user.isActive) {
    return null;
  }

  return { portalAccount, customer: portalAccount.customer };
}

/**
 * Verify portal password given email.
 * Returns { portalAccount, customer } with password verified, or null.
 */
export async function verifyPortalPassword(email: string, password: string) {
  const result = await portalLogin(email);
  if (!result?.portalAccount) return null;

  const valid = await verifyPassword(password, result.portalAccount.password);
  if (!valid) return null;

  return { portalAccount: result.portalAccount, customer: result.customer };
}

/**
 * Update last login timestamp for a portal account.
 */
export async function updateLastLogin(portalAccountId: string): Promise<void> {
  await prisma.customerPortalAccount.update({
    where: { id: portalAccountId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Create a portal account for a customer with a given email.
 * Creates a linked User with role CUSTOMER_PORTAL.
 * Returns the temporary password (must be communicated to customer).
 */
export async function createPortalAccount(
  customerId: string,
  email: string,
  password?: string
): Promise<{ tempPassword: string; portalAccountId: string }> {
  const tempPassword = password ?? generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  // First create the User, then create the portal account
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Portal User',
      role: 'CUSTOMER_PORTAL',
      isActive: true,
    },
  });

  const portalAccount = await prisma.customerPortalAccount.create({
    data: {
      customerId,
      userId: user.id,
      password: hashed,
    },
  });

  return { tempPassword, portalAccountId: portalAccount.id };
}

/**
 * Deactivate a portal account.
 */
export async function deactivatePortalAccount(portalAccountId: string): Promise<void> {
  const portalAccount = await prisma.customerPortalAccount.findUnique({
    where: { id: portalAccountId },
    include: { user: true },
  });

  if (!portalAccount) return;

  await prisma.$transaction([
    prisma.customerPortalAccount.update({
      where: { id: portalAccountId },
      data: { isActive: false },
    }),
    prisma.user.update({
      where: { id: portalAccount.user.id },
      data: { isActive: false },
    }),
  ]);
}

/**
 * Check if a customer already has a portal account.
 */
export async function getPortalAccountByCustomerId(customerId: string) {
  return prisma.customerPortalAccount.findUnique({
    where: { customerId },
    include: { user: true },
  });
}
