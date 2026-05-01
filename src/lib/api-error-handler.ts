/**
 * Unified API Error Handler
 *
 * Provides consistent error responses across all API routes
 * with proper HTTP status codes and Thai/English error messages
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  BusinessLogicError,
  RateLimitError,
  getStatusCode,
  getErrorMessage,
  logError,
  isAuthError,
  isValidationError,
  isNotFoundError,
} from './errors';

// ============================================================================
// Thai Error Messages
// ============================================================================

const THAI_ERROR_MESSAGES: Record<string, string> = {
  // Authentication & Authorization
  AuthError: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
  ForbiddenError: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',

  // Validation
  ValidationError: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
  ZodError: 'รูปแบบข้อมูลไม่ถูกต้อง',

  // Not Found
  NotFoundError: 'ไม่พบข้อมูลที่ค้นหา',

  // Conflict
  ConflictError: 'ข้อมูลซ้ำ หรือมีการใช้งานอยู่',
  DuplicateRecordError: 'ข้อมูลนี้มีอยู่ในระบบแล้ว',

  // Database
  DatabaseError: 'เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล กรุณาลองใหม่',
  QueryError: 'การค้นหาข้อมูลผิดพลาด',
  TransactionError: 'การบันทึกข้อมูลผิดพลาด',

  // Business Logic
  BusinessLogicError: 'ไม่สามารถดำเนินการได้ กรุณาตรวจสอบเงื่อนไข',
  AccountingError: 'เกิดข้อผิดพลาดทางการบัญชี',
  DebitCreditMismatchError: 'ยอดเดบิตและเครดิตไม่เท่ากัน',
  InsufficientStockError: 'สินค้าในคลังไม่เพียงพอ',

  // Rate Limiting
  RateLimitError: 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่',

  // Service Unavailable
  ServiceUnavailableError: 'บริการไม่พร้อมใช้งานในขณะนี้',

  // Generic
  Error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่',
};

// ============================================================================
// Error Response Builder
// ============================================================================

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    messageTh?: string;
    code?: string;
    statusCode: number;
    fields?: Record<string, string>;
    context?: Record<string, any>;
    timestamp: string;
  };
}

function buildErrorResponse(error: Error, req?: Request): ErrorResponse {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error);
  const errorName = error.name || 'Error';
  const messageTh = THAI_ERROR_MESSAGES[errorName] || THAI_ERROR_MESSAGES['Error'];

  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      messageTh,
      code: errorName,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Add validation fields if available
  if (isValidationError(error) && error.fields) {
    response.error.fields = error.fields;
  }

  // Add context for operational errors
  if (error instanceof AppError && error.context) {
    response.error.context = error.context;
  }

  // Log the error
  logError(error, {
    url: req?.url,
    method: req?.method,
  });

  return response;
}

// ============================================================================
// Main Error Handler
// ============================================================================

export function handleApiError(error: unknown, req?: Request): NextResponse<ErrorResponse> {
  console.error('[API Error]', error);

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error as PrismaError, req);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        messageTh: THAI_ERROR_MESSAGES['ZodError'],
        code: 'ValidationError',
        statusCode: 400,
        fields: formatZodErrors(error),
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Handle our custom AppErrors
  if (error instanceof AppError) {
    const errorResponse = buildErrorResponse(error, req);
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Handle generic errors
  const errorResponse = buildErrorResponse(error as Error, req);
  return NextResponse.json(errorResponse, { status: 500 });
}

// ============================================================================
// Prisma Error Handler
// ============================================================================

interface PrismaError {
  code: string;
  meta?: Record<string, any>;
  clientVersion: string;
}

function isPrismaError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && 'clientVersion' in error;
}

function handlePrismaError(error: PrismaError, req?: Request): NextResponse<ErrorResponse> {
  console.error('[Prisma Error]', error.code, error.meta);

  switch (error.code) {
    // Unique constraint violation
    case 'P2002':
      const uniqueConstraint = (error.meta?.target as string[]) || [];
      const field = uniqueConstraint.join(', ');
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Duplicate entry for field: ${field}`,
            messageTh: 'ข้อมูลซ้ำ กรุณาตรวจสอบข้อมูลที่ซ้ำกัน',
            code: 'DuplicateRecordError',
            statusCode: 409,
            context: { field },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );

    // Record not found
    case 'P2025':
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Record not found',
            messageTh: THAI_ERROR_MESSAGES['NotFoundError'],
            code: 'NotFoundError',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );

    // Foreign key constraint
    case 'P2003':
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Related record not found',
            messageTh: 'ไม่พบข้อมูลที่เกี่ยวข้อง',
            code: 'ForeignKeyError',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );

    // Connection timeout
    case 'P2021':
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection failed',
            messageTh: THAI_ERROR_MESSAGES['DatabaseError'],
            code: 'DatabaseError',
            statusCode: 503,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );

    // Query timeout
    case 'P2034':
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Query execution timeout',
            messageTh: 'การค้นหาข้อมูลใช้เวลานานเกินไป',
            code: 'QueryTimeout',
            statusCode: 504,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 504 }
      );

    default:
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database operation failed',
            messageTh: THAI_ERROR_MESSAGES['DatabaseError'],
            code: 'DatabaseError',
            statusCode: 500,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
  }
}

// ============================================================================
// Zod Error Formatter
// ============================================================================

function formatZodErrors(zodError: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  zodError.issues.forEach((err) => {
    const path = err.path.join('.');
    fields[path] = err.message || 'Invalid value';
  });

  return fields;
}

// ============================================================================
// Async Route Wrapper
// ============================================================================

/**
 * Wraps async API route handlers with automatic error handling
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await prisma.user.findMany();
 *   return NextResponse.json({ success: true, data });
 * });
 * ```
 */
export function withErrorHandler<T>(
  handler: (req: Request) => Promise<T>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    try {
      return (await handler(req)) as NextResponse;
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}

// ============================================================================
// Try-Catch Helper
// ============================================================================

/**
 * Executes an async operation and returns [data, error] tuple
 * Useful for avoiding try-catch blocks in API routes
 *
 * @example
 * ```typescript
 * const [data, error] = await tryAsync(
 *   prisma.user.findUnique({ where: { id } })
 * );
 *
 * if (error) {
 *   return handleApiError(error);
 * }
 *
 * return NextResponse.json({ success: true, data });
 * ```
 */
export async function tryAsync<T>(operation: Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const data = await operation;
    return [data, null];
  } catch (error) {
    return [null, error as Error];
  }
}
