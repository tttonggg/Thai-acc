## A1: Quick Action FAB — Floating Action Button
**Component:** `src/components/layout/quick-action-fab.tsx`
**Spec file:** `.hermes/plans/2026-05-05-A1-quick-action-fab.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /ship
**Depends on:** T0 (TS errors must be fixed first)

---

## What
Add a floating action button (FAB) on dashboard for one-click creation of common documents:
- + ใบวางบิล (Invoice)
- + บันทึกรายจ่าย (Expense/Payment)
- + บันทึกรายได้ (Receipt)
- + บันทึกบัญชี (Journal Entry)

---

## Step 1: /spec

### User Story
"As a Thai SME owner, I want quick one-click actions from the dashboard so I don't have to navigate through menus for common tasks."

### UX Empathy
- Thai users are NOT accountants — speed matters more than features
- Mobile users (small screens) need big touch targets
- FAB should not block content — place bottom-right, collapsible

### Options
1. **FAB only** — one button, expands to menu on click
2. **Fixed bottom bar** — always visible strip with 4 quick actions
3. **Dashboard widget** — card with 4 buttons in a grid

**Recommended:** Option 1 (FAB) — less visual noise, mobile-friendly, follows Material/Linear pattern

### Design
- Position: fixed bottom-right, 24px from edges
- Size: 56px diameter (standard FAB)
- Icon: `Plus` from Lucide
- On click: expand to show 4 action items in a vertical stack
- Each item: icon + Thai label, 44px height (touch-friendly)
- Backdrop: semi-transparent overlay when menu is open

### Actions to Wire
| Label | Target Module | Icon |
|-------|--------------|------|
| + ใบวางบิล | navigate to `/invoices/new` or open invoice dialog | FileText |
| + บันทึกรายจ่าย | navigate to `/payments/new` or open payment dialog | Receipt |
| + บันทึกรายได้ | navigate to `/receipts/new` or open receipt dialog | FilePlus |
| + บันทึกรายการ | navigate to `/journal/new` | BookOpen |

### Existing Code to Reference
- `src/components/layout/keerati-sidebar.tsx` — navigation pattern
- `src/app/page.tsx` — `navigateTo()` function for SPA routing
- `src/stores/app-store.ts` — `activeModule` state

---

## Step 2: /plan

### Tasks
1. Create `src/components/layout/quick-action-fab.tsx`
2. Add to `src/app/page.tsx` (import and render in return JSX)
3. Wire up 4 navigation actions using existing `navigateTo()` pattern

### File: quick-action-fab.tsx
```typescript
'use client';
import { useState } from 'react';
import { Plus, FileText, Receipt, FilePlus, BookOpen, X } from 'lucide-react';

const actions = [
  { label: 'ใบวางบิล', icon: FileText, module: 'invoices' },
  { label: 'บันทึกรายจ่าย', icon: Receipt, module: 'payments' },
  { label: 'บันทึกรายได้', icon: FilePlus, module: 'receipts' },
  { label: 'บันทึกรายการ', icon: BookOpen, module: 'journal' },
];
```

### Thai ERP Checklist
- [ ] All amounts in Satang (N/A for navigation component)
- [ ] Debit=credit balance (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Create `src/components/layout/quick-action-fab.tsx`:

```bash
# Read existing sidebar to match patterns
cat src/components/layout/keerati-sidebar.tsx | head -50
```

Implement:
- `useState` for open/closed
- Fixed positioning CSS
- Icon + label for each action
- `onClick` → `navigateTo(module)` or URL change
- Close on outside click (backdrop or X button)

---

## Step 4: /test

Manual verification:
1. Navigate to dashboard
2. FAB visible bottom-right
3. Click FAB → menu expands
4. Click "ใบวางบิล" → navigates to invoice creation
5. Click backdrop → menu closes

```bash
# Type check
bun run tsc --noEmit
```

---

## Step 5: /review

Checklist:
- [ ] FAB renders on all pages (check `src/app/page.tsx` render)
- [ ] Touch target ≥ 44px for each action
- [ ] Thai labels correct
- [ ] Menu closes on outside click
- [ ] No breaking of existing navigation

---

## Step 6: /ship

```bash
git add src/components/layout/quick-action-fab.tsx src/app/page.tsx
git commit -m "feat(A1): add quick action FAB on dashboard

- Floating action button bottom-right with 4 quick-create actions
- + ใบวางบิล, + บันทึกรายจ่าย, + บันทึกรายได้, + บันทึกรายการ
- Collapses/expands on click, closes on backdrop click
- Touch-friendly 44px targets
"
```
