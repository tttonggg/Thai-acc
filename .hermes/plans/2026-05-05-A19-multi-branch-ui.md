## A19: Multi-Branch UI — หลายสาขา
**Spec file:** `.hermes/plans/2026-05-05-A19-multi-branch-ui.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0 (schema has branchId, UI missing)

---

## What
Support multiple company branches within one database. Users can switch between branches and all reports/data filter by the selected branch.

---

## Step 1: /spec

### Current State
- Schema has `branchId` on many models
- No UI to create/manage branches or switch between them

### Target: Multi-Branch Support

**Branch Model:**
```prisma
model Branch {
  id          String   @id @default(cuid())
  code        String   // "HQ", "BR001", "สาขากรุงเทพ"
  name        String   // "สำนักงานใหญ่", "สาขาภาคตะวันออก"
  address     String?
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  // Relations
  users      UserBranch[]
  invoices   Invoice[]
  payments   Payment[]
  // ... all branchable entities
}

model UserBranch {
  userId    String
  branchId  String
  isDefault Boolean @default(false)
  user      User    @relation(...)
  branch    Branch  @relation(...)
}
```

### Branch Selector UI
- Header dropdown: "📍 สำนักงานใหญ่ ▼" or "📍 ทั้งหมด"
- Switching branch → all data filters to that branch
- "ทั้งหมด" = see all branches (admin only)

### What Gets Branched
- Invoices, Receipts, Payments
- Journal Entries
- Customers, Vendors (optional — some shared)
- Products (shared inventory across branches = separate module)
- Bank accounts, Petty cash

### What is Shared
- Chart of Accounts (ผังบัญชี)
- Products (but stock is per-branch)
- Users & Roles
- Settings

---

## Step 2: /plan

### Tasks
1. Check schema for existing branch support:
```bash
grep -n "branchId\|Branch\|userBranch" prisma/schema.prisma | head -20
```

2. Add Branch model + UserBranch to schema (if missing)

3. Create branch API:
   - `GET /api/branches` — list branches
   - `POST /api/branches` — create branch
   - `PUT /api/branches/[id]` — update
   - `DELETE /api/branches/[id]` — deactivate (soft)

4. Add branch to app state:
   - `src/stores/app-store.ts` — add `currentBranchId` state
   - `navigateTo()` preserves branch when switching

5. Create branch selector component:
   - `src/components/layout/branch-selector.tsx` — dropdown in header
   - "📍 สาขา: [name] ▼"

6. Add branch filter to all data queries:
   - Middleware or service-layer adds `where: { branchId }` automatically
   - Admin role sees "ทั้งหมด" option

7. Add branch management page:
   - Settings → สาขา (Branches)

### Files
```
prisma/schema.prisma
src/app/api/branches/route.ts
src/app/api/branches/[id]/route.ts
src/stores/app-store.ts
src/components/layout/branch-selector.tsx
src/components/settings/branches-page.tsx
src/lib/api-utils.ts  # add branch filter helper
```

### Thai ERP Checklist
- [ ] All amounts in Satang (N/A for branch switching)
- [ ] Debit=credit (N/A)
- [ ] Period check (N/A)
- [ ] Prisma transaction (N/A)
- [ ] All queries filtered by branchId (enforce at service layer)

---

## Step 3: /build

Build branch selector in header, add branch filter to data services.

---

## Step 4: /test

Manual:
1. Login as admin
2. Header shows "📍 ทั้งหมด"
3. Switch to "สาขากรุงเทพ"
4. Create invoice → belongs to กริงเทพ branch
5. Switch to "สาขาภาคตะวันออก" → earlier invoice not visible
6. Create invoice → belongs to ภาคตะวันออก
7. Reports → filter by selected branch

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Branch selector visible in header
- [ ] Switching branch filters all data
- [ ] Admin can see "ทั้งหมด" option
- [ ] New documents automatically assigned current branch
- [ ] Reports filter by branch
- [ ] User can be assigned to multiple branches

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add src/app/api/branches/
git add src/stores/app-store.ts
git add src/components/layout/branch-selector.tsx
git add src/components/settings/branches-page.tsx
git add src/lib/api-utils.ts
git commit -m "feat(A19): add multi-branch support UI

- Branch selector in header: '📍 สาขา ▼'
- All data filtered by selected branch
- Admin can view all branches
- Branch CRUD in Settings
- Users can be assigned to multiple branches
"
```
