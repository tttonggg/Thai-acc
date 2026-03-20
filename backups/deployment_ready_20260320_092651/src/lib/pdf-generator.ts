/**
 * PDF Generator Service for Thai Accounting ERP System
 * บริการสร้างเอกสาร PDF สำหรับระบบบัญชีไทย
 *
 * NOTE: Thai Font Support
 * jsPDF's default fonts don't support Thai characters.
 * For production use, you need to:
 * 1. Convert a Thai font (Sarabun/THSarabun) to base64
 * 2. Add it to jsPDF using addFileToVFS() and addFont()
 * 3. Use the custom font in all text calls
 *
 * For MVP, this implementation uses English labels with Thai data where possible.
 * Full Thai font support requires font file conversion and embedding.
 */

import { prisma } from '@/lib/db'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

// Type definitions for our data structures
interface InvoiceData {
  invoiceNo: string
  invoiceDate: Date
  dueDate?: Date
  customer: {
    name: string
    taxId?: string
    address?: string
    subDistrict?: string
    district?: string
    province?: string
    postalCode?: string
    branchCode?: string
  }
  lines: Array<{
    lineNo: number
    description: string
    quantity: number
    unit: string
    unitPrice: number
    discount: number
    amount: number
  }>
  subtotal: number
  discountAmount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  netAmount: number
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  notes?: string
  reference?: string
}

interface ReceiptData {
  receiptNo: string
  receiptDate: Date
  customer: {
    name: string
    taxId?: string
    address?: string
  }
  amount: number
  paymentMethod: string
  bankName?: string
  bankAccount?: string
  chequeNo?: string
  withholding?: number
  discount?: number
  netAmount: number
  notes?: string
}

interface JournalEntryData {
  entryNo: string
  date: Date
  description?: string
  lines: Array<{
    lineNo: number
    accountCode: string
    accountName: string
    description?: string
    debit: number
    credit: number
  }>
  totalDebit: number
  totalCredit: number
  notes?: string
}

interface ReportData {
  title: string
  titleTh: string
  startDate?: Date
  endDate?: Date
  columns: string[]
  data: Array<{ [key: string]: any }>
  totals?: { [key: string]: number }
}

interface PayslipData {
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
    position?: string
    department?: string
    idCardNumber?: string
    taxId?: string
    bankAccountNo?: string
    bankName?: string
  }
  payroll: {
    baseSalary: number
    additions: number
    deductions: number
    grossSalary: number
    socialSecurity: number
    withholdingTax: number
    netPay: number
  }
  payrollRun: {
    runNo: string
    periodMonth: number
    periodYear: number
    paymentDate: Date
  }
  company?: {
    name: string
    address?: string
    taxId?: string
    phone?: string
    bankName?: string
    bankAccount?: string
    bankAccountName?: string
  }
}

// Company information cache
let companyCache: any = null

async function getCompanyInfo() {
  if (companyCache) {
    return companyCache
  }

  const company = await prisma.company.findFirst()
  if (company) {
    companyCache = company
  }
  return company
}

// Export utility functions for testing
export function formatCurrency(amount: number): string {
  return `฿${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatDateThai(date: Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear() + 543 // Convert to Buddhist era
  return `${day}/${month}/${year}`
}

export function formatAddress(addr: {
  address?: string
  subDistrict?: string
  district?: string
  province?: string
  postalCode?: string
}): string {
  const parts = [
    addr.address,
    addr.subDistrict,
    addr.district,
    addr.province,
    addr.postalCode
  ].filter(Boolean)
  return parts.join(' ')
}

/**
 * Generate Invoice/Tax Invoice PDF
 */
export async function generateInvoicePDF(invoice: any): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Register autoTable plugin

  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 15

  // Company Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (company?.address) {
    doc.text(company.address, margin, yPos)
    yPos += 5
  }
  if (company?.taxId) {
    doc.text(`Tax ID: ${company.taxId}`, margin, yPos)
    yPos += 5
  }
  if (company?.phone) {
    doc.text(`Tel: ${company.phone}`, margin, yPos)
    yPos += 5
  }

  // Document Title
  const docTitle =
    invoice.type === 'TAX_INVOICE'
      ? 'TAX INVOICE / ใบกำกับภาษี'
      : invoice.type === 'RECEIPT'
      ? 'RECEIPT / ใบเสร็จรับเงิน'
      : invoice.type === 'CREDIT_NOTE'
      ? 'CREDIT NOTE / ใบลดหนี้'
      : 'INVOICE / ใบแจ้งหนี้'

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(docTitle, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Invoice Details (Left) - Customer (Right)
  const leftCol = margin
  const rightCol = pageWidth / 2 + 10

  // Left Column - Invoice Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Invoice No / เลขที่:', leftCol, yPos)
  doc.text(`: ${invoice.invoiceNo}`, leftCol + 35, yPos)
  yPos += 6

  doc.text('Date / วันที่:', leftCol, yPos)
  doc.text(`: ${formatDateThai(invoice.invoiceDate)}`, leftCol + 35, yPos)
  yPos += 6

  if (invoice.dueDate) {
    doc.text('Due Date / ครบกำหนด:', leftCol, yPos)
    doc.text(`: ${formatDateThai(invoice.dueDate)}`, leftCol + 35, yPos)
    yPos += 6
  }

  if (invoice.reference) {
    doc.text('Reference / อ้างอิง:', leftCol, yPos)
    doc.text(`: ${invoice.reference}`, leftCol + 35, yPos)
    yPos += 6
  }

  // Right Column - Customer Info
  let customerYPos = yPos - 18 // Start from top of right column
  doc.text('Customer / ลูกค้า:', rightCol, customerYPos)
  customerYPos += 6

  doc.setFont('helvetica', 'bold')
  doc.text(invoice.customer?.name || 'N/A', rightCol, customerYPos)
  customerYPos += 6

  doc.setFont('helvetica', 'normal')
  if (invoice.customer?.taxId) {
    doc.text(`Tax ID: ${invoice.customer.taxId}`, rightCol, customerYPos)
    customerYPos += 6
  }

  const customerAddress = formatAddress(invoice.customer || {})
  if (customerAddress) {
    const lines = doc.splitTextToSize(customerAddress, pageWidth / 2 - margin - 10)
    doc.text(lines, rightCol, customerYPos)
  }

  yPos = Math.max(yPos + 5, customerYPos + 15)

  // Line Items Table
  const tableData = invoice.lines.map((line: any) => [
    line.lineNo.toString(),
    line.description,
    line.quantity.toString(),
    line.unit,
    formatCurrency(line.unitPrice),
    line.discount > 0 ? formatCurrency(line.discount) : '-',
    formatCurrency(line.amount)
  ])

  doc.autoTable({
    startY: yPos,
    head: [
      [
        'No.\nลำดับ',
        'Description\nรายการ',
        'Qty\nจำนวน',
        'Unit\nหน่วย',
        'Unit Price\nราคา/หน่วย',
        'Discount\nส่วนลด',
        'Amount\nจำนวนเงิน'
      ]
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, // No
      1: { cellWidth: 60 }, // Description
      2: { cellWidth: 18, halign: 'center' }, // Qty
      3: { cellWidth: 18, halign: 'center' }, // Unit
      4: { cellWidth: 25, halign: 'right' }, // Unit Price
      5: { cellWidth: 20, halign: 'right' }, // Discount
      6: { cellWidth: 30, halign: 'right' } // Amount
    },
    styles: {
      overflow: 'linebreak'
    }
  })

  yPos = (doc.lastAutoTable as any).finalY + 10

  // Summary Section
  const summaryX = pageWidth - margin - 70

  // Subtotal
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal / ยอดรวม:', summaryX, yPos)
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  // Discount
  if (invoice.discountAmount > 0) {
    doc.text('Discount / ส่วนลด:', summaryX, yPos)
    doc.text(
      `(${formatCurrency(invoice.discountAmount)})`,
      pageWidth - margin,
      yPos,
      { align: 'right' }
    )
    yPos += 6
  }

  // VAT
  doc.text(`VAT ${invoice.vatRate}% / ภาษีมูลค่าเพิ่ม:`, summaryX, yPos)
  doc.text(formatCurrency(invoice.vatAmount), pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  // Grand Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Grand Total / ยอดสุทธิ:', summaryX, yPos)
  doc.text(formatCurrency(invoice.netAmount), pageWidth - margin, yPos, { align: 'right' })
  yPos += 12

  // Terms and Conditions
  if (invoice.notes || invoice.terms) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions / เงื่อนไข:', margin, yPos)
    yPos += 5

    doc.setFont('helvetica', 'normal')
    const termsText =
      invoice.terms ||
      '1. Payment due within 30 days / ชำระภายใน 30 วัน\n' +
        '2. Please quote invoice number in all correspondence / กรุณาระบุเลขที่ใบกำกับภาษีในการติดต่อ\n' +
        '3. Bank transfer details: / รายละเอียดการโอนเงิน:'

    const lines = doc.splitTextToSize(termsText, pageWidth - margin * 2)
    doc.text(lines, margin, yPos)

    if (company?.bankName || company?.bankAccount) {
      yPos += lines.length * 4 + 3
      const bankInfo = [
        company.bankName && `Bank: ${company.bankName}`,
        company.bankAccount && `Account No: ${company.bankAccount}`,
        company.bankAccountName && `Account Name: ${company.bankAccountName}`
      ]
        .filter(Boolean)
        .join('\n')
      doc.text(bankInfo, margin + 3, yPos)
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `This is a computer-generated document / เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate Receipt PDF
 */
export async function generateReceiptPDF(receipt: any): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })


  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 15

  // Company Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (company?.address) {
    doc.text(company.address, margin, yPos)
    yPos += 5
  }
  if (company?.taxId) {
    doc.text(`Tax ID: ${company.taxId}`, margin, yPos)
    yPos += 5
  }
  if (company?.phone) {
    doc.text(`Tel: ${company.phone}`, margin, yPos)
    yPos += 5
  }

  // Document Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RECEIPT / ใบเสร็จรับเงิน', pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Receipt Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Receipt No / เลขที่:', margin, yPos)
  doc.text(`: ${receipt.receiptNo}`, margin + 35, yPos)
  yPos += 6

  doc.text('Date / วันที่:', margin, yPos)
  doc.text(`: ${formatDateThai(receipt.receiptDate)}`, margin + 35, yPos)
  yPos += 10

  // Customer Info
  doc.setFont('helvetica', 'bold')
  doc.text('Received from / รับเงินจาก:', margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.text(receipt.customer?.name || 'N/A', margin, yPos)
  yPos += 6

  if (receipt.customer?.taxId) {
    doc.text(`Tax ID: ${receipt.customer.taxId}`, margin, yPos)
    yPos += 6
  }

  if (receipt.customer?.address) {
    const addressLines = doc.splitTextToSize(
      receipt.customer.address,
      pageWidth - margin * 2
    )
    doc.text(addressLines, margin, yPos)
    yPos += addressLines.length * 4 + 5
  } else {
    yPos += 5
  }

  // Payment Details
  doc.text('Being payment for / การชำระเพื่อ:', margin, yPos)
  yPos += 6

  if (receipt.invoice) {
    doc.text(
      `Invoice No: ${receipt.invoice.invoiceNo}`,
      margin + 3,
      yPos
    )
    yPos += 5
  }

  // Amount Section
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Amount / จำนวนเงิน: ${formatCurrency(receipt.amount)}`, margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Payment Method
  doc.text('Payment Method / วิธีการชำระ:', margin, yPos)
  yPos += 6
  doc.text(
    `: ${receipt.paymentMethod || 'CASH'}`,
    margin + 3,
    yPos
  )
  yPos += 6

  if (receipt.bankName) {
    doc.text(`Bank: ${receipt.bankName}`, margin + 3, yPos)
    yPos += 5
  }

  if (receipt.bankAccount) {
    doc.text(`Account: ${receipt.bankAccount}`, margin + 3, yPos)
    yPos += 5
  }

  if (receipt.chequeNo) {
    doc.text(`Cheque No: ${receipt.chequeNo}`, margin + 3, yPos)
    yPos += 5
    if (receipt.chequeDate) {
      doc.text(`Cheque Date: ${formatDateThai(receipt.chequeDate)}`, margin + 3, yPos)
      yPos += 5
    }
  }

  // Summary
  yPos += 5
  const summaryX = pageWidth - margin - 50

  // Withholding Tax
  if (receipt.withholding > 0) {
    doc.text('Withholding Tax / ภาษีหัก ณ ที่จ่าย:', summaryX, yPos)
    doc.text(`(${formatCurrency(receipt.withholding)})`, pageWidth - margin, yPos, {
      align: 'right'
    })
    yPos += 6
  }

  // Discount
  if (receipt.discount > 0) {
    doc.text('Discount / ส่วนลด:', summaryX, yPos)
    doc.text(`(${formatCurrency(receipt.discount)})`, pageWidth - margin, yPos, {
      align: 'right'
    })
    yPos += 6
  }

  // Net Amount
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Net Received / ยอดสุทธิ:', summaryX, yPos)
  doc.text(formatCurrency(receipt.netAmount), pageWidth - margin, yPos, {
    align: 'right'
  })
  yPos += 12

  // Notes
  if (receipt.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Notes / หมายเหตุ:', margin, yPos)
    yPos += 5

    const noteLines = doc.splitTextToSize(receipt.notes, pageWidth - margin * 2)
    doc.text(noteLines, margin, yPos)
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.text(
    'This is a computer-generated document / เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate Journal Entry PDF
 */
export async function generateJournalEntryPDF(entry: any): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })


  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 15

  // Company Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  // Document Title
  doc.setFontSize(14)
  doc.text('JOURNAL ENTRY / บันทึกบัญชี', margin, yPos)
  yPos += 12

  // Entry Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Entry No / เลขที่:', margin, yPos)
  doc.text(`: ${entry.entryNo}`, margin + 30, yPos)
  yPos += 6

  doc.text('Date / วันที่:', margin, yPos)
  doc.text(`: ${formatDateThai(entry.date)}`, margin + 30, yPos)
  yPos += 6

  if (entry.description) {
    doc.text('Description / รายการ:', margin, yPos)
    doc.text(`: ${entry.description}`, margin + 30, yPos)
    yPos += 6
  }

  if (entry.reference) {
    doc.text('Reference / เอกสารอ้างอิง:', margin, yPos)
    doc.text(`: ${entry.reference}`, margin + 30, yPos)
    yPos += 6
  }

  yPos += 5

  // Debit/Credit Table
  const tableData = entry.lines.map((line: any) => [
    line.lineNo.toString(),
    line.account?.code || '',
    line.account?.name || line.accountName,
    line.description || '',
    line.debit > 0 ? formatCurrency(line.debit) : '',
    line.credit > 0 ? formatCurrency(line.credit) : ''
  ])

  doc.autoTable({
    startY: yPos,
    head: [
      [
        'No.',
        'Account\nรหัส',
        'Account Name\nชื่อบัญชี',
        'Description\nรายการ',
        'Debit\nเดบิต',
        'Credit\nเครดิต'
      ]
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 15 },
      2: { cellWidth: 50 },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    foot: [['', '', '', 'TOTAL / รวม', formatCurrency(entry.totalDebit), formatCurrency(entry.totalCredit)]],
    footStyles: {
      fillColor: [200, 200, 200],
      fontStyle: 'bold',
      fontSize: 9
    }
  })

  yPos = (doc.lastAutoTable as any).finalY + 10

  // Balance Check
  const isBalanced = Math.abs(entry.totalDebit - entry.totalCredit) < 0.01
  doc.setFontSize(10)
  if (isBalanced) {
    doc.setTextColor(0, 128, 0)
    doc.text('✓ Balanced / ตรงกัน', margin, yPos)
  } else {
    doc.setTextColor(255, 0, 0)
    doc.text('✗ Not Balanced / ไม่ตรงกัน', margin, yPos)
  }
  doc.setTextColor(0, 0, 0)

  // Notes
  if (entry.notes) {
    yPos += 10
    doc.setFont('helvetica', 'normal')
    doc.text('Notes / หมายเหตุ:', margin, yPos)
    yPos += 5

    const noteLines = doc.splitTextToSize(entry.notes, pageWidth - margin * 2)
    doc.text(noteLines, margin, yPos)
  }

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate Trial Balance PDF
 */
export async function generateTrialBalancePDF(data: ReportData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })


  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  let yPos = 10

  // Company Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  // Report Title
  doc.setFontSize(16)
  doc.text(`${data.title} / ${data.titleTh}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  // Date Range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.startDate && data.endDate) {
    doc.text(
      `For the period / ระหว่างวันที่: ${formatDateThai(data.startDate)} - ${formatDateThai(data.endDate)}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    )
  } else if (data.endDate) {
    doc.text(`As of / ณ วันที่: ${formatDateThai(data.endDate)}`, pageWidth / 2, yPos, {
      align: 'center'
    })
  }
  yPos += 10

  // Table
  doc.autoTable({
    startY: yPos,
    head: [data.columns],
    body: data.data.map((row) => Object.values(row)),
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    styles: {
      overflow: 'linebreak'
    },
    columnStyles: data.columns.reduce((acc, _, i) => {
      if (i === 0) {
        // First column (Account Code)
        acc[i] = { cellWidth: 20 }
      } else if (i === 1) {
        // Second column (Account Name)
        acc[i] = { cellWidth: 60 }
      } else {
        // Numeric columns
        acc[i] = { halign: 'right', cellWidth: 35 }
      }
      return acc
    }, {} as any)
  })

  // Footer
  const footerY = pageHeight - 10
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on / สร้างเมื่อ: ${formatDateThai(new Date())}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate Income Statement PDF
 */
export async function generateIncomeStatementPDF(data: ReportData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })


  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 15

  // Company Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  // Report Title
  doc.setFontSize(16)
  doc.text(`${data.title} / ${data.titleTh}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  // Date Range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.startDate && data.endDate) {
    doc.text(
      `For the period / ระหว่างวันที่: ${formatDateThai(data.startDate)} - ${formatDateThai(data.endDate)}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    )
  } else if (data.endDate) {
    doc.text(`As of / ณ วันที่: ${formatDateThai(data.endDate)}`, pageWidth / 2, yPos, {
      align: 'center'
    })
  }
  yPos += 10

  // Table
  doc.autoTable({
    startY: yPos,
    head: [data.columns],
    body: data.data.map((row) => Object.values(row)),
    theme: 'plain',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2
    },
    styles: {
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Description
      1: { halign: 'right', cellWidth: 40 }, // Amount
      2: { halign: 'right', cellWidth: 40 } // Percentage (optional)
    },
    didParseCell: function (data: any) {
      // Add styling for section headers and totals
      const row = data.row.raw
      if (row && typeof row === 'object') {
        const isHeader =
          row[0]?.includes('REVENUE') ||
          row[0]?.includes('รายได้') ||
          row[0]?.includes('EXPENSE') ||
          row[0]?.includes('ค่าใช้จ่าย')
        const isTotal =
          row[0]?.includes('TOTAL') || row[0]?.includes('รวม') || row[0]?.includes('NET')

        if (isHeader) {
          data.cell.styles.fillColor = [240, 240, 240]
          data.cell.styles.fontStyle = 'bold'
        }
        if (isTotal) {
          data.cell.styles.fillColor = [220, 220, 220]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  yPos = (doc.lastAutoTable as any).finalY + 10

  // Footer with totals
  if (data.totals) {
    Object.entries(data.totals).forEach(([key, value]) => {
      if (typeof value === 'number') {
        doc.setFont('helvetica', 'bold')
        doc.text(`${key}: ${formatCurrency(value)}`, margin, yPos)
        yPos += 6
      }
    })
  }

  // Footer
  const footerY = pageHeight - 15
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on / สร้างเมื่อ: ${formatDateThai(new Date())}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Generate Balance Sheet PDF
 */
export async function generateBalanceSheetPDF(data: ReportData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })


  const company = await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 15

  // Company Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  // Report Title
  doc.setFontSize(16)
  doc.text(`${data.title} / ${data.titleTh}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.endDate) {
    doc.text(`As of / ณ วันที่: ${formatDateThai(data.endDate)}`, pageWidth / 2, yPos, {
      align: 'center'
    })
  }
  yPos += 10

  // Table - Split into Assets and Liabilities/Equity
  const halfWidth = (pageWidth - margin * 2) / 2 - 5

  // Assets Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('ASSETS / สินทรัพย์', margin, yPos)
  yPos += 5

  const assetsData = data.data
    .filter((row) => row.type === 'ASSET' || row.category?.includes('Assets'))
    .map((row) => [row.account || row.description, formatCurrency(row.amount || 0)])

  if (assetsData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Account / บัญชี', 'Amount / จำนวนเงิน']],
      body: assetsData,
      theme: 'plain',
      headStyles: {
        fillColor: [100, 100, 150],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 1
      },
      columnStyles: {
        0: { cellWidth: halfWidth - 25 },
        1: { halign: 'right', cellWidth: 25 }
      }
    })

    yPos = (doc.lastAutoTable as any).finalY + 3
  }

  // Total Assets
  const totalAssets = data.totals?.totalAssets || data.totals?.assets || 0
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Total Assets / สินทรัพย์รวม: ${formatCurrency(totalAssets)}`, margin, yPos)
  yPos += 8

  // Liabilities Section
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('LIABILITIES & EQUITY / หนี้สินและทุน', margin, yPos)
  yPos += 5

  const liabilitiesData = data.data
    .filter(
      (row) =>
        row.type === 'LIABILITY' ||
        row.type === 'EQUITY' ||
        row.category?.includes('Liabilities') ||
        row.category?.includes('Equity')
    )
    .map((row) => [row.account || row.description, formatCurrency(row.amount || 0)])

  if (liabilitiesData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Account / บัญชี', 'Amount / จำนวนเงิน']],
      body: liabilitiesData,
      theme: 'plain',
      headStyles: {
        fillColor: [150, 100, 100],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 1
      },
      columnStyles: {
        0: { cellWidth: halfWidth - 25 },
        1: { halign: 'right', cellWidth: 25 }
      }
    })

    yPos = (doc.lastAutoTable as any).finalY + 3
  }

  // Total Liabilities & Equity
  const totalLiabilitiesEquity =
    data.totals?.totalLiabilitiesEquity ||
    (data.totals?.liabilities || 0) + (data.totals?.equity || 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(
    `Total Liabilities & Equity / หนี้สินและทุนรวม: ${formatCurrency(totalLiabilitiesEquity)}`,
    margin,
    yPos
  )

  // Balance Check
  yPos += 10
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01
  if (isBalanced) {
    doc.setTextColor(0, 128, 0)
    doc.text('✓ Balanced / ตรงกัน', margin, yPos)
  } else {
    doc.setTextColor(255, 0, 0)
    doc.text('✗ Not Balanced / ไม่ตรงกัน', margin, yPos)
  }
  doc.setTextColor(0, 0, 0)

  // Footer
  const footerY = pageHeight - 15
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on / สร้างเมื่อ: ${formatDateThai(new Date())}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

/**
 * Helper function to convert Thai text to a safe format
 * Use this when you need to ensure text is displayable
 *
 * NOTE: This is a workaround for the Thai font limitation.
 * For production, implement proper Thai font embedding.
 */
export function escapeThaiText(text: string): string {
  // Remove or replace problematic characters
  return text
    .replace(/[^\x00-\x7F]/g, (match) => {
      // Try to preserve basic Thai characters by returning them
      // jsPDF may not render them correctly without proper font
      return match
    })
    .trim()
}

/**
 * Font embedding helper (for future implementation)
 *
 * To add Thai font support:
 * 1. Convert .ttf font file to base64
 * 2. Call doc.addFileToVFS('font-name.ttf', base64String)
 * 3. Call doc.addFont('font-name.ttf', 'font-family', 'font-style')
 * 4. Use doc.setFont('font-family', 'font-style')
 *
 * Example:
 * export async function addThaiFont(doc: jsPDF): Promise<void> {
 *   const fontData = await loadThaiFont() // Load base64 font
 *   doc.addFileToVFS('Sarabun-Regular.ttf', fontData)
 *   doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal')
 *   doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold')
 * }
 */

/**
 * Generate Payslip PDF
 * สร้างสลิปเงินเดือนเป็น PDF
 */
export async function generatePayslipPDF(data: PayslipData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })


  const company = data.company || await getCompanyInfo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 15

  // Thai month names
  const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                       'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

  // Company Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(company?.name || 'Company Name', margin, yPos)
  yPos += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (company?.address) {
    doc.text(company.address, margin, yPos)
    yPos += 5
  }
  if (company?.taxId) {
    doc.text(`Tax ID: ${company.taxId}`, margin, yPos)
    yPos += 5
  }
  if (company?.phone) {
    doc.text(`Tel: ${company.phone}`, margin, yPos)
    yPos += 5
  }

  // Payslip Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYSLIP / สลิปเงินเดือน', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Pay Period
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Pay Period / งวดเงินเดือน:', margin, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  const monthName = THAI_MONTHS[data.payrollRun.periodMonth - 1]
  const periodText = `${monthName} ${data.payrollRun.periodYear + 543} (${data.payrollRun.periodMonth}/${data.payrollRun.periodYear})`
  doc.text(periodText, margin + 3, yPos)
  yPos += 10

  // Employee Information Section
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(margin, yPos, pageWidth - margin * 2, 35)
  yPos += 5

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Employee Information / ข้อมูลพนักงาน', margin + 3, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const employeeName = `${data.employee.firstName} ${data.employee.lastName}`
  doc.text(`Name / ชื่อ-สกุล:`, margin + 5, yPos)
  doc.text(employeeName, margin + 40, yPos)
  yPos += 6

  doc.text(`Employee ID / รหัสพนักงาน:`, margin + 5, yPos)
  doc.text(data.employee.employeeCode, margin + 40, yPos)
  yPos += 6

  if (data.employee.position) {
    doc.text(`Position / ตำแหน่ง:`, margin + 5, yPos)
    doc.text(data.employee.position, margin + 40, yPos)
    yPos += 6
  }

  if (data.employee.department) {
    doc.text(`Department / แผนก:`, margin + 5, yPos)
    doc.text(data.employee.department, margin + 40, yPos)
    yPos += 6
  }

  if (data.employee.idCardNumber) {
    doc.text(`ID Card / เลขบัตรประชาชน:`, margin + 5, yPos)
    doc.text(data.employee.idCardNumber, margin + 40, yPos)
  }

  yPos += 12

  // Earnings Section
  doc.setDrawColor(66, 139, 202) // Blue
  doc.setLineWidth(1)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(66, 139, 202)
  doc.text('EARNINGS / รายการรับ', margin, yPos)
  doc.setTextColor(0, 0, 0)
  yPos += 8

  // Earnings Table
  const earningsData = [
    ['Basic Salary / เงินเดือนพื้นฐาน', formatCurrency(data.payroll.baseSalary)],
    ['Additions / เบี้ยเลี้ยงและอื่นๆ', formatCurrency(data.payroll.additions)],
    ['', ''], // Spacer
    ['Gross Salary / รายได้รวม', formatCurrency(data.payroll.grossSalary)]
  ]

  doc.autoTable({
    startY: yPos,
    head: [],
    body: earningsData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right', cellWidth: 40, fontStyle: 'normal' }
    },
    didParseCell: function (data: any) {
      // Bold the last row (Gross Salary)
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  yPos = (doc.lastAutoTable as any).finalY + 10

  // Deductions Section
  doc.setDrawColor(220, 53, 69) // Red
  doc.setLineWidth(1)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 53, 69)
  doc.text('DEDUCTIONS / รายการหัก', margin, yPos)
  doc.setTextColor(0, 0, 0)
  yPos += 8

  // Deductions Table
  const deductionsData = [
    ['Social Security / ประกันสังคม', formatCurrency(data.payroll.socialSecurity)],
    ['Withholding Tax (PND1) / ภาษีเงินได้หัก ณ ที่จ่าย', formatCurrency(data.payroll.withholdingTax)],
    ['Other Deductions / หักอื่นๆ', formatCurrency(data.payroll.deductions)],
    ['', ''], // Spacer
    ['Total Deductions / รวมหัก', formatCurrency(data.payroll.socialSecurity + data.payroll.withholdingTax + data.payroll.deductions)]
  ]

  doc.autoTable({
    startY: yPos,
    head: [],
    body: deductionsData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right', cellWidth: 40, fontStyle: 'normal' }
    },
    didParseCell: function (data: any) {
      // Bold the last row (Total Deductions)
      if (data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  yPos = (doc.lastAutoTable as any).finalY + 10

  // Net Pay Section - Large and Prominent
  doc.setDrawColor(40, 167, 69) // Green
  doc.setFillColor(240, 253, 244)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 3, 3, 'FD')
  yPos += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 167, 69)
  doc.text('NET PAY / เงินได้สุทธิ', margin + 10, yPos)

  doc.setFontSize(22)
  doc.text(formatCurrency(data.payroll.netPay), pageWidth - margin - 10, yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  yPos += 18

  // Payment Date and Bank Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Date / วันที่จ่าย: ${formatDateThai(data.payrollRun.paymentDate)}`, margin, yPos)
  yPos += 6

  // Bank Information
  if (data.employee.bankAccountNo) {
    const bankInfo = `Payment to / โอนเข้าบัญชี: ${data.employee.bankName || 'Bank'} - ${data.employee.bankAccountNo}`
    doc.text(bankInfo, margin, yPos)
    yPos += 6
  }

  // Company Bank Info (for reference)
  if (company?.bankName || company?.bankAccount) {
    doc.setFont('helvetica', 'bold')
    doc.text('Payment from / ชำระโดย:', margin, yPos)
    yPos += 4

    doc.setFont('helvetica', 'normal')
    const companyBankInfo = [
      company.bankName && `Bank: ${company.bankName}`,
      company.bankAccount && `Account No: ${company.bankAccount}`,
      company.bankAccountName && `Account Name: ${company.bankAccountName}`
    ].filter(Boolean).join(' | ')

    if (companyBankInfo) {
      doc.text(companyBankInfo, margin + 3, yPos)
      yPos += 6
    }
  } else {
    // Skip company bank info if not available
    yPos += 2
  }

  yPos += 5

  // Additional Information
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Note / หมายเหตุ:', margin, yPos)
  yPos += 4
  doc.text('- This is a computer-generated payslip / เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์', margin + 3, yPos)
  yPos += 4
  doc.text('- Please verify amounts with HR department / กรุณาตรวจสอบยอดเงินกับแผนก HR', margin + 3, yPos)
  yPos += 4
  doc.text('- For inquiries, contact HR / หากมีข้อสงสัย กรุณาติดต่อ HR', margin + 3, yPos)

  // Footer
  const footerY = pageHeight - 12
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated by Thai Accounting ERP | ${data.payrollRun.runNo} | ${formatDateThai(new Date())}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}

// Stub function for tax form PDF generation
export async function generatePDF(params: {
  type: string
  content: unknown
  title: string
}): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(16)
  doc.text(params.title, 20, 20)
  
  // Add content as JSON for now
  doc.setFontSize(10)
  const contentStr = JSON.stringify(params.content, null, 2)
  const lines = doc.splitTextToSize(contentStr, 170)
  doc.text(lines, 20, 40)
  
  return doc.output('arraybuffer') as Uint8Array
}
