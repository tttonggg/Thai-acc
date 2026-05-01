<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Sales Invoice Management (HOT PATH)

## Purpose

Customer invoice lifecycle management — creation, editing, posting to GL,
payment allocation, PDF generation, and audit trail. This is the most frequently
modified module (112+ edits) and the primary revenue entry point.

## Key Files

| File                         | Description                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `invoice-form.tsx`           | Main invoice creation/editing form with line items, tax calculations, WHT deduction |
| `invoice-list.tsx`           | Virtualized list view with filtering, search, and status indicators                 |
| `invoice-list-virtual.tsx`   | High-performance virtualized rendering for 1000+ invoices                           |
| `invoice-edit-dialog.tsx`    | Inline edit dialog for quick modifications                                          |
| `invoice-preview-dialog.tsx` | PDF preview with Thai tax invoice layout (TAS 700 compliant)                        |
| `invoice-detail-page.tsx`    | Full detail view with audit log, comments, related documents                        |
| `line-item-editor.tsx`       | Line item CRUD with product lookup, UOM, quantity, price                            |
| `comment-section.tsx`        | Threaded comments for invoice collaboration                                         |
| `related-documents.tsx`      | Links to receipts, credit notes, debit notes                                        |
| `audit-log.tsx`              | Change history tracking (who, what, when)                                           |
| `index.ts`                   | Component exports                                                                   |

## For AI Agents

### Working In This Directory

**🔥 HOT PATH - Exercise extreme caution**

- This module changes 112+ times (highest in codebase)
- Always verify Satang conversion on ALL monetary fields
- Test invoice PDF generation with Thai tax layout
- Validate WHT calculation rules (3% for companies, 5% for individuals)
- Ensure double-entry posting (debit AR, credit Sales + VAT)

**Critical Invariants**

- Invoice totals must equal sum(line items) + VAT - WHT
- Posting creates journal entry (sets `journalEntryId`)
- Posted invoices cannot be modified (only credit notes allowed)
- Invoice numbers follow sequential pattern (INV-YYYY-XXXXX)
- VAT calculation: `amount * 0.07` (round to 2 decimals)
- WHT rates: 3% (company), 5% (individual), 1% (government)

**When Adding Features**

1. Add Zod validation schema for new fields
2. Update `invoice-form.tsx` form fields
3. Update API route `/api/invoices/route.ts`
4. Add Satang conversion if monetary
5. Update PDF layout if affects display
6. Add E2E test in `e2e/invoices.spec.ts`

### Common Patterns

**Monetary Values (Satang Pattern)**

```typescript
// ❌ WRONG - storing Baht directly
amount: formData.amount;

// ✅ CORRECT - convert to Satang
import { bahtToSatang } from '@/lib/currency';
amount: bahtToSatang(formData.amount);
```

**Line Item Calculations**

```typescript
// Line item total = quantity × price
const lineTotal = item.quantity * item.price;

// VAT per line item
const lineVat = lineTotal * 0.07;

// WHT deduction (when applicable)
const lineWht = lineTotal * whtRate;
```

**Invoice Status Flow**

```
DRAFT → PENDING_APPROVAL → POSTED → PARTIALLY_PAID → PAID
       ↓
      CANCELLED
```

**Posting to General Ledger**

```typescript
// On POST, create journal entry:
// Debit: Accounts Receivable (asset)
// Credit: Sales Revenue (revenue)
// Credit: VAT Payable (liability)
// Debit: WHT Payable (asset/expense offset)
```

**Form Validation (React Hook Form + Zod)**

```typescript
const form = useForm<InvoiceFormData>({
  resolver: zodResolver(invoiceSchema),
  defaultValues: {
    invoiceDate: new Date().toISOString(),
    customerId: '',
    lineItems: [{ productId: '', quantity: 1, price: 0 }],
  },
});
```

**Query Cache Invalidation**

```typescript
import { useQueryClient } from '@tanstack/react-query';

// After mutation, invalidate cache
queryClient.invalidateQueries({ queryKey: ['invoices'] });
queryClient.invalidateQueries({ queryKey: ['invoice', id] });
```

## Dependencies

### Internal

- `@/lib/currency` - Satang/Baht conversion utilities
- `@/lib/api-utils` - `generateDocNumber()`, CSRF helpers
- `@/components/ui/*` - shadcn/ui components (Card, Dialog, Form, Table)
- `@/hooks/use-toast` - Toast notifications
- `/api/invoices` - CRUD operations, posting, allocation

### External

- `react-hook-form` v7 - Form state management
- `@hookform/resolvers` - Zod validation integration
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching & caching
- `date-fns` v4 - Date formatting (Thai locale)
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI primitives (Dialog, Select, Popover)
