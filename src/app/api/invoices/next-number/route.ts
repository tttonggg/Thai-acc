import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';

/**
 * GET /api/invoices/next-number
 * Get the next available invoice number
 * Pattern: INV-YYYY-NNNN (e.g., INV-2567-0001)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    // Get current Thai year (Buddhist era)
    const now = new Date();
    const thaiYear = now.getFullYear() + 543; // Convert to Buddhist year

    // Build prefix pattern
    const prefix = `INV-${thaiYear}`;

    // Find last invoice number for this year
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNo: 'desc',
      },
      select: {
        invoiceNo: true,
      },
    });

    let nextNum = 1;
    if (lastInvoice) {
      // Extract the number part from the last invoice
      const parts = lastInvoice.invoiceNo.split('-');
      const lastNum = parseInt(parts[parts.length - 1] || '0', 10);
      nextNum = lastNum + 1;
    }

    // Format the invoice number with zero padding
    const invoiceNo = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    return NextResponse.json({
      success: true,
      invoiceNo,
    });
  } catch (error: any) {
    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างเลขที่ใบกำกับภาษี',
      },
      { status: 500 }
    );
  }
}
