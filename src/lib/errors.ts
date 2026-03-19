/**
 * Custom Error Classes for Thai Accounting ERP
 *
 * Provides a hierarchy of error types for better error handling
 * and user-friendly error messages in Thai and English
 */

// ============================================================================
// Base Application Error
// ============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// ============================================================================
// Authentication & Authorization Errors (401, 403)
// ============================================================================

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 401, true, context);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 403, true, context);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

// ============================================================================
// Validation Errors (400)
// ============================================================================

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(
    message: string,
    fields?: Record<string, string>,
    context?: Record<string, any>
  ) {
    super(message, 400, true, context);
    this.name = 'ValidationError';
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

// ============================================================================
// Not Found Errors (404)
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 404, true, { resource, identifier });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// ============================================================================
// Conflict Errors (409)
// ============================================================================

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DuplicateRecordError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      { resource, field, value }
    );
    this.name = 'DuplicateRecordError';
    Object.setPrototypeOf(this, DuplicateRecordError.prototype);
  }
}

// ============================================================================
// Database Errors (500)
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, false, {
      originalMessage: originalError?.message,
      originalStack: originalError?.stack,
    });
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class QueryError extends DatabaseError {
  constructor(query: string, originalError?: Error) {
    super(`Database query failed: ${query}`, originalError);
    this.name = 'QueryError';
    this.context = { ...this.context, query };
    Object.setPrototypeOf(this, QueryError.prototype);
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'TransactionError';
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

// ============================================================================
// Business Logic Errors
// ============================================================================

export class BusinessLogicError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 422, true, context);
    this.name = 'BusinessLogicError';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

export class AccountingError extends BusinessLogicError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    this.name = 'AccountingError';
    Object.setPrototypeOf(this, AccountingError.prototype);
  }
}

export class DebitCreditMismatchError extends AccountingError {
  constructor(debitTotal: number, creditTotal: number) {
    super(
      `Journal entry must balance: debits (${debitTotal}) ≠ credits (${creditTotal})`,
      { debitTotal, creditTotal, difference: Math.abs(debitTotal - creditTotal) }
    );
    this.name = 'DebitCreditMismatchError';
    Object.setPrototypeOf(this, DebitCreditMismatchError.prototype);
  }
}

export class InsufficientStockError extends BusinessLogicError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
      { productId, requested, available }
    );
    this.name = 'InsufficientStockError';
    Object.setPrototypeOf(this, InsufficientStockError.prototype);
  }
}

// ============================================================================
// Rate Limiting Errors (429)
// ============================================================================

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests. Please try again later.',
      429,
      true,
      { retryAfter }
    );
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// ============================================================================
// Service Unavailable Errors (503)
// ============================================================================

export class ServiceUnavailableError extends AppError {
  constructor(service: string, reason?: string) {
    const reasonText = reason ? `: ${reason}` : '';
    super(
      `${service} is currently unavailable${reasonText}`,
      503,
      true,
      { service, reason }
    );
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isAuthError(error: Error): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: Error): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isDatabaseError(error: Error): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// ============================================================================
// Error Utilities
// ============================================================================

export function getStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

export function getErrorMessage(error: Error): string {
  if (isOperationalError(error)) {
    return error.message;
  }
  // Hide internal errors from users
  return 'An unexpected error occurred. Please try again.';
}

export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  if (isOperationalError(error)) {
    console.warn('[Operational Error]', errorInfo);
  } else {
    console.error('[Unexpected Error]', errorInfo);
  }
}
