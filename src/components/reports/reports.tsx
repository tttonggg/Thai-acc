'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  PieChart,
  TrendingUp,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';
import { th } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { CashFlowReport } from './cash-flow-report';

interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const reports = [
  {
    id: 'trial_balance',
    name: 'งบทดลอง',
    icon: BarChart3,
    description: 'แสดงยอดเดบิตและเครดิตของแต่ละบัญชี',
    supportsDateRange: true,
  },
  {
    id: 'balance_sheet',
    name: 'งบดุล',
    icon: PieChart,
    description: 'แสดงสินทรัพย์ หนี้สิน และทุน',
    supportsDateRange: true,
  },
  {
    id: 'income_statement',
    name: 'งบกำไรขาดทุน',
    icon: TrendingUp,
    description: 'แสดงรายได้และค่าใช้จ่าย',
    supportsDateRange: true,
  },
  {
    id: 'cash_flow',
    name: 'งบกระแสเงินสด',
    icon: TrendingUp,
    description: 'แสดงกระแสเงินสดจากกิจกรรมดำเนินงาน ลงทุน และจัดหาเงิน',
    supportsDateRange: true,
  },
  {
    id: 'general_ledger',
    name: 'สมุดบัญชีแยกประเภท',
    icon: FileText,
    description: 'รายการบัญชีแยกตามบัญชี',
    supportsDateRange: true,
  },
  {
    id: 'aging_ar',
    name: 'รายงานลูกหนี้ตามอายุหนี้',
    icon: PieChart,
    description: 'จำแนกลูกหนี้ตามอายุหนี้',
    supportsDateRange: false,
  },
  {
    id: 'aging_ap',
    name: 'รายงานเจ้าหนี้ตามอายุหนี้',
    icon: PieChart,
    description: 'จำแนกเจ้าหนี้ตามอายุหนี้',
    supportsDateRange: false,
  },
  {
    id: 'vat_report',
    name: 'รายงานภาษีมูลค่าเพิ่ม',
    icon: FileText,
    description: 'รายงานภาษีขาย-ภาษีซื้อ',
    supportsDateRange: true,
  },
  {
    id: 'wht_report',
    name: 'รายงานภาษีหัก ณ ที่จ่าย',
    icon: FileText,
    description: 'รายงาน ภงด.3, ภงด.53',
    supportsDateRange: true,
  },
];

// Thai Fiscal Year: Oct-Sep
function getFiscalYearRange(date: Date): { start: Date; end: Date; label: string } {
  const month = date.getMonth();
  const year = date.getFullYear();
  // Thai fiscal year: Oct (9) - Sep (8)
  if (month >= 9) {
    return {
      start: new Date(year, 9, 1),
      end: new Date(year + 1, 8, 30),
      label: `ปีงบประมาณ ${year + 1}`,
    };
  } else {
    return {
      start: new Date(year - 1, 9, 1),
      end: new Date(year, 8, 30),
      label: `ปีงบประมาณ ${year}`,
    };
  }
}

function getHalfYearRange(date: Date): { start: Date; end: Date; label: string } {
  const month = date.getMonth();
  const year = date.getFullYear();
  // H1: Jan-Jun, H2: Jul-Dec
  if (month >= 6) {
    return {
      start: new Date(year, 6, 1),
      end: new Date(year, 11, 31),
      label: `ครึ่งปีหลัง ${year}`,
    };
  } else {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 5, 30),
      label: `ครึ่งปีแรก ${year}`,
    };
  }
}

function getQuarterRange(date: Date): { start: Date; end: Date; label: string } {
  const quarter = Math.floor(date.getMonth() / 3);
  const year = date.getFullYear();
  const startMonth = quarter * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 0),
    label: `ไตรมาส ${quarter + 1}/${year}`,
  };
}

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    label: 'เดือนนี้',
  });
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const { toast } = useToast();

  // Convert Satang to Baht for display
  const formatBaht = (satang: number) =>
    (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Update date range when period changes
  useEffect(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'current_month':
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now),
          label: 'เดือนนี้',
        });
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
          label: 'เดือนที่แล้ว',
        });
        break;
      case 'current_quarter':
        const cq = getQuarterRange(now);
        setDateRange({
          from: cq.start,
          to: cq.end,
          label: cq.label,
        });
        break;
      case 'last_quarter':
        const lq = getQuarterRange(subQuarters(now, 1));
        setDateRange({
          from: lq.start,
          to: lq.end,
          label: lq.label,
        });
        break;
      case 'current_half':
        const ch = getHalfYearRange(now);
        setDateRange({
          from: ch.start,
          to: ch.end,
          label: ch.label,
        });
        break;
      case 'last_half':
        const lh = getHalfYearRange(subMonths(now, 6));
        setDateRange({
          from: lh.start,
          to: lh.end,
          label: lh.label,
        });
        break;
      case 'current_fiscal':
        const cf = getFiscalYearRange(now);
        setDateRange({
          from: cf.start,
          to: cf.end,
          label: cf.label,
        });
        break;
      case 'last_fiscal':
        const lf = getFiscalYearRange(subYears(now, 1));
        setDateRange({
          from: lf.start,
          to: lf.end,
          label: lf.label,
        });
        break;
      case 'current_year':
        setDateRange({
          from: startOfYear(now),
          to: endOfYear(now),
          label: `ปี ${now.getFullYear()}`,
        });
        break;
      case 'last_year':
        const ly = subYears(now, 1);
        setDateRange({
          from: startOfYear(ly),
          to: endOfYear(ly),
          label: `ปี ${ly.getFullYear()}`,
        });
        break;
      case 'ytd':
        setDateRange({
          from: startOfYear(now),
          to: now,
          label: 'ตั้งแต่ต้นปี',
        });
        break;
      case 'all':
        setDateRange({
          from: new Date(2020, 0, 1),
          to: now,
          label: 'ทั้งหมด',
        });
        break;
    }
  }, [selectedPeriod]);

  const handleExport = async (reportId: string, format: 'pdf' | 'excel') => {
    setExportingReport(reportId);
    try {
      let url = '';
      let filename = '';

      switch (reportId) {
        case 'trial_balance':
          url = `/api/reports/trial-balance/export/${format}`;
          filename = `trial-balance-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'balance_sheet':
          url = `/api/reports/balance-sheet/export/${format}`;
          filename = `balance-sheet-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'income_statement':
          url = `/api/reports/income-statement/export/${format}`;
          filename = `income-statement-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'general_ledger':
          url = `/api/reports/general-ledger/export/${format}`;
          filename = `general-ledger.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'aging_ar':
          url = `/api/reports/aging-ar/export/${format}`;
          filename = `ar-aging.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'aging_ap':
          url = `/api/reports/aging-ap/export/${format}`;
          filename = `ap-aging.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'vat_report':
          url = `/api/reports/vat/export/${format}`;
          filename = `vat-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        case 'wht_report':
          url = `/api/reports/wht/export/${format}`;
          filename = `wht-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          break;
        default:
          throw new Error('Unknown report type');
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'ดาวน์โหลดรายงานเรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setExportingReport(null);
    }
  };

  const handlePrint = async (reportId: string) => {
    // Map report IDs to names and API endpoints for data fetching
    const reportConfig: Record<string, { name: string; apiPath: string }> = {
      trial_balance: { name: 'งบทดลอง', apiPath: '/api/reports/trial-balance' },
      balance_sheet: { name: 'งบดุล', apiPath: '/api/reports/balance-sheet' },
      income_statement: { name: 'งบกำไรขาดทุน', apiPath: '/api/reports/income-statement' },
      cash_flow: { name: 'งบกระแสเงินสด', apiPath: '/api/reports/cash-flow' },
      general_ledger: { name: 'สมุดบัญชีแยกประเภท', apiPath: '/api/reports/general-ledger' },
      aging_ar: { name: 'รายงานลูกหนี้ตามอายุหนี้', apiPath: '/api/reports/aging-ar' },
      aging_ap: { name: 'รายงานเจ้าหนี้ตามอายุหนี้', apiPath: '/api/reports/aging-ap' },
    };

    const config = reportConfig[reportId];
    if (!config) {
      toast({
        title: 'ไม่สามารถพิมพ์ได้',
        description: 'รายงานนี้ยังไม่รองรับการพิมพ์',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch report data
      const res = await fetch(config.apiPath);
      if (!res.ok) throw new Error('Failed to fetch report data');

      const data = await res.json();

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'ไม่สามารถเปิดหน้าต่างได้',
          description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
          variant: 'destructive',
        });
        return;
      }

      // Generate HTML based on report type
      let contentHtml = '';

      if (reportId === 'trial_balance') {
        const accounts = data.accounts || [];
        const totalDebit = accounts.reduce((sum: number, a: any) => sum + (a.debit || 0), 0);
        const totalCredit = accounts.reduce((sum: number, a: any) => sum + (a.credit || 0), 0);

        contentHtml = `
          <table>
            <thead>
              <tr>
                <th>รหัสบัญชี</th>
                <th>ชื่อบัญชี</th>
                <th class="text-right">เดบิต</th>
                <th class="text-right">เครดิต</th>
              </tr>
            </thead>
            <tbody>
              ${accounts
                .map(
                  (acc: any) => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td class="text-right">${(acc.debit || 0) > 0 ? formatBaht(acc.debit) : ''}</td>
                  <td class="text-right">${(acc.credit || 0) > 0 ? formatBaht(acc.credit) : ''}</td>
                </tr>
              `
                )
                .join('')}
              <tr style="font-weight: bold; background: #f5f5f5;">
                <td colspan="2">รวม</td>
                <td class="text-right">${formatBaht(totalDebit)}</td>
                <td class="text-right">${formatBaht(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (reportId === 'balance_sheet') {
        contentHtml = `
          <h2>สินทรัพย์</h2>
          <p>สินทรัพย์หมุนเวียน: ${formatBaht(data.currentAssets || 0)} บาท</p>
          <p>สินทรัพย์ไม่หมุนเวียน: ${formatBaht(data.nonCurrentAssets || 0)} บาท</p>
          <p style="font-weight: bold;">รวมสินทรัพย์: ${formatBaht(data.totalAssets || 0)} บาท</p>

          <h2>หนี้สิน</h2>
          <p>หนี้สินหมุนเวียน: ${formatBaht(data.currentLiabilities || 0)} บาท</p>
          <p>หนี้สินไม่หมุนเวียน: ${formatBaht(data.nonCurrentLiabilities || 0)} บาท</p>
          <p style="font-weight: bold;">รวมหนี้สิน: ${formatBaht(data.totalLiabilities || 0)} บาท</p>

          <h2>ทุน</h2>
          <p style="font-weight: bold;">รวมทุน: ${formatBaht(data.totalEquity || 0)} บาท</p>
        `;
      } else if (reportId === 'income_statement') {
        contentHtml = `
          <h2>รายได้</h2>
          <p>รายได้จากการขาย: ${formatBaht(data.revenue || 0)} บาท</p>
          <p>รายได้อื่น: ${formatBaht(data.otherIncome || 0)} บาท</p>
          <p style="font-weight: bold;">รวมรายได้: ${formatBaht(data.totalRevenue || 0)} บาท</p>

          <h2>ค่าใช้จ่าย</h2>
          <p>ต้นทุนขาย: ${formatBaht(data.costOfSales || 0)} บาท</p>
          <p>ค่าใช้จ่ายในการขาย: ${formatBaht(data.sellingExpenses || 0)} บาท</p>
          <p>ค่าใช้จ่ายในการบริหาร: ${formatBaht(data.adminExpenses || 0)} บาท</p>
          <p style="font-weight: bold;">รวมค่าใช้จ่าย: ${formatBaht(data.totalExpenses || 0)} บาท</p>

          <h2>ผลการดำเนินงาน</h2>
          <p style="font-weight: bold; font-size: 18px;">กำไร(ขาดทุน)สุทธิ: ${formatBaht(data.netIncome || 0)} บาท</p>
        `;
      } else if (reportId === 'cash_flow') {
        const cf = data.data || {};
        contentHtml = `
          <h2>สรุป</h2>
          <p>กระแสเงินสดสุทธิ: ${formatBaht(cf.summary?.netChange || 0)} บาท</p>
          <p>เงินสดยกมา: ${formatBaht(cf.summary?.beginningCash || 0)} บาท</p>
          <p>เงินสดคงเหลือ: ${formatBaht(cf.summary?.endingCash || 0)} บาท</p>

          <h2>กิจกรรมดำเนินงาน</h2>
          <p>กระแสเงินสดจากกิจกรรมดำเนินงาน: ${formatBaht(cf.operating?.netCash || 0)} บาท</p>

          <h2>กิจกรรมลงทุน</h2>
          <p>เงินสดเข้า: ${formatBaht(cf.investing?.inflows || 0)} บาท</p>
          <p>เงินสดออก: ${formatBaht(cf.investing?.outflows || 0)} บาท</p>
          <p>รวม: ${formatBaht(cf.investing?.netCash || 0)} บาท</p>

          <h2>กิจกรรมจัดหาเงิน</h2>
          <p>เงินสดเข้า: ${formatBaht(cf.financing?.inflows || 0)} บาท</p>
          <p>เงินสดออก: ${formatBaht(cf.financing?.outflows || 0)} บาท</p>
          <p>รวม: ${formatBaht(cf.financing?.netCash || 0)} บาท</p>
        `;
      } else {
        contentHtml = `<p>รายงานนี้แสดงในรูปแบบของหน้าเว็บเท่านั้น</p>`;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${config.name}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .summary { margin-top: 20px; padding: 15px; background: #f9f9f9; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${config.name}</h1>
          <p style="text-align: center;">วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}</p>
          
          ${contentHtml}

          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      toast({
        title: 'พิมพ์ไม่สำเร็จ',
        description: 'ไม่สามารถดึงข้อมูลรายงานได้',
        variant: 'destructive',
      });
    }
  };

  const formatThaiDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: th });
  };

  const applyCustomDate = () => {
    if (customFrom && customTo) {
      setDateRange({
        from: customFrom,
        to: customTo,
        label: `${formatThaiDate(customFrom)} - ${formatThaiDate(customTo)}`,
      });
      setCustomDateOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายงาน</h1>
          <p className="mt-1 text-gray-500">รายงานทางการเงินและบัญชี</p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
            <Calendar className="ml-2 h-4 w-4 text-gray-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">เดือนนี้</SelectItem>
                <SelectItem value="last_month">เดือนที่แล้ว</SelectItem>
                <SelectItem value="current_quarter">ไตรมาสนี้</SelectItem>
                <SelectItem value="last_quarter">ไตรมาสที่แล้ว</SelectItem>
                <SelectItem value="current_half">ครึ่งปีนี้</SelectItem>
                <SelectItem value="last_half">ครึ่งปีที่แล้ว</SelectItem>
                <SelectItem value="current_year">ปีนี้</SelectItem>
                <SelectItem value="last_year">ปีที่แล้ว</SelectItem>
                <SelectItem value="ytd">ตั้งแต่ต้นปี</SelectItem>
                <SelectItem value="current_fiscal">ปีงบประมาณนี้</SelectItem>
                <SelectItem value="last_fiscal">ปีงบประมาณที่แล้ว</SelectItem>
                <SelectItem value="all">ทั้งหมด</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                กำหนดเอง
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">เลือกช่วงวันที่</h4>
                <div className="flex gap-4">
                  <div>
                    <label className="text-xs text-gray-500">จาก</label>
                    <CalendarComponent
                      mode="single"
                      selected={customFrom}
                      onSelect={setCustomFrom}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">ถึง</label>
                    <CalendarComponent
                      mode="single"
                      selected={customTo}
                      onSelect={setCustomTo}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCustomDateOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="sm" onClick={applyCustomDate} disabled={!customFrom || !customTo}>
                    ใช้งาน
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">{dateRange.label}</span>
          <span className="text-blue-700">
            ({formatThaiDate(dateRange.from)} - {formatThaiDate(dateRange.to)})
          </span>
        </div>
        <div className="text-sm text-blue-600">
          ระยะเวลา:{' '}
          {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))}{' '}
          วัน
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-500">{report.description}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePrint(report.id)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    พิมพ์
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleExport(report.id, 'excel')}
                    disabled={exportingReport === report.id}
                  >
                    {exportingReport === report.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังส่งออก...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        ส่งออก
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Preview - Balance Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">งบดุล - ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceSheetPreview />
        </CardContent>
      </Card>

      {/* Quick Preview - Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">งบกำไรขาดทุน - ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeStatementPreview />
        </CardContent>
      </Card>

      {/* Quick Preview - Trial Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">งบทดลอง - ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <TrialBalancePreview />
        </CardContent>
      </Card>

      {/* Cash Flow Report Preview */}
      <CashFlowReport dateRange={dateRange} />
    </div>
  );
}

// Balance Sheet Response interface
interface BalanceSheetResponse {
  success: boolean;
  asOfDate: string;
  data: {
    assets: Array<{ code: string; name: string; nameEn?: string | null; amount: number }>;
    liabilities: Array<{ code: string; name: string; nameEn?: string | null; amount: number }>;
    equity: Array<{ code: string; name: string; nameEn?: string | null; amount: number }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
  };
}

// Balance Sheet Preview Component - fetches real data from API
function BalanceSheetPreview() {
  const { data, isLoading, error } = useQuery<BalanceSheetResponse>({
    queryKey: ['balance-sheet-preview'],
    queryFn: async () => {
      const res = await fetch('/api/reports/balance-sheet', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch balance sheet');
      return res.json();
    },
  });

  const formatBaht = (amount: number) => {
    if (amount === 0) return '-';
    return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
      </div>
    );
  }

  const { data: bsData } = data || {};
  const assets = bsData?.assets || [];
  const liabilities = bsData?.liabilities || [];
  const equity = bsData?.equity || [];

  if (assets.length === 0 && liabilities.length === 0 && equity.length === 0) {
    return <div className="py-8 text-center text-gray-500">ไม่พบข้อมูลงบดุล</div>;
  }

  return (
    <div className="space-y-6">
      {/* Assets Section */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          สินทรัพย์
        </h4>
        <div className="space-y-1">
          {assets.map((account) => (
            <div key={account.code} className="flex items-center justify-between px-3 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{account.code}</span>
                <span>{account.name}</span>
              </div>
              <span className="font-medium text-blue-600">{formatBaht(account.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded bg-blue-50 px-3 py-1.5 text-sm font-semibold">
            <span>รวมสินทรัพย์</span>
            <span className="text-blue-700">{formatBaht(bsData?.totalAssets || 0)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities Section */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          หนี้สิน
        </h4>
        <div className="space-y-1">
          {liabilities.map((account) => (
            <div key={account.code} className="flex items-center justify-between px-3 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{account.code}</span>
                <span>{account.name}</span>
              </div>
              <span className="font-medium text-red-600">{formatBaht(account.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded bg-red-50 px-3 py-1.5 text-sm font-semibold">
            <span>รวมหนี้สิน</span>
            <span className="text-red-700">{formatBaht(bsData?.totalLiabilities || 0)}</span>
          </div>
        </div>
      </div>

      {/* Equity Section */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          ส่วนของผู้ถือหุ้น
        </h4>
        <div className="space-y-1">
          {equity.map((account) => (
            <div key={account.code} className="flex items-center justify-between px-3 py-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{account.code}</span>
                <span>{account.name}</span>
              </div>
              <span className="font-medium text-green-600">{formatBaht(account.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded bg-green-50 px-3 py-1.5 text-sm font-semibold">
            <span>รวมส่วนของผู้ถือหุ้น</span>
            <span className="text-green-700">{formatBaht(bsData?.totalEquity || 0)}</span>
          </div>
        </div>
      </div>

      {/* Balance Validation */}
      <div
        className={`flex items-center justify-center gap-2 rounded px-4 py-2 ${bsData?.isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
      >
        {bsData?.isBalanced ? (
          <>✓ งบดุลสมดุล (สินทรัพย์ = หนี้สิน + ส่วนของผู้ถือหุ้น)</>
        ) : (
          <>✗ งบดุลไม่สมดุล</>
        )}
      </div>
    </div>
  );
}

// Trial Balance Preview Component - fetches real data from API
function TrialBalancePreview() {
  const { data, isLoading, error } = useQuery<TrialBalanceResponse>({
    queryKey: ['trial-balance-preview'],
    queryFn: async () => {
      const res = await fetch('/api/reports/trial-balance', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch trial balance');
      return res.json();
    },
  });

  const formatBaht = (amount: number) => {
    if (amount === 0) return '-';
    return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
      </div>
    );
  }

  const accounts = data?.accounts || [];
  const totals = data?.totals || { debit: 0, credit: 0 };

  if (accounts.length === 0) {
    return <div className="py-8 text-center text-gray-500">ไม่พบข้อมูลบัญชี</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left">รหัสบัญชี</th>
            <th className="px-4 py-2 text-left">ชื่อบัญชี</th>
            <th className="px-4 py-2 text-right">เดบิต</th>
            <th className="px-4 py-2 text-right">เครดิต</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.code} className="border-b">
              <td className="px-4 py-2 font-mono">{account.code}</td>
              <td className="px-4 py-2">{account.name}</td>
              <td className="px-4 py-2 text-right text-blue-600">
                {account.debit > 0 ? formatBaht(account.debit) : '-'}
              </td>
              <td className="px-4 py-2 text-right text-green-600">
                {account.credit > 0 ? formatBaht(account.credit) : '-'}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2" colSpan={2}>
              รวม
            </td>
            <td className="px-4 py-2 text-right text-blue-600">{formatBaht(totals.debit)}</td>
            <td className="px-4 py-2 text-right text-green-600">{formatBaht(totals.credit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface TrialBalanceResponse {
  success: boolean;
  asOfDate: string;
  accounts: Array<{
    code: string;
    name: string;
    nameEn?: string | null;
    type: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  totals: {
    debit: number;
    credit: number;
    isBalanced: boolean;
  };
}

// Income Statement Response interface
interface IncomeStatementResponse {
  success: boolean;
  asOfDate: string;
  data: {
    revenue: number;
    costOfSales: number;
    grossProfit: number;
    operatingExpenses: number;
    otherIncome: number;
    otherExpenses: number;
    expenses: number;
    netIncome: number;
    isProfit: boolean;
  };
}

// Income Statement Preview Component - fetches real data from API
function IncomeStatementPreview() {
  const { data, isLoading, error } = useQuery<IncomeStatementResponse>({
    queryKey: ['income-statement-preview'],
    queryFn: async () => {
      const res = await fetch('/api/reports/income-statement', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch income statement');
      return res.json();
    },
  });

  const formatBaht = (amount: number) => {
    if (amount === 0) return '-';
    return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
      </div>
    );
  }

  const isData = data?.data;
  const netIncome = isData?.netIncome || 0;
  const isProfit = isData?.isProfit ?? netIncome >= 0;

  return (
    <div className="space-y-4">
      {/* Revenue */}
      <div className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="text-gray-600">รายได้</span>
        <span className="font-medium text-green-600">{formatBaht(isData?.revenue || 0)}</span>
      </div>

      {/* COGS */}
      <div className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="text-gray-600">ต้นทุนขาย</span>
        <span className="font-medium text-red-600">({formatBaht(isData?.costOfSales || 0)})</span>
      </div>

      {/* Gross Profit */}
      <div className="flex items-center justify-between rounded bg-blue-50 px-3 py-2 text-sm">
        <span className="font-semibold text-blue-700">กำไรขั้นต้น</span>
        <span className="font-semibold text-blue-700">{formatBaht(isData?.grossProfit || 0)}</span>
      </div>

      {/* Expenses */}
      <div className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="text-gray-600">ค่าใช้จ่าย</span>
        <span className="font-medium text-red-600">({formatBaht(isData?.expenses || 0)})</span>
      </div>

      {/* Net Income */}
      <div
        className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-semibold ${
          isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        <span>{isProfit ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}</span>
        <span>{formatBaht(Math.abs(netIncome))}</span>
      </div>
    </div>
  );
}
