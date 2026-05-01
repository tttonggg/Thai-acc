'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { satangToBaht, formatBaht } from '@/lib/currency';

interface DateRange {
  from: Date;
  to: Date;
}

interface WorkingCapitalChange {
  code: string;
  name: string;
  change: number;
}

interface CashFlowData {
  operating: {
    netIncome: number;
    workingCapitalChanges: WorkingCapitalChange[];
    totalWorkingCapitalChange: number;
    netCash: number;
  };
  investing: {
    inflows: number;
    outflows: number;
    netCash: number;
  };
  financing: {
    inflows: number;
    outflows: number;
    netCash: number;
  };
  summary: {
    netChange: number;
    beginningCash: number;
    endingCash: number;
    variance: number;
  };
}

interface CashFlowResponse {
  success: boolean;
  period: { startDate: string; endDate: string };
  data: CashFlowData;
}

export function CashFlowReport({ dateRange }: { dateRange: DateRange }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operating: true,
    investing: true,
    financing: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const { data, isLoading, error } = useQuery<CashFlowResponse>({
    queryKey: ['cash-flow-report', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/reports/cash-flow?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch cash flow data');
      return res.json();
    },
  });

  const formatThaiDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: th });
  };

  const formatNumber = (num: number) => {
    return satangToBaht(num).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isPositive = (num: number) => num >= 0;
  const isSignificant = (num: number) => Math.abs(num) > 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองอีกครั้ง
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return <div className="py-12 text-center text-gray-500">ไม่พบข้อมูลสำหรับช่วงเวลาที่เลือก</div>;
  }

  const { operating, investing, financing, summary } = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">งบกระแสเงินสด</h2>
        <p className="mt-1 text-gray-500">
          ประจำวันที่ {formatThaiDate(dateRange.from)} - {formatThaiDate(dateRange.to)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className={
            isPositive(summary.netChange)
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">กระแสเงินสดสุทธิ</p>
                <p
                  className={`text-2xl font-bold ${isPositive(summary.netChange) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(summary.netChange) ? '' : '-'}
                  {formatNumber(Math.abs(summary.netChange))}
                </p>
              </div>
              {isPositive(summary.netChange) ? (
                <TrendingUp className="h-10 w-10 text-green-500 opacity-50" />
              ) : (
                <TrendingDown className="h-10 w-10 text-red-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">เงินสดยกมา</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatNumber(summary.beginningCash)}
                </p>
              </div>
              <Wallet className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">เงินสดคงเหลือ</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatNumber(summary.endingCash)}
                </p>
              </div>
              <Wallet className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operating Activities */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('operating')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">กิจกรรมดำเนินงาน</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${isPositive(operating.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(operating.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(operating.netCash))}
                </p>
              </div>
              {expandedSections.operating ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.operating && (
          <CardContent>
            <div className="space-y-3">
              {/* Net Income from Operations */}
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                  <span className="text-gray-700">กำไร(ขาดทุน)จากการดำเนินงาน</span>
                </div>
                <span
                  className={`font-medium ${isPositive(operating.netIncome) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(operating.netIncome) ? '' : '-'}
                  {formatNumber(Math.abs(operating.netIncome))}
                </span>
              </div>

              {/* Working Capital Changes Header */}
              {(operating.workingCapitalChanges.length > 0 ||
                isSignificant(operating.totalWorkingCapitalChange)) && (
                <>
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                      <span className="font-medium text-gray-700">การเปลี่ยนแปลงทุนหมุนเวียน</span>
                    </div>
                    <span
                      className={`font-medium ${isPositive(operating.totalWorkingCapitalChange) ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isPositive(operating.totalWorkingCapitalChange) ? '' : '-'}
                      {formatNumber(Math.abs(operating.totalWorkingCapitalChange))}
                    </span>
                  </div>

                  {/* Working Capital Change Items */}
                  {operating.workingCapitalChanges
                    .filter((wc) => isSignificant(wc.change))
                    .map((wc) => (
                      <div
                        key={wc.code}
                        className="flex items-center justify-between border-b border-gray-50 py-2 pl-6"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-12 font-mono text-xs text-gray-400">{wc.code}</span>
                          <span className="text-sm text-gray-600">{wc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPositive(wc.change) ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${isPositive(wc.change) ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {isPositive(wc.change) ? '' : '-'}
                            {formatNumber(Math.abs(wc.change))}
                          </span>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* Total Operating Cash */}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-3">
                <span className="font-semibold text-gray-800">
                  รวมกระแสเงินสดจากกิจกรรมดำเนินงาน
                </span>
                <span
                  className={`text-lg font-bold ${isPositive(operating.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(operating.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(operating.netCash))}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Investing Activities */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('investing')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">กิจกรรมลงทุน</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${isPositive(investing.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(investing.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(investing.netCash))}
                </p>
              </div>
              {expandedSections.investing ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.investing && (
          <CardContent>
            <div className="space-y-3">
              {/* Inflows */}
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">เงินสดเข้า</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatNumber(investing.inflows)}
                </span>
              </div>

              {/* Outflows */}
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-gray-700">เงินสดออก</span>
                </div>
                <span className="font-medium text-red-600">{formatNumber(investing.outflows)}</span>
              </div>

              {/* Total Investing Cash */}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-3">
                <span className="font-semibold text-gray-800">รวมกระแสเงินสดจากกิจกรรมลงทุน</span>
                <span
                  className={`text-lg font-bold ${isPositive(investing.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(investing.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(investing.netCash))}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Financing Activities */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('financing')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg">กิจกรรมจัดหาเงิน</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${isPositive(financing.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(financing.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(financing.netCash))}
                </p>
              </div>
              {expandedSections.financing ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.financing && (
          <CardContent>
            <div className="space-y-3">
              {/* Inflows */}
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">เงินสดเข้า</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatNumber(financing.inflows)}
                </span>
              </div>

              {/* Outflows */}
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-gray-700">เงินสดออก</span>
                </div>
                <span className="font-medium text-red-600">{formatNumber(financing.outflows)}</span>
              </div>

              {/* Total Financing Cash */}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-3">
                <span className="font-semibold text-gray-800">
                  รวมกระแสเงินสดจากกิจกรรมจัดหาเงิน
                </span>
                <span
                  className={`text-lg font-bold ${isPositive(financing.netCash) ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isPositive(financing.netCash) ? '' : '-'}
                  {formatNumber(Math.abs(financing.netCash))}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Variance Check */}
      {summary.variance > 1 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="font-medium">ความแตกต่างจากการตรวจสอบ:</span>
              <span>{formatNumber(summary.variance)} บาท</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
