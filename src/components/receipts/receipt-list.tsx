'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
  FileText,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { eventBus, EVENTS } from '@/lib/events';
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
import { ReceiptForm } from './receipt-form';
import { ReceiptViewDialog } from './receipt-view-dialog';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeProps } from '@/lib/status-badge';

interface Receipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  customer: {
    id: string;
    code: string;
    name: string;
  };
  paymentMethod: string;
  amount: number;
  whtAmount: number;
  totalAllocated: number;
  remaining: number;
  status: string;
  notes?: string;
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
  CHEQUE: 'เช็ค',
  TRANSFER: 'โอนเงิน',
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

// Compute aging badge for receipts
function getAgingBadge(receipt: Receipt) {
  if (receipt.status === 'PAID' || receipt.status === 'CANCELLED' || receipt.status === 'DRAFT') {
    return null;
  }
  // For receipts, we check if remaining > 0 (unallocated amount)
  if (receipt.remaining <= 0) {
    return null;
  }
  // Receipts don't typically have due dates, but we can show aging based on creation date
  // Consider a receipt as "overdue" if it's been >30 days since receipt date and still has remaining balance
  const receiptDate = new Date(receipt.receiptDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    return { emoji: '🔴', label: `${diffDays - 30}+ วัน`, variant: 'destructive' as const };
  }
  if (diffDays >= 21) {
    return { emoji: '🟡', label: 'ใกล้เกินกำหนด', variant: 'secondary' as const };
  }
  return null;
}

export function ReceiptList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  const [postingReceipt, setPostingReceipt] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReceipts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/receipts`, { credentials: 'include' });
        if (!res.ok) throw new Error('Fetch failed');
        const result = await res.json();
        // API returns { success: true, data: [...], pagination: {...} }
        const receiptsData = result.data || [];
        if (!Array.isArray(receiptsData)) {
          throw new Error('Invalid receipts data format');
        }
        setReceipts(receiptsData);
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
    fetchReceipts();
  }, [refreshKey, toast]);

  const filteredReceipts = (receipts || []).filter((receipt) => {
    if (!receipt || typeof receipt !== 'object') return false;

    const matchesSearch =
      receipt.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || receipt.status === filterStatus;

    // Quick filter logic
    if (quickFilter !== 'all') {
      const receiptDate = new Date(receipt.receiptDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const hasRemaining = (receipt.remaining ?? 0) > 0;

      if (quickFilter === 'pending') {
        if (
          receipt.status === 'PAID' ||
          receipt.status === 'CANCELLED' ||
          receipt.status === 'DRAFT'
        )
          return false;
        if (!hasRemaining) return false;
      } else if (quickFilter === 'overdue') {
        if (
          diffDays <= 30 ||
          receipt.status === 'PAID' ||
          receipt.status === 'CANCELLED' ||
          receipt.status === 'DRAFT'
        )
          return false;
        if (!hasRemaining) return false;
      } else if (quickFilter === 'done') {
        if (receipt.status !== 'POSTED') return false;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const handleReceiptSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddDialogOpen(false);
    setIsViewDialogOpen(false);
    eventBus.emit(EVENTS.RECEIPT_CREATED);
  };

  const handleView = (receiptId: string) => {
    setViewReceiptId(receiptId);
    setIsViewDialogOpen(true);
  };

  const handlePrint = async (receipt: Receipt) => {
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
      CHEQUE: 'เช็ค',
      TRANSFER: 'โอนเงิน',
      CREDIT: 'บัตรเครดิต',
      OTHER: 'อื่นๆ',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จรับเงิน - ${receipt.receiptNo}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; border-top: 2px solid #333; padding-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .summary-row.total { font-weight: bold; font-size: 18px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบเสร็จรับเงิน</h1>
          <p>เลขที่: ${receipt.receiptNo}</p>
          <p>วันที่: ${new Date(receipt.receiptDate).toLocaleDateString('th-TH')}</p>
        </div>
        
        <div class="info">
          <p><strong>ลูกค้า:</strong> ${receipt.customer?.name || '-'}</p>
          <p><strong>วิธีการชำระ:</strong> ${paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}</p>
        </div>

        <div class="summary">
          <div class="summary-row total">
            <span>จำนวนเงิน</span>
            <span>${(receipt.amount || 0).toLocaleString('th-TH')} บาท</span>
          </div>
          ${
            receipt.whtAmount > 0
              ? `
          <div class="summary-row">
            <span>ภาษีหัก ณ ที่จ่าย</span>
            <span>${(receipt.whtAmount || 0).toLocaleString('th-TH')} บาท</span>
          </div>
          `
              : ''
          }
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePost = async (receiptId: string) => {
    setPostingReceipt(receiptId);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/post`, {
        credentials: 'include',
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'ไม่สามารถลงบัญชีได้');
      }

      toast({
        title: 'สำเร็จ',
        description: 'ลงบัญชีใบเสร็จรับเงินเรียบร้อยแล้ว',
      });

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลงบัญชีได้',
        variant: 'destructive',
      });
    } finally {
      setPostingReceipt(null);
    }
  };

  const handleDownload = async (receiptId: string, receiptNo: string) => {
    setDownloadingReceipt(receiptId);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/export/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receiptNo}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${receiptNo} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const handleDelete = async () => {
    if (!receiptToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/receipts/${receiptToDelete}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'ไม่สามารถลบได้');
      }
      toast({
        title: 'สำเร็จ',
        description: 'ลบใบเสร็จรับเงินเรียบร้อยแล้ว',
      });
      eventBus.emit(EVENTS.RECEIPT_DELETED, { receiptId: receiptToDelete });
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลบได้',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (receiptId: string) => {
    setReceiptToDelete(receiptId);
    setDeleteDialogOpen(true);
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

  const safeReceipts = receipts || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบเสร็จรับเงิน (AR)</h1>
          <p className="mt-1 text-gray-500">จัดการการรับเงินจากลูกค้าและการจัดจ่ายใบกำกับภาษี</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              รับเงินใหม่
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {isAddDialogOpen && (
        <ReceiptForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รอลงบัญชี</p>
            <p className="text-2xl font-bold text-yellow-600">
              {receipts.filter((r) => r.status === 'DRAFT').length}
            </p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ลงบัญชีแล้ว (เดือนนี้)</p>
            <p className="text-2xl font-bold text-green-600">
              ฿
              {safeReceipts
                ?.filter((r) => r.status === 'POSTED')
                .reduce((sum, r) => sum + (r.amount || 0), 0)
                .toLocaleString() ?? '0'}
            </p>
            <p className="text-xs text-gray-400">
              {safeReceipts?.filter((r) => r.status === 'POSTED').length ?? 0} รายการ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">หัก ณ ที่จ่ายรวม</p>
            <p className="text-2xl font-bold text-purple-600">
              ฿
              {safeReceipts?.reduce((sum, r) => sum + (r.whtAmount || 0), 0).toLocaleString() ??
                '0'}
            </p>
            <p className="text-xs text-gray-400">เดือนนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ยอดค้างจ่าย</p>
            <p className="text-2xl font-bold text-orange-600">
              ฿
              {safeReceipts?.reduce((sum, r) => sum + (r.remaining || 0), 0).toLocaleString() ??
                '0'}
            </p>
            <p className="text-xs text-gray-400">เครดิตลูกค้า</p>
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
                placeholder="ค้นหาตามชื่อลูกค้าหรือเลขที่เอกสาร..."
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

      {/* Receipt Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">ยอดค้างรับ</TableHead>
                  <TableHead className="text-right">ยอดรับ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>คอมเมนต์</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => {
                  const agingBadge = getAgingBadge(receipt);
                  const outstanding = Math.max(0, receipt.remaining ?? 0);
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono">{receipt.receiptNo}</TableCell>
                      <TableCell>
                        {new Date(receipt.receiptDate).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentMethodLabels[receipt.paymentMethod]}
                        </Badge>
                      </TableCell>
                      <TableCell>{receipt.customer?.name}</TableCell>
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
                        {(receipt.amount ?? 0).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(receipt.status)}
                          {agingBadge && (
                            <Badge variant={agingBadge.variant} className="w-fit text-xs">
                              {agingBadge.emoji} {agingBadge.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {receipt.notes ? (
                          <span className="block max-w-[200px] truncate text-sm text-gray-600">
                            {receipt.notes}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-center gap-1">
                          {receipt.status === 'DRAFT' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 bg-blue-600 px-2 text-white hover:bg-blue-700"
                              onClick={() => handlePost(receipt.id)}
                              disabled={postingReceipt === receipt.id}
                            >
                              {postingReceipt === receipt.id ? (
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
                            onClick={() => handleView(receipt.id)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePrint(receipt)}
                          >
                            <Printer className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(receipt.id, receipt.receiptNo)}
                            disabled={downloadingReceipt === receipt.id}
                          >
                            {downloadingReceipt === receipt.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            ) : (
                              <Download className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                          {receipt.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(receipt.id)}
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

      {viewReceiptId && (
        <ReceiptViewDialog
          receiptId={viewReceiptId}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          onSuccess={handleReceiptSuccess}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="ยืนยันการลบใบเสร็จรับเงิน"
        message="คุณต้องการลบใบเสร็จรับเงินนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบ"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
