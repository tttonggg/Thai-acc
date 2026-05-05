/**
 * PDFKit Generator for Thai Accounting ERP System
 * สร้างเอกสาร PDF ด้วย PDFKit สำหรับระบบบัญชีไทย
 *
 * ✅ FULL THAI FONT SUPPORT
 * PDFKit natively supports TTF/OTF fonts - no complex base64 conversion needed
 * Simply load the font file and use it: doc.font('path/to/font.ttf')
 */

import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import { toString as qrToString } from 'qrcode';
import promptpayQR from 'promptpay-qr';

// Type definitions for our data structures
interface InvoiceData {
  invoiceNo: string;
  invoiceDate: Date;
  dueDate?: Date;
  customer: {
    name: string;
    taxId?: string;
    address?: string;
    subDistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    branchCode?: string;
  };
  lines: Array<{
    lineNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    amount: number;
  }>;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  netAmount: number;
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  notes?: string;
  reference?: string;
}

// Company information cache
let companyCache: any = null;

async function getCompanyInfo() {
  if (companyCache) {
    return companyCache;
  }

  const company = await prisma.company.findFirst();
  if (company) {
    companyCache = company;
  }
  return company;
}

// Utility functions
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateThai(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() + 543; // Convert to Buddhist era
  return `${day}/${month}/${year}`;
}

export function formatAddress(addr: {
  address?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}): string {
  const parts = [
    addr.address,
    addr.subDistrict,
    addr.district,
    addr.province,
    addr.postalCode,
  ].filter(Boolean);
  return parts.join(' ');
}

/**
 * PDFKit Helper: Get font path
 */
function getFontPath(fontName: string): string {
  // In production, fonts are in public/fonts
  // During build, we need to handle different paths
  const fontPaths = [
    path.join(process.cwd(), 'public', 'fonts', fontName),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'fonts', fontName),
    path.join(process.cwd(), 'standalone', 'public', 'fonts', fontName),
  ];

  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }

  // Fallback - assume relative path will work
  return path.join(process.cwd(), 'public', 'fonts', fontName);
}

/**
 * PROOF OF CONCEPT: Simple Thai PDF Test
 * This demonstrates that PDFKit can render Thai fonts correctly
 */
export async function generateThaiTestPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Load Thai font
      const regularFontPath = getFontPath('THSarabunNew.ttf');
      const boldFontPath = getFontPath('THSarabunNew-Bold.ttf');

      doc.font(regularFontPath);

      // Title
      doc.fontSize(20).text('ทดสอบฟอนต์ภาษาไทย / Thai Font Test', { align: 'center' }).moveDown(2);

      // Test different font sizes
      doc.fontSize(14).text('นี่คือการทดสอบฟอนต์ภาษาไทยด้วย PDFKit', { align: 'left' }).moveDown();

      doc
        .fontSize(12)
        .text('ภาษาไทยสามารถแสดงผลได้อย่างถูกต้อง / Thai text renders correctly')
        .moveDown();

      // Test bold font
      doc
        .font(boldFontPath)
        .fontSize(14)
        .text('ฟอนต์ตัวหนา / Bold Font', { align: 'center' })
        .moveDown(2);

      // Back to regular
      doc.font(regularFontPath).fontSize(11);

      // Test numbers and currency
      const testAmount = 12345.67;
      doc.text(`จำนวนเงิน: ${formatCurrency(testAmount)} บาท`).moveDown();

      // Test date
      doc.text(`วันที่: ${formatDateThai(new Date())}`).moveDown(2);

      // Test table-like layout
      doc
        .fontSize(12)
        .font(boldFontPath)
        .text('ตารางทดสอบ / Test Table:', { underline: true })
        .font(regularFontPath)
        .fontSize(10)
        .moveDown(1);

      const tableData = [
        ['รายการ', 'จำนวน', 'ราคา'],
        ['สินค้า A', '1', '100.00'],
        ['สินค้า B', '2', '250.00'],
        ['สินค้า C', '5', '500.00'],
      ];

      let y = doc.y;
      const tableLeft = 60;
      const colWidths = { col1: 180, col2: 60, col3: 60 };

      tableData.forEach((row, i) => {
        const x = tableLeft;
        doc.font(i === 0 ? boldFontPath : regularFontPath);

        // Fixed positioning for table to avoid overlap
        doc.text(row[0], x, y, { width: colWidths.col1 });
        doc.text(row[1], x + colWidths.col1 + 20, y, { width: colWidths.col2, align: 'right' });
        doc.text(row[2], x + colWidths.col1 + colWidths.col2 + 30, y, {
          width: colWidths.col3,
          align: 'right',
        });

        y += 22; // Fixed row height
      });

      // Move y position after table
      doc.y = y + 15;

      // Test summary
      doc
        .font(boldFontPath)
        .fontSize(11)
        .text(`รวมทั้งสิ้น / Total: ${formatCurrency(850.0)} บาท`, 60, doc.y, { align: 'right' })
        .moveDown(2);

      // Success message
      doc
        .font(regularFontPath)
        .fontSize(9)
        .fillColor('green')
        .text('✅ ฟอนต์ภาษาไทยรองรับอย่างสมบูรณ์ / Thai fonts fully supported!', 60, doc.y, {
          width: 480,
          align: 'center',
        })
        .fillColor('black');

      // Footer
      doc
        .fontSize(10)
        .text(
          'สร้างด้วยระบบบัญชีไทย / Generated by Thai Accounting ERP',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Invoice/Tax Invoice PDF with PDFKit
 * สร้าง PDF ใบกำกับภาษีด้วย PDFKit
 */
export async function generateInvoicePDFWithPDFKit(invoice: any): Promise<Buffer> {
  const company = await getCompanyInfo();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      // Load Thai fonts
      const regularFontPath = getFontPath('THSarabunNew.ttf');
      const boldFontPath = getFontPath('THSarabunNew-Bold.ttf');

      doc.font(regularFontPath);

      const pageWidth = doc.page.width;
      const margin = 50;
      let yPos = 50;

      // Company Header
      doc
        .fontSize(16)
        .font(boldFontPath)
        .text(company?.name || 'Company Name', margin, yPos)
        .font(regularFontPath);
      yPos += 25;

      doc.fontSize(10);
      if (company?.address) {
        doc.text(company.address, margin, yPos);
        yPos += 15;
      }
      if (company?.taxId) {
        doc.text(`เลขประจำตัวผู้เสียภาษี: ${company.taxId}`, margin, yPos);
        yPos += 15;
      }
      if (company?.phone) {
        doc.text(`โทร: ${company.phone}`, margin, yPos);
        yPos += 15;
      }

      // Document Title
      const docTitle =
        invoice.type === 'TAX_INVOICE'
          ? 'ใบกำกับภาษี / TAX INVOICE'
          : invoice.type === 'RECEIPT'
            ? 'ใบเสร็จรับเงิน / RECEIPT'
            : invoice.type === 'CREDIT_NOTE'
              ? 'ใบลดหนี้ / CREDIT NOTE'
              : 'ใบแจ้งหนี้ / INVOICE';

      doc
        .fontSize(18)
        .font(boldFontPath)
        .text(docTitle, pageWidth / 2, yPos, { align: 'center' })
        .font(regularFontPath);
      yPos += 25;
      yPos += 35;

      // Invoice Details (Left) - Customer (Right)
      const leftCol = margin;
      const rightCol = pageWidth / 2 + 30;

      // Left Column - Invoice Info
      doc.fontSize(10);
      doc.text('เลขที่ / No:', leftCol, yPos);
      doc.text(invoice.invoiceNo, leftCol + 55, yPos);
      yPos += 16;

      doc.text('วันที่ / Date:', leftCol, yPos);
      doc.text(formatDateThai(invoice.invoiceDate), leftCol + 55, yPos);
      yPos += 16;

      if (invoice.dueDate) {
        doc.text('ครบกำหนด / Due:', leftCol, yPos);
        doc.text(formatDateThai(invoice.dueDate), leftCol + 55, yPos);
        yPos += 16;
      }

      if (invoice.reference) {
        doc.text('อ้างอิง / Ref:', leftCol, yPos);
        doc.text(invoice.reference, leftCol + 55, yPos);
        yPos += 16;
      }

      // Right Column - Customer Info
      let customerYPos = 60;
      doc.text('ลูกค้า / Customer:', rightCol, customerYPos);
      customerYPos += 16;

      doc
        .font(boldFontPath)
        .fontSize(11)
        .text(invoice.customer?.name || 'N/A', rightCol, customerYPos)
        .font(regularFontPath)
        .fontSize(10);
      customerYPos += 18;

      if (invoice.customer?.taxId) {
        doc.text(`เลขประจำตัวผู้เสียภาษี: ${invoice.customer.taxId}`, rightCol, customerYPos);
        customerYPos += 16;
      }

      const customerAddress = formatAddress(invoice.customer || {});
      if (customerAddress) {
        doc.text(customerAddress, rightCol, customerYPos, {
          width: pageWidth / 2 - 40,
        });
      }

      yPos = Math.max(yPos + 10, customerYPos + 20);

      // Line Items Table
      doc
        .fontSize(11)
        .font(boldFontPath)
        .text('รายการสินค้า / Items', margin, yPos)
        .font(regularFontPath);
      yPos += 12;

      // Table header
      const tableLeft = margin;
      const colWidths = [25, 160, 40, 40, 55, 45, 60];
      const tableRight = tableLeft + colWidths.reduce((a, b) => a + b, 0);

      doc.fontSize(9).font(boldFontPath);

      // Header row
      let headerY = yPos;
      doc.text('No.', tableLeft, headerY, { width: colWidths[0], align: 'center' });
      doc.text('รายการ', tableLeft + colWidths[0], headerY, { width: colWidths[1] });
      doc.text('จำนวน', tableLeft + colWidths[0] + colWidths[1], headerY, {
        width: colWidths[2],
        align: 'center',
      });
      doc.text('หน่วย', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], headerY, {
        width: colWidths[3],
        align: 'center',
      });
      doc.text(
        'ราคา/หน่วย',
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        headerY,
        { width: colWidths[4], align: 'right' }
      );
      doc.text(
        'ส่วนลด',
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
        headerY,
        { width: colWidths[5], align: 'right' }
      );
      doc.text(
        'จำนวนเงิน',
        tableLeft +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4] +
          colWidths[5],
        headerY,
        { width: colWidths[6], align: 'right' }
      );

      // Header line
      yPos += 12;
      doc.moveTo(tableLeft, yPos).lineTo(tableRight, yPos).lineWidth(0.5).stroke();
      yPos += 6;

      // Table body
      doc.font(regularFontPath).fontSize(9);

      invoice.lines.forEach((line: any) => {
        doc.text(line.lineNo.toString(), tableLeft, yPos, { width: colWidths[0], align: 'center' });
        doc.text(line.description, tableLeft + colWidths[0], yPos, { width: colWidths[1] });
        doc.text(line.quantity.toString(), tableLeft + colWidths[0] + colWidths[1], yPos, {
          width: colWidths[2],
          align: 'center',
        });
        doc.text(line.unit, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos, {
          width: colWidths[3],
          align: 'center',
        });
        doc.text(
          formatCurrency(line.unitPrice),
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          yPos,
          { width: colWidths[4], align: 'right' }
        );
        doc.text(
          line.discount > 0 ? formatCurrency(line.discount) : '-',
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
          yPos,
          { width: colWidths[5], align: 'right' }
        );
        doc.text(
          formatCurrency(line.amount),
          tableLeft +
            colWidths[0] +
            colWidths[1] +
            colWidths[2] +
            colWidths[3] +
            colWidths[4] +
            colWidths[5],
          yPos,
          { width: colWidths[6], align: 'right' }
        );
        yPos += 16;
      });

      // Table footer line
      doc.moveTo(tableLeft, yPos).lineTo(tableRight, yPos).stroke();
      yPos += 12;

      // Summary Section
      const summaryX = tableRight - 140;

      // Subtotal
      doc.fontSize(10);
      doc.text('ยอดรวม / Subtotal:', summaryX, yPos);
      doc.text(formatCurrency(invoice.subtotal), tableRight, yPos, { align: 'right' });
      yPos += 14;

      // Discount
      if (invoice.discountAmount > 0) {
        doc.text(`ส่วนลด / Discount:`, summaryX, yPos);
        doc.text(`(${formatCurrency(invoice.discountAmount)})`, tableRight, yPos, {
          align: 'right',
        });
        yPos += 14;
      }

      // VAT
      doc.text(`ภาษี ${invoice.vatRate}% / VAT:`, summaryX, yPos);
      doc.text(formatCurrency(invoice.vatAmount), tableRight, yPos, { align: 'right' });
      yPos += 14;

      // Grand Total
      doc
        .font(boldFontPath)
        .fontSize(12)
        .text('ยอดสุทธิ / Total:', summaryX, yPos)
        .fillColor('blue')
        .text(formatCurrency(invoice.netAmount), tableRight, yPos, { align: 'right' })
        .fillColor('black');
      yPos += 20;

      // Terms and Conditions
      if (invoice.notes || !invoice.terms) {
        doc.font(regularFontPath).fontSize(11).text('เงื่อนไข / Terms & Conditions:', margin, yPos);
        yPos += 15;

        doc.fontSize(10);
        const termsText =
          invoice.terms ||
          '1. ชำระภายใน 30 วัน / Payment due within 30 days\n' +
            '2. กรุณาระบุเลขที่ใบกำกับภาษีในการติดต่อ / Please quote invoice number in all correspondence\n' +
            '3. รายละเอียดการโอนเงิน / Bank transfer details:';

        doc.text(termsText, margin, yPos);
        yPos += 50;

        if (company?.bankName || company?.bankAccount) {
          const bankInfo = [
            company.bankName && `ธนาคาร / Bank: ${company.bankName}`,
            company.bankAccount && `เลขที่บัญชี / Account No: ${company.bankAccount}`,
            company.bankAccountName && `ชื่อบัญชี / Account Name: ${company.bankAccountName}`,
          ]
            .filter(Boolean)
            .join('\n');

          doc.text(bankInfo, margin + 10, yPos);
        }
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc
        .fontSize(9)
        .font(regularFontPath)
        .text(
          'เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์ / This is a computer-generated document',
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );

      // PromptPay QR Code — bottom left area (same as receipt)
      const invoicePromptpayId = (invoice as any)?.promptpayId || (company as any)?.promptpayId;
      if (invoicePromptpayId) {
        try {
          const amountSatang = invoice.netAmount ?? 0;
          const amountBaht = amountSatang / 100;
          const payload = promptpayQR({
            accountNumber: invoicePromptpayId,
            amount: amountBaht,
            reference: invoice.invoiceNumber || '',
          });
          const qrSvg: string = qrToString(payload, { type: 'svg' }) as string;
          const qrSize = 90;
          const pageH = doc.page.height;
          doc.image(qrSvg, margin, pageH - margin - qrSize, { width: qrSize, height: qrSize });
          doc
            .font(regularFontPath)
            .fontSize(7)
            .text('สแกนจ่ายด้วย PromptPay / Scan to pay', margin, pageH - margin - qrSize - 10, {
              width: qrSize,
              align: 'center',
            });
        } catch (qrErr) {
          console.warn('QR generation failed:', qrErr);
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Receipt PDF with PDFKit
 */
export async function generateReceiptPDFWithPDFKit(receipt: any): Promise<Buffer> {
  const company = await getCompanyInfo();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const regularFontPath = getFontPath('THSarabunNew.ttf');
      const boldFontPath = getFontPath('THSarabunNew-Bold.ttf');

      doc.font(regularFontPath);

      const pageWidth = doc.page.width;
      const margin = 50;
      let yPos = 50;

      // Company Header
      doc
        .fontSize(16)
        .font(boldFontPath)
        .text(company?.name || 'Company Name', margin, yPos)
        .font(regularFontPath);
      yPos += 25;

      doc.fontSize(10);
      if (company?.address) {
        doc.text(company.address, margin, yPos);
        yPos += 15;
      }
      if (company?.taxId) {
        doc.text(`เลขประจำตัวผู้เสียภาษี: ${company.taxId}`, margin, yPos);
        yPos += 15;
      }
      if (company?.phone) {
        doc.text(`โทร: ${company.phone}`, margin, yPos);
        yPos += 15;
      }

      // Document Title
      doc
        .fontSize(20)
        .font(boldFontPath)
        .text('ใบเสร็จรับเงิน / RECEIPT', pageWidth / 2, yPos, { align: 'center' })
        .font(regularFontPath);
      yPos += 35;

      // Receipt Details
      doc.fontSize(11);
      doc.text('เลขที่ / Receipt No:', margin, yPos);
      doc.text(receipt.receiptNo, margin + 60, yPos);
      yPos += 18;

      doc.text('วันที่ / Date:', margin, yPos);
      doc.text(formatDateThai(receipt.receiptDate), margin + 60, yPos);
      yPos += 18;

      // Customer Info
      doc
        .font(boldFontPath)
        .text('รับเงินจาก / Received from:', margin, yPos)
        .font(regularFontPath);
      yPos += 18;

      doc.text(receipt.customer?.name || 'N/A', margin, yPos);
      yPos += 18;

      if (receipt.customer?.taxId) {
        doc.text(`เลขประจำตัวผู้เสียภาษี: ${receipt.customer.taxId}`, margin, yPos);
        yPos += 18;
      }

      if (receipt.customer?.address) {
        doc.text(receipt.customer.address, margin, yPos, {
          width: pageWidth - margin * 2,
        });
        yPos += 30;
      }

      // Amount Section
      doc
        .font(boldFontPath)
        .fontSize(14)
        .text(`จำนวนเงิน / Amount: ${formatCurrency(receipt.amount)} บาท`, margin, yPos)
        .font(regularFontPath);
      yPos += 30;

      // Payment Method
      doc.fontSize(11);
      doc.text('วิธีการชำระ / Payment Method:', margin, yPos);
      yPos += 18;

      doc.text(receipt.paymentMethod || 'เงินสด / CASH', margin + 10, yPos);
      yPos += 18;

      if (receipt.bankName) {
        doc.text(`ธนาคาร / Bank: ${receipt.bankName}`, margin + 10, yPos);
        yPos += 18;
      }

      if (receipt.bankAccount) {
        doc.text(`บัญชี / Account: ${receipt.bankAccount}`, margin + 10, yPos);
        yPos += 18;
      }

      if (receipt.chequeNo) {
        doc.text(`เลขที่เช็ค / Cheque No: ${receipt.chequeNo}`, margin + 10, yPos);
        yPos += 18;
      }

      // Summary
      yPos += 10;
      const summaryX = pageWidth - margin - 100;

      // Withholding Tax
      if (receipt.withholding > 0) {
        doc.text('ภาษีหัก ณ ที่จ่าย / Withholding Tax:', summaryX, yPos);
        doc.text(`(${formatCurrency(receipt.withholding)})`, pageWidth - margin, yPos, {
          align: 'right',
        });
        yPos += 18;
      }

      // Discount
      if (receipt.discount > 0) {
        doc.text('ส่วนลด / Discount:', summaryX, yPos);
        doc.text(`(${formatCurrency(receipt.discount)})`, pageWidth - margin, yPos, {
          align: 'right',
        });
        yPos += 18;
      }

      // Net Amount
      doc
        .font(boldFontPath)
        .fontSize(13)
        .text('ยอดสุทธิ / Net Received:', summaryX, yPos)
        .fillColor('green')
        .text(formatCurrency(receipt.netAmount), pageWidth - margin, yPos, {
          align: 'right',
        })
        .fillColor('black');
      yPos += 30;

      // PromptPay QR Code — bottom left area
      const promptpayId = receipt.promptpayId || (company as any)?.promptpayId;
      if (promptpayId) {
        try {
          const amountSatang = receipt.netAmount ?? 0;
          const amountBaht = amountSatang / 100;
          const payload = promptpayQR({
            accountNumber: promptpayId,
            amount: amountBaht,
            reference: receipt.receiptNo || '',
          });
          const qrSvg: string = qrToString(payload, { type: 'svg' }) as string;
          const qrSize = 90;
          const pageH = doc.page.height;
          doc.image(qrSvg, margin, pageH - margin - qrSize, { width: qrSize, height: qrSize });
          doc
            .font(regularFontPath)
            .fontSize(7)
            .text('สแกนจ่ายด้วย PromptPay / Scan to pay', margin, pageH - margin - qrSize - 10, {
              width: qrSize,
              align: 'center',
            });
        } catch (qrErr) {
          console.warn('QR generation failed:', qrErr);
        }
      }

      // Notes
      if (receipt.notes) {
        doc.font(regularFontPath).fontSize(10).text('หมายเหตุ / Notes:', margin, yPos);
        yPos += 15;

        doc.text(receipt.notes, margin, yPos);
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc
        .fontSize(9)
        .text(
          'เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์ / This is a computer-generated document',
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Payslip PDF with PDFKit
 */
export async function generatePayslipPDFWithPDFKit(data: any): Promise<Buffer> {
  const company = data.company || (await getCompanyInfo());
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const regularFontPath = getFontPath('THSarabunNew.ttf');
      const boldFontPath = getFontPath('THSarabunNew-Bold.ttf');

      doc.font(regularFontPath);

      const pageWidth = doc.page.width;
      const margin = 50;
      let yPos = 50;

      // Thai month names
      const THAI_MONTHS = [
        'มกราคม',
        'กุมภาพันธ์',
        'มีนาคม',
        'เมษายน',
        'พฤษภาคม',
        'มิถุนายน',
        'กรกฎาคม',
        'สิงหาคม',
        'กันยายน',
        'ตุลาคม',
        'พฤศจิกายน',
        'ธันวาคม',
      ];

      // Company Header
      doc
        .fontSize(16)
        .font(boldFontPath)
        .text(company?.name || 'Company Name', margin, yPos)
        .font(regularFontPath);
      yPos += 25;

      doc.fontSize(10);
      if (company?.address) {
        doc.text(company.address, margin, yPos);
        yPos += 15;
      }
      if (company?.taxId) {
        doc.text(`เลขประจำตัวผู้เสียภาษี: ${company.taxId}`, margin, yPos);
        yPos += 15;
      }

      // Payslip Title
      doc
        .fontSize(22)
        .font(boldFontPath)
        .text('สลิปเงินเดือน / PAYSLIP', pageWidth / 2, yPos, { align: 'center' })
        .font(regularFontPath);
      yPos += 35;

      // Pay Period
      doc.fontSize(11);
      doc.text('งวดเงินเดือน / Pay Period:', margin, yPos);
      yPos += 18;

      const monthName = THAI_MONTHS[data.payrollRun.periodMonth - 1];
      const periodText = `${monthName} ${data.payrollRun.periodYear + 543}`;
      doc.text(periodText, margin + 10, yPos);
      yPos += 25;

      // Employee Information
      doc
        .fontSize(11)
        .font(boldFontPath)
        .text('ข้อมูลพนักงาน / Employee Information', margin, yPos)
        .font(regularFontPath);
      yPos += 15;

      const employeeName = `${data.employee.firstName} ${data.employee.lastName}`;
      doc.fontSize(10);
      doc.text(`ชื่อ-สกุล / Name: ${employeeName}`, margin + 10, yPos);
      yPos += 18;

      doc.text(`รหัสพนักงาน / Employee ID: ${data.employee.employeeCode}`, margin + 10, yPos);
      yPos += 18;

      if (data.employee.position) {
        doc.text(`ตำแหน่ง / Position: ${data.employee.position}`, margin + 10, yPos);
        yPos += 18;
      }

      yPos += 10;

      // Earnings Section
      doc
        .fontSize(12)
        .font(boldFontPath)
        .fillColor('blue')
        .text('รายการรับ / EARNINGS', margin, yPos)
        .fillColor('black')
        .font(regularFontPath);
      yPos += 20;

      const earningsData = [
        ['เงินเดือนพื้นฐาน / Basic Salary', formatCurrency(data.payroll.baseSalary)],
        ['เบี้ยเลี้ยงและอื่นๆ / Additions', formatCurrency(data.payroll.additions)],
        ['', ''],
        ['รายได้รวม / Gross Salary', formatCurrency(data.payroll.grossSalary)],
      ];

      earningsData.forEach((row, i) => {
        const isLast = i === earningsData.length - 1;
        if (isLast) {
          doc.font(boldFontPath).fontSize(11);
        } else {
          doc.font(regularFontPath).fontSize(10);
        }

        doc.text(row[0], margin, yPos, { width: 250 });
        doc.text(row[1], margin + 260, yPos, { width: 100, align: 'right' });
        yPos += 16;
      });

      yPos += 10;

      // Deductions Section
      doc
        .fontSize(12)
        .font(boldFontPath)
        .fillColor('red')
        .text('รายการหัก / DEDUCTIONS', margin, yPos)
        .fillColor('black')
        .font(regularFontPath);
      yPos += 20;

      const deductionsData = [
        ['ประกันสังคม / Social Security', formatCurrency(data.payroll.socialSecurity)],
        ['ภาษีเงินได้หัก ณ ที่จ่าย / Withholding Tax', formatCurrency(data.payroll.withholdingTax)],
        ['หักอื่นๆ / Other Deductions', formatCurrency(data.payroll.deductions)],
        ['', ''],
        [
          'รวมหัก / Total Deductions',
          formatCurrency(
            data.payroll.socialSecurity + data.payroll.withholdingTax + data.payroll.deductions
          ),
        ],
      ];

      deductionsData.forEach((row, i) => {
        const isLast = i === deductionsData.length - 1;
        if (isLast) {
          doc.font(boldFontPath).fontSize(11);
        } else {
          doc.font(regularFontPath).fontSize(10);
        }

        doc.text(row[0], margin, yPos, { width: 250 });
        doc.text(row[1], margin + 260, yPos, { width: 100, align: 'right' });
        yPos += 16;
      });

      yPos += 15;

      // Net Pay Section
      doc
        .rect(margin, yPos, pageWidth - margin * 2, 30)
        .fillColor('lightgreen')
        .fill();

      doc
        .fillColor('darkgreen')
        .fontSize(14)
        .font(boldFontPath)
        .text('เงินได้สุทธิ / NET PAY', margin + 10, yPos + 10);

      doc
        .fontSize(20)
        .text(formatCurrency(data.payroll.netPay), pageWidth - margin - 10, yPos + 5, {
          align: 'right',
        });

      doc.fillColor('black');
      yPos += 40;

      // Footer
      const footerY = doc.page.height - 50;
      doc
        .fontSize(9)
        .font(regularFontPath)
        .text(
          `เอกสารนี้เป็นการสร้างจากระบบคอมพิวเตอร์ / Generated by Thai Accounting ERP | ${formatDateThai(new Date())}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Export all functions
const pdfExports = {
  generateThaiTestPDF,
  generateInvoicePDFWithPDFKit,
  generateReceiptPDFWithPDFKit,
  generatePayslipPDFWithPDFKit,
  formatCurrency,
  formatDateThai,
  formatAddress,
};
export default pdfExports;
