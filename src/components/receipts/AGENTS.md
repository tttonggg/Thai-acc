<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Receipt Management (HOT PATH)

## Purpose

Payment receipt processing — recording customer payments, allocating to
invoices, handling multiple payment methods (cash, cheque, transfer), and bank
reconciliation. Second-most modified module (43+ edits).

## Key Files

| File                      | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `receipt-form.tsx`        | Receipt creation with invoice allocation, payment method handling |
| `receipt-list.tsx`        | List view with filters by customer, date range, status            |
| `receipt-view-dialog.tsx` | Detail view showing allocation breakdown                          |
| `index.ts`                | Component exports                                                 |

## For AI Agents

### Working In This Directory

**🔥 HOT PATH - High modification frequency**

- Verify Satang conversion on ALL amount fields
- Test invoice allocation logic (partial payments, multiple invoices)
- Validate payment method constraints (cheque no/date required for CHEQUE)
- Ensure receipt creates journal entry on posting
- Test bank reconciliation integration

**Critical Invariants**

- Receipt total must equal sum(allocated amounts) + unallocated
- Payment method-specific validations:
  - CHEQUE: requires `chequeNo` + `chequeDate` + `bankAccountId`
  - TRANSFER: requires `bankAccountId`
  - CASH: no additional fields
- Posting creates bank journal entry (debit Bank, credit AR)
- Allocated amounts reduce invoice outstanding balance
- Receipt numbers sequential (RCP-YYYY-XXXXX)
- Idempotency key prevents duplicate processing

**When Adding Features**

1. Update `receiptSchema` in `receipt-form.tsx`
2. Add Satang conversion for monetary fields
3. Update API route `/api/receipts/route.ts`
4. Handle payment method validations
5. Add E2E test in `e2e/receipts.spec.ts`

### Common Patterns

**Receipt Form with Allocation**

```typescript
const receiptSchema = z.object({
  receiptDate: z.string().min(1, 'กรุณาระบุวันที่'),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  allocations: z.array(
    z.object({
      invoiceId: z.string(),
      amount: z.number().min(0),
    })
  ),
});
```

**Invoice Allocation Logic**

```typescript
// Calculate unallocated amount
const unallocatedAmount =
  receiptAmount - allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

// Validate: cannot allocate more than receipt total
if (unallocatedAmount < 0) {
  throw new Error('ยอดรับเกินกว่ายอดวางบิล');
}
```

**Payment Method Validations**

```typescript
// Conditional validation
if (paymentMethod === 'CHEQUE') {
  if (!chequeNo) throw new Error('กรุณาระบุเลขที่เช็ค');
  if (!chequeDate) throw new Error('กรุณาระบุวันที่เช็ค');
  if (!bankAccountId) throw new Error('กรุณาระบุบัญชีธนาคาร');
}
```

**Journal Entry on Posting**

```typescript
// Debit: Bank Account (asset)
// Credit: Accounts Receivable (asset)
await prisma.journalEntry.create({
  data: {
    date: receiptDate,
    lines: {
      create: [
        { accountId: bankAccountId, debit: amount, credit: 0 },
        { accountId: arAccountId, debit: 0, credit: amount },
      ],
    },
  },
});
```

**Satang Conversion Pattern**

```typescript
import { bahtToSatang } from '@/lib/currency';

// Convert user input to database storage
const receipt = await prisma.receipt.create({
  data: {
    amount: bahtToSatang(formData.amount), // 1234.56 → 123456
    allocations: {
      create: formData.allocations.map((a) => ({
        amount: bahtToSatang(a.amount),
      })),
    },
  },
});
```

**Query with Invoices**

```typescript
// Fetch receipts with related invoices
const receipts = await prisma.receipt.findMany({
  include: {
    customer: true,
    allocations: {
      include: { invoice: true },
    },
  },
});
```

## Dependencies

### Internal

- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `generateDocNumber()`, `requireAuth()`
- `@/components/ui/*` - shadcn/ui components
- `/api/receipts` - CRUD, allocation, posting
- `src/components/invoices` - Invoice lookup for allocation

### External

- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
