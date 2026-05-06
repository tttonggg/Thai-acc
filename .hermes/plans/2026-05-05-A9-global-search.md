## A9: Global Search — Ctrl+K Command Bar
**Spec file:** `.hermes/plans/2026-05-05-A9-global-search.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0

---

## What
Add a global search command bar (Ctrl+K or Cmd+K) that searches across all entities: invoices, receipts, payments, customers, vendors, products, journal entries.

---

## Step 1: /spec

### UX
- Press `Ctrl+K` (or `/`) anywhere → modal opens with search input
- Type → instant results as you type (debounced 300ms)
- Results grouped by type: ใบวางบิล | ลูกค้า | สินค้า | ผู้จำหน่าย | รายการบัญชี
- Click result → navigates to that item
- Escape or click outside → closes

### Search Scope
| Entity | Fields to Search |
|--------|-----------------|
| Invoices | docNumber, customer.name, totalAmount |
| Receipts | docNumber, customer.name, amount |
| Payments | docNumber, vendor.name, amount |
| Customers | name, email, phone, taxId |
| Vendors | name, email, phone, taxId |
| Products | name, sku, barcode |
| Journal Entries | docNumber, description, account.name |

### Search API
- Single endpoint: `GET /api/search?q=keyword`
- Returns grouped results with type labels
- Limit: 10 per category, 50 total

### Implementation Approach
```typescript
// src/app/api/search/route.ts
export async function GET(request: Request) {
  const { q } = parseQuery(request.url);
  const [invoices, customers, products, ...] = await Promise.all([
    prisma.invoice.findMany({ where: { OR: [...] }, take: 10 }),
    prisma.customer.findMany({ where: { OR: [...] }, take: 10 }),
    // ...
  ]);
  return { results: { invoices, customers, products, ... } };
}
```

---

## Step 2: /plan

### Tasks
1. Create search API: `GET /api/search?q=`
   - Search across: invoices, receipts, payments, customers, vendors, products, journal
   - Return grouped results

2. Create search modal component: `src/components/search/global-search-modal.tsx`
   - Keyboard shortcut listener (useEffect)
   - Debounced input
   - Grouped results list
   - Keyboard navigation (up/down arrows, enter to select)

3. Wire into `src/app/page.tsx` (listen for Ctrl+K globally)

### Files
```
src/app/api/search/route.ts
src/components/search/global-search-modal.tsx
src/app/page.tsx  # add listener
```

### Thai ERP Checklist
- [ ] All amounts in Satang (convert for display)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Create API route first, then UI component.

---

## Step 4: /test

Manual:
1. Press `Ctrl+K` → modal opens
2. Type "ใบกำ" → invoices appear
3. Type "บริษัท" → customers/suppliers appear
4. Click result → navigates to item
5. Press Escape → closes

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Ctrl+K opens modal from any page
- [ ] Search returns results grouped by type
- [ ] Results clickable and navigate correctly
- [ ] Debounce works (no excessive API calls)
- [ ] Keyboard navigation works (up/down/enter/esc)
- [ ] Empty state: "ไม่พบผลลัพธ์" if no results

---

## Step 6: /ship

```bash
git add src/app/api/search/route.ts
git add src/components/search/
git add src/app/page.tsx
git commit -m "feat(A9): add global search (Ctrl+K)

- Command bar modal triggered by Ctrl+K or /
- Searches invoices, receipts, payments, customers, vendors, products, journal
- Results grouped by type with Thai labels
- Keyboard navigation support
- Debounced search for performance
"
```
