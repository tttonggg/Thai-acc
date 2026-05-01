<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Credit Notes

## Purpose

Credit note management for refunds and invoice adjustments. Creates reversal
journal entries when posted.

## Key Files

| File                          | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `credit-note-form.tsx`        | Credit note creation/editing with line items |
| `credit-note-list.tsx`        | Credit note list with filtering              |
| `credit-note-view-dialog.tsx` | Detail view with allocation breakdown        |
| `index.ts`                    | Component exports                            |

## For AI Agents

### Working In This Directory

**Credit Note Purpose**

- Refund excess payments from customers
- Adjust invoice amounts (discounts, returns)
- Correct billing errors

**Critical Invariants**

- Credit note reduces AR balance
- Posting creates reversal journal entry
- Reference to original invoice required
- Amount cannot exceed original invoice balance
- Credit note numbers sequential (CN-YYYY-XXXXX)

### Journal Entry on Posting

```typescript
// On POST, create reversal:
// Debit: Sales Revenue (or original revenue account)
// Credit: Accounts Receivable (to reduce AR)
```

### Satang Conversion

```typescript
import { bahtToSatang } from '@/lib/currency';

const creditNote = await prisma.creditNote.create({
  data: {
    amount: bahtToSatang(formData.amount),
    // ...
  },
});
```

## Dependencies

### Internal

- @/lib/currency - Satang/Baht conversion
- @/lib/api-utils - `generateDocNumber()`, `requireAuth()`
- @/components/ui/\* - Dialog, Form, Table components
- @/components/invoices - Invoice lookup for reference

### External

- react-hook-form v7 - Form handling
- zod v4 - Schema validation
- @tanstack/react-query v5 - Data fetching
- lucide-react - Icons
