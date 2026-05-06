## A3: Empty State Redesign — Add Illustrations + CTAs
**Components:** Dashboard + all module pages with "No data" states
**Spec file:** `.hermes/plans/2026-05-05-A3-empty-state-redesign.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship
**Depends on:** T0

---

## What
Replace plain "No data" / "No Recent Transactions" text with illustrated empty states that include:
1. Friendly illustration (emoji or SVG)
2. Clear Thai explanation of what this section does
3. Primary CTA button to create first entry

---

## Step 1: /spec

### Current State (U7 from UX audit)
- "No Recent Transactions" — plain white text
- No illustration
- No CTA to create first record
- New user sees nothing → doesn't know what to do

### Target State
Each module/dashboard section should show:
- Illustration: relevant emoji or simple SVG (📋 📦 💳 🏦 👤 💰)
- Thai message explaining what goes here
- CTA: "สร้างรายการแรก" or "เริ่มต้น"

### Scope (places with empty states)
1. Dashboard — Recent Transactions (ห้างเอกสารล่าสุด)
2. Invoices list — ใบวางบิล
3. Receipts list — ใบเสร็จรับเงิน
4. Payments list — ใบจ่ายเงิน
5. Journal list — รายวัน
6. Products/Inventory list
7. Customers list
8. Vendors list

### Design Pattern
```typescript
// Reusable empty state component
interface EmptyStateProps {
  emoji?: string;       // e.g. "📋"
  title: string;        // e.g. "ยังไม่มีใบวางบิล"
  description?: string; // e.g. "สร้างใบวางบิลฉบับแรกของคุณ"
  action?: {
    label: string;      // e.g. "+ สร้างใบวางบิล"
    onClick: () => void;
  };
}
```

---

## Step 2: /plan

### Tasks
1. Create `src/components/ui/empty-state.tsx` (reusable component)
2. Audit all pages that have empty states
3. Replace inline "No data" with `<EmptyState>` component
4. Wire up CTAs to create actions

### File to Create
`src/components/ui/empty-state.tsx`

### Places to Update (audit first)
```bash
grep -rn "No data\|No .* found\|ไม่พบ\|ยังไม่" src/components/
```

### Thai ERP Checklist
- [ ] Satang amounts (N/A for empty state UI)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Create reusable component:

```typescript
// src/components/ui/empty-state.tsx
'use client';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {emoji && <span className="text-5xl mb-4">{emoji}</span>}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

Then audit and replace inline empty states across the codebase.

---

## Step 4: /test

Manual:
1. Clear all test data or use fresh DB
2. Visit each module
3. Empty state shows illustration + CTA
4. CTA is clickable and navigates to create form

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] `empty-state.tsx` component created and reusable
- [ ] All "No data" states replaced with illustrated version
- [ ] Each CTA correctly wired to create action
- [ ] Thai text appropriate for context
- [ ] Touch targets ≥ 44px on CTA buttons

---

## Step 6: /ship

```bash
git add src/components/ui/empty-state.tsx
git add src/components/dashboard/ src/components/invoices/ src/components/receipts/ \
  src/components/payments/ src/components/journal/ src/components/products/ \
  src/components/customers/ src/components/vendors/
git commit -m "feat(A3): add illustrated empty states with CTAs

- Create reusable EmptyState component with emoji + text + action
- Replace all plain 'No data' with illustrated empty states
- Each empty state has CTA to create first entry
- Locations: Dashboard, Invoices, Receipts, Payments, Journal, Products, Customers, Vendors
"
```
