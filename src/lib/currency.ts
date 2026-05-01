/**
 * Currency Conversion Utilities
 *
 * CRITICAL: All monetary values in the database are stored as integers in Satang (1/100 Baht).
 * This file provides standardized conversion functions to prevent factor-of-100 bugs.
 *
 * When to use:
 * - bahtToSatang(): User input → Database storage
 * - satangToBaht(): Database → Calculations/Display
 * - formatBaht(): Database → UI display with ฿ symbol
 * - satangToInput(): Database → Form input fields (no symbol)
 * - inputToSatang(): Form input → Database storage
 *
 * Example flow:
 * User enters "100.50" → inputToSatang(100.50) = 10050 → Store in DB
 * DB value 10050 → satangToBaht(10050) = 100.50 → Display as "฿100.50"
 */

/**
 * Convert Baht to Satang for database storage
 * @param baht - Amount in Baht (e.g., 100.50)
 * @returns Satang as integer (e.g., 10050)
 * @throws Error if baht is negative or NaN
 */
export function bahtToSatang(baht: number): number {
  if (isNaN(baht)) {
    throw new Error('Cannot convert NaN to Satang');
  }
  if (baht < 0) {
    throw new Error('Cannot convert negative amount to Satang');
  }
  return Math.round(baht * 100);
}

/**
 * Convert Satang from database to Baht for display
 * @param satang - Amount in Satang (e.g., 10050)
 * @returns Baht (e.g., 100.50)
 * @throws Error if satang is negative or NaN
 */
export function satangToBaht(satang: number | null | undefined): number {
  if (satang === null || satang === undefined || isNaN(satang)) {
    return 0;
  }
  // Allow negative values (for credit balances, etc) - just convert
  return satang / 100;
}

/**
 * Format Satang to Thai Baht currency string
 * @param satang - Amount in Satang (integer)
 * @returns Formatted string (e.g., "฿100.50")
 *
 * Use for: Displaying monetary values in UI components
 */
export function formatBaht(satang: number): string {
  const baht = satangToBaht(satang);
  return `฿${baht.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format Satang to Thai Baht for input fields (no symbol)
 * @param satang - Amount in Satang (integer)
 * @returns Number for input (e.g., 100.50)
 *
 * Use for: Populating form input fields where user needs to edit the value
 */
export function satangToInput(satang: number): number {
  return satangToBaht(satang);
}

/**
 * Parse user input to Satang for storage
 * @param input - User input in Baht (e.g., 100.50)
 * @returns Satang (integer)
 *
 * Use for: Converting form input values before saving to database
 */
export function inputToSatang(input: number): number {
  return bahtToSatang(input);
}

/**
 * Validate if a value is a valid Satang amount
 * @param value - Value to validate
 * @returns true if value is a non-negative integer
 *
 * Use for: Runtime validation of database values
 */
export function isValidSatang(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && !isNaN(value) && value >= 0;
}

/**
 * Validate if a value is a valid Baht amount
 * @param value - Value to validate
 * @returns true if value is a non-negative number
 *
 * Use for: Validating user input before conversion to Satang
 */
export function isValidBaht(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Round Satang to nearest integer (for floating point precision issues)
 * @param satang - Amount in Satang that may have decimal precision issues
 * @returns Rounded Satang as integer
 *
 * Use for: Fixing floating point arithmetic errors (e.g., 10050.999999999 → 10050)
 */
export function roundSatang(satang: number): number {
  return Math.round(satang);
}

/**
 * Calculate percentage of Satang amount (returns Satang)
 * @param satang - Amount in Satang
 * @param percent - Percentage (e.g., 7 for 7%)
 * @returns Result in Satang
 *
 * Use for: VAT, WHT, discount calculations
 * Example: calculatePercent(10000, 7) = 700 (7% of 100.00 Baht)
 */
export function calculatePercent(satang: number, percent: number): number {
  return Math.round((satang * percent) / 100);
}

/**
 * Add two Satang amounts (returns Satang)
 * @param a - First amount in Satang
 * @param b - Second amount in Satang
 * @returns Sum in Satang
 *
 * Use for: Safe addition that handles floating point precision
 */
export function addSatang(a: number, b: number): number {
  return Math.round(a + b);
}

/**
 * Subtract two Satang amounts (returns Satang)
 * @param a - Minuend in Satang
 * @param b - Subtrahend in Satang
 * @returns Difference in Satang
 *
 * Use for: Safe subtraction that handles floating point precision
 */
export function subtractSatang(a: number, b: number): number {
  return Math.round(a - b);
}
