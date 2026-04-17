<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Accounts Receivable (Customer Management)

## Purpose
Customer lifecycle management — customer CRUD, tax ID validation, credit limits, balance tracking, and AR aging reports. Customers are critical for invoice creation.

## Key Files
| File | Description |
|------|-------------|
| `customer-list.tsx` | Paginated customer list with search, filtering by province/status |
| `customer-list-virtual.tsx` | Virtualized list for 1000+ customers |
| `customer-edit-dialog.tsx` | Customer creation/editing form with tax ID format validation |

## For AI Agents

### Working In This Directory

**Customer Data Model**
```typescript
interface Customer {
  id: string
  code: string           // Unique customer code
  name: string           // Customer/company name
  taxId: string          // Tax ID (13 digits) or person ID
  phone: string
  email: string
  province: string
  creditLimit: number    // Maximum credit allowed in Satang
  balance: number        // Outstanding amount in Satang
  status: 'ACTIVE' | 'INACTIVE'
}
```

**Critical Invariants**
- Tax ID must be 13 digits for companies, personal ID for individuals
- Customer code must be unique
- Balance = sum of unpaid invoices
- Credit limit enforced on invoice creation
- Cannot delete customer with outstanding balance

**When Adding Features**
1. Add customer validation to invoice
2. Update AR aging report
3. Add customer payment tracking
4. Update API route `/api/customers/route.ts`
5. Add E2E test in `e2e/ar.spec.ts`

## Dependencies

### Internal
- `@/lib/currency` - Satang conversion for balance/credit
- `@/lib/api-utils` - `requireAuth()`
- `@/components/ui/*` - Dialog, Table, Form components
- `/api/customers` - Customer CRUD operations
- `prisma/customer` - Database model

### External
- `@tanstack/react-query` v5 - Data fetching
- `react-hook-form` v7 - Form handling
- `zod` v4 - Schema validation
- `lucide-react` - Icons
