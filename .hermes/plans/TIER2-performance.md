# TIER2 Performance Optimization Plan

**Project:** Thai Accounting ERP (Keerati) **Generated:** 2026-05-01 **Branch:**
dev/performance-framework **Stack:** Next.js 16 + Prisma v6 + TypeScript + Bun

---

## Executive Summary

This plan addresses performance optimization across 5 critical areas:

1. **Next.js Bundle** (webpack, not Turbopack)
2. **Prisma Database** (280+ models, N+1 queries, indexes)
3. **TanStack Query & Zustand** (client state management)
4. **Component Architecture** (large files, code splitting)
5. **Build & Runtime** (caching, memory leaks)

**Build Status:** Compiles successfully (22.3s) with 126 routes **Static Size:**
4.1MB `.next/static` — moderate, improvable

---

## 1. Next.js Bundle Analysis

### Current State

- **Bundler:** webpack (not Turbopack)
- **Build Time:** 22.3s (7 workers)
- **Static Output:** 4.1MB
- **Route Count:** 126 routes (all dynamic server routes)

### Issues Found

| Issue                                                      | Severity | Location                |
| ---------------------------------------------------------- | -------- | ----------------------- |
| All 126 routes are `ƒ (Dynamic)` — no static generation    | Medium   | All routes              |
| Large chunk files (4925: 454KB, 4bd1b: 198KB, 8961: 227KB) | High     | `.next/static/chunks/`  |
| `page.tsx` imports 50+ components at module level          | High     | `src/app/page.tsx:1-86` |
| No route-based code splitting (SPA pattern)                | High     | Hybrid SPA architecture |
| `next/image` not used — direct `<img>` possible            | Low      | `src/middleware.ts:235` |

### Action Items

```typescript
// 1. Enable Turbopack (10x faster builds)
nextConfig = {
  // Replace --webpack with --turbopack in build script
  // next dev --turbopack
}

// 2. Dynamic imports for large page components
const Dashboard = dynamic(() => import('@/components/dashboard/dashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

// 3. Lazy load module components in page.tsx
const MODULE_IMPORTS = {
  dashboard: () => import('@/components/dashboard/dashboard'),
  invoices: () => import('@/components/invoices/invoice-list'),
  // ... per module
};

// 4. Add generateStaticParams for docs pages
export async function generateStaticParams() {
  return [{ slug: 'getting-started' }, { slug: 'api-reference' }];
}
```

### Priority: HIGH — Component-Level Code Splitting

**File:** `src/app/page.tsx`

Current: All 50+ component imports at top level

```typescript
import { Dashboard } from '@/components/dashboard/dashboard';
import { InvoiceList } from '@/components/invoices/invoice-list';
// ... 48 more imports always loaded
```

**Fix:** Lazy load per activeModule

```typescript
const MODULE_MAP = {
  dashboard: lazy(() => import('@/components/dashboard/dashboard')),
  invoices: lazy(() => import('@/components/invoices/invoice-list')),
  // ... only loaded when accessed
};

function renderModule() {
  const Component = MODULE_MAP[activeModule];
  return <Suspense fallback={<ModuleSkeleton />}><Component /></Suspense>;
}
```

---

## 2. Prisma Database Optimization

### Current State

- **Models:** 2809 lines (280+ models)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Indexes:** Partial (migrations exist, some in schema)
- **Query Optimizer:** Exists (`db-optimizer.ts`) but underutilized

### Schema Analysis

| Model         | Lines | Relations | Indexes                    |
| ------------- | ----- | --------- | -------------------------- |
| JournalEntry  | ~40   | 10+       | 4 (`@@index`)              |
| Invoice       | ~50   | 8         | 3                          |
| InvoiceLine   | ~25   | 2         | 1                          |
| Customer      | ~30   | 5         | 1 (`@@index([deletedAt])`) |
| Product       | ~40   | 12        | 1                          |
| StockMovement | ~35   | 5         | 0                          |

### Issues Found

| Issue                                          | Severity | Impact                     |
| ---------------------------------------------- | -------- | -------------------------- |
| Missing composite indexes for common queries   | High     | Slow list views            |
| N+1 queries in service layer (no `include`)    | High     | 10-100x slower             |
| No query caching layer                         | Medium   | Repeated expensive queries |
| SQLite lacks PostgreSQL-specific optimizations | Medium   | Production perf            |
| Slow query threshold: 100ms (too aggressive)   | Low      | Log spam                   |

### Action Items

#### 2.1 Add Missing Indexes (PostgreSQL)

```sql
-- Add to prisma/schema-postgres.prisma or via migration

-- Invoice common query pattern
@@index([customerId, status, invoiceDate])
@@index([invoiceDate, status])

-- JournalEntry for GL reports
@@index([date, status])
@@index([documentType, documentId])

-- Product for inventory lists
@@index([isInventory, isActive, category])
```

#### 2.2 Fix N+1 Queries in Invoice List

**File:** `src/app/api/invoices/route.ts:116-131`

Current (N+1 risk if lines grow):

```typescript
prisma.invoice.findMany({
  where,
  include: {
    customer: true,
    lines: true, // Could cause N+1 with large line counts
    _count: { select: { comments: true } },
  },
});
```

**Fix:** Add explicit limit and order, consider separate query for counts

```typescript
prisma.invoice.findMany({
  where,
  include: {
    customer: { select: { id: true, name: true, code: true } }, // Minimal fields
    lines: { select: { id: true, quantity: true, amount: true } }, // Minimal fields
  },
  orderBy: { invoiceDate: 'desc' },
  skip,
  take: limit,
});
```

#### 2.3 Enable Query Result Caching

```typescript
// src/lib/db-helpers.ts - extend existing pattern
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const queryCache = new Map<string, { data: any; expiry: number }>();

async function cachedFindMany<T>(
  model: keyof PrismaClient,
  args: Prisma.FindManyArgs,
  cacheKey: string
): Promise<T[]> {
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.data;

  const result = await prisma[model].findMany(args);
  queryCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
  return result;
}
```

#### 2.4 Connection Pool Tuning (PostgreSQL)

```typescript
// prisma/schema-postgres.prisma or .env
DATABASE_URL = 'postgresql://.../?connection_limit=20&pool_timeout=10';
```

### Priority: HIGH — Database Indexes & N+1

**Schema Check Required:**

- `prisma/schema-prisma` vs `schema-postgres.prisma` — ensure indexes match
- Invoice list page hits `customerId + status + invoiceDate` — needs composite
  index

---

## 3. TanStack Query & Zustand Analysis

### Current State

**TanStack Query (providers.tsx):**

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});
```

**Zustand Stores:** | Store | Size | Persistence |
|-------|------|-------------| | `auth-store.ts` | 7.1KB | `persist` with
partialize | | `preferences-store.ts` | 8.2KB | `persist` | | `theme-store.ts` |
7.4KB | `persist` |

### Issues Found

| Issue                                               | Severity | Impact                           |
| --------------------------------------------------- | -------- | -------------------------------- |
| `staleTime: 60s` too short for rarely-changing data | Medium   | Unnecessary refetches            |
| No query deduplication configuration                | Medium   | Multiple components = same query |
| `refetchOnWindowFocus: false` good for SPA          | Low      | —                                |
| Zustand stores persist to localStorage              | Medium   | Large state = slow hydration     |
| No prefetching of likely-needed data                | Medium   | Wait for user action             |

### Action Items

#### 3.1 Optimize TanStack Query Config

```typescript
// src/components/providers.tsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase for stable reference data
      staleTime: 5 * 60 * 1000, // 5 minutes for lists
      gcTime: 30 * 60 * 1000, // 30 minutes cache (renamed from cacheTime)
      refetchOnWindowFocus: false, // Good for SPA
      refetchOnReconnect: true, // Yes for accuracy

      // Add retry logic
      retry: (failureCount, error) => {
        if (error.status === 401) return false; // Don't retry auth
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation failed:', error);
        toast.error('ดำเนินการไม่สำเร็จ');
      },
    },
  },
});
```

#### 3.2 Prefetch Dashboard Data

```typescript
// src/app/page.tsx - on mount

useEffect(() => {
  if (status === 'authenticated') {
    // Prefetch commonly needed data
    queryClient.prefetchQuery({
      queryKey: ['dashboard-stats'],
      queryFn: fetchDashboardStats,
      staleTime: 2 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: ['recent-invoices'],
      queryFn: () => fetchInvoices({ limit: 5 }),
      staleTime: 2 * 60 * 1000,
    });
  }
}, [status]);
```

#### 3.3 Optimize Zustand Persistence

```typescript
// src/stores/auth-store.ts

persist(
  (set, get) => ({
    // ... state
  }),
  {
    name: 'thai-accounting-auth',
    // Only persist essential data, not derived state
    partialize: (state) => ({
      user: state.user ? { id: state.user.id, role: state.user.role } : null,
      isAuthenticated: state.isAuthenticated,
      // NOT permissions - always fetch fresh from API
    }),
    // Skip hydration for fast initial load
    skipHydration: true,
  }
);
```

### Priority: MEDIUM — Query Configuration

---

## 4. Component Architecture

### Current State

Largest components (lines): | File | Lines | Module | |------|-------|--------|
| `purchase-form.tsx` | 1339 | Purchases | | `invoice-list.tsx` | 1195 |
Invoices | | `receipt-form.tsx` | 1184 | Receipts | | `invoice-edit-dialog.tsx`
| 1134 | Invoices | | `invoice-form.tsx` | 947 | Invoices | | `dashboard.tsx` |
942 | Dashboard |

### Issues Found

| Issue                                                  | Severity | Impact                          |
| ------------------------------------------------------ | -------- | ------------------------------- |
| 6 components >900 lines — too large                    | High     | Hard to maintain, slow to parse |
| 20+ components >500 lines                              | Medium   | —                               |
| `invoice-list.tsx` (1195 lines) has inline filters     | High     | Re-render on any state change   |
| No virtualization for large lists                      | High     | Slow with 100+ items            |
| Components import heavy libs (framer-motion, recharts) | Medium   | Larger bundles                  |

### Action Items

#### 4.1 Extract Filter Components

**Current:** `invoice-list.tsx` has inline filter logic **Fix:** Extract to
`src/components/filters/invoice-filters.tsx`

```typescript
// Externalize filters to prevent re-render cascade
export function InvoiceFilters({
  onFilterChange
}: { onFilterChange: (filters: InvoiceFilters) => void }) {
  const [localFilters, setLocalFilters] = useState(INITIAL_FILTERS);

  // Debounce filter changes
  const debouncedFilter = useDebouncedCallback(
    (filters) => onFilterChange(filters),
    300
  );

  return (/* filter UI */);
}
```

#### 4.2 Add List Virtualization

```typescript
// For invoice-list.tsx with 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // row height
    overscan: 10,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <InvoiceRow key={virtualRow.key} invoice={invoices[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

#### 4.3 Split Large Components

**invoice-list.tsx (1195 lines) → break into:**

- `invoice-list.tsx` (200 lines) — container + state
- `invoice-table.tsx` (400 lines) — table rendering
- `invoice-filters.tsx` (200 lines) — filter UI
- `invoice-pagination.tsx` (100 lines) — pagination
- `use-invoice-list.ts` (295 lines) — data fetching hook

### Priority: HIGH — Component Splitting

---

## 5. Build, Caching & Memory

### Current State

| Item          | Value                     | Assessment          |
| ------------- | ------------------------- | ------------------- |
| Build Command | `next build --webpack`    | Slow (22s)          |
| Output        | Standalone (4.1MB static) | OK                  |
| Dev Server    | `next dev -p 3000`        | Standard            |
| Build Cache   | `.next/cache` exists      | Used                |
| Turbopack     | NOT used                  | Missed optimization |

### Issues Found

| Issue                                          | Severity | Impact                       |
| ---------------------------------------------- | -------- | ---------------------------- |
| Not using Turbopack in dev                     | High     | 10x slower builds            |
| No build output analysis                       | Medium   | Don't know chunk composition |
| Prisma client generated at build time          | Medium   | SLOW                         |
| Build copies entire node_modules to standalone | Medium   | 135 packages installed       |

### Action Items

#### 5.1 Enable Turbopack (Dev)

```json
// package.json scripts
{
  "dev": "next dev -p 3002 --turbopack",
  "dev:turbopack": "next dev --turbopack"
}
```

#### 5.2 Add Bundle Analysis

```bash
# Install
npm install --save-dev @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

# Run
ANALYZE=true npm run build
```

#### 5.3 Prisma Build Optimization

```bash
# Pre-generate Prisma client, don't regenerate at build
# package.json
"build": "npm run db:select-schema && prisma generate && next build"
```

#### 5.4 Memory Leak Prevention

```typescript
// src/app/page.tsx - cleanup event listeners

useEffect(() => {
  const handlePopState = () => {
    /* ... */
  };
  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('popstate', handlePopState);
    // Also cleanup eventBus subscriptions
    eventBus.off(EVENTS.INVOICE_VIEW_DETAIL, handleViewDetail);
  };
}, []);

// src/components/providers.tsx - cleanup QueryClient
useEffect(() => {
  return () => {
    queryClient.clear(); // Cancel in-flight queries on unmount
  };
}, []);
```

### Priority: MEDIUM — Build Pipeline

---

## 6. Image & Font Optimization

### Current State

- **next/image:** Not used (`src/middleware.ts:235` pattern matching only)
- **Fonts:** Likely default Next.js font loading
- **Static Images:** None detected in components

### Action Items

#### 6.1 Use next/image for Any User Uploads

```typescript
// If rendering uploaded images or PDFs
import Image from 'next/image';

<Image
  src={documentAttachment.url}
  alt="Document"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={documentAttachment.thumbnailBase64}
/>
```

#### 6.2 Font Optimization

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'thai'],
  display: 'swap',
  preload: true,
});

// Thai-specific: consider Noto Sans Thai
// const notoSansThai = GoogleFont({
//   families: { 'Noto Sans Thai': [400, 500, 700] },
// });
```

### Priority: LOW — Minimal Impact

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

- [ ] Enable Turbopack in dev (`--turbopack`)
- [ ] Increase TanStack Query `staleTime` to 5min
- [ ] Add bundle analyzer
- [ ] Add missing composite indexes to schema

### Phase 2: Component Optimization (3-5 days)

- [ ] Split `invoice-list.tsx` into sub-components
- [ ] Extract `InvoiceFilters` to separate file
- [ ] Add `@tanstack/react-virtual` for large lists
- [ ] Lazy load all page.tsx module components

### Phase 3: Data Layer (2-3 days)

- [ ] Audit all `findMany` calls for N+1
- [ ] Add query result caching
- [ ] Optimize Zustand store persistence
- [ ] Add prefetching for dashboard

### Phase 4: Build Pipeline (1-2 days)

- [ ] Pre-generate Prisma client
- [ ] Add memory leak cleanup
- [ ] Implement build output analysis
- [ ] Configure standalone build optimization

---

## Key Files to Modify

| File                                       | Change                               |
| ------------------------------------------ | ------------------------------------ |
| `next.config.ts`                           | Add bundle analyzer, Turbopack flags |
| `package.json`                             | Update dev script with `--turbopack` |
| `src/app/page.tsx`                         | Lazy load modules, cleanup listeners |
| `src/components/providers.tsx`             | Optimize QueryClient, add cleanup    |
| `src/stores/auth-store.ts`                 | Reduce persisted state               |
| `src/components/invoices/invoice-list.tsx` | Split into sub-components            |
| `src/app/api/invoices/route.ts`            | Optimize include/select              |
| `prisma/schema-sqlite.prisma`              | Add composite indexes                |
| `prisma/schema-postgres.prisma`            | Add composite indexes                |

---

## Success Metrics

| Metric                          | Current       | Target             |
| ------------------------------- | ------------- | ------------------ |
| Build time (dev)                | ~22s          | <5s with Turbopack |
| Initial page load               | Unknown       | <3s on 3G          |
| Invoice list render (100 items) | Unknown       | <500ms             |
| Bundle size (main)              | ~4.1MB static | <3MB               |
| API response P95                | Unknown       | <500ms             |
| Memory (dev server)             | Unknown       | <500MB             |

---

## Notes

- **SPA Pattern:** This app uses hybrid SPA (client-side routing via
  `activeModule` state), NOT standard Next.js file routing. This affects code
  splitting opportunities.
- **React Strict Mode:** Disabled (`reactStrictMode: false` in next.config.ts) —
  could re-enable for leak detection.
- **Standalone Output:** Already using standalone mode for Docker deployment.
- **Schema Loader:** `prisma/schema-loader.js` selects schema at build time —
  ensure indexes exist in both SQLite and PostgreSQL schemas.
