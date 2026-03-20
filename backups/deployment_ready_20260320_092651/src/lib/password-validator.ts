/**
 * Password Strength Validation using zxcvbn
 * Ensures strong passwords for all users
 */

import * as zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
  isStrongEnough: boolean;
}

// Minimum score required (3 = fairly secure)
const MINIMUM_SCORE = 3;

// Common passwords to block (in addition to zxcvbn's dictionary)
const BLOCKED_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'letmein', 'dragon', '111111', 'baseball',
  'iloveyou', 'trustno1', 'sunshine', 'princess', 'admin',
  'welcome', 'shadow', 'ashley', 'football', 'jesus',
  'michael', 'ninja', 'mustang', 'password1', '123456789',
  'thaiaccounting', 'thaierp', 'accounting', 'ledger',
  'admin123', 'root123', 'user123', 'pass123'
];

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  // Check minimum length
  if (password.length < 8) {
    return {
      score: 0,
      feedback: {
        warning: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
        suggestions: ['เพิ่มตัวอักษรให้มากขึ้น'],
      },
      crackTimeDisplay: 'instant',
      isStrongEnough: false,
    };
  }

  // Check blocked passwords (case-insensitive)
  const lowerPassword = password.toLowerCase();
  if (BLOCKED_PASSWORDS.some(blocked => lowerPassword.includes(blocked))) {
    return {
      score: 0,
      feedback: {
        warning: 'รหัสผ่านนี้ใช้กันทั่วไปและเดาได้ง่าย',
        suggestions: ['เลือกรหัสผ่านที่ไม่ซ้ำใครมากขึ้น', 'หลีกเลี่ยงคำทั่วไปและรูปแบบที่คาดเดาได้'],
      },
      crackTimeDisplay: 'instant',
      isStrongEnough: false,
    };
  }

  // Use zxcvbn for strength analysis
  const result = zxcvbn(password);

  // Enhance feedback with Thai Accounting specific suggestions
  const suggestions: string[] = [...result.feedback.suggestions];
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('เพิ่มตัวพิมพ์ใหญ่');
  }
  if (!/[a-z]/.test(password)) {
    suggestions.push('เพิ่มตัวพิมพ์เล็ก');
  }
  if (!/[0-9]/.test(password)) {
    suggestions.push('เพิ่มตัวเลข');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    suggestions.push('เพิ่มอักขระพิเศษ (!@#$%^&*)');
  }

  // Remove duplicates using filter
  const uniqueSuggestions = suggestions.filter((item, index) => suggestions.indexOf(item) === index);

  return {
    score: result.score,
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: uniqueSuggestions,
    },
    crackTimeDisplay: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
    isStrongEnough: result.score >= MINIMUM_SCORE,
  };
}

/**
 * Validate password strength (throws if invalid)
 */
export function validatePasswordStrength(password: string): void {
  const result = checkPasswordStrength(password);
  
  if (!result.isStrongEnough) {
    const errorMessage = result.feedback.warning || 
      `รหัสผ่านอ่อนแอเกินไป (คะแนน: ${result.score}/4). ${result.feedback.suggestions.join('. ')}`;
    throw new Error(errorMessage);
  }
}

/**
 * Get password strength label in Thai
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'อ่อนแอมาก';
    case 1: return 'อ่อนแอ';
    case 2: return 'พอใช้';
    case 3: return 'ดี';
    case 4: return 'แข็งแกร่ง';
    default: return 'ไม่ทราบ';
  }
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0: return 'text-red-600';
    case 1: return 'text-red-500';
    case 2: return 'text-yellow-500';
    case 3: return 'text-green-500';
    case 4: return 'text-green-600';
    default: return 'text-gray-500';
  }
}

/**
 * Generate a strong password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const all = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    const char = all[Math.floor(Math.random() * all.length)];
    password += char;
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash a password for storage (wrapper around bcrypt)
 * This is a type definition - actual hashing happens in auth.ts
 */
export type PasswordHashFunction = (password: string) => Promise<string>;

/**
 * Check if password meets enterprise requirements
 */
export function checkEnterprisePasswordPolicy(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษร');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }

  const result = zxcvbn(password);
  if (result.score < MINIMUM_SCORE) {
    errors.push('รหัสผ่านอ่อนแอเกินไป - กรุณาเพิ่มความซับซ้อน');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
