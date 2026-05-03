# PLAN: RBAC Type Fix — COMPLETED ✅

## What Was Done

Schema already had all RBAC models — only code needed fixing.

### Completed Fixes (commit 92e7168)

1. **admin/employee-roles/route.ts** — removed `department`, `departmentId`,
   `isPrimary` fields; simplified to just `employeeId + roleId`
2. **admin/roles/route.ts** — `permissions` → `rolePermissions`; removed `type`
   field
3. **admin/approver-config/route.ts** — `condition`, `approverType`,
   `approverId`, `approverDepartmentId` → `documentType`, `approvalOrder`,
   `roleId`
4. **admin/permissions/my/route.ts** — `role.permissions` →
   `role.rolePermissions` traversal path
5. **purchase-requests/approve/route.ts** — simplified approval chain to
   `roleId` matching only; removed `approvalAudit` (model doesn't exist)

### Results

- TypeScript errors: **803 → 779** (24 fixed)
- Remaining 779 errors: pre-existing across 156 files (invoices, departments,
  employees, reports, etc.)
- Test failures: pre-existing (period-service mock issue)
- Lint errors: pre-existing (stock-take-service.ts)

---

## Remaining Work (NOT RBAC-related)

The 779 remaining errors are pre-existing code issues across:

- `src/app/api/invoices/*` — various issues
- `src/app/api/departments/*` — `id` not defined (Next.js 16 async params)
- `src/app/api/employees/*` — similar params issue
- `src/app/api/reports/*` — various
- `src/app/api/quotations/*` — various
- `src/components/*` — UI component type mismatches

These are separate issues that require individual fixes per file.

---

## Commands Reference

```bash
bun run type-check          # Count errors
bun run db:generate         # Regenerate Prisma client
bun run db:push --accept-data-loss  # Sync SQLite dev DB
bun run test                # Unit tests
bun run lint                # Lint check
```
