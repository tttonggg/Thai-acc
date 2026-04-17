<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# System Settings Configuration

## Purpose
System configuration — company info, tax rates, document numbering, accounting periods, and system preferences.

## Key Files
| File | Description |
|------|-------------|
| `settings.tsx` | Main settings page with tabbed interface (Company, Tax, Documents, Accounting, System) |

## For AI Agents

### Working In This Directory

**Settings Categories**
```typescript
interface CompanyInfo {
  name: string
  nameEn: string
  taxId: string
  branchCode: string
  address: string
  subDistrict: string
  district: string
  province: string
  postalCode: string
  phone: string
  fax: string
  email: string
  website: string
  logo?: string
}

interface TaxRates {
  vatRate: number              // Default 7%
  whtPnd53Service: number     // 3%
  whtPnd53Rent: number        // 5%
  whtPnd53Prof: number        // 3%
  whtPnd53Contract: number    // 1%
  whtPnd53Advert: number      // 2%
}

interface DocumentNumberFormat {
  type: string
  prefix: string
  format: string
  resetMonthly: boolean
  resetYearly: boolean
}
```

**Document Types**
```typescript
const DOCUMENT_TYPES = [
  { type: 'invoice', label: 'ใบกำกับภาษี', defaultPrefix: 'INV' },
  { type: 'receipt', label: 'ใบเสร็จรับเงิน', defaultPrefix: 'RCP' },
  { type: 'payment', label: 'ใบจ่ายเงิน', defaultPrefix: 'PAY' },
  { type: 'journal', label: 'บันทึกบัญชี', defaultPrefix: 'JE' },
  { type: 'credit_note', label: 'ใบลดหนี้', defaultPrefix: 'CN' },
  { type: 'debit_note', label: 'ใบเพิ่มหนี้', defaultPrefix: 'DN' },
  { type: 'purchase', label: 'ใบซื้อ', defaultPrefix: 'PO' },
  { type: 'payroll', label: 'เงินเดือน', defaultPrefix: 'PAYROLL' },
  { type: 'petty_cash', label: 'เงินสดย่อย', defaultPrefix: 'PCV' },
]
```

**Critical Invariants**
- Tax ID validation (13 digits for companies)
- Document number prefix must be unique per type
- Cannot change VAT rate for posted invoices
- Accounting period locked after year-end close
- Only ADMIN can modify system settings

**When Adding Features**
1. Add new settings category
2. Validate setting changes
3. Update API route `/api/settings/route.ts`
4. Ensure changes apply immediately (no cache)
5. Add E2E test in `e2e/settings.spec.ts`

## Dependencies

### Internal
- `@/lib/api-utils` - `requireRole(['ADMIN'])`
- `@/components/ui/*` - Form, Tabs, Input, Select
- `/api/settings` - Settings CRUD
- `prisma/settings` - Settings database model

### External
- `react-hook-form` v7 - Form handling
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
