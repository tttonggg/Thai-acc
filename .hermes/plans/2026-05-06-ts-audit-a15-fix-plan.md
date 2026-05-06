# TS Errors Fix + A18 Audit Wiring + A15 Customer Portal
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Updated:** 2026-05-06
**Depends on:** None (TS fixes are prerequisite cleanup before A18/A15)

---

## Step 1: /spec

### 0. Pre-flight: 4 TypeScript Errors (must fix first)

| # | File | Line | Error | Fix |
|---|------|------|-------|-----|
| 1 | `src/lib/email-service.ts` | 252 | `invoice.customer` — query used `prisma.invoice.fields.totalAmount` which strips `customer` from result type | Add `customer: { select: { name: true, email: true } }` to the overdue invoice query's `include` block |
| 2 | `src/lib/inventory-service.ts` | 214 | `'SUPERADMIN'` not assignable to `UserRole` enum (only ADMIN/ACCOUNTANT/USER/VIEWER exist) | Replace `'SUPERADMIN'` with `'ADMIN'` |
| 3 | `src/lib/pdfkit-generator.ts` | 550 | `promptpayQR({...})` called with 1 arg — `generatePayload(target, options)` needs 2 args | Change to `promptpayQR(invoicePromptpayId, { amount: amountBaht, reference: invoice.invoiceNumber \|\| '' })` |
| 4 | `src/lib/pdfkit-generator.ts` | 738 | Same `promptpayQR` signature issue | Change to `promptpayQR(promptpayId, { amount: amountBaht, reference: receipt.receiptNo \|\| '' })` |

### A18: Field-Level Audit Wiring

**Already EXISTS (discovered 2026-05-06):**
- `prisma/schema.prisma` — `model AuditLog` ✅
- `src/lib/audit-service.ts` — full service with `logAudit()`, `objectDiff`, `sanitizeForAudit` ✅
- `src/lib/audit-logger.ts` — standalone logger with hash chain ✅
- `src/app/api/admin/audit-logs/route.ts` — GET endpoint ✅
- `src/app/api/invoices/[id]/audit/route.ts` — per-entity audit ✅
- `src/components/audit/audit-log-viewer.tsx` — UI component ✅
- `src/components/invoices/audit-log.tsx` — invoice-specific audit tab ✅

**What is MISSING (A18 true gap):**
- Audit logging is NOT called from ANY create/update API route
- No integration of `logAudit()` or `auditService.logAudit()` into invoice/payment/journal update flows
- Plan assumed service didn't exist — it does, but it's a ghost (never called)

**What to wire:**
| Entity | API Route | Audit Call To Add |
|--------|-----------|-------------------|
| Invoice | `POST /api/invoices` | `auditService.logAudit({ action: 'CREATE', entityType: 'Invoice', ... })` |
| Invoice | `PATCH /api/invoices/[id]` | `auditService.logAudit({ action: 'UPDATE', entityType: 'Invoice', beforeState, afterState, ... })` |
| Invoice | `POST /api/invoices/[id]/post` | `auditService.logAudit({ action: 'POST', entityType: 'Invoice', ... })` |
| Invoice | `DELETE /api/invoices/[id]` | `auditService.logAudit({ action: 'DELETE', entityType: 'Invoice', ... })` |
| Payment | `POST /api/payments` | `auditService.logAudit({ action: 'CREATE', entityType: 'Payment', ... })` |
| Payment | `PATCH /api/payments/[id]` | `auditService.logAudit({ action: 'UPDATE', entityType: 'Payment', ... })` |
| Receipt | `POST /api/receipts` | `auditService.logAudit({ action: 'CREATE', entityType: 'Receipt', ... })` |
| Receipt | `PATCH /api/receipts/[id]` | `auditService.logAudit({ action: 'UPDATE', entityType: 'Receipt', ... })` |
| JournalEntry | `POST /api/journal-entries` | `auditService.logAudit({ action: 'CREATE', entityType: 'JournalEntry', ... })` |
| JournalEntry | `PATCH /api/journal-entries/[id]` | `auditService.logAudit({ action: 'UPDATE', entityType: 'JournalEntry', ... })` |

**Audit integration pattern:**
```typescript
// In invoice PATCH route after successful update:
const old = await prisma.invoice.findUnique({ where: { id }, include: { lines: true } });
const updated = await prisma.invoice.update({ where: { id }, data, include: { lines: true } });
await auditService.logAudit({
  userId,
  action: 'UPDATE',
  entityType: 'Invoice',
  entityId: id,
  beforeState: sanitizeForAudit(old),
  afterState: sanitizeForAudit(updated),
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
});
```

### A15: Customer Portal

**Already EXISTS:** Nothing — entirely new feature.

**Plan from existing spec:** `.hermes/plans/2026-05-05-A15-customer-portal.md` (166 lines)

**Implementation approach (Option B — same NextAuth, customer role):**
1. Add `CustomerPortalAccount` model to all 3 schema files
2. Create `/portal` route group (Next.js route group — URL unchanged)
3. Portal login at `/portal/login`
4. Customer dashboard at `/portal/dashboard`
5. Invoice list at `/portal/invoices`
6. Invoice detail at `/portal/invoices/[id]`
7. Payment recording at `/portal/payments/record`
8. Statement download
9. "สร้างบัญชีพอร์ทัล" button in customer-form-dialog

**Thai ERP specific checklist:**
- All amounts in Satang → convert to Baht before display
- Password hashing: bcrypt with salt rounds ≥ 12
- Customer can ONLY see their own invoices (filter by `customerId`)
- Portal uses separate session from main ERP

---

## Step 2: /plan

### TS Fix Tasks (parallel, all small)

| # | Task | File | Type |
|---|------|------|------|
| T1 | Add `customer` include to overdue invoice query | `src/lib/email-service.ts` | 1-line include fix |
| T2 | Replace `SUPERADMIN` with `ADMIN` | `src/lib/inventory-service.ts` | 1-word fix |
| T3 | Fix `promptpayQR` call signature — invoice | `src/lib/pdfkit-generator.ts` | 1-line fix |
| T4 | Fix `promptpayQR` call signature — receipt | `src/lib/pdfkit-generator.ts` | 1-line fix |

### A18 Wiring Tasks (ordered by impact)

| # | Task | Est. | Type |
|---|------|------|------|
| A18-1 | Add audit logging to Invoice POST/PATCH/DELETE routes | 2h | Wire existing service |
| A18-2 | Add audit logging to Payment POST/PATCH routes | 1.5h | Wire existing service |
| A18-3 | Add audit logging to Receipt POST/PATCH routes | 1.5h | Wire existing service |
| A18-4 | Add audit logging to JournalEntry POST/PATCH routes | 1.5h | Wire existing service |
| A18-5 | Add audit tab to invoice detail page | 1h | UI wiring |
| A18-6 | Test: verify audit trail shows after invoice update | 0.5h | Manual test |

### A15 Customer Portal Tasks

| # | Task | Est. | Type |
|---|------|------|------|
| A15-1 | Add `CustomerPortalAccount` model to all 3 schema files | 0.5h | Schema |
| A15-2 | Run `db:generate` + verify TS clean | 0.25h | Build |
| A15-3 | Create portal auth API: `POST /api/portal/auth/login` | 2h | API |
| A15-4 | Create portal invoices API: `GET /api/portal/invoices` | 1h | API |
| A15-5 | Create portal invoice detail API: `GET /api/portal/invoices/[id]` | 1h | API |
| A15-6 | Create portal payment record API: `POST /api/portal/payments` | 1.5h | API |
| A15-7 | Create portal layout and login page | 2h | UI |
| A15-8 | Create portal dashboard page | 1.5h | UI |
| A15-9 | Create portal invoice list page | 1.5h | UI |
| A15-10 | Create portal invoice detail page | 1.5h | UI |
| A15-11 | Create "สร้างบัญชีพอร์ทัล" button in customer form | 1h | UI |
| A15-12 | Test portal end-to-end | 1h | Manual test |

**Total estimated effort:**
- TS fixes: 0.5h
- A18 wiring: 8h (2+1.5+1.5+1.5+1+0.5)
- A15 full: 15.25h (0.5+0.25+2+1+1+1.5+2+1.5+1.5+1.5+1+1)

**Recommended sequence:** TS fixes → A18 wiring (smaller, self-contained) → A15 (larger, independent)

---

## Step 3: /build

### Phase 1: TS Fixes
```bash
cd /users/tong/Desktop/thai-acc-sandbox
# Fix T1-T4
bun run tsc --noEmit  # must pass
```

### Phase 2: A18 Audit Wiring

**For each entity (Invoice → Payment → Receipt → JournalEntry):**
1. Read the update route
2. Find the post-update point (after successful create/update/delete)
3. Add `auditService.logAudit()` call with beforeState/afterState
4. Wrap both update and audit in same Prisma transaction
5. `tsc --noEmit` → verify
6. Commit

**Invoice routes to modify:**
- `src/app/api/invoices/route.ts` — POST (CREATE)
- `src/app/api/invoices/[id]/route.ts` — PATCH (UPDATE), DELETE

**Payment routes to modify:**
- `src/app/api/payments/route.ts` — POST (CREATE)
- `src/app/api/payments/[id]/route.ts` — PATCH (UPDATE)

**Receipt routes to modify:**
- `src/app/api/receipts/route.ts` — POST (CREATE)
- `src/app/api/receipts/[id]/route.ts` — PATCH (UPDATE)

**Journal routes to modify:**
- `src/app/api/journal-entries/route.ts` — POST (CREATE)
- `src/app/api/journal-entries/[id]/route.ts` — PATCH (UPDATE)

### Phase 3: A15 Customer Portal

**Portal route group:** `src/app/portal/` (Next.js route group — doesn't affect URL)
**Portal API:** `src/app/api/portal/` (separate from main `/api/`)

---

## Step 4: /test

```bash
bun run tsc --noEmit  # all TS errors fixed
```

**A18 manual test:**
1. `bun run dev`
2. Login as admin
3. Open invoice list → click any invoice
4. Edit any field (e.g., notes) → save
5. Click "ประวัติ" (audit) tab
6. Verify: shows "UPDATE" with field name + old value → new value + timestamp

**A15 manual test:**
1. Create customer portal account for "บริษัท ABC"
2. Open `/portal/login`
3. Login with customer credentials
4. Verify: dashboard shows only "ABC" invoices
5. Click invoice → see details + PDF download
6. Record payment → pending approval
7. Log out

---

## Step 5: /review

**TS Fixes:**
- [ ] T1: `email-service.ts` — overdue invoice query includes `customer`
- [ ] T2: `inventory-service.ts` — `SUPERADMIN` → `ADMIN`
- [ ] T3: `pdfkit-generator.ts` line 550 — `promptpayQR(target, {amount, reference})`
- [ ] T4: `pdfkit-generator.ts` line 738 — same fix for receipt
- [ ] `bun run tsc --noEmit` → exit 0

**A18:**
- [ ] Invoice POST/PATCH/DELETE routes call `auditService.logAudit()`
- [ ] Audit trail shows field-level before/after on invoice detail
- [ ] Payment/Receipt/JournalEntry routes wired
- [ ] Sensitive fields (password, taxId) masked in logs
- [ ] Audit entry created in same transaction as business update

**A15:**
- [ ] Customer can login at `/portal/login`
- [ ] Dashboard shows only customer's own invoices
- [ ] Invoice detail shows line items + PDF
- [ ] Payment recording creates pending record in system
- [ ] "สร้างบัญชีพอร์ทัล" button visible in customer form
- [ ] Session separate from main ERP auth

---

## Step 6: /simplify

**TS fixes:** No simplification needed — surgical 1-2 line changes.
**A18:** No new files — only wiring existing services into routes.
**A15:** Minimize portal-specific components. Reuse existing UI primitives.

---

## Step 7: /ship

### TS Fixes (commit first — unblocks everything)
```bash
git add src/lib/email-service.ts src/lib/inventory-service.ts src/lib/pdfkit-generator.ts
git commit -m "fix: 4 TypeScript errors (SUPERADMIN, promptpayQR arity, customer include)"
```

### A18 (commit separately)
```bash
git add src/app/api/invoices/ src/app/api/payments/ src/app/api/receipts/ src/app/api/journal-entries/
git commit -m "feat(A18): wire audit-service into invoice/payment/receipt/journal routes
- Field-level before/after tracking on all major entity mutations
- Tamper-evident audit trail with hash chain
- Audit tab on invoice detail page
"
```

### A15 (largest commit — most files)
```bash
git add prisma/schema.prisma prisma/schema-sqlite.prisma prisma/schema-postgres.prisma
git add src/app/api/portal/
git add src/app/portal/
git add src/components/portal/
git add src/components/customers/
git commit -m "feat(A15): customer portal

- /portal route group with separate customer login
- Customers see only their own invoices
- View invoice details + download PDF
- Record payments online (pending approval)
- สร้างบัญชีพอร์ทัล button in customer form
"
```

---

## Critical Notes

1. **A18 audit logging must be in the SAME Prisma transaction** as the business update — if audit fails, don't roll back the business transaction, but log the failure
2. **A15 is a separate auth domain** — customer portal uses separate session from main ERP. Do NOT mix NextAuth session between portal and main app
3. **3-schema sync for A15** — `CustomerPortalAccount` model must be added to all 3 schema files
4. **TS errors pre-exist May 5 gap survey** — they were introduced after A11 (promptpay QR) and A3 (email-service overdue query). The TS errors are not from today's work — they were latent
