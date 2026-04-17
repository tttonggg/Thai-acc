<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Financial Reports & Analytics

## Purpose
Financial reporting — trial balance, balance sheet, income statement, general ledger, AR/AP aging, VAT report, WHT report. Supports Thai fiscal year (Oct-Sep).

## Key Files
| File | Description |
|------|-------------|
| `reports.tsx` | Main reports hub with report type selection, date range picker |
| `custom-report-builder.tsx` | Custom report builder with column/filter selection |
| `scheduled-reports-page.tsx` | Report scheduling and email delivery |

## For AI Agents

### Working In This Directory

**Report Types**
```typescript
const REPORTS = [
  { id: 'trial_balance', name: 'งบทดลอง', icon: BarChart3 },
  { id: 'balance_sheet', name: 'งบดุล', icon: PieChart },
  { id: 'income_statement', name: 'งบกำไรขาดทุน', icon: TrendingUp },
  { id: 'general_ledger', name: 'สมุดบัญชีแยกประเภท', icon: FileText },
  { id: 'aging_ar', name: 'รายงานลูกหนี้ตามอายุหนี้', icon: PieChart },
  { id: 'aging_ap', name: 'รายงานเจ้าหนี้ตามอายุหนี้', icon: PieChart },
  { id: 'vat_report', name: 'รายงานภาษีมูลค่าเพิ่ม', icon: FileText },
  { id: 'wht_report', name: 'รายงานภาษีหัก ณ ที่จ่าย', icon: FileText },
]
```

**Thai Fiscal Year**
```typescript
// Thai fiscal year: Oct (month 9) - Sep (month 8)
function getFiscalYearRange(date: Date): { start: Date; end: Date } {
  const month = date.getMonth()
  const year = date.getFullYear()
  if (month >= 9) {
    return { start: new Date(year, 9, 1), end: new Date(year + 1, 8, 30) }
  } else {
    return { start: new Date(year - 1, 9, 1), end: new Date(year, 8, 30) }
  }
}
```

**Critical Invariants**
- All monetary values in Satang (convert to Baht for display)
- Date ranges respect accounting period boundaries
- Report data based on POSTED transactions only
- Trial balance must balance (total debits = total credits)
- Aging reports use invoice due date

**When Adding Features**
1. Add new report type
2. Update report query logic
3. Add PDF export support
4. Update API route `/api/reports/route.ts`
5. Add E2E test in `e2e/reports.spec.ts`

## Dependencies

### Internal
- `@/lib/currency` - Satang/Baht conversion
- `@/lib/thai-accounting` - Thai date formatting
- `@/components/ui/*` - Card, Table, Select, Chart
- `/api/reports` - Report generation endpoints
- `prisma/journalEntry` - GL data source

### External
- `recharts` - Chart visualization
- `@tanstack/react-query` v5 - Data fetching
- `lucide-react` - Icons
- `date-fns` v4 - Date formatting
