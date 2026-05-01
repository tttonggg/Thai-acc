# 🎯 GitHub Issues for Code Refactoring

Below are pre-formatted GitHub issues ready to create. Each issue includes:

- Clear description
- Task checklists
- Definition of Done
- Priority labels
- Dependencies

---

## Issue 1: 🔧 Phase 1 - Foundation Setup

**Title**: Phase 1: Foundation Setup - Refactoring Infrastructure

**Labels**: `enhancement`, `refactoring`, `phase-1`, `high-priority`

**Body**:

```markdown
## Overview

Complete foundation setup for the code refactoring initiative.

## Tasks

### Error Handling Infrastructure

- [ ] Create \`src/lib/errors.ts\` with AppError base class
- [ ] Create \`src/lib/api-error-handler.ts\` for unified error handling
- [ ] Add error logging middleware in \`src/middleware.ts\`
- [ ] Create \`src/lib/performance-monitor.ts\` for API tracking

### Database Optimization

- [x] Add performance indexes (40+ indexes in migration)
- [ ] Enable Prisma query logging
- [ ] Create \`src/lib/db-helpers.ts\` for common query patterns
- [ ] Create \`src/lib/db-optimizer.ts\` for query optimization

### Testing Infrastructure

- [x] Configure headless browser testing
- [x] Create \`scripts/analyze-query-performance.sh\`
- [ ] Add performance benchmarks
- [ ] Set up query analysis reporting

### Documentation

- [x] Create \`scripts/CODE_REFACTORING_PLAN.md\`
- [ ] Document new error handling patterns
- [ ] Create performance monitoring guide

## Definition of Done

- [ ] All helper functions created and tested
- [ ] Database indexes applied
- [ ] Query analysis script working
- [ ] Documentation complete

## Priority

**High** - Foundation for all other refactoring work

## Estimated Time

2-3 days

## Linked Issues

- Depends on: None
- Blocks: #2 (Code Quality), #3 (Database Optimization)

---

Created from: \`scripts/CODE_REFACTORING_PLAN.md\` Phase: 1 - Foundation Setup
```

---

## Issue 2: 📝 Phase 2 - Code Quality Improvements

**Title**: Phase 2: Code Quality - Type Safety & Error Handling

**Labels**: `enhancement`, `refactoring`, `phase-2`, `high-priority`

**Body**:

```markdown
## Overview

Refactor codebase for improved type safety, consistent error handling, and
reduced code duplication.

## Tasks

### Standardize Error Handling (20+ files)

- [ ] Update \`src/app/api/admin/activity-log/route.ts\`
- [ ] Update \`src/app/api/admin/analytics/route.ts\`
- [ ] Update \`src/app/api/admin/import/route.ts\`
- [ ] Update \`src/app/api/customers/route.ts\`
- [ ] Update \`src/app/api/vendors/route.ts\`
- [ ] Update \`src/app/api/invoices/route.ts\`
- [ ] Update \`src/app/api/payments/route.ts\`
- [ ] Update \`src/app/api/receipts/route.ts\`
- [ ] Update \`src/app/api/employees/route.ts\`
- [ ] Update \`src/app/api/users/route.ts\`
- [ ] Update \`src/app/api/settings/route.ts\`
- [ ] Update \`src/app/api/wht/route.ts\`
- [ ] Update \`src/app/api/credit-notes/route.ts\`
- [ ] Update \`src/app/api/debit-notes/route.ts\`
- [ ] Update remaining API routes

Replace duplicated error handling with: \`\`\`typescript import { handleApiError
} from '@/lib/api-error-handler';

catch (error) { return handleApiError(error); } \`\`\`

### Type Safety Improvements

- [ ] Add return types to all API route handlers
- [ ] Remove \`any\` types (currently ~150 instances)
- [ ] Add strict null checks
- [ ] Enable strict mode in \`tsconfig.json\`

### Function Refactoring

- [ ] Split \`src/app/api/dashboard/route.ts\` (200+ lines)
  - Extract to \`src/lib/dashboard-service.ts\`
  - Create \`getDashboardData()\` function
  - Create \`transformDashboardData()\` function

- [ ] Refactor invoice posting logic
  - Extract GL posting to \`src/lib/invoice-service.ts\`
  - Separate validation from business logic

- [ ] Centralize VAT calculations
  - Move from components to \`src/lib/vat-service.ts\`
  - Ensure consistent rounding

### Code Duplication Removal

Target: Reduce duplication from 15% to <5%

- [ ] Extract pagination helper (15+ files)
- [ ] Extract database query helpers
- [ ] Extract validation helpers
- [ ] Extract response formatters

## Files to Modify

- \`src/lib/errors.ts\` (create)
- \`src/lib/api-error-handler.ts\` (create)
- \`src/lib/dashboard-service.ts\` (create)
- \`src/lib/invoice-service.ts\` (refactor)
- \`src/lib/vat-service.ts\` (refactor)
- \`tsconfig.json\` (update)
- \`src/app/api/\*\*/route.ts\` (20+ files)

## Success Metrics

- [ ] Code duplication: 15% → <5%
- [ ] Any types: 150 → <20
- [ ] Type coverage: 70% → >95%
- [ ] Files with duplicated error handling: 20 → 0

## Definition of Done

- [ ] All API routes use unified error handling
- [ ] All functions have return types
- [ ] Less than 20 \`any\` types remain
- [ ] Large functions split into smaller units
- [ ] All tests pass after refactoring

## Priority

**High** - Direct impact on code quality and maintainability

## Estimated Time

1 week

## Dependencies

- Requires: #1 (Foundation Setup)
- Blocks: #3 (Database Optimization)

---

Phase: 2 - Code Quality
```

---

## Issue 3: 🗄️ Phase 3 - Database Query Optimization

**Title**: Phase 3: Database Optimization - Fix N+1 Queries & Add Indexes

**Labels**: `enhancement`, `performance`, `database`, `phase-3`, `high-priority`

**Body**:

```markdown
## Overview

Optimize database queries to eliminate N+1 problems and improve response times.

## Current Performance

- Dashboard API: ~800ms
- Invoice API: ~500ms
- Report APIs: ~2000ms
- Average query time: ~50ms

## Target Performance

- Dashboard API: <200ms
- Invoice API: <200ms
- Report APIs: <500ms
- Average query time: <20ms

## Tasks

### Apply Performance Indexes

- [x] Create migration file with 40+ indexes
- [ ] Run migration: \`bun run db:migrate\`
- [ ] Verify indexes created: \`SELECT \* FROM sqlite_master WHERE
      type='index'\`
- [ ] Benchmark query performance before/after

### Fix N+1 Query Issues

**Priority 1: Journal Entry with Lines**

- [ ] \`src/app/api/journal/route.ts\`
  - Current: Separate queries for entry + lines + accounts
  - Fix: Use \`include\` for lines and accounts

\`\`\`typescript // Before (N+1) const entry = await
prisma.journalEntry.findUnique({ where: { id } }); const lines = await
prisma.journalLine.findMany({ where: { entryId: id } });

// After (single query) const entry = await prisma.journalEntry.findUnique({
where: { id }, include: { lines: { include: { account: { select: { id: true,
code: true, name: true }} } } } }); \`\`\`

**Priority 2: Invoice with Customer and Items**

- [ ] \`src/app/api/invoices/route.ts\`
  - Add \`include\` for customer
  - Add \`include\` for lineItems
  - Add \`select\` to limit fields

**Priority 3: Receipt with Customer**

- [ ] \`src/app/api/receipts/route.ts\`
  - Include customer data
  - Include related invoices

**Priority 4: Payment with Vendor**

- [ ] \`src/app/api/payments/route.ts\`
  - Include vendor data
  - Include related purchases

**Priority 5: Chart of Accounts Hierarchy**

- [ ] \`src/app/api/accounts/route.ts\`
  - Include parent/children relationships
  - Optimize tree traversal

**Priority 6: Stock Balances with Product/Warehouse**

- [ ] \`src/app/api/stock-balances/route.ts\`
  - Include product details
  - Include warehouse details

**Priority 7: Employee with Payroll History**

- [ ] \`src/app/api/employees/route.ts\`
  - Include payroll history efficiently
  - Limit fields returned

**Priority 8: VAT Reports Grouping**

- [ ] \`src/app/api/reports/vat/route.ts\`
  - Optimize GROUP BY queries
  - Add proper indexes
  - Use aggregate efficiently

### Optimize Slow Queries

**Dashboard API** (800ms → <200ms target)

- [ ] Convert sequential queries to parallel
- [ ] Add selective field loading
- [ ] Cache metrics if appropriate

\`\`\`typescript // Before (sequential) const metrics = await getMetrics();
const arAging = await getARAging(); const apAging = await getAPAging();

// After (parallel) const [metrics, arAging, apAging] = await Promise.all([
getMetrics(), getARAging(), getAPAging(), ]); \`\`\`

**Report APIs** (2000ms → <500ms target)

- [ ] Implement caching for expensive calculations
- [ ] Add Redis for report data
- [ ] Generate reports asynchronously
- [ ] Store pre-aggregated data

### Query Helper Functions

Create \`src/lib/db-helpers.ts\`:

- [ ] \`paginatedQuery()\` - Reusable pagination
- [ ] \`findByIdWithIncludes()\` - Optimized lookups
- [ ] \`batchLoad()\` - Batch loading helper
- [ ] \`selectFields()\` - Field selector

## Query Optimization Service

Create \`src/lib/db-optimizer.ts\`:

- [ ] Cursor pagination support
- [ ] Batch loading utilities
- [ ] Selective field helpers
- [ ] Query result caching

## Performance Monitoring

- [ ] Enable Prisma query logging in dev
- [ ] Add slow query detection (>1s)
- [ ] Run \`./scripts/analyze-query-performance.sh\`
- [ ] Benchmark before/after each optimization

## Success Metrics

- [ ] N+1 queries: 12 → 0
- [ ] Dashboard API: 800ms → <200ms
- [ ] Invoice API: 500ms → <200ms
- [ ] Report APIs: 2000ms → <500ms
- [ ] Average query time: 50ms → <20ms
- [ ] Slow queries (>1s): 8 → <2

## Definition of Done

- [ ] All N+1 queries identified and fixed
- [ ] Performance indexes applied
- [ ] All API response times meet targets
- [ ] Query analysis shows no remaining N+1 patterns
- [ ] Performance benchmarks pass

## Priority

**High** - Direct user-facing performance impact

## Estimated Time

1 week

## Dependencies

- Requires: #1 (Foundation Setup), #2 (Code Quality)
- Blocks: #4 (API Performance)

---

Phase: 3 - Database Optimization Target: 60% query performance improvement
```

---

## Issue 4: ⚡ Phase 4 - API Performance Optimization

**Title**: Phase 4: API Performance - Caching & Parallel Queries

**Labels**: `enhancement`, `performance`, `phase-4`, `medium-priority`

**Body**:

```markdown
## Overview

Optimize API response times through caching, parallel queries, and response
optimization.

## Current State

- Average API response: ~800ms
- No caching layer
- Sequential queries in many endpoints
- Full document payloads (no selective field loading)

## Targets

- Average API response: <200ms
- Redis caching implemented
- Parallel queries where possible
- Selective field loading

## Tasks

### Parallel Query Implementation

**Dashboard API** (\`src/app/api/dashboard/route.ts\`)

- [ ] Identify independent queries
- [ ] Convert to \`Promise.all()\`
- [ ] Test performance improvement

**Reports API** (\`src/app/api/reports/\`)

- [ ] \`balance-sheet/route.ts\`
- [ ] \`profit-loss/route.ts\`
- [ ] \`trial-balance/route.ts\`
- [ ] \`aging/route.ts\`

### Caching Strategy

**Install Redis**

- [ ] Add Redis dependency: \`bun add ioredis\`
- [ ] Create \`src/lib/redis.ts\` client
- [ ] Add Redis configuration to \`.env\`

**Cache Keys & TTL**

- [ ] Dashboard metrics: \`dashboard:metrics\` (5 min TTL)
- [ ] Chart of accounts: \`chart:all\` (1 hour TTL)
- [ ] Report data: \`report:{type}:{year}:{month}\` (1 hour TTL)
- [ ] User permissions: \`user:{id}:permissions\` (15 min TTL)

**Cache Implementation**

- [ ] Create \`src/lib/cache.ts\` with helpers:
  - \`cacheGet(key, fn)\` - Get or populate cache
  - \`cacheSet(key, value, ttl)\` - Set cache
  - \`cacheInvalidate(pattern)\` - Invalidate pattern

- [ ] Update APIs to use caching:
  - \`src/app/api/dashboard/route.ts\`
  - \`src/app/api/accounts/route.ts\`
  - \`src/app/api/reports/\`

**Cache Invalidation**

- [ ] Invalidate on data mutations
- [ ] Invalidate on schema changes
- [ ] Manual invalidation endpoint

### Selective Field Loading

**API Response Optimization**

- [ ] Audit current response payloads
- [ ] Remove unnecessary nested data
- [ ] Add \`select\` to limit fields
- [ ] Create field selection helpers

**Examples**: \`\`\`typescript // Before: Returns all fields const customer =
await prisma.customer.findUnique({ where: { id }});

// After: Returns only needed fields const customer = await
prisma.customer.findUnique({ where: { id }, select: { id: true, code: true,
name: true, taxId: true, // Exclude: address, metadata, etc. } }); \`\`\`

### Response Compression

**Enable Compression**

- [ ] Already enabled in \`next.config.ts\`
- [ ] Verify compression working: \`curl -H "Accept-Encoding: gzip" API\`
- [ ] Monitor compression ratios

### API Response Time Tracking

**Performance Monitor Integration**

- [ ] Integrate \`src/lib/performance-monitor.ts\`
- [ ] Track all API endpoints
- [ ] Expose \`/api/admin/performance\` endpoint
- [ ] Generate performance reports

**Metrics to Track**

- [ ] Response time (p50, p95, p99)
- [ ] Request rate
- [ ] Error rate
- [ ] Cache hit rate

## Files to Create

- \`src/lib/redis.ts\` - Redis client
- \`src/lib/cache.ts\` - Cache helpers
- \`src/lib/performance-monitor.ts\` - Performance tracking

## Files to Modify

- \`src/app/api/dashboard/route.ts\`
- \`src/app/api/accounts/route.ts\`
- \`src/app/api/reports/\*/route.ts\`
- \`.env\` - Add Redis URL
- \`package.json\` - Add ioredis

## Success Metrics

- [ ] Dashboard API: 800ms → <200ms
- [ ] Account list API: <200ms
- [ ] Report APIs: 2000ms → <500ms
- [ ] Average API response: <200ms
- [ ] Cache hit rate: >60%
- [ ] Cache invalidation working correctly

## Definition of Done

- [ ] Redis caching implemented
- [ ] All slow endpoints using cache
- [ ] Parallel queries implemented
- [ ] Selective field loading in place
- [ ] Performance tracking enabled
- [ ] All API targets met

## Priority

**Medium** - Important for user experience

## Estimated Time

1 week

## Dependencies

- Requires: #1 (Foundation), #3 (Database Optimization)
- Blocks: #6 (Performance Monitoring)

---

Phase: 4 - API Performance Target: 75% API response time improvement
```

---

## Issue 5: 🧪 Phase 5 - Testing Strategy Shift

**Title**: Phase 5: Testing Strategy - More Unit/Integration Tests, Fewer E2E

**Labels**: `testing`, `quality-assurance`, `phase-5`, `medium-priority`

**Body**:

```markdown
## Overview

Shift testing focus from E2E to unit/integration tests while maintaining
headless execution for faster CI/CD.

## Current Test Distribution

- E2E: 40% (55 files)
- Integration: 20%
- Unit: 40% (772 files)

## Target Distribution

- E2E: 20% (critical user flows only)
- Integration: 40% (API and service layer)
- Unit: 40% (business logic)

## Tasks

### Headless Test Execution

- [x] Configure headless mode by default
- [ ] Update CI/CD workflows
- [ ] Document headed mode for debugging
- [ ] Verify test execution time improvement

### Unit Test Enhancements

**Service Layer Tests** (Create if missing)

- [ ] \`src/lib/thai-accounting.test.ts\`
  - VAT calculations
  - WHT calculations
  - Thai date formatting
  - Currency formatting

- [ ] \`src/lib/invoice-service.test.ts\`
  - Invoice creation
  - GL posting
  - VAT record generation

- [ ] \`src/lib/payroll-service.test.ts\`
  - SSC calculations
  - PND1 calculations
  - Net pay calculations

**API Route Tests** (Create)

- [ ] \`tests/api/invoices-api.test.ts\`
- [ ] \`tests/api/receipts-api.test.ts\`
- [ ] \`tests/api/payments-api.test.ts\`
- [ ] \`tests/api/dashboard-api.test.ts\`

### Integration Tests

**Database Integration**

- [ ] \`tests/integration/journal-entry.test.ts\`
  - Test GL posting
  - Verify double-entry balance

- [ ] \`tests/integration/invoice-workflow.test.ts\`
  - Create → Post → Verify JE → Verify VAT

- [ ] \`tests/integration/payment-workflow.test.ts\`
  - Create → Allocate → Post → Verify WHT

**API Integration**

- [ ] \`tests/integration/api-auth.test.ts\`
- [ ] \`tests/integration/api-rbac.test.ts\`
- [ ] \`tests/integration/api-validation.test.ts\`

### E2E Test Optimization

**Retain Critical E2E Tests** (Keep ~30 files)

- [ ] Authentication flow
- [ ] Core accounting workflows
- [ ] Critical path testing
- [ ] Cross-module integration

**Remove Redundant E2E Tests**

- [ ] Identify tests covered by unit/integration
- [ ] Archive redundant tests
- [ ] Document why tests were removed

### Performance Tests

**Create Performance Test Suite**

- [ ] \`tests/performance/api-response-time.test.ts\`
- [ ] \`tests/performance/query-performance.test.ts\`
- [ ] \`tests/performance/load-testing.test.ts\`

## Test Quality Improvements

**Test Reliability**

- [ ] Fix flaky tests (target: 0 flaky tests)
- [ ] Reduce test timeouts
- [ ] Improve test isolation

**Test Coverage**

- [ ] Measure current coverage
- [ ] Set coverage targets (>85%)
- [ ] Track coverage trends
- [ ] Report coverage in CI

## Success Metrics

- [ ] Test execution time: 20min → 10min
- [ ] Test reliability: 85% → >98%
- [ ] Flaky tests: existing → 0
- [ ] Code coverage: 75% → >85%
- [ ] E2E tests: 55 → ~30
- [ ] Unit tests: 772 → >900

## Definition of Done

- [ ] Headless testing working
- [ ] Unit tests for all services
- [ ] Integration tests for key workflows
- [ ] E2E tests reduced to critical paths
- [ ] Test execution time halved
- [ ] Coverage increased to >85%
- [ ] All tests passing consistently

## Priority

**Medium** - Improves development velocity

## Estimated Time

1 week

## Dependencies

- Requires: #1 (Foundation)
- Blocks: None

---

Phase: 5 - Testing Strategy Target: 50% faster test execution
```

---

## Issue 6: 📊 Phase 6 - Performance Monitoring & Reporting

**Title**: Phase 6: Performance Monitoring - Query Logging & Metrics Dashboard

**Labels**: `monitoring`, `performance`, `phase-6`, `low-priority`

**Body**:

```markdown
## Overview

Implement comprehensive performance monitoring for database queries and API
endpoints.

## Tasks

### Database Query Monitoring

**Enable Query Logging**

- [ ] Update \`src/lib/db.ts\` to enable query logging
- [ ] Add slow query detection (>1s threshold)
- [ ] Log query execution times
- [ ] Store query metrics

**Query Analysis Dashboard**

- [x] Create \`scripts/analyze-query-performance.sh\`
- [ ] Schedule automated analysis (daily)
- [ ] Generate query performance reports
- [ ] Track slow query trends

### API Performance Monitoring

**Performance Tracking Service**

- [ ] Create \`src/lib/performance-monitor.ts\`
- [ ] Track response times for all endpoints
- [ ] Calculate p50, p95, p99 percentiles
- [ ] Store historical metrics

**Performance Dashboard**

- [ ] Create \`/api/admin/performance\` endpoint
- [ ] Display endpoint statistics
- [ ] Show slow endpoints
- [ ] Visualize response time trends
- [ ] Cache hit rate metrics

### Alerting

**Performance Alerts**

- [ ] Alert on slow queries (>1s)
- [ ] Alert on API degradation (>500ms)
- [ ] Alert on error rate spikes
- [ ] Alert on cache misses

**Notification Channels**

- [ ] Slack integration for alerts
- [ ] Email for critical issues
- [ ] Dashboard for viewing

### Reporting

**Daily Performance Reports**

- [ ] Automated report generation
- [ ] Email summary
- [ ] Trend analysis
- [ ] Anomaly detection

**Weekly Performance Reports**

- [ ] Detailed analysis
- [ ] Comparison to previous week
- [ ] Recommendations
- [ ] Executive summary

## Files to Create

- \`src/lib/performance-monitor.ts\`
- \`src/app/api/admin/performance/route.ts\`
- \`scripts/generate-performance-report.ts\`
- \`scripts/performance-dashboard.tsx\`

## Files to Modify

- \`src/lib/db.ts\` - Enable query logging
- \`src/middleware.ts\` - Add performance tracking

## Success Metrics

- [ ] Query logging enabled
- [ ] Performance monitoring active
- [ ] Dashboard accessible
- [ ] Automated reports generated
- [ ] Alerts configured and working

## Definition of Done

- [ ] All queries logged
- [ ] Performance dashboard accessible
- [ ] Automated reports running
- [ ] Alerts tested and working
- [ ] Team trained on monitoring

## Priority

**Low** - Important but not blocking

## Estimated Time

3-5 days

## Dependencies

- Requires: #1 (Foundation), #3 (Database), #4 (API), #5 (Testing)

---

Phase: 6 - Performance Monitoring
```

---

## Issue 7: 🐛 Bug Fixes - AuthError Handling Coverage Gaps

**Title**: Bug: Missing Unit Tests for AuthError Handling in 8 API Routes

**Labels**: `bug`, `testing`, `high-priority`

**Body**:

```markdown
## Problem

Recent code review identified that 8 API routes have AuthError handling logic
but no corresponding unit tests.

## Affected Files

1. \`src/app/api/admin/activity-log/route.ts\`
2. \`src/app/api/admin/analytics/route.ts\`
3. \`src/app/api/admin/import/route.ts\`
4. \`src/app/api/credit-notes/route.ts\`
5. \`src/app/api/debit-notes/route.ts\`
6. \`src/app/api/payments/route.ts\`
7. \`src/app/api/vendors/route.ts\`
8. \`src/app/api/dashboard/route.ts\`

## Tasks

- [ ] Create \`tests/api/auth-error-handling.test.ts\`
- [ ] Test AuthError detection (instanceof, name, statusCode)
- [ ] Test 401 response format
- [ ] Test 403 response format
- [ ] Test error message content (Thai)
- [ ] Verify error logging occurs
- [ ] Test unhandled errors still return 500

## Test Cases

\`\`\`typescript describe('AuthError Handling', () => { it('should detect
AuthError by instanceof', async () => { const response = await
fetch('/api/customers', { headers: { Authorization: 'Invalid' } });
expect(response.status).toBe(401); });

it('should detect AuthError by name', async () => { // Test error.name ===
'AuthError' detection });

it('should detect AuthError by statusCode', async () => { // Test
error?.statusCode === 401 detection });

it('should return Thai error message for 401', async () => { const data = await
response.json(); expect(data.error).toContain('ไม่ได้รับอนุญาต'); });

it('should return 403 for forbidden access', async () => { // Test VIEWER trying
to access ADMIN endpoint }); }); \`\`\`

## Definition of Done

- [ ] All 8 routes have AuthError unit tests
- [ ] Tests cover all detection patterns
- [ ] Error responses validated
- [ ] Tests integrated into CI/CD
- [ ] All tests passing

## Priority

**High** - Security-critical code paths

## Estimated Time

4-6 hours

## Linked Issues

- Related to: #2 (Code Quality Improvements)
- Blocks: #5 (Testing Strategy)

---

Type: Bug Fix Component: Authentication & Error Handling
```

---

## Issue 8: 🚀 Performance Fix - Dashboard API 800ms → <200ms

**Title**: Performance: Optimize Dashboard API Response Time from 800ms to
<200ms

**Labels**: `performance`, `optimization`, `high-priority`

**Body**:

```markdown
## Problem

Dashboard API currently takes ~800ms to load, making it one of the slowest
endpoints. Users notice the delay on every page load.

## Root Cause Analysis

1. Sequential query execution (not parallel)
2. Full document payloads (no field selection)
3. No caching layer
4. Expensive calculations on every request

## Tasks

### Phase 1: Parallel Queries

**Current Code** (sequential): \`\`\`typescript const metrics = await
getMetrics(); const arAging = await getARAging(); const apAging = await
getAPAging(); const monthlyData = await getMonthlyData(year); const vatData =
await getVatSummary(year, month); const whtData = await getWhtSummary(year,
month); \`\`\`

**Optimized Code** (parallel): \`\`\`typescript const [metrics, arAging,
apAging, monthlyData, vatData, whtData] = await Promise.all([ getMetrics(),
getARAging(), getAPAging(), getMonthlyData(year), getMonthlyVatData(year),
getWhtSummary(year, month), ]); \`\`\`

- [ ] Refactor \`src/app/api/dashboard/route.ts\`
- [ ] Move to \`src/lib/dashboard-service.ts\`
- [ ] Create \`getDashboardData()\` function
- [ ] Use \`Promise.all()\` for independent queries
- [ ] Test performance improvement

### Phase 2: Selective Field Loading

- [ ] Audit response payload for unused fields
- [ ] Add \`select\` to database queries
- [ ] Remove unnecessary nested data
- [ ] Minimize JSON response size

### Phase 3: Caching

- [ ] Cache metrics (5 min TTL)
- [ ] Cache chart of accounts (1 hour TTL)
- [ ] Cache aging data (15 min TTL)
- [ ] Invalidate cache on data changes

### Phase 4: Calculation Optimization

- [ ] Pre-calculate expensive aggregations
- [ ] Use materialized views for common queries
- [ ] Optimize SQL queries (use indexes)
- [ ] Consider async report generation

## Expected Improvement

- [ ] Parallel queries: 800ms → 300ms
- [ ] Selective fields: 300ms → 200ms
- [ ] Caching: 200ms → <100ms (cached)

## Success Metrics

- [ ] Initial load: <200ms
- [ ] Cached load: <100ms
- [ ] P95 response time: <300ms
- [ ] P99 response time: <500ms

## Definition of Done

- [ ] Queries running in parallel
- [ ] Response payload optimized
- [ ] Caching implemented
- [ ] Performance target met (<200ms)
- [ ] Tests updated
- [ ] Documentation updated

## Priority

**High** - High-traffic endpoint affecting all users

## Estimated Time

2-3 days

## Linked Issues

- Depends on: #1 (Foundation), #3 (Database)
- Related to: #4 (API Performance)

---

Type: Performance Optimization Component: Dashboard API Target: 75% response
time reduction
```

---

## Issue 9: 🐛 Database Bug - Fix 12 N+1 Query Issues

**Title**: Database Bug: Eliminate 12 N+1 Query Problems Identified by Code
Review

**Labels**: `bug`, `database`, `performance`, `high-priority`

**Body**:

```markdown
## Problem

Code review identified 12 N+1 query patterns where we fetch a parent object,
then loop through related objects and fetch them individually. This causes O(n)
database queries instead of O(1).

## Impact

- **Performance**: Each N+1 pattern adds 100-1000ms
- **Database Load**: Unnecessary query volume
- **Scalability**: Performance degrades with data volume

## N+1 Issues to Fix

### 1. Journal Entry with Lines

**File**: \`src/app/api/journal/[id]/route.ts\` **Current**: Fetch entry, then
fetch lines, then fetch each line's account **Fix**: Use \`include\` for lines
and accounts **Impact**: 1 + 50 + 50 = 101 queries → 1 query

### 2. Invoice List with Customers

**File**: \`src/app/api/invoices/route.ts\` **Current**: Fetch invoices, then
fetch customer for each **Fix**: Include customer in query **Impact**: 100 + 100
= 200 queries → 1 query

### 3. Invoice Detail with Customer & Line Items

**File**: \`src/app/api/invoices/[id]/route.ts\` **Current**: 5 separate queries
**Fix**: Single query with nested includes **Impact**: 5 queries → 1 query

### 4. Receipt with Customer & Invoices

**File**: \`src/app/api/receipts/route.ts\` **Current**: Fetch receipts,
customers, invoices separately **Fix**: Include relations **Impact**: 3n queries
→ n queries

### 5. Payment with Vendor & Purchases

**File**: \`src/app/api/payments/route.ts\` **Current**: Fetch payments,
vendors, purchases separately **Fix**: Include relations **Impact**: 3n queries
→ n queries

### 6. Credit Note with Customer

**File**: \`src/app/api/credit-notes/route.ts\` **Current**: Fetch credit notes,
then customer for each **Fix**: Include customer **Impact**: n + n = 2n queries
→ n queries

### 7. Debit Note with Vendor

**File**: \`src/app/api/debit-notes/route.ts\` **Current**: Fetch debit notes,
then vendor for each **Fix**: Include vendor **Impact**: n + n = 2n queries → n
queries

### 8. Chart of Accounts Tree

**File**: \`src/app/api/accounts/route.ts\` **Current**: Recursive fetching of
parent/child relationships **Fix**: Single query with recursive CTE or optimize
structure **Impact**: 1 + 181 + ... queries → 1 query

### 9. Stock Balances with Product & Warehouse

**File**: \`src/app/api/stock-balances/route.ts\` **Current**: Fetch balances,
then products, then warehouses **Fix**: Include relations, use select for needed
fields **Impact**: 3n queries → n queries

### 10. Employee with Payroll History

**File**: \`src/app/api/employees/route.ts\` **Current**: Fetch employees, then
payroll for each **Fix**: Include recent payroll (limit with pagination)
**Impact**: 2n queries → n queries

### 11. Vendor with Purchase History

**File**: \`src/app/api/vendors/route.ts\` **Current**: Fetch vendors, then
purchases for each **Fix**: Include purchases (limit), or separate endpoint
**Impact**: 2n queries → n queries

### 12. Customer with Invoice History

**File**: \`src/app/api/customers/route.ts\` **Current**: Fetch customers, then
invoices for each **Fix**: Include recent invoices (limit), or separate endpoint
**Impact**: 2n queries → n queries

## Solution Pattern

\`\`\`typescript // Before (N+1) const invoices = await
prisma.invoice.findMany(); for (const invoice of invoices) { invoice.customer =
await prisma.customer.findUnique({ where: { id: invoice.customerId } }); }

// After (Single Query with Include) const invoices = await
prisma.invoice.findMany({ include: { customer: { select: { id: true, code: true,
name: true, } } } }); \`\`\`

## Tasks

- [ ] Fix all 12 N+1 issues
- [ ] Add query performance tests
- [ ] Benchmark before/after
- [ ] Verify no functional regressions
- [ ] Update documentation

## Success Metrics

- [ ] All 12 N+1 issues resolved
- [ ] Query count reduced by >90%
- [ ] API response times improved by >50%
- [ ] No functional regressions
- [ ] Tests added to prevent recurrence

## Definition of Done

- [ ] All 12 files refactored
- [ ] Each fix tested and verified
- [ ] Performance benchmarks pass
- [ ] Code review approved
- [ ] No regressions in E2E tests

## Priority

**High** - Major performance improvement

## Estimated Time

1 week

## Linked Issues

- Depends on: #1 (Foundation), #2 (Code Quality)
- Related to: #3 (Database Optimization)

---

Type: Performance Bug Fix Component: Database Queries Target: 90% query
reduction
```

---

## Issue 10: ✅ Verification Task - Apply Database Indexes

**Title**: Task: Apply Performance Indexes to Database

**Labels**: `task`, `database`, `low-complexity`

**Body**:

````markdown
## Overview

Apply the 40+ performance indexes created in the migration file to improve query
performance.

## Migration File

\`prisma/migrations/20260317_add_performance_indexes/migration.sql\`

## Tasks

- [ ] Verify migration file exists
- [ ] Run migration: \`bun run db:migrate\`
- [ ] Verify indexes created:
  ```bash
  sqlite3 prisma/dev.db "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%_idx'"
  ```
````

- [ ] Test query performance before/after
- [ ] Document any issues

## Indexes Included

- JournalEntry indexes (date, company, composite)
- Invoice indexes (customer, status, date, composites)
- Receipt indexes (customer, date, composites)
- Payment indexes (vendor, date, composites)
- VAT indexes (year, month, type, composites)
- Chart of Accounts indexes (type, parent, active)
- Customer indexes (company, active, composites)
- Vendor indexes (company, active, composites)
- Stock indexes (product, warehouse, composites)
- Employee indexes (company, active, composites)
- Asset indexes (company, active, composites)
- Bank/Cheque indexes
- Payroll indexes
- - 20+ more

## Success Metrics

- [ ] Migration applies successfully
- [ ] All 40+ indexes created
- [ ] No database errors
- [ ] Query performance improved

## Definition of Done

- [ ] Migration applied
- [ ] Indexes verified
- [ ] Performance tested
- [ ] No regressions

## Priority

**Medium** - Required for other performance work

## Estimated Time

30 minutes

## Linked Issues

- Enables: #3 (Database Optimization), #8 (Dashboard), #9 (N+1 Fixes)

---

Type: Database Task Complexity: Low Risk: Low (indexes only improve performance)

````

---

## 📝 Instructions to Create Issues

### Option 1: Create via GitHub UI
1. Go to: https://github.com/[your-org]/Thai-acc/issues/new
2. Copy each issue content above
3. Paste title and body
4. Add labels
5. Submit

### Option 2: Create via GitHub CLI (after auth)
```bash
# Authenticate first
gh auth login

# Create issues from markdown
gh issue create --body-file issue-1.md
gh issue create --body-file issue-2.md
# ... etc
````

### Option 3: Create via Automation Script

I can create a script to generate all issues at once.

---

## 🎯 Issue Priority Summary

| Issue                 | Priority | Est. Time | Dependencies   |
| --------------------- | -------- | --------- | -------------- |
| #1 - Foundation Setup | High     | 2-3 days  | None           |
| #7 - AuthError Tests  | High     | 4-6 hrs   | None           |
| #8 - Dashboard Perf   | High     | 2-3 days  | #1, #3         |
| #9 - N+1 Queries      | High     | 1 week    | #1, #2         |
| #2 - Code Quality     | High     | 1 week    | #1             |
| #3 - Database Opt     | High     | 1 week    | #1, #2         |
| #4 - API Perf         | Medium   | 1 week    | #1, #3         |
| #5 - Testing Shift    | Medium   | 1 week    | #1             |
| #6 - Monitoring       | Low      | 3-5 days  | #1, #3, #4, #5 |
| #10 - Apply Indexes   | Medium   | 30 min    | None           |

---

## 🚀 Recommended Workflow

### Week 1: Foundation

1. **Issue #10** (30 min) - Apply indexes
2. **Issue #1** (2-3 days) - Foundation setup
3. **Issue #7** (4-6 hrs) - AuthError tests

### Week 2: Code Quality

4. **Issue #2** (1 week) - Code quality improvements

### Week 3: Database

5. **Issue #3** (1 week) - Database optimization
6. **Issue #8** (2-3 days) - Dashboard performance
7. **Issue #9** (1 week) - N+1 query fixes

### Week 4: Performance & Testing

8. **Issue #4** (1 week) - API performance
9. **Issue #5** (1 week) - Testing shift

### Week 5: Monitoring

10. **Issue #6** (3-5 days) - Performance monitoring

---

Would you like me to:

1. Create a script to generate all these issues automatically?
2. Create a Kanban board configuration?
3. Set up project milestones based on this timeline?
