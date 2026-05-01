'use client';

// ============================================
// 📦 Stock Take Management Page
// การตรวจนับสต็อก (Stock Take)
// Tabs: Stock Takes List | Variance Report
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  Play,
  X,
  Calendar,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockTake {
  id: string;
  stockTakeNumber: string;
  takeDate: string;
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  status: 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  createdBy: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  notes?: string;
  lines: StockTakeLine[];
  totalVariance: number;
  createdAt: string;
}

interface StockTakeLine {
  id: string;
  product: {
    code: string;
    name: string;
    unit: string;
  };
  expectedQty: number;
  actualQty: number;
  varianceQty: number;
  varianceValue: number;
  costPerUnit: number;
  notes?: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
}

interface StockTakeStats {
  totalTakes: number;
  pendingApproval: number;
  totalVarianceValue: number;
}

// ─── Status Configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-700', icon: ClipboardCheck },
  IN_PROGRESS: { label: 'กำลังนับ', color: 'bg-blue-100 text-blue-700', icon: Play },
  PENDING_APPROVAL: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  POSTED: { label: 'โพสต์แล้ว', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', icon: X },
};

const fc = (n: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fd = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });

// ─── Stock Takes List Tab ─────────────────────────────────────────────────────

function StockTakesListTab() {
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StockTakeStats>({
    totalTakes: 0,
    pendingApproval: 0,
    totalVarianceValue: 0,
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (warehouseFilter !== 'ALL') params.append('warehouseId', warehouseFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchQuery) params.append('search', searchQuery);

      const [takesRes, whRes] = await Promise.all([
        window
          .fetch(`/api/stock-takes?${params.toString()}`, { credentials: 'include' })
          .then((r) => r.json()),
        window.fetch(`/api/warehouses`, { credentials: 'include' }).then((r) => r.json()),
      ]);

      if (takesRes.success) {
        const data = takesRes.data.data || takesRes.data;
        setStockTakes(data);

        // Calculate stats
        const totalTakes = data.length;
        const pendingApproval = data.filter(
          (t: StockTake) => t.status === 'PENDING_APPROVAL'
        ).length;
        const totalVarianceValue = data.reduce(
          (sum: number, t: StockTake) => sum + (t.totalVariance || 0),
          0
        );

        setStats({ totalTakes, pendingApproval, totalVarianceValue });
      }
      if (whRes.success) {
        setWarehouses(whRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, warehouseFilter, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (stockTake: StockTake) => {
    if (!confirm(`ยืนยันที่จะอนุมัติการตรวจนับเลขที่ ${stockTake.stockTakeNumber}?`)) {
      return;
    }

    try {
      const res = await window
        .fetch(`/api/stock-takes/${stockTake.id}/approve`, {
          credentials: 'include',
          method: 'POST',
        })
        .then((r) => r.json());

      if (res.success) {
        toast({
          title: 'อนุมัติสำเร็จ',
          description: `การตรวจนับ ${stockTake.stockTakeNumber} ได้รับอนุมัติแล้ว`,
        });
        fetchAll();
      } else {
        toast({
          title: 'ไม่สามารถอนุมัติได้',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการอนุมัติ',
        variant: 'destructive',
      });
    }
  };

  const handlePost = async (stockTake: StockTake) => {
    if (
      !confirm(
        `ยืนยันที่จะโพสต์การตรวจนับเลขที่ ${stockTake.stockTakeNumber}?\n\nการดำเนินการนี้จะสร้างสมุดรายวันจัดทำคลังสินค้า`
      )
    ) {
      return;
    }

    try {
      const res = await window
        .fetch(`/api/stock-takes/${stockTake.id}/post`, { credentials: 'include', method: 'POST' })
        .then((r) => r.json());

      if (res.success) {
        toast({
          title: 'โพสต์สำเร็จ',
          description: `การตรวจนับ ${stockTake.stockTakeNumber} ถูกโพสต์เรียบร้อยแล้ว`,
        });
        fetchAll();
      } else {
        toast({
          title: 'ไม่สามารถโพสต์ได้',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการโพสต์',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (stockTake: StockTake) => {
    if (
      !confirm(
        `ยืนยันที่จะยกเลิกการตรวจนับเลขที่ ${stockTake.stockTakeNumber}?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`
      )
    ) {
      return;
    }

    try {
      const res = await window
        .fetch(`/api/stock-takes/${stockTake.id}`, { credentials: 'include', method: 'DELETE' })
        .then((r) => r.json());

      if (res.success) {
        toast({
          title: 'ยกเลิกสำเร็จ',
          description: `การตรวจนับ ${stockTake.stockTakeNumber} ถูกยกเลิกแล้ว`,
        });
        fetchAll();
      } else {
        toast({
          title: 'ไม่สามารถยกเลิกได้',
          description: res.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการยกเลิก',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">การตรวจนับทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTakes}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">รออนุมัติ</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">ผลต่างรวม</p>
                <p
                  className={`text-2xl font-bold ${stats.totalVarianceValue < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  ฿{fc(Math.abs(stats.totalVarianceValue))}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">สถานะทั้งหมด</SelectItem>
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="IN_PROGRESS">กำลังนับ</SelectItem>
                <SelectItem value="PENDING_APPROVAL">รออนุมัติ</SelectItem>
                <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                <SelectItem value="POSTED">โพสต์แล้ว</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="คลังทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">คลังทั้งหมด</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.code} — {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="วันที่เริ่มต้น"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="วันที่สิ้นสุด"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock Takes Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              รายการตรวจนับสต็อก
            </CardTitle>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="mr-1 h-4 w-4" />
              เพิ่มการตรวจนับ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>คลังสินค้า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ผลต่างรวม</TableHead>
                <TableHead className="text-right">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockTakes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                    ไม่พบรายการตรวจนับสต็อก
                  </TableCell>
                </TableRow>
              ) : (
                stockTakes.map((take) => {
                  const statusConfig = STATUS_CONFIG[take.status] || STATUS_CONFIG.DRAFT;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={take.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        {take.stockTakeNumber}
                      </TableCell>
                      <TableCell className="text-sm">{fd(take.takeDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="mr-1 h-3 w-3" />
                          {take.warehouse.code}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">{take.warehouse.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          take.totalVariance < 0
                            ? 'text-red-600'
                            : take.totalVariance > 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {take.totalVariance !== 0 && (
                          <>
                            {take.totalVariance < 0 ? '-' : '+'}฿{fc(Math.abs(take.totalVariance))}
                          </>
                        )}
                        {take.totalVariance === 0 && '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {take.status === 'PENDING_APPROVAL' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(take)}
                              title="อนุมัติ"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {take.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-600 hover:text-purple-700"
                              onClick={() => handlePost(take)}
                              title="โพสต์"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {!['POSTED', 'CANCELLED'].includes(take.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleCancel(take)}
                              title="ยกเลิก"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Variance Report Tab ───────────────────────────────────────────────────────

function VarianceReportTab() {
  const [variances, setVariances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (warehouseFilter !== 'ALL') params.append('warehouseId', warehouseFilter);

      const res = await window
        .fetch(`/api/stock-takes?${params.toString()}`, { credentials: 'include' })
        .then((r) => r.json());
      if (res.success) {
        const data = res.data.data || res.data;
        // Flatten all lines from all stock takes
        const allLines = data.flatMap((take: StockTake) =>
          take.lines.map((line) => ({
            ...line,
            stockTakeNumber: take.stockTakeNumber,
            takeDate: take.takeDate,
            warehouse: take.warehouse,
            status: take.status,
          }))
        );
        setVariances(allLines);
      }

      const whRes = await window
        .fetch(`/api/warehouses`, { credentials: 'include' })
        .then((r) => r.json());
      if (whRes.success) {
        setWarehouses(whRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="คลังทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">คลังทั้งหมด</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.code} — {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variance Report Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            รายงานผลต่างการตรวจนับ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่ตรวจนับ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>คลัง</TableHead>
                <TableHead className="text-right">ยอดระบบ</TableHead>
                <TableHead className="text-right">ยอดนับจริง</TableHead>
                <TableHead className="text-right">ผลต่าง</TableHead>
                <TableHead className="text-right">มูลค่าผลต่าง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-400">
                    ไม่พบรายการผลต่าง
                  </TableCell>
                </TableRow>
              ) : (
                variances.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{line.stockTakeNumber}</TableCell>
                    <TableCell className="text-sm">{fd(line.takeDate)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-mono text-gray-500">{line.product.code}</p>
                        <p className="text-gray-800">{line.product.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {line.warehouse.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fc(line.expectedQty)} {line.product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {fc(line.actualQty)} {line.product.unit}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        line.varianceQty < 0
                          ? 'text-red-600'
                          : line.varianceQty > 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {line.varianceQty !== 0 && (
                        <>
                          {line.varianceQty < 0 ? '-' : '+'}
                          {fc(Math.abs(line.varianceQty))} {line.product.unit}
                        </>
                      )}
                      {line.varianceQty === 0 && '—'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        line.varianceValue < 0
                          ? 'text-red-600'
                          : line.varianceValue > 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {line.varianceValue !== 0 && (
                        <>
                          {line.varianceValue < 0 ? '-' : '+'}฿{fc(Math.abs(line.varianceValue))}
                        </>
                      )}
                      {line.varianceValue === 0 && '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StockTakePage() {
  const [tab, setTab] = useState<'list' | 'variance'>('list');
  const tabs = [
    { id: 'list' as const, label: 'รายการตรวจนับ', icon: ClipboardCheck },
    { id: 'variance' as const, label: 'รายงานผลต่าง', icon: AlertCircle },
  ];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">การตรวจนับสต็อก (Stock Take)</h1>
          <p className="text-sm text-gray-500">ระบบตรวจนับสินค้าคงคลังและรายงานผลต่าง</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-600'
                  : 'border-transparent text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'list' && <StockTakesListTab />}
      {tab === 'variance' && <VarianceReportTab />}
    </div>
  );
}
