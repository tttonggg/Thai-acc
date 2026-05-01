<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Quotation Management

## Purpose

Quote creation and management — sales quotations with pricing, validity period,
convert to invoice, and follow-up tracking.

## Key Files

| File                        | Description                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `quotation-form.tsx`        | Quotation creation/editing with line items, pricing                                        |
| `quotation-list.tsx`        | Quotation list with status filtering (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED) |
| `quotation-view-dialog.tsx` | Quotation detail view                                                                      |

## For AI Agents

### Working In This Directory

**Quotation Data Model**

```typescript
interface Quotation {
  id: string;
  quotationNo: string; // Sequential: QUO-YYYY-XXXXX
  customerId: string;
  quotationDate: Date;
  validUntil: Date;
  totalAmount: number; // In Satang
  vatAmount: number; // In Satang
  netAmount: number; // In Satang
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  lineItems: QuotationLineItem[];
  notes?: string;
}

interface QuotationLineItem {
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // In Satang
  totalAmount: number; // In Satang
}
```

**Quotation Status Flow**

```
DRAFT → SENT → ACCEPTED → CONVERTED (to Invoice)
            → REJECTED
            → EXPIRED (validUntil passed)
```

**Critical Invariants**

- Quotation expires after validUntil date
- Converted quotations cannot be modified
- Price validity based on VAT type (inclusive/exclusive)
- Line item totals = quantity × unitPrice

**When Adding Features**

1. Add quotation to invoice conversion
2. Update quotation status on send/accept
3. Calculate totals with VAT
4. Update API route `/api/quotations/route.ts`
5. Add E2E test in `e2e/quotations.spec.ts`

## Dependencies

### Internal

- `@/lib/currency` - Satang conversion
- `@/lib/api-utils` - `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table, Select
- `/api/quotations` - Quotation CRUD
- `prisma/quotation` - Database model

### External

- `react-hook-form` v7 - Form handling
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
