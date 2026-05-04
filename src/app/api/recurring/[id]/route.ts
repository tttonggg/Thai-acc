import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRecurringDocument,
  updateRecurringDocument,
  deleteRecurringDocument,
  getRecurringRuns,
  RecurringDocumentValidationError,
  RecurringDocumentNotFoundError,
} from '@/lib/recurring-document-service';
import { requireAuth } from '@/lib/api-utils';
import { getCsrfTokenFromHeaders, validateCsrfToken } from '@/lib/csrf-service-server';
import { handleApiError } from '@/lib/api-error-handler';

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

// GET /api/recurring/[id] - Get single recurring document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const recurring = await getRecurringDocument(id);

    return NextResponse.json({ success: true, data: recurring });
  } catch (error: unknown) {
    if (error instanceof RecurringDocumentNotFoundError) {
      return NextResponse.json({ success: false, error: 'ไม่พบเอกสารที่เกิดซ้ำ' }, { status: 404 });
    }
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

// PATCH /api/recurring/[id] - Update recurring document
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateRecurringSchema.parse(body);

    const recurring = await updateRecurringDocument(id, validatedData as any);

    return NextResponse.json({ success: true, data: recurring });
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
    if (error instanceof RecurringDocumentNotFoundError) {
      return NextResponse.json({ success: false, error: 'ไม่พบเอกสารที่เกิดซ้ำ' }, { status: 404 });
    }
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Recurring API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทเอกสารที่เกิดซ้ำ' },
      { status: 500 }
    );
  }
}

// DELETE /api/recurring/[id] - Deactivate recurring document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteRecurringDocument(id);

    return NextResponse.json({ success: true, message: 'ลบเอกสารที่เกิดซ้ำเรียบร้อยแล้ว' });
  } catch (error: unknown) {
    if (error instanceof RecurringDocumentNotFoundError) {
      return NextResponse.json({ success: false, error: 'ไม่พบเอกสารที่เกิดซ้ำ' }, { status: 404 });
    }
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Recurring API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบเอกสารที่เกิดซ้ำ' },
      { status: 500 }
    );
  }
}
