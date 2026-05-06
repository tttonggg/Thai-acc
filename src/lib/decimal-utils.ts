/**
 * Decimal math utilities for Thai Accounting ERP
 *
 * Use these instead of JavaScript's native float math for financial calculations.
 * JavaScript uses IEEE 754 floats which cause precision errors:
 *   0.1 + 0.2 = 0.30000000000000004  // BAD for money
 *
 * Decimal.js provides arbitrary-precision decimal arithmetic:
 *   new Decimal(0.1).plus(0.2) = 0.3   // CORRECT
 */

import Decimal from 'decimal.js';

// Configure for Thai accounting - high precision, half-up rounding
Decimal.set({
  precision: 28,  // Enough for complex calculations
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 18,
});

/**
 * Convert a number or string to Decimal safely
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value == null) return new Decimal(0);
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Safely multiply two numbers (e.g., baseAmount * vatRate)
 * Returns result as number (not Decimal) for Prisma compatibility
 */
export function safeMul(value: number | string, multiplier: number | string): number {
  return new Decimal(value).times(multiplier).toNumber();
}

/**
 * Safely divide two numbers
 */
export function safeDiv(dividend: number | string, divisor: number | string): number {
  if (new Decimal(divisor).isZero()) return 0;
  return new Decimal(dividend).dividedBy(divisor).toNumber();
}

/**
 * Round to nearest satang (2 decimal places)
 * All monetary amounts in DB are stored as satang (1/100 of baht)
 */
export function roundToSatang(value: number): number {
  return new Decimal(value).toNearest(1, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculate VAT amount from base amount and VAT rate (percentage)
 * @param baseAmount - amount in satang
 * @param vatRatePercent - VAT rate as percentage (e.g., 7 for 7%)
 * @returns VAT amount in satang
 */
export function calculateVat(baseAmount: number, vatRatePercent: number | string): number {
  if (!baseAmount || !vatRatePercent) return 0;
  return new Decimal(baseAmount)
    .times(vatRatePercent)
    .dividedBy(100)
    .toNearest(1, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/**
 * Calculate WHT (Withholding Tax) amount
 * @param baseAmount - amount in satang
 * @param whtRatePercent - WHT rate as percentage (e.g., 3 for 3%)
 * @returns WHT amount in satang
 */
export function calculateWht(baseAmount: number, whtRatePercent: number | string): number {
  if (!baseAmount || !whtRatePercent) return 0;
  return new Decimal(baseAmount)
    .times(whtRatePercent)
    .dividedBy(100)
    .toNearest(1, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/**
 * Convert Baht to Satang (multiply by 100, round)
 */
export function bahtToSatang(baht: number | string): number {
  return new Decimal(baht).times(100).toNearest(1, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Convert Satang to Baht (divide by 100)
 */
export function satangToBaht(satang: number | string): number {
  return new Decimal(satang).dividedBy(100).toNumber();
}

/**
 * Format amount in satang as Thai Baht string with thousand separators
 * e.g., 1234567 -> "12,345.67"
 */
export function formatBaht(satang: number | string): string {
  const baht = satangToBaht(satang);
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

/**
 * Calculate percentage of an amount
 * @param amount - base amount in satang
 * @param percent - percentage (e.g., 10 for 10%)
 * @returns result in satang
 */
export function calculatePercent(amount: number | string, percent: number | string): number {
  return new Decimal(amount).times(percent).dividedBy(100).toNumber();
}

/**
 * Calculate discount amount
 * @param amount - base amount in satang
 * @param discountPercent - discount percentage (e.g., 10 for 10% off)
 * @returns discount amount in satang
 */
export function calculateDiscount(amount: number | string, discountPercent: number | string): number {
  return new Decimal(amount).times(discountPercent).dividedBy(100).toNumber();
}

/**
 * Apply discount to get net amount
 */
export function applyDiscount(amount: number | string, discountPercent: number | string): number {
  const discount = calculateDiscount(amount, discountPercent);
  return new Decimal(amount).minus(discount).toNumber();
}

/**
 * Calculate exchange conversion
 * @param foreignAmount - amount in foreign currency (satang)
 * @param exchangeRate - rate (e.g., 1 unit foreign = X THB)
 * @returns amount in THB (satang)
 */
export function calculateExchange(foreignAmount: number | string, exchangeRate: number | string): number {
  return new Decimal(foreignAmount).times(exchangeRate).toNumber();
}

// Re-export Decimal for cases where you need the full object
export { Decimal };