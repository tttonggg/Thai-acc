# Excel Export Service

Complete Excel export functionality for Thai Accounting ERP reports using
SheetJS (xlsx).

## Overview

The Excel export service provides comprehensive export functionality for all
accounting reports in the Thai ERP system. All exports support Thai language,
proper number formatting, and professional styling.

## Features

### Supported Reports

1. **Trial Balance (งบทดลอง)**
   - Account code, name, debit, credit columns
   - Sorted by account code
   - Total row at bottom
   - Frozen header row
   - Auto-filter on all columns
   - Thai currency formatting (฿#,##0.00)

2. **Income Statement (งบกำไรขาดทุน)**
   - Revenue section with subtotals
   - Expense section with subtotals
   - Net income calculation
   - Section headers with bold styling
   - Currency formatting

3. **Balance Sheet (งบดุล)**
   - Assets section with subtotals
   - Liabilities section with subtotals
   - Equity section with subtotals
   - Total validation (Assets = Liabilities + Equity)
   - Validation status indicator

4. **AR Aging Report (ลูกหนี้คงเหลือ)**
   - Customer code and name
   - Aging buckets: 0-30, 31-60, 61-90, 90+ days
   - Total column
   - Percentage column (% of total)
   - Summary information

5. **AP Aging Report (เจ้าหนี้คงเหลือ)**
   - Vendor code and name
   - Aging buckets: 0-30, 31-60, 61-90, 90+ days
   - Total column
   - Percentage column (% of total)
   - Summary information

6. **VAT Report (ภาษีมูลค่าเพิ่ม PP30)**
   - Monthly breakdown (January-December)
   - Sales VAT, Purchase VAT, Payable VAT columns
   - YTD totals
   - Thai month names

7. **WHT Report (ภาษีหัก ณ ที่จ่าย)**
   - PND3 format (Salary withholding)
   - PND53 format (Service/rent withholding)
   - Transaction details with tax calculations
   - Summary totals

## API Endpoints

### Trial Balance Excel Export

```
GET /api/reports/trial-balance/export/excel
```

**Query Parameters:**

- `asOfDate` (optional): Date filter (ISO format)
- `accountId` (optional): Filter by specific account

**Example:**

```bash
curl "http://localhost:3000/api/reports/trial-balance/export/excel?asOfDate=2025-03-11" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -o trial-balance.xlsx
```

### Income Statement Excel Export

```
GET /api/reports/income-statement/export/excel
```

**Query Parameters:**

- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Example:**

```bash
curl "http://localhost:3000/api/reports/income-statement/export/excel?startDate=2025-01-01&endDate=2025-03-31" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -o income-statement.xlsx
```

### Balance Sheet Excel Export

```
GET /api/reports/balance-sheet/export/excel
```

**Query Parameters:**

- `asOfDate` (optional): Date filter (ISO format)

**Example:**

```bash
curl "http://localhost:3000/api/reports/balance-sheet/export/excel?asOfDate=2025-03-11" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -o balance-sheet.xlsx
```

## Usage in React Components

### Using Fetch API

```typescript
const exportToExcel = async () => {
  try {
    const response = await fetch(
      '/api/reports/trial-balance/export/excel?asOfDate=2025-03-11',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Get the blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export error:', error);
  }
};
```

### Using React Hook

```typescript
import { useState } from 'react';

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportTrialBalance = async (asOfDate?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (asOfDate) {
        params.set('asOfDate', asOfDate);
      }

      const response = await fetch(
        `/api/reports/trial-balance/export/excel?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial-balance-${asOfDate || 'today'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportTrialBalance,
    isExporting,
    error,
  };
}
```

## Styling Features

### Cell Styles

All Excel exports include professional styling:

- **Header Row**: Bold text, light gray background (#E0E0E0), center alignment,
  thick bottom border
- **Total Rows**: Bold text, yellow background (#FFF9E6), right alignment
- **Subtotal Rows**: Bold text, light blue background (#E6F3FF)
- **Currency Cells**: Thai currency format (฿#,##0.00), right alignment
- **Percentage Cells**: Percentage format (0.00%), right alignment

### Column Widths

Auto-calculated column widths with:

- Minimum width: 10 characters
- Maximum width: 50 characters
- Padding: 2 characters

### Additional Features

- **Frozen Header Rows**: Headers stay visible when scrolling
- **Auto-Filters**: Filter enabled on all data columns
- **Zebra Striping**: Alternating row colors for readability (optional)
- **Borders**: Thin borders on all cells, thick borders on headers and totals

## Library

This service uses **SheetJS (xlsx)** version 0.18.5 for Excel file generation.

```bash
npm install xlsx
```

## Type Definitions

```typescript
// Trial Balance
interface TrialBalanceReportData {
  accounts: TrialBalanceData[];
  totals: {
    debit: number;
    credit: number;
    isBalanced: boolean;
  };
  asOfDate: string;
}

// Income Statement
interface IncomeStatementData {
  revenue: IncomeStatementAccount[];
  expenses: IncomeStatementAccount[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

// Balance Sheet
interface BalanceSheetData {
  assets: BalanceSheetAccount[];
  liabilities: BalanceSheetAccount[];
  equity: BalanceSheetAccount[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

// AR Aging
interface ARAgingData {
  customers: ARAgingCustomer[];
  totals: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  };
  asOfDate: string;
}

// AP Aging
interface APAgingData {
  vendors: APAgingVendor[];
  totals: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  };
  asOfDate: string;
}

// VAT Report
interface VATReportData {
  monthlyData: VATMonthlyData[];
  ytdTotals: {
    salesVat: number;
    purchaseVat: number;
    payableVat: number;
  };
  year: number;
}

// WHT Report
interface WHTReportData {
  formType: 'PND3' | 'PND53';
  month: string;
  year: number;
  entries: WHTEntry[];
  totals: {
    grossAmount: number;
    withholdingTax: number;
    netPayment: number;
  };
}
```

## Testing

The service includes comprehensive unit tests:

```bash
npm test -- excel-export.test.ts
```

All tests verify:

- Buffer generation
- File format (ZIP signature)
- Data structure
- Thai language support

## Thai Language Support

All Excel exports fully support Thai language:

- UTF-8 encoding for proper character display
- Thai column headers
- Thai account names
- Thai date formats (DD/MM/YYYY + Buddhist year)
- Thai month names for reports

## File Format

- **Format**: XLSX (Office Open XML)
- **Compatibility**: Excel 2007+, Google Sheets, LibreOffice
- **Encoding**: UTF-8
- **Compression**: ZIP-based (standard XLSX format)

## Performance

- Efficient memory usage with streaming
- Optimized for large datasets
- Fast generation (typically < 1 second for standard reports)
- No temporary files needed

## Error Handling

All API endpoints include proper error handling:

- Authentication required
- Graceful error messages in Thai
- Proper HTTP status codes
- Detailed error logging

## Future Enhancements

Potential future improvements:

1. **Multi-sheet exports**: Combine multiple reports in one file
2. **Custom styling**: User-configurable colors and fonts
3. **Charts**: Add visual charts to Excel exports
4. **Pivot tables**: Generate pivot table summaries
5. **Conditional formatting**: Highlight values based on rules
6. **Password protection**: Protect exported files with passwords

## Contributing

When adding new Excel exports:

1. Follow the existing pattern in `excel-export.ts`
2. Add proper TypeScript types
3. Include Thai language support
4. Add comprehensive tests
5. Update this documentation

## License

This service is part of the Thai Accounting ERP system.
