/**
 * Test PDFKit with Thai Fonts
 * ทดสอบ PDFKit กับฟอนต์ภาษาไทย
 */

import { generateThaiTestPDF } from '../pdfkit-generator'
import * as fs from 'fs'
import * as path from 'path'

async function testPDFKit() {
  console.log('🧪 Testing PDFKit with Thai Fonts...\n')

  try {
    // Generate test PDF
    console.log('📄 Generating Thai test PDF...')
    const pdfBuffer = await generateThaiTestPDF()

    // Save to file
    const outputPath = path.join(process.cwd(), 'pdfkit-thai-test.pdf')
    fs.writeFileSync(outputPath, pdfBuffer)

    console.log(`✅ SUCCESS! PDF generated at: ${outputPath}`)
    console.log(`📊 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    console.log('\n✨ Thai fonts should render correctly in the generated PDF!')
    console.log('📝 Please open the PDF and verify Thai text is visible.\n')

    return true
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Check that THSarabunNew.ttf exists in public/fonts/')
    console.error('2. Verify PDFKit is installed: npm list pdfkit')
    console.error('3. Check file permissions for writing output\n')
    return false
  }
}

// Run test
testPDFKit()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
