<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Petty Cash Management

## Purpose
Petty cash fund management — fund creation, voucher processing, replenishment, expense tracking, and GL posting for small cash expenses.

## Key Files
| File | Description |
|------|-------------|
| `petty-cash-page.tsx` | Main petty cash page with funds, vouchers, replenishment |
| `fund-edit-dialog.tsx` | Petty cash fund CRUD (create, adjust balance, close) |
| `voucher-edit-dialog.tsx` | Petty cash voucher creation and editing |

## For AI Agents

### Working In This Directory

**Petty Cash Features**
- Multiple petty cash funds (department-based)
- Voucher workflow: DRAFT → APPROVED → PAID → POSTED
- Fund replenishment from bank account
- Automatic GL posting on voucher posting
- Receipt attachment support

**Critical Invariants**
- Fund balance = Σ(replenishments) - Σ(voucher payments)
- Cannot pay voucher if insufficient fund balance
- Posted vouchers cannot be modified (only reversal)
- Voucher numbers sequential (PCV-YYYY-XXXXX)
- All monetary values in Satang
- Replenishment creates bank withdrawal + fund credit

**When Adding Features**
1. Update voucher approval workflow
2. Apply Satang conversion to all amounts
3. Update API routes in `/api/petty-cash/`
4. Handle fund balance validations
5. Add E2E test in `e2e/petty-cash.spec.ts`

### Common Patterns

**Petty Cash Fund Schema**
```typescript
interface PettyCashFund {
  id: string
  code: string              // PCF-XXXX
  name: string              // e.g., "กองบัญชี", "ฝ่ายขาย"
  department: string
  custodian: string         // Person responsible
  balance: number           // Current balance (Satang)
  limit: number             // Maximum balance (Satang)
  bankAccountId?: string    // For replenishment
  active: boolean
  lastReplenishmentDate?: Date
}
```

**Petty Cash Voucher Schema**
```typescript
interface PettyCashVoucher {
  id: string
  voucherNumber: string     // PCV-YYYY-XXXXX
  fundId: string
  date: Date
  payee: string             // Who received payment
  description: string
  amount: number            // In Satang
  expenseAccountId: string  // GL account for expense
  receiptUrl?: string       // Attached receipt image
  status: VoucherStatus
  approvedBy?: string
  approvedAt?: Date
  paidAt?: Date
  postedAt?: Date
  journalEntryId?: string
}

enum VoucherStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED'
}
```

**Voucher Workflow**
```typescript
// Step 1: Create draft voucher
const voucher = await prisma.pettyCashVoucher.create({
  data: {
    voucherNumber: await generateVoucherNumber(),
    fundId,
    date: new Date(),
    payee: 'คนขาย',
    description: 'ซื้อเอกสาร',
    amount: bahtToSatang(150),  // 150 THB
    expenseAccountId: '6101',   // Office supplies expense
    status: 'DRAFT'
  }
})

// Step 2: Approve (checks fund balance)
await prisma.pettyCashVoucher.update({
  where: { id: voucher.id },
  data: {
    status: 'APPROVED',
    approvedBy: userId,
    approvedAt: new Date()
  }
})

// Step 3: Pay (deducts from fund balance)
await prisma.$transaction(async (tx) => {
  // Check balance
  const fund = await tx.pettyCashFund.findUnique({ where: { id: fundId } })
  if (fund.balance < voucher.amount) {
    throw new Error('ยอดเงินสดย่อยไม่เพียงพอ')
  }

  // Update voucher
  await tx.pettyCashVoucher.update({
    where: { id: voucher.id },
    data: { status: 'PAID', paidAt: new Date() }
  })

  // Deduct from fund
  await tx.pettyCashFund.update({
    where: { id: fundId },
    data: { balance: { decrement: voucher.amount } }
  })
})
```

**Fund Replenishment**
```typescript
interface Replenishment {
  fundId: string
  amount: number             // In Satang
  bankAccountId: string      // Source of funds
  reference: string          // Cheque number, transfer ref
  date: Date
}

// Replenish fund (bank withdrawal → fund credit)
await prisma.$transaction(async (tx) => {
  // Debit bank account
  await tx.bankTransaction.create({
    data: {
      bankAccountId: replenishment.bankAccountId,
      type: 'DEBIT',
      amount: replenishment.amount,
      reference: replenishment.reference,
      description: `เติมเงินสดย่อย: ${fund.name}`
    }
  })

  // Credit petty cash fund
  await tx.pettyCashFund.update({
    where: { id: replenishment.fundId },
    data: {
      balance: { increment: replenishment.amount },
      lastReplenishmentDate: replenishment.date
    }
  })

  // Create journal entry
  await tx.journalEntry.create({
    data: {
      date: replenishment.date,
      lines: {
        create: [
          { accountId: pettyCashAccountId, debit: replenishment.amount, credit: 0 },
          { accountId: replenishment.bankAccountId, debit: 0, credit: replenishment.amount }
        ]
      }
    }
  })
})
```

**GL Posting on Voucher**
```typescript
// When voucher is POSTED, create journal entry:
// Debit: Expense account (from voucher)
// Credit: Petty Cash asset account

await prisma.$transaction(async (tx) => {
  const voucher = await tx.pettyCashVoucher.findUnique({
    where: { id: voucherId },
    include: { fund: true }
  })

  // Create journal entry
  const journalEntry = await tx.journalEntry.create({
    data: {
      date: voucher.date,
      lines: {
        create: [
          {
            accountId: voucher.expenseAccountId,  // Debit expense
            debit: voucher.amount,
            credit: 0
          },
          {
            accountId: pettyCashAssetAccountId,   // Credit petty cash
            debit: 0,
            credit: voucher.amount
          }
        ]
      }
    }
  })

  // Update voucher
  await tx.pettyCashVoucher.update({
    where: { id: voucherId },
    data: {
      status: 'POSTED',
      postedAt: new Date(),
      journalEntryId: journalEntry.id
    }
  })
})
```

**Fund Balance Calculation**
```typescript
const getFundBalance = async (fundId: string) => {
  const vouchers = await prisma.pettyCashVoucher.findMany({
    where: {
      fundId,
      status: { in: ['PAID', 'POSTED'] }  // Only paid vouchers
    }
  })

  const totalPaid = vouchers.reduce((sum, v) => sum + v.amount, 0)

  // Balance should match fund.balance
  return {
    currentBalance: fund.balance,
    calculatedBalance: totalReplenishments - totalPaid,
    discrepancy: fund.balance - (totalReplenishments - totalPaid)
  }
}
```

**Voucher Number Generation**
```typescript
// Sequential: PCV-YYYY-XXXXX
const generateVoucherNumber = async () => {
  const prefix = 'PCV'
  const year = new Date().getFullYear()

  const lastVoucher = await prisma.pettyCashVoucher.findFirst({
    where: {
      voucherNumber: { startsWith: `${prefix}-${year}` }
    },
    orderBy: { voucherNumber: 'desc' }
  })

  const lastSeq = lastVoucher
    ? parseInt(lastVoucher.voucherNumber.split('-')[2])
    : 0

  const newSeq = lastSeq + 1
  return `${prefix}-${year}-${String(newSeq).padStart(5, '0')}`
}
```

**Receipt Attachment**
```typescript
// Upload receipt image
const uploadReceipt = async (voucherId: string, imageFile: File) => {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  const { url } = await response.json()

  await prisma.pettyCashVoucher.update({
    where: { id: voucherId },
    data: { receiptUrl: url }
  })
}
```

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `requireAuth()`, `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/petty-cash/*` - Funds, vouchers, replenishment
- `prisma/pettyCashFund` - Fund management
- `prisma/pettyCashVoucher` - Voucher tracking
- `src/components/banking` - Bank accounts for replenishment

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
