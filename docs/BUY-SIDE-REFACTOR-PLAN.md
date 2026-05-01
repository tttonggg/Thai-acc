# Buy-Side Refactoring Plan

## Goal
Align UI components, page routes, and documentation with DB schema (PurchaseRequest, PurchaseOrder, PurchaseInvoice).

## Current State Analysis

### DB Schema ✅ (Source of Truth)
- `PurchaseRequest` (ใบขอซื้อ) - lines, budget, department, status
- `PurchaseOrder` (ใบสั่งซื้อ) - lines, vendor, PO→PI relation
- `PurchaseInvoice` (ใบซื้อ) - lines, journal, payment allocation
- `PurchaseRequestLine`, `PurchaseOrderLine`, `PurchaseInvoiceLine`

### UI Components ⚠️ (Partial)
- `/src/components/purchases/purchase-form.tsx` - seems to cover PI
- `/src/components/purchases/purchase-list.tsx`
- `/src/components/purchases/purchase-view-dialog.tsx`
- `/src/components/purchases/purchase-edit-dialog.tsx`
- Missing: PR-specific components, PI-specific pages

### Page Routes ⚠️ (Incomplete)
- `/purchase-orders` - exists but placeholder
- Missing: `/purchase-requests`, `/purchase-invoices`

### Reports ❌ (Missing)
- No buy-side report pages

### Docs ❌ (Missing)
- No buy-side documentation

---

## Tasks (Atomic, Ordered)

### Phase 1: Page Routes (do first - foundational)
- [ ] **T1**: Create `/purchase-requests/page.tsx` - list PRs page
- [ ] **T2**: Create `/purchase-invoices/page.tsx` - list PIs page
- [ ] **T3**: Add navigation links to sidebar for new pages

### Phase 2: UI Components (match DB)
- [ ] **T4**: Assess `purchase-form.tsx` - does it handle PI or PR? Rename if needed
- [ ] **T5**: Create `purchase-request-form.tsx` component
- [ ] **T6**: Create `purchase-request-list.tsx` component
- [ ] **T7**: Ensure PI components match `PurchaseInvoice` schema

### Phase 3: Components for PO
- [ ] **T8**: Create/assess `purchase-order-list.tsx` and form
- [ ] **T9**: Link PO to PI in UI (select PI when creating PO? or PI references PO?)

### Phase 4: Reports
- [ ] **T10**: Create `/reports/purchases/page.tsx` skeleton
- [ ] **T11**: Add summary widgets: PR by status, PO by status, PI by status

### Phase 5: Documentation
- [ ] **T12**: Create `docs/buy-side/TERMINOLOGY.md` - Thai labels
- [ ] **T13**: Document flow: PR → PO → PI → Payment

### Phase 6: Cleanup
- [ ] **T14**: Remove `.bak` files in `/src/components/purchases/`
- [ ] **T15**: Update `index.ts` exports if needed

---

## Dependencies
```
T1, T2 can run in parallel (sibling pages)
T3 depends on T1, T2 (add links after pages exist)
T5, T6 depend on T1 (form/list for PR page)
T8 depends on T2 (PO uses PI? or PI references PO? - check DB)
T10, T11 depend on T1, T2, T8 (reports need data)
T12, T13 depend on T1, T2, T8 (docs need final structure)
T14, T15 are cleanup, run last
```

## Execution Order
1. T1, T2 (parallel) → 2. T3 → 3. T4, T5, T6, T8 (can partially parallel) → 4. T9 → 5. T10, T11 → 6. T12, T13 → 7. T14, T15

---

## Verification
- All page routes respond 200
- Navigation shows all three buy-side pages
- Components render without errors
- Build passes