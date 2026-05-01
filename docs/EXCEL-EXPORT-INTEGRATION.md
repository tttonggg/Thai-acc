# Excel Export Integration Guide

This guide shows how to integrate Excel export functionality into report pages
in the Thai Accounting ERP system.

## Quick Start

### 1. Import the Export Button Component

```tsx
import { ExcelExportButton } from '@/components/examples/ExcelExportExample';
```

### 2. Add to Your Report Page

```tsx
export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">งบทดลอง</h1>
        <ExcelExportButton reportType="trial-balance" params={{ asOfDate }} />
      </div>

      {/* Your report content */}
    </div>
  );
}
```

## Complete Examples

### Trial Balance Page with Excel Export

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ExcelExportButton } from '@/components/examples/ExcelExportExample';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrialBalanceAccount {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const fetchTrialBalance = async () => {
    const response = await fetch(
      `/api/reports/trial-balance?asOfDate=${asOfDate}`
    );
    const data = await response.json();
    setAccounts(data.accounts);
    setTotals(data.totals);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">งบทดลอง</h1>
          <p className="text-sm text-muted-foreground">
            ณ วันที่ {new Date(asOfDate).toLocaleDateString('th-TH')}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <ExcelExportButton
            reportType="trial-balance"
            params={{ asOfDate }}
            filename={`trial-balance-${asOfDate}.xlsx`}
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">รหัสบัญชี</th>
                <th className="p-2 text-left">ชื่อบัญชี</th>
                <th className="p-2 text-right">เดบิต</th>
                <th className="p-2 text-right">เครดิต</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.code} className="border-b">
                  <td className="p-2">{account.code}</td>
                  <td className="p-2">{account.name}</td>
                  <td className="p-2 text-right">
                    {account.debit.toLocaleString('th-TH')}
                  </td>
                  <td className="p-2 text-right">
                    {account.credit.toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
              <tr className="border-b-2 bg-gray-50 font-bold">
                <td className="p-2" colSpan={2}>
                  รวมทั้งสิ้น
                </td>
                <td className="p-2 text-right">
                  {totals.debit.toLocaleString('th-TH')}
                </td>
                <td className="p-2 text-right">
                  {totals.credit.toLocaleString('th-TH')}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Income Statement Page with Excel Export

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ExcelExportButton } from '@/components/examples/ExcelExportExample';
import { Card, CardContent } from '@/components/ui/card';

interface IncomeStatementData {
  revenue: Array<{ code: string; name: string; amount: number }>;
  expenses: Array<{ code: string; name: string; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export default function IncomeStatementPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<IncomeStatementData | null>(null);

  useEffect(() => {
    fetchIncomeStatement();
  }, [startDate, endDate]);

  const fetchIncomeStatement = async () => {
    const response = await fetch(
      `/api/reports/income-statement?startDate=${startDate}&endDate=${endDate}`
    );
    const result = await response.json();
    setData(result.data);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">งบกำไรขาดทุน</h1>
          <p className="text-sm text-muted-foreground">
            ตั้งแต่วันที่ {new Date(startDate).toLocaleDateString('th-TH')} ถึง{' '}
            {new Date(endDate).toLocaleDateString('th-TH')}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <ExcelExportButton
            reportType="income-statement"
            params={{ startDate, endDate }}
            filename={`income-statement-${startDate}-to-${endDate}.xlsx`}
          />
        </div>
      </div>

      {data && (
        <Card>
          <CardContent className="pt-6">
            {/* Revenue Section */}
            <h2 className="mb-3 text-lg font-bold">รายได้</h2>
            {data.revenue.map((item) => (
              <div
                key={item.code}
                className="flex justify-between border-b px-4 py-2"
              >
                <span>
                  {item.code} - {item.name}
                </span>
                <span className="font-mono">
                  {item.amount.toLocaleString('th-TH')}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-b-2 bg-blue-50 px-4 py-2 font-bold">
              <span>รวมรายได้</span>
              <span className="font-mono">
                {data.totalRevenue.toLocaleString('th-TH')}
              </span>
            </div>

            {/* Expenses Section */}
            <h2 className="mb-3 mt-6 text-lg font-bold">ค่าใช้จ่าย</h2>
            {data.expenses.map((item) => (
              <div
                key={item.code}
                className="flex justify-between border-b px-4 py-2"
              >
                <span>
                  {item.code} - {item.name}
                </span>
                <span className="font-mono">
                  {item.amount.toLocaleString('th-TH')}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-b-2 bg-blue-50 px-4 py-2 font-bold">
              <span>รวมค่าใช้จ่าย</span>
              <span className="font-mono">
                {data.totalExpenses.toLocaleString('th-TH')}
              </span>
            </div>

            {/* Net Income */}
            <div className="mt-4 flex justify-between bg-yellow-50 px-4 py-3 text-lg font-bold">
              <span>{data.netIncome >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}</span>
              <span className="font-mono">
                {Math.abs(data.netIncome).toLocaleString('th-TH')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Balance Sheet Page with Excel Export

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ExcelExportButton } from '@/components/examples/ExcelExportExample';
import { Card, CardContent } from '@/components/ui/card';

interface BalanceSheetData {
  assets: Array<{ code: string; name: string; amount: number }>;
  liabilities: Array<{ code: string; name: string; amount: number }>;
  equity: Array<{ code: string; name: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<BalanceSheetData | null>(null);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const fetchBalanceSheet = async () => {
    const response = await fetch(
      `/api/reports/balance-sheet?asOfDate=${asOfDate}`
    );
    const result = await response.json();
    setData(result.data);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">งบดุล</h1>
          <p className="text-sm text-muted-foreground">
            ณ วันที่ {new Date(asOfDate).toLocaleDateString('th-TH')}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <ExcelExportButton
            reportType="balance-sheet"
            params={{ asOfDate }}
            filename={`balance-sheet-${asOfDate}.xlsx`}
          />
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-6">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle>สินทรัพย์</CardTitle>
            </CardHeader>
            <CardContent>
              {data.assets.map((item) => (
                <div
                  key={item.code}
                  className="flex justify-between border-b px-4 py-2"
                >
                  <span>
                    {item.code} - {item.name}
                  </span>
                  <span className="font-mono">
                    {item.amount.toLocaleString('th-TH')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-b-2 bg-blue-50 px-4 py-2 font-bold">
                <span>รวมสินทรัพย์</span>
                <span className="font-mono">
                  {data.totalAssets.toLocaleString('th-TH')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>หนี้สิน</CardTitle>
              </CardHeader>
              <CardContent>
                {data.liabilities.map((item) => (
                  <div
                    key={item.code}
                    className="flex justify-between border-b px-4 py-2"
                  >
                    <span>
                      {item.code} - {item.name}
                    </span>
                    <span className="font-mono">
                      {item.amount.toLocaleString('th-TH')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-b-2 bg-blue-50 px-4 py-2 font-bold">
                  <span>รวมหนี้สิน</span>
                  <span className="font-mono">
                    {data.totalLiabilities.toLocaleString('th-TH')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ส่วนของผู้ถือหุ้น</CardTitle>
              </CardHeader>
              <CardContent>
                {data.equity.map((item) => (
                  <div
                    key={item.code}
                    className="flex justify-between border-b px-4 py-2"
                  >
                    <span>
                      {item.code} - {item.name}
                    </span>
                    <span className="font-mono">
                      {item.amount.toLocaleString('th-TH')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-b-2 bg-blue-50 px-4 py-2 font-bold">
                  <span>รวมส่วนของผู้ถือหุ้น</span>
                  <span className="font-mono">
                    {data.totalEquity.toLocaleString('th-TH')}
                  </span>
                </div>
                <div className="mt-4 flex justify-between bg-green-50 px-4 py-2 font-bold">
                  <span>รวมหนี้สินและส่วนของผู้ถือหุ้น</span>
                  <span className="font-mono">
                    {(data.totalLiabilities + data.totalEquity).toLocaleString(
                      'th-TH'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Export Hook

```tsx
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportExcel = async (
    reportType: string,
    params: Record<string, string> = {},
    filename?: string
  ) => {
    setIsExporting(true);

    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(
        `/api/reports/${reportType}/export/excel?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        filename ||
        `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'ส่งออก Excel สำเร็จ',
        description: 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว',
      });

      return true;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'ส่งออก Excel ไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการส่งออกไฟล์',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportExcel, isExporting };
}

// Usage in component
function MyReportPage() {
  const { exportExcel, isExporting } = useExcelExport();

  const handleExport = () => {
    exportExcel('trial-balance', { asOfDate: '2025-03-11' });
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'กำลังส่งออก...' : 'ส่งออก Excel'}
    </button>
  );
}
```

### Batch Export Multiple Reports

```tsx
async function exportAllReports(asOfDate: string) {
  const reports = ['trial-balance', 'income-statement', 'balance-sheet'];

  for (const report of reports) {
    await fetch(
      `/api/reports/${report}/export/excel?asOfDate=${asOfDate}`
    ).then((res) => res.blob());
    // ... handle each blob
  }
}
```

## API Endpoints Reference

| Report Type      | Endpoint                                     | Parameters              |
| ---------------- | -------------------------------------------- | ----------------------- |
| Trial Balance    | `/api/reports/trial-balance/export/excel`    | `asOfDate`, `accountId` |
| Income Statement | `/api/reports/income-statement/export/excel` | `startDate`, `endDate`  |
| Balance Sheet    | `/api/reports/balance-sheet/export/excel`    | `asOfDate`              |

## Best Practices

1. **Always provide meaningful filenames** that include the report type and date
   range
2. **Show loading state** while export is in progress
3. **Display success/error messages** using toast notifications
4. **Validate date parameters** before calling the export API
5. **Handle authentication** - all export endpoints require valid session
6. **Test with large datasets** to ensure performance is acceptable

## Troubleshooting

### Export fails with 401 error

- Ensure user is authenticated
- Check session token is valid

### File downloads but won't open

- Check browser console for errors
- Verify xlsx library is installed
- Check API response headers

### Thai characters display incorrectly

- Ensure UTF-8 encoding is maintained
- Check browser charset settings
- Verify Excel is opening with correct encoding

### Export is slow

- Consider adding pagination for large reports
- Optimize database queries
- Use server-side processing

## Additional Resources

- [EXCEL-EXPORT-SERVICE.md](./EXCEL-EXPORT-SERVICE.md) - Complete service
  documentation
- [SheetJS Documentation](https://docs.sheetjs.com/) - Library reference
- [Test cases](./src/lib/__tests__/excel-export.test.ts) - Example test cases
