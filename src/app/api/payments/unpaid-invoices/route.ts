import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError, unauthorizedError } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';

// GET /api/payments/unpaid-invoices?vendorId=xxx - Get unpaid purchase invoices for allocation
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return apiError('กรุณาระบุผู้ขาย');
    }

    // Get unpaid purchase invoices for this vendor
    const invoices = await db.purchaseInvoice.findMany({
      where: {
        vendorId: vendorId,
        status: {
          in: ['ISSUED', 'PARTIAL'], // Not DRAFT, PAID, or CANCELLED
        },
      },
      orderBy: {
        invoiceDate: 'asc', // Oldest first
      },
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        vendor: {
          select: {
            id: true,
            name: true,
            taxId: true,
          },
        },
      },
    });

    // Calculate balance and format
    const unpaidInvoices = invoices
      .map((invoice) => {
        const balance = invoice.totalAmount - invoice.paidAmount;
        return {
          ...invoice,
          balance: Math.max(0, balance),
          canAllocate: balance > 0,
        };
      })
      .filter((inv) => inv.canAllocate);

    // Calculate total AP balance for this vendor
    const totalAPBalance = unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0);

    return apiResponse({
      invoices: unpaidInvoices,
      totalAPBalance,
      vendorId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบซื้อค้างจ่าย');
  }
}
