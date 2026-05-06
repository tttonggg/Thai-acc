## A15: Customer Portal — พอร์ทัลลูกค้า
**Spec file:** `.hermes/plans/2026-05-05-A15-customer-portal.md`
**Updated:** 2026-05-06
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Complexity:** MEDIUM-HIGH (3-5 days)
**Auth approach:** Option B — same NextAuth, `CUSTOMER_PORTAL` role (NOT separate auth system)

---

## What
Allow customers to log in to a portal to view their invoices, make payments,
and download statements. Reduces "where's my invoice?" emails.

This is NOT a separate auth system. Customers use the same NextAuth.js stack
with a `CUSTOMER_PORTAL` role. The isolation is data-level (WHERE customerId = X),
not infrastructure-level.

---

## Current Codebase State

| Item | Status |
|------|--------|
| Customer model | EXISTS — `prisma/schema.prisma:212` with id, email, name, phone, etc. |
| Invoice model | EXISTS — `prisma/schema.prisma:364` with customerId FK, paidAmount, status, all amounts in Satang |
| UserRole enum | EXISTS — ADMIN, ACCOUNTANT, USER, VIEWER (no CUSTOMER_PORTAL yet) |
| Separate Role model | EXISTS — Role/RolePermission/EmployeeRole RBAC system |
| CustomerPortalAccount | NOT YET — needs to be created |
| /portal routes | NOT YET — needs to be created |

---

## Step 1: /spec

### Portal Features
1. **Login page** — `/portal/login` — customer email + portal password
2. **Dashboard** — outstanding balance, recent invoices, due soon
3. **Invoice list** — filter by status (DRAFT/POSTED/PAID/OVERDUE/CANCELLED)
4. **Invoice detail** — view line items, PDF download, payment history
5. **Payment recording** — customer records offline payment (slip image upload)
6. **Statement download** — monthly statement PDF
7. **ERP staff action** — approve/reject recorded payments (in main ERP, not portal)

### Customer Portal vs Main ERP
| Aspect | Main ERP | Customer Portal |
|--------|----------|----------------|
| Auth | Staff credentials | Customer email + portal password |
| Access | All data | WHERE customerId = their own |
| Role | ADMIN, ACCOUNTANT, USER, VIEWER | CUSTOMER_PORTAL |
| URL | / (SPA via activeModule) | /portal/* (Next.js route group) |
| Session | NextAuth | Same NextAuth, different role |

### Data Model

**Add to `prisma/schema.prisma`:**

```prisma
model CustomerPortalAccount {
  id            String    @id @default(cuid())
  customerId    String    @unique
  customer      Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  email         String    @unique  // used for login
  passwordHash  String
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([customerId])
}
```

**Extend UserRole enum:**
```prisma
enum UserRole {
  ADMIN
  ACCOUNTANT
  USER
  VIEWER
  CUSTOMER_PORTAL  // ADD THIS
}
```

**Extend User model** (for auth linkage):
```prisma
model User {
  // ... existing fields
  role             UserRole      @default(USER)
  customerPortalAccount CustomerPortalAccount?  // ADD THIS (1-to-1)
}
```

### Auth Flow (Option B)
1. Staff creates CustomerPortalAccount from Customer form in ERP
   - Sets email + generates temp password (or sends invite email)
2. Customer visits `/portal/login`
3. CustomerPortalAccount linked to User with `CUSTOMER_PORTAL` role
4. Customer logs in → NextAuth session with `CUSTOMER_PORTAL` role
5. All portal API routes check `requireRole('CUSTOMER_PORTAL')` AND
   `WHERE customerId = session.user.customerId`

### Files to Create/Change
```
prisma/schema.prisma                        CHANGE: add CustomerPortalAccount, extend UserRole
schema-postgres.prisma                      CHANGE: same
schema-sqlite.prisma                        CHANGE: same

src/app/api/portal/
  auth/login/route.ts                       NEW: POST login (returns NextAuth session)
  auth/logout/route.ts                      NEW: POST logout
  auth/me/route.ts                          NEW: GET current customer
  invoices/route.ts                          NEW: GET list (filtered by customerId)
  invoices/[id]/route.ts                     NEW: GET detail (verify customerId match)
  payments/route.ts                          NEW: POST record payment (offline slip)
  statements/route.ts                        NEW: GET monthly statement PDF

src/app/portal/
  (auth)/
    login/page.tsx                          NEW: login form
  (app)/
    layout.tsx                              NEW: portal shell with header/sidebar
    dashboard/page.tsx                      NEW: outstanding balance, recent invoices
    invoices/
      page.tsx                              NEW: invoice list with filters
      [id]/page.tsx                         NEW: invoice detail + PDF download
    payments/
      new/page.tsx                          NEW: record payment form + slip upload

src/lib/
  portal-auth.ts                             NEW: portal-specific auth helpers
  portal-invoice-service.ts                  NEW: customer-scoped invoice queries
  portal-payment-service.ts                  NEW: record customer payments

src/components/portal/
  portal-layout.tsx                          NEW: portal shell (header, nav, logout)
  invoice-list.tsx                           NEW: invoice list with status badges
  invoice-detail.tsx                         NEW: invoice lines + payment history
  payment-form.tsx                           NEW: record payment with image upload
  statement-download.tsx                     NEW: monthly statement button

src/components/customers/
  customer-form-dialog.tsx                   CHANGE: add "สร้างบัญชีพอร์ทัล" button
```

### Thai ERP Checklist
- [x] All amounts in Satang → display as Baht via `satangToBaht()`
- [x] Invoice `paidAmount` already exists — use for outstanding calc (totalAmount - paidAmount)
- [x] Invoice `status` already exists — filter by DRAFT/POSTED/PAID/OVERDUE/CANCELLED
- [x] Period check — N/A (portal doesn't post to GL)
- [x] Debit=credit — N/A (customer payments still go through ERP approval flow)
- [x] Password hashing — bcrypt with salt rounds ≥ 12 (use existing bcrypt setup)
- [x] Slip image upload — use existing `DocumentAttachment` model or new upload API
- [x] PDF generation — reuse existing `pdfkit-generator.ts` or `pdf-generator.ts`

### Key Acceptance Criteria
1. Customer can log in at `/portal/login` with portal credentials
2. Customer sees ONLY their own invoices (data-level isolation)
3. Dashboard shows correct outstanding balance per customer
4. Invoice detail shows line items, PDF download works
5. Customer can record a payment with slip image → creates pending receipt
6. ERP staff can approve/reject recorded payment in main ERP
7. Statement download returns PDF for selected month
8. Session expires 30 min inactivity
9. No customer can see another customer's data

---

## Step 2: /plan
*(Skipped — spec serves as plan)*

---

## Step 3: /build

### Build Order (topological)
1. **Schema** — add CustomerPortalAccount, extend UserRole, link to User
2. **Auth** — portal login route + portal auth helpers
3. **Invoice service** — customer-scoped query functions
4. **Portal API routes** — auth, invoices, payments, statements
5. **Portal pages** — login, dashboard, invoice list, invoice detail, payment form
6. **ERP side** — add "สร้างบัญชีพอร์ทัล" to Customer form
7. **Payment approval** — extend Receipt approval flow to include portal payments

### Build Commands
```bash
bun run db:generate
bun run tsc --noEmit
bun run build
```

---

## Step 4: /test

Manual test script:
```bash
# Setup
1. In ERP, open Customer "บริษัท ABC" → click "สร้างบัญชีพอร์ทัล"
2. Note the temp password shown

# Portal flow
3. Visit http://localhost:3000/portal/login
4. Login with customer email + password
5. Dashboard: verify outstanding balance = sum of unpaid invoices
6. Click invoice INV-001 → verify line items + PDF download
7. Click "บันทึกการชำระเงิน" → fill ฿5,000 transfer → attach slip image → submit
8. Verify: payment appears as PENDING in portal
9. Log out

# ERP approval flow
10. Log in as ADMIN in main ERP
11. Find the pending receipt (from portal payment)
12. Approve it → verify invoice paidAmount updated
13. Customer logs back in → invoice now shows PAID
```

---

## Step 5: /review

- [ ] CustomerPortalAccount schema added to both sqlite + postgres schemas
- [ ] db:generate run after schema change
- [ ] Login route returns valid NextAuth session with CUSTOMER_PORTAL role
- [ ] All portal GET routes filter by session.user.customerId (no data leak)
- [ ] Customer payment creates Receipt with status=PENDING in main ERP
- [ ] Satang amounts displayed as Baht in all portal views
- [ ] PDF generation reuses existing pdfkit-generator (no new dep)
- [ ] Slip image upload works and attaches to receipt
- [ ] Statement PDF covers selected month only for that customer

---

## Step 6: /ship

```bash
git add prisma/schema.prisma
git add prisma/schema-postgres.prisma
git add prisma/schema-sqlite.prisma
git add src/app/api/portal/
git add src/app/portal/
git add src/lib/portal-auth.ts
git add src/lib/portal-invoice-service.ts
git add src/lib/portal-payment-service.ts
git add src/components/portal/
git add src/components/customers/
git commit -m "feat(A15): add customer portal

- CustomerPortalAccount model + CUSTOMER_PORTAL role
- /portal route group: login, dashboard, invoices, payment recording
- Portal invoices filtered by customerId (data-level isolation)
- Customer payment creates pending Receipt in main ERP
- Staff approves/rejects portal payments in ERP
- PDF download + monthly statement via existing pdfkit-generator
- Separate /portal layout from main ERP SPA
"
```
