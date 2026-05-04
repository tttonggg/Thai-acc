import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import path from 'path';
import { handleApiError } from '@/lib/api-error-handler';

// Dynamic import to avoid bundling PDFKit on the client side
async function generateFiftyTawiPDF(whtData: any, companyData: any): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew.ttf');
  const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew-Bold.ttf');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Register Thai fonts
    doc.registerFont('Thai', fontPath);
    doc.registerFont('ThaiBold', fontBoldPath);

    const pageWidth = doc.page.width - 80; // 40px margin each side
    const col1 = 40;
    const col2 = 300;

    // ===== HEADER =====
    doc
      .font('ThaiBold')
      .fontSize(16)
      .text('หนังสือรับรองการหักภาษี ณ ที่จ่าย', 40, 40, { align: 'center', width: pageWidth });
    doc
      .font('Thai')
      .fontSize(12)
      .text('(ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)', 40, 62, { align: 'center', width: pageWidth });

    // Document number & date
    doc.font('Thai').fontSize(11);
    doc.text(`เลขที่: ${whtData.documentNo}`, col2, 90);
    doc.text(`วันที่: ${formatThaiDate(whtData.documentDate)}`, col2, 108);

    // ===== PAYER (บริษัทผู้จ่ายเงิน) =====
    doc.font('ThaiBold').fontSize(11).text('ผู้จ่ายเงิน', col1, 135);
    doc
      .moveTo(col1, 148)
      .lineTo(col1 + pageWidth, 148)
      .stroke();

    doc.font('Thai').fontSize(11);
    doc.text(`ชื่อ: ${companyData?.name || '-'}`, col1, 155);
    doc.text(`ที่อยู่: ${companyData?.address || '-'}`, col1, 171, { width: pageWidth });
    doc.text(`เลขประจำตัวผู้เสียภาษี: ${companyData?.taxId || '-'}`, col1, 205);

    // ===== PAYEE (ผู้มีเงินได้) =====
    doc.font('ThaiBold').fontSize(11).text('ผู้มีเงินได้', col1, 230);
    doc
      .moveTo(col1, 243)
      .lineTo(col1 + pageWidth, 243)
      .stroke();

    doc.font('Thai').fontSize(11);
    doc.text(`ชื่อ: ${whtData.payeeName || '-'}`, col1, 250);
    doc.text(`ที่อยู่: ${whtData.payeeAddress || '-'}`, col1, 266, { width: pageWidth });
    doc.text(`เลขประจำตัวผู้เสียภาษี: ${whtData.payeeTaxId || '-'}`, col1, 300);

    // ===== INCOME TYPE TABLE =====
    const tableTop = 330;
    doc.font('ThaiBold').fontSize(11).text('รายการและจำนวนเงินที่จ่าย', col1, tableTop);
    doc
      .moveTo(col1, tableTop + 13)
      .lineTo(col1 + pageWidth, tableTop + 13)
      .stroke();

    // Table Header
    const th = tableTop + 20;
    doc.font('ThaiBold').fontSize(10);
    doc.text('ประเภทเงินได้', col1, th, { width: 200 });
    doc.text('จำนวนเงินได้ (บาท)', col1 + 200, th, { width: 120, align: 'right' });
    doc.text('อัตราภาษี (%)', col1 + 320, th, { width: 80, align: 'right' });
    doc.text('ภาษีที่หัก (บาท)', col1 + 400, th, { width: 100, align: 'right' });
    doc
      .moveTo(col1, th + 14)
      .lineTo(col1 + pageWidth, th + 14)
      .stroke();

    // Table Row
    const tr = th + 22;
    doc.font('Thai').fontSize(11);
    doc.text(whtData.incomeType || 'ค่าบริการ', col1, tr, { width: 200 });
    doc.text(formatNumber(whtData.incomeAmount), col1 + 200, tr, { width: 120, align: 'right' });
    doc.text(`${whtData.whtRate.toFixed(2)}%`, col1 + 320, tr, { width: 80, align: 'right' });
    doc.text(formatNumber(whtData.whtAmount), col1 + 400, tr, { width: 100, align: 'right' });
    doc
      .moveTo(col1, tr + 18)
      .lineTo(col1 + pageWidth, tr + 18)
      .stroke();

    // Total row
    const totalRow = tr + 26;
    doc.font('ThaiBold').fontSize(11);
    doc.text('รวม', col1, totalRow, { width: 200 });
    doc.text(formatNumber(whtData.incomeAmount), col1 + 200, totalRow, {
      width: 120,
      align: 'right',
    });
    doc.text(formatNumber(whtData.whtAmount), col1 + 400, totalRow, { width: 100, align: 'right' });
    doc
      .moveTo(col1, totalRow + 16)
      .lineTo(col1 + pageWidth, totalRow + 16)
      .strokeColor('black')
      .stroke();

    // ===== PND TYPE =====
    const pndY = totalRow + 30;
    doc.font('Thai').fontSize(11);
    const pndText = whtData.type === 'PND3' ? '☑ ภ.ง.ด.3   ☐ ภ.ง.ด.53' : '☐ ภ.ง.ด.3   ☑ ภ.ง.ด.53';
    doc.text(`ประเภทใบแนบ: ${pndText}`, col1, pndY);

    // ===== PAYMENT CONDITION =====
    const condY = pndY + 20;
    doc.text(
      'เงื่อนไขการชำระเงิน: ☑ หัก ณ ที่จ่าย   ☐ ออกให้ตลอดไป   ☐ ออกให้ครั้งเดียว',
      col1,
      condY
    );

    // ===== SIGNATURE =====
    const sigY = condY + 50;
    doc.font('Thai').fontSize(11);
    doc.text('ลงชื่อ _____________________________ ผู้จ่ายเงิน', col1, sigY);
    doc.text(`(${companyData?.name || '...........................'})`, col1 + 60, sigY + 18);
    doc.text(`วันที่ ${formatThaiDate(whtData.documentDate)}`, col1 + 60, sigY + 36);

    doc.text('ลงชื่อ _____________________________ ผู้รับเงิน', col2 + 20, sigY);
    doc.text(`(${whtData.payeeName || '...........................'})`, col2 + 80, sigY + 18);

    // ===== FOOTER NOTE =====
    const footY = sigY + 70;
    doc.font('Thai').fontSize(9).fillColor('gray');
    doc.text('* กรุณาเก็บเอกสารนี้ไว้เพื่อใช้ประกอบการยื่นแบบแสดงรายการภาษีเงินได้', col1, footY, {
      align: 'center',
      width: pageWidth,
    });
    doc.text(
      `สร้างโดย Thai Accounting ERP — ${new Date().toLocaleString('th-TH')}`,
      col1,
      footY + 14,
      { align: 'center', width: pageWidth }
    );

    doc.end();
  });
}

function formatThaiDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'buddhist',
  } as any);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// GET /api/wht/[id]/pdf — Generate 50 Tawi PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const whtRecord = await prisma.withholdingTax.findUnique({ where: { id } });
    if (!whtRecord) {
      return NextResponse.json({ success: false, error: 'ไม่พบเอกสาร' }, { status: 404 });
    }

    const company = await prisma.company.findFirst();

    const pdfBuffer = await generateFiftyTawiPDF(whtRecord, company);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="50-Tawi-${whtRecord.documentNo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถสร้าง PDF ได้: ' + error.message },
      { status: 500 }
    );
  }
}
