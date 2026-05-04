import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: null });
    }

    const where = {
      OR: [
        { name: { contains: q } },
        { code: { contains: q } },
        { description: { contains: q } },
      ],
      deletedAt: null,
    };

    const [customers, vendors, products] = await Promise.all([
      db.customer.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { code: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { taxId: { contains: q } },
          ],
          deletedAt: null,
        },
        take: limit,
        select: { id: true, name: true, code: true, email: true, phone: true },
      }),
      db.vendor.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { code: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { taxId: { contains: q } },
          ],
          deletedAt: null,
        },
        take: limit,
        select: { id: true, name: true, code: true, email: true, phone: true },
      }),
      db.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { code: { contains: q } },
            { barcode: { contains: q } },
          ],
          deletedAt: null,
        },
        take: limit,
        select: { id: true, name: true, code: true, unit: true },
      }),
    ]);

    // Search invoices
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { invoiceNo: { contains: q } },
          { customerName: { contains: q } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        invoiceNo: true,
        customerName: true,
        totalAmount: true,
        status: true,
      },
    });

    // Search receipts
    const receipts = await db.receipt.findMany({
      where: {
        OR: [
          { receiptNo: { contains: q } },
          { customerName: { contains: q } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        receiptNo: true,
        customerName: true,
        amount: true,
        status: true,
      },
    });

    // Search payments
    const payments = await db.payment.findMany({
      where: {
        OR: [
          { paymentNo: { contains: q } },
          { vendorName: { contains: q } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        paymentNo: true,
        vendorName: true,
        amount: true,
        status: true,
      },
    });

    // Search journal entries
    const journalEntries = await db.journalEntry.findMany({
      where: {
        OR: [
          { documentNumber: { contains: q } },
          { description: { contains: q } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        documentNumber: true,
        description: true,
        entryDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      results: {
        customers,
        vendors,
        products,
        invoices,
        receipts,
        payments,
        journalEntries,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
