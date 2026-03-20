/**
 * Receipt PDF Export API Route
 * เส้นทาง API สำหรับส่งออกใบเสร็จรับเงินเป็น PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { formatThaiDate, formatCurrency } from '@/lib/thai-accounting'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch receipt with all related data
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: true
          }
        }
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Get company info
    const company = await prisma.company.findFirst()

    // Generate simple HTML for PDF
    const html = generateReceiptHTML(receipt, company)

    // Return HTML (for now - you can integrate with a PDF library later)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateReceiptHTML(receipt: any, company: any) {
  const paymentMethodLabels: Record<string, string> = {
    CASH: 'เงินสด',
    CHEQUE: 'เช็ค',
    TRANSFER: 'โอนเงิน',
    CREDIT: 'บัตรเครดิต',
    OTHER: 'อื่นๆ',
  }

  const totalAllocated = receipt.allocations.reduce((sum: number, alloc: any) => sum + alloc.amount, 0)
  const totalWht = receipt.whtAmount

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบเสร็จรับเงิน ${receipt.receiptNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 20px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .company-address { font-size: 14px; color: #666; margin-bottom: 5px; }
    .receipt-title { font-size: 28px; font-weight: bold; text-align: center; margin: 30px 0 20px; }
    .receipt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-group { margin-bottom: 15px; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { font-size: 16px; }
    .customer-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
    .payment-details { margin-bottom: 30px; }
    .allocations { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .text-right { text-align: right; }
    .total-section { background: #f9f9f9; padding: 20px; border-radius: 5px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
    .total-row.grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    @media print {
      body { font-size: 12px; }
      .container { max-width: 100%; margin: 0; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-name">${company?.name || ''}</div>
      ${company?.address ? `<div class="company-address">${company.address}</div>` : ''}
      ${company?.taxId ? `<div class="company-address">เลขประจำตัวผู้เสียภาษี: ${company.taxId}</div>` : ''}
    </div>

    <div class="receipt-title">ใบเสร็จรับเงิน</div>

    <div class="receipt-info">
      <div class="info-group">
        <div class="info-label">เลขที่ใบเสร็จ</div>
        <div class="info-value">${receipt.receiptNo}</div>
      </div>
      <div class="info-group">
        <div class="info-label">วันที่รับเงิน</div>
        <div class="info-value">${formatThaiDate(receipt.receiptDate)}</div>
      </div>
    </div>

    <div class="customer-info">
      <div class="info-label" style="margin-bottom: 10px;">ลูกค้า</div>
      <div class="info-value" style="font-size: 18px;">${receipt.customer.name}</div>
      ${receipt.customer.address ? `<div style="margin-top: 5px; color: #666;">${receipt.customer.address}</div>` : ''}
      ${receipt.customer.taxId ? `<div style="margin-top: 5px; color: #666;">เลขประจำตัวผู้เสียภาษี: ${receipt.customer.taxId}</div>` : ''}
    </div>

    <div class="payment-details">
      <div class="info-group">
        <div class="info-label">วิธีการชำระเงิน</div>
        <div class="info-value">${paymentMethodLabels[receipt.paymentMethod]}</div>
      </div>
      ${receipt.bankAccount ? `
      <div class="info-group">
        <div class="info-label">บัญชีธนาคาร</div>
        <div class="info-value">${receipt.bankAccount.bankName} - ${receipt.bankAccount.accountNumber}</div>
      </div>
      ` : ''}
      ${receipt.chequeNo ? `
      <div class="info-group">
        <div class="info-label">เลขที่เช็ค</div>
        <div class="info-value">${receipt.chequeNo}</div>
      </div>
      ` : ''}
      ${receipt.chequeDate ? `
      <div class="info-group">
        <div class="info-label">วันที่เช็ค</div>
        <div class="info-value">${formatThaiDate(receipt.chequeDate)}</div>
      </div>
      ` : ''}
    </div>

    ${receipt.allocations.length > 0 ? `
    <div class="allocations">
      <h3 style="margin-bottom: 15px;">รายการจัดจ่าย</h3>
      <table>
        <thead>
          <tr>
            <th>เลขที่ใบกำกับภาษี</th>
            <th class="text-right">วันที่</th>
            <th class="text-right">ยอดรวม</th>
            <th class="text-right">จัดจ่าย</th>
            <th class="text-right">หัก ณ ที่จ่าย</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.allocations.map((alloc: any) => `
          <tr>
            <td>${alloc.invoice.invoiceNo}</td>
            <td class="text-right">${formatThaiDate(alloc.invoice.invoiceDate)}</td>
            <td class="text-right">${formatCurrency(alloc.invoice.totalAmount)}</td>
            <td class="text-right">${formatCurrency(alloc.amount)}</td>
            <td class="text-right">${alloc.whtRate}% (${formatCurrency(alloc.whtAmount)})</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="total-section">
      <div class="total-row">
        <span>ยอดรับเงินรวม</span>
        <span>${formatCurrency(receipt.amount)}</span>
      </div>
      ${totalAllocated > 0 ? `
      <div class="total-row">
        <span>จัดจ่ายใบกำกับภาษี</span>
        <span>${formatCurrency(totalAllocated)}</span>
      </div>
      ` : ''}
      ${totalWht > 0 ? `
      <div class="total-row">
        <span>ภาษีหัก ณ ที่จ่าย</span>
        <span>${formatCurrency(totalWht)}</span>
      </div>
      ` : ''}
      ${receipt.unallocated > 0 ? `
      <div class="total-row">
        <span>เครดิตคงเหลือ</span>
        <span>${formatCurrency(receipt.unallocated)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>ยอดสุทธิ</span>
        <span>${formatCurrency(receipt.amount)}</span>
      </div>
    </div>

    ${receipt.notes ? `
    <div style="margin-top: 30px; padding: 15px; background: #fffbe6; border-left: 4px solid #ffc107;">
      <div style="font-weight: bold; margin-bottom: 5px;">หมายเหตุ</div>
      <div>${receipt.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <div>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</div>
      ${receipt.status === 'DRAFT' ? '<div style="color: red; margin-top: 10px; font-weight: bold;">** ร่างเอกสาร **</div>' : ''}
    </div>
  </div>
</body>
</html>
  `
}
