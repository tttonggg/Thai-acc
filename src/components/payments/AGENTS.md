<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Payment Processing

## Purpose

Payment lifecycle management — create payments, allocate to invoices, handle WHT
deduction, support multiple payment methods (cash, transfer, cheque, credit).

## Key Files

| File                      | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `payment-form.tsx`        | Payment creation with vendor selection, invoice allocation, WHT categories |
| `payment-list.tsx`        | Payment history with status, filtering                                     |
| `payment-view-dialog.tsx` | Payment detail view with allocation breakdown                              |

## For AI Agents

### Working In This Directory

**Payment Data Model**

```typescript
interface Payment {
  id: string;
  paymentNo: string; // Sequential: PAY-YYYY-XXXXX
  vendorId: string;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHEQUE' | 'CREDIT' | 'OTHER';
  bankAccountId?: string;
  chequeNo?: string;
  chequeDate?: Date;
  totalAmount: number; // In Satang
  allocations: Allocation[];
  journalEntryId?: string; // Set when posted
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
}

interface Allocation {
  invoiceId: string;
  invoiceNo: string;
  amount: number; // In Satang
  whtCategory?: WHTCategory;
  whtRate?: number; // 0.03, 0.05, etc.
  whtAmount?: number; // In Satang
}
```

**WHT Categories (PND.53)**

```typescript
enum WHTCategory {
  SERVICE = 'SERVICE', // 3% ค่าบริการ
  RENT = 'RENT', // 5% ค่าเช่า
  PROFESSIONAL = 'PROFESSIONAL', // 3% ค่าบริการวิชาชีพ
  CONTRACT = 'CONTRACT', // 1% ค่าจ้างทำของ
  ADVERTISING = 'ADVERTISING', // 2% ค่าโฆษณา
  NONE = 'NONE', // ไม่หักภาษี
}
```

**Critical Invariants**

- Payment allocation must not exceed invoice balance
- WHT amount = allocation amount × WHT rate
- Posted payments create journal entries
- Cheque payments require cheque number and date
- Cannot modify posted payments (only cancel)

**When Adding Features**

1. Add WHT calculation to payment allocation
2. Update vendor balance on payment post
3. Create GL entries: DR vendor balance, CR cash/bank, CR WHT receivable
4. Update API route `/api/payments/route.ts`
5. Add E2E test in `e2e/payments.spec.ts`

## Dependencies

### Internal

- `@/lib/currency` - Satang conversion
- `@/lib/api-utils` - `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table, Select
- `/api/payments` - Payment CRUD, posting
- `prisma/payment` - Database model

### External

- `react-hook-form` v7 - Form handling
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
