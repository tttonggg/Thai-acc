/**
 * Encryption Service for Thai Accounting ERP
 * Encrypts sensitive data fields before storing to database
 */

import * as CryptoJS from 'crypto-js';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET must be set in production');
}

// Use a derived key for encryption
const deriveKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};

const KEY = deriveKey(ENCRYPTION_KEY || 'dev-encryption-key-change-in-production');

/**
 * Encrypt a string value
 */
export function encrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const encrypted = CryptoJS.AES.encrypt(value, KEY, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
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
    const decrypted = CryptoJS.AES.decrypt(ciphertext, KEY, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted');
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
 * Hash data for tamper detection (one-way)
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
 * Verify HMAC signature
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmacSignature(payload, secret);
  // Timing-safe comparison
  try {
    return CryptoJS.timingSafeEqual(
      CryptoJS.enc.Hex.parse(signature),
      CryptoJS.enc.Hex.parse(expected)
    );
  } catch {
    return signature === expected;
  }
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
