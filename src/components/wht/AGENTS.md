<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Withholding Tax (WHT) Management

## Purpose
Thai withholding tax (WHT) processing — PND 53 (income), PND 3 (payment to companies), PND 3A (payment to individuals), certificate generation, and tax filing support.

## Key Files
| File | Description |
|------|-------------|
| `wht-management.tsx` | WHT transaction management and certificate generation |
| `wht-report.tsx` | WHT reports (PND 53, PND 3, PND 3A) |
| `wht-with-tabs.tsx` | Tabbed interface for different WHT types |

## For AI Agents

### Working In This Directory

**Thai WHT Regulations**
- WHT deducted at source: 1% (government), 3% (companies), 5% (individuals)
- Certificates: PND 53 (income received), PND 3 (paid to companies), PND 3A (paid to individuals)
- Filing deadlines: Monthly by 7th of following month
- WHT payable account tracks accumulated tax
- Refundable if WHT deducted exceeds tax liability

**Critical Invariants**
- WHT rate depends on payee type:
  - Government agencies: 1%
  - Companies (registered VAT): 3%
  - Individuals (no VAT): 5%
  - Professional services: flat 3%
- WHT amount = payment amount × rate (round to 2 decimals)
- Certificates must have sequential numbers
- Posted WHT cannot be modified (only adjustment allowed)
- All monetary values in Satang

**When Adding Features**
1. Verify WHT rate application based on payee type
2. Apply Satang conversion to all amounts
3. Update API routes in `/api/wht/`
4. Handle certificate generation (PDF)
5. Add E2E test in `e2e/wht.spec.ts`

### Common Patterns

**WHT Transaction Schema**
```typescript
interface WhtTransaction {
  id: string
  type: WhtType           // INCOME (PND 53) | PAYMENT_COMPANY (PND 3) | PAYMENT_INDIVIDUAL (PND 3A)
  certificateNumber: string  // Sequential
  transactionDate: Date

  // Parties
  payerId: string         // Who deducted WHT
  payeeId: string         // Who received payment (WHT withheld from)
  payeeType: PayeeType    // GOVERNMENT | COMPANY | INDIVIDUAL | PROFESSIONAL

  // Amounts (in Satang)
  baseAmount: number      // Amount before WHT
  whtRate: number         // 0.01, 0.03, or 0.05
  whtAmount: number       // baseAmount × whtRate
  netAmount: number       // baseAmount - whtAmount

  // Status
  status: 'DRAFT' | 'POSTED' | 'FILED'
  postedAt?: Date
  journalEntryId?: string

  // Certificate (PDF)
  certificateGenerated: boolean
  certificateUrl?: string
}
```

**WHT Rate Determination**
```typescript
enum PayeeType {
  GOVERNMENT = 'GOVERNMENT',           // Government agencies
  COMPANY = 'COMPANY',                 // Registered companies (VAT)
  INDIVIDUAL = 'INDIVIDUAL',           // Individuals (no VAT)
  PROFESSIONAL = 'PROFESSIONAL'        // Professional services (flat 3%)
}

const getWhtRate = (payeeType: PayeeType, serviceType?: string): number => {
  switch (payeeType) {
    case PayeeType.GOVERNMENT:
      return 0.01  // 1%
    case PayeeType.COMPANY:
      return 0.03  // 3%
    case PayeeType.INDIVIDUAL:
      return 0.05  // 5%
    case PayeeType.PROFESSIONAL:
      return 0.03  // 3% (flat rate for professional services)
    default:
      throw new Error('Invalid payee type')
  }
}
```

**WHT Calculation**
```typescript
const calculateWht = (
  baseAmount: number,  // In Satang
  payeeType: PayeeType
): { whtAmount: number; netAmount: number } => {
  const rate = getWhtRate(payeeType)
  const whtAmount = Math.round(baseAmount * rate)  // Round to nearest Satang
  const netAmount = baseAmount - whtAmount

  return { whtAmount, netAmount }
}

// Example: 10,000 THB payment to company
// baseAmount = 1000000 Satang
// whtRate = 0.03 (3%)
// whtAmount = 30000 Satang (300 THB)
// netAmount = 970000 Satang (9,700 THB)
```

**Journal Entry on WHT Posting**
```typescript
// For WHT deducted from payment (PND 3/PND 3A):
// Debit: Expense account (base amount)
// Credit: WHT Payable (WHT amount to remit to Revenue Department)
// Credit: Cash/Bank (net amount paid)

await prisma.journalEntry.create({
  data: {
    date: whtDate,
    lines: {
      create: [
        { accountId: expenseAccount, debit: baseAmount, credit: 0 },
        { accountId: whtPayableAccount, debit: 0, credit: whtAmount },
        { accountId: bankAccount, debit: 0, credit: netAmount }
      ]
    }
  }
})

// For WHT deducted from income received (PND 53):
// Debit: Cash/Bank (net amount received)
// Debit: WHT Receivable (WHT amount deducted)
// Credit: Revenue account (base amount)
```

**Certificate Generation (PND 53 / PND 3 / PND 3A)**
```typescript
interface CertificateData {
  certificateNumber: string  // Sequential per type
  type: WhtType
  issueDate: Date

  // Payer info
  payerName: string
  payerTaxId: string
  payerBranch: string
  payerAddress: string

  // Payee info
  payeeName: string
  payeeTaxId: string
  payeeBranch: string
  payeeAddress: string

  // Transaction details
  baseAmount: number        // In Baht (divide Satang by 100)
  whtRate: number           // 1%, 3%, or 5%
  whtAmount: number         // In Baht
  paymentDescription: string
  taxMonth: number          // 1-12
  taxYear: number           // 2024, 2025, etc.
}

// Generate PDF certificate (Thai layout)
const certificatePdf = await generateWhtCertificate(certificateData)
```

**WHT Report Generation**
```typescript
// PND 53: WHT deducted from income received (aggregate by payer)
const pnd53Report = await prisma.whtTransaction.groupBy({
  by: ['payerId'],
  where: {
    type: 'INCOME',
    transactionDate: { gte: startOfMonth, lte: endOfMonth }
  },
  _sum: { baseAmount: true, whtAmount: true }
})

// PND 3: WHT deducted from payments to companies (aggregate by payee)
const pnd3Report = await prisma.whtTransaction.groupBy({
  by: ['payeeId'],
  where: {
    type: 'PAYMENT_COMPANY',
    transactionDate: { gte: startOfMonth, lte: endOfMonth }
  },
  _sum: { baseAmount: true, whtAmount: true }
})
```

**Certificate Number Generation**
```typescript
// Sequential numbering per certificate type
// Format: {TYPE}-{YYYY}-{XXXXX}
// Example: PND3-2024-00001, PND3-2024-00002

const generateCertificateNumber = async (type: WhtType) => {
  const prefix = type === 'INCOME' ? 'PND53' : 'PND3'
  const year = new Date().getFullYear()

  const lastCert = await prisma.whtTransaction.findFirst({
    where: {
      type,
      certificateNumber: { startsWith: `${prefix}-${year}` }
    },
    orderBy: { certificateNumber: 'desc' }
  })

  const lastSeq = lastCert
    ? parseInt(lastCert.certificateNumber.split('-')[2])
    : 0

  const newSeq = lastSeq + 1
  return `${prefix}-${year}-${String(newSeq).padStart(5, '0')}`
}
```

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `requireAuth()`, `generateDocNumber()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/wht/*` - WHT transactions, certificates, reports
- `prisma/whtTransaction` - WHT records
- PDF generation library for certificates

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
