// GR/IR Open Items Report API
// /api/reports/grir - Shows goods received but not yet invoiced
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') + 'T23:59:59')
      : new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    const vendorId = searchParams.get('vendorId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const includeInvoiced = searchParams.get('includeInvoiced') === 'true';

    // Fetch GRNs: RECEIVED or INSPECTED status, within date range, not deleted
    const grnWhere: any = {
      status: { in: ['RECEIVED', 'INSPECTED'] },
      deletedAt: null,
      date: { gte: startDate, lte: endDate },
    };
    if (vendorId) grnWhere.vendorId = vendorId;
    if (warehouseId) grnWhere.warehouseId = warehouseId;

    const grns = await prisma.goodsReceiptNote.findMany({
      where: grnWhere,
      include: {
        purchaseOrder: {
          include: {
            purchaseInvoice: {
              select: {
                id: true,
                invoiceNo: true,
                invoiceDate: true,
                subtotal: true,
                status: true,
              },
            },
          },
        },
        lines: {
          include: {
            poLine: {
              select: {
                unitPrice: true,
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Fetch all purchase invoices linked to any PO from these GRNs (for invoicedAmount calc)
    const poIds = grns.map((g) => g.poId).filter((id): id is string => !!id);
    let purchaseInvoicesByPO: Record<string, any[]> = {};

    if (poIds.length > 0) {
      const linkedPIs = await prisma.purchaseInvoice.findMany({
        where: {
          purchaseOrders: { some: { id: { in: poIds } } },
          deletedAt: null,
        },
        select: {
          id: true,
          invoiceNo: true,
          invoiceDate: true,
          subtotal: true,
          status: true,
          purchaseOrders: { select: { id: true } },
        },
      });
      for (const pi of linkedPIs) {
        for (const po of pi.purchaseOrders) {
          if (!purchaseInvoicesByPO[po.id]) purchaseInvoicesByPO[po.id] = [];
          purchaseInvoicesByPO[po.id].push(pi);
        }
      }
    }

    const now = new Date();
    const items: any[] = [];
    let totalOpenGRIR = 0;

    for (const grn of grns) {
      // receivedAmount = sum(qtyReceived * unitCost) for each line (unitCost is Float)
      const receivedAmount = grn.lines.reduce(
        (sum, line) => sum + Math.round(line.qtyReceived * line.unitCost * 100),
        0
      );

      // invoicedAmount: sum of PI subtotals linked to this PO
      const linkedPIs = grn.poId ? purchaseInvoicesByPO[grn.poId] || [] : [];
      const invoicedAmount = linkedPIs.reduce((sum: number, pi: any) => sum + pi.subtotal, 0);

      const openGRIR = receivedAmount - invoicedAmount;

      // Skip fully invoiced items unless includeInvoiced=true
      if (!includeInvoiced && openGRIR <= 0) continue;

      const daysSinceReceipt = Math.floor(
        (now.getTime() - new Date(grn.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      let agingBucket: string;
      if (daysSinceReceipt <= 30) agingBucket = 'current';
      else if (daysSinceReceipt <= 60) agingBucket = '30days';
      else if (daysSinceReceipt <= 90) agingBucket = '60days';
      else agingBucket = '90plus';

      items.push({
        id: grn.id,
        grnNo: grn.grnNo,
        date: grn.date,
        vendorId: grn.vendorId,
        poId: grn.poId,
        poNo: grn.purchaseOrder?.orderNo || null,
        receivedAmount, // satang
        invoicedAmount, // satang
        openGRIR, // satang
        daysSinceReceipt,
        agingBucket,
        invoiceCount: linkedPIs.length,
        linkedInvoices: linkedPIs.map((pi: any) => ({
          id: pi.id,
          invoiceNo: pi.invoiceNo,
          invoiceDate: pi.invoiceDate,
          subtotal: pi.subtotal,
          status: pi.status,
        })),
      });

      totalOpenGRIR += openGRIR;
    }

    // Group by vendor
    const byVendor: Record<string, { vendorId: string; openAmount: number; itemCount: number }> =
      {};
    for (const item of items) {
      if (!byVendor[item.vendorId]) {
        byVendor[item.vendorId] = { vendorId: item.vendorId, openAmount: 0, itemCount: 0 };
      }
      byVendor[item.vendorId].openAmount += item.openGRIR;
      byVendor[item.vendorId].itemCount += 1;
    }

    // Group by aging
    const byAging = {
      current: items.filter((i) => i.agingBucket === 'current').reduce((s, i) => s + i.openGRIR, 0),
      '30days': items.filter((i) => i.agingBucket === '30days').reduce((s, i) => s + i.openGRIR, 0),
      '60days': items.filter((i) => i.agingBucket === '60days').reduce((s, i) => s + i.openGRIR, 0),
      '90plus': items.filter((i) => i.agingBucket === '90plus').reduce((s, i) => s + i.openGRIR, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        items,
        summary: {
          totalOpenGRIR,
          totalItems: items.length,
          byVendor: Object.values(byVendor),
          byAging,
        },
      },
    });
  } catch (error: any) {
    console.error('GR/IR Report error:', error);
    if (error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
