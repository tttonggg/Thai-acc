import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/invoices/[id]/preview
 * Generate HTML preview for invoice with customization support
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();

    const invoice = await prisma.invoice.findUnique({
      where: { id: id },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'ไม่พบใบกำกับภาษี' }, { status: 404 });
    }

    // Get company info
    const company = await prisma.company.findFirst();

    // Format data for template
    const data = {
      company: company
        ? {
            name: company.name,
            address: company.address,
            taxId: company.taxId,
            phone: company.phone,
          }
        : null,
      invoice: {
        invoiceNo: invoice.invoiceNo,
        invoiceDate: formatDateThai(invoice.invoiceDate),
        dueDate: invoice.dueDate ? formatDateThai(invoice.dueDate) : null,
        reference: invoice.reference,
      },
      customer: invoice.customer
        ? {
            name: invoice.customer.name,
            taxId: invoice.customer.taxId,
            address: formatAddress(invoice.customer),
          }
        : null,
      items: invoice.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        discount: line.discount || 0,
        amount: line.amount,
      })),
      summary: {
        subtotal: invoice.subtotal,
        discount: invoice.discountAmount || 0,
        vatRate: invoice.vatRate,
        vat: invoice.vatAmount,
        total: invoice.netAmount,
      },
    };

    // Read HTML template
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'templates',
      'invoice-template.html'
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Inject data into template
    const dataScript = `
      <script>
        window.invoiceData = ${JSON.stringify(data)};
      </script>
    `;

    html = html.replace('</head>', dataScript + '</head>');

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Invoice preview error:', error);

    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างพรีวิว' },
      { status: 500 }
    );
  }
}

function formatDateThai(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function formatAddress(customer: any): string {
  const parts = [
    customer.address,
    customer.subDistrict,
    customer.district,
    customer.province,
    customer.postalCode,
  ].filter(Boolean);
  return parts.join(' ');
}
