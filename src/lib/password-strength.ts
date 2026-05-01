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
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  'letmein',
  'dragon',
  '111111',
  'baseball',
  'iloveyou',
  'trustno1',
  'sunshine',
  'princess',
  'admin',
  'welcome',
  'shadow',
  'ashley',
  'football',
  'jesus',
  'michael',
  'ninja',
  'mustang',
  'password1',
  '123456789',
  'thaiaccounting',
  'thaierp',
  'accounting',
  'ledger',
  'admin123',
  'root123',
  'user123',
  'pass123',
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
        warning: 'Password must be at least 8 characters long',
        suggestions: ['Add more characters to your password'],
      },
      crackTimeDisplay: 'instant',
      isStrongEnough: false,
    };
  }

  // Check blocked passwords (case-insensitive)
  const lowerPassword = password.toLowerCase();
  if (BLOCKED_PASSWORDS.some((blocked) => lowerPassword.includes(blocked))) {
    return {
      score: 0,
      feedback: {
        warning: 'This password is too common and easily guessed',
        suggestions: ['Choose a more unique password', 'Avoid common words and patterns'],
      },
      crackTimeDisplay: 'instant',
      isStrongEnough: false,
    };
  }

  // Use zxcvbn for strength analysis
  const result = zxcvbn(password);

  // Enhance feedback with Thai Accounting specific suggestions
  const suggestions = [...result.feedback.suggestions];

  if (!/[A-Z]/.test(password)) {
    suggestions.push('Add uppercase letters');
  }
  if (!/[a-z]/.test(password)) {
    suggestions.push('Add lowercase letters');
  }
  if (!/[0-9]/.test(password)) {
    suggestions.push('Add numbers');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  return {
    score: result.score,
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: [...new Set(suggestions)], // Remove duplicates
    },
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    isStrongEnough: result.score >= MINIMUM_SCORE,
  };
}

/**
 * Validate password strength (throws if invalid)
 */
export function validatePasswordStrength(password: string): void {
  const result = checkPasswordStrength(password);

  if (!result.isStrongEnough) {
    const errorMessage =
      result.feedback.warning ||
      `Password is too weak (score: ${result.score}/4). ${result.feedback.suggestions.join('. ')}`;
    throw new Error(errorMessage);
  }
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return 'text-red-600';
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-yellow-500';
    case 3:
      return 'text-green-500';
    case 4:
      return 'text-green-600';
    default:
      return 'text-gray-500';
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
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password has been used recently (would need password history table)
 * This is a placeholder - implement with actual password history
 */
export async function isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
  // In a real implementation, compare against hashed password history
  // For now, always return false
  return false;
}
