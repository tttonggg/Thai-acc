## A18: Field-Level Audit Trail — ประวัติการแก้ไข
**Spec file:** `.hermes/plans/2026-05-05-A18-audit-trail.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0 (schema + middleware changes)

---

## What
Track WHO changed WHAT and WHEN on any field of any record. Not just "record updated" — specific field-level changes with before/after values.

---

## Step 1: /spec

### Current State
- Activity logs exist but basic — no field-level change tracking
- "Invoice #104 updated" — doesn't say which fields changed

### Target: Field-Level Audit
```
Admin changed invoice #104:
  totalAmount: ฿10,000 → ฿12,000 (2026-05-03 14:32)
  customerId: "บริษัท ABC" → "บริษัท DEF" (2026-05-03 14:32)
  status: "DRAFT" → "POSTED" (2026-05-03 14:35)
```

### Data Model
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  entityType  String   // "Invoice", "Payment", "JournalEntry"
  entityId    String   // ID of the record
  fieldName   String   // which field changed
  oldValue    String?  // value before (as string)
  newValue    String?  // value after (as string)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  timestamp   DateTime @default(now())
  ipAddress   String?
}
```

### What to Track
High-value entities first:
- Invoices (amount, customer, status, line items)
- Payments (amount, vendor, account, status)
- Journal Entries (date, lines, amounts)
- Customer/Vendor (name, tax ID, address)
- Product (price, stock, reorder point)

### Implementation Approach
1. **Service-layer wrapper** — instead of direct Prisma calls, use audit-aware service methods
2. **JSON diff** — compare old vs new object, record all changed fields
3. **Middleware** — intercept updates at service layer

```typescript
// Pattern for audit-aware update
async function updateInvoiceWithAudit(id: string, data: UpdateInvoiceDto, userId: string) {
  const old = await prisma.invoice.findUnique({ where: { id } });
  
  const updated = await prisma.invoice.update({ where: { id }, data });
  
  // Generate diff
  const diff = objectDiff(old, updated);
  for (const [field, { old: oldVal, new: newVal }] of Object.entries(diff)) {
    await prisma.auditLog.create({
      data: { entityType: 'Invoice', entityId: id, fieldName: field, oldValue: oldVal, newValue: newVal, userId }
    });
  }
  
  return updated;
}
```

---

## Step 2: /plan

### Tasks
1. Add `AuditLog` model to schema if not exists

2. Create audit service:
   - `src/lib/audit-service.ts` — `logChange()`, `objectDiff()`, `getAuditHistory(entityType, entityId)`

3. Create audit API:
   - `GET /api/audit-logs?entity=Invoice&entityId=xxx` — get audit trail
   - `GET /api/audit-logs?entity=Payment&entityId=yyy` — per entity

4. Wrap high-priority update operations:
   - `src/lib/invoice-service.ts` — add audit to updateInvoice()
   - `src/lib/payment-service.ts` — add audit to updatePayment()
   - `src/lib/journal-service.ts` — add audit to updateJournal()

5. Create audit UI:
   - `src/components/common/audit-trail.tsx` — reusable component
   - Add to invoice detail, payment detail pages

### Files
```
prisma/schema.prisma                    # add AuditLog
src/lib/audit-service.ts                # core audit logic
src/app/api/audit-logs/route.ts          # GET audit trail
src/components/common/audit-trail.tsx    # reusable component
src/lib/invoice-service.ts              # wrap updates with audit
src/lib/payment-service.ts
src/lib/journal-service.ts
src/components/invoices/invoice-detail-page.tsx  # add audit tab
```

### Thai ERP Checklist
- [ ] All amounts in Satang (store as string: "฿1,234.56")
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (audit log + update in same transaction)

---

## Step 3: /build

Build audit-service.ts with objectDiff utility. Wrap invoice/payment updates.

---

## Step 4: /test

Manual:
1. Open invoice #104 → edit totalAmount ฿10,000 → ฿12,000
2. Save
3. Click "ประวัติ" tab
4. Shows: "totalAmount: ฿10,000 → ฿12,000 by Admin at 2026-05-03 14:32"

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] All field changes logged with before/after values
- [ ] User name + timestamp recorded
- [ ] Audit trail visible on entity detail pages
- [ ] Sensitive fields (password) not logged
- [ ] Performance: audit logging < 50ms per update

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add src/lib/audit-service.ts
git add src/app/api/audit-logs/
git add src/lib/invoice-service.ts src/lib/payment-service.ts src/lib/journal-service.ts
git add src/components/common/audit-trail.tsx
git add src/components/invoices/
git commit -m "feat(A18): add field-level audit trail

- Track every field change with before/after values
- Records: who, what, when, which field
- Audit log for: Invoices, Payments, Journal Entries, Customers, Vendors, Products
- Audit trail visible on entity detail pages
- Useful for compliance and error recovery
"
```
