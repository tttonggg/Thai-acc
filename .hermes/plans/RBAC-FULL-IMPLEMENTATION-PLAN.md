# PLAN: RBAC & Document Approval System — Full Implementation

## Context

Code for RBAC and document approval chain already exists in:
- `src/app/api/admin/approver-config/route.ts`
- `src/app/api/admin/employee-roles/route.ts`
- `src/app/api/admin/permissions/route.ts`
- `src/app/api/admin/roles/route.ts`
- `src/app/api/purchase-requests/[id]/approve/route.ts`
- `src/lib/api-utils.ts` (checkUserPermission, requirePermission)

But the following models are MISSING from the schema:
- `Permission`, `Role`, `EmployeeRole`, `UserEmployee`
- `DocumentApproverConfig`
- SystemSettings account fields: `salesReturnsAccountId`, `vatOutputAccountId`, `arAccountId`, `purchaseAccountId`, `vatInputAccountId`, `apAccountId`

## Dev Cycle: Spec → Plan → Build → Test → Review → Simplify → Ship

---

## Phase 1: Schema Foundation

### Task 1: Add Permission & Role Models to schema-postgres.prisma
**File**: `prisma/schema-postgres.prisma`
**Depends on**: None
**Verify**: `grep -c "model Permission" prisma/schema-postgres.prisma` → 1

Add these models before the final `@@index` or `@@map` at the bottom of the file:
```prisma
model Permission {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  module    String
  action    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  rolePermissions RolePermission[]
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  employeeRoles  EmployeeRole[]
  rolePermissions RolePermission[]
}
```

**Acceptance**: `npx prisma validate` passes with new models recognized.

### Task 2: Add Join Tables to schema-postgres.prisma
**File**: `prisma/schema-postgres.prisma`
**Depends on**: Task 1
**Verify**: `grep -c "model EmployeeRole" prisma/schema-postgres.prisma` → 1

Add after Permission/Role:
```prisma
model EmployeeRole {
  id         String   @id @default(cuid())
  employeeId String
  roleId     String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([employeeId, roleId])
}

model UserEmployee {
  id         String   @id @default(cuid())
  userId     String   @unique
  employeeId String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model RolePermission {
  id            String   @id @default(cuid())
  roleId        String
  permissionId  String
  role          Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@unique([roleId, permissionId])
}
```

**Acceptance**: `npx prisma validate` passes.

### Task 3: Add DocumentApproverConfig to schema-postgres.prisma
**File**: `prisma/schema-postgres.prisma`
**Depends on**: Task 2
**Verify**: `grep -c "model DocumentApproverConfig" prisma/schema-postgres.prisma` → 1

```prisma
model DocumentApproverConfig {
  id            String   @id @default(cuid())
  documentType  String
  approvalOrder Int
  roleId        String
  threshold     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([documentType, approvalOrder])
}
```

**Acceptance**: `npx prisma validate` passes.

### Task 4: Add Account Fields to SystemSettings (schema-postgres.prisma)
**File**: `prisma/schema-postgres.prisma`
**Depends on**: Task 3
**Verify**: `grep "salesReturnsAccountId" prisma/schema-postgres.prisma` → found

Find the `SystemSettings` model and add these fields:
```prisma
salesReturnsAccountId  String?
vatOutputAccountId     String?
arAccountId            String?
purchaseAccountId      String?
vatInputAccountId      String?
apAccountId            String?
```

**Acceptance**: `npx prisma validate` passes and SystemSettings has all 6 fields.

### Task 5: Sync All Changes to schema-sqlite.prisma
**File**: `prisma/schema-sqlite.prisma`
**Depends on**: Tasks 1–4 (must mirror ALL changes)
**Verify**: Same grep commands on sqlite schema

Apply identical changes to schema-sqlite.prisma:
- Add Permission model
- Add Role model
- Add EmployeeRole model
- Add UserEmployee model
- Add RolePermission model
- Add DocumentApproverConfig model
- Add 6 account fields to SystemSettings

**Acceptance**: `npx prisma validate --schema=prisma/schema-sqlite.prisma` passes.

---

## Phase 2: DB Generation & Verification

### Task 6: Run db:generate
**Command**: `bun run db:generate`
**Depends on**: Tasks 1–5
**Verify**: Exit code 0

**Acceptance**: No errors. `@prisma/client` types updated.

### Task 7: Run db:push (dev DB)
**Command**: `bun run db:push --accept-data-loss`
**Depends on**: Task 6
**Verify**: Exit code 0

**Acceptance**: SQLite dev DB has all new tables and columns.

---

## Phase 3: Fix Logic Issues

### Task 8: Fix purchase-requests/approve Route
**File**: `src/app/api/purchase-requests/[id]/approve/route.ts`
**Depends on**: Task 6
**Verify**: `bun run type-check 2>&1 | grep -c "purchase-requests"` → 0

Current code calls `db.role.findMany()` directly. After new schema, the approval chain uses `DocumentApproverConfig.roleId` to find which employees have that role (via `EmployeeRole.roleId`).

Fix the approve logic to:
1. Find `DocumentApproverConfig` entries for `PURCHASE_REQUEST` ordered by `approvalOrder`
2. For each step, find employees with the required role via `EmployeeRole`
3. Track current approval step based on `DocumentApproverConfig.approvalOrder`

**Acceptance**: TypeScript compiles without errors for this file.

### Task 9: Fix credit-notes & debit-notes Routes
**Files**: `src/app/api/credit-notes/route.ts`, `src/app/api/debit-notes/route.ts`
**Depends on**: Task 6
**Verify**: `bun run type-check 2>&1 | grep -E "credit-notes|debit-notes"` → 0 errors

These files reference `SystemSettings.vatOutputAccountId`, `salesReturnsAccountId` etc. that may not exist yet or may be null. Use hardcoded fallbacks (comment with // TODO: from SystemSettings) when fields are null.

**Acceptance**: TypeScript compiles without errors for both files.

### Task 10: Verify api-utils.ts Permission Logic
**File**: `src/lib/api-utils.ts`
**Depends on**: Task 6
**Verify**: `bun run type-check 2>&1 | grep -c "api-utils"` → 0

The `checkUserPermission` function uses `UserEmployee` → `Employee` → `EmployeeRole` → `Role` → `RolePermission` → `Permission`. Verify the field traversals match the new schema.

**Acceptance**: TypeScript compiles without errors for this file.

---

## Phase 4: Seed Data

### Task 11: Create Seed Script
**File**: `prisma/seed.ts`
**Depends on**: Task 6
**Verify**: `bun run db:seed` exits 0

Add seed function `seedPermissionsAndRoles()`:
1. Upsert Permissions by `code` field (skip if exists)
2. Upsert Roles by `name` field (skip if exists)
3. Link RolePermissions (admin gets all perms; others get scoped)
4. Upsert `DocumentApproverConfig` for `PURCHASE_REQUEST`:
   - Step 1: `PURCHASE_REQUESTER` role
   - Step 2: `PURCHASE_APPROVER` role (or fallback to `ADMIN`)

Permission codes to seed:
```
admin.manage
invoices.view, invoices.create, invoices.edit, invoices.delete
receipts.view, receipts.create, receipts.edit
payments.view, payments.create, payments.edit
reports.view, reports.export
purchase_requests.create, purchase_requests.view, purchase_requests.approve
expenses.view, expenses.create, expenses.edit
inventory.view, inventory.create, inventory.edit
banking.view, banking.create, banking.edit
```

Roles to seed: `ADMIN`, `ACCOUNTANT`, `USER`, `VIEWER`, `PURCHASE_REQUESTER`, `PURCHASE_APPROVER`

**Acceptance**: Seed runs without errors and creates data.

---

## Phase 5: Test & QA

### Task 12: Type-Check Full Suite
**Command**: `bun run type-check`
**Depends on**: Tasks 1–10
**Verify**: Exit code 0

Expected: All TypeScript errors resolved. 0 errors.

### Task 13: Run Tests
**Command**: `bun run test`
**Depends on**: Task 12
**Verify**: Exit code 0

Run all unit tests to ensure nothing is broken.

### Task 14: E2E Smoke Test
**Command**: `bun run test:e2e`
**Depends on**: Task 12
**Verify**: Playwright tests pass

Smoke test: admin pages load without 500 errors.

### Task 15: Lint & Format
**Commands**: `bun run lint && bun run format`
**Depends on**: Task 12
**Verify**: Exit code 0

---

## Phase 6: Review

### Task 16: Code Review
**Depends on**: Tasks 1–15 (all complete)

Review checklist:
- [ ] All new models have proper relations and indexes
- [ ] Seed data is idempotent (upsert, not create)
- [ ] No hardcoded IDs in seed
- [ ] Approval chain logic handles missing approvers gracefully
- [ ] Monetary values still in Satang
- [ ] Period checks still in place where needed

---

## Phase 7: Simplify & Ship

### Task 17: Simplify
**Depends on**: Task 16

Look for:
- Redundant null checks that Prisma handles
- Duplicate logic between credit-notes and debit-notes that could be shared
- Any commented-out code from stub era that can be removed

### Task 18: Commit & Push
**Depends on**: Task 17

```
git add -A
git commit -m "feat(rbac): implement full RBAC + document approval chain

- Add Permission, Role, EmployeeRole, UserEmployee, RolePermission models
- Add DocumentApproverConfig model for approval chains
- Add SystemSettings account fields (AR, AP, VAT, Purchase)
- Add seed data for default roles and permissions
- Fix type errors across admin API routes

Closes #..."
git push origin dev/performance-framework
```

### Task 19: Deploy to VPS
**Depends on**: Task 18

Follow `thai-erp-deploy-vps` skill for production deployment.

---

## Dependency Graph

```
Tasks 1-4: schema-postgres.prisma (sequential)
    ↓
Task 5: schema-sqlite.prisma (depends on 1-4)
    ↓
Task 6: db:generate (depends on 5)
    ↓
Task 7: db:push (depends on 6)
    ↓
Tasks 8-10: Logic fixes (parallel, depend on 6)
    ↓
Task 11: Seed data (depends on 6)
    ↓
Tasks 12-15: Test & QA (sequential)
    ↓
Task 16: Review
    ↓
Task 17: Simplify
    ↓
Tasks 18-19: Ship & Deploy
```

## Parallelization

- **Streams 1A, 1B, 1C, 1D**: Tasks 1–4 (schema-postgres, sequential within stream)
- **Stream 2**: Tasks 6–7 (db generate + push, sequential)
- **Stream 3**: Tasks 8–10 (logic fixes, parallel with each other)
- **Stream 4**: Task 11 (seed, after db:generate)
- **Stream 5**: Tasks 12–15 (test & QA, sequential)
- **Stream 6**: Tasks 16–19 (review + ship, sequential)
