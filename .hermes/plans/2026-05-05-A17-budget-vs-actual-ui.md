## A17: Budget vs Actual UI — งบประมาณ vs จริง
**Spec file:** `.hermes/plans/2026-05-05-A17-budget-vs-actual-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Partial:** Schema has `DepartmentBudget` model, no UI

---

## What
Allow users to set annual/monthly budgets per expense category and compare against actual spending. Visual progress bars show how much budget is consumed.

---

## Step 1: /spec

### Schema (exists)
```prisma
model DepartmentBudget {
  id           String   @id @default(cuid())
  departmentId String?
  accountId    String   // expense account
  fiscalYear   Int
  month        Int?     // null = annual budget
  amount       Int      // budget amount in Satang
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### What UI Needs
1. **Budget Config Page** — set budgets per account:
   - Select account (expense accounts only)
   - Set monthly OR annual budget
   - Year selector

2. **Budget vs Actual Report** — main view:
   - Table: Account | Budget (฿) | Actual (฿) | Remaining (฿) | %
   - Progress bar: green < 80%, yellow 80-100%, red > 100%
   - Filter: monthly / quarterly / annual view
   - Year selector

3. **Example Display**
   | ค่าเดินทาง | ฿50,000 | ฿38,500 | ฿11,500 | 77% | ████████░░ |
   | ค่าใช้จ่ายสำนักงาน | ฿30,000 | ฿31,200 | -฿1,200 | 104% | ██████████ 🔴 |

### Use Case
"As a business owner, I want to see if I'm on track with my budget so I don't overspend."

---

## Step 2: /plan

### Tasks
1. Check schema:
```bash
grep -A 20 "model DepartmentBudget" prisma/schema.prisma
```

2. Create budget API routes:
   - `GET /api/budgets?year=2026&month=5` — list budgets + actuals
   - `POST /api/budgets` — create budget
   - `PUT /api/budgets/[id]` — update budget
   - `DELETE /api/budgets/[id]` — delete budget

3. Calculate actual spending per account:
   - Sum of journal lines posting to that account for the period
   - Filter by: posted + within date range

4. Create component `src/components/budgets/budget-vs-actual-page.tsx`

5. Add to sidebar under REPORTS

### Files
```
src/app/api/budgets/route.ts
src/app/api/budgets/[id]/route.ts
src/components/budgets/
  budget-vs-actual-page.tsx
  budget-form-dialog.tsx
  budget-progress-bar.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang (stored + displayed)
- [ ] Debit=credit (N/A)
- [ ] Period check (use accounting period)
- [ ] Prisma transaction (N/A for reads)

---

## Step 3: /build

Check accounts that are expense type:
```bash
grep -n "AC_EXPENSE\|expense" src/lib/constants/ || grep "AccountType" prisma/schema.prisma | head -5
```

Build budget CRUD + actual calculation.

---

## Step 4: /test

Manual:
1. Navigate to Reports → งบประมาณ vs จริง
2. Click "+ เพิ่มงบประมาณ"
3. Select "ค่าเดินทาง" account, monthly ฿50,000
4. Save → see budget row with 0 actual
5. Create expense payment to "ค่าเดินทาง" ฿20,000
6. Refresh → Actual shows ฿20,000, remaining ฿30,000, bar at 40%

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Budget CRUD works
- [ ] Actual spending calculated from journal entries
- [ ] Progress bars show correct colors (green/yellow/red)
- [ ] Filter by month/quarter/year works
- [ ] Over-budget items clearly flagged (> 100%)

---

## Step 6: /ship

```bash
git add src/app/api/budgets/
git add src/components/budgets/
git commit -m "feat(A17): add budget vs actual UI

- Budget management: set monthly/annual budgets per expense account
- Compare against actual spending from journal entries
- Progress bars: green <80%, yellow 80-100%, red >100%
- Filter by month/quarter/year
- Warning when over budget
"
```
