# RBAC Gap Analysis Report
**Date:** 2026-05-02
**Last Updated:** 2026-05-02 (Added Role Management Security)
**Reference System:** Thai-acc-sandbox RBAC (11 roles, 49 permissions)
**Target System:** Thai ACC ERP (Current implementation)

---

## Table of Contents
1. [Authentication Architecture](#1-authentication-architecture)
2. [Role Structure](#2-role-structure)
3. [Permission System](#3-permission-system)
4. [Approval Workflows](#4-approval-workflows)
5. [Frontend Integration](#5-frontend-integration)
6. [Security Features](#6-security-features)
7. [Role Management Security](#7-role-management-security)
8. [Job Title Integration](#8-job-title-integration)
9. [Gap Summary](#9-gap-summary-table)
10. [Implementation Tasks](#10-implementation-tasks)
11. [Database Schema Changes](#11-database-schema-changes)

---

## 1. Authentication Architecture

| Aspect | Reference (Sandbox) | Thai ACC | Gap |
|--------|---------------------|----------|-----|
| **Model** | Two-tier: API Key + JWT | Single-tier: NextAuth JWT only | ❌ Missing API Key layer |
| **JWT Expiry** | 30 minutes + refresh (24h window) | 8 hours | ⚠️ Too long, no refresh |
| **Algorithm** | HS256 (pinned, explicit) | NextAuth default | ✅ Adequate |
| **Login Rate Limit** | 5 attempts/60s per IP | 20 attempts/15min per IP | ✅ Adequate |
| **Token Storage** | localStorage | HTTP-only cookies | ✅ More secure |

### Gap 1.1: No API Key / Tenant Authentication
**Severity:** Medium
**Impact:** Cannot distinguish between application-level and user-level auth
**Recommendation:** Not critical for single-tenant, but limits multi-tenant capability

### Gap 1.2: JWT Expiry Too Long
**Severity:** Medium
**Impact:** Compromised tokens have 8-hour window vs 30-minute window
**Recommendation:** Reduce to 1 hour with refresh endpoint

---

## 2. Role Structure

| Reference Roles (11) | Thai ACC Equivalent | Notes |
|----------------------|---------------------|-------|
| `super_admin` | ADMIN (combined) | ❌ Should be separate - has role management |
| `admin` | ADMIN (combined) | ❌ Should be separate - NO role management |
| `accountant` | ACCOUNTANT | ✅ Aligned |
| `ap_accountant` | (subset of ACCOUNTANT) | ❌ Not separated |
| `ar_accountant` | (subset of ACCOUNTANT) | ❌ Not separated |
| `purchasing_staff` | USER | ✅ Aligned (via legacy role) |
| `purchasing_manager` | (no equivalent) | ❌ Missing |
| `warehouse_staff` | (no equivalent) | ❌ Missing |
| `sales_staff` | USER | ✅ Aligned |
| `sales_manager` | (no equivalent) | ❌ Missing |
| `viewer` | VIEWER | ✅ Aligned |

### Gap 2.1: Only 4 Roles vs 11
**Severity:** HIGH
**Impact:** Cannot enforce fine-grained access (e.g., warehouse staff can't do sales)
**Recommendation:** Implement the 11-role model

### Gap 2.2: No Purchasing Manager Role
**Severity:** Medium
**Impact:** Cannot implement amount-based PO approvals (e.g., up to 25K)

### Gap 2.3: No Warehouse Staff Role
**Severity:** Medium
**Impact:** Cannot separate inventory permissions from sales

---

## 3. Permission System

| Aspect | Reference | Thai ACC | Gap |
|--------|-----------|----------|-----|
| **Permission Format** | `module.entity.action` (49 total) | `module.action` (legacy fallback) | ❌ Not fully implemented |
| **Permission Storage** | `roles_permissions` junction table | `employee_roles_permissions` junction | ✅ Structure exists |
| **Wildcard Support** | `*.*` for super_admin | No wildcard | ❌ Missing |
| **Permission Check** | Decorator `@require_permission` | `requirePermission(module, action)` | ✅ Functional |

### Gap 3.1: Permission Granularity
**Severity:** HIGH
**Impact:** Routes use `requireRole()` instead of `requirePermission()` - cannot differentiate between create/read/update/delete
**Current State:** `requireRole(['ACCOUNTANT', 'ADMIN'])` on journal routes
**Target:** `requirePermission('journal', 'create')` with appropriate roles having journal.create

### Gap 3.2: 49 Permissions vs ~15 Legacy Mappings
**Severity:** HIGH
**Impact:** Only 15 module.action pairs defined in legacyRoleCheck
**Recommendation:** Define all 49 permissions and map to roles

---

## 4. Approval Workflows

| Aspect | Reference | Thai ACC | Gap |
|--------|-----------|----------|-----|
| **Approval Type** | Amount-based (configurable rules) | Role-based only | ❌ Missing |
| **Document Rules** | `document_approval_rules` table | Not implemented | ❌ Missing |
| **Approval Chain** | PR → PO → GRN → Invoice | Single role check | ❌ Missing |
| **Multi-level** | Configurable per amount | None | ❌ Missing |

**Example Reference Rules:**
```
AP Invoice <= 10,000:  ap_accountant
AP Invoice > 10,000:  admin
Sales Order <= 50,000: sales_manager
Sales Order > 50,000:  admin
```

### Gap 4.1: No Amount-Based Approval
**Severity:** HIGH
**Impact:** All invoices/POs require same approval regardless of amount
**Recommendation:** Implement `document_approval_rules` table

---

## 5. Frontend Integration

| Aspect | Reference | Thai ACC | Gap |
|--------|-----------|----------|-----|
| **Auth Store** | Zustand `authStore.ts` with permissions | NextAuth SessionProvider | ⚠️ Partial |
| **Permission Hook** | `usePermission()` | Not implemented | ❌ Missing |
| **PermissionGuard** | `<PermissionGuard permission="...">` | `requiredPermission` in sidebar | ⚠️ Sidebar only |
| **hasPermission()** | Yes | `checkUserPermission()` async | ❌ Not in sync client state |

### Gap 5.1: No usePermission Hook
**Severity:** Medium
**Impact:** UI components cannot easily check permissions before rendering
**Recommendation:** Implement `usePermission()` hook for client-side checks

### Gap 5.2: PermissionGuard Component Missing
**Severity:** Medium
**Impact:** Cannot wrap buttons/sections with permission checks
**Recommendation:** Create `<PermissionGuard>` component

---

## 6. Security Features

| Feature | Reference | Thai ACC | Gap |
|---------|-----------|----------|-----|
| **Password Bcrypt** | 12 rounds (explicit) | Yes | ✅ Adequate |
| **JWT Secret** | RuntimeError if unset | fallback dev secret | ⚠️ Should enforce |
| **Error Messages** | Generic + server logging | Varies | ⚠️ Inconsistent |
| **Audit Log** | Yes (`admin.audit`) | Partial (activity_log) | ⚠️ Fragmented |
| **Session Invalidation** | On logout/password change | Session service exists | ✅ Implemented |

---

## 7. Role Management Security (NEW - 2026-05-02)

### Security Principle: RBAC Must Be Protected by RBAC

**Critical Rule:** Only specific roles can manage other roles. This prevents privilege escalation attacks.

### Role Management Permission Matrix

| Role | Can View Roles | Can Edit Role Definitions | Can Assign Roles to Users | Can View Audit Logs |
|------|---------------|---------------------------|---------------------------|---------------------|
| `super_admin` | ✅ Yes | ✅ Yes (full) | ✅ Yes | ✅ Yes |
| `accounting_manager` | ✅ Yes | ✅ Yes | ✅ Yes (finance only) | ✅ Yes |
| `admin` | ✅ Yes | ❌ NO | ❌ NO | ✅ Yes |
| `accountant` | ✅ Yes | ❌ NO | ❌ NO | ✅ Yes |
| `user` | ✅ Yes | ❌ NO | ❌ NO | ❌ NO |
| `viewer` | ✅ Yes | ❌ NO | ❌ NO | ❌ NO |

### Why Admin Cannot Manage Roles

**Attack scenario if admin could edit roles:**
```
1. Admin grants themselves `super_admin` permission
2. Admin escalates to full system access
3. Security breach complete
```

**This is a common security flaw** - the reference RBAC correctly prevents this.

### Required New Permissions

```typescript
// For Role Management
admin.roles        // Can view/edit roles and role permissions
admin.permissions  // Can view/edit permission definitions  
admin.users        // Can view/edit users (already exists)
admin.audit        // Can view audit logs (already exists)
```

### Implementation Requirements

```prisma
model Role {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String?
  isSystem      Boolean  @default(false)  // Cannot delete system roles
  canManageRoles Boolean @default(false)  // Can this role manage other roles?
  permissions   RolePermission[]
  employeeRoles EmployeeRole[]
}
```

**Security rules:**
1. Roles with `isSystem = true` cannot be deleted (ADMIN, ACCOUNTANT, USER, VIEWER)
2. Roles with `canManageRoles = true` can assign/edit roles (super_admin, accounting_manager)
3. Admin role should NOT have canManageRoles (prevents escalation)

### Gap 7.1: No Role Management Permission Checks
**Severity:** HIGH
**Impact:** Any admin could potentially escalate privileges
**Recommendation:** Add `canManageRoles` flag and permission checks

### Gap 7.2: No Super Admin Separation
**Severity:** HIGH
**Impact:** Combined ADMIN role has full access without separation
**Recommendation:** Split into super_admin + admin with different capabilities

---

## 8. Job Title Integration (NEW - 2026-05-02)

### Concept: Job Title Links to Default Roles

Instead of 1:1 mapping, job titles provide **default role suggestions** that HR can customize.

```
Employee
├── name: "สมชาย สมชื่น"
├── jobTitle: "ผู้จัดการบัญชี"     ← Links to job title
├── department: "บัญชี"
└── roles: []                        ← Assigned explicitly (overrides defaults)

JobTitle
├── name: "ผู้จัดการบัญชี"
├── department: "บัญชี"
├── defaultRoles: ["ACCOUNTANT"]      ← Suggested roles
└── isActive: true
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **Consistency** | Same job title = starting point for role assignment |
| **Auditability** | Know who has what role and why |
| **Reporting** | Filter employees by job title, see role distribution |
| **HR Workflow** | Onboarding = assign job title → roles auto-populate |
| **Flexibility** | Override defaults when needed (e.g., trainee gets less) |

### Job Title CRUD Permissions

| Role | Can Manage Job Titles | Can Assign to Employees |
|------|----------------------|------------------------|
| `super_admin` | ✅ Yes | ✅ Yes |
| `accounting_manager` | ✅ Yes | ✅ Yes |
| `admin` | ✅ Yes | ❌ NO |
| Other roles | ❌ NO | ❌ NO |

### Gap 8.1: No Job Title Field
**Severity:** Medium
**Impact:** Cannot link employees to job titles for org structure
**Recommendation:** Add jobTitleId to Employee + JobTitle table

---

## 8B. User ↔ Employee Linkage Review (2026-05-02)

**Dev Team Review Result: Schema is already correct**

The schema already has the right models for User ↔ Employee ↔ Role linkage:

```
User ← UserEmployee → Employee ← EmployeeRole → Role ← RolePermission → Permission
```

### Current Schema (Verified Correct)

| Model | Purpose |
|-------|---------|
| User | Auth identity (email, password, MFA, role ADMIN/ACCOUNTANT/USER/VIEWER) |
| Employee | Personnel record (code, name, salary, dept, tax ID, bank account) |
| UserEmployee | Join table linking 1 User → 1 Employee (@@unique([userId])) |
| EmployeeRole | Join table linking N Employees → N Roles |

### Design Decision: YES, Link User ↔ Employee

**Why it works for Thai SME:**
- Clear audit trail (who = which employee)
- Payroll integration (Employee = payroll subject)
- Approval routing via roleId on EmployeeRole
- Support for external accountants (User without Employee)

### Thai SME Real-World Pattern

```
Restaurant Group "ข้าวมันไก่ป้าแต๋ว":
├── User: admin@restaurant.com (ADMIN) → Employee: "นางสมศรี มั่นคง" (บัญชี)
├── User: order@restaurant.com → Employee: "นายวิชัย เจริญ" (พนักงานขาย)
├── User: kitchen@restaurant.com → Employee: "นายสมชาย รักดี" (พ่อครัว) — NO system login
└── User: accountant@paotay.com → Employee: "นางสมศรี มั่นคง" (external CPA)
```

### Keep As-Is (Already Correct)

- ✅ UserEmployee join table — allows future 1 user → multiple employees
- ✅ EmployeeRole join table — allows 1 employee with multiple roles
- ✅ DocumentApproverConfig for approval chains
- ✅ Permission + RolePermission for fine-grained access

### Recommended Future Changes

| Change | Priority | Notes |
|--------|----------|-------|
| Expand UserRole from 4 to 11 | Medium | Match RBAC_SYSTEM.md, OR keep coarse-grained |
| Add departmentId on Employee | Low | For org structure |
| Add branchId on Employee | Low | For multi-branch SMEs (ร้านสาขา) |

### Gap 8B.1: Need to Decide Role Architecture
**Decision Point:** Should User.role be:
- **Option A:** Coarse-grained (4 roles) + EmployeeRole for fine-grained permissions
- **Option B:** Full 11 roles directly on User.role

**Recommendation:** Option A (keep coarse-grained User.role, use EmployeeRole for permissions)
- Simpler auth flow
- Clear separation between auth identity and business permissions
- Matches existing schema design

---

## 9. Gap Summary Table

| # | Gap Area | Severity | Effort | Status | Notes |
|---|----------|----------|--------|--------|-------|
| 1 | JWT expiry 8h → 1h | Medium | Low | ✅ DONE | Phase 1 complete |
| 2 | **RBAC models in schema** (Role, Permission, EmployeeRole, UserEmployee) | HIGH | HIGH | ✅ DONE | Phase 2 complete - tables created |
| 3 | Add canManageRoles to Role | Medium | Low | ✅ DONE | Added to Role model |
| 4 | Replace `requireRole` → `checkUserPermission` | High | High | ✅ DONE | Phase 4 - 18 routes migrated |
| 5 | Amount-based approval rules | High | Medium | TODO | DocumentApprovalRule model |
| 6 | `usePermission()` hook | Medium | Low | ✅ DONE | Phase 1 complete |
| 7 | `<PermissionGuard>` component | Medium | Low | ✅ DONE | Already exists |
| 8 | API Key / Tenant layer | Low | High | TODO (future) | Not needed for single-tenant |
| 9 | Department-scoped permissions | Low | Medium | TODO | Already supports in API |
| 10 | Role management permission checks | High | Medium | ✅ DONE | Phase 3 - canManageRoles check |
| 11 | Job Title + JobTitle table | Medium | Medium | TODO | Optional enhancement |
| 12 | Audit logging for role changes | Low | Medium | ✅ DONE | Phase 3 - logAudit added |

---

## 10. Implementation Tasks

### Phase 1: Security Hardening (Quick Wins) ✅ DONE

- [x] **TASK-1: Reduce JWT expiry from 8h to 1h**
  - File: `src/lib/auth.ts`
  - Change: `maxAge: 8 * 60 * 60` → `maxAge: 60 * 60`
  - Risk: LOW (backward compatible)
  - Verif: Login, wait 1h, verify session expired

- [ ] **TASK-2: Add canManageRoles flag to Role model**
  - File: `prisma/schema.prisma`
  - Add: `canManageRoles Boolean @default(false)` to Role
  - Risk: MEDIUM (schema change, needs migration)
  - Verif: Test role edit with different users

- [x] **TASK-3: Create usePermission hook**
  - File: `src/hooks/usePermission.ts`
  - Implement: `usePermission(permissionCode): boolean`
  - Risk: LOW (additive)
  - Verif: UI renders correctly based on permissions

- [x] **TASK-4: Create PermissionGuard component**
  - File: `src/components/auth/PermissionGuard.tsx`
  - Implement: Wraps children with permission check
  - Risk: LOW (additive)
  - Verif: Buttons hidden when user lacks permission

### Phase 3: Role Management Security ✅ DONE

- [x] **TASK-8: Add canManageRoles to Role model**
  - ✅ DONE - Added to Role model in schema.prisma

- [x] **TASK-9: Add canManageRoles permission check functions**
  - ✅ DONE - Added canManageRoles() and requireCanManageRoles() in api-utils.ts

- [x] **TASK-10: Apply requireCanManageRoles to role management APIs**
  - ✅ DONE - /api/admin/roles and /api/admin/employee-roles now use requireCanManageRoles()

- [x] **TASK-11: Add audit logging for role changes**
  - ✅ DONE - logAudit() calls added to role management routes

### Phase 3: Permission Infrastructure

- [ ] **TASK-10: Define fine-grained permissions in DB** ❌ SKIPPED (no Permission table yet)
  - Need to add Permission model first (TASK-5)
  - Will define permissions as Phase 3 after schema is ready

- [ ] **TASK-11: Replace requireRole with checkUserPermission in API routes**
  - Files: All API routes using requireRole
  - Change: `requireRole(['ACCOUNTANT'])` → `checkUserPermission('journal', 'create')`
  - Risk: MEDIUM (backend logic change)
  - Verif: Test each module after changes

- [ ] **TASK-12: Implement amount-based approval rules**
  - File: `prisma/schema.prisma`
  - Add: DocumentApprovalRule model (documentType, minAmount, maxAmount, requiredRoleId, sequence)
  - Risk: MEDIUM (schema change + logic)
  - Verif: Test approval routing with different amounts

- [ ] **TASK-13: Sync permissions to EmployeeRole via migration**
  - File: `prisma/migrate-user-employee.ts`
  - Ensure existing EmployeeRole records have proper permissions
  - Risk: MEDIUM (data migration)
  - Verif: Verify role-permission assignments
  - Verif: Test approval flow with different amounts

### Phase 4: Job Title Integration (Optional)

- [ ] **TASK-14: Add JobTitle model**
  - File: `prisma/schema.prisma`
  - Add: JobTitle with name, department, isActive
  - Risk: MEDIUM (schema change)
  - Verif: Can create/edit job titles

- [ ] **TASK-15: Add jobTitleId to Employee**
  - File: `prisma/schema.prisma`
  - Add: jobTitleId FK to Employee
  - Risk: MEDIUM (schema change)
  - Verif: Employee form shows job title dropdown

- [ ] **TASK-16: Job title permission checks**
  - Files: Employee routes, UI
  - Restrict: Only users with `canManageRoles=true` can manage job titles
  - Risk: LOW (additive)
  - Verif: Non-authorized users cannot create job titles

### Phase 5: Optional Enhancements

- [ ] **TASK-17: Add departmentId to Employee**
  - File: `prisma/schema.prisma`
  - Add: departmentId FK for org structure filtering
  - Risk: LOW (additive)
  - Verif: Employee list can be filtered by department

- [ ] **TASK-18: Add branchId to Employee (for multi-branch SMEs)**
  - File: `prisma/schema.prisma`
  - Add: branchId for multi-branch support
  - Risk: LOW (additive)
  - Verif: Employee has branch assignment

---

## 11. Database Schema Changes

### Required New Tables/Fields

```prisma
// Role enhancements
model Role {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String?
  isSystem      Boolean  @default(false)  // Cannot delete system roles
  canManageRoles Boolean @default(false)  // Can this role manage other roles?
  // ... existing fields
}

// New permissions (add to seed)
model Permission {
  id          String   @id @default(cuid())
  code        String   @unique  // format: module.entity.action
  module      String
  entity      String
  action      String
  description String?
  // ...
}

// New: Job Title
model JobTitle {
  id            String   @id @default(cuid())
  name          String   // "ผู้จัดการบัญชี"
  department    String
  defaultRoles  String[] // ["ACCOUNTANT"]
  isActive      Boolean  @default(true)
  employees     Employee[]
}

// Employee enhancement
model Employee {
  // ... existing fields
  jobTitleId  String?
  jobTitle    JobTitle? @relation(fields: [jobTitleId], references: [id])
}

// New: Document Approval Rules
model DocumentApprovalRule {
  id            String   @id @default(cuid())
  documentType  String   // AP_INVOICE, AR_INVOICE, PO, SO
  minAmount     Int      // 0 = no minimum
  maxAmount     Int      // 0 = no maximum
  requiredRoleId String
  sequence      Int      @default(1)
}
```

---

## 12. Security Checklist

- [ ] `canManageRoles` defaults to false for all new roles
- [ ] Only super_admin and accounting_manager can assign admin.roles
- [ ] Admin cannot escalate own permissions
- [ ] Role changes logged in audit trail
- [ ] Job title management restricted to authorized roles
- [ ] JWT expiry reduced to 1 hour
- [ ] No wildcard permissions except super_admin

---

## 13. Testing Checklist

After each task, verify:

- [ ] Login works with existing credentials
- [ ] Unauthorized users see 403 error (not 500)
- [ ] Role changes reflect immediately (no cache issues)
- [ ] Audit log captures all permission changes
- [ ] Frontend permission checks match backend

---

*Document generated by Claude Code RBAC Analysis*
*Reference: /Users/tong/Desktop/Thai-acc-sandbox/docs/RBAC_SYSTEM.md*
*Last Updated: 2026-05-02 (Added Role Management Security, Job Title Integration)*