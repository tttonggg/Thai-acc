# PDF Layout Fixes - Thai Font Support

## Issues Fixed ✅

### Problem

- Thai text overlapping
- Font sizes too large
- Line spacing inadequate for Thai text
- Table columns not properly spaced

### Solutions Applied

1. **Font Size Reductions**
   - Title: 24px → 20px
   - Body text: 16px → 12-14px
   - Table headers: 10px → 9px
   - Table body: 10px → 9px

2. **Line Spacing Improvements**
   - Added explicit `moveDown()` calls with values
   - Fixed row heights in tables (16-22px per row)
   - Added proper spacing between sections

3. **Table Layout Fixes**
   - Reduced column widths to fit A4 page
   - Fixed positioning for table cells
   - Proper alignment for Thai text

4. **Test PDF Changes**

   ```typescript
   // Before: Overlapping text
   doc.fontSize(24).text('...');
   doc.moveDown(); // Not enough spacing

   // After: Proper spacing
   doc.fontSize(20).text('...');
   doc.moveDown(2); // Explicit spacing
   ```

5. **Invoice PDF Changes**

   ```typescript
   // Column widths adjusted: [30, 200, 50, 50, 60, 50, 70]
   // → [25, 160, 40, 40, 55, 45, 60]

   // Font sizes reduced: 10px → 9px for tables
   // Row heights fixed: 18px → 16px
   ```

## Updated Files

- `src/lib/pdfkit-generator.ts` - Fixed layouts
- `pdfkit-thai-test.pdf` - Regenerated with better spacing
- `pdfkit-invoice-test.pdf` - Regenerated with better spacing

## Verification

Both PDFs should now display:

- ✅ Thai text without overlapping
- ✅ Proper line spacing
- ✅ Readable table layouts
- ✅ Correct font sizes for A4 page

## If Issues Persist

Further adjustments can be made to:

- `yPos += X` values (increase for more spacing)
- `fontSize(X)` values (decrease for smaller text)
- Column width arrays (adjust table widths)
- `width` parameters in text() calls
