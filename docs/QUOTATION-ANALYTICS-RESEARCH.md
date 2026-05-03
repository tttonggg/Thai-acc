# Quotation Tracking Analytics - Research & Plan

**Date:** May 2, 2026
**Project:** Thai Accounting ERP
**Researcher:** Claude Code

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Existing Quotation Model

```
Quotation
├── quotationNo      (String, unique)
├── quotationDate   (DateTime)
├── customerId      (FK → Customer)
├── validUntil      (DateTime)
├── subtotal        (Int, Satang)
├── vatRate         (Float)
├── vatAmount       (Int)
├── totalAmount     (Int)
├── discountAmount  (Int)
├── status          (QuotationStatus: DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CONVERTED)
├── notes           (String?)
├── terms           (String?)
├── salesOrderId    (FK → SalesOrder, nullable)
├── createdById     (String?)
├── isActive        (Boolean)
├── lines           (QuotationLine[])

QuotationLine
├── quotationId     (FK → Quotation)
├── productId       (FK → Product, nullable)
├── description      (String)
├── quantity        (Float)
├── unit            (String)
├── unitPrice       (Int)
├── discount        (Int)
├── amount          (Int)
├── vatRate         (Float)
```

**Status Flow:**
```
DRAFT → SENT → APPROVED → CONVERTED
              ↓
           REJECTED
              ↓
           EXPIRED
```

### 1.2 Related Sales Pipeline Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Quotation** | Pre-sales quote | customerId, salesOrderId, status, totalAmount |
| **SalesOrder** | Customer order | customerId, quotationId, status, totalAmount |
| **Invoice** | Tax invoice issued | customerId, salesOrderId, status, totalAmount, paidAmount |
| **Receipt** | Payment received | customerId, invoiceId, amount |
| **CreditNote** | Refund/credit | customerId, invoiceId, amount |

### 1.3 Missing Analytics Fields

**Quotation gaps:**
- ❌ No `salesRepId` (who created/responsible)
- ❌ No `convertedAt` timestamp
- ❌ No `closedReason` (why won/lost)
- ❌ No `sourceChannel` (how quote was sent)
- ❌ No `visitCount` (follow-up tracking)
- ❌ No `lastContactAt` (activity tracking)

**Invoice gaps for conversion analytics:**
- ❌ No `quotationId` link (trace quote → invoice)
- ❌ No `salesRepId` on invoices

---

## 2. SALES PIPELINE ANALYTICS FRAMEWORK

### 2.1 Quote-to-Cash Flow

```
QUOTATION  →  SALES_ORDER  →  INVOICE  →  RECEIPT
   ↓              ↓            ↓           ↓
 DRAFT        PENDING      DRAFT        ALLOCATED
 SENT         CONFIRMED    ISSUED       PARTIAL
 APPROVED     SHIPPED      PAID        FULL
 REJECTED     DELIVERED    OVERDUE     REFUNDED
 EXPIRED      CANCELLED    CANCELLED
 CONVERTED
```

### 2.2 Key Conversion Metrics

| Metric | Formula | Value |
|--------|---------|-------|
| Quote-to-Order Rate | APPROVED / Total Sent × 100 | % |
| Order-to-Invoice Rate | Invoiced / Orders × 100 | % |
| Invoice-to-Payment Rate | Paid / Invoiced × 100 | % |
| Overall Conversion | Paid / Quotes Sent × 100 | % |
| Avg Deal Size | Total Value / Count | ฿X,XXX |
| Sales Cycle Length | Avg days Quote → Invoice | X days |
| Win Rate by Customer | Won / Customer Tier | % |
| Win Rate by Product | Won / Product Category | % |
| Expired Rate | Expired / Total × 100 | % |

### 2.3 Cohort Analysis

Track cohort by month/quarter:
- How many quotes sent?
- How many converted by month 1, 2, 3?
- What % of cohort revenue recognized?

---

## 3. ROLE-BASED ANALYTICS ACCESS

### 3.1 Current RBAC Model (from CLAUDE.md)

```typescript
UserRole: ADMIN | ACCOUNTANT | USER | VIEWER

Permissions check:
- requireRole([roles])     // Route-level
- canEdit()               // ADMIN or ACCOUNTANT only
- isAdmin()              // ADMIN only
- requiredPermission     // Sidebar item level
```

### 3.2 Analytics Access Matrix

| Role | Quote Dashboard | Sales Rep View | Manager View | Admin View |
|------|---------------|----------------|--------------|------------|
| ADMIN | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| ACCOUNTANT | ✅ Full | ✅ Full | ✅ Full | ❌ |
| USER | ✅ Own only | ✅ Own only | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ |

---

## 4. COMPARISON: CURRENT vs TARGET STATE

### 4.1 Document Status Tracking

| Document | Current Statuses | Missing Analytics |
|----------|------------------|-------------------|
| **Quotation** | DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CONVERTED | SalesRep, conversionDate, lostReason |
| **SalesOrder** | ? | SalesRep, sourceQuote |
| **Invoice** | ? | SalesRep, sourceQuote, paymentDays |
| **Receipt** | ? | Allocation details |
| **PurchaseOrder** | ? | VendorRep, expectedDelivery |
| **PurchaseInvoice** | ? | PurchaseRep |

### 4.2 Report Modules (from system)

**Existing reports:**
- Cash Flow Statement
- PP30 Form PDF
- WHT Form PDF
- Bank Statement Import
- Provident Fund
- Leave Management
- Asset Revaluation
- Recurring Documents
- SSO Filing

**Missing analytics reports:**
- Sales Pipeline Dashboard
- Quote Conversion Funnel
- Sales Rep Performance
- Product Win Rate
- Customer Cohort Analysis

---

## 5. IMPLEMENTATION RECOMMENDATION

### 5.1 Phase 1: Quotation Analytics (2-3 weeks)

**Database changes:**
```prisma
model Quotation {
  // Add these fields
  salesRepId       String?   // FK → User (sales representative)
  sourceChannel    String?  // WEB, PHONE, WALK_IN, REFERRAL, OTHER
  convertedAt      DateTime? // When converted to SalesOrder
  closedAt         DateTime? // When APPROVED/REJECTED/EXPIRED
  closedReason     String?  // Price, Competition, Timing, Budget, Other
  visitCount       Int       @default(0) // Follow-up count
  lastContactAt    DateTime? // Last follow-up date
  lastContactById  String?  // User who did last follow-up
}

model Invoice {
  // Add for quote→invoice tracking
  quotationId      String?  // FK → Quotation (source quote)
  salesRepId       String?  // FK → User
}

model User {
  // Add for sales team role
  department       String?  // Sales, Accounting, Admin
  team             String?  // Team A, Team B
}
```

**New API endpoints:**
- `GET /api/analytics/sales-pipeline` - Funnel metrics
- `GET /api/analytics/quote-conversion` - Conversion rates
- `GET /api/analytics/sales-rep-performance` - Per rep metrics
- `GET /api/analytics/product-win-rate` - Per product
- `GET /api/analytics/customer-cohort` - Customer analysis

**New UI components:**
- Sales Dashboard (new module under REPORTS)
- Quote Analytics page
- Sales Rep Leaderboard
- Conversion Funnel chart

### 5.2 Phase 2: Multi-User Company Management (1-2 weeks)

**Company Setup Onboarding:**
1. Check if Company model has `onboardingComplete` flag
2. If not, add onboarding wizard:
   - Step 1: Company details (name, tax ID, address, logo)
   - Step 2: Add branch/department
   - Step 3: Invite team members
   - Step 4: Import existing data OR start fresh

**User Management UI Improvements:**
- User list with role badges
- Invite user by email
- Assign department/team
- Password reset flow
- Active/inactive toggle

### 5.3 Priority Ranking

| Priority | Feature | Effort | Value | Impact |
|----------|---------|--------|-------|--------|
| 1 | Quotation Sales Rep & Source | Low | High | Core analytics |
| 2 | Quote Conversion Dashboard | Medium | High | Main ask |
| 3 | Sales Rep Performance | Medium | High | Management |
| 4 | Company Onboarding Check | Low | Medium | UX |
| 5 | Multi-User UI Polish | Low | Medium | Team |

---

## 6. TECHNICAL NOTES

### 6.1 Prisma Schema Considerations

**Quotation → SalesOrder → Invoice chain:**
- Currently: Quotation has `salesOrderId` (nullable FK)
- Currently: Invoice has `salesOrderId` (nullable FK)
- Missing: Invoice should link back to Quotation for conversion tracking

**Analytics queries needed:**
```sql
-- Quote conversion rate by period
SELECT
  DATE_TRUNC('month', quotationDate) as month,
  COUNT(*) as total_quotes,
  SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as won,
  SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
  AVG(totalAmount) as avg_value
FROM Quotation
WHERE status IN ('SENT', 'APPROVED', 'CONVERTED')
GROUP BY DATE_TRUNC('month', quotationDate)
```

### 6.2 Frontend Component Locations

**Existing quotation components:**
- `src/components/quotations/quotation-form.tsx` (996 lines)
- `src/components/quotations/quotation-list.tsx` (945 lines)
- `src/components/quotations/quotation-view-dialog.tsx` (1139 lines)

**New components needed:**
- `src/components/analytics/sales-dashboard.tsx`
- `src/components/analytics/quote-conversion-funnel.tsx`
- `src/components/analytics/sales-rep-leaderboard.tsx`
- `src/components/analytics/product-performance.tsx`

---

## 7. SUMMARY

### Is it worth doing? ✅ YES

**Reasons:**
1. Competitive feature - SME owners want to track sales performance
2. Low-moderate effort with high business value
3. Infrastructure already exists (Quotation model, status enums)
4. Aligns with Thai market needs (sales tracking important for SME)
5. Enables data-driven decisions

**Key gaps to fill:**
1. Add `salesRepId` to track who created quote
2. Add `quotationId` to Invoice for conversion tracking
3. Build analytics dashboard with funnel visualization
4. Implement role-based access for sales reports

**Estimated timeline:** 3-5 weeks for Phase 1 (Quotation Analytics)

---

## 8. QUESTIONS FOR USER

1. Should Sales Rep be mandatory when creating quotation?
2. Do you want to track "lost reason" on rejected quotes?
3. Should the analytics dashboard be a new sidebar menu item?
4. Is there a specific chart type preferred? (funnel, bar, line, pie)

---

*Document generated by Claude Code research agent*
*See also: docs/DOCKER-DEPLOY-SUMMARY.md for deployment info*