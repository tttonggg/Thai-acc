import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { customerSchema } from '@/lib/validations';

// GET /api/customers/[id] - Get single customer
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { invoiceDate: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!customer) {
      return notFoundError('ไม่พบลูกค้า');
    }

    return apiResponse(customer);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า');
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // IDOR Protection: Only ADMIN and ACCOUNTANT can update customers
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return forbiddenError();
    }

    const body = await request.json();
    const validatedData = customerSchema.partial().parse(body);

    const existing = await db.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundError('ไม่พบลูกค้า');
    }

    // Check for duplicate code
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await db.customer.findUnique({
        where: { code: validatedData.code },
      });
      if (duplicate) {
        return apiError('รหัสลูกค้านี้มีอยู่แล้วในระบบ');
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: validatedData,
    });

    return apiResponse(customer);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขลูกค้า');
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // IDOR Protection: Only ADMIN can delete customers
    if (user.role !== 'ADMIN') {
      return forbiddenError();
    }

    const existing = await db.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!existing) {
      return notFoundError('ไม่พบลูกค้า');
    }

    if (existing._count.invoices > 0) {
      return apiError('ไม่สามารถลบลูกค้าที่มีธุรกรรมแล้วได้');
    }

    // TODO: H-08 Hard delete intentionally allowed here - customer has no active transactions
    // and ADMIN has explicitly verified this is a true data cleanup (not a soft-delete rollback scenario)
    await db.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return apiResponse({ message: 'ลบลูกค้าสำเร็จ' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการลบลูกค้า');
  }
}
