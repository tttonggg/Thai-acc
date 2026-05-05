'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  ShoppingCart,
  Package,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Filter,
  Truck,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeProps } from '@/lib/status-badge';
import { PurchaseOrderForm } from './purchase-order-form';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  RECEIVED: 'bg-blue-100 text-blue-800 border-blue-300',
  PARTIAL: 'bg-orange-100 text-orange-800 border-orange-300',
};

const paymentStatusColors: Record<string, string> = {
  UNPAID: 'bg-gray-100 text-gray-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
};

interface PurchaseOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  expectedDate?: string;
  vendorName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  notes?: string;
  lines: Array<{
    id: string;
    lineNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    product?: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  _count?: {
    lines: number;
    receipts: number;
  };
}

// Status labels and colors
const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  ORDERED: 'สั่งซื้อแล้ว',
  RECEIVING: 'รับของบางส่วน',
  RECEIVED: 'รับของครบแล้ว',
  CANCELLED: 'ยกเลิก',
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: 'ยังไม่จ่าย',
  PARTIAL: 'จ่ายบางส่วน',
  PAID: 'จ่ายครบแล้ว',
};

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status);
  return <Badge variant={config.variant}>{statusLabels[status] || config.label}</Badge>;
};

// Helper function to get payment status badge
const getPaymentStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status);
  return <Badge variant={config.variant}>{paymentStatusLabels[status] || config.label}</Badge>;
};

export function PurchaseOrderList() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [deletingPO, setDeletingPO] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch POs
  useEffect(() => {
    fetchPOs();
  }, [pagination.page, pagination.limit]);

  const fetchPOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPaymentStatus !== 'all') params.append('paymentStatus', filterPaymentStatus);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/purchase-orders?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fetch failed');

      const result = await res.json();
      const posData = result.data || [];

      if (!Array.isArray(posData)) {
        throw new Error('Invalid data format');
      }

      setPos(posData);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
      }));
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

  // Filter POs
  const filteredPOs = (pos || []).filter((po) => {
    const matchesSearch =
      !searchTerm ||
      po.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || po.status === filterStatus;
    const matchesPaymentStatus =
      filterPaymentStatus === 'all' || po.paymentStatus === filterPaymentStatus;

    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Action handlers
  const handleView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (poId: string) => {
    toast({
      title: 'แก้ไขใบสั่งซื้อ',
      description: 'ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้',
    });
  };

  const handleDelete = async (poId: string) => {
    if (!confirm('คุณต้องการลบใบสั่งซื้อนี้ใช่หรือไม่?')) {
      return;
    }

    setDeletingPO(poId);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'ลบไม่สำเร็จ');
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบใบสั่งซื้อเรียบร้อยแล้ว',
      });

      fetchPOs();
    } catch (err) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setDeletingPO(null);
    }
  };

  const handleAction = async (poId: string, action: 'submit' | 'approve' | 'cancel') => {
    setProcessingAction(`${poId}-${action}`);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'ดำเนินการไม่สำเร็จ');
      }

      const actionLabels = {
        submit: 'ส่งอนุมัติ',
        approve: 'อนุมัติ',
        cancel: 'ยกเลิก',
      };

      toast({
        title: 'สำเร็จ',
        description: `${actionLabels[action]}เรียบร้อยแล้ว`,
      });

      fetchPOs();
      setIsViewDialogOpen(false);
    } catch (err) {
      toast({
        title: 'ดำเนินการไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  // Loading UI
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

  // Error UI
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Calculate stats
  const stats = {
    draft: pos.filter((p) => p.status === 'DRAFT').length,
    pending: pos.filter((p) => p.status === 'PENDING').length,
    approved: pos.filter((p) => p.status === 'APPROVED' || p.status === 'ORDERED').length,
    received: pos.filter((p) => p.status === 'RECEIVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบสั่งซื้อ (Purchase Order)</h1>
          <p className="mt-1 text-gray-500">จัดการใบสั่งซื้อจากผู้ขาย</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างใบสั่งซื้อ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ฉบับร่าง</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">รออนุมัติ</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">รับของครบ</p>
                <p className="text-2xl font-bold text-green-600">{stats.received}</p>
              </div>
              <Package className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="ค้นหาตามเลขที่ PO หรือชื่อผู้ขาย..."
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
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="PENDING">รออนุมัติ</SelectItem>
                <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                <SelectItem value="ORDERED">สั่งซื้อแล้ว</SelectItem>
                <SelectItem value="RECEIVING">รับของบางส่วน</SelectItem>
                <SelectItem value="RECEIVED">รับของครบแล้ว</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="สถานะการจ่ายเงิน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="UNPAID">ยังไม่จ่าย</SelectItem>
                <SelectItem value="PARTIAL">จ่ายบางส่วน</SelectItem>
                <SelectItem value="PAID">จ่ายครบแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การจ่ายเงิน</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      <Truck className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p>ไม่พบใบสั่งซื้อ</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po) => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-mono font-medium">{po.orderNo}</TableCell>
                      <TableCell>{new Date(po.orderDate).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell className="text-right font-medium">
                        ฿
                        {(po.totalAmount / 100).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(po.paymentStatus)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{po._count?.lines || 0} รายการ</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(po)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          {po.status === 'DRAFT' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(po.id)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDelete(po.id)}
                                disabled={deletingPO === po.id}
                              >
                                {deletingPO === po.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} จากทั้งหมด{' '}
            {pagination.total} รายการ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              ใบสั่งซื้อ: {selectedPO?.orderNo}
            </DialogTitle>
            <DialogDescription>
              {selectedPO && (
                <div className="mt-2 flex items-center gap-4">
                  <Badge className={statusColors[selectedPO.status]} variant="outline">
                    {statusLabels[selectedPO.status]}
                  </Badge>
                  <Badge
                    className={paymentStatusColors[selectedPO.paymentStatus]}
                    variant="outline"
                  >
                    {paymentStatusLabels[selectedPO.paymentStatus]}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันที่สั่งซื้อ
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedPO.orderDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                {selectedPO.expectedDate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      วันที่คาดว่าจะได้รับ
                    </Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedPO.expectedDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ผู้สร้าง
                  </Label>
                  <p className="text-sm font-medium">{selectedPO.createdByUser.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    ผู้ขาย
                  </Label>
                  <p className="text-sm font-medium">{selectedPO.vendorName}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedPO.notes && (
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <p className="rounded bg-gray-50 p-3 text-sm">{selectedPO.notes}</p>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  รายการสินค้า ({selectedPO.lines?.length || 0} รายการ)
                </Label>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ลำดับ</TableHead>
                        <TableHead>รายการ</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead className="text-right">ราคา/หน่วย</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.lines?.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-center">{line.lineNo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.product && (
                                <p className="text-xs text-gray-500">รหัส: {line.product.code}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {line.quantity.toLocaleString('th-TH')} {line.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            ฿
                            {(line.unitPrice / 100).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ฿
                            {(line.amount / 100).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-gray-600">
                      มูลค่าก่อน VAT: ฿
                      {(selectedPO.subtotal / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      VAT: ฿
                      {(selectedPO.vatAmount / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      ยอดรวม: ฿
                      {(selectedPO.totalAmount / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Info */}
              {selectedPO.approvedByUser && (
                <div className="rounded-lg bg-green-50 p-4">
                  <Label className="flex items-center gap-2 text-green-900">
                    <CheckCircle2 className="h-4 w-4" />
                    ข้อมูลการอนุมัติ
                  </Label>
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="text-gray-600">ผู้อนุมัติ:</span>{' '}
                      <span className="font-medium">{selectedPO.approvedByUser.name}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">วันที่อนุมัติ:</span>{' '}
                      <span className="font-medium">
                        {selectedPO.approvedAt
                          ? new Date(selectedPO.approvedAt).toLocaleDateString('th-TH')
                          : '-'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {selectedPO.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(selectedPO.id, 'submit')}
                      disabled={processingAction === `${selectedPO.id}-submit`}
                    >
                      {processingAction === `${selectedPO.id}-submit` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      ส่งอนุมัติ
                    </Button>
                    <Button variant="outline" onClick={() => handleEdit(selectedPO.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      แก้ไข
                    </Button>
                  </>
                )}
                {selectedPO.status === 'PENDING' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(selectedPO.id, 'approve')}
                      disabled={processingAction === `${selectedPO.id}-approve`}
                    >
                      {processingAction === `${selectedPO.id}-approve` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      อนุมัติ
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(selectedPO.id, 'cancel')}
                      disabled={processingAction === `${selectedPO.id}-cancel`}
                    >
                      {processingAction === `${selectedPO.id}-cancel` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      ยกเลิก
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add PO Dialog */}
      <PurchaseOrderForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          fetchPOs();
        }}
      />
    </div>
  );
}
