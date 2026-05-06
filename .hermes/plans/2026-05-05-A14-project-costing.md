## A14: Project/Job Costing — ต้นทุนต่อโปรเจกต์
**Spec file:** `.hermes/plans/2026-05-05-A14-project-costing.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0 (schema changes required)

---

## What
Track revenue and costs per project/job. Assign invoices, expenses, and time to projects → get profit/loss per project report.

---

## Step 1: /spec

### Data Model
```prisma
model Project {
  id           String    @id @default(cuid())
  name         String
  code         String    @unique  // PRJ-001
  description  String?
  status       ProjectStatus @default(ACTIVE)
  startDate    DateTime?
  endDate      DateTime?
  customerId   String?
  customer     Customer? @relation(fields: [customerId], references: [id])
  
  // Budget
  budgetRevenue  Int?     // expected revenue in Satang
  budgetCost     Int?     // budgeted cost in Satang
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

model ProjectTransaction {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  
  // Links to existing documents (nullable for manual entries)
  invoiceId   String?
  paymentId   String?
  journalEntryId String?
  expenseId  String?
  
  type        ProjectTransactionType // INVOICE, EXPENSE, TIME_COST
  amount      Int     // in Satang
  description String?
  date        DateTime
  
  createdAt   DateTime @default(now())
}

enum ProjectTransactionType {
  REVENUE     // from invoices
  EXPENSE     // from payments
  TIME_COST   // manual labor cost
}
```

### Use Cases
1. "New Project" → name, code, customer, dates, budget
2. Assign invoice to project → revenue
3. Assign payment to project → expense
4. Project report: Revenue - Expenses = Profit/Loss
5. Budget vs Actual per project

### Project Report Output
```
โปรเจกต์: ก่อสร้างอาคาร B
รหัส: PRJ-001 | ลูกค้า: บริษัท ABC

รายได้:        ฿500,000  (3 ใบวางบิล)
ค่าใช้จ่าย:    ฿320,000  (12 รายการ)
─────────────────────────
กำไรขั้นต้น:   ฿180,000   (36%)
งบประมาณรายได้: ฿600,000   (ดึง 83%)
งบประมาณค่าใช้จ่าย: ฿400,000 (ใช้ไป 80%)
```

---

## Step 2: /plan

### Tasks
1. Add to Prisma schema: `Project`, `ProjectTransaction`, `ProjectStatus` enum
2. Create API routes:
   - `GET /api/projects` — list projects
   - `POST /api/projects` — create project
   - `GET /api/projects/[id]` — project detail + transactions
   - `PUT /api/projects/[id]` — update
   - `DELETE /api/projects/[id]` — soft delete
   - `POST /api/projects/[id]/transactions` — add manual transaction
   - `GET /api/projects/reports/profit-loss` — P&L per project

3. Create project assignment UI:
   - On invoice/payment forms: "โปรเจกต์" dropdown
   - On journal entry: "โปรเจกต์" dropdown

4. Create Reports:
   - Project list page
   - Project detail page (transactions)
   - Profit/loss report

### Files
```
prisma/schema.prisma                    # add Project models
src/app/api/projects/route.ts
src/app/api/projects/[id]/route.ts
src/app/api/projects/[id]/transactions/route.ts
src/app/api/projects/reports/profit-loss/route.ts
src/components/projects/
  projects-page.tsx
  project-detail-page.tsx
  project-form-dialog.tsx
  project-transaction-list.tsx
  project-profit-loss-report.tsx
src/components/invoices/invoice-form-dialog.tsx  # add project dropdown
src/components/payments/payment-form-dialog.tsx   # add project dropdown
src/components/journal/journal-entry-dialog.tsx  # add project dropdown
```

### Thai ERP Checklist
- [ ] All amounts in Satang
- [ ] Debit=credit (N/A — project assignment doesn't change accounting)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)

---

## Step 3: /build

Create schema migration first, then API, then UI.

---

## Step 4: /test

Manual:
1. Create project "งานติดตั้ง ABC" with ฿500,000 budget
2. Create invoice ฿100,000 → assign to project → shows in project revenue
3. Create payment ฿30,000 expense → assign to project → shows in project expense
4. View project detail → sees Revenue ฿100K, Expense ฿30K, Profit ฿70K

```bash
bun run db:push
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Projects CRUD works
- [ ] Can assign invoice/payment/journal to project
- [ ] Project report shows correct revenue/expense/profit
- [ ] Budget comparison works
- [ ] Project status (active/completed/cancelled) works

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add src/app/api/projects/
git add src/components/projects/
git add src/components/invoices/ src/components/payments/ src/components/journal/
git commit -m "feat(A14): add project/job costing

- Project model with budget tracking
- Assign invoices, payments, expenses to projects
- Project P&L report: revenue - expenses = profit/loss
- Budget vs actual per project
- Track project status (active/completed/cancelled)
"
```
