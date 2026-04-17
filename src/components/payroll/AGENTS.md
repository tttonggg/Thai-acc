<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Payroll Management

## Purpose
Employee payroll processing — salary calculation, tax withholding (PND 91), social security contribution (SSF), overtime, commissions, and payroll posting to general ledger.

## Key Files
| File | Description |
|------|-------------|
| `payroll-page.tsx` | Main payroll page with employee list, payroll runs |
| `payroll-run-list.tsx` | Payroll run history and status |
| `employee-edit-dialog.tsx` | Employee CRUD with salary, tax, SSF info |
| `employee-list.tsx` | Employee list with filtering and search |
| `payroll-status-dialog.tsx` | Payroll run status and posting confirmation |

## For AI Agents

### Working In This Directory

**Thai Payroll Requirements**
- Calculate monthly salary + overtime + commissions - deductions
- Withholding tax (PND 91) based on progressive tax tables
- Social Security Fund (SSF): 5% employee + 5% employer (capped at 15,000 THB)
- Provident Fund (optional): employee contribution % match
- Posted to GL (debit Salary Expense, credit Cash Payable)

**Critical Invariants**
- Gross salary = base salary + overtime + commissions + benefits
- SSF deduction = min(gross salary, 15000) × 0.05
- Tax calculation uses progressive tax tables (revenue department)
- Net pay = gross - SSF - tax - provident fund - other deductions
- Payroll posting creates journal entry (debit expenses, credit liabilities)
- Posted payroll cannot be modified (only reversal allowed)

**When Adding Features**
1. Update payroll calculation formulas
2. Apply Satang conversion to all monetary fields
3. Update API routes in `/api/payroll/`
4. Handle tax table changes (update annually)
5. Add E2E test in `e2e/payroll.spec.ts`

### Common Patterns

**Payroll Calculation**
```typescript
interface PayrollCalculation {
  // Income
  baseSalary: number
  overtime: number
  commissions: number
  benefits: number

  // Deductions
  ssfDeduction: number        // Social Security (5%, capped)
  taxDeduction: number        // Withholding tax (progressive)
  providentFund: number       // Optional
  otherDeductions: number

  // Totals (in Satang)
  grossIncome: number
  totalDeductions: number
  netPay: number
}

const calculatePayroll = (employee: Employee, period: PayPeriod) => {
  const gross = employee.baseSalary + employee.overtime + employee.commissions

  // SSF: 5% capped at 15,000 THB
  const ssfBase = Math.min(gross, 15000)
  const ssf = ssfBase * 0.05

  // Tax calculation (progressive table)
  const tax = calculateProgressiveTax(gross - ssf - employee.allowances)

  const netPay = gross - ssf - tax - employee.providentFund - employee.otherDeductions

  return { gross, ssf, tax, netPay }
}
```

**Progressive Tax Calculation (Thai Revenue Department)**
```typescript
// 2024 tax brackets (annual net income)
const TAX_BRACKETS = [
  { limit: 150000, rate: 0.00 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: 2000000, rate: 0.15 },
  { limit: 5000000, rate: 0.20 },
  { limit: Infinity, rate: 0.35 }
]

const calculateProgressiveTax = (annualNetIncome: number) => {
  let tax = 0
  let previousLimit = 0

  for (const bracket of TAX_BRACKETS) {
    if (annualNetIncome <= previousLimit) break

    const taxableInBracket = Math.min(annualNetIncome, bracket.limit) - previousLimit
    tax += taxableInBracket * bracket.rate
    previousLimit = bracket.limit
  }

  return tax
}
```

**Employee Schema**
```typescript
interface Employee {
  id: string
  code: string              // EMP-XXXX
  name: string
  position: string
  department: string

  // Compensation (monthly, in Baht - convert to Satang for storage)
  baseSalary: number
  hourlyRate: number        // For overtime calculation

  // Deductions
  ssfNumber: string         // Social Security Fund number
  providentFundRate: number // % contribution (optional)
  taxId: string             // For PND 91

  // Status
  active: boolean
  startDate: Date
  endDate?: Date
}
```

**Payroll Posting to GL**
```typescript
// Debit: Salary Expense (gross)
// Credit: SSF Payable (employee portion)
// Credit: Tax Payable (withholding)
// Credit: Provident Fund Payable
// Credit: Cash/Bank (net pay)

await prisma.journalEntry.create({
  data: {
    date: payrollDate,
    lines: {
      create: [
        { accountId: salaryExpenseAccount, debit: gross, credit: 0 },
        { accountId: ssfPayableAccount, debit: 0, credit: ssf },
        { accountId: taxPayableAccount, debit: 0, credit: tax },
        { accountId: pfPayableAccount, debit: 0, credit: providentFund },
        { accountId: cashAccount, debit: 0, credit: netPay }
      ]
    }
  }
})
```

**Overtime Calculation**
```typescript
// Overtime rate = hourly rate × 1.5 (weekdays) or × 2.0 (holidays)
const calculateOvertime = (
  hours: number,
  hourlyRate: number,
  isHoliday: boolean
) => {
  const rate = isHoliday ? 2.0 : 1.5
  return hours * hourlyRate * rate
}
```

**Payroll Run Status**
```typescript
enum PayrollStatus {
  DRAFT = 'DRAFT',           // Not yet calculated
  CALCULATED = 'CALCULATED', // Ready for review
  POSTED = 'POSTED',         // Posted to GL
  PAID = 'PAID'              // Payment completed
}

interface PayrollRun {
  id: string
  period: string             // YYYY-MM
  status: PayrollStatus
  employeeCount: number
  totalGross: number         // In Satang
  totalNet: number           // In Satang
  journalEntryId?: string    // Set when posted
}
```

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `requireAuth()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/payroll/*` - Employee CRUD, payroll runs, calculations
- `prisma/employee` - Employee data
- `prisma/payrollRun` - Payroll run tracking

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
