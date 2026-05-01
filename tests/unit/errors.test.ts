/**
 * Unit Tests for Error Classes
 * Tests for src/lib/errors.ts
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DuplicateRecordError,
  DatabaseError,
  QueryError,
  TransactionError,
  BusinessLogicError,
  AccountingError,
  DebitCreditMismatchError,
  InsufficientStockError,
  RateLimitError,
  ServiceUnavailableError,
  isAuthError,
  isValidationError,
  isNotFoundError,
  isDatabaseError,
  isOperationalError,
  getStatusCode,
  getErrorMessage,
  logError,
} from '../../src/lib/errors';

describe('AppError', () => {
  it('should create base AppError with default values', () => {
    const error = new AppError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.name).toBeDefined();
    expect(error.constructor.name).toBe('AppError');
  });

  it('should create AppError with custom values', () => {
    const error = new AppError('Custom error', 418, false, { customField: 'value' });

    expect(error.statusCode).toBe(418);
    expect(error.isOperational).toBe(false);
    expect(error.context).toEqual({ customField: 'value' });
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError('Test', 400, true, { field: 'value' });
    const json = error.toJSON();

    expect(json).toMatchObject({
      message: 'Test',
      statusCode: 400,
      context: { field: 'value' },
      timestamp: error.timestamp.toISOString(),
    });
    expect(json.name).toBeDefined();
  });

  it('should maintain stack trace', () => {
    const error = new AppError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('at ');
    expect(error.stack).toContain('Test error');
  });
});

describe('Authentication & Authorization Errors', () => {
  describe('AuthError', () => {
    it('should create AuthError with 401 status', () => {
      const error = new AuthError('Please log in');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Please log in');
      expect(isAuthError(error)).toBe(true);
    });

    it('should include context', () => {
      const error = new AuthError('Invalid token', { tokenId: '123' });

      expect(error.context).toEqual({ tokenId: '123' });
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with 403 status', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
      expect(error.message).toBe('Access denied');
    });
  });
});

describe('Validation Errors', () => {
  describe('ValidationError', () => {
    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid data');

      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(isValidationError(error)).toBe(true);
    });

    it('should include field-level errors', () => {
      const fields = {
        email: 'Invalid email format',
        age: 'Must be 18 or older',
      };
      const error = new ValidationError('Validation failed', fields);

      expect(error.fields).toEqual(fields);
    });

    it('should serialize fields in JSON', () => {
      const fields = { name: 'Required' };
      const error = new ValidationError('Failed', fields);
      const json = error.toJSON();

      expect(json.fields).toEqual(fields);
    });
  });
});

describe('Not Found Errors', () => {
  describe('NotFoundError', () => {
    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('User', '123');

      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
      expect(isNotFoundError(error)).toBe(true);
    });

    it('should generate message with identifier', () => {
      const error = new NotFoundError('User', 'abc-123');

      expect(error.message).toBe('User not found: abc-123');
    });

    it('should generate message without identifier', () => {
      const error = new NotFoundError('Resource');

      expect(error.message).toBe('Resource not found');
    });

    it('should include resource and identifier in context', () => {
      const error = new NotFoundError('Product', 'prod-123');

      expect(error.context).toEqual({
        resource: 'Product',
        identifier: 'prod-123',
      });
    });
  });
});

describe('Conflict Errors', () => {
  describe('ConflictError', () => {
    it('should create ConflictError with 409 status', () => {
      const error = new ConflictError('Resource conflict');

      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('DuplicateRecordError', () => {
    it('should create DuplicateRecordError with details', () => {
      const error = new DuplicateRecordError('User', 'email', 'test@example.com');

      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('DuplicateRecordError');
      expect(error.message).toContain('email');
      expect(error.message).toContain('test@example.com');
    });

    it('should include conflict details in context', () => {
      const error = new DuplicateRecordError('Product', 'sku', 'SKU-123');

      expect(error.context).toEqual({
        resource: 'Product',
        field: 'sku',
        value: 'SKU-123',
      });
    });
  });
});

describe('Database Errors', () => {
  describe('DatabaseError', () => {
    it('should create DatabaseError with 500 status', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Query failed', originalError);

      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('DatabaseError');
      expect(error.isOperational).toBe(false);
      expect(isDatabaseError(error)).toBe(true);
    });

    it('should wrap original error details', () => {
      const originalError = new Error('SQL error');
      const error = new DatabaseError('Failed', originalError);

      expect(error.context?.originalMessage).toBe('SQL error');
      expect(error.context?.originalStack).toBeDefined();
    });
  });

  describe('QueryError', () => {
    it('should create QueryError with query details', () => {
      const originalError = new Error('Syntax error');
      const error = new QueryError('SELECT * FROM users', originalError);

      expect(error.name).toBe('QueryError');
      expect(error.message).toContain('SELECT * FROM users');
      expect(error.context?.query).toBe('SELECT * FROM users');
    });
  });

  describe('TransactionError', () => {
    it('should create TransactionError', () => {
      const error = new TransactionError('Transaction failed');

      expect(error.name).toBe('TransactionError');
      expect(error.message).toBe('Transaction failed');
    });
  });
});

describe('Business Logic Errors', () => {
  describe('BusinessLogicError', () => {
    it('should create BusinessLogicError with 422 status', () => {
      const error = new BusinessLogicError('Invalid operation');

      expect(error.statusCode).toBe(422);
      expect(error.name).toBe('BusinessLogicError');
    });
  });

  describe('AccountingError', () => {
    it('should create AccountingError', () => {
      const error = new AccountingError('Balance mismatch');

      expect(error.name).toBe('AccountingError');
      expect(error).toBeInstanceOf(BusinessLogicError);
    });
  });

  describe('DebitCreditMismatchError', () => {
    it('should create DebitCreditMismatchError with calculations', () => {
      const error = new DebitCreditMismatchError(1000, 950);

      expect(error.name).toBe('DebitCreditMismatchError');
      expect(error.message).toContain('1000');
      expect(error.message).toContain('950');
      expect(error.context).toEqual({
        debitTotal: 1000,
        creditTotal: 950,
        difference: 50,
      });
    });
  });

  describe('InsufficientStockError', () => {
    it('should create InsufficientStockError with details', () => {
      const error = new InsufficientStockError('PROD-123', 10, 5);

      expect(error.name).toBe('InsufficientStockError');
      expect(error.message).toContain('PROD-123');
      expect(error.message).toContain('10');
      expect(error.message).toContain('5');
      expect(error.context).toEqual({
        productId: 'PROD-123',
        requested: 10,
        available: 5,
      });
    });
  });
});

describe('Rate Limiting Errors', () => {
  describe('RateLimitError', () => {
    it('should create RateLimitError with 429 status', () => {
      const error = new RateLimitError(60);

      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
      expect(error.message).toContain('Too many requests');
      expect(error.context?.retryAfter).toBe(60);
    });

    it('should create without retry time', () => {
      const error = new RateLimitError();

      expect(error.context?.retryAfter).toBeUndefined();
    });
  });
});

describe('Service Unavailable Errors', () => {
  describe('ServiceUnavailableError', () => {
    it('should create ServiceUnavailableError with 503 status', () => {
      const error = new ServiceUnavailableError('Database', 'Maintenance');

      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('ServiceUnavailableError');
      expect(error.message).toContain('Database');
      expect(error.message).toContain('Maintenance');
    });

    it('should create without reason', () => {
      const error = new ServiceUnavailableError('API');

      expect(error.message).toBe('API is currently unavailable');
    });
  });
});

describe('Type Guards', () => {
  it('should correctly identify AuthError', () => {
    const error = new AuthError('Test');
    expect(isAuthError(error)).toBe(true);
    expect(isAuthError(new Error('Test'))).toBe(false);
  });

  it('should correctly identify ValidationError', () => {
    const error = new ValidationError('Test');
    expect(isValidationError(error)).toBe(true);
    expect(isValidationError(new Error('Test'))).toBe(false);
  });

  it('should correctly identify NotFoundError', () => {
    const error = new NotFoundError('Test');
    expect(isNotFoundError(error)).toBe(true);
    expect(isNotFoundError(new Error('Test'))).toBe(false);
  });

  it('should correctly identify DatabaseError', () => {
    const error = new DatabaseError('Test');
    expect(isDatabaseError(error)).toBe(true);
    expect(isDatabaseError(new Error('Test'))).toBe(false);
  });

  it('should correctly identify operational errors', () => {
    const operationalError = new AuthError('Test');
    const nonOperationalError = new DatabaseError('Test');

    expect(isOperationalError(operationalError)).toBe(true);
    expect(isOperationalError(nonOperationalError)).toBe(false);
    expect(isOperationalError(new Error('Test'))).toBe(false);
  });
});

describe('Error Utilities', () => {
  describe('getStatusCode', () => {
    it('should return status code from AppError', () => {
      const error = new NotFoundError('Test');
      expect(getStatusCode(error)).toBe(404);
    });

    it('should return 500 for generic errors', () => {
      const error = new Error('Test');
      expect(getStatusCode(error)).toBe(500);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message for operational errors', () => {
      const error = new ValidationError('Invalid data');
      expect(getErrorMessage(error)).toBe('Invalid data');
    });

    it('should return generic message for non-operational errors', () => {
      const error = new Error('Internal error details');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('logError', () => {
    it('should log operational errors as warnings', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const error = new ValidationError('Test error');

      logError(error);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Operational Error]',
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Test error',
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log non-operational errors as errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const error = new Error('Unexpected error');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Unexpected Error]',
        expect.objectContaining({
          message: 'Unexpected error',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should include context in logs', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const error = new AuthError('Test', { userId: '123' });

      logError(error, { url: '/api/test' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Operational Error]',
        expect.objectContaining({
          context: { url: '/api/test' },
        })
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
