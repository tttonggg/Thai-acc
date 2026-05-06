/**
 * GET /api/portal/invoices/[id]
 * Get invoice detail for the authenticated portal customer.
 * Verifies customerId ownership — throws 404 if mismatch.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceDetail } from '@/lib/portal-invoice-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = request.headers.get('x-customer-id');
    const { id } = await params;

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await getInvoiceDetail(id, customerId);

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบกำกับภาษี' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Portal invoice detail error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}
