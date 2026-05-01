# Thai ACC Framework Transformation - Master Plan

> Created: 2026-05-01
> Updated: 2026-05-01 (Tier 2 Research Complete)
> Status: Detailed for Implementation
> Target: Transform monolithic Thai ACC ERP into plugin-based framework

---

## Master Overview

### Vision
Transform Thai ACC from a monolithic ERP (~172k lines) into a lean, plugin-based framework that enables surgical module addition/removal with minimum code changes.

### Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| **Architecture** | Monolithic SPA | Plugin-based modular |
| **Module Loading** | All 43 modules eager-loaded | Lazy-load by route |
| **Form Components** | Duplicated per module | Generic `BaseForm<T>` |
| **Data Tables** | Duplicated per module | Generic `DataTable<T>` |
| **API Routes** | Per-module hardcoded | Factory pattern |
| **Module Registration** | 6 manual touch points | Auto-discovery |
| **Bundle Size** | Full bundle on load | Code-split per module |

### Success Metrics
- **Bundle Reduction**: Target 40% smaller initial JS
- **Code Deduplication**: Reduce form/table code by 60%
- **Module Addition**: New module in ~200 lines vs current ~2000+
- **Migration Safety**: Zero breaking changes to existing functionality

---

## Phase 1: Foundation & Framework Core

### 1.1 Module Registry System

**Description**: Create auto-discovery module registry replacing manual 6-point registration.

**Technique/Technology**:
- `src/lib/module-registry.ts` - centralized registry with decorator-based registration
- Type-safe module manifest interface
- Lazy component loading via `React.lazy()`

**Cautions**:
- Must maintain backward compatibility with existing modules during transition
- Registry initialization order matters for dependencies

**Acceptance Criteria**:
- [ ] Registry exports `registerModule()`, `getModule()`, `listModules()`
- [ ] Manifest includes: id, name, icon, routes, permissions, dependencies
- [ ] Sidebar reads from registry instead of hardcoded menu groups
- [ ] `page.tsx` renderModule() migrates to registry lookup
- [ ] TypeScript strict mode passes

**Files to Create**:
- `/src/lib/module-registry.ts` (new)

**Files to Modify**:
- `/src/app/page.tsx` (remove hardcoded module list, use registry)
- `/src/components/layout/keerati-sidebar.tsx` (read from registry)
- `/src/lib/events.ts` (add module lifecycle events)

**Tier 2 Detail - File Inventory**:
| File | Lines | Purpose | Change Type |
|------|-------|---------|-------------|
| `/src/app/page.tsx` | 604 | 43 module imports + switch statement | Modify - replace switch with registry |
| `/src/components/layout/keerati-sidebar.tsx` | ~400 | Hardcoded menu items | Modify - read from registry |
| `/src/lib/module-registry.ts` | NEW | Auto-discovery registry | Create |

**Tier 2 Detail - Technical Decisions**:
1. **Registry Pattern**: Use file-system based discovery scanning `/src/components/*/` for module manifests
2. **Manifest Format**: Each module exports `manifest` object with id, label, icon, permissions, component
3. **Lazy Loading**: Use Next.js `dynamic()` for heavy components (reports, payroll)
4. **Backward Compat**: Wrap existing modules in manifest format during transition

**Tier 2 Detail - Workflow**:
```
New Module Created
       │
       ▼
┌─────────────────────────────────┐
│ 1. Create component in /components/<module>/
│ 2. Export manifest from <module>/index.ts
│ 3. Module Registry auto-discovers on init
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Sidebar: reads from registry
│ Page.tsx: uses registry.getComponent(moduleId)
│ Permissions: derived from manifest
└─────────────────────────────────┘
```

---

### 1.2 BaseForm<T> Generic Component

**Description**: Consolidate invoice/purchase/receipt/quotation forms into single generic component.

**Technique/Technology**:
- TypeScript generics: `BaseForm<T extends DocumentFormData>`
- Shared field schema via Zod
- Configurable validation rules per document type
- Line item editor embedded with VAT/WHT calculations

**Cautions**:
- Preserve all existing validation logic (period locking, WHT auto-detect, document numbering)
- Maintain Satang/Baht conversion layer
- Keep CSRF and auth middleware intact

**Acceptance Criteria**:
- [ ] `BaseForm<T>` accepts document type and initial data
- [ ] Invoice, Purchase, Receipt, Quotation render via BaseForm
- [ ] Line item operations (add/remove/edit) work identically across types
- [ ] VAT and WHT calculations match current per-module logic
- [ ] Form submission produces same API payload structure

**Files to Create**:
- `/src/components/forms/base-form.tsx` (new)
- `/src/components/forms/line-item-editor.tsx` (new)
- `/src/components/forms/document-types.ts` (shared types)

**Files to Modify**:
- `/src/components/invoices/invoice-form.tsx` (use BaseForm)
- `/src/components/purchases/purchase-form.tsx` (use BaseForm)
- `/src/components/receipts/receipt-form.tsx` (use BaseForm)
- `/src/components/quotations/quotation-form.tsx` (use BaseForm)

**Tier 2 Detail - File Inventory**:
| File | Lines | Identical Logic | Unique Logic |
|------|-------|-----------------|--------------|
| `/src/components/invoices/invoice-form.tsx` | 889 | Line items (100%), customer select (90%), totals calc (95%) | 5 subtypes (TAX_INVOICE, RECEIPT, DELIVERY_NOTE, CREDIT_NOTE, DEBIT_NOTE), subtype-specific numbering |
| `/src/components/purchases/purchase-form.tsx` | ~800 | Line items (100%), vendor select (90%), totals calc (95%) | WHT rates (3%, 5%, service type), GRN linking |
| `/src/components/receipts/receipt-form.tsx` | ~600 | Totals calc (80%) | Invoice allocation UI, payment method selection, partial payment logic |
| `/src/components/quotations/quotation-form.tsx` | ~700 | Line items (90%), customer select (90%) | Expiry date, convert-to-invoice flow |

**Tier 2 Detail - Identical Patterns (Extract to BaseForm)**:
```
Shared Structure (100%):
- Line item interface: { id, productId, description, quantity, unit, unitPrice, discount, vatRate, vatAmount, amount }
- Line item grid: product select, description input, qty, unit, unitPrice, discount%, vatRate, amount
- Line calculations: beforeDiscount = qty * unitPrice, discountAmt = beforeDiscount * discount%, afterDiscount = beforeDiscount - discountAmt, vatAmt = afterDiscount * vatRate%, amount = afterDiscount
- Add/remove line buttons
- Product autocomplete

Shared UI (90%):
- Customer/Vendor select dropdown
- Date picker (invoiceDate, dueDate)
- Reference/PO number inputs
- Notes textarea
- Totals section: subtotal, discount, vat, grand total, wht, net

Shared Validation (95%):
- Customer/vendor required
- At least 1 line item
- Each line: description required, qty > 0, unitPrice >= 0
```

**Tier 2 Detail - Technical Decisions**:
1. **Generic Interface**: `BaseForm<T extends { lines: LineItem[], type: string }>`
2. **Config Object**: Pass module-specific config (customer vs vendor, WHT rules, document prefix)
3. **Zod Schema Builder**: `buildDocumentSchema(type, lineSchema)` generates appropriate validation
4. **WHT Auto-Detect**: Delegate to service function that checks product.incomeType

---

### 1.3 DataTable<T> Generic Component

**Description**: Replace per-module table implementations with generic DataTable.

**Technique/Technology**:
- TypeScript generics: `DataTable<T extends TableRow>`
- Column definition as config array
- Sort/filter/pagination built-in
- Row action slots (edit/delete/view)

**Cautions**:
- Handle wide columns for Thai text (avoid truncation)
- Maintain current filter/search behavior
- Preserve row selection for bulk operations

**Acceptance Criteria**:
- [ ] `DataTable<T>` with column config prop
- [ ] Invoices, Purchases, Receipts, Quotations use DataTable
- [ ] Pagination, sorting, filtering work per current behavior
- [ ] Empty states match design.md patterns
- [ ] Export functionality preserved

**Files to Create**:
- `/src/components/data-table/data-table.tsx` (new)
- `/src/components/data-table/column-def.ts` (new)
- `/src/components/data-table/filters.ts` (new)

**Files to Modify**:
- `/src/components/invoices/invoice-list.tsx`
- `/src/components/purchases/purchase-list.tsx`
- `/src/components/receipts/receipt-list.tsx`
- `/src/components/quotations/quotation-list.tsx`

**Tier 2 Detail - File Inventory**:
| File | Lines | Identical Patterns |
|------|-------|---------------------|
| `/src/components/invoices/invoice-list.tsx` | 1042 | Search (100%), filters (100%), pagination (100%), status badges (100%), action buttons (100%), summary cards (80%) |
| `/src/components/purchases/purchase-list.tsx` | ~700 | Search (100%), filters (100%), pagination (100%), status badges (100%), action buttons (100%) |
| `/src/components/receipts/receipt-list.tsx` | ~600 | Search (100%), filters (100%), pagination (100%), status badges (100%), action buttons (100%) |
| `/src/components/quotations/quotation-list.tsx` | ~650 | Search (100%), filters (100%), pagination (100%), status badges (100%), action buttons (100%), expiry badge |

**Tier 2 Detail - Shared Column Config**:
```typescript
// Common column definition pattern
interface ColumnDef<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => ReactNode
}

// All lists share these columns:
- Document number (sortable, searchable)
- Date (sortable)
- Customer/Vendor name (filterable)
- Status (badge render)
- Total amount (right-aligned, sortable)
- Actions (edit, view, delete, print)
```

**Tier 2 Detail - Technical Decisions**:
1. **Column Config Array**: `<DataTable columns={invoiceColumns} data={invoices} />`
2. **Filter Presets**: Store filter combinations as named presets (e.g., "overdue", "pending")
3. **Server-side Pagination**: Pass `page`, `limit`, `sort`, `filter` to API
4. **Skeleton Loading**: Built-in loading state with configurable skeleton rows

---

### 1.4 LineItemEditor Consolidation

**Description**: Single LineItemEditor used across all document forms.

**Technique/Technology**:
- Shared component with product autocomplete
- VAT rate selector (0, 7, 10)
- Discount modes (amount or percent)
- WHT applicable flag

**Cautions**:
- Product autocomplete must filter by module context
- Unit and quantity handling must match current business logic

**Acceptance Criteria**:
- [ ] Single LineItemEditor in BaseForm
- [ ] Product search with current debounce behavior
- [ ] Automatic VAT calculation on rate change
- [ ] Discount application matches current logic
- [ ] Line totals update in real-time

**Files to Create**:
- `/src/components/forms/line-item-row.tsx` (new)

**Files to Modify**:
- `/src/components/forms/line-item-editor.tsx` (consolidate)

**Tier 2 Detail - Current Duplication Analysis**:
Current `invoice-form.tsx` (889 lines) contains embedded line item logic:
- Lines 107-249: Line state management and calculations
- Lines 551-704: Line item grid UI
- Lines 169-205: calculateLineTotals() function

This pattern is ~300 lines repeated in each form.

**Tier 2 Detail - Technical Decisions**:
1. **LineItemEditor Props**:
   ```typescript
   interface LineItemEditorProps {
     lines: InvoiceLine[]
     onChange: (lines: InvoiceLine[]) => void
     products: Product[]
     allowVatZero?: boolean
     allowWht?: boolean
   }
   ```
2. **Calculation Engine**: Extract `calculateLineTotals()` to `/src/lib/document-calc.ts`
3. **Product Autocomplete**: Debounced search, filters by product type per module context

---

### 1.5 API Factory Pattern

**Description**: Generic API handler factory for document CRUD operations.

**Technique/Technology**:
- `createDocumentHandler<T>(config: DocumentHandlerConfig)` factory
- Per-type hooks: `onBeforeCreate`, `onAfterCreate`, `validateDocument`
- Shared middleware: auth, CSRF, period lock, document numbering
- Zod schema generation from Prisma model

**Cautions**:
- Period locking must remain per-document-type (different rules for invoice vs receipt)
- WHT auto-detect logic is type-specific
- Document numbering prefixes vary by type

**Acceptance Criteria**:
- [ ] `createDocumentHandler()` accepts document type and returns Next.js route handlers
- [ ] Invoice, Purchase, Receipt, Quotation APIs use factory
- [ ] Period locking integrated via factory middleware
- [ ] Zod schemas generated from shared type definitions
- [ ] Satang/Baht conversion handled uniformly

**Files to Create**:
- `/src/lib/api-factory.ts` (new)
- `/src/lib/document-schemas.ts` (shared Zod schemas)

**Files to Modify**:
- `/src/app/api/invoices/route.ts` (use factory)
- `/src/app/api/purchases/route.ts` (use factory)
- `/src/app/api/receipts/route.ts` (use factory)
- `/src/app/api/quotations/route.ts` (use factory)

**Tier 2 Detail - File Inventory**:
| File | Lines | Identical Logic | Unique Logic |
|------|-------|-----------------|--------------|
| `/src/app/api/invoices/route.ts` | 345 | Auth (100%), CSRF (100%), period lock check (100%), doc number gen (100%), Satang conversion (100%) | 5 subtypes, WHT auto-detect from product.incomeType, journal posting |
| `/src/app/api/purchases/route.ts` | ~300 | Auth (100%), CSRF (100%), period lock check (100%), doc number gen (100%), Satang conversion (100%) | Vendor linking, different WHT rates (3%, 5%), GRN link |
| `/src/app/api/receipts/route.ts` | ~280 | Auth (100%), CSRF (100%), period lock check (100%), doc number gen (100%), Satang conversion (100%) | Invoice allocation, payment method |
| `/src/app/api/quotations/route.ts` | ~260 | Auth (100%), CSRF (100%), period lock check (100%), doc number gen (100%), Satang conversion (100%) | Expiry validation, convert-to-invoice |

**Tier 2 Detail - Identical Patterns**:
```typescript
// All 4 APIs share this exact pattern:
1. requireAuth() check
2. CSRF validation (unless BYPASS_CSRF=true)
3. Schema.parse(body)
4. checkPeriodStatus(date) - returns error if locked
5. generateDocNumber(type, prefix) - transaction-safe
6. prisma.model.create({ data: { ...bahtToSatang() } })
7. logCreate() audit
8. Return { ...satangToBaht(), customer: { name } }
```

**Tier 2 Detail - Technical Decisions**:
1. **Factory Config**:
   ```typescript
   interface DocumentHandlerConfig {
     model: 'Invoice' | 'PurchaseInvoice' | 'Receipt' | 'Quotation'
     typePrefixes: Record<string, string>
     lineModel: string
     extraFields?: Record<string, any>
     hooks?: {
       beforeCreate?: (data) => Promise<Data>
       afterCreate?: (result) => Promise<void>
     }
   }
   ```
2. **Schema Builder**: `buildDocumentSchema(linesSchema, typeEnum)` generates type-specific validation
3. **Middleware Chain**: Apply auth, CSRF, period lock as middleware array

---

## Phase 2: Buy-Side Document Migration

### 2.1 Invoice Module Refactor

**Description**: Migrate invoice to new framework (BaseForm + DataTable + API factory).

**Technique/Technology**:
- Migrate `invoice-list.tsx` to DataTable
- Migrate `invoice-form.tsx` to BaseForm
- Migrate `route.ts` to API factory

**Cautions**:
- Invoice has 5 subtypes (TAX_INVOICE, RECEIPT, DELIVERY_NOTE, CREDIT_NOTE, DEBIT_NOTE)
- Each subtype has different numbering prefix
- Period locking rules are document-type specific

**Acceptance Criteria**:
- [ ] Invoice list renders via DataTable
- [ ] Invoice form renders via BaseForm
- [ ] All 5 subtypes work correctly
- [ ] Document numbering generates correct prefix per type
- [ ] E2E tests pass for invoice CRUD

**Files to Modify**:
- `/src/components/invoices/invoice-list.tsx` (1042 lines → refactor to use DataTable)
- `/src/components/invoices/invoice-form.tsx` (889 lines → refactor to use BaseForm)
- `/src/app/api/invoices/route.ts` (345 lines → refactor to use API factory)
- `/src/components/invoices/invoice-edit-dialog.tsx`
- `/src/components/invoices/invoice-view-dialog.tsx`
- `/src/components/invoices/invoice-detail-page.tsx`

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose | Migration Target |
|------|-------|---------|------------------|
| `invoice-list.tsx` | 1042 | Main list view with filters, search, actions | DataTable<T> |
| `invoice-form.tsx` | 889 | Create/edit form with line items | BaseForm<T> |
| `invoice-edit-dialog.tsx` | ~200 | Edit dialog wrapper | BaseForm<T> wrapper |
| `invoice-view-dialog.tsx` | ~300 | View/read-only dialog | Shared viewer component |
| `invoice-detail-page.tsx` | ~400 | Full page detail view | No change (different pattern) |

**Tier 2 Detail - API Routes**:
- `GET /api/invoices` - List with pagination (page, limit, status, type, customerId, date range, search)
- `POST /api/invoices` - Create with validation
- `GET /api/invoices/[id]` - Get single
- `PATCH /api/invoices/[id]` - Update/post/cancel
- `DELETE /api/invoices/[id]` - Soft delete

**Tier 2 Detail - Prisma Models**:
```prisma
model Invoice {
  id, invoiceNo, invoiceDate, dueDate, customerId, type
  reference, poNumber, subtotal, vatRate, vatAmount
  totalAmount, discountAmount, discountPercent, withholdingRate
  withholdingAmount, netAmount, paidAmount, status
  createdById, notes, internalNotes, terms
  lines: InvoiceLine[]
  journalEntry: JournalEntry?
}
```

**Tier 2 Detail - Migration Sequence**:
```
1. Create /src/lib/document-schemas.ts with Invoice schema
2. Create /src/components/data-table/data-table.tsx
3. Refactor invoice-list.tsx to use DataTable (TEST)
4. Create /src/components/forms/base-form.tsx
5. Refactor invoice-form.tsx to use BaseForm (TEST)
6. Create /src/lib/api-factory.ts
7. Refactor /api/invoices/route.ts to use factory (TEST)
8. Run E2E tests for invoice CRUD
```

---

### 2.2 Purchase Module Refactor

**Description**: Migrate purchase invoice to framework.

**Technique/Technology**:
- Similar pattern to Invoice
- Additional fields: vendor, GRN link

**Cautions**:
- Purchase has different WHT rules (3% vs 5% vs service type)
- Vendor selection required vs customer for invoice

**Acceptance Criteria**:
- [ ] Purchase list renders via DataTable
- [ ] Purchase form renders via BaseForm
- [ ] Vendor selection works
- [ ] WHT rate defaults correctly per product type
- [ ] E2E tests pass for purchase CRUD

**Files to Modify**:
- `/src/components/purchases/purchase-list.tsx`
- `/src/components/purchases/purchase-form.tsx`
- `/src/app/api/purchases/route.ts`
- `/src/components/purchases/purchase-edit-dialog.tsx`
- `/src/components/purchases/purchase-view-dialog.tsx`

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose |
|------|-------|---------|
| `purchase-list.tsx` | ~700 | Main list view |
| `purchase-form.tsx` | ~800 | Create/edit with vendor select, line items |
| `purchase-edit-dialog.tsx` | ~200 | Edit wrapper |
| `purchase-view-dialog.tsx` | ~250 | View dialog |

**Tier 2 Detail - Unique Business Logic**:
1. **WHT Rates**: Purchase uses 3% (service), 5% (rent), vs Invoice 1-5%
2. **Vendor vs Customer**: Different entity types
3. **GRN Linking**: Can link to Goods Receipt Note

---

### 2.3 Receipt Module Refactor

**Description**: Migrate receipt (incoming payment) to framework.

**Technique/Technology**:
- Receipt links to invoice (partial or full payment)
- Payment method tracking

**Cautions**:
- Receipt must handle partial payment scenarios
- Payment method (cash, check, transfer) selection

**Acceptance Criteria**:
- [ ] Receipt list renders via DataTable
- [ ] Receipt form renders via BaseForm
- [ ] Invoice linking works for payment allocation
- [ ] Payment method selection works
- [ ] E2E tests pass

**Files to Modify**:
- `/src/components/receipts/receipt-list.tsx`
- `/src/components/receipts/receipt-form.tsx`
- `/src/app/api/receipts/route.ts`
- `/src/components/receipts/receipt-view-dialog.tsx`

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose |
|------|-------|---------|
| `receipt-list.tsx` | ~600 | Main list view |
| `receipt-form.tsx` | ~550 | Create/edit with invoice allocation |
| `receipt-view-dialog.tsx` | ~200 | View dialog |

**Tier 2 Detail - Unique Business Logic**:
1. **Invoice Allocation**: Multi-invoice payment allocation UI
2. **Payment Methods**: CASH, CHEQUE, TRANSFER, CREDIT
3. **Partial Payment**: remaining amount tracking

---

### 2.4 Quotation Module Refactor

**Description**: Migrate quotation (sales quote) to framework.

**Technique/Technology**:
- Quotation converts to invoice
- Expiry date tracking

**Cautions**:
- Quotation to Invoice conversion must maintain line items
- Expiry validation

**Acceptance Criteria**:
- [ ] Quotation list renders via DataTable
- [ ] Quotation form renders via BaseForm
- [ ] Convert-to-invoice works
- [ ] Expiry date validation works
- [ ] E2E tests pass

**Files to Modify**:
- `/src/components/quotations/quotation-list.tsx`
- `/src/components/quotations/quotation-form.tsx`
- `/src/app/api/quotations/route.ts`
- `/src/components/quotations/quotation-view-dialog.tsx`

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose |
|------|-------|---------|
| `quotation-list.tsx` | ~650 | Main list with expiry badges |
| `quotation-form.tsx` | ~700 | Create/edit with expiry date |
| `quotation-view-dialog.tsx` | ~200 | View dialog |

**Tier 2 Detail - Unique Business Logic**:
1. **Expiry Date**: Validation and warning badges
2. **Convert to Invoice**: Preserves line items, creates linked invoice
3. **Status Flow**: DRAFT → SENT → APPROVED/REJECTED → EXPIRED/CONVERTED

---

## Phase 3: Sell-Side & Core Migration

### 3.1 Customer/Vendor Modules

**Description**: Migrate AR (customers) and AP (vendors) to framework.

**Technique/Technology**:
- Shared contact form component
- Group management
- Statement generation

**Acceptance Criteria**:
- [ ] Customer list renders via DataTable
- [ ] Customer form uses shared contact component
- [ ] Vendor list renders via DataTable
- [ ] Vendor form uses shared contact component
- [ ] Group management works for both

**Files to Modify**:
- `/src/components/ar/customer-list.tsx`
- `/src/components/ap/vendor-list.tsx`
- `/src/components/contacts/` (new shared component)

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose |
|------|-------|---------|
| `customer-list.tsx` | ~550 | AR list with balance summary |
| `vendor-list.tsx` | ~500 | AP list with balance summary |
| `customer-form.tsx` | ~400 | Create/edit customer |
| `vendor-form.tsx` | ~400 | Create/edit vendor |

**Tier 2 Detail - Shared Contact Form Pattern**:
Both customer and vendor forms share:
- Code (auto-generated or manual)
- Name, taxId, branchCode
- Address fields (address, subDistrict, district, province, postalCode)
- Contact info (phone, email, contactName, contactPhone)
- Bank details (for vendors)

**Tier 2 Detail - Migration Sequence**:
```
1. Create /src/components/contacts/contact-form.tsx (shared)
2. Refactor customer-form.tsx to use shared component
3. Refactor vendor-form.tsx to use shared component
4. Migrate customer-list.tsx to DataTable
5. Migrate vendor-list.tsx to DataTable
```

---

### 3.2 Payment Module

**Description**: Migrate payment (outgoing) to framework.

**Technique/Technology**:
- Payment links to purchase invoice
- Bank/cash account selection

**Cautions**:
- Payment must handle partial payment scenarios
- Multiple payment methods per payment

**Acceptance Criteria**:
- [ ] Payment list renders via DataTable
- [ ] Payment form renders via BaseForm
- [ ] Purchase invoice linking works
- [ ] Multi-method payment works
- [ ] E2E tests pass

**Files to Modify**:
- `/src/components/payments/payment-list.tsx`
- `/src/components/payments/payment-form.tsx`
- `/src/app/api/payments/route.ts`
- `/src/components/payments/payment-view-dialog.tsx`

**Tier 2 Detail - Component Inventory**:
| File | Lines | Purpose |
|------|-------|---------|
| `payment-list.tsx` | ~600 | Main list |
| `payment-form.tsx` | ~500 | Create/edit with vendor select |
| `payment-view-dialog.tsx` | ~200 | View dialog |

**Tier 2 Detail - Unique Business Logic**:
1. **Vendor vs Customer**: AP-focused
2. **Multi-method**: Can pay with multiple methods (cash + transfer)
3. **WHT**: 3% service, 5% rent withholding

---

### 3.3 Remaining Modules

**Description**: Migrate all other modules to framework.

**Modules**:
- Goods Receipt Notes
- Credit Notes / Debit Notes
- Purchase Orders
- Purchase Requests

**Technique/Technology**: Same patterns as above.

**Acceptance Criteria**:
- [ ] All modules use DataTable and BaseForm
- [ ] All API routes use factory pattern
- [ ] Module registration automated

**Tier 2 Detail - Module Inventory**:
| Module | Component Folder | API Route | Prisma Model |
|--------|------------------|-----------|--------------|
| GRN | `/src/components/goods-receipt-notes/` | `/api/goods-receipt-notes` | GoodsReceiptNote |
| Credit Notes | `/src/components/credit-notes/` | `/api/credit-notes` | CreditNote |
| Debit Notes | `/src/components/debit-notes/` | `/api/debit-notes` | DebitNote |
| Purchase Orders | `/src/components/purchase-orders/` | `/api/purchase-orders` | PurchaseOrder |
| Purchase Requests | `/src/components/purchase-requests/` | `/api/purchase-requests` | PurchaseRequest |

---

## Phase 4: Performance Optimization

### 4.1 Code Splitting & Lazy Loading

**Description**: Implement route-based code splitting for all 43 modules.

**Technique/Technology**:
- `React.lazy()` for all module components
- `next/dynamic` for heavy components (PDF generator, charts)
- Suspense boundaries with loading skeletons

**Cautions**:
- Auth check must happen before lazy load (prevent flash of unauthorized content)
- Shared components (DataTable, BaseForm) should not be lazy-loaded

**Acceptance Criteria**:
- [ ] Initial bundle < 500KB (currently estimated 2MB+)
- [ ] Dashboard loads in < 1s on 3G
- [ ] Other modules lazy-load on navigation
- [ ] No layout shift on module switch

**Files to Modify**:
- `/src/app/page.tsx` (lazy imports)

**Tier 2 Detail - Current Bundle Analysis**:
```
page.tsx imports (43 modules):
- Dashboard, ChartOfAccounts, JournalEntry (core - don't lazy load)
- InvoiceList, InvoiceDetailPage (lazy - heavy)
- QuotationList, ReceiptList, PaymentList (lazy - heavy)
- CustomerList, VendorList (lazy)
- All 43 modules eager-loaded on initial bundle
```

**Tier 2 Detail - Lazy Loading Strategy**:
```typescript
// Before (eager - all 43 modules in initial bundle)
import { InvoiceList } from '@/components/invoices/invoice-list'
import { PurchaseList } from '@/components/purchases/purchase-list'
// ... 41 more

// After (lazy - only core modules in initial bundle)
const InvoiceList = lazy(() => import('@/components/invoices/invoice-list'))
const PurchaseList = lazy(() => import('@/components/purchases/purchase-list'))
// ... all 43 modules lazy
```

**Tier 2 Detail - Heavy Components to Dynamic Import**:
- PDF generator (used only on print/download)
- Chart components (used only in reports)
- Rich text editor (used only in notes)

---

### 4.2 Bundle Size Reduction

**Description**: Analyze and reduce bundle by identifying:
- Duplicate imports
- Heavy dependencies (PDF, charts)
- Unused shadcn components

**Technique/Technology**:
- `next/bundle-analyzer` or `@next/bundle-analyzer`
- Tree-shaking verification
- Dynamic imports for heavy libs (pdf-lib, chart.js)

**Acceptance Criteria**:
- [ ] Report generated showing per-module bundle sizes
- [ ] Heavy deps (pdf, charts) lazy-loaded
- [ ] Unused shadcn components removed
- [ ] Third-party libs deduplicated

**Tier 2 Detail - Bundle Analysis Targets**:
| Dependency | Size (estimated) | Usage |
|------------|-----------------|-------|
| pdf-lib | ~500KB | Invoice/payment PDF generation |
| chart.js | ~300KB | Reports charts |
| date-fns | ~100KB | Date formatting |
| @tanstack/react-query | ~50KB | API data fetching |
| zustand | ~20KB | State management |

---

### 4.3 Runtime Performance

**Description**: Optimize React rendering performance.

**Technique/Technology**:
- `useMemo` for expensive computations
- `useCallback` for event handlers
- Virtual scrolling for large lists (>100 rows)

**Acceptance Criteria**:
- [ ] Invoice list (1000+ items) renders smoothly
- [ ] Form input lag < 50ms
- [ ] No unnecessary re-renders in DataTable

**Tier 2 Detail - Virtual Scrolling Candidates**:
| List | Est. Rows | Current Implementation |
|------|-----------|----------------------|
| Invoice list | 100-1000+ | Paginated (limit 50) - OK |
| Journal entries | 100-10000+ | Virtual scrolling recommended |
| Product list | 100-1000+ | Paginated - OK |
| Customer list | 50-500 | Paginated - OK |

---

## Phase 5: Framework Polish & Documentation

### 5.1 Module Template Generator

**Description**: CLI tool to scaffold new modules.

**Technique/Technology**:
- `bun run gen:module <name>` command
- Generates: component, API route, menu entry, permissions
- Template files in `/scripts/module-template/`

**Acceptance Criteria**:
- [ ] `bun run gen:module invoice` creates working module
- [ ] Template includes DataTable and BaseForm usage
- [ ] API route uses factory pattern
- [ ] Menu entry auto-added to sidebar

**Files to Create**:
- `/scripts/module-template/` (directory with templates)
- `/scripts/gen-module.ts` (CLI script)

**Tier 2 Detail - Template Files**:
```
/scripts/module-template/
├── component/
│   ├── {{module}}-list.tsx.ejs
│   ├── {{module}}-form.tsx.ejs
│   └── {{module}}-view-dialog.tsx.ejs
├── api/
│   └── route.ts.ejs
└── manifest.ts.ejs
```

---

### 5.2 Documentation

**Description**: Document framework architecture and patterns.

**Technique/Technology**:
- `/docs/framework/` directory
- ADRs for key decisions
- API reference for module developers

**Acceptance Criteria**:
- [ ] Architecture diagram (ASCII)
- [ ] Module registration guide
- [ ] API factory usage guide
- [ ] Migration checklist for legacy modules

**Tier 2 Detail - Documentation Structure**:
```
/docs/framework/
├── ARCHITECTURE.md
├── MODULE_REGISTRATION.md
├── API_FACTORY.md
├── BASE_FORM_GUIDE.md
├── DATA_TABLE_GUIDE.md
├── MIGRATION_CHECKLIST.md
└── ADRs/
    ├── 001-module-registry-pattern.md
    ├── 002-base-form-generics.md
    └── 003-api-factory-pattern.md
```

---

### 5.3 Developer Experience

**Description**: Improve DX with hot-reload, type checking, testing.

**Technique/Technology**:
- Module-level hot reload
- Shared types auto-generated from Prisma
- Module-specific test templates

**Acceptance Criteria**:
- [ ] New module works without restarting dev server
- [ ] TypeScript errors shown inline
- [ ] Test template for each module type

**Tier 2 Detail - DX Pain Points**:
1. **Type Generation**: Prisma types need `bun run db:generate` after schema changes
2. **Hot Reload**: Adding new module requires manual import in page.tsx (fix with registry)
3. **Test Templates**: No standardized E2E test pattern for new modules

---

## Workflow Charts (ASCII)

### Dependency Graph

```
Phase 1: Foundation
├── 1.1 Module Registry ─────────────────────────────┐
├── 1.2 BaseForm<T> ─────┐                           │
├── 1.3 DataTable<T> ─┐  │                           │
├── 1.4 LineItemEditor ─┘  │                           │
└── 1.5 API Factory ────────┘                           │
        │                                              │
        ▼                                              │
Phase 2: Buy-Side ────────────────────────────────────┘
├── 2.1 Invoice ──► 2.2 Purchase ──► 2.3 Receipt ──► 2.4 Quotation
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                              ▼
Phase 3: Sell-Side
├── 3.1 Customer/Vendor ──► 3.2 Payment ──► 3.3 Remaining
                              │
                              ▼
Phase 4: Performance
├── 4.1 Code Splitting ──► 4.2 Bundle Size ──► 4.3 Runtime

Phase 5: Polish
├── 5.1 Module Template ──► 5.2 Docs ──► 5.3 DX
```

### Migration Sequence

```
Current (43 modules hardcoded):
┌─────────────────────────────────────────────────────────────┐
│ page.tsx: 43 imports + 6 manual registration points        │
│ sidebar.tsx: hardcoded menu groups                          │
│ api routes: individual hardcoded handlers                   │
└─────────────────────────────────────────────────────────────┘

Target (registry-based):
┌─────────────────────────────────────────────────────────────┐
│ module-registry.ts: auto-discovers modules from /components │
│ page.tsx: reads from registry, lazy-loads                   │
│ sidebar.tsx: renders from registry                          │
│ api routes: factory-generated from document-schemas.ts      │
└─────────────────────────────────────────────────────────────┘
```

### Module Registration Flow

```
New Module Created
       │
       ▼
┌──────────────────────────────────┐
│ 1. Create component in /components/<module>/
│ 2. Export manifest from <module>/index.ts
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Module Registry                  │
│ auto-discovers from /lib/modules │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Sidebar: reads from registry     │
│ Routes: registered automatically │
│ Permissions: from manifest       │
└──────────────────────────────────┘
```

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing invoice/purchase/receipt forms | H | M | Run full E2E suite after each migration |
| Bundle split causes auth flash | M | L | Wrap lazy components in PermissionGuard |
| Factory pattern loses custom validation | H | M | Review all Zod schemas carefully |
| Period locking varies by type | M | H | Document differences in api-factory.ts |
| LineItemEditor consolidation breaks WHT auto-detect | H | M | Test with service-type products |

---

## Open Questions (needs human decision)

1. **Navigation Pattern**: Current sidebar has 9 groups. Should framework support custom groups or fixed groups?
2. **Module Dependencies**: Some modules depend on others (receipt → invoice). How should registry express this?
3. **Legacy Data**: Some data may have Baht instead of Satang. Should migration include data repair?
4. **PDF Generation**: Heavy dependency. Should it be lazy-loaded separately?
5. **Auth State**: Currently loaded at module init. Should lazy modules fetch permissions on load?

---

## Investment Summary

| Phase | Tasks | Effort | Weeks (est.) |
|-------|-------|--------|--------------|
| 1 | Foundation (5 tasks) | L | 2-3 |
| 2 | Buy-Side Migration (4 tasks) | M | 2 |
| 3 | Sell-Side Migration (3 tasks) | L | 1-2 |
| 4 | Performance (3 tasks) | M | 1-2 |
| 5 | Polish (3 tasks) | S | 1 |
| **Total** | **18 tasks** | - | **6-9 weeks** |

### Effort Scale
- **XS**: < 1 day
- **S**: 1-2 days
- **M**: 3-5 days
- **L**: 1-2 weeks
- **XL**: 2-4 weeks

---

## Quick Win Recommendations

1. **Start with 1.1 (Module Registry)** - smallest scope, validates pattern
2. **Then 1.3 (DataTable)** - visible improvement, many files affected
3. **Then 2.1 (Invoice)** - most complex but well-understood
4. **Parallel tracks**: 1.2/1.3 can run concurrently after 1.1

---

## File Inventory Summary

### Phase 1 - Foundation Files

| Action | File | Lines |
|--------|------|-------|
| Create | `/src/lib/module-registry.ts` | ~150 |
| Create | `/src/lib/document-schemas.ts` | ~200 |
| Create | `/src/lib/api-factory.ts` | ~300 |
| Create | `/src/components/forms/base-form.tsx` | ~400 |
| Create | `/src/components/forms/line-item-editor.tsx` | ~300 |
| Create | `/src/components/forms/line-item-row.tsx` | ~150 |
| Create | `/src/components/data-table/data-table.tsx` | ~400 |
| Create | `/src/components/data-table/column-def.ts` | ~100 |
| Create | `/src/components/data-table/filters.ts` | ~100 |
| Modify | `/src/app/page.tsx` | 604 → ~200 |
| Modify | `/src/components/layout/keerati-sidebar.tsx` | ~400 → ~300 |

### Phase 2 - Buy-Side Files

| Action | File | Lines |
|--------|------|-------|
| Modify | `/src/components/invoices/invoice-list.tsx` | 1042 → ~400 |
| Modify | `/src/components/invoices/invoice-form.tsx` | 889 → ~300 |
| Modify | `/src/app/api/invoices/route.ts` | 345 → ~200 |
| Modify | `/src/components/purchases/purchase-list.tsx` | ~700 → ~400 |
| Modify | `/src/components/purchases/purchase-form.tsx` | ~800 → ~300 |
| Modify | `/src/app/api/purchases/route.ts` | ~300 → ~200 |
| Modify | `/src/components/receipts/receipt-list.tsx` | ~600 → ~400 |
| Modify | `/src/components/receipts/receipt-form.tsx` | ~550 → ~300 |
| Modify | `/src/app/api/receipts/route.ts` | ~280 → ~200 |
| Modify | `/src/components/quotations/quotation-list.tsx` | ~650 → ~400 |
| Modify | `/src/components/quotations/quotation-form.tsx` | ~700 → ~300 |
| Modify | `/src/app/api/quotations/route.ts` | ~260 → ~200 |

### Phase 3 - Sell-Side Files

| Action | File | Lines |
|--------|------|-------|
| Create | `/src/components/contacts/contact-form.tsx` | ~400 |
| Modify | `/src/components/ar/customer-list.tsx` | ~550 → ~400 |
| Modify | `/src/components/ar/customer-form.tsx` | ~400 → ~300 |
| Modify | `/src/components/ap/vendor-list.tsx` | ~500 → ~400 |
| Modify | `/src/components/ap/vendor-form.tsx` | ~400 → ~300 |
| Modify | `/src/components/payments/payment-list.tsx` | ~600 → ~400 |
| Modify | `/src/components/payments/payment-form.tsx` | ~500 → ~300 |
| Modify | `/src/app/api/payments/route.ts` | ~280 → ~200 |

---

*Document Status: Tier 2 Research Complete - Ready for Implementation*