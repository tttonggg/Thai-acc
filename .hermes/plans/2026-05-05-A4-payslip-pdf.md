## A4: Payslip PDF Template — สลิปเงินเดือน
**Spec file:** `.hermes/plans/2026-05-05-A4-payslip-pdf.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Partial backend:** `src/lib/pdfkit-generator.ts` exists (951 lines)

---

## What
Generate professional payslip PDFs for employees showing salary, deductions, and net pay. Reuse existing pdfkit-generator infrastructure.

---

## Step 1: /spec

### Backend Partial
- `src/lib/pdfkit-generator.ts` — PDFKit implementation, 951 lines
- `src/lib/payroll-service.ts` — payroll calculations including SSC, tax, provident fund
- `src/app/api/employees/[id]/route.ts` — employee data

### Payslip Data to Include
| Field | Example |
|-------|---------|
| ชื่อพนักงาน (Employee Name) | สมชาย ใจดี |
| แผนก (Department) | บัญชี |
| เลขประจำตัวผู้เสียภาษี (Tax ID) | 0-1234-56789-01-2 |
| เดือน/ปี (Period) | พฤษภาคม 2569 |
| เงินเดือน (Base Salary) | ฿50,000.00 |
| โบนัส (Bonus) | ฿5,000.00 |
| ค่าล่วงเวลา (OT) | ฿2,000.00 |
| **รวมรายได้ (Gross)** | **฿57,000.00** |
| ภาษี (PAYE Tax) | ฿3,500.00 |
| ประกันสังคม (SSC) | ฿1,500.00 |
| กองทุนสำรองเลี้ยงชีพ (Provident) | ฿2,500.00 |
| **รวมหัก (Deductions)** | **฿7,500.00** |
| **สุทธิ (Net Pay)** | **฿49,500.00** |

### PDF Design
- Company logo header
- A4 portrait, clean table layout
- Thai font support (Sarabun or similar)
- Generated via PDFKit

---

## Step 2: /plan

### Tasks
1. Check existing PDF infrastructure:
```bash
grep -n "generatePayslip\|payslip\|salary" src/lib/pdfkit-generator.ts
grep -n "generatePayslip\|payslip" src/lib/pdf-generator.ts
```

2. Create payslip generation function:
   - `src/lib/pdfkit-generator.ts` — add `generatePayslipPDF(employeeId, payrollPeriod)`
   - OR create new `src/lib/payslip-pdf-service.ts`

3. Create API endpoint:
   - `GET /api/payroll/[id]/payslip-pdf` — generate and return PDF

4. Add "พิมพ์สลิป" button to payroll page

### Files
```
src/lib/payslip-pdf-service.ts   # new or extend pdfkit-generator
src/app/api/payroll/[id]/payslip-pdf/route.ts
src/components/payroll/payslip-button.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang → convert to Baht for display
- [ ] Debit=credit (N/A for PDF generation)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A for PDF)
- [ ] Thai font: use Sarabun from Google Fonts or bundled .ttf

---

## Step 3: /build

Check what Thai font is used for existing PDFs:
```bash
grep -rn "Sarabun\|NotoSansThai\|font" src/lib/pdfkit-generator.ts | head -20
```

Build payslip function following existing PDF template pattern.

---

## Step 4: /test

Manual:
1. Run payroll for May 2026
2. Go to Payroll → Employee list
3. Click "พิมพ์สลิป" next to an employee
4. PDF opens → shows payslip with all fields
5. Download works

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Payslip PDF generates with correct Thai font
- [ ] All salary/deduction fields show correct amounts
- [ ] Gross, deductions, net math checks out
- [ ] Employee info (name, department, tax ID) correct
- [ ] Company logo shows
- [ ] A4 format correct

---

## Step 6: /ship

```bash
git add src/lib/payslip-pdf-service.ts src/app/api/payroll/
git add src/components/payroll/
git commit -m "feat(A4): add payslip PDF generation

- Professional payslip PDF via PDFKit
- Shows: salary, bonus, OT, SSC, tax, provident, net pay
- Thai Sarabun font support
- 'พิมพ์สลิป' button on payroll page
"
```
