## A6: Approval Workflow UI — Document Approval Config
**Spec file:** `.hermes/plans/2026-05-05-A6-approval-workflow-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Backend already exists:** `src/app/api/purchase-requests/[id]/approve/route.ts`

---

## Schema Reality (verified against prisma/schema-postgres.prisma:2958-2965)

`DocumentApproverConfig` has only: `id, documentType, approvalOrder, roleId, createdAt, updatedAt`
- NO `threshold`, `steps`, `isActive`, `condition`, `approverType` fields
- `roleId` is a raw string — no `@relation` to `Role`; must fetch roles separately
- `Role` has `name` and `description` — NO `displayName` field
- Approver matching: `UserEmployee → Employee → EmployeeRole → Role` (not `roles`)

---

## What
Build a UI page to configure document approval rules (which documents need approval, approval thresholds, approver roles). The backend API already exists — just need to build the config UI.

---

## Step 1: /spec

### Backend Already Done
- `src/app/api/purchase-requests/[id]/approve/route.ts` — POST approve action
- `src/app/api/purchase-requests/[id]/reject/route.ts` — POST reject action
- Prisma has `DocumentApproverConfig`, `ApprovalWorkflow`, `ApprovalStep` models

### What UI Needs
1. **Config Page** (`/settings/approvals`) — set up approval rules:
   - Which document types need approval (PO, Invoice, Payment, Purchase Request)
   - Amount thresholds (e.g., PO > ฿50,000 needs approval)
   - Approver role (Manager, Admin, specific user)
   - Number of approval steps (1-step, 2-step)

2. **Approval Queue** — list of pending approvals for current user:
   - Show all documents awaiting approval
   - Approve/Reject buttons with optional comment

3. **Approval History** — past approval decisions

### Document Types to Support
- Purchase Requests (ใบขอซื้อ)
- Purchase Orders (ใบสั่งซื้อ)
- Payments (ใบจ่ายเงิน)
- Invoices (ใบวางบิล) — optional

### Schema to Reference
```prisma
model DocumentApproverConfig {
  id            String   @id @default(cuid())
  documentType  String   // PURCHASE_REQUEST, PURCHASE_ORDER, PAYMENT, INVOICE
  threshold     Int      // amount in Satang, 0 = always needs approval
  approverRole  String   // ADMIN, MANAGER, etc.
  steps         Int      @default(1) // 1-step or 2-step
  isActive      Boolean  @default(true)
}

model ApprovalWorkflow {
  id            String   @id @default(cuid())
  documentType  String
  documentId    String
  status        String   // PENDING, APPROVED, REJECTED
  currentStep   Int      @default(1)
  createdAt     DateTime @default(now())
}

model ApprovalStep {
  id            String   @id @default(cuid())
  workflowId    String
  step          Int
  approverId    String
  status        String   // PENDING, APPROVED, REJECTED
  comment       String?
  decidedAt     DateTime?
}
```

---

## Step 2: /plan

### Tasks
1. Create API routes for approval config CRUD
   - `GET /api/approval-config` — list all configs
   - `POST /api/approval-config` — create config
   - `PUT /api/approval-config/[id]` — update config
   - `DELETE /api/approval-config/[id]` — delete config

2. Create API for approval queue
   - `GET /api/approvals/pending` — pending approvals for current user

3. Create component `src/components/approval/approval-config-page.tsx`
4. Add navigation to sidebar under SETTINGS

### File Structure
```
src/app/api/approval-config/route.ts
src/app/api/approval-config/[id]/route.ts
src/app/api/approvals/pending/route.ts
src/components/approval/
  approval-config-page.tsx
  approval-queue-list.tsx
  approval-history-list.tsx
```

### Thai ERP Checklist
- [ ] All amounts in Satang (threshold stored as Int)
- [ ] Debit=credit (N/A — approval doesn't post GL)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A for config CRUD)

---

## Step 3: /build

Check existing backend:
```bash
ls src/app/api/purchase-requests/*/approve/
cat src/app/api/purchase-requests/[id]/approve/route.ts
```

Build the UI following existing patterns in the codebase.

---

## Step 4: /test

Manual:
1. Navigate to Settings → การอนุมัติ
2. Add new approval rule (e.g., PO > ฿50,000 needs Manager)
3. Create a PO > ฿50,000 → should require approval
4. Login as approver → see pending approval in queue
5. Approve → status changes

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Config page allows CRUD of approval rules
- [ ] Approval queue shows correct pending items
- [ ] Amount threshold correctly stored in Satang
- [ ] Approve/Reject actions work end-to-end
- [ ] RBAC: only approvers can see approval queue

---

## Step 6: /ship

```bash
git add src/app/api/approval-config/ src/app/api/approvals/
git add src/components/approval/
git commit -m "feat(A6): add approval workflow UI

- Approval config page under Settings (CRUD rules)
- Approval queue for approvers
- Approve/Reject with comments
- Supports: Purchase Requests, Orders, Payments
- Configurable thresholds in Satang
"
```
