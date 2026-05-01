# 🔄 Code Refactoring & Database Optimization Plan

**Focus**: Headless testing, code quality, and database performance

**Created**: 2026-03-17 **Status**: Ready for Implementation

---

## 📋 Executive Summary

This refactoring plan focuses on:

1. ✅ **Headless browser testing** - Faster, CI-friendly execution
2. ✅ **Code quality improvements** - Type safety, error handling, consistency
3. ✅ **Database query optimization** - Reduce N+1 queries, add indexes
4. ✅ **API performance** - Response time optimization
5. ✅ **Function refactoring** - Remove code duplication, improve reusability

---

## 🎯 Phase 1: Headless Testing Configuration

### ✅ Completed

**Playwright Config Updates**:

- ✅ Headless mode enabled by default
- ✅ CI-optimized project configuration
- ✅ Reduced worker overhead
- ✅ Faster test execution

**Usage**:

```bash
# Run tests in headless mode (default)
bun run test:e2e

# Run tests with headed browser (for debugging)
HEADED=true bun run test:e2e

# Run CI-optimized tests
bun run test:e2e --project=ci-headless
```

---

## 🔧 Phase 2: Code Quality Improvements

### 2.1 Type Safety Enhancements

#### Issues Identified

- Inconsistent error handling patterns
- Missing type annotations in API routes
- Unsafe type assertions
- Incomplete Zod validation coverage

#### Action Items

**Priority 1: Error Handling Standardization**

- [ ] Create `AppError` base class for application errors
- [ ] Standardize error response format across all API routes
- [ ] Add error codes for common scenarios
- [ ] Implement error logging middleware

**Files to Refactor**:

```
src/lib/api-auth.ts          - AuthError handling
src/lib/api-utils.ts         - Response helpers
src/app/api/**/route.ts      - All API routes
src/middleware.ts            - Error middleware
```

**Implementation**:

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super('AUTH_FAILED', 401, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', 400, message);
  }
}
```

**Priority 2: Type Annotations**

- [ ] Add return types to all functions
- [ ] Remove `any` types
- [ ] Add strict null checks
- [ ] Enable strict mode in tsconfig.json

---

### 2.2 Code Duplication Removal

#### Duplicated Patterns Identified

**1. API Error Handling** (Found in 20+ files)

```typescript
// Current (duplicated in every route)
catch (error: any) {
  if (error instanceof AuthError || error?.statusCode === 401) {
    return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
  }
  if (error?.statusCode === 403) {
    return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
  }
  return NextResponse.json({ success: false, error: error.message }, { status: 500 })
}
```

**Refactored Solution**:

```typescript
// src/lib/api-error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Unknown error
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
    { status: 500 }
  );
}

// Usage in routes
catch (error) {
  return handleApiError(error);
}
```

**2. Database Query Patterns** (Found in 15+ files)

```typescript
// Current (duplicated)
const items = await prisma.invoice.findMany({
  where: { companyId },
  include: { customer: true, lineItems: true },
});
const total = await prisma.invoice.count({ where: { companyId } });
```

**Refactored Solution**:

```typescript
// src/lib/db-helpers.ts
export async function paginatedQuery<T>(
  model: any,
  where: any,
  page: number,
  limit: number,
  include?: any
) {
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    model.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

### 2.3 Function Refactoring

#### Complex Functions to Refactor

**1. Dashboard API** (`src/app/api/dashboard/route.ts`)

- **Current**: 200+ lines, multiple responsibilities
- **Issues**: Hard to test, mixes data fetching with transformation
- **Refactor**: Split into service functions

**Before**:

```typescript
// 200+ line function doing everything
export async function GET(request: NextRequest) {
  // ... 50 lines of auth checks
  // ... 100 lines of data fetching
  // ... 50 lines of data transformation
}
```

**After**:

```typescript
// src/lib/dashboard-service.ts
export async function getDashboardData(params: DashboardParams) {
  const [metrics, arAging, apAging, monthlyData, vatData] = await Promise.all([
    getMetrics(),
    getARAging(),
    getAPAging(),
    getMonthlyData(params.year),
    getMonthlyVatData(params.year),
  ]);

  return transformDashboardData({
    metrics,
    arAging,
    apAging,
    monthlyData,
    vatData,
  });
}
```

**2. Invoice Posting** (`src/app/api/invoices/route.ts`)

- **Current**: GL posting logic mixed with invoice creation
- **Issues**: Transaction handling, validation mixed with business logic
- **Refactor**: Extract to `invoice-service.ts`

**3. VAT Calculations** (multiple files)

- **Current**: Scattered across components and API routes
- **Issues**: Inconsistent calculations, rounding errors
- **Refactor**: Centralize in `vat-service.ts`

---

## 🗄️ Phase 3: Database Query Optimization

### 3.1 N+1 Query Problems

#### Identified Issues

**1. Journal Entry with Lines** (Current)

```typescript
// N+1 problem: Fetches journal entry, then each line separately
const entry = await prisma.journalEntry.findUnique({ where: { id } });
const lines = await prisma.journalLine.findMany({ where: { entryId: id } });
// Also fetches related data for each line
for (const line of lines) {
  line.account = await prisma.chartOfAccount.findUnique({
    where: { id: line.accountId },
  });
}
```

**Optimized Solution**:

```typescript
// Single query with includes
const entry = await prisma.journalEntry.findUnique({
  where: { id },
  include: {
    lines: {
      include: {
        account: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
    },
  },
});
```

**2. Invoice with Customer and Line Items**

```typescript
// Current: Multiple queries
const invoice = await prisma.invoice.findUnique({ where: { id } });
const customer = await prisma.customer.findUnique({
  where: { id: invoice.customerId },
});
const items = await prisma.invoiceLineItem.findMany({
  where: { invoiceId: id },
});
```

**Optimized**:

```typescript
const invoice = await prisma.invoice.findUnique({
  where: { id },
  include: {
    customer: {
      select: {
        id: true,
        code: true,
        name: true,
        taxId: true,
      },
    },
    lineItems: {
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    },
  },
});
```

### 3.2 Missing Indexes

#### Recommended Indexes

```sql
-- Performance indexes for common queries

-- Journal entries
CREATE INDEX IF NOT EXISTS "JournalEntry.date_idx" ON "JournalEntry"(date);
CREATE INDEX IF NOT EXISTS "JournalEntry.company_idx" ON "JournalEntry"("companyId");
CREATE INDEX IF NOT EXISTS "JournalEntry.date_company_idx" ON "JournalEntry"(date, "companyId");

-- Invoices
CREATE INDEX IF NOT EXISTS "Invoice.customer_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice.status_idx" ON "Invoice"(status);
CREATE INDEX IF NOT EXISTS "Invoice.date_idx" ON "Invoice"(date);
CREATE INDEX IF NOT EXISTS "Invoice.customer_status_idx" ON "Invoice"("customerId", status);

-- Receipts
CREATE INDEX IF NOT EXISTS "Receipt.customer_idx" ON "Receipt"("customerId");
CREATE INDEX IF NOT EXISTS "Receipt.date_idx" ON "Receipt"(date);

-- Payments
CREATE INDEX IF NOT EXISTS "Payment.vendor_idx" ON "Payment"("vendorId");
CREATE INDEX IF NOT EXISTS "Payment.date_idx" ON "Payment"(date);

-- VAT Records
CREATE INDEX IF NOT EXISTS "VatRecord.taxYear_idx" ON "VatRecord"("taxYear");
CREATE INDEX IF NOT EXISTS "VatRecord.taxYear_month_idx" ON "VatRecord"("taxYear", "taxMonth");
CREATE INDEX IF NOT EXISTS "VatRecord.type_idx" ON "VatRecord"(type);

-- Chart of Accounts
CREATE INDEX IF NOT EXISTS "ChartOfAccount.type_idx" ON "ChartOfAccount"(type);
CREATE INDEX IF NOT EXISTS "ChartOfAccount.parent_idx" ON "ChartOfAccount"("parentId");
CREATE INDEX IF NOT EXISTS "ChartOfAccount.active_idx" ON "ChartOfAccount"("isActive");

-- Stock Balances
CREATE INDEX IF NOT EXISTS "StockBalance.product_idx" ON "StockBalance"("productId");
CREATE INDEX IF NOT EXISTS "StockBalance.warehouse_idx" ON "StockBalance"("warehouseId");

-- Stock Movements
CREATE INDEX IF NOT EXISTS "StockMovement.product_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement.date_idx" ON "StockMovement"(date);
```

### 3.3 Query Optimization Service

**Create `src/lib/db-optimizer.ts`**:

```typescript
import { Prisma } from '@prisma/client';

// Optimized query builders
export class QueryOptimizer {
  // Efficient pagination with cursor
  static async cursorPagination<T>(
    model: any,
    params: {
      where?: any;
      orderBy?: any;
      cursor?: string;
      take?: number;
    }
  ) {
    return model.findMany({
      ...params,
      // Use cursor for O(1) pagination
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : 0,
    });
  }

  // Batch loading to avoid N+1
  static async batchLoad<T>(
    items: T[],
    loader: (ids: string[]) => Promise<any[]>
  ) {
    const ids = items.map((item: any) => item.id);
    const loaded = await loader(ids);
    const map = new Map(loaded.map((item) => [item.id, item]));
    return items.map((item: any) => map.get(item.id));
  }

  // Select only needed fields
  static selectFields(fields: string[]) {
    return Prisma.validator<any>()({
      select: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    });
  }
}
```

---

## ⚡ Phase 4: API Performance Optimization

### 4.1 Response Time Improvements

#### Current API Performance (from logs)

| Endpoint            | Current Time | Target  | Status        |
| ------------------- | ------------ | ------- | ------------- |
| GET /api/dashboard  | ~800ms       | < 200ms | 🔴 Needs Work |
| GET /api/invoices   | ~500ms       | < 200ms | 🟡 Close      |
| POST /api/invoices  | ~1200ms      | < 500ms | 🔴 Needs Work |
| GET /api/reports/\* | ~2000ms      | < 500ms | 🔴 Needs Work |

#### Optimization Strategies

**1. Dashboard API - Parallel Queries**

```typescript
// Before: Sequential queries (800ms)
const metrics = await getMetrics();
const arAging = await getARAging();
const apAging = await getAPAging();

// After: Parallel queries (200ms)
const [metrics, arAging, apAging] = await Promise.all([
  getMetrics(),
  getARAging(),
  getAPAging(),
]);
```

**2. Invoice API - Selective Fields**

```typescript
// Before: Fetch all columns
const invoices = await prisma.invoice.findMany();

// After: Fetch only needed columns
const invoices = await prisma.invoice.findMany({
  select: {
    id: true,
    invoiceNo: true,
    date: true,
    customerId: true,
    totalAmount: true,
    status: true,
    // Exclude large JSON fields
  },
});
```

**3. Reports API - Caching**

```typescript
// Add Redis caching for expensive reports
const cachedReport = await redis.get(`report:${type}:${year}:${month}`);
if (cachedReport) {
  return JSON.parse(cachedReport);
}

const report = await generateReport(type, year, month);
await redis.setex(
  `report:${type}:${year}:${month}`,
  3600,
  JSON.stringify(report)
);
```

### 4.2 API Response Compression

**Add to `next.config.ts`**:

```typescript
module.exports = {
  compress: true, // Enable gzip compression
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
};
```

---

## 🧪 Phase 5: Testing Strategy Shift

### 5.1 Test Pyramid Adjustment

**Current**: Heavy E2E focus (55 E2E tests, 772 unit tests) **Target**: More
unit/integration, fewer E2E

**Shift**:

```
Before:        After:
E2E:     40%   →   E2E:     20%
Integration: 20%  →   Integration: 40%
Unit:      40%  →   Unit:      40%
```

### 5.2 Headless Test Execution

**Benefits**:

- ⚡ 3-5x faster execution
- 💰 Lower CI/CD costs
- 🔄 More reliable (no GUI issues)
- 📊 Better resource utilization

**Implementation**:

```bash
# All tests run headless by default
bun run test:e2e                    # Headless
bun run test:smoke                  # Headless
bun run test:quick                  # Headless

# Debug with headed mode if needed
HEADED=true bun run test:e2e       # With browser UI
```

### 5.3 API Testing Focus

**Create dedicated API test suite**:

```typescript
// tests/api/invoices-api.test.ts
import { test, expect } from '@playwright/test';

test.describe('Invoices API', () => {
  test('POST /api/invoices - creates invoice', async ({ request }) => {
    const response = await request.post('/api/invoices', {
      data: {
        customerId: 'test-customer-id',
        date: '2026-03-17',
        lineItems: [{ productId: 'prod-1', quantity: 2, unitPrice: 1000 }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });

  test('GET /api/invoices - returns paginated list', async ({ request }) => {
    const response = await request.get('/api/invoices?page=1&limit=10');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toHaveProperty('total');
  });
});
```

---

## 📊 Phase 6: Performance Monitoring

### 6.1 Database Query Logging

**Enable Prisma query logging**:

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log:
    process.env.LOG_QUERIES === 'true'
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
        ]
      : ['error'],
});

// Log slow queries
if (process.env.LOG_QUERIES === 'true') {
  prisma.$on('query' as any, (e: any) => {
    if (e.duration > 1000) {
      console.log('⚠️ Slow Query:', e.query, `(${e.duration}ms)`);
    }
  });
}
```

### 6.2 API Response Time Tracking

**Create `src/lib/performance-monitor.ts`**:

```typescript
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static trackEndpoint(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(endpoint)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  static getStats(endpoint: string) {
    const measurements = this.metrics.get(endpoint) || [];
    if (measurements.length === 0) return null;

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  static getAllStats() {
    const stats: Record<string, any> = {};
    this.metrics.forEach((_, endpoint) => {
      stats[endpoint] = this.getStats(endpoint);
    });
    return stats;
  }
}
```

**Usage in API routes**:

```typescript
export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
    // ... API logic
    const data = await fetchData();

    const duration = Date.now() - start;
    PerformanceMonitor.trackEndpoint('/api/invoices', duration);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const duration = Date.now() - start;
    PerformanceMonitor.trackEndpoint('/api/invoices', duration);
    throw error;
  }
}
```

---

## 📈 Phase 7: Implementation Timeline

### Week 1: Foundation

- [ ] Enable headless testing by default
- [ ] Create error handling utilities
- [ ] Set up performance monitoring
- [ ] Add database indexes

### Week 2: Code Quality

- [ ] Refactor API error handling (20 files)
- [ ] Create helper functions for common patterns
- [ ] Add type annotations to critical functions
- [ ] Remove code duplication

### Week 3: Database Optimization

- [ ] Fix N+1 query issues
- [ ] Optimize slow queries
- [ ] Add query logging
- [ ] Benchmark improvements

### Week 4: Testing & Validation

- [ ] Run full test suite with headless mode
- [ ] Validate performance improvements
- [ ] Update documentation
- [ ] Team training

---

## 🎯 Success Metrics

### Performance Targets

| Metric               | Current | Target  | Deadline |
| -------------------- | ------- | ------- | -------- |
| **Avg API Response** | ~800ms  | < 200ms | Week 3   |
| **Database Queries** | ~50ms   | < 20ms  | Week 3   |
| **Test Execution**   | ~20min  | < 10min | Week 1   |
| **Code Duplication** | ~15%    | < 5%    | Week 2   |
| **Type Coverage**    | ~70%    | > 95%   | Week 2   |

### Quality Targets

| Metric                 | Current | Target |
| ---------------------- | ------- | ------ |
| **Any types**          | ~150    | < 20   |
| **Unhandled errors**   | ~25     | 0      |
| **N+1 queries**        | ~12     | 0      |
| **Slow queries (>1s)** | ~8      | < 2    |
| **Test reliability**   | 85%     | > 98%  |

---

## 📚 Additional Resources

### Tools to Install

```bash
# Database query analyzer
bun add -D @prisma/extension-query-log

# Performance monitoring
bun add -D clinic

# Type checking
bun add -D tsd

# Code quality
bun add -D eslint-plugin-import
```

### Recommended Reading

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js API Routes Optimization](https://nextjs.org/docs/api-routes/creating-api-routes)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

---

## ✅ Checklist

### Before Starting

- [ ] Backup database
- [ ] Create feature branch
- [ ] Run baseline tests
- [ ] Document current performance

### During Refactoring

- [ ] Test after each change
- [ ] Update tests for refactored code
- [ ] Document breaking changes
- [ ] Monitor query performance

### After Completion

- [ ] Full test suite passes
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Team trained on new patterns

---

**Last Updated**: 2026-03-17 **Owner**: Development Team **Status**: Ready to
Start
