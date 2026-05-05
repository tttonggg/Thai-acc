'use client';

// ============================================
// 💰 Petty Cash Page
// Agent 03 (Finance): Petty Cash & Advances
// Tabs: Funds (กองทุน) | Vouchers (ใบสำคัญ)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Receipt,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getStatusBadgeProps } from '@/lib/status-badge';
import { PettyCashFundEditDialog } from './fund-edit-dialog';
import { PettyCashVoucherEditDialog } from './voucher-edit-dialog';

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' });

interface Fund {
  id: string;
  code: string;
  name: string;
  maxAmount: number;
  currentBalance: number;
  isActive: boolean;
  custodianId: string;
  glAccountId: string;
  custodian?: { name: string };
}

interface Voucher {
  id: string;
  voucherNo: string;
  date: string;
  payee: string;
  description: string;
  amount: number;
  isReimbursed: boolean;
  fund?: { name: string };
  fundId: string;
  glExpenseAccountId: string;
  journalEntryId?: string;
}

// ─── Funds Tab ─────────────────────────────────────────────────────────────

function FundsTab({ onFundsLoaded }: { onFundsLoaded: (funds: Fund[]) => void }) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<Fund | null>(null);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const fRes = await window
      .fetch(`/api/petty-cash/funds`, { credentials: 'include' })
      .then((r) => r.json());
    if (fRes.success) {
      setFunds(fRes.data);
      onFundsLoaded(fRes.data);
    }
    queueMicrotask(() => setLoading(false));
  }, [onFundsLoaded]);
  useEffect(() => {
    queueMicrotask(() => fetchAll());
  }, [fetchAll]);

  const handleCreate = () => {
    setSelectedFund(null);
    setEditMode('create');
    setShowEdit(true);
  };

  const handleEdit = (fund: Fund) => {
    setSelectedFund(fund);
    setEditMode('edit');
    setShowEdit(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/petty-cash/funds/${deleteConfirm.id}`, {
        credentials: 'include',
        method: 'DELETE',
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'ลบกองทุนสำเร็จ', description: deleteConfirm.name });
        setDeleteConfirm(null);
        fetchAll();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'เกิดข้อผิดพลาดในการลบ', variant: 'destructive' });
    }
  };

  const handleDialogSuccess = () => {
    setShowEdit(false);
    setSelectedFund(null);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" />
          สร้างกองทุน
        </Button>
      </div>

      {/* Fund Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {funds.map((f) => {
          const usedPct = ((f.maxAmount - f.currentBalance) / f.maxAmount) * 100;
          const isLow = usedPct > 80;
          return (
            <Card
              key={f.id}
              className={`border-2 ${isLow ? 'border-orange-300' : 'border-gray-200'}`}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-xs text-gray-400">{f.code}</p>
                    <p className="font-semibold text-gray-800">{f.name}</p>
                    <p className="mt-1 text-xs text-gray-500">ผู้ถือ: {f.custodian?.name || '—'}</p>
                  </div>
                  <Wallet className={`h-6 w-6 ${isLow ? 'text-orange-400' : 'text-teal-400'}`} />
                </div>

                {/* Balance Progress */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>ยอดคงเหลือ</span>
                    <span>{Math.round(100 - usedPct)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-orange-400' : 'bg-teal-400'}`}
                      style={{ width: `${100 - usedPct}%` }}
                    />
                  </div>
                  <p
                    className={`mt-2 text-lg font-bold ${isLow ? 'text-orange-600' : 'text-teal-600'}`}
                  >
                    ฿{fc(f.currentBalance)}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      / ฿{fc(f.maxAmount)}
                    </span>
                  </p>
                  {isLow && (
                    <p className="mt-1 text-xs text-orange-500">⚠️ วงเงินใกล้หมด — กรุณาเติมเงิน</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(f)}
                    className="flex-1"
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(f)}
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    ลบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {funds.length === 0 && (
          <div className="col-span-3">
            <EmptyState
              icon={Wallet}
              title="ยังไม่มีกองทุนเงินสดย่อย"
              description="สร้างกองทุนเงินสดย่อยสำหรับจ่ายค่าใช้จ่ายเล็กน้อย"
              action={{ label: 'สร้างกองทุน', onClick: () => {} }}
            />
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <PettyCashFundEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        fund={selectedFund}
        onSuccess={handleDialogSuccess}
        mode={editMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบกองทุน</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              คุณต้องการลบกองทุน <span className="font-semibold">{deleteConfirm?.name}</span>{' '}
              ใช่หรือไม่?
            </p>
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                กองทุนจะถูกลบถ้าไม่มีใบสำคัญและยอดคงเหลือเป็น 0
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              ลบกองทุน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Vouchers Tab ───────────────────────────────────────────────────────────

function VouchersTab({ funds }: { funds: Fund[] }) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Voucher | null>(null);
  const [reimburseDialog, setReimburseDialog] = useState<Voucher | null>(null);
  const [cashBankAccountId, setCashBankAccountId] = useState('');
  const [form, setForm] = useState({
    fundId: '',
    payee: '',
    description: '',
    amount: '',
    glExpenseAccountId: '',
    date: '',
  });
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await window
      .fetch(`/api/petty-cash/vouchers`, { credentials: 'include' })
      .then((r) => r.json());
    if (res.success) setVouchers(res.data);
    queueMicrotask(() => setLoading(false));
  }, []);
  useEffect(() => {
    queueMicrotask(() => fetchAll());
  }, [fetchAll]);

  const selectedFund = funds.find((f) => f.id === form.fundId);

  const handleSubmit = async () => {
    const res = await window
      .fetch(`/api/petty-cash/vouchers`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      .then((r) => r.json());
    if (res.success) {
      toast({
        title: 'บันทึกสำเร็จ',
        description: `฿${fc(parseFloat(form.amount))} — ${form.payee}`,
      });
      setShowAdd(false);
      setForm({
        fundId: '',
        payee: '',
        description: '',
        amount: '',
        glExpenseAccountId: '',
        date: '',
      });
      fetchAll();
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowEdit(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/petty-cash/vouchers/${deleteConfirm.id}`, {
        credentials: 'include',
        method: 'DELETE',
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'ลบใบสำคัญสำเร็จ', description: deleteConfirm.voucherNo });
        setDeleteConfirm(null);
        fetchAll();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'เกิดข้อผิดพลาดในการลบ', variant: 'destructive' });
    }
  };

  const handleApprove = async (voucher: Voucher) => {
    try {
      const res = await fetch(`/api/petty-cash/vouchers/${voucher.id}/approve`, {
        credentials: 'include',
        method: 'POST',
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'อนุมัติใบสำคัญสำเร็จ', description: voucher.voucherNo });
        fetchAll();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการอนุมัติ',
        variant: 'destructive',
      });
    }
  };

  const handleReimburse = async () => {
    if (!reimburseDialog || !cashBankAccountId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาระบุบัญชีเงินสด/ธนาคาร',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch(`/api/petty-cash/vouchers/${reimburseDialog.id}/reimburse`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashBankAccountId }),
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'เติมเงินสำเร็จ', description: `฿${fc(reimburseDialog.amount)}` });
        setReimburseDialog(null);
        setCashBankAccountId('');
        fetchAll();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเติมเงิน',
        variant: 'destructive',
      });
    }
  };

  const handleEditDialogSuccess = () => {
    setShowEdit(false);
    setSelectedVoucher(null);
    fetchAll();
  };

  const canEditVoucher = (voucher: Voucher) => {
    // Can only edit if not yet approved (no journal entry)
    return !voucher.journalEntryId;
  };

  const canApproveVoucher = (voucher: Voucher) => {
    // Can only approve if not yet approved
    return !voucher.journalEntryId;
  };

  const canReimburseVoucher = (voucher: Voucher) => {
    // Can only reimburse if approved but not yet reimbursed
    return voucher.journalEntryId && !voucher.isReimbursed;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
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

  const totalUnreimbursed = vouchers
    .filter((v) => !v.isReimbursed)
    .reduce((s, v) => s + v.amount, 0);

  const getVoucherStatus = (voucher: Voucher) => {
    if (voucher.isReimbursed) {
      const config = getStatusBadgeProps('COMPLETED');
      return { label: 'เติมแล้ว', variant: config.variant };
    }
    if (voucher.journalEntryId) {
      const config = getStatusBadgeProps('APPROVED');
      return { label: 'อนุมัติแล้ว', variant: config.variant };
    }
    const config = getStatusBadgeProps('PENDING');
    return { label: 'รออนุมัติ', variant: config.variant };
  };

  return (
    <div className="space-y-4">
      {/* Header with stats and create button */}
      <div className="flex items-center justify-between">
        {totalUnreimbursed > 0 && (
          <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600">
            ⚠️ รอเบิกคืน: ฿{fc(totalUnreimbursed)}
          </div>
        )}
        <div className="ml-auto">
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-1 h-4 w-4" />
                บันทึกใบสำคัญ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ใบสำคัญเงินสดย่อย</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>กองทุน *</Label>
                  <Select
                    value={form.fundId}
                    onValueChange={(v) => setForm((p) => ({ ...p, fundId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกกองทุน" />
                    </SelectTrigger>
                    <SelectContent>
                      {funds.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} (คงเหลือ ฿{fc(f.currentBalance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFund && (
                    <p className="mt-1 text-xs text-gray-400">
                      วงเงินคงเหลือ: ฿{fc(selectedFund.currentBalance)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>วันที่</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>จำนวนเงิน (฿) *</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>จ่ายให้ *</Label>
                  <Input
                    value={form.payee}
                    onChange={(e) => setForm((p) => ({ ...p, payee: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>รายละเอียด *</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>GL บัญชีค่าใช้จ่าย *</Label>
                  <Input
                    value={form.glExpenseAccountId}
                    onChange={(e) => setForm((p) => ({ ...p, glExpenseAccountId: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                  บันทึก
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>กองทุน</TableHead>
                  <TableHead>จ่ายให้</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-400">
                      <Receipt className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      ยังไม่มีใบสำคัญ
                    </TableCell>
                  </TableRow>
                ) : (
                  vouchers.map((v) => {
                    const status = getVoucherStatus(v);
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                        <TableCell className="text-sm">{fd(v.date)}</TableCell>
                        <TableCell className="text-sm">{v.fund?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{v.payee}</TableCell>
                        <TableCell className="text-sm text-gray-600">{v.description}</TableCell>
                        <TableCell className="text-right font-semibold">฿{fc(v.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit button - only for pending vouchers */}
                            {canEditVoucher(v) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(v)}
                                className="h-8 w-8 p-0"
                                title="แก้ไข"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Delete button - only for pending vouchers */}
                            {canEditVoucher(v) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm(v)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="ลบ"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Approve button - only for pending vouchers */}
                            {canApproveVoucher(v) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(v)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="อนุมัติ"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Reimburse button - only for approved but not reimbursed */}
                            {canReimburseVoucher(v) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReimburseDialog(v)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="เติมเงิน"
                              >
                                <DollarSign className="h-3 w-3" />
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <PettyCashVoucherEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        voucher={selectedVoucher}
        funds={funds}
        onSuccess={handleEditDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบใบสำคัญ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              คุณต้องการลบใบสำคัญ <span className="font-semibold">{deleteConfirm?.voucherNo}</span>{' '}
              ใช่หรือไม่?
            </p>
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                ยอดเงินจะถูกคืนเข้ากองทุนเงินสดย่อย
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              ลบใบสำคัญ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reimbursement Dialog */}
      <Dialog
        open={!!reimburseDialog}
        onOpenChange={() => {
          setReimburseDialog(null);
          setCashBankAccountId('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เติมเงินสดย่อย</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-gray-700">
              เติมเงินกองทุนสำหรับใบสำคัญ{' '}
              <span className="font-semibold">{reimburseDialog?.voucherNo}</span>
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-600">จำนวนเงิน</p>
                <p className="text-xl font-bold text-gray-800">
                  ฿{fc(reimburseDialog?.amount || 0)}
                </p>
              </div>

              <div>
                <Label htmlFor="cashBankAccountId">บัญชีเงินสด/ธนาคารที่จะเติมเงิน *</Label>
                <Input
                  id="cashBankAccountId"
                  value={cashBankAccountId}
                  onChange={(e) => setCashBankAccountId(e.target.value)}
                  placeholder="รหัสบัญชีเงินสดหรือธนาคาร (เช่น 1110, 1101)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ระบุบัญชีที่จะโอนเงินออกเพื่อเติมกองทุนเงินสดย่อย
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReimburseDialog(null);
                setCashBankAccountId('');
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleReimburse} className="bg-blue-600 hover:bg-blue-700">
              <DollarSign className="mr-1 h-4 w-4" />
              เติมเงิน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PettyCashPage() {
  const [tab, setTab] = useState<'funds' | 'vouchers'>('funds');
  const [funds, setFunds] = useState<Fund[]>([]);
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">เงินสดย่อย (Petty Cash)</h1>
        <p className="text-sm text-gray-500">
          บริหารกองทุนเงินสดย่อยและใบสำคัญ พร้อมติดตามยอดคงเหลือแบบ Real-time
        </p>
      </div>
      <div className="mb-6 border-b">
        <nav className="flex gap-1">
          {[
            { id: 'funds' as const, label: 'กองทุน', icon: Wallet },
            { id: 'vouchers' as const, label: 'ใบสำคัญ', icon: Receipt },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'funds' ? <FundsTab onFundsLoaded={setFunds} /> : <VouchersTab funds={funds} />}
    </div>
  );
}
