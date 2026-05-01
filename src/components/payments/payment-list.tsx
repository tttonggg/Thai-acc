'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Printer, Loader2, FileText, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PaymentForm } from './payment-form';
import { PaymentViewDialog } from './payment-view-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeProps } from '@/lib/status-badge';

interface Payment {
  id: string;
  paymentNo: string;
  paymentDate: string;
  vendorName: string;
  paymentMethod: string;
  amount: number;
  whtAmount: number;
  unallocated: number;
  allocated: number;
  status: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  POSTED: 'ลงบัญชีแล้ว',
  CANCELLED: 'ยกเลิก',
};

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status);
  return <Badge variant={config.variant}>{statusLabels[status] || config.label}</Badge>;
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  CHEQUE: 'เช็ค',
  CREDIT: 'บัตรเครดิต',
  OTHER: 'อื่นๆ',
};

// Quick filter options
type QuickFilter = 'all' | 'pending' | 'overdue' | 'done';
const quickFilters: { value: QuickFilter; label: string; activeClass: string }[] = [
  { value: 'all', label: 'ทั้งหมด', activeClass: 'bg-blue-600 text-white hover:bg-blue-700' },
  {
    value: 'pending',
    label: 'รอดำเนินการ',
    activeClass: 'bg-yellow-500 text-white hover:bg-yellow-600',
  },
  { value: 'overdue', label: 'เร่งด่วน', activeClass: 'bg-red-500 text-white hover:bg-red-600' },
  { value: 'done', label: 'เสร็จสิ้น', activeClass: 'bg-green-500 text-white hover:bg-green-600' },
];

// Compute aging badge for payments
function getAgingBadge(payment: Payment) {
  if (payment.status === 'PAID' || payment.status === 'CANCELLED' || payment.status === 'DRAFT') {
    return null;
  }
  const paymentDate = new Date(payment.paymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    return {
      emoji: '🔴',
      label: `เกินกำหนด ${diffDays - 30}+ วัน`,
      variant: 'destructive' as const,
    };
  }
  if (diffDays > 0) {
    return { emoji: '🟡', label: 'ใกล้ถึงกำหนด', variant: 'secondary' as const };
  }
  return null;
}

export function PaymentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewPaymentId, setViewPaymentId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postingPayment, setPostingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/payments`, { credentials: 'include' });
        if (!res.ok) throw new Error('Fetch failed');
        const result = await res.json();

        // Transform data to match interface with null safety
        // API returns { success: true, data: [...], pagination: {...} }
        const paymentsData = result.data || [];
        if (!Array.isArray(paymentsData)) {
          throw new Error('Invalid payments data format');
        }

        const transformedPayments = paymentsData.map((p: any) => ({
          id: p.id,
          paymentNo: p.paymentNo,
          paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('th-TH') : '',
          vendorName: p.vendor?.name || '',
          paymentMethod: p.paymentMethod || 'OTHER',
          amount: p.amount || 0,
          whtAmount: p.whtAmount || 0,
          unallocated: p.unallocated || 0,
          allocated: p.allocations?.reduce((sum: number, a: any) => sum + (a.amount || 0), 0) || 0,
          status: p.status || 'DRAFT',
        }));

        setPayments(transformedPayments);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล';
        setError(message);
        toast({
          title: 'ข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [refreshKey, toast]);

  const filteredPayments = (payments || []).filter((payment) => {
    if (!payment || typeof payment !== 'object') return false;

    const matchesSearch =
      payment.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;

    // Quick filter logic
    if (quickFilter !== 'all') {
      const paymentDate = new Date(payment.paymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (quickFilter === 'pending') {
        if (payment.status === 'PAID' || payment.status === 'CANCELLED') return false;
      } else if (quickFilter === 'overdue') {
        if (diffDays <= 30 && payment.status !== 'PAID' && payment.status !== 'CANCELLED')
          return false;
      } else if (quickFilter === 'done') {
        if (payment.status !== 'POSTED') return false;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const handlePaymentSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddDialogOpen(false);
  };

  const handleView = (paymentId: string) => {
    setViewPaymentId(paymentId);
    setIsViewDialogOpen(true);
  };

  const handlePrint = async (payment: Payment) => {
    try {
      // Fetch full payment details
      const res = await fetch(`/api/payments/${payment.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed');
      const result = await res.json();
      const fullPayment = result.data || result;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'ไม่สามารถเปิดหน้าต่างได้',
          description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
          variant: 'destructive',
        });
        return;
      }

      const paymentMethodLabels: Record<string, string> = {
        CASH: 'เงินสด',
        TRANSFER: 'โอนเงิน',
        CHEQUE: 'เช็ค',
        CREDIT: 'บัตรเครดิต',
        OTHER: 'อื่นๆ',
      };

      const statusLabels: Record<string, string> = {
        DRAFT: 'ร่าง',
        POSTED: 'ลงบัญชีแล้ว',
        CANCELLED: 'ยกเลิก',
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบจ่ายเงิน - ${fullPayment.paymentNo}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .section { margin: 20px 0; }
            .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .total { font-weight: bold; font-size: 18px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ใบจ่ายเงิน</h1>
            <p>เลขที่: ${fullPayment.paymentNo}</p>
            <p>วันที่: ${new Date(fullPayment.paymentDate).toLocaleDateString('th-TH')}</p>
            <p>สถานะ: ${statusLabels[fullPayment.status] || fullPayment.status}</p>
          </div>
          
          <div class="section">
            <h3>ข้อมูลผู้ขาย</h3>
            <p><strong>ชื่อ:</strong> ${fullPayment.vendor?.name || payment.vendorName || '-'}</p>
            <p><strong>เลขประจำตัวผู้เสียภาษี:</strong> ${fullPayment.vendor?.taxId || '-'}</p>
          </div>

          <div class="section">
            <h3>รายละเอียดการจ่าย</h3>
            <p><strong>วิธีการจ่าย:</strong> ${paymentMethodLabels[fullPayment.paymentMethod] || fullPayment.paymentMethod}</p>
            ${fullPayment.bankAccount ? `<p><strong>ธนาคาร:</strong> ${fullPayment.bankAccount.bankName} (${fullPayment.bankAccount.accountNumber})</p>` : ''}
            ${fullPayment.chequeNo ? `<p><strong>เลขที่เช็ค:</strong> ${fullPayment.chequeNo}</p>` : ''}
          </div>

          ${
            fullPayment.allocations && fullPayment.allocations.length > 0
              ? `
          <div class="section">
            <h3>การจัดจ่ายใบซื้อ</h3>
            <table>
              <thead>
                <tr>
                  <th>เลขที่ใบซื้อ</th>
                  <th class="text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${fullPayment.allocations
                  .map(
                    (a: any) => `
                  <tr>
                    <td>${a.invoice?.invoiceNo || '-'}</td>
                    <td class="text-right">${(a.amount || 0).toLocaleString('th-TH')}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          `
              : ''
          }

          <div class="section">
            <p class="total">ยอดจ่ายรวม: ${(fullPayment.amount || 0).toLocaleString('th-TH')} บาท</p>
            ${(fullPayment.whtAmount || 0) > 0 ? `<p>ภาษีหัก ณ ที่จ่าย: ${(fullPayment.whtAmount || 0).toLocaleString('th-TH')} บาท</p>` : ''}
            ${(fullPayment.unallocated || 0) > 0 ? `<p>คงเหลือ (เครดิตเจ้าหนี้): ${(fullPayment.unallocated || 0).toLocaleString('th-TH')} บาท</p>` : ''}
          </div>

          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      toast({
        title: 'พิมพ์ไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const handlePost = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm('ต้องการลงบัญชีใบจ่ายเงินนี้หรือไม่? การดำเนินการนี้จะสร้างรายการบัญชีโดยอัตโนมัติ')
    )
      return;
    setPostingPayment(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        credentials: 'include',
        method: 'POST',
      });
      if (!res.ok) throw new Error('Post failed');

      toast({
        title: 'ลงบัญชีสำเร็จ',
        description: 'ลงบัญชีใบจ่ายเงินเรียบร้อยแล้ว',
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'ลงบัญชีไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setPostingPayment(null);
    }
  };

  const handleDelete = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ต้องการลบใบจ่ายเงินนี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบใบจ่ายเงินเรียบร้อยแล้ว',
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="mb-4 h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบจ่ายเงิน (AP Payments)</h1>
            <p className="mt-1 text-gray-500">จัดการการจ่ายเงินเจ้าหนี้</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                สร้างใบจ่ายเงิน
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูล</AlertDescription>
        </Alert>
        <PaymentForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  const safePayments = payments || [];
  const totalPaid = safePayments
    .filter((p) => p.status === 'POSTED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalWHT = safePayments.reduce((sum, p) => sum + (p.whtAmount || 0), 0);
  const draftCount = safePayments.filter((p) => p.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบจ่ายเงิน (AP Payments)</h1>
          <p className="mt-1 text-gray-500">จัดการการจ่ายเงินเจ้าหนี้</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              สร้างใบจ่ายเงิน
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <PaymentForm
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ร่าง (รอลงบัญชี)</p>
            <p className="text-2xl font-bold text-yellow-600">{draftCount}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">จ่ายแล้ว (เดือนนี้)</p>
            <p className="text-2xl font-bold text-green-600">
              ฿{(totalPaid / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">
              {safePayments.filter((p) => p.status === 'POSTED').length} รายการ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">หัก ณ ที่จ่ายรวม</p>
            <p className="text-2xl font-bold text-purple-600">
              ฿{(totalWHT / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">เดือนนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">เครดิตเจ้าหนี้คงเหลือ</p>
            <p className="text-2xl font-bold text-blue-600">
              ฿
              {(
                safePayments.reduce((sum, p) => sum + (p.unallocated || 0), 0) / 100
              ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">จากใบจ่ายเงินทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((qf) => (
          <Button
            key={qf.value}
            variant="outline"
            size="sm"
            className={`rounded-full px-4 text-sm font-medium transition-colors ${
              quickFilter === qf.value
                ? qf.activeClass
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-transparent'
            }`}
            onClick={() => setQuickFilter(qf.value)}
          >
            {qf.label}
          </Button>
        ))}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="ค้นหาตามชื่อผู้ขายหรือเลขที่เอกสาร..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="POSTED">ลงบัญชีแล้ว</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่จ่าย</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead className="text-right">ยอดค้างจ่าย</TableHead>
                  <TableHead className="text-right">ยอดจ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>คอมเมนต์</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const outstanding = payment.unallocated || 0;
                  const agingBadge = getAgingBadge(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.paymentNo}</TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentMethodLabels[payment.paymentMethod]}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.vendorName}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            outstanding > 0 ? 'font-semibold text-red-600' : 'text-green-600'
                          }
                        >
                          ฿
                          {outstanding.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿
                        {payment.amount.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(payment.status)}
                          {agingBadge && (
                            <Badge variant={agingBadge.variant} className="w-fit text-xs">
                              {agingBadge.emoji} {agingBadge.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-center gap-1">
                          {payment.status === 'DRAFT' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 bg-blue-600 px-2 text-white hover:bg-blue-700"
                              onClick={(e) => handlePost(payment.id, e)}
                              disabled={postingPayment === payment.id}
                            >
                              {postingPayment === payment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3 w-3" />
                              )}
                              ลงบัญชี
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(payment.id)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePrint(payment)}
                            title="พิมพ์"
                          >
                            <Printer className="h-4 w-4 text-green-600" />
                          </Button>
                          {payment.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDelete(payment.id, e)}
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {viewPaymentId && (
        <PaymentViewDialog
          paymentId={viewPaymentId}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
}
