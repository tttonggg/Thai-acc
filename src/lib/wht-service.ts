import prisma from '@/lib/db';

/**
 * Auto-generates a WithholdingTax record when a Payment is made (we deduct tax from Vendor).
 * This creates a PND.3 or PND.53 record depending on the vendor type (Individual vs Corporate).
 * @param tx - Optional Prisma transaction client for atomicity with caller transactions.
 */
export async function generateWhtFromPayment(paymentId: string, tx: any = prisma) {
  // 1. Fetch the Payment and its related PurchaseInvoice through allocations
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: {
      allocations: {
        include: {
          invoice: {
            include: {
              vendor: true,
              lines: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment || !payment.allocations || payment.allocations.length === 0) return null;

  // Get the first allocated invoice (primary invoice for this payment)
  const allocation = payment.allocations[0];
  const purchaseInvoice = allocation?.invoice;

  if (!purchaseInvoice) return null;

  // 2. Check if there was WHT deducted on this invoice
  if (purchaseInvoice.withholdingAmount > 0) {
    // Generate document number WHT202603-0001
    const count = await tx.withholdingTax.count();
    const docNo = `WHT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Determine type: PND3 for Individual, PND53 for Company
    const isCompany =
      purchaseInvoice.vendor.taxId?.startsWith('0') ||
      purchaseInvoice.vendor.name.includes('บริษัท');
    const whtType = isCompany ? 'PND53' : 'PND3';

    // Extract primary income type from lines
    let incomeType = 'ค่าบริการ'; // default
    let whtRate = purchaseInvoice.withholdingRate || 3;

    // Find the first service line that has an income type to determine the base
    const serviceLine = purchaseInvoice.lines.find(
      (l) => l.product?.type === 'SERVICE' && l.product?.incomeType != null
    );
    if (serviceLine && serviceLine.product?.incomeType) {
      incomeType = serviceLine.product?.incomeType.replace(/\d+%/, '').trim() || incomeType;
    }

    // Insert record
    const whtRecord = await tx.withholdingTax.create({
      data: {
        type: whtType as any,
        documentNo: docNo,
        documentDate: payment.paymentDate,
        documentType: 'PAYMENT',
        referenceId: payment.id,
        payeeId: purchaseInvoice.vendor.id,
        payeeName: purchaseInvoice.vendor.name,
        payeeTaxId: purchaseInvoice.vendor.taxId,
        payeeAddress: purchaseInvoice.vendor.address || '-',
        description: `WHT from Payment ${payment.paymentNo}`,
        incomeType,
        incomeAmount: Math.max(0, purchaseInvoice.subtotal - purchaseInvoice.discountAmount),
        whtRate,
        whtAmount: purchaseInvoice.withholdingAmount,
        taxMonth: payment.paymentDate.getMonth() + 1,
        taxYear: payment.paymentDate.getFullYear(),
        reportStatus: 'PENDING',
      },
    });

    return whtRecord;
  }

  return null;
}

/**
 * Auto-generates a WithholdingTax record when a Receipt is created (customer deducts tax from us).
 */
export async function generateWhtFromReceipt(receiptId: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      allocations: {
        include: {
          invoice: {
            include: {
              customer: true,
              lines: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  if (!receipt || !receipt.allocations || receipt.allocations.length === 0) return null;

  const results: Awaited<ReturnType<typeof prisma.withholdingTax.create>>[] = [];

  for (const allocation of receipt.allocations) {
    const invoice = allocation.invoice;
    if (!invoice || invoice.withholdingAmount <= 0) continue;

    const count = await prisma.withholdingTax.count();
    const docNo = `WHT-REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const isCompany =
      invoice.customer.taxId?.startsWith('0') || invoice.customer.name.includes('บริษัท');
    const whtType = isCompany ? 'PND53' : 'PND3';

    let incomeType = 'ค่าบริการ';
    let whtRate = invoice.withholdingRate || 3;

    const serviceLine = invoice.lines.find(
      (l) => l.product?.type === 'SERVICE' && l.product?.incomeType != null
    );
    if (serviceLine && serviceLine.product?.incomeType) {
      incomeType = serviceLine.product.incomeType.replace(/\d+%/, '').trim() || incomeType;
    }

    const whtRecord = await prisma.withholdingTax.create({
      data: {
        type: whtType as any,
        documentNo: docNo,
        documentDate: receipt.receiptDate,
        documentType: 'RECEIPT',
        referenceId: receipt.id,
        payeeId: invoice.customer.id,
        payeeName: invoice.customer.name,
        payeeTaxId: invoice.customer.taxId,
        payeeAddress: invoice.customer.address || '-',
        description: `WHT from Receipt ${receipt.receiptNo}`,
        incomeType,
        incomeAmount: Math.max(0, invoice.subtotal - invoice.discountAmount),
        whtRate,
        whtAmount: invoice.withholdingAmount,
        taxMonth: receipt.receiptDate.getMonth() + 1,
        taxYear: receipt.receiptDate.getFullYear(),
        reportStatus: 'PENDING',
      },
    });

    results.push(whtRecord);
  }

  return results.length > 0 ? results : null;
}
