## A16: Auto-Bank Reconciliation (Full) — extends A13
**Spec file:** `.hermes/plans/2026-05-05-A16-auto-bank-rec-full.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** A13 (Bank Auto-Match Engine must be done first)

---

## What
Full bank reconciliation automation: after auto-matching (A13), complete the reconciliation by ensuring GL balance = Bank balance and flag discrepancies.

---

## Step 1: /spec

### After A13 — What A16 Adds

A13 gives: auto-matched bank lines → user approves → links established

A16 gives:
1. **Reconciliation status tracking** per bank account:
   - ยังไม่ปรับปรุง (Unreconciled): transactions exist not matched
   - กำลังปรับปรุง (In Progress): some matched
   - ปรับปรุงแล้ว (Reconciled): GL balance = Bank balance

2. **Discrepancy detection**:
   - Bank has transaction not in GL → "Bank only" list
   - GL has transaction not in bank → "GL only" list
   - Amount mismatch → highlight difference

3. **Auto-reconcile when balanced**:
   - When all matched AND GL balance = Bank balance → mark as "Reconciled"
   - Generate reconciliation report

4. **Reconciliation report PDF**:
   - Statement period
   - Opening/closing balance
   - Items matched
   - Discrepancies
   - "Reconciled" confirmation

### Reconciliation Report Layout
```
═══ งบแยกประเภทธนาคาร — ธนาคารกรุงเทพ ═══
บัญชี: 123-456-7890
ระยะเวลา: 1 มี.ค. 2569 — 31 มี.ค. 2569

ยอดยกมา:                         ฿500,000.00
+ รายการที่ตรวจสอบแล้ว:           ฿200,000.00
- รายการที่ตรวจสอบแล้ว:           ฿150,000.00
─────────────────────────────────────────
ยอดคงเหลือตามบัญชี:              ฿550,000.00

ยอดคงเหลือตามสมุดธนาคาร:         ฿550,000.00
ส่วนต่าง:                               ฿0.00
✓ ถูกต้อง — ปรับปรุงแล้ว 31 มี.ค. 2569
```

---

## Step 2: /plan

### Tasks
1. Create reconciliation status tracking:
   - Add `reconciliationDate`, `reconciliationStatus` to BankAccount model
   - Add `isReconciled` flag to matched transactions

2. Create discrepancy detection:
   - `src/lib/reconciliation-service.ts` — `findDiscrepancies(bankAccountId, period)`

3. Extend API:
   - `POST /api/bank-accounts/[id]/reconcile` — mark as reconciled
   - `GET /api/bank-accounts/[id]/discrepancies` — get mismatch list
   - `GET /api/bank-accounts/[id]/reconciliation-report` — PDF report

4. Update bank account page:
   - Show reconciliation status banner
   - Show discrepancy list
   - "ปรับปรุงแล้ว" button when balanced

### Files
```
prisma/schema.prisma
src/lib/reconciliation-service.ts
src/app/api/bank-accounts/[id]/reconcile/route.ts  # extend
src/app/api/bank-accounts/[id]/discrepancies/route.ts
src/app/api/bank-accounts/[id]/reconciliation-report/route.ts
src/components/banking/bank-account-detail.tsx
src/components/banking/reconciliation-status-banner.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang
- [ ] Debit=credit (reconciliation must balance)
- [ ] Period check (use accounting period)
- [ ] Prisma transaction (mark reconciled in transaction)

---

## Step 3: /build

Build after A13 is complete. Extend the existing reconcile API.

---

## Step 4: /test

Manual:
1. Import bank CSV (20 transactions)
2. Auto-match (A13) → 18 matched, 2 unmatched
3. A16 shows discrepancy: 2 items in bank not in GL
4. Manually add missing GL entries
5. GL balance = Bank balance → "ปรับปรุงแล้ว" button enabled
6. Click → status = "Reconciled"
7. Download reconciliation report PDF

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Discrepancies detected and displayed
- [ ] Reconciliation only marks as done when fully balanced
- [ ] Reconciliation report PDF accurate
- [ ] Status persists correctly
- [ ] Previous reconciliation preserved for audit

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add src/lib/reconciliation-service.ts
git add src/app/api/bank-accounts/
git add src/components/banking/
git commit -m "feat(A16): add full auto-bank reconciliation

- Discrepancy detection: bank-only vs GL-only items
- Reconciliation status: unreconciled → in progress → reconciled
- Auto-mark reconciled when GL balance = bank balance
- Reconciliation report PDF with full details
- Audit trail of past reconciliations
"
```
