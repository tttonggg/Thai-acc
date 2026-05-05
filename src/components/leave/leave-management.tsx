'use client';

// ============================================
// 📅 Leave Management Component
// Phase 3b - Leave Management UI
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface LeaveType {
  id: string;
  code: string;
  name: string;
  paidLeave: boolean;
  defaultDays: number;
}

interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
}

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export function LeaveManagement() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>('');
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch leave types
      const typesRes = await fetch(`/api/leave/types`, { credentials: 'include' }).then((r) =>
        r.json()
      );
      if (typesRes.success) {
        setLeaveTypes(typesRes.data || []);
      }

      // For demo, use first employee or prompt
      // In real app, get from session
      if (!currentEmployeeId) {
        const employeesRes = await fetch(`/api/employees`, { credentials: 'include' }).then((r) =>
          r.json()
        );
        if (employeesRes.success && employeesRes.data?.length > 0) {
          setCurrentEmployeeId(employeesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leave types:', err);
    } finally {
      setLoading(false);
    }
  }, [currentEmployeeId]);

  const fetchBalances = useCallback(async () => {
    if (!currentEmployeeId) return;
    try {
      const res = await fetch(`/api/leave/balance/${currentEmployeeId}?year=${currentYear}`, {
        credentials: 'include',
      }).then((r) => r.json());
      if (res.success) {
        setBalances(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [currentEmployeeId, currentYear]);

  const fetchRequests = useCallback(async () => {
    if (!currentEmployeeId) return;
    try {
      const res = await fetch(
        `/api/leave/request?employeeId=${currentEmployeeId}&year=${currentYear}`,
        { credentials: 'include' }
      ).then((r) => r.json());
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  }, [currentEmployeeId, currentYear]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  useEffect(() => {
    if (currentEmployeeId) {
      fetchBalances();
      fetchRequests();
    }
  }, [currentEmployeeId, fetchBalances, fetchRequests]);

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmitRequest = async () => {
    if (!selectedLeaveType || !startDate || !endDate) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
      return;
    }

    const totalDays = calculateDays(startDate, endDate);
    if (totalDays <= 0) {
      toast({ title: 'วันที่ไม่ถูกต้อง', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leave/request`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmployeeId,
          leaveTypeId: selectedLeaveType,
          startDate,
          endDate,
          totalDays,
          reason,
        }),
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'สร้างคำขอลาสำเร็จ' });
        setShowRequestDialog(false);
        setSelectedLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchBalances();
        fetchRequests();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างคำขอลาได้',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`/api/leave/request/${requestId}/approve`, {
        credentials: 'include',
        method: 'PATCH',
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'อนุมัติคำขอลาสำเร็จ' });
        fetchBalances();
        fetchRequests();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'ข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/leave/request/${requestId}/reject`, {
        credentials: 'include',
        method: 'PATCH',
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'ปฏิเสธคำขอลาสำเร็จ' });
        fetchBalances();
        fetchRequests();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'ข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const res = await fetch(`/api/leave/request/${requestId}/cancel`, {
        credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentEmployeeId }),
      }).then((r) => r.json());

      if (res.success) {
        toast({ title: 'ยกเลิกคำขอลาสำเร็จ' });
        fetchBalances();
        fetchRequests();
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'ข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            รออนุมัติ
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            อนุมัติ
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <X className="mr-1 h-3 w-3" />
            ปฏิเสธ
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            ยกเลิก
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ลางาน (Leave Management)</h1>
          <p className="text-sm text-gray-500">จัดการวันลาและคำขอลาพนักงาน</p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-1 h-4 w-4" />
              ขอลางาน
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ขอลางาน</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ประเภทการลา</Label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">เลือกประเภทการลา</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.defaultDays} วัน)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วันที่เริ่ม</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันที่สิ้นสุด</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {startDate && endDate && (
                <p className="text-sm text-blue-600">
                  จำนวนวันลา: {calculateDays(startDate, endDate)} วัน
                </p>
              )}
              <div className="space-y-2">
                <Label>เหตุผล</Label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลา..."
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                className="cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={submitting || !selectedLeaveType || !startDate || !endDate}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="balances">ยอดวันลา</TabsTrigger>
          <TabsTrigger value="requests">คำขอลา</TabsTrigger>
          <TabsTrigger value="types">ประเภทการลา</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {balances.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="ยังไม่มีข้อมูลยอดวันลา"
                description="ยังไม่มีข้อมูลสิทธิ์วันลาของพนักงาน"
              />
            ) : (
              balances.map((balance) => {
                const available = balance.totalDays - balance.usedDays - balance.pendingDays;
                const usedPercent =
                  balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0;
                return (
                  <Card key={balance.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{balance.leaveType.name}</h3>
                          <p className="text-xs text-gray-500">{balance.leaveType.code}</p>
                        </div>
                        {balance.leaveType.paidLeave && (
                          <Badge variant="default" className="bg-green-100 text-xs text-green-800">
                            ลามีค่าจ้าง
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">ใช้ไป</span>
                          <span className="font-medium">
                            {balance.usedDays} / {balance.totalDays} วัน
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${Math.min(usedPercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">คงเหลือ: {available} วัน</span>
                          <span className="text-amber-600">
                            รออนุมัติ: {balance.pendingDays} วัน
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>วันที่เริ่ม</TableHead>
                      <TableHead>วันที่สิ้นสุด</TableHead>
                      <TableHead className="text-center">จำนวนวัน</TableHead>
                      <TableHead>เหตุผล</TableHead>
                      <TableHead className="text-center">สถานะ</TableHead>
                      <TableHead className="text-center">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <EmptyState
                            icon={Calendar}
                            title="ยังไม่มีคำขอลา"
                            description="พนักงานยังไม่ได้ส่งคำขอลา"
                            action={{ label: 'สร้างคำขอลา', onClick: () => {} }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.leaveType.name}</TableCell>
                          <TableCell>{formatDate(req.startDate)}</TableCell>
                          <TableCell>{formatDate(req.endDate)}</TableCell>
                          <TableCell className="text-center">{req.totalDays}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason || '—'}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(req.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            {req.status === 'PENDING' && (
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(req.id)}
                                  className="h-8 w-8 cursor-pointer p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  title="อนุมัติ"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(req.id)}
                                  className="h-8 w-8 cursor-pointer p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  title="ปฏิเสธ"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancel(req.id)}
                                  className="h-8 w-8 cursor-pointer p-0 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                                  title="ยกเลิก"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่อประเภทการลา</TableHead>
                      <TableHead className="text-center">วันลามาตรฐาน</TableHead>
                      <TableHead className="text-center">ลามีค่าจ้าง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <EmptyState
                            icon={Calendar}
                            title="ไม่พบประเภทการลา"
                            description="ติดต่อผู้ดูแลระบบเพื่อตั้งค่าประเภทการลา"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveTypes.map((lt) => (
                        <TableRow key={lt.id}>
                          <TableCell className="font-mono">{lt.code}</TableCell>
                          <TableCell className="font-medium">{lt.name}</TableCell>
                          <TableCell className="text-center">{lt.defaultDays} วัน</TableCell>
                          <TableCell className="text-center">
                            {lt.paidLeave ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                มี
                              </Badge>
                            ) : (
                              <Badge variant="secondary">ไม่มี</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
