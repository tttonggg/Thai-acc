# SPEC: RBAC & Document Approval System — Full Implementation

## Objective

Unlock the existing RBAC/approval code that is already written but blocked by missing Prisma models. The code in `src/app/api/admin/*` and `src/lib/api-utils.ts` references `Permission`, `Role`, `EmployeeRole`, `UserEmployee`, `DocumentApproverConfig` models that don't exist in the schema. This spec adds those models and seeds the data.

## What Already Exists (code is written, just needs schema)

### API Routes (already implemented):
- `src/app/api/admin/approver-config/route.ts` — CRUD for document approver configs
- `src/app/api/admin/employee-roles/route.ts` — assign roles to employees
- `src/app/api/admin/permissions/route.ts` — manage permissions
- `src/app/api/admin/permissions/my/route.ts` — get current user's permissions
- `src/app/api/admin/roles/route.ts` — CRUD for roles
- `src/app/api/purchase-requests/[id]/approve/route.ts` — approval chain logic

### Service Functions (already implemented):
- `checkUserPermission(module, action)` in `src/lib/api-utils.ts`
- `getUserPermissions()` in `src/lib/api-utils.ts`
- `requirePermission(module, action)` in `src/lib/api-utils.ts`

### UI Components (already implemented):
- `src/components/admin/approver-config/approver-config.tsx`
- `src/components/admin/role-management/role-management.tsx`
- Menu items in `src/app/page.tsx`

## Prisma Models Needed

### 1. Permission
```prisma
model Permission {
  id        String   @id @default(cuid())
  code      String   @unique  // e.g. "INVOICE_CREATE", "ADMIN_MANAGE"
  name      String            // e.g. "Create Invoice", "Admin Management"
  module    String            // e.g. "invoice", "admin"
  action    String            // e.g. "create", "manage"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  rolePermissions RolePermission[]
}
```

### 2. Role
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique  // "ADMIN", "ACCOUNTANT", "USER", "VIEWER"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  employeeRoles  EmployeeRole[]
  rolePermissions RolePermission[]
}
```

### 3. EmployeeRole (join table)
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
```

### 4. UserEmployee (join table)
```prisma
model UserEmployee {
  id         String   @id @default(cuid())
  userId     String   @unique
  employeeId String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([userId])
}
```

### 5. DocumentApproverConfig
```prisma
model DocumentApproverConfig {
  id            String   @id @default(cuid())
  documentType  String   // "PURCHASE_REQUEST", "INVOICE", "PAYMENT", etc.
  approvalOrder Int      // sequence in approval chain
  roleId        String   // which role can approve at this step
  threshold     Int?     // optional: amount threshold for this approver
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([documentType, approvalOrder])
}
```

### 6. Update SystemSettings
Add to existing `SystemSettings` model:
```prisma
salesReturnsAccountId  String?  // default '4130'
vatOutputAccountId     String?  // default '2132'
arAccountId            String?  // default '1121'
purchaseAccountId      String?  // default '5100'
vatInputAccountId      String?  // default '1131'
apAccountId            String?  // default '2111'
```

## Relationships Summary

```
User ←UserEmployee→ Employee ←EmployeeRole→ Role ←RolePermission→ Permission
                                                              ↑
DocumentApproverConfig (links Role → approval chain per document type)
```

## Seed Data

### Permissions (module.action)
```
ADMIN: admin.manage
ACCOUNTANT: invoices.view, invoices.create, invoices.edit, invoices.delete,
            receipts.view, receipts.create, receipts.edit,
            payments.view, payments.create, payments.edit,
            reports.view, reports.export
USER: invoices.view, receipts.view, payments.view
VIEWER: invoices.view, receipts.view, payments.view, reports.view
PURCHASE_REQUESTER: purchase_requests.create, purchase_requests.view
PURCHASE_APPROVER: purchase_requests.approve, purchase_requests.view
```

### Roles
```
ADMIN, ACCOUNTANT, USER, VIEWER, PURCHASE_REQUESTER, PURCHASE_APPROVER
```

### Default Approver Config (Purchase Request)
```
Step 1: PURCHASE_REQUESTER creates
Step 2: PURCHASE_APPROVER approves (or ADMIN if no PURCHASE_APPROVER)
```

## Files to Modify

### Stream 1: Schema
- `prisma/schema-postgres.prisma` — add all models above
- `prisma/schema-sqlite.prisma` — add all models above
- `prisma/seed.ts` — add seed for permissions, roles, default approver configs

### Stream 2: Logic Fixes
- `src/lib/api-utils.ts` — checkUserPermission/getUserPermissions already use the right fields, just need to ensure UserEmployee relation is correct
- `src/app/api/purchase-requests/[id]/approve/route.ts` — fix `db.role.findMany()` to work with new schema
- `src/app/api/credit-notes/route.ts` — use hardcoded fallbacks since SystemSettings fields may be null
- `src/app/api/debit-notes/route.ts` — same pattern

### Stream 3: Test Verification
- `bun run db:generate` after schema changes
- `bun run db:push --accept-data-loss` to sync DB
- `bun run type-check` should show 0 errors for admin/credit-note/debit-note files

## Acceptance Criteria

1. `bun run type-check` shows 0 TypeScript errors for admin API routes
2. `bun run type-check` shows 0 errors for credit-notes and debit-notes routes
3. `bun run db:generate` succeeds
4. `bun run db:push --accept-data-loss` succeeds
5. Admin UI pages (`/admin/approver-config`, `/admin/roles`) load without 500
