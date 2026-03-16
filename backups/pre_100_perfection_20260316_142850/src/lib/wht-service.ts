import prisma from '@/lib/db';

/**
 * Auto-generates a WithholdingTax record when a Payment is made (we deduct tax from Vendor).
 * This creates a PND.3 or PND.53 record depending on the vendor type (Individual vs Corporate).
 */
export async function generateWhtFromPayment(paymentId: string) {
  // 1. Fetch the Payment and its related PurchaseInvoice through allocations
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      allocations: {
        include: {
          invoice: {
            include: {
              vendor: true,
              lines: {
                include: { product: true }
              }
            }
          }
        }
      }
    }
  });

  if (!payment || !payment.allocations || payment.allocations.length === 0) return null;

  // Get the first allocated invoice (primary invoice for this payment)
  const allocation = payment.allocations[0];
  const purchaseInvoice = allocation?.invoice;
  
  if (!purchaseInvoice) return null;

  // 2. Check if there was WHT deducted on this invoice
  if (purchaseInvoice.withholdingAmount > 0) {
    // Generate document number WHT202603-0001
    const count = await prisma.withholdingTax.count();
    const docNo = `WHT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
    
    // Determine type: PND3 for Individual, PND53 for Company
    const isCompany = purchaseInvoice.vendor.taxId?.startsWith('0') || purchaseInvoice.vendor.name.includes('บริษัท');
    const whtType = isCompany ? 'PND53' : 'PND3';
    
    // Extract primary income type from lines
    let incomeType = "ค่าบริการ"; // default
    let whtRate = purchaseInvoice.withholdingRate || 3;
    
    // Find the first service line that has an income type to determine the base
    const serviceLine = purchaseInvoice.lines.find(l => l.product?.type === 'SERVICE' && l.product?.incomeType != null);
    if (serviceLine && serviceLine.product?.incomeType) {
      incomeType = serviceLine.product.incomeType.replace(/\d+%/, '').trim() || incomeType;
    }

    // Insert record
    const whtRecord = await prisma.withholdingTax.create({
      data: {
        type: whtType as any,
        documentNo: docNo,
        documentDate: payment.paymentDate,
        documentType: 'PAYMENT',
        referenceId: payment.id,
        payeeId: purchaseInvoice.vendor.id,
        payeeName: purchaseInvoice.vendor.name,
        payeeTaxId: purchaseInvoice.vendor.taxId,
        payeeAddress: purchaseInvoice.vendor.address || "-",
        description: `WHT from Payment ${payment.paymentNo}`,
        incomeType,
        incomeAmount: Math.max(0, purchaseInvoice.subtotal - purchaseInvoice.discountAmount),
        whtRate,
        whtAmount: purchaseInvoice.withholdingAmount,
        taxMonth: payment.paymentDate.getMonth() + 1,
        taxYear: payment.paymentDate.getFullYear(),
        reportStatus: 'PENDING'
      }
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
      invoice: {
        include: {
          customer: true,
          lines: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!receipt || !receipt.invoice) return null;

  if (receipt.invoice.withholdingAmount > 0) {
    const count = await prisma.withholdingTax.count();
    const docNo = `WHT-REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
    
    const isCompany = receipt.invoice.customer.taxId?.startsWith('0') || receipt.invoice.customer.name.includes('บริษัท');
    const whtType = isCompany ? 'PND53' : 'PND3';
    
    let incomeType = "ค่าบริการ"; 
    let whtRate = receipt.invoice.withholdingRate || 3;
    
    const serviceLine = receipt.invoice.lines.find(l => l.product?.type === 'SERVICE' && l.product?.incomeType != null);
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
        payeeId: receipt.invoice.customer.id,
        payeeName: receipt.invoice.customer.name,
        payeeTaxId: receipt.invoice.customer.taxId,
        payeeAddress: receipt.invoice.customer.address || "-",
        description: `WHT from Receipt ${receipt.receiptNo}`,
        incomeType,
        incomeAmount: Math.max(0, receipt.invoice.subtotal - receipt.invoice.discountAmount),
        whtRate,
        whtAmount: receipt.invoice.withholdingAmount,
        taxMonth: receipt.receiptDate.getMonth() + 1,
        taxYear: receipt.receiptDate.getFullYear(),
        reportStatus: 'PENDING'
      }
    });

    return whtRecord;
  }
  
  return null;
}
