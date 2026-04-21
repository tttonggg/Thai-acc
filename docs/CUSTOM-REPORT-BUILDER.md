# Custom Report Builder

## Overview

The Custom Report Builder allows users to create personalized financial reports with flexible configurations, filters, and output formats.

## Location

- **Component**: `/Users/tong/Thai-acc/src/components/reports/custom-report-builder.tsx`
- **API Endpoint**: `/Users/tong/Thai-acc/src/app/api/reports/custom/route.ts`
- **Templates API**: `/Users/tong/Thai-acc/src/app/api/reports/templates/route.ts`

## Features

### 1. Report Type Selection

Users can choose from 6 report types:

- **งบทดลอง (Trial Balance)** - Shows debit and credit balances for all accounts
- **งบดุลการเงิน (Balance Sheet)** - Assets, Liabilities, and Equity
- **งบกำไรขาดทุน (Income Statement)** - Revenue and Expenses
- **รายงานลูกหนี้เก่า (AR Aging)** - Accounts Receivable aging analysis
- **รายงานเจ้าหนี้เก่า (AP Aging)** - Accounts Payable aging analysis
- **รายงานสต็อก (Stock Report)** - Inventory valuation and quantities

### 2. Report Options Panel

- **Date Range**: From/To dates for filtering transactions
- **Comparison with Previous Period**: Checkbox to compare with prior period
- **Include Zero Balances**: Option to include/exclude accounts with zero balances
- **Account Level Filter**: Detail vs Summary view

### 3. Column Selection

Users can select which columns to display:

- Account code
- Account name (Thai/English)
- Opening balance
- Debits
- Credits
- Closing balance
- Budget
- Variance

### 4. Filter Section

- **Account Type Filter**: Filter by Asset, Liability, Equity, Revenue, or Expense
- **Account Range**: From/to account codes (e.g., 1000 to 1999)
- **Specific Accounts**: Filter by specific account selections

### 5. Output Options

- **PDF Export**: Download as PDF file
- **Excel Export**: Download as Excel spreadsheet
- **Screen Preview**: View report in browser before downloading

### 6. Save as Template

Users can save their configurations as templates for reuse:

- Click "บันทึกเป็นเทมเพลต" button
- Enter template name
- Template is stored in database
- Can be loaded and modified later

## API Endpoints

### POST /api/reports/custom

Generates a custom report based on configuration.

**Request Body:**
```json
{
  "reportType": "TRIAL_BALANCE",
  "reportName": "My Custom Report",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "comparePrevious": false,
  "includeZeroBalances": false,
  "accountLevel": "detail",
  "columnAccountCode": true,
  "columnAccountName": true,
  "columnDebits": true,
  "columnCredits": true,
  "filterAccountType": "ASSET",
  "filterAccountFrom": "1000",
  "filterAccountTo": "1999",
  "outputFormat": "preview"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "TRIAL_BALANCE",
    "asOfDate": "2024-12-31T23:59:59.999Z",
    "accounts": [...],
    "totals": {
      "debit": 1000000,
      "credit": 1000000,
      "isBalanced": true
    }
  }
}
```

### POST /api/reports/templates

Saves a report template.

**Request Body:**
```json
{
  "name": "Monthly Trial Balance",
  "config": {
    "reportType": "TRIAL_BALANCE",
    "includeZeroBalances": false,
    "accountLevel": "detail",
    "columnAccountCode": true,
    "columnAccountName": true,
    "columnDebits": true,
    "columnCredits": true
  }
}
```

### GET /api/reports/templates

Retrieves all saved templates.

## Usage Example

```tsx
import { CustomReportBuilder } from '@/components/reports/custom-report-builder'

export default function ReportsPage() {
  return <CustomReportBuilder />
}
```

## Database Schema

The component uses the existing `ScheduledReport` model to store templates:

```prisma
model ScheduledReport {
  id          String   @id @default(cuid())
  name        String
  reportType  String
  schedule    String   // "manual" for templates
  parameters  Json     // Report configuration
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Report Generation Logic

### Trial Balance
- Sums all journal entries up to the specified date
- Calculates debit/credit balances by account
- Validates debits = credits

### Balance Sheet
- Groups accounts by Assets, Liabilities, Equity
- Calculates retained earnings from revenue - expenses
- Validates Assets = Liabilities + Equity

### Income Statement
- Shows revenue and expense accounts
- Calculates net income
- Supports date range filtering

### AR Aging
- Groups customer invoices by aging buckets (0, 30, 60, 90, 90+ days)
- Calculates outstanding balances
- Filters by active customers

### AP Aging
- Groups vendor invoices by aging buckets (0, 30, 60, 90, 90+ days)
- Calculates outstanding balances
- Filters by active vendors

### Stock Report
- Shows inventory quantities and values
- Uses weighted average costing (WAC)
- Groups by warehouse and product

## Dependencies

- react-hook-form: Form handling
- @hookform/resolvers: Zod integration
- zod: Schema validation
- lucide-react: Icons
- shadcn/ui: UI components

## Thai Language Support

All labels, buttons, and messages are in Thai language:
- Report names: งบทดลอง, งบดุล, etc.
- UI labels: สร้างรายงาน, บันทึกเทมเพลต, etc.
- Error messages: Thai error descriptions

## Future Enhancements

Potential improvements:
- Add chart visualizations
- Support for custom calculations
- Scheduled report generation
- Email delivery of reports
- Report sharing and collaboration
- Custom report templates library
- Export to additional formats (CSV, JSON)
