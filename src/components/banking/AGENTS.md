<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Banking Management

## Purpose
Bank account management — multiple bank accounts, cheque management, deposits, bank reconciliation, and cash flow tracking.

## Key Files
| File | Description |
|------|-------------|
| `banking-page.tsx` | Main banking page with accounts, transactions, reconciliation |
| `bank-account-edit-dialog.tsx` | Bank account CRUD operations |
| `cheque-edit-dialog.tsx` | Cheque management (receive, deposit, bounce) |

## For AI Agents

### Working In This Directory

**Banking Features**
- Multiple bank accounts (BBL, KBank, SCB, Krungthai, etc.)
- Cheque lifecycle: receive → deposit → cleared/bounced
- Bank reconciliation: match bank statement with internal records
- Cash flow tracking: inflows/outflows by account

**Critical Invariants**
- Bank balance = Σ(inflows) - Σ(outflows) + Σ(cleared cheques)
- Cheque status: RECEIVED → DEPOSITED → CLEARED or BOUNCED
- Cannot delete account with non-zero balance
- Bank reconciliation matches statement date + reference
- All monetary values in Satang

**When Adding Features**
1. Update bank account tracking
2. Apply Satang conversion to all amounts
3. Update API routes in `/api/banking/`
4. Handle cheque status transitions
5. Add E2E test in `e2e/banking.spec.ts`

### Common Patterns

**Bank Account Schema**
```typescript
interface BankAccount {
  id: string
  code: string              // BANK-XXXX
  bankName: string          // BBL, KBANK, SCB, KTB, etc.
  accountNumber: string     // Actual account number
  accountType: AccountType  // CURRENT, SAVINGS, FIXED
  branch: string            // Branch name
  balance: number           // Current balance (Satang)
  currency: string          // THB (default)
  active: boolean
}
```

**Cheque Lifecycle**
```typescript
enum ChequeStatus {
  RECEIVED = 'RECEIVED',     // Received from customer
  DEPOSITED = 'DEPOSITED',   // Deposited to bank
  CLEARED = 'CLEARED',       // Bank cleared
  BOUNCED = 'BOUNCED',       // Bank bounced (NSF)
  CANCELLED = 'CANCELLED'    // Cancelled
}

interface Cheque {
  id: string
  chequeNumber: string
  bankName: string
  branch: string
  amount: number             // In Satang
  dueDate: Date
  status: ChequeStatus
  receivedFromId?: string    // Customer who gave cheque
  depositedToAccountId?: string
  depositedDate?: Date
  clearedDate?: Date
  bouncedReason?: string
}
```

**Cheque Status Transitions**
```typescript
// Allowed transitions
const TRANSITIONS: Record<ChequeStatus, ChequeStatus[]> = {
  RECEIVED: ['DEPOSITED', 'CANCELLED'],
  DEPOSITED: ['CLEARED', 'BOUNCED'],
  CLEARED: [],              // Final state
  BOUNCED: ['RECEIVED'],    // Can redeposit
  CANCELLED: []             // Final state
}

const transitionCheque = (cheque: Cheque, newStatus: ChequeStatus) => {
  const allowed = TRANSITIONS[cheque.status].includes(newStatus)
  if (!allowed) {
    throw new Error(`Cannot change ${cheque.status} → ${newStatus}`)
  }
}
```

**Bank Reconciliation**
```typescript
interface Reconciliation {
  bankAccountId: string
  statementDate: Date
  statementBalance: number   // Bank statement balance (Satang)
  bookBalance: number        // Internal records balance (Satang)
  variances: Variance[]
  status: 'MATCHED' | 'PENDING' | 'DISCREPANCY'
}

interface Variance {
  type: 'MISSING' | 'EXTRA' | 'DIFFERENT_AMOUNT'
  reference: string
  bookAmount: number
  statementAmount: number
  difference: number
}
```

**Bank Transaction Recording**
```typescript
interface BankTransaction {
  id: string
  bankAccountId: string
  type: 'DEBIT' | 'CREDIT'
  amount: number             // In Satang
  reference: string          // Cheque number, transfer ref, etc.
  description: string
  transactionDate: Date
  reconciled: boolean
  reconciliationId?: string
}

// DEBIT: Money out (withdrawal, cheque payment)
// CREDIT: Money in (deposit, transfer received)
```

**Cheque Deposit Entry**
```typescript
// When depositing cheque:
await prisma.cheque.update({
  where: { id: chequeId },
  data: {
    status: 'DEPOSITED',
    depositedToAccountId: bankAccountId,
    depositedDate: new Date()
  }
})

// Record bank transaction (credit - money in)
await prisma.bankTransaction.create({
  data: {
    bankAccountId,
    type: 'CREDIT',
    amount: cheque.amount,
    reference: `Cheque #${cheque.chequeNumber}`,
    description: `Deposit from ${cheque.receivedFrom.name}`
  }
})
```

**Cash Flow Calculation**
```typescript
const getCashFlow = async (bankAccountId: string, startDate: Date, endDate: Date) => {
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      bankAccountId,
      transactionDate: { gte: startDate, lte: endDate }
    }
  })

  const inflow = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0)

  const outflow = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0)

  return { inflow, outflow, net: inflow - outflow }
}
```

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `requireAuth()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/banking/*` - Accounts, cheques, transactions, reconciliation
- `prisma/bankAccount` - Bank accounts
- `prisma/cheque` - Cheque management
- `prisma/bankTransaction` - Transaction records

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
