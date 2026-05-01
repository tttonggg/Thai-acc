# PDF Generator Service

บริการสร้างเอกสาร PDF สำหรับระบบบัญชีไทย (Thai Accounting ERP System)

## Overview

บริการนี้ให้การสร้างเอกสาร PDF สำหรับเอกสารบัญชีต่างๆ ในระบบ ERP บัญชีไทย โดยใช้
jsPDF และ jspdf-autotable

This service provides PDF generation for various accounting documents in the
Thai Accounting ERP system using jsPDF and jspdf-autotable.

## Features

### Supported Documents

1. **Invoice/Tax Invoice (ใบกำกับภาษี)** - `generateInvoicePDF()`
   - Company header with logo, name, address, tax ID
   - Invoice number, date, due date
   - Customer details
   - Line items table
   - Summary section (subtotal, discount, VAT, grand total)
   - Terms and conditions

2. **Receipt (ใบเสร็จรับเงิน)** - `generateReceiptPDF()`
   - Payment details
   - Payment method information
   - Amount breakdown

3. **Journal Entry (บันทึกบัญชี)** - `generateJournalEntryPDF()`
   - Entry number and date
   - Debit/Credit table
   - Balance verification

4. **Trial Balance (งบทดลอง)** - `generateTrialBalancePDF()`
   - Account listing
   - Debit/Credit balances
   - Total verification

5. **Income Statement (งบกำไรขาดทุน)** - `generateIncomeStatementPDF()`
   - Revenue section
   - Expense section
   - Net income calculation

6. **Balance Sheet (งบดุล)** - `generateBalanceSheetPDF()`
   - Assets section
   - Liabilities section
   - Equity section
   - Balance verification

## API Endpoints

### Invoice PDF Export

```
GET /api/invoices/[id]/export/pdf
```

### Receipt PDF Export

```
GET /api/receipts/[id]/export/pdf
```

### Journal Entry PDF Export

```
GET /api/journal-entries/[id]/export/pdf
```

### Trial Balance PDF Export

```
GET /api/reports/trial-balance/export/pdf?startDate=2024-01-01&endDate=2024-12-31
```

### Income Statement PDF Export

```
GET /api/reports/income-statement/export/pdf?startDate=2024-01-01&endDate=2024-12-31
```

### Balance Sheet PDF Export

```
GET /api/reports/balance-sheet/export/pdf?endDate=2024-12-31
```

## Usage Examples

### Client-side Usage (React Component)

```tsx
import { useRouter } from 'next/navigation';

export function InvoiceExportButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/export/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return <button onClick={handleExport}>Export PDF</button>;
}
```

### Server-side Usage

```typescript
import { generateInvoicePDF } from '@/lib/pdf-generator';

export async function generateInvoiceDocument(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const pdfBytes = await generateInvoicePDF(invoice);

  // Save to file system or storage
  // Or return as response
  return pdfBytes;
}
```

## Thai Font Support

### Current Status (MVP)

The current implementation uses **English labels with Thai data where
possible**. This is a pragmatic approach for the MVP phase.

**Limitations:**

- jsPDF's default fonts don't support Thai characters
- Thai text in customer names, addresses, and product descriptions may not
  render correctly
- Only ASCII characters (English) are fully supported

### Production Implementation (Thai Font Support)

To enable full Thai font support, you need to:

#### Option 1: Add Custom Thai Font (Recommended)

1. **Convert Thai Font to Base64**

```bash
# Using online tool or script
# Convert Sarabun or THSarabun .ttf to base64
```

2. **Add Font to jsPDF**

```typescript
import jsPDF from 'jspdf';

// Load font files (these would be actual base64 strings)
const sarabunRegularBase64 = '...'; // Load from file or CDN
const sarabunBoldBase64 = '...';

export function addThaiFont(doc: jsPDF) {
  // Add font files to virtual file system
  doc.addFileToVFS('Sarabun-Regular.ttf', sarabunRegularBase64);
  doc.addFileToVFS('Sarabun-Bold.ttf', sarabunBoldBase64);

  // Register fonts
  doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
  doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');

  // Set as active font
  doc.setFont('Sarabun', 'normal');
}
```

3. **Use in PDF Generation**

```typescript
export async function generateInvoicePDF(invoice: any): Promise<Uint8Array> {
  const doc = new jsPDF();

  // Add Thai font
  addThaiFont(doc);

  // Now Thai text will render correctly
  doc.text('ใบกำกับภาษี', 15, 20);
  doc.text(invoice.customer.name, 15, 30);

  return doc.output('arraybuffer') as Uint8Array;
}
```

#### Option 2: Use HTML to PDF Converter (Alternative)

```typescript
import { htmlToPdf } from 'some-html-to-pdf-library';

export async function generateInvoicePDF(invoice: any) {
  const html = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; }
        </style>
      </head>
      <body>
        <h1>ใบกำกับภาษี</h1>
        <p>${invoice.customer.name}</p>
      </body>
    </html>
  `;

  return htmlToPdf(html);
}
```

#### Recommended Thai Fonts

- **Sarabun** (Google Fonts) - Modern, widely used
- **THSarabun** - Traditional Thai government font
- **Kanit** - Modern, clean design
- **Prompt** - Contemporary sans-serif

### Font Resources

- Google Fonts Thai: https://fonts.google.com/?subset=thai
- Sarabun Font: https://fonts.google.com/specimen/Sarabun
- THSarabun Download: Available from Thai government websites

## Formatting

### Currency Format

```typescript
formatCurrency(1234.56); // "฿1,234.56"
```

### Date Format (Buddhist Era)

```typescript
formatDateThai(new Date('2024-12-31')); // "31/12/2567"
```

### Address Format

```typescript
formatAddress({
  address: '123 ถนนสุขุมวิท',
  subDistrict: 'คลองตันเหนือ',
  district: 'วัฒนา',
  province: 'กรุงเทพมหานคร',
  postalCode: '10110',
});
// "123 ถนนสุขุมวิท คลองตันเหนือ วัฒนา กรุงเทพมหานคร 10110"
```

## Configuration

### Page Settings

```typescript
const doc = new jsPDF({
  orientation: 'portrait', // or 'landscape'
  unit: 'mm',
  format: 'a4',
});
```

### Table Styling

```typescript
doc.autoTable({
  startY: 50,
  head: [['Column 1', 'Column 2']],
  body: [['Data 1', 'Data 2']],
  theme: 'grid', // 'striped', 'grid', 'plain'
  headStyles: {
    fillColor: [66, 66, 66],
    textColor: 255,
    fontSize: 10,
  },
  bodyStyles: {
    fontSize: 9,
  },
});
```

## Error Handling

All API routes include error handling:

```typescript
try {
  const pdfBytes = await generateInvoicePDF(invoice);
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  });
} catch (error) {
  return NextResponse.json(
    { error: 'Failed to generate PDF' },
    { status: 500 }
  );
}
```

## Performance Considerations

1. **Company Info Caching**: Company information is cached to reduce database
   queries
2. **Async Operations**: PDF generation is non-blocking
3. **Memory Management**: Large reports may require pagination
4. **Streaming**: For very large documents, consider streaming the response

## Testing

```typescript
import { generateInvoicePDF } from '@/lib/pdf-generator';

describe('PDF Generator', () => {
  it('should generate invoice PDF', async () => {
    const mockInvoice = {
      invoiceNo: 'INV001',
      invoiceDate: new Date(),
      customer: { name: 'Test Customer' },
      lines: [],
      subtotal: 1000,
      vatAmount: 70,
      netAmount: 1070,
    };

    const pdf = await generateInvoicePDF(mockInvoice);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Thai Characters Not Displaying

**Problem**: Thai text appears as boxes or question marks

**Solution**: Implement Thai font support (see "Thai Font Support" section
above)

### PDF Generation Timeout

**Problem**: Large reports timeout during generation

**Solution**:

- Add pagination
- Use streaming responses
- Increase server timeout

### Memory Issues

**Problem**: Out of memory errors with large datasets

**Solution**:

- Limit data size
- Implement batch processing
- Use server-side pagination

## Future Enhancements

1. [ ] Full Thai font support with font embedding
2. [ ] Digital signatures
3. [ ] QR code integration (eTax integration)
4. [ ] Multi-language support (TH/EN switch)
5. [ ] Custom templates
6. [ ] Batch PDF generation
7. [ ] PDF archival/storage system
8. [ ] Email integration (send PDF directly)
9. [ ] PDF watermarking
10. [ ] Merge multiple PDFs

## Dependencies

```json
{
  "jspdf": "^4.2.0",
  "jspdf-autotable": "^5.0.7"
}
```

## License

This PDF generator service is part of the Thai Accounting ERP System.

## Support

For issues or questions:

- Check the troubleshooting section
- Review jsPDF documentation: https://github.com/parallax/jsPDF
- Review jspdf-autotable documentation:
  https://github.com/simonbengtsson/jsPDF-AutoTable
