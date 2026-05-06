## A5: Invoice Thai Font Template — PDFKit with Thai Font
**Spec file:** `.hermes/plans/2026-05-05-A5-invoice-thai-font.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Partial backend:** `src/lib/pdfkit-generator.ts` exists (951 lines), `pdfkit` works, jsPDF broken

---

## What
Fix invoice PDF generation to support Thai fonts properly using PDFKit. The PDF generation engine exists but Thai fonts are not embedded, causing garbled text on PDF invoices.

---

## Step 1: /spec

### Current State
- `pdfkit-generator.ts` generates PDFs via PDFKit
- Thai text appears as boxes/garbage in PDF (no font embedded)
- jsPDF was attempted but broken — PDFKit is the working solution

### Target State
- Invoice PDF displays Thai text correctly
- Embedded font: Sarabun (Google Fonts, open license)
- Company logo embedded
- Professional layout matching Thai tax invoice requirements

### PDF Invoice Layout
```
┌─────────────────────────────────────────────┐
│ [Company Logo]     ใบกำกับภาษี / TAX INVOICE  │
│ Company Name                               │
│ Address: ...                               │
│ Tax ID: ...                                │
├─────────────────────────────────────────────┤
│ เลขที่: INV-001     วันที่: 1 พ.ค. 2569         │
│ ลูกค้า: บริษัท ABC จำกัด    ที่อยู่: ...       │
│ ทะเบียนภาษี: 0-1234-56789                  │
├─────────────────────────────────────────────┤
│ # | รายการ           | จำนวน | ราคา | รวม      │
│ 1 | สินค้าชิ้นที่ 1    |  2    | 500  | 1,000  │
│ 2 | สินค้าชิ้นที่ 2    |  1    | 300  |   300  │
├─────────────────────────────────────────────┤
│           รวมเงิน:           |           1,300  │
│           ภาษีมูลค่าเพิ่ม 7%: |              91  │
│           รวมทั้งสิ้น:        |           1,391  │
├─────────────────────────────────────────────┤
│ QR CODE HERE    ผู้ติดต่อ: ...               │
└─────────────────────────────────────────────┘
```

### Font Solution
- Download Sarabun-Regular.ttf and Sarabun-Bold.ttf
- Embed in PDF using PDFKit's `font()` method
- Register font path: `pdfDoc.font('Sarabun')`

---

## Step 2: /plan

### Tasks
1. Get Thai font files:
   - Download from Google Fonts (Sarabun family)
   - Place in `public/fonts/Sarabun-Regular.ttf` and `Sarabun-Bold.ttf`
   - OR use npm package `sarabun-font` / `@fontsource/sarabun`

2. Update `src/lib/pdfkit-generator.ts`:
   - Register Thai fonts with `PDFDocument.registerFont`
   - Switch to `Sarabun` instead of Helvetica
   - Ensure all text columns use Thai font

3. Verify invoice PDF:
   - `src/app/api/invoices/[id]/pdf/route.ts` already exists
   - Ensure it uses pdfkit-generator

### Files to Change
```
public/fonts/Sarabun-Regular.ttf   # add font file
public/fonts/Sarabun-Bold.ttf      # add font file
src/lib/pdfkit-generator.ts         # register + use Thai font
```

### Thai ERP Checklist
- [ ] All amounts in Satang → converted to Baht for PDF display
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)
- [ ] Font embedded correctly (verify by opening PDF)

---

## Step 3: /build

Check current PDF setup:
```bash
grep -n "font\|Font\|Helvetica\|pdfkit" src/lib/pdfkit-generator.ts | head -30
ls public/fonts/ 2>/dev/null || echo "no fonts dir"
cat src/app/api/invoices/[id]/pdf/route.ts 2>/dev/null | head -30
```

Build:
1. Create `public/fonts/` directory
2. Add Sarabun font files
3. Register and use in pdfkit-generator

---

## Step 4: /test

Manual:
1. Create or open an invoice
2. Click "พิมพ์ PDF" / "Export PDF"
3. Open PDF — Thai text should display correctly
4. Check: company name, customer name, line items, totals all readable Thai

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Thai font (Sarabun) embedded in PDF
- [ ] All Thai text renders correctly (not boxes)
- [ ] Invoice layout professional
- [ ] Amounts correctly formatted (฿X,XXX.XX)
- [ ] VAT calculation correct
- [ ] A4 size correct

---

## Step 6: /ship

```bash
git add public/fonts/
git add src/lib/pdfkit-generator.ts
git commit -m "feat(A5): embed Thai Sarabun font in invoice PDFs

- Download + embed Sarabun-Regular.ttf and Sarabun-Bold.ttf
- Replace Helvetica with Sarabun for Thai text
- Invoice PDF now displays Thai correctly
- Fixes garbled Thai characters in PDF output
"
```
