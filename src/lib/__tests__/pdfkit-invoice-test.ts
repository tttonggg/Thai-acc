/**
 * Test PDFKit Invoice Generation
 * ทดสอบการสร้างใบกำกับภาษีด้วย PDFKit
 */

import { generateInvoicePDFWithPDFKit } from '../pdfkit-generator'

async function testInvoiceGeneration() {
  console.log('🧪 Testing PDFKit Invoice Generation...\n')

  try {
    // Mock invoice data
    const mockInvoice = {
      invoiceNo: 'INV-2026-0001',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customer: {
        name: 'บริษัท ตัวอย่าง จำกัด',
        taxId: '0105551234567',
        address: '123 ถนนสุขุมวิท',
        subDistrict: 'คลองตัน',
        district: 'เขตคลองเตย',
        province: 'กรุงเทพฯ',
        postalCode: '10110',
        branchCode: '00000'
      },
      type: 'TAX_INVOICE',
      lines: [
        {
          lineNo: 1,
          description: 'บริการให้คำปรึกษาด้านระบบบัญชี',
          quantity: 1,
          unit: 'ครั้ง',
          unitPrice: 5000,
          discount: 0,
          amount: 5000
        },
        {
          lineNo: 2,
          description: 'การติดตั้งซอฟต์แวร์บัญชี',
          quantity: 2,
          unit: 'เครื่อง',
          unitPrice: 2500,
          discount: 500,
          amount: 4500
        },
        {
          lineNo: 3,
          description: 'การอบรมการใช้งานระบบ',
          quantity: 5,
          unit: 'ชั่วโมง',
          unitPrice: 500,
          discount: 0,
          amount: 2500
        }
      ],
      subtotal: 12000,
      discountAmount: 500,
      vatRate: 7,
      vatAmount: 805,
      totalAmount: 12305,
      netAmount: 12305,
      notes: 'ชำระภายใน 30 วันนับจากวันที่รับใบกำกับภาษี',
      reference: 'PO-2026-001'
    }

    console.log('📄 Generating invoice PDF...')
    const pdfBuffer = await generateInvoicePDFWithPDFKit(mockInvoice)

    // Save to file
    const fs = await import('fs')
    const path = await import('path')
    const outputPath = path.join(process.cwd(), 'pdfkit-invoice-test.pdf')
    fs.writeFileSync(outputPath, pdfBuffer)

    console.log(`✅ SUCCESS! Invoice PDF generated at: ${outputPath}`)
    console.log(`📊 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    console.log('\n✨ Thai invoice with full font support!')
    console.log('📝 Please open the PDF and verify:\n')
    console.log('   - Thai company name renders correctly')
    console.log('   - Thai customer address renders correctly')
    console.log('   - Thai line items render correctly')
    console.log('   - Thai totals and terms render correctly\n')

    return true
  } catch (error) {
    console.error('❌ Error generating invoice PDF:', error)
    return false
  }
}

// Run test
testInvoiceGeneration()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
