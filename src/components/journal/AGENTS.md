<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Journal Entry Management

## Purpose
General ledger journal entry management — manual journal entries, double-entry validation, posting to GL, and audit trail. Core of the double-entry accounting system.

## Key Files
| File | Description |
|------|-------------|
| `journal-entry.tsx` | Journal entry form with debit/credit balance validation |

## For AI Agents

### Working In This Directory

**Critical Accounting Rules**
- **Double-Entry**: Total debits MUST equal total credits (within 1 Satang rounding tolerance)
- **Balancing**: Journal entry cannot be saved if unbalanced
- **Account Types**: Debit increases assets/expenses, credit increases liabilities/equity/revenue
- **Posting**: Posted entries are immutable (only reversal allowed)
- **Idempotency**: Duplicate prevention via `idempotencyKey`

**Critical Invariants**
- `|sum(debits) - sum(credits)| ≤ 1` (Satang rounding tolerance)
- At least 2 line items required (one debit, one credit)
- Posted entries cannot be modified (create reversal entry instead)
- Journal entry numbers sequential (JE-YYYY-XXXXX)
- Date must be within current or previous fiscal year (no future dates)

**When Adding Features**
1. Validate double-entry balance before save
2. Add Satang conversion for all monetary fields
3. Update API route `/api/journal/route.ts`
4. Add audit log entry for all changes
5. Add E2E test in `e2e/journal.spec.ts`

### Common Patterns

**Double-Entry Validation**
```typescript
const validateJournalEntry = (lines: JournalLine[]) => {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)
  const diff = Math.abs(totalDebit - totalCredit)

  if (diff > 1) { // 1 Satang tolerance for rounding
    throw new Error(`ยอดไม่สมดุล: เดบิต ${totalDebit} เครดิต ${totalCredit} (ต่าง ${diff} Satang)`)
  }
}
```

**Line Item Structure**
```typescript
interface JournalLine {
  accountId: string      // Required
  description: string    // Optional
  debit: number          // In Satang (0 if credit)
  credit: number         // In Satang (0 if debit)
}

// Each line is EITHER debit OR credit, never both
if (line.debit > 0 && line.credit > 0) {
  throw new Error('บรรทัดรายการต้องเป็นเดบิตหรือเครดิตเท่านั้น')
}
```

**Account Selection**
```typescript
// Fetch active chart of accounts
const accounts = await prisma.account.findMany({
  where: { deletedAt: null, active: true },
  orderBy: [{ code: 'asc' }]
})

// Group by account type for better UX
const assets = accounts.filter(a => a.type === 'ASSET')
const liabilities = accounts.filter(a => a.type === 'LIABILITY')
const revenue = accounts.filter(a => a.type === 'REVENUE')
const expenses = accounts.filter(a => a.type === 'EXPENSE')
```

**Satang Conversion**
```typescript
import { bahtToSatang } from '@/lib/currency'

const journalEntry = await prisma.journalEntry.create({
  data: {
    date: formData.date,
    lines: {
      create: formData.lines.map(line => ({
        accountId: line.accountId,
        description: line.description,
        debit: bahtToSatang(line.debit),
        credit: bahtToSatang(line.credit)
      }))
    }
  }
})
```

**Reversal Entry**
```typescript
// Create reversal for posted entry
const reversal = await prisma.journalEntry.create({
  data: {
    date: new Date().toISOString(),
    description: `ย้อนกลับ: ${originalEntry.description}`,
    referenceId: originalEntry.id,
    lines: {
      create: originalEntry.lines.map(line => ({
        accountId: line.accountId,
        debit: line.credit,  // Swap debit/credit
        credit: line.debit   // Swap credit/debit
      }))
    }
  }
})
```

**Idempotency Key**
```typescript
// Prevent duplicate processing
const existing = await prisma.journalEntry.findUnique({
  where: { idempotencyKey: requestId }
})

if (existing) {
  return existing // Return existing, don't create duplicate
}
```

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/api-utils` - `generateDocNumber()`, `requireAuth()`
- `@/components/ui/*` - Form, Dialog, Table components
- `/api/journal` - CRUD, posting, reversal
- `src/components/accounts` - Chart of accounts lookup

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `date-fns` v4 - Date formatting
- `lucide-react` - Icons
