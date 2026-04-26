# Thai Accounting ERP - Improvement Roadmap
## Target: Match or Exceed PEAK Competitor Level
## Version: 1.0 | Date: 2026-04-21

---

## Executive Summary

จากการวิเคราะห์ codebase ทั้งหมดพบ **critical issues ที่ต้องแก้ไขก่อน** เพื่อความเสถียรของข้อมูลทางการเงิน และ **feature gaps** เทียบกับ PEAK competitor

### Critical Issues Found
| Category | Count | Risk Level |
|----------|-------|------------|
| Missing prisma.$transaction (DATA CORRUPTION) | 18 routes | 🔴 CRITICAL |
| journal/[id]/post - NO AUTHENTICATION | 1 route | 🔴 CRITICAL |
| Hardcoded account IDs in GL posting | 2 routes | 🔴 CRITICAL |
| Missing revenue GL on invoice issue | 1 finding | 🔴 CRITICAL |
| Hard deletes on master data | 6 entities | 🟡 HIGH |
| Race condition in document numbering | 3 modules | 🟡 HIGH |
| Missing postedById audit trail | Multiple | 🟡 HIGH |
| Missing .env.example | 1 file | 🟡 HIGH |

---

## Part 1: CRITICAL Security & Data Integrity Fixes

### 1.1 Add Authentication to journal/[id]/post (CRITICAL)
**File:** `src/app/api/journal/[id]/post/route.ts`
**Issue:** POST endpoint has NO authentication - anyone can post journal entries to GL

```typescript
// CURRENT (LINE 6) - NO AUTH
export async function POST(req: Request) {

// FIX REQUIRED
export async function POST(req: Request) {
  const session = await requireRole(['ADMIN', 'ACCOUNTANT'])
  if (!session) return apiError('ไม่ได้รับอนุญาต', 401)
```

### 1.2 Wrap 18 Routes in prisma.$transaction
**Issue:** Multi-table financial writes without transaction = DATA CORRUPTION risk

| Route | Issue | Fix Priority |
|-------|-------|--------------|
| `invoices/route.ts` POST | Create + logCreate separate | P1 |
| `receipts/route.ts` POST | Receipt + allocations separate | P1 |
| `receipts/[id]/route.ts` PUT | Delete + update separate | P1 |
| `payments/route.ts` POST | Payment + cheque + GL posting separate | P1 |
| `payments/[id]/route.ts` PUT | Delete + create + update separate | P1 |
| `journal/route.ts` POST | DeleteAll + create separate | P1 |
| `journal/[id]/route.ts` PUT | DeleteAll + create separate | P1 |
| `journal/[id]/post/route.ts` | Status update outside tx | P1 |
| `purchases/route.ts` POST | Invoice + VAT + stock separate | P1 |
| `purchases/[id]/route.ts` PUT | Delete + update separate | P2 |
| `purchases/[id]/route.ts` DELETE | VAT delete + invoice delete | P2 |
| `credit-notes/[id]/route.ts` PUT | Status update only | P3 |
| `debit-notes/[id]/route.ts` PUT | Status update only | P3 |
| `receipts/[id]/route.ts` DELETE | Simple delete | P3 |
| `payments/[id]/route.ts` DELETE | Simple delete | P3 |
| `journal/[id]/route.ts` DELETE | Simple delete | P3 |
| `credit-notes/[id]/route.ts` DELETE | Simple delete | P3 |
| `debit-notes/[id]/route.ts` DELETE | Simple delete | P3 |

**Fix Pattern:**
```typescript
export async function POST(req: Request) {
  return await db.$transaction(async (tx) => {
    // ALL database operations inside
    const invoice = await tx.invoice.create({ ... })
    await logCreate(tx, { ... })
    return apiResponse(invoice)
  })
}
```

### 1.3 Fix Hardcoded Account IDs in Credit/Debit Notes
**Files:** `src/app/api/credit-notes/route.ts`, `src/app/api/debit-notes/route.ts`
**Issue:** GL posting uses hardcoded account IDs like '4201', '2104', '1101'

**Fix Pattern:**
```typescript
// Replace hardcoded:
accountId: '4201', // Sales Returns

// With dynamic lookup:
const salesReturnAccount = await tx.chartOfAccount.findFirst({ 
  where: { code: '4201' } 
})
if (!salesReturnAccount) throw new Error('Sales return account not found')
accountId: salesReturnAccount.id
```

---

## Part 2: Accounting Logic Fixes

### 2.1 Invoice Issue - Missing Revenue GL Entry (CRITICAL)
**File:** `src/app/api/invoices/[id]/issue/route.ts`
**Finding:** Creates COGS entry but NOT the AR/Revenue/VAT entry

**Current Behavior:**
```
Debit: COGS
Credit: Inventory
```

**Expected Behavior:**
```
Debit: Accounts Receivable (AR total)
Credit: Sales Revenue (subtotal)
Credit: VAT Output (VAT amount)
Credit: WHT Payable (if applicable)
```

### 2.2 Fix Document Number Race Condition
**Files:** `invoices/route.ts`, `receipts/route.ts`, `journal/route.ts`
**Issue:** `findFirst` + `create` is NOT atomic - race condition between requests

**Fix Pattern:** Use `generateDocNumber` from api-utils.ts (already exists but not used by these modules)
```typescript
// Instead of:
const lastInvoice = await prisma.invoice.findFirst({ ... })
const nextNum = parseInt(lastInvoice.invoiceNo.split('-')[2]) + 1

// Use:
const invoiceNo = await generateDocNumber('INVOICE', prefix, tx)
```

### 2.3 Add postedById Audit Trail
**Issue:** Journal posting sets `postedAt` but NOT `postedById`

**Fix Locations:**
- `journal/[id]/post/route.ts` - Add `postedById: session.user.id`
- `invoices/[id]/issue/route.ts` - Add `issuedById`
- `receipts/[id]/post/route.ts` - Add `postedById`
- All journal entry creations - Add `createdById`

### 2.4 Fix Stock Take Journal Entry Calculation
**File:** `src/lib/stock-take-service.ts` lines 387-388
**Issue:** `totalDebit: totalLoss + totalGain` and same for credit is incorrect

**Correct Logic:**
```
Loss: Debit Expense, Credit Inventory
Gain: Debit Inventory, Credit Income
```

---

## Part 3: Missing Features (Competitor Parity)

### 3.1 Dashboard Improvements (PEAK Pages 2-4, 31-35)
**Current:** Basic summary
**PEAK Has:**
- Top 3 revenue items by category
- Top 3 expenses
- AR aging (overdue + next 3 months)
- AP aging (overdue + next 3 months)
- Cash/bank balance with account selection
- Financial calendar for planning
- PEAK Board - multi-dimensional P&L analysis

**Implementation:**
```typescript
// src/components/dashboard/DashboardOverview.tsx
interface DashboardKPIs {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  arAging: { overdue: number; next3Months: number }
  apAging: { overdue: number; next3Months: number }
  topRevenueItems: Array<{ name: string; amount: number }>
  topExpenses: Array<{ name: string; amount: number }>
}
```

### 3.2 Recurring Documents (PEAK Pages 4-6)
**Missing:** Auto-generate recurring invoices/receipts monthly
**Implementation:**
```typescript
// New model: RecurringSchedule
model RecurringSchedule {
  id            String   @id @default(cuid())
  type          DocumentType  // INVOICE, RECEIPT, PAYMENT
  frequency     Frequency     // DAILY, WEEKLY, MONTHLY, YEARLY
  nextRunDate   DateTime
  templateId    String       // Reference to document template
  autoApprove   Boolean
  createdAt     DateTime  @default(now())
}
```

### 3.3 Quotation/Proposal Flow (PEAK Pages 3-6)
**Current:** Not implemented
**PEAK Has:** Quote → Accept → Convert to Invoice

**Implementation:**
```typescript
// New models
model Quotation {
  id            String   @id @default(cuid())
  quotationNo   String   @unique
  customerId    String
  status        QuotationStatus // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED
  validUntil    DateTime
  lines         QuotationLine[]
  convertedToId String?  // Link to invoice if converted
}

// API routes
// POST   /api/quotations          - Create quotation
// GET    /api/quotations          - List quotations
// PUT    /api/quotations/[id]     - Update quotation
// POST   /api/quotations/[id]/accept   - Accept → create invoice
// POST   /api/quotations/[id]/reject   - Reject quotation
```

### 3.4 Bill of Materials / Product Kits
**PEAK Feature:** Kit products (sell bundle, track component inventory)
**Implementation:**
```typescript
model ProductKit {
  id          String   @id @default(cuid())
  productId   String   // The kit product
  components  KitComponent[]
}

model KitComponent {
  id          String   @id @default(cuid())
  kitId       String
  productId   String
  quantity    Int
}
```

### 3.5 Multi-Branch/Multi-Company Support
**PEAK Has:** Separate books per company
**Implementation:**
```typescript
model Company {
  id          String   @id @default(cuid())
  name        String
  taxId       String
  address     String
  branches    Branch[]
  documents   Document[] // All documents tagged to company
}

model Branch {
  id          String   @id @default(cuid())
  companyId   String
  code        String
  name        String
}
```

### 3.6 e-Tax Invoice Integration (PEAK Pages 27-28)
**Missing:** Integration with IRD for e-Tax
**Implementation:**
```typescript
// New service: src/lib/e-tax-service.ts
interface ETaxConfig {
  username: string
  password: string
  branchCode: string
  taxpayerId: string
}

// API routes
// POST /api/e-tax/authorize     - Get OAuth token
// POST /api/e-tax/invoice       - Submit invoice to IRD
// POST /api/e-tax/invoice/:id/cancel  - Cancel submitted invoice
// GET  /api/e-tax/status/:id    - Check submission status
```

### 3.7 Bank QR Payment Integration (PEAK Pages 27)
**PEAK Has:** SCB QR Payment integration
**Implementation:**
```typescript
// New service: src/lib/qr-payment-service.ts
interface QRPaymentConfig {
  provider: 'scb' | 'kbank' | 'bbl'
  merchantId: string
  apiKey: string
}

// API routes
// POST /api/qr-payment/generate  - Generate QR code for invoice
// POST /api/qr-payment/webhook   - Receive payment confirmation
// GET  /api/qr-payment/:id/status - Check payment status
```

### 3.8 PND1/3/53 Filing (PEAK Pages 31, 37)
**Current:** Basic WHT calculation
**PEAK Has:** Full PND1 (salary), PND3 (contractor), PND53 (professional) forms

**Implementation:**
```typescript
// Enhanced wht-service.ts
interface PNDConfig {
  type: 'PND1' | 'PND3' | 'PND53'
  periodMonth: number
  periodYear: number
  submissionType: 'NORMAL' | 'ADDITIONAL'
}

// API routes
// GET /api/wht/pnd1         - Generate PND1 XML/file
// GET /api/wht/pnd3         - Generate PND3 XML/file
// GET /api/wht/pnd53        - Generate PND53 XML/file
// POST /api/wht/:id/pay     - Record tax payment to revenue department
```

### 3.9 DBD XBRL Export (PEAK Page 23)
**Current:** Basic financial reports
**PEAK Has:** XBRL format for DBD e-Filing

**Implementation:**
```typescript
// New service: src/lib/xbrl-generator.ts
interface FinancialStatements {
  companyName: string
  taxId: string
  periodStart: Date
  periodEnd: Date
  currency: 'THB'
  balanceSheet: XBRLBalanceSheet
  incomeStatement: XBRLIncomeStatement
}

// API routes
// POST /api/reports/xbrl     - Generate XBRL file for DBD submission
```

### 3.10 Scheduled Reports via Email (PEAK Page 25)
**PEAK Has:** Auto-send reports daily/weekly/monthly via email
**Implementation:**
```typescript
model ScheduledReport {
  id            String   @id @default(cuid())
  reportType    ReportType
  frequency     Frequency
  recipients    String[] // Email addresses
  lastRunAt     DateTime?
  nextRunAt     DateTime
  isActive      Boolean  @default(true)
}

// API routes
// POST /api/reports/schedule        - Create schedule
// GET  /api/reports/scheduled        - List schedules
// PUT  /api/reports/scheduled/[id]   - Update schedule
// DELETE /api/reports/scheduled/[id] - Delete schedule
```

### 3.11 Document Approval Workflow (PEAK Pages 22-24)
**PEAK Has:** Draft → Pending Review → Approved/Rejected workflow
**Implementation:**
```typescript
model DocumentApproval {
  id            String   @id @default(cuid())
  documentType  DocumentType
  documentId    String
  status        ApprovalStatus // PENDING, APPROVED, REJECTED
  approverId    String?
  approvedAt    DateTime?
  remarks       String?
}

enum ApprovalStatus {
  PENDING_REVIEW  // "สถานะรอตรวจสอบ"
  DRAFT           // "สถานะร่าง"
  NEEDS_ATTENTION // "สถานะควรตรวจสอบ" - PEAK AI detected anomaly
  APPROVED
  REJECTED
}
```

### 3.12 PEAK AI Anomaly Detection (PEAK Page 24)
**PEAK Has:** AI flags unusual journal entries
**Implementation:**
```typescript
// New service: src/lib/anomaly-detection-service.ts
interface AnomalyRule {
  type: 'DUPLICATE_ENTRY' | 'UNUSUAL_AMOUNT' | 'MISMATCHED_ACCOUNT' | 'SUSPICIOUS_PATTERN'
  threshold?: number
  enabled: boolean
}

// API routes
// POST /api/ai/detect-anomalies    - Run anomaly detection on journal
// GET  /api/ai/anomaly-rules       - List detection rules
// PUT  /api/ai/anomaly-rules/[id]  - Update rule settings
```

---

## Part 4: Data Quality Improvements

### 4.1 Add Soft Delete to Master Data
**Issue:** Hard deletes on customers, vendors, products, warehouses, departments

**Fix:** Add `deletedAt DateTime?` and update all queries:
```typescript
// Before
await prisma.customer.findMany()

// After
await prisma.customer.findMany({
  where: { deletedAt: null }
})

// Soft delete API
await prisma.customer.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

### 4.2 Add Idempotency Keys
**Issue:** No duplicate prevention on document creation

**Implementation:**
```typescript
// New model
model IdempotencyKey {
  key         String   @id
  response    Json
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}

// API middleware
async function checkIdempotency(key: string, handler: Function) {
  const existing = await prisma.idempotencyKey.findUnique({ where: { key } })
  if (existing) return existing.response
  
  const response = await handler()
  await prisma.idempotencyKey.create({
    data: { key, response, expiresAt: addHours(new Date(), 24) }
  })
  return response
}
```

### 4.3 Add Period Locking Check to Missing Routes
**Issue:** invoices, receipts, journal, purchases POST lack period locking

**Add to:**
- `invoices/route.ts` POST
- `receipts/route.ts` POST
- `journal/route.ts` POST
- `purchases/route.ts` POST

---

## Part 5: Technical Debt Fixes

### 5.1 Create .env.example
**Issue:** Missing environment variable documentation

**Create:**
```bash
# Database
DATABASE_URL=file:./prisma/dev.db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters

# Optional Services
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.example.com
SMTP_PORT=587

# External APIs
SCB_API_KEY=
SCB_API_SECRET=
ETAX_USERNAME=
ETAX_PASSWORD=

# Feature Flags
ENABLE_AI_DETECTION=false
ENABLE_RECURRING_DOCUMENTS=false
```

### 5.2 Remove console.log from Production Code
**Files:** `src/app/api/purchases/route.ts` lines 99, 142

### 5.3 Standardize API Response Helpers
**Issue:** Some routes define local `apiResponse()` instead of importing

**Fix:** Enforce import from `@/lib/api-utils`:
```typescript
import { apiResponse, apiError } from '@/lib/api-utils'
```

### 5.4 Extract Magic Numbers to Constants
**Files to fix:**
- `src/app/api/admin/analytics/route.ts` - threshold 1000
- `src/app/api/invoices/[id]/void/route.ts` - timeout 5000/10000
- `src/app/api/graphql/route.ts` - MAX_QUERY_COMPLEXITY

### 5.5 Fix API Structure Duplication
**Issue:** Both `journal/` and `journal-entries/` exist, `v1/` and `v2/`

**Action:** Consolidate or deprecate duplicates

---

## Part 6: CI/CD Pipeline Improvements

### 6.1 Current Pipeline (13 workflows)
- ✅ backup.yml
- ✅ ci-cd.yml
- ✅ e2e-tests.yml
- ✅ security-scan.yml
- ✅ nightly.yml
- ✅ release.yml

### 6.2 Missing Pipeline Jobs
```yaml
# .github/workflows/transaction-audit.yml
name: Transaction Audit
on:
  pull_request:
    paths:
      - 'src/app/api/**/route.ts'
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Check for prisma.$transaction in financial routes
        run: |
          # Fail if POST/PUT financial routes lack $transaction
          grep -L 'prisma.\$transaction' src/app/api/invoices/route.ts && exit 1

# .github/workflows/security-audit.yml
name: Security Audit
on: [push, pull_request]
jobs:
  auth-check:
    runs-on: ubuntu-latest
    steps:
      - name: Ensure journal post route has auth
        run: |
          grep -q 'requireRole\|requireAuth' src/app/api/journal/\[id\]/post/route.ts || exit 1
```

---

## Part 7: Implementation Priority & Timeline

### Phase 1: Critical Security & Data Integrity (Week 1-2)
| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Add auth to journal/[id]/post | P0 | 1 |
| Wrap 18 routes in $transaction | P0 | 16 |
| Fix hardcoded account IDs | P0 | 4 |
| Fix invoice issue missing revenue GL | P0 | 8 |
| Add period locking to missing routes | P1 | 4 |
| **Subtotal** | | **33 hours** |

### Phase 2: Accounting Logic Fixes (Week 2-3)
| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Fix document number race condition | P1 | 8 |
| Add postedById audit trail | P1 | 6 |
| Fix stock take journal calculation | P2 | 4 |
| Add soft delete to master data | P2 | 12 |
| Add idempotency keys | P2 | 8 |
| **Subtotal** | | **38 hours** |

### Phase 3: Competitor Features (Week 4-8)
| Feature | Priority | Estimated Hours |
|---------|----------|-----------------|
| Dashboard improvements | P1 | 16 |
| Quotation flow | P1 | 24 |
| Recurring documents | P2 | 16 |
| Document approval workflow | P2 | 20 |
| Scheduled reports | P3 | 12 |
| PND1/3/53 forms | P2 | 24 |
| DBD XBRL export | P3 | 16 |
| e-Tax integration | P3 | 32 |
| Bank QR payment | P3 | 24 |
| PEAK AI anomaly detection | P4 | 40 |
| Multi-company support | P4 | 48 |
| **Subtotal** | | **272 hours** |

### Phase 4: Technical Debt (Week 8-10)
| Task | Priority | Estimated Hours |
|------|----------|-----------------|
| Create .env.example | P1 | 1 |
| Remove console.log | P2 | 2 |
| Standardize API helpers | P2 | 8 |
| Extract magic numbers | P3 | 4 |
| Fix API structure duplication | P3 | 8 |
| Add CI/CD audit jobs | P2 | 8 |
| **Subtotal** | | **31 hours** |

---

## Total Estimated Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 2 weeks | Critical Security & Data Integrity |
| Phase 2 | 2 weeks | Accounting Logic Fixes |
| Phase 3 | 5 weeks | Competitor Features |
| Phase 4 | 2 weeks | Technical Debt |
| **Total** | **~11 weeks** | Full parity with PEAK |

---

## Appendix: PEAK Competitor Feature Matrix

| Category | PEAK Feature | Current Status | Gap |
|----------|-------------|----------------|-----|
| **Dashboard** | Multi-KPI, top items, AR/AP aging, calendar | Basic | HIGH |
| **Sales** | Quote → Invoice → Receipt → Credit Note | Invoice → Receipt only | HIGH |
| **Purchases** | PO → GRN → Bill → Payment → Debit Note | Basic purchase invoice | MED |
| **Tax** | VAT 7%, WHT PND1/3/53, e-Tax, PND filing | Basic VAT + WHT | HIGH |
| **Banking** | Cheques, QR payments, reconciliation | Basic cheque tracking | MED |
| **Inventory** | FIFO/WAC, stock adjustments, BOM | FIFO only | MED |
| **Assets** | Depreciation, disposal, tracking | Basic depreciation | MED |
| **Payroll** | SSC, salary, bank file, 50 Tawi | Basic SSC | MED |
| **Reports** | Trial balance, P&L, BS, XBRL, scheduled | Basic reports | HIGH |
| **Integrations** | e-Tax, SCB QR, Shopee, Lazada | None | CRITICAL |
| **AI** | Anomaly detection | None | CRITICAL |
| **Workflow** | Approval, PENDING_REVIEW, AI flagging | None | HIGH |

---

## Files Modified This Analysis

- `src/app/api/journal/[id]/post/route.ts` - NO AUTH (CRITICAL)
- `src/app/api/invoices/route.ts` - Missing transaction
- `src/app/api/receipts/route.ts` - Missing transaction
- `src/app/api/payments/route.ts` - Missing transaction
- `src/app/api/journal/route.ts` - Missing transaction
- `src/app/api/purchases/route.ts` - Missing transaction
- `src/app/api/credit-notes/route.ts` - Hardcoded account IDs
- `src/app/api/debit-notes/route.ts` - Hardcoded account IDs
- `src/app/api/invoices/[id]/issue/route.ts` - Missing revenue GL
- `src/app/api/customers/[id]/route.ts` - Hard delete
- `src/app/api/vendors/[id]/route.ts` - Hard delete
- `src/app/api/products/[id]/route.ts` - Hard delete
- `src/app/api/warehouses/[id]/route.ts` - Hard delete
- `src/app/api/departments/[id]/route.ts` - Hard delete
- `src/app/api/purchase-requests/[id]/route.ts` - Hard delete
- `src/lib/stock-take-service.ts` - Incorrect journal calculation

---

**Report Generated:** 2026-04-21
**Analyst:** Control Tower Agent
**Codebase:** Thai Accounting ERP (github.com/tttonggg/Thai-acc)
**Sandbox Clone:** /Users/tong/Desktop/Thai-acc-sandbox
