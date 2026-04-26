<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src/app/api

## Purpose

Next.js API route handlers (64 route directories, 173+ endpoints) for the Thai Accounting ERP system.

## Parent Reference
<!-- Parent: ../../AGENTS.md -->

## Route Organization

### Core Accounting
- `accounts/` — Chart of accounts
- `journal/` — Journal entries
- `invoices/` — Invoice management
- `receipts/` — Receipt management

### Financial
- `wht/` — Withholding tax
- `budgets/` — Budget management
- `accounting-periods/` — Period management
- `exchange-rates/` — Currency exchange

### Trade & Inventory
- `inventory/` — Stock management
- `products/` — Product catalog
- `warehouses/` — Warehouse management
- `stock-takes/` — Stock take
- `stock-movements/` — Stock tracking

### Purchasing
- `purchase-requests/` — PR management
- `purchase-orders/` — PO management
- `purchases/` — Purchase invoices
- `goods-receipt-notes/` — GRN
- `vendors/` — Vendor management

### Receivables & Payables
- `customers/` — Customer management
- `payments/` — Payment processing
- `credit-notes/` — Credit notes
- `debit-notes/` — Debit notes
- `cheques/` — Cheque management

### Assets & Payroll
- `assets/` — Fixed assets
- `payroll/` — Payroll processing
- `employees/` — Employee management
- `petty-cash/` — Petty cash

### Reports & Analytics
- `reports/` — Financial reports (trial-balance, income-statement, general-ledger, vat, wht)
- `analytics/` — Business analytics
- `dashboard/` — Dashboard data

### System
- `users/` — User management
- `settings/` — System settings
- `company/` — Company config
- `entities/` — Entity management
- `upload/` — File upload
- `notifications/` — Notifications

### Utilities
- `currencies/` — Currency management
- `health/` — Health checks
- `versions/` — Version info
- `sessions/` — Session management
- `metrics/` — Application metrics
- `docs/` — Documentation APIs

### Advanced
- `webhooks/` — Webhook handlers
- `inter-company/` — Inter-company transactions
- `tax-forms/` — Tax form generation
- `bank-accounts/` — Bank account management

## For AI Agents

### Route Pattern
```typescript
// Standard REST endpoint
export async function GET(request: NextRequest) { /* list */ }
export async function POST(request: NextRequest) { /* create */ }
// [id]/route.ts
export async function GET(request, { params }) { /* get one */ }
export async function PUT(request, { params }) { /* update */ }
export async function DELETE(request, { params }) { /* delete */ }
```

### Response Format
```typescript
return apiResponse(data)  // Success
throw new Error("msg")   // Error (handled by apiErrorHandler)
```

### Auth Requirements
- Use `requireAuth()` for protected routes
- Use `validateCsrfToken()` for POST/PUT/PATCH/DELETE
- Check `canEdit()` or `isAdmin()` for permissions

### Monetary Values
All amounts in Satang (integer). Use `bahtToSatang()` on input, `satangToBaht()` on output.

### Validation
All inputs MUST use Zod schemas from `@/lib/validations.ts`

## Parent References
- Parent: [src/app/AGENTS.md](../app/AGENTS.md)