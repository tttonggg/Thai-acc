## A7: Tax Form Auto-Fill UI — PND3/PND53
**Spec file:** `.hermes/plans/2026-05-05-A7-tax-form-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Backend already exists:** `src/lib/tax-form-service.ts` (595 lines)

---

## What
Build a UI page that lets users select a tax period (month/quarter) and auto-fills PND3 (individual withholding) or PND53 (corporate withholding) tax forms from payment data. Backend service already exists — just build the UI.

---

## Step 1: /spec

### Backend Already Done
- `src/lib/tax-form-service.ts` — `generatePND3()`, `generatePND53()`, `populateTaxForm()`
- `src/app/api/wht/[id]/pdf/route.ts` — PDF generation for WHT certificates
- Data sources: Payment records with WHT entries

### What UI Needs
1. **Tax Form List Page** — select form type and period:
   - Form type: ภงด.3 (PND3) / ภงด.53 (PND53)
   - Period: เดือน/ไตรมาส picker
   - "ดึงข้อมูล" button → loads transactions

2. **Pre-filled Form View**:
   - Shows all payee/supplier rows with:
     - ชื่อ (name)
     - เลขประจำตัวผู้เสียภาษี (tax ID)
     - จำนวนเงิน (amount)
     - ภาษีหัก (WHT amount)
   - User can edit before generating PDF
   - "สร้าง PDF" button

3. **PDF Preview/Download**:
   - Opens generated PDF in browser
   - Download button

### Tax Form Types
| Form | Thai | Use for |
|------|------|---------|
| PND3 | ภงด.3 | Withholding tax on payments to individuals |
| PND53 | ภงด.53 | Withholding tax on payments to juristic persons |

---

## Step 2: /plan

### Tasks
1. Check `src/lib/tax-form-service.ts` API:
```bash
cat src/lib/tax-form-service.ts | head -100
```

2. Create API route to fetch tax form data:
   - `GET /api/tax-forms/pnd3?month=2026-03` — get PND3 data for period
   - `GET /api/tax-forms/pnd53?quarter=2026-Q1` — get PND53 data for period

3. Create component `src/components/tax-forms/tax-form-page.tsx`

4. Add sidebar navigation under REPORTS:
   - ภาษีหัก ณ ที่จ่าย (WHT) — already exists
   - แบบฟอร์มภาษี (Tax Forms) — NEW

### Files
```
src/app/api/tax-forms/pnd3/route.ts
src/app/api/tax-forms/pnd53/route.ts
src/components/tax-forms/
  tax-form-page.tsx
  pnd3-form.tsx
  pnd53-form.tsx
  tax-form-preview.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang (convert for display: ฿X,XXX.XX)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A — reads from posted payments)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Check backend interface:
```bash
grep -n "export function\|export async function" src/lib/tax-form-service.ts
```

Build UI following shadcn/ui patterns.

---

## Step 4: /test

Manual:
1. Navigate to Reports → Tax Forms
2. Select PND3, March 2026
3. Click "ดึงข้อมูล" → see pre-filled rows
4. Edit if needed
5. Click "สร้าง PDF" → PDF preview appears

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Both PND3 and PND53 forms accessible
- [ ] Period selection works correctly
- [ ] Data pre-fills from payment records with WHT
- [ ] Amounts displayed correctly in Baht (converted from Satang)
- [ ] PDF generation works
- [ ] Thai labels correct

---

## Step 6: /ship

```bash
git add src/app/api/tax-forms/
git add src/components/tax-forms/
git commit -m "feat(A7): add tax form auto-fill UI (PND3/PND53)

- Tax form page under Reports: select period and form type
- Auto-populate from payment/WHT data
- Edit rows before PDF generation
- Generate PDF preview/download
"
```
