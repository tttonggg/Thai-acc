/**
 * GET /api/portal/invoices
 * List invoices for the authenticated portal customer.
 * Query params: status (ALL|OUTSTANDING|OVERDUE|ISSUED|PARTIAL|PAID), page, pageSize, search
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCustomerInvoices } from '@/lib/portal-invoice-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = request.headers.get('x-customer-id');
    const status = searchParams.get('status') as 'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'ISSUED' | 'PARTIAL' | 'PAID' | undefined;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const search = searchParams.get('search') ?? undefined;

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getCustomerInvoices(customerId, { status, page, pageSize, search });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Portal invoices list error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}
