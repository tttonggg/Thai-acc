// B3. Tax Form Detail API
// API สำหรับดู/ลบแบบฟอร์มภาษี

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, errorResponse } from '@/lib/api-utils';

// GET /api/tax-forms/[id] - Get tax form detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  try {
    const { id } = await params;
    const taxForm = await prisma.taxForm.findUnique({
      where: { id },
      include: { lines: { orderBy: { lineNo: 'asc' } } },
    });

    if (!taxForm) {
      return errorResponse('Tax form not found', 404);
    }

    return apiResponse({ taxForm });
  } catch (error) {
    console.error('Error fetching tax form:', error);
    return errorResponse('Failed to fetch tax form', 500);
  }
}

// DELETE /api/tax-forms/[id] - Delete tax form (only draft)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
    return errorResponse('Forbidden', 403);
  }

  try {
    const { id } = await params;
    const taxForm = await prisma.taxForm.findUnique({
      where: { id },
    });

    if (!taxForm) {
      return errorResponse('Tax form not found', 404);
    }

    if (taxForm.status !== 'DRAFT') {
      return errorResponse('Cannot delete submitted or filed tax form', 400);
    }

    // Delete lines first
    await prisma.taxFormLine.deleteMany({
      where: { taxFormId: id },
    });

    await prisma.taxForm.delete({
      where: { id },
    });

    return apiResponse({ message: 'Tax form deleted' });
  } catch (error) {
    console.error('Error deleting tax form:', error);
    return errorResponse('Failed to delete tax form', 500);
  }
}
