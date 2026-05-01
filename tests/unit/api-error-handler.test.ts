/**
 * Unit Tests for API Error Handler
 * Tests for src/lib/api-error-handler.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { z } from 'zod';
import { handleApiError, withErrorHandler, tryAsync } from '../../src/lib/api-error-handler';
import {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from '../../src/lib/errors';

describe('handleApiError', () => {
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'GET',
    });
  });

  describe('Custom AppError handling', () => {
    it('should handle AuthError correctly', async () => {
      const error = new AuthError('Please log in');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AuthError');
      expect(data.error.message).toBe('Please log in');
      expect(data.error.messageTh).toBe('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      expect(data.error.statusCode).toBe(401);
    });

    it('should handle ValidationError with fields', async () => {
      const fields = {
        email: 'Invalid email format',
        password: 'Password too short',
      };
      const error = new ValidationError('Validation failed', fields);
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.fields).toEqual(fields);
    });

    it('should handle NotFoundError', async () => {
      const error = new NotFoundError('User', '123');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NotFoundError');
      expect(data.error.messageTh).toBe('ไม่พบข้อมูลที่ค้นหา');
    });

    it('should handle ConflictError', async () => {
      const error = new ConflictError('Resource already exists');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('ConflictError');
    });

    it('should include context in error response', async () => {
      const error = new AppError('Test error', 400, true, { customField: 'customValue' });
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(data.error.context).toEqual({
        customField: 'customValue',
      });
    });
  });

  describe('Prisma Error handling', () => {
    it('should handle P2002 (unique constraint) as 409', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('DuplicateRecordError');
      expect(data.error.message).toContain('Duplicate entry');
      expect(data.error.messageTh).toContain('ข้อมูลซ้ำ');
    });

    it('should handle P2025 (record not found) as 404', async () => {
      const prismaError = {
        code: 'P2025',
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NotFoundError');
    });

    it('should handle P2003 (foreign key) as 400', async () => {
      const prismaError = {
        code: 'P2003',
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('ForeignKeyError');
    });

    it('should handle P2021 (connection timeout) as 503', async () => {
      const prismaError = {
        code: 'P2021',
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.code).toBe('DatabaseError');
    });

    it('should handle P2034 (query timeout) as 504', async () => {
      const prismaError = {
        code: 'P2034',
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.error.code).toBe('QueryTimeout');
    });

    it('should handle unknown Prisma errors as 500', async () => {
      const prismaError = {
        code: 'P9999',
        clientVersion: '6.19.2',
      };
      const response = await handleApiError(prismaError, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DatabaseError');
    });
  });

  describe('Zod Validation Error handling', () => {
    it('should handle ZodError with field details', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({
          email: 'invalid-email',
          age: 15,
        });
      } catch (error) {
        const response = await handleApiError(error, mockRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe('ValidationError');
        expect(data.error.fields).toBeDefined();
        expect(data.error.fields?.email).toBeDefined();
        expect(data.error.fields?.age).toBeDefined();
      }
    });

    it('should format Zod errors correctly', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_string',
          path: ['email'],
          message: 'Invalid email',
          expected: 'email',
          received: 'string',
        },
        {
          code: 'too_small',
          path: ['password'],
          message: 'Password too short',
          minimum: 8,
          type: 'string',
          inclusive: true,
        },
      ]);

      const response = await handleApiError(zodError, mockRequest);
      const data = await response.json();

      expect(data.error.fields).toEqual({
        email: 'Invalid email',
        password: 'Password too short',
      });
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic errors as 500', async () => {
      const error = new Error('Internal error');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('Error');
      expect(data.error.messageTh).toBe('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่');
    });

    it('should not expose internal error messages', async () => {
      const error = new Error('Sensitive database details');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(data.error.message).not.toContain('database');
      expect(data.error.message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('Error logging', () => {
    it('should log errors with request context', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new AuthError('Test error');

      await handleApiError(error, mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith('[API Error]', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Operational Error]',
        expect.objectContaining({
          url: 'http://localhost:3000/api/test',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Timestamp and metadata', () => {
    it('should include timestamp in error response', async () => {
      const error = new ValidationError('Test');
      const before = new Date();
      const response = await handleApiError(error, mockRequest);
      const after = new Date();

      const data = await response.json();
      const timestamp = new Date(data.error.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include statusCode in error response', async () => {
      const error = new NotFoundError('Test');
      const response = await handleApiError(error, mockRequest);
      const data = await response.json();

      expect(data.error.statusCode).toBe(404);
    });
  });
});

describe('withErrorHandler', () => {
  it('should wrap successful handlers', async () => {
    const mockHandler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ success: true, data: 'test' }));

    const wrappedHandler = withErrorHandler(mockHandler);
    const request = new Request('http://localhost:3000/api/test');

    const response = await wrappedHandler(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBe('test');
  });

  it('should catch and handle errors in handlers', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new NotFoundError('User', '123'));

    const wrappedHandler = withErrorHandler(mockHandler);
    const request = new Request('http://localhost:3000/api/test');

    const response = await wrappedHandler(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NotFoundError');
  });

  it('should pass request to handler', async () => {
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));

    const wrappedHandler = withErrorHandler(mockHandler);
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
    });

    await wrappedHandler(request);

    expect(mockHandler).toHaveBeenCalledWith(request);
  });
});

describe('tryAsync', () => {
  it('should return data on success', async () => {
    const operation = Promise.resolve('success data');

    const [data, error] = await tryAsync(operation);

    expect(data).toBe('success data');
    expect(error).toBeNull();
  });

  it('should return error on failure', async () => {
    const error = new Error('Operation failed');
    const operation = Promise.reject(error);

    const [data, err] = await tryAsync(operation);

    expect(data).toBeNull();
    expect(err).toBe(error);
  });

  it('should handle database operations', async () => {
    const successOp = Promise.resolve({ id: '1', name: 'Test' });
    const [data, error] = await tryAsync(successOp);

    expect(data).toEqual({ id: '1', name: 'Test' });
    expect(error).toBeNull();
  });

  it('should handle validation errors', async () => {
    const validationError = new ValidationError('Invalid');
    const failOp = Promise.reject(validationError);

    const [data, error] = await tryAsync(failOp);

    expect(data).toBeNull();
    expect(error).toBe(validationError);
  });

  it('should be usable in API routes', async () => {
    // Simulate API route usage
    async function mockApiCall() {
      return { user: { id: '1', name: 'Test' } };
    }

    const [data, error] = await tryAsync(mockApiCall());

    if (error) {
      const response = await handleApiError(error, new Request('http://localhost:3000/api/test'));
      expect(response.status).toBeGreaterThanOrEqual(400);
    } else {
      expect(data).toBeDefined();
      expect(data?.user).toBeDefined();
    }
  });
});
