## A12: Low-Stock Alert System
**Spec file:** `.hermes/plans/2026-05-05-A12-low-stock-alert.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0, A20 (Notification panel should be done first for UI)

---

## What
Alert when product stock falls below reorder point. System should automatically notify when inventory is low.

---

## Step 1: /spec

### What
1. Each product has a `reorderPoint` field (default: 10 units)
2. When stock falls below reorder point → create low-stock notification
3. Dashboard shows low-stock alert banner if any products are below reorder point
4. Notification sent via notification center (A20)

### Data Model
```prisma
model Product {
  // existing fields...
  reorderPoint     Int      @default(10)  // minimum before reorder
  reorderQuantity  Int      @default(100) // how many to reorder
}
```

### Alert Logic
```
ON inventory decrease:
  IF new_quantity < product.reorderPoint:
    CREATE Notification {
      type: "LOW_STOCK",
      message: "สินค้า {name} เหลือ {qty} ชิ้น — ต่ำกว่า reorder point ({reorderPoint})",
      productId: product.id
    }
```

### Where Stock Decreases
- Invoice/Receipt creation (sold goods)
- Stock transfer out
- Stock adjustment negative
- Stock take

### UI Locations
1. **Dashboard banner** — "⚠️ มี 3 สินค้าใกล้หมด" → click to see list
2. **Products page** — red badge on low-stock items
3. **Notification panel** (A20) — low-stock notification

---

## Step 2: /plan

### Tasks
1. Add fields to Product model if not exist:
   - `reorderPoint Int @default(10)`
   - `reorderQuantity Int @default(100)`

2. Update stock decrease logic in services:
   - `src/lib/inventory-service.ts` — add low-stock check after every stock decrease

3. Create notification when low stock detected:
   - Call notification service

4. Update Products UI:
   - Show alert badge on low-stock products
   - Edit form: show reorderPoint field

5. Dashboard widget: low-stock summary

### Files
```
prisma/schema.prisma                    # add reorder fields
src/lib/inventory-service.ts            # add low-stock check
src/app/api/products/[id]/route.ts      # return reorderPoint
src/components/products/product-form-dialog.tsx  # add reorder fields
src/components/dashboard/low-stock-banner.tsx    # new
```

### Thai ERP Checklist
- [ ] All amounts in Satang (N/A for stock qty)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (wrap stock decrease + notification in transaction)

---

## Step 3: /build

Check existing product model and inventory service:
```bash
grep -A 50 "model Product " prisma/schema.prisma
grep -n "reorder\|lowStock\|low_stock" src/lib/inventory-service.ts
```

Build:

1. Schema: add `reorderPoint` and `reorderQuantity` to Product
2. Service: add `checkLowStock(productId)` after stock decreases
3. API: include reorder fields in product responses
4. UI: show alert badges, allow editing reorder fields

---

## Step 4: /test

Manual:
1. Set product "กาแฟ" reorderPoint = 10
2. Current stock = 15
3. Sell 7 units (stock → 8)
4. Alert appears: "สินค้า กาแฟ เหลือ 8 ชิ้น"
5. Notification created
6. Dashboard shows low-stock banner

```bash
bun run db:push && bun run db:seed  # after schema change
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Products have reorderPoint field in schema
- [ ] Low-stock notification created when qty < reorderPoint
- [ ] Dashboard shows alert banner
- [ ] Products page shows red badge on low-stock items
- [ ] Notification appears in notification panel

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add src/lib/inventory-service.ts
git add src/app/api/products/
git add src/components/products/ src/components/dashboard/
git commit -m "feat(A12): add low-stock alert system

- Products now have reorderPoint + reorderQuantity fields
- Auto-notify when stock falls below reorder point
- Dashboard banner shows low-stock summary
- Red badge on products page for low-stock items
"
```
