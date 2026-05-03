# QUOTATION TRACKING ANALYTICS - COMPREHENSIVE MASTER PLAN

**Date:** May 2, 2026
**Project:** Thai Accounting ERP
**Status:** Research for Development Team
**Priority:** HIGH - Core Business Feature

---

## EXECUTIVE SUMMARY

### What This Is
A comprehensive plan to add **Sales Pipeline Analytics** tracking from Quotation through to Payment, enabling SME owners to understand: which products sell, which customers buy, and how fast deals close.

### Why Now
- Current system has no sales performance visibility
- Competitors lack this feature (competitive advantage)
- Thai SME owners need to track sales team effectiveness
- Low-moderate effort with high business ROI

### Key Numbers
| Metric | Current | Target |
|--------|---------|--------|
| Quote-to-Order visibility | ❌ None | ✅ Full funnel |
| Sales rep tracking | ❌ None | ✅ Per rep |
| Product win rate | ❌ None | ✅ By product |
| Conversion timeline | ❌ None | ✅ Days tracking |

---

## PART 1: CURRENT STATE ANALYSIS

### 1.1 Existing Database Schema

#### 1.1.1 Document Flow (Quote → Cash)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ QUOTATION   │────▶│ SALES_ORDER │────▶│  INVOICE   │────▶│  RECEIPT    │────▶│ PAID        │
│             │     │             │     │             │     │             │     │             │
│ status:     │     │ status:     │     │ status:     │     │             │     │             │
│ DRAFT       │     │ DRAFT       │     │ DRAFT       │     │             │     │             │
│ SENT        │     │ PENDING     │     │ ISSUED      │     │             │     │             │
│ APPROVED    │     │ APPROVED    │     │ PARTIAL     │     │             │     │             │
│ REJECTED    │     │ CONFIRMED   │     │ PAID        │     │             │     │             │
│ EXPIRED     │     │ PROCESSING  │     │ CANCELLED   │     │             │     │             │
│ CONVERTED   │     │ SHIPPED     │     │             │     │             │     │             │
│             │     │ DELIVERED   │     │             │     │             │     │             │
│             │     │ CANCELLED   │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### 1.1.2 Current Schema Fields

**Quotation:**
```prisma
id, quotationNo, quotationDate, customerId, validUntil
subtotal, vatRate, vatAmount, totalAmount, discountAmount
status (DRAFT|SENT|APPROVED|REJECTED|EXPIRED|CONVERTED)
notes, terms, salesOrderId, createdById, isActive
deletedAt, deletedBy, createdAt, updatedAt
lines (QuotationLine[])
```

**SalesOrder:**
```prisma
id, orderNo, orderDate, expectedDate, customerId
customerContact, customerEmail, customerPhone, shippingAddress
shippingTerms, paymentTerms
subtotal, vatRate, vatAmount, totalAmount, discountAmount
status, quotationId (nullable), createdById, isActive
```

**Invoice:**
```prisma
id, invoiceNo, invoiceDate, dueDate, customerId
salesOrderId (nullable, unique), type, reference, poNumber
subtotal, vatRate, vatAmount, totalAmount, discountAmount, discountPercent
withholdingRate, withholdingAmount, netAmount, paidAmount
status (DRAFT|ISSUED|PARTIAL|PAID|CANCELLED)
notes, internalNotes, terms, sourceChannel
createdById, isActive
```

**User:**
```prisma
id, email, password, name
role (ADMIN|ACCOUNTANT|USER|VIEWER)
isActive, lastLoginAt, mfaEnabled
maxSessions (default 3)
```

### 1.2 Current RBAC Implementation

```typescript
// From src/lib/auth.ts
UserRole: ADMIN | ACCOUNTANT | USER | VIEWER

// From keerati-sidebar.tsx
requiredPermission: { module: 'admin', action: 'manage' }

// Helpers from api-utils.ts
requireRole([roles])     // Route-level protection
canEdit()               // ADMIN or ACCOUNTANT
isAdmin()              // ADMIN only
```

### 1.3 Existing Analytics API

**Endpoint:** `/api/analytics/route.ts`
- Authentication required (ADMIN, ACCOUNTANT only)
- Views: dashboard, realtime, ratelimits
- Date range filtering

**Note:** Currently tracks API usage metrics, NOT sales pipeline metrics.

---

## PART 2: USER EMPATHY & BUSINESS VALUE

### 2.1 User Personas

#### Persona A: คุณสมชาย - Sales Manager ( SME Owner )
- **Profile:** Runs a ฿50M/year trading company, 5 sales staff
- **Pain:** "I don't know which product sells, who closes deals, or why quotes die"
- **Wants:** "Show me this month: quotes sent, conversion rate, revenue"
- **Value:** Know which sales rep to bonus, which product to push

#### Persona B: คุณวิภา - Accountant + Admin
- **Profile:** Handles billing, collections, reporting
- **Pain:** "Can't track which invoices came from which quotes"
- **Wants:** "Link every payment back to original quote for audit"
- **Value:** Faster dispute resolution, complete audit trail

#### Persona C: คุณธนา - Sales Representative
- **Profile:** 3 years experience, wants to track own performance
- **Pain:** "My quotes disappear after sending"
- **Wants:** "See which quotes turned to orders, follow up reminders"
- **Value:** Better commission tracking,知道自己 performance

### 2.2 Real World Use Cases

| Use Case | Current State | Desired State |
|----------|--------------|---------------|
| Monthly sales review | Guess from receipts | Funnel dashboard: 50 quotes → 30 orders → 25 invoices → 22 paid |
| Sales rep evaluation | Subjective | Objective: สมชาย 70% conversion, วิภา 45% |
| Product analysis | "I think LED sells" | LED 80% win rate vs Bulb 40% |
| Pipeline forecasting | Intuition | Based on conversion rates, predict ฿2M next month |
| Follow-up reminders | Post-it notes | System shows "5 quotes from last week need follow-up" |

### 2.3 Thai Market Specifics

- **Tax compliance:** All quotes/invoices must match Thai tax requirements
- **Thai baht:** All amounts in Satang (1/100 ฿)
- **VAT tracking:** 7% standard, need to trackInput vs output VAT
- **WHT (Withholding Tax):** 3% for services, 1% for goods
- **Fiscal year:** January-December (most SME)

---

## PART 3: TECHNICAL ANALYSIS

### 3.1 Missing Data Model Fields

#### Phase 1 - Critical Fields

```prisma
// QUOTATION - Add these fields
salesRepId       String?   // FK → User (who created/responsible)
sourceChannel    String?  // WEB, PHONE, WALK_IN, REFERRAL, EMAIL, LINE
convertedAt      DateTime? // When status became CONVERTED
closedAt         DateTime? // When status became APPROVED/REJECTED/EXPIRED
closedReason     String?  // Price, Competition, Timing, Budget, NoResponse, Other
visitCount       Int      @default(0)  // Follow-up interaction count
lastContactAt    DateTime? // Last follow-up date
lastContactById  String?  // User who did last follow-up

// SALESORDER - Add this field
quotationId       String?  // FK → Quotation (source quote - already exists, verify)

// INVOICE - Add these fields
quotationId       String?  // FK → Quotation (source quote)
salesRepId        String?  // FK → User (who created invoice)

// USER - Add these fields
department        String?  // Sales, Accounting, Admin, etc.
team              String?  // Team A, Team B, etc.
```

#### Phase 2 - Enhancement Fields

```prisma
// QUOTATION
lostToCompetitor  String?  // If REJECTED, who was chosen
expectedValue     Int?     // Estimated chance (0-100%)
priority          String?  // HIGH, MEDIUM, LOW

// CUSTOMER
customerTier      String?  // A, B, C (for segmentation)
customerSegment   String?  // Retail, Corporate, Government
```

### 3.2 API Endpoints Required

#### New Analytics Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/sales-funnel` | GET | Pipeline stage counts |
| `/api/analytics/quote-conversion` | GET | Conversion rates by period |
| `/api/analytics/sales-rep-performance` | GET | Per rep metrics |
| `/api/analytics/product-performance` | GET | Win rate by product |
| `/api/analytics/customer-cohort` | GET | Customer analysis |
| `/api/analytics/conversion-timeline` | GET | Avg days between stages |
| `/api/analytics/pipeline-forecast` | GET | Predicted revenue |

#### Existing Endpoints to Enhance

| Endpoint | Enhancement |
|----------|-------------|
| `POST /api/quotations` | Auto-set salesRepId from session |
| `POST /api/sales-orders` | Link to quotationId |
| `POST /api/invoices` | Link to quotationId, salesRepId |
| `PUT /api/quotations/[id]` | Add status transition timestamps |

### 3.3 Query Patterns (SQL/Prisma)

```typescript
// Quote conversion rate by month
await prisma.quotation.groupBy({
  by: ['status'],
  where: {
    quotationDate: { gte: startDate, lte: endDate },
    deletedAt: null
  },
  _count: true,
  _sum: { totalAmount: true }
})

// Sales rep performance
await prisma.quotation.groupBy({
  by: ['createdById', 'status'],
  where: { deletedAt: null },
  _count: true,
  _sum: { totalAmount: true }
})

// Quote-to-invoice conversion time
await prisma.$queryRaw`
  SELECT
    DATE(q.quotationDate) as date,
    COUNT(*) as total_quotes,
    SUM(CASE WHEN i.id IS NOT NULL THEN 1 ELSE 0 END) as converted,
    AVG(DATEDIFF(i.invoiceDate, q.quotationDate)) as avg_days
  FROM Quotation q
  LEFT JOIN SalesOrder so ON so.quotationId = q.id
  LEFT JOIN Invoice i ON i.salesOrderId = so.id
  WHERE q.status = 'CONVERTED'
  GROUP BY DATE(q.quotationDate)
`
```

### 3.4 Frontend Component Structure

```
src/components/
├── quotations/
│   ├── quotation-form.tsx        # Add: salesRep dropdown, sourceChannel
│   ├── quotation-list.tsx       # Add: status filters, conversion badges
│   ├── quotation-view-dialog.tsx
│   └── quotation-follow-up.tsx  # NEW: follow-up tracker
│
├── analytics/                    # NEW directory
│   ├── sales-dashboard.tsx       # Main dashboard
│   ├── sales-funnel.tsx          # Funnel visualization
│   ├── quote-conversion-chart.tsx
│   ├── sales-rep-leaderboard.tsx
│   ├── product-performance.tsx
│   └── customer-cohort.tsx
│
└── reports/
    └── sales-report.tsx          # NEW: consolidated sales report
```

---

## PART 4: SECURITY & ACCESS CONTROL

### 4.1 RBAC Matrix

| Role | Dashboard | Own Quotes | All Quotes | Reports | Admin |
|------|-----------|-----------|------------|---------|-------|
| ADMIN | ✅ Full | ✅ | ✅ Full | ✅ | ✅ |
| ACCOUNTANT | ✅ Full | ✅ | ✅ Full | ✅ | ❌ |
| USER | ✅ Own | ✅ Own | ❌ | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4.2 Implementation Approach

```typescript
// src/app/api/analytics/sales-funnel/route.ts

export async function GET(req: NextRequest) {
  const session = await auth()

  // Check role-based access
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ADMIN and ACCOUNTANT see all
  if (['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
    return getFullFunnelData()
  }

  // USER sees only own quotes
  if (session.user.role === 'USER') {
    return getFunnelDataForUser(session.user.id)
  }

  // VIEWER gets nothing
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 4.3 Data Privacy

- USER role can only see own quotes (createdById = session.user.id)
- Sales amount visible to own quotes only for USER role
- Aggregate data (anonymized) visible to ADMIN for company-wide stats
- Customer PII filtered based on role (USER sees customer name only)

### 4.4 Audit Trail

```prisma
model QuotationAudit {
  id            String   @id @default(cuid())
  quotationId   String
  action        String   // CREATED, UPDATED, STATUS_CHANGED, SENT, VIEWED
  changedById   String
  changes       Json?    // { field: 'status', from: 'DRAFT', to: 'SENT' }
  timestamp     DateTime @default(now())

  @@index([quotationId])
  @@index([changedById])
}
```

---

## PART 5: UI/UX DESIGN

### 5.1 Page Structure

**New Sidebar Item:** SALES ANALYTICS (under REPORTS)

```
SALES ANALYTICS (Sidebar)
├── Sales Dashboard        # Main overview
├── Quote Funnel          # Conversion stages
├── Rep Performance       # Sales leaderboard
├── Product Analysis      # Win rates
└── Customer Insights     # Cohort analysis
```

### 5.2 Sales Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ SALES DASHBOARD                                    [Period ▼]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ QUOTES   │ │ ORDERS   │ │ INVOICES  │ │ REVENUE   │       │
│  │   156    │ │    89    │ │    72     │ │ ฿2.5M    │       │
│  │  +12%    │ │   +8%    │ │   +5%    │ │  +15%    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                                 │
│  CONVERSION FUNNEL                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ████████████████████████░░░░░░░░░░░░░░░░░░░░░░ 156 SENT  │   │
│  │ ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 89 ORDERS│   │
│  │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 72 INV   │   │
│  │ █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 65 PAID   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Conversion: 57% → 81% → 90%                                    │
│                                                                 │
│  TOP PRODUCTS                 SALES REP LEADERBOARD             │
│  ┌────────────────────┐      ┌────────────────────┐           │
│  │ LED bulb    80%   │      │ สมชาย      92%     │           │
│  │ Solar Pnl  75%    │      │ วิภา        78%    │           │
│  │ Wire 5mm   65%    │      │ ธนา        71%    │           │
│  └────────────────────┘      └────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Key UI Components

#### Funnel Chart Component
- Stages: SENT → APPROVED → CONVERTED → INVOICED → PAID
- Hover: Show count + conversion rate
- Click: Drill down to filtered list

#### Sales Rep Card
- Avatar + Name
- Quote count / Conversion rate
- Revenue generated
- Trend indicator (↑↓)

#### Quote Status Badge
- DRAFT: Gray
- SENT: Blue
- APPROVED: Green
- REJECTED: Red
- EXPIRED: Orange
- CONVERTED: Purple

### 5.4 Mobile Considerations

- Dashboard: Condensed to 2-column grid
- Funnel: Vertical bar chart
- Tables: Horizontal scroll with sticky first column
- Charts: Simplified with tap-to-expand

---

## PART 6: IMPLEMENTATION PHASES

### Phase 1: Database Foundation (Week 1)

**Tasks:**
1. Add fields to Prisma schema
2. Create migration
3. Update quotation form (add salesRep dropdown, sourceChannel)
4. Update quotation list (add status filters)
5. Add conversion tracking on status change

**Files to modify:**
- `prisma/schema.prisma` - Add fields
- `src/app/api/quotations/route.ts` - Handle new fields
- `src/components/quotations/quotation-form.tsx` - UI changes
- `src/components/quotations/quotation-list.tsx` - UI changes

**Agent needs:** backend-engineer, frontend-engineer

**Skills needed:**
- Prisma migrations
- React form handling
- TypeScript

**Testing:**
- Create quote with salesRep
- Change status and verify timestamps
- Query quotes by salesRep

---

### Phase 2: Analytics API (Week 2)

**Tasks:**
1. Create sales-funnel endpoint
2. Create quote-conversion endpoint
3. Create sales-rep-performance endpoint
4. Add role-based filtering

**Files to create:**
- `src/app/api/analytics/sales-funnel/route.ts`
- `src/app/api/analytics/quote-conversion/route.ts`
- `src/app/api/analytics/sales-rep-performance/route.ts`
- `src/lib/analytics/sales-analytics.ts` (service layer)

**Agent needs:** backend-engineer

**Skills needed:**
- Prisma aggregations
- GroupBy queries
- Date filtering

**Testing:**
- API returns correct funnel counts
- USER sees only own data
- Date range filtering works

---

### Phase 3: Dashboard UI (Week 3)

**Tasks:**
1. Create sales-dashboard.tsx
2. Create funnel visualization
3. Create rep leaderboard
4. Add to sidebar navigation

**Files to create:**
- `src/components/analytics/sales-dashboard.tsx`
- `src/components/analytics/sales-funnel.tsx`
- `src/components/analytics/sales-rep-leaderboard.tsx`
- `src/components/layout/keerati-sidebar.tsx` (update)

**Files to modify:**
- `src/app/page.tsx` (add new module)
- `src/app/api/page.ts` (SPA routing)

**Agent needs:** frontend-engineer

**Skills needed:**
- React charts (recharts or similar)
- Tailwind CSS
- SPA routing pattern

**Testing:**
- Dashboard loads with data
- Charts render correctly
- Role-based visibility works

---

### Phase 4: Enhanced Features (Week 4)

**Tasks:**
1. Add follow-up tracking (visitCount, lastContactAt)
2. Add closedReason for rejected quotes
3. Add product performance analytics
4. Add customer cohort analysis

**Files to create:**
- `src/components/quotations/quotation-follow-up.tsx`
- `src/components/analytics/product-performance.tsx`
- `src/app/api/analytics/product-performance/route.ts`

**Agent needs:** fullstack-engineer

**Testing:**
- Follow-up button increments visitCount
- Rejected quote requires reason
- Product analytics shows correct %

---

### Phase 5: Polish & Documentation (Week 5)

**Tasks:**
1. Performance optimization for large datasets
2. Add caching for analytics queries
3. Write user documentation
4. Create onboarding guide for sales team

**Files to modify:**
- `src/lib/analytics/sales-analytics.ts` (add caching)
- `docs/USERGUIDE.md` (new)
- `docs/SALES-ANALYTICS.md` (new)

---

## PART 7: AGENT ASSIGNMENT PLAN

### Available Agents & Skills

| Agent | Skills | Best For |
|-------|--------|----------|
| **backend-engineer** | Prisma, API design, database | Phase 1, 2 |
| **frontend-engineer** | React, UI, charts | Phase 3 |
| **fullstack-engineer** | End-to-end | Phase 4 |
| **test-engineer** | E2E tests, verification | All phases |
| **security-engineer** | RBAC, auth, audit | Phase 2 |

### Task Breakdown per Phase

**Phase 1 (Database):**
- Task 1.1: Update schema.prisma (backend-engineer)
- Task 1.2: Create migration (backend-engineer)
- Task 1.3: Update quotation API (backend-engineer)
- Task 1.4: Update quotation form UI (frontend-engineer)
- Task 1.5: Update quotation list UI (frontend-engineer)
- Task 1.6: Add status transition timestamps (backend-engineer)
- Task 1.7: Write E2E tests (test-engineer)

**Phase 2 (Analytics API):**
- Task 2.1: Create sales-funnel endpoint (backend-engineer)
- Task 2.2: Create quote-conversion endpoint (backend-engineer)
- Task 2.3: Create sales-rep-performance endpoint (backend-engineer)
- Task 2.4: Add role-based access control (security-engineer)
- Task 2.5: Write unit tests (test-engineer)

**Phase 3 (Dashboard):**
- Task 3.1: Create sales-dashboard.tsx (frontend-engineer)
- Task 3.2: Create funnel visualization (frontend-engineer)
- Task 3.3: Create rep leaderboard (frontend-engineer)
- Task 3.4: Update sidebar navigation (frontend-engineer)
- Task 3.5: Add SPA routing for new module (fullstack-engineer)

**Phase 4 (Enhanced):**
- Task 4.1: Follow-up tracking (fullstack-engineer)
- Task 4.2: Product performance (fullstack-engineer)
- Task 4.3: Customer cohort (fullstack-engineer)

**Phase 5 (Polish):**
- Task 5.1: Add query caching (backend-engineer)
- Task 5.2: Write documentation (technical-writer)

---

## PART 8: RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes break existing queries | HIGH | Test all existing quotation queries after migration |
| Performance issue with large datasets | MEDIUM | Add pagination, caching, index on createdById + status |
| USER role sees wrong data | CRITICAL | Write tests for role-based filtering |
| Conversion tracking requires workflow changes | MEDIUM | Train users on status flow |
| Chart library adds bundle size | LOW | Lazy load analytics components |

---

## PART 9: SUCCESS METRICS

### Technical Metrics
- [ ] Schema migration completes without errors
- [ ] All existing quotation tests pass
- [ ] New E2E tests pass for analytics
- [ ] Bundle size increase < 50KB (lazy loaded)
- [ ] API response time < 500ms for dashboard

### Business Metrics
- [ ] User can see conversion funnel in dashboard
- [ ] User can filter quotes by salesRep
- [ ] User can see product win rates
- [ ] User can export sales report to PDF/Excel

### Security Metrics
- [ ] USER cannot see other users' quotes
- [ ] ADMIN sees all data
- [ ] Audit log captures quote status changes

---

## PART 10: ALTERNATIVE APPROACHES

### Option A: Minimal (2 weeks)
- Add salesRepId only
- Basic quote count by rep in existing reports
- No new UI, just existing list filters

### Option B: Full Analytics (5 weeks)
- All fields in this document
- New dashboard UI
- Full funnel visualization

### Option C: Phased Rollout
- Phase 1-2: Quotation tracking only
- Phase 3: Basic dashboard
- Phase 4: Enhanced analytics

**Recommendation:** Option B (Full Analytics) - delivers complete value

---

## APPENDIX A: PRISMA SCHEMA CHANGES

```prisma
// Add to model Quotation
salesRepId       String?
salesRep         User?      @relation("QuotationSalesRep", fields: [salesRepId], references: [id])
sourceChannel    String?
convertedAt      DateTime?
closedAt         DateTime?
closedReason     String?
visitCount       Int        @default(0)
lastContactAt    DateTime?
lastContactById   String?

// Add to model User
quotationsCreated    Quotation[] @relation("QuotationSalesRep")
invoicesCreated      Invoice[]    @relation("InvoiceSalesRep")
department           String?
team                 String?

// Add to model Invoice
quotationId    String?
quotation      Quotation? @relation(fields: [quotationId], references: [id])
salesRepId     String?
salesRep       User?      @relation("InvoiceSalesRep", fields: [salesRepId], references: [id])

// Add index for performance
@@index([salesRepId])
@@index([createdById, status])
@@index([quotationDate, status])
```

---

## APPENDIX B: COMPARISON WITH COMPETITORS

| Feature | PEAK AFP | Our System (Current) | Our System (Target) |
|---------|----------|---------------------|----------------------|
| Quote creation | ✅ | ✅ | ✅ |
| Quote tracking | ❌ | ❌ | ✅ |
| Sales rep assignment | ❌ | ❌ | ✅ |
| Conversion funnel | ❌ | ❌ | ✅ |
| Product analytics | ❌ | ❌ | ✅ |
| Rep leaderboard | ❌ | ❌ | ✅ |
| Follow-up reminders | ❌ | ❌ | ✅ |

---

## APPENDIX C: TECHNICAL NOTES FOR DEV TEAM

### Prisma Query Optimization

```typescript
// Use compound indexes for common queries
@@index([status, createdAt])
@@index([customerId, status])
@@index([salesRepId, status])

// Use raw queries for complex aggregations
await prisma.$queryRaw`
  SELECT
    EXTRACT(MONTH FROM quotationDate) as month,
    COUNT(*) FILTER (WHERE status = 'SENT') as sent,
    COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted
  FROM Quotation
  WHERE deletedAt IS NULL
  GROUP BY EXTRACT(MONTH FROM quotationDate)
`
```

### Frontend Performance

```typescript
// Lazy load analytics components
const SalesDashboard = dynamic(() => import('@/components/analytics/sales-dashboard'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Memoize expensive computations
const funnelData = useMemo(() => calculateFunnel(rawData), [rawData])
```

### Caching Strategy

```typescript
// Cache analytics for 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Use unstable_cache for expensive queries
const funnelData = await unstable_cache(
  () => getSalesFunnel(startDate, endDate),
  ['sales-funnel', startDate, endDate],
  { revalidate: CACHE_TTL }
)()
```

---

**Document Version:** 1.0
**Status:** Ready for Development Team Review
**Next Action:** Team Lead to assign agents per Phase

---

*Generated by Claude Code - Research Agent*
*For implementation, see: docs/DOCKER-DEPLOY-SUMMARY.md*