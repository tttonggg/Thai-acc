<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-16 -->

# Chart of Accounts Management

## Purpose
Chart of accounts (COA) maintenance — account CRUD operations, account hierarchy, account types (asset, liability, equity, revenue, expense), and Thai standard account codes (181 accounts).

## Key Files
| File | Description |
|------|-------------|
| `chart-of-accounts.tsx` | Main COA view with search, filtering, hierarchy display |
| `account-edit-dialog.tsx` | Account creation/editing form |

## For AI Agents

### Working In This Directory

**Critical Rules**
- Account codes must follow Thai standard (4-digit: 1000-9999)
- Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Account hierarchy: Parent accounts must exist before children
- Used accounts cannot be deleted (have transactions in JournalEntryLine)
- Account codes must be unique (even across different types)

**Critical Invariants**
- Account code format: `^\d{4}$` (1000-9999)
- Root accounts (1000, 2000, 3000, 4000, 5000) cannot be deleted
- Account name must be unique (case-insensitive)
- Parent account must be of same type (e.g., asset under asset)
- Cannot delete account with non-zero balance or transaction history
- Active/inactive status cannot prevent viewing, only posting

**When Adding Features**
1. Validate account code uniqueness and format
2. Check for existing transactions before delete
3. Update API route `/api/accounts/route.ts`
4. Re-seed COA if modifying standard accounts
5. Add E2E test in `e2e/accounts.spec.ts`

### Common Patterns

**Account Hierarchy**
```typescript
interface Account {
  id: string
  code: string        // 4-digit: 1000-9999
  name: string        // Thai name
  type: AccountType   // ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  parentId?: string   // Parent account for hierarchy
  active: boolean     // Active/inactive status
  deletedAt?: Date    // Soft delete
}

// Root accounts (Thai standard)
const ASSET_ROOT = '1000'
const LIABILITY_ROOT = '2000'
const EQUITY_ROOT = '3000'
const REVENUE_ROOT = '4000'
const EXPENSE_ROOT = '5000'
```

**Account Type Validation**
```typescript
const accountSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'รหัสบัญชีต้องเป็น 4 หลัก'),
  name: z.string().min(1, 'กรุณาระบุชื่อบัญชี'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'VENUE', 'EXPENSE']),
  parentId: z.string().optional(),
  active: z.boolean().default(true)
})

// Parent must be same type
if (parentId) {
  const parent = await prisma.account.findUnique({ where: { id: parentId } })
  if (parent.type !== formData.type) {
    throw new Error('บัญชีหลักต้องเป็นประเภทเดียวกัน')
  }
}
```

**Account Code Validation**
```typescript
// Check uniqueness
const existing = await prisma.account.findUnique({
  where: { code: formData.code }
})

if (existing && existing.id !== accountId) {
  throw new Error('รหัสบัญชีนี้มีอยู่แล้ว')
}

// Cannot use root account codes
const rootCodes = ['1000', '2000', '3000', '4000', '5000']
if (rootCodes.includes(formData.code) && !accountId) {
  throw new Error('รหัสบัญชีหลักไม่สามารถสร้างใหม่ได้')
}
```

**Delete Validation**
```typescript
// Check for transactions
const transactions = await prisma.journalEntryLine.count({
  where: { accountId }
})

if (transactions > 0) {
  throw new Error('ไม่สามารถลบบัญชีที่มีรายการทำบัญชีได้')
}

// Check for children
const children = await prisma.account.count({
  where: { parentId: accountId }
})

if (children > 0) {
  throw new Error('ไม่สามารถลบบัญชีที่มีบัญชีย่อยได้')
}
```

**Account Lookup by Type**
```typescript
// Fetch accounts grouped by type
const assets = await prisma.account.findMany({
  where: { type: 'ASSET', deletedAt: null, active: true },
  orderBy: { code: 'asc' }
})

// Hierarchical view (with children)
const accounts = await prisma.account.findMany({
  where: { deletedAt: null },
  include: {
    children: true
  },
  orderBy: { code: 'asc' }
})
```

**Thai Standard COA Seeding**
```typescript
// 181 standard Thai accounts
const seedAccounts = [
  { code: '1001', name: 'เงินสด', type: 'ASSET' },
  { code: '1002', name: 'เงินฝากธนาคาร', type: 'ASSET' },
  { code: '1100', name: 'ลูกหนี้การค้า', type: 'ASSET' },
  // ... 178 more accounts
]
```

## Dependencies

### Internal
- `@/lib/api-utils` - `requireAuth()`, `requireRole()`
- `@/components/ui/*` - Dialog, Form, Table components
- `/api/accounts` - CRUD operations
- `prisma/account` - Database model

### External
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
