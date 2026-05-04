import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createRecurringDocument,
  listRecurringDocuments,
  getRecurringDocument,
  updateRecurringDocument,
  deleteRecurringDocument,
  RecurringDocumentValidationError,
  RecurringDocumentNotFoundError,
} from '@/lib/recurring-document-service';
import { requireAuth } from '@/lib/api-utils';
import { getCsrfTokenFromHeaders, validateCsrfToken } from '@/lib/csrf-service-server';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema for create
const createRecurringSchema = z.object({
  type: z.enum(['INVOICE', 'EXPENSE', 'RECEIPT']),
  referenceId: z.string().optional().nullable(),
  title: z.string().min(1, 'ต้องระบุชื่อ'),
  description: z.string().optional().nullable(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.number().int().min(1).max(28),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  isActive: z.boolean().optional().default(true),
});

// Validation schema for update
const updateRecurringSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

// GET /api/recurring - List recurring documents
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const type = searchParams.get('type') as 'INVOICE' | 'EXPENSE' | 'RECEIPT' | null;
    const isActiveParam = searchParams.get('isActive');

    const isActive =
      isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const result = await listRecurringDocuments({
      type: type || undefined,
      isActive,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: unknown) {
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Recurring API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST /api/recurring - Create recurring document
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // CSRF validation
    const bypassCsrf = process.env.BYPASS_CSRF === 'true' || process.env.NODE_ENV === 'development';
    if (!bypassCsrf) {
      const csrfToken = getCsrfTokenFromHeaders(request.headers);
      const sessionId =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value ||
        request.headers.get('x-session-id') ||
        user.id;

      if (!csrfToken || !(await validateCsrfToken(csrfToken, sessionId))) {
        return NextResponse.json(
          { success: false, error: 'CSRF token ไม่ถูกต้องหรือหมดอายุ' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validatedData = createRecurringSchema.parse(body);

    const recurring = await createRecurringDocument({
      ...validatedData,
      createdBy: user.id,
    } as any);

    return NextResponse.json({ success: true, data: recurring }, { status: 201 });
  } catch (error: unknown) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof RecurringDocumentValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Recurring API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างเอกสารที่เกิดซ้ำ' },
      { status: 500 }
    );
  }
}
