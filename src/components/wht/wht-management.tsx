'use client';

// ============================================
// 📄 WHT Management Page with 50 Tawi Download
// Agent 02: WHT & Tax Automation Engineer
// Agent 07: PDF & Reports Engineer
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw, CheckCircle, Clock, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface WhtRecord {
  id: string;
  documentNo: string;
  documentDate: string;
  type: 'PND3' | 'PND53';
  payeeName: string;
  payeeTaxId: string;
  incomeType: string;
  incomeAmount: number;
  whtRate: number;
  whtAmount: number;
  reportStatus: 'PENDING' | 'REPORTED';
  taxMonth: number;
  taxYear: number;
}

interface Summary {
  totalRecords: number;
  totalIncomeAmount: number;
  totalWhtAmount: number;
  pnd3Count: number;
  pnd3Amount: number;
  pnd53Count: number;
  pnd53Amount: number;
  pending: number;
  reported: number;
}

export function WhtManagement() {
  const [records, setRecords] = useState<WhtRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const { toast } = useToast();

  const currentThaiYear = new Date().getFullYear() + 543;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: selectedYear });
      if (selectedType !== 'ALL') params.set('type', selectedType);
      const res = await fetch(`/api/wht?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setRecords(json.data);
        setSummary(json.summary || null);
      }
    } catch {
      toast({ title: 'ข้อผิดพลาด', description: 'โหลดข้อมูลไม่สำเร็จ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedType, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Download 50 Tawi PDF for a specific WHT record
  const handleDownload50Tawi = async (record: WhtRecord) => {
    setDownloading(record.id);
    try {
      const res = await fetch(`/api/wht/${record.id}/pdf`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ไม่สามารถสร้าง PDF ได้');
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `50-Tawi-${record.documentNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `50 ทวิ เลขที่ ${record.documentNo} ดาวน์โหลดแล้ว`,
      });
    } catch (err: any) {
      toast({ title: 'ข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  // Mark as reported to Revenue Department
  const handleMarkReported = async (id: string) => {
    try {
      await fetch(`/api/wht/${id}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportStatus: 'REPORTED' }),
      });
      toast({ title: 'อัพเดทสำเร็จ', description: 'อัพเดทสถานะการยื่นภาษีแล้ว' });
      fetchRecords();
    } catch {
      toast({ title: 'ข้อผิดพลาด', description: 'อัพเดทไม่สำเร็จ', variant: 'destructive' });
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการภาษีหัก ณ ที่จ่าย</h1>
          <p className="mt-1 text-sm text-gray-500">ออกใบรับรองฯ 50 ทวิ และติดตามการยื่นภาษี</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map((i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <SelectItem key={y} value={y.toString()}>
                    {y + 543}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทุกประเภท</SelectItem>
              <SelectItem value="PND3">ภ.ง.ด.3</SelectItem>
              <SelectItem value="PND53">ภ.ง.ด.53</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchRecords}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">ภ.ง.ด.3 ({summary.pnd3Count} รายการ)</p>
              <p className="text-xl font-bold text-purple-600">
                ฿{formatCurrency(summary.pnd3Amount)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">ภ.ง.ด.53 ({summary.pnd53Count} รายการ)</p>
              <p className="text-xl font-bold text-teal-600">
                ฿{formatCurrency(summary.pnd53Amount)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-400">
            <CardContent className="p-4">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" /> รอยื่น
              </p>
              <p className="text-xl font-bold text-orange-500">{summary.pending} รายการ</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" /> ยื่นแล้ว
              </p>
              <p className="text-xl font-bold text-green-600">{summary.reported} รายการ</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            รายการหนังสือรับรองฯ 50 ทวิ ({records.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>ไม่พบข้อมูลภาษีหัก ณ ที่จ่ายในปีที่เลือก</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ผู้ถูกหักภาษี</TableHead>
                  <TableHead>ประเภทเงินได้</TableHead>
                  <TableHead className="text-right">จำนวนเงินได้</TableHead>
                  <TableHead className="text-right">ภาษีที่หัก</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-center">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.documentNo}</TableCell>
                    <TableCell>{formatDate(record.documentDate)}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'PND3' ? 'default' : 'secondary'}>
                        {record.type === 'PND3' ? 'ภ.ง.ด.3' : 'ภ.ง.ด.53'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{record.payeeName}</p>
                        <p className="text-xs text-gray-400">{record.payeeTaxId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{record.incomeType}</TableCell>
                    <TableCell className="text-right">
                      ฿{formatCurrency(record.incomeAmount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      ฿{formatCurrency(record.whtAmount)}
                      <span className="ml-1 text-xs text-gray-400">({record.whtRate}%)</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.reportStatus === 'REPORTED' ? (
                        <Badge className="border-green-200 bg-green-100 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          ยื่นแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-500">
                          <Clock className="mr-1 h-3 w-3" />
                          รอยื่น
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 50 Tawi PDF Download Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-blue-300 px-2 text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => handleDownload50Tawi(record)}
                          disabled={downloading === record.id}
                        >
                          {downloading === record.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Download className="mr-1 h-3 w-3" />
                              50 ทวิ
                            </>
                          )}
                        </Button>
                        {record.reportStatus === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-green-600 hover:bg-green-50"
                            onClick={() => handleMarkReported(record.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            ยื่นแล้ว
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
