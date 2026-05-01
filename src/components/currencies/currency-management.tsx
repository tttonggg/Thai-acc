'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, RefreshCw, TrendingUp, Download } from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  nameTh?: string;
  symbol: string;
  isBase: boolean;
  decimalPlaces: number;
  isActive: boolean;
  exchangeRates: Array<{
    rate: number;
    date: string;
  }>;
}

export function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`/api/currencies`, { credentials: 'include' });
      const data = await res.json();
      if (data.currencies) {
        setCurrencies(data.currencies);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลสกุลเงินได้');
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/currencies`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchCurrencies();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างสกุลเงิน');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange-rates`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-from-api' }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchCurrencies();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตอัตราแลกเปลี่ยน');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiCurrencyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange-rates?report=multi-currency`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        setReport(data);
        setReportDialog(true);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดรายงาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              จัดการสกุลเงิน
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleInitialize} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                สร้างสกุลเงินเริ่มต้น
              </Button>
              <Button variant="outline" onClick={handleUpdateRates} disabled={loading}>
                <TrendingUp className="mr-2 h-4 w-4" />
                อัปเดตอัตราแลกเปลี่ยน
              </Button>
              <Button variant="outline" onClick={handleMultiCurrencyReport} disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                รายงานสกุลเงิน
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>สัญลักษณ์</TableHead>
                <TableHead>อัตราแลกเปลี่ยน (THB)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>สกุลหลัก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.nameTh || currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>
                    {currency.isBase
                      ? '1.00'
                      : currency.exchangeRates[0]
                        ? currency.exchangeRates[0].rate.toFixed(4)
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={currency.isActive ? 'default' : 'secondary'}>
                      {currency.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {currency.isBase && (
                      <Badge variant="default" className="bg-green-500">
                        สกุลหลัก
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {currencies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลสกุลเงิน กรุณาสร้างสกุลเงินเริ่มต้น
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายงานหลายสกุลเงิน</DialogTitle>
            <DialogDescription>
              สรุปยอดลูกหนี้/เจ้าหนี้และกำไร/ขาดทุนจากอัตราแลกเปลี่ยน
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                สกุลเงินหลัก: {report.baseCurrency} | วันที่รายงาน:{' '}
                {new Date(report.reportDate).toLocaleDateString('th-TH')}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สกุลเงิน</TableHead>
                    <TableHead>อัตราแลกเปลี่ยน</TableHead>
                    <TableHead>ลูกหนี้ (THB)</TableHead>
                    <TableHead>เจ้าหนี้ (THB)</TableHead>
                    <TableHead>กำไร/ขาดทุน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.currencies?.map((c: any) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.currentRate.toFixed(4)}</TableCell>
                      <TableCell>{(c.receivables.thbAmount / 100).toLocaleString()}</TableCell>
                      <TableCell>{(c.payables.thbAmount / 100).toLocaleString()}</TableCell>
                      <TableCell
                        className={
                          c.realizedGainLoss + c.unrealizedGainLoss >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {((c.realizedGainLoss + c.unrealizedGainLoss) / 100).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
