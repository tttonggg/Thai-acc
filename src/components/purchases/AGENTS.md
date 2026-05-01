<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Purchase Invoice Management

## Purpose

Purchase invoice lifecycle — vendor bills, line items, VAT input, WHT deduction,
GL posting. Tracks AP (Accounts Payable) balance.

## Key Files

| File                       | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `purchase-form.tsx`        | Purchase invoice creation/editing with line items     |
| `purchase-list.tsx`        | Purchase invoice list with filtering by vendor/status |
| `purchase-edit-dialog.tsx` | Quick edit dialog                                     |
| `purchase-view-dialog.tsx` | Purchase detail view                                  |

## For AI Agents

### Working In This Directory

**Purchase Invoice Data Model**

```typescript
interface PurchaseInvoice {
  id: string;
  invoiceNo: string; // Sequential: PO-YYYY-XXXXX
  vendorId: string;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number; // In Satang (before VAT)
  vatAmount: number; // In Satang
  whtAmount: number; // In Satang (deducted)
  netAmount: number; // In Satang (total - WHT)
  status: 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED';
  lineItems: PurchaseLineItem[];
  journalEntryId?: string;
}

interface PurchaseLineItem {
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // In Satang
  totalAmount: number; // In Satang
  vatRate: number; // 0 or 7
}
```

**Critical Invariants**

- Invoice totals = Σ(line items) + VAT - WHT
- WHT rates: 3% (service), 5% (rent), 1% (contract), 2% (advertising)
- Posted invoices create GL entries: DR Expense, DR VAT Input, CR AP
- Cannot modify posted invoices (only credit notes)
- Vendor balance increases on POST

**When Adding Features**

1. Add WHT calculation based on line item categories
2. Update vendor AP balance on post
3. Create GL: DR Purchases, DR VAT Input, CR Accounts Payable
4. Update API route `/api/purchases/route.ts`
5. Add E2E test in `e2e/purchases.spec.ts`

## Dependencies

### Internal

- `@/lib/currency` - Satang conversion
- `@/lib/api-utils` - `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table, Select
- `/api/purchases` - Purchase invoice CRUD, posting
- `prisma/purchaseInvoice` - Database model

### External

- `react-hook-form` v7 - Form handling
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
