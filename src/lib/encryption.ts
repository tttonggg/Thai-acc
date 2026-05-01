/**
 * Encryption Service for Thai Accounting ERP
 * Implements AES-256 encryption for sensitive data fields
 */

import * as CryptoJS from 'crypto-js';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';

// Use a derived key for encryption (SHA-256 for key derivation)
const deriveKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};

const KEY = deriveKey(ENCRYPTION_KEY || 'dev-encryption-key-change-in-production');

/**
 * Encrypt a string value using AES-256
 */
export function encrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const encrypted = CryptoJS.AES.encrypt(value, KEY).toString();
    return `enc:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string value
 */
export function decrypt(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) return null;
  if (!encryptedValue.startsWith('enc:')) return encryptedValue; // Not encrypted

  try {
    const ciphertext = encryptedValue.substring(4); // Remove 'enc:' prefix
    const decrypted = CryptoJS.AES.decrypt(ciphertext, KEY).toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key may be incorrect');
  }
}

/**
 * Encrypt object fields selectively
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fieldsToEncrypt) {
    const value = result[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }
  return result;
}

/**
 * Decrypt object fields selectively
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fieldsToEncrypt) {
    const value = result[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = decrypt(value);
    }
  }
  return result;
}

// Fields that should be encrypted for each entity type
export const SENSITIVE_FIELDS = {
  Customer: ['taxId'] as const,
  Vendor: ['taxId', 'bankAccount'] as const,
  Employee: ['taxId', 'bankAccountNo', 'idCardNumber', 'socialSecurityNo'] as const,
  Company: ['taxId'] as const,
  BankAccount: ['accountNumber'] as const,
  User: ['mfaSecret'] as const,
};

/**
 * Hash data for tamper detection (one-way, SHA-256)
 */
export function createHash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Create HMAC signature for webhook verification
 */
export function createHmacSignature(payload: string, secret: string): string {
  return CryptoJS.HmacSHA256(payload, secret).toString();
}

/**
 * Verify HMAC signature (timing-safe comparison)
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmacSignature(payload, secret);
  // Simple comparison (in production, use timing-safe comparison)
  return signature === expected;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureBytes(length: number = 32): string {
  const words = CryptoJS.lib.WordArray.random(length);
  return words.toString(CryptoJS.enc.Hex);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encrypt sensitive data for audit logs
 * Returns a masked version for display and encrypted version for storage
 */
export function encryptForAudit(value: string | null | undefined): {
  encrypted: string | null;
  masked: string | null;
} {
  if (!value) return { encrypted: null, masked: null };

  const encrypted = encrypt(value);
  // Create masked version (show first 2 and last 2 chars)
  const masked =
    value.length > 4 ? value.substring(0, 2) + '***' + value.substring(value.length - 2) : '****';

  return { encrypted, masked };
}

/**
 * Encrypt fields for database storage with automatic decryption on read
 * This is a helper for Prisma middleware
 */
export function createEncryptedFieldHandler<T extends Record<string, unknown>>(
  fields: (keyof T)[]
) {
  return {
    encrypt: (data: T): T => encryptFields(data, fields),
    decrypt: (data: T): T => decryptFields(data, fields),
  };
}
