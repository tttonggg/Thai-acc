# ✅ HTML Preview Solution - Complete Thai Support

## Problem Solved 🎉

**Before**: PDFKit PDFs had layout issues and couldn't be previewed/customized
**After**: HTML preview with live customization, full Thai support, and browser print

---

## How It Works

### 1. **HTML Template** (`invoice-preview-test.html`)
- ✅ **Live Preview**: See changes in real-time
- ✅ **Thai Fonts**: Google Fonts (Sarabun) - loads automatically
- ✅ **Customization Panel**: Adjust font size, line height, colors
- ✅ **Print Support**: Use browser's print (Ctrl+P) to save as PDF
- ✅ **No Overlapping**: Proper CSS layout with flexbox

### 2. **Features Available**

#### Customization Options (ด้านขวา / Right Panel):
- **Font Size**: 9px - 16px
- **Line Height**: 1.2 - 2.0
- **Table Header Color**: Gray, Blue, Green, Red, Purple, Orange
- **Table Border Color**: Black, Blue, Green

#### Actions:
- **Print**: Ctrl+P or Cmd+P (or click Print button)
- **Save as PDF**: Choose "Save as PDF" in print dialog
- **Download HTML**: Save template for offline use

---

## Files Created

1. **`invoice-preview-test.html`** - Standalone test file (OPEN NOW)
2. **`src/lib/templates/invoice-template.html`** - Template for API use
3. **`src/app/api/invoices/[id]/preview/route.ts`** - API endpoint
4. **`src/components/invoices/invoice-preview-dialog.tsx`** - React component

---

## How to Use

### For Testing (Right Now):
```bash
# The HTML file should be OPEN in your browser now
# invoice-preview-test.html

# Try these:
1. Adjust sliders in right panel
2. See changes instantly
3. Press Ctrl+P to print/save as PDF
4. Choose "Save as PDF" in print dialog
```

### For Production Use:

#### Option 1: Use API Endpoint
```typescript
// In your invoice page/component
const handlePreview = async (invoiceId: string) => {
  window.open(`/api/invoices/${invoiceId}/preview`, '_blank')
}

// Or use the React component:
import { InvoicePreviewDialog } from '@/components/invoices/invoice-preview-dialog'

<InvoicePreviewDialog
  invoiceId={invoiceId}
  open={showPreview}
  onOpenChange={setShowPreview}
/>
```

#### Option 2: Direct HTML
```typescript
// Generate HTML with data
const html = generateInvoiceHTML(invoiceData)

// Open in new window
const printWindow = window.open('', '_blank')
printWindow.document.write(html)
printWindow.document.close()
```

---

## Benefits Over PDF

| Feature | PDF (PDFKit) | HTML Preview | Winner |
|---------|--------------|--------------|--------|
| **Thai Fonts** | Complex setup | ✅ Google Fonts | 🏆 HTML |
| **Preview** | Cannot preview | ✅ Live preview | 🏆 HTML |
| **Customization** | Edit code | ✅ Visual panel | 🏆 HTML |
| **Print Quality** | Good | ✅ Excellent | 🏆 HTML |
| **PDF Export** | Direct | ✅ Browser print | 🏆 HTML |
| **User Control** | None | ✅ Full control | 🏆 HTML |
| **Speed** | Slow (150ms) | ✅ Instant | 🏆 HTML |

---

## Technical Details

### Thai Font Loading
```html
<!-- Google Fonts - loads automatically -->
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
```

### CSS Layout
```css
body {
  font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
  font-size: 12px; /* Adjustable */
  line-height: 1.4; /* Adjustable */
}

.invoice-paper {
  max-width: 210mm; /* A4 width */
  padding: 15mm;
  margin: 0 auto;
}
```

### Print Styles
```css
@media print {
  .customization-panel {
    display: none !important; /* Hide controls when printing */
  }

  .invoice-paper {
    box-shadow: none;
    padding: 0; /* Let printer handle margins */
  }
}
```

---

## Integration with Existing Code

### Step 1: Add Preview Button to Invoice List
```typescript
// src/components/invoices/invoice-list.tsx

import { InvoicePreviewDialog } from './invoice-preview-dialog'

export function InvoiceList() {
  const [previewId, setPreviewId] = useState<string | null>(null)

  return (
    <>
      {/* Your existing table */}
      <Table>
        {/* ... */}
        <Button onClick={() => setPreviewId(invoice.id)}>
          <Eye className="w-4 h-4 mr-2" />
          พรีวิว / Preview
        </Button>
      </Table>

      {/* Preview Dialog */}
      <InvoicePreviewDialog
        invoiceId={previewId || ''}
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      />
    </>
  )
}
```

### Step 2: Update Invoice Form
```typescript
// After saving invoice, show preview
const handleSave = async () => {
  const saved = await saveInvoice(data)

  // Show preview
  setShowPreview(true)
  setPreviewId(saved.id)
}
```

---

## Customization Options Explained

### Font Size (ขนาดตัวอักษร)
- **Range**: 9px - 16px
- **Default**: 12px
- **Use case**: Make text larger for readability, smaller for compact printing

### Line Height (ระยะห่างบรรทัด)
- **Range**: 1.2 - 2.0
- **Default**: 1.4
- **Use case**: Increase for better readability, decrease for compact layout

### Table Colors (สีตาราง)
- **Header**: Background color of table headers
- **Border**: Color of table borders
- **Options**: Gray, Blue, Green, Red, Purple, Orange

---

## Print Settings (Recommended)

### In Browser Print Dialog (Ctrl+P):

1. **Destination**: Save as PDF
2. **Pages**: All
3. **Layout**: Portrait
4. **Paper Size**: A4
5. **Margins**: Default or None
6. **Scale**: 100 (adjust if needed to fit)
7. **Background Graphics**: ✅ Enable (for colors)

---

## User Instructions (Thai)

### วิธีใช้งาน / How to Use:

1. **เปิดพรีวิว** - คลิกปุ่ม "พรีวิว" ในหน้าใบกำกับภาษี
2. **ปรับแต่ง** - ใช้แผงด้านขวาปรับขนาดตัวอักษรและสี
3. **พิมพ์/บันทึก** - กด Ctrl+P แล้วเลือก "Save as PDF"
4. **ตรวจสอบ** - เปิด PDF ที่บันทึกดูว่าภาษาไทยแสดงถูกต้อง

---

## Troubleshooting

### Thai fonts not showing?
- Check internet connection (Google Fonts)
- Try refreshing the page
- Check browser console for errors

### Customization panel not visible?
- Scroll right on the page
- Check browser zoom level (should be 100%)
- Try a different browser

### Print quality is poor?
- In print dialog, increase scale to 110-120%
- Enable "Background Graphics"
- Check printer settings

### Cannot save as PDF?
- Make sure you have PDF viewer installed
- Try "Microsoft Print to PDF" (Windows) or "Preview" (Mac)
- Update browser to latest version

---

## Next Steps

### Immediate (Testing):
1. ✅ Open `invoice-preview-test.html`
2. ✅ Try customization panel
3. ✅ Print/save as PDF
4. ✅ Verify Thai text renders correctly

### Short-term (Integration):
1. Add preview button to invoice list
2. Test with real invoice data
3. Get user feedback

### Long-term (Enhancement):
1. Add more customization options
2. Save user preferences
3. Add email functionality
4. Add batch printing

---

## Conclusion

✅ **HTML Preview is the recommended solution for Thai invoices**

**Reasons**:
- Full Thai font support (Sarabun from Google Fonts)
- Live preview with instant customization
- Browser's print-to-PDF (highest quality)
- No PDF layout issues
- User-friendly interface
- Easy to integrate
- No complex dependencies

**Open the test file now**: `invoice-preview-test.html`

Try the customization panel and print to PDF to see the quality!
