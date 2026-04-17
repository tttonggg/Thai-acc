<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Accounts Payable (Vendor Management)

## Purpose
Vendor lifecycle management — vendor CRUD, tax ID validation, credit management, balance tracking, and AP aging reports. Vendors are critical for purchase invoice creation.

## Key Files
| File | Description |
|------|-------------|
| `vendor-list.tsx` | Paginated vendor list with search, filtering by province/status |
| `vendor-edit-dialog.tsx` | Vendor creation/editing form with tax ID format validation |

## For AI Agents

### Working In This Directory

**Vendor Data Model**
```typescript
interface Vendor {
  id: string
  code: string           // Unique vendor code
  name: string           // Company name
  taxId: string          // Tax ID (13 digits)
  branchCode?: string    // Branch code for head office
  phone: string
  email: string
  province: string
  creditDays: number     // Payment terms (default 30)
  balance: number        // Outstanding amount in Satang
  status: 'ACTIVE' | 'INACTIVE'
}
```

**Critical Invariants**
- Tax ID must be 13 digits (validated via checksum)
- Vendor code must be unique
- Balance = sum of unpaid purchase invoices
- Cannot delete vendor with outstanding balance

**When Adding Features**
1. Add vendor validation to purchase invoice
2. Update AP aging report
3. Add vendor payment tracking
4. Update API route `/api/vendors/route.ts`
5. Add E2E test in `e2e/ap.spec.ts`

## Dependencies

### Internal
- `@/lib/currency` - Satang conversion for balance
- `@/lib/api-utils` - `requireAuth()`
- `@/components/ui/*` - Dialog, Table, Form components
- `/api/vendors` - Vendor CRUD operations
- `prisma/vendor` - Database model

### External
- `@tanstack/react-query` v5 - Data fetching
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `lucide-react` - Icons
