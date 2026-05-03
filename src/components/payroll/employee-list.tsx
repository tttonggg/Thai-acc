'use client';

// ============================================
// 👥 Employee Directory Tab
// Agent 06: Payroll & HR Engineer
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EmployeeEditDialog } from './employee-edit-dialog';

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n);

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
  baseSalary: number;
  hireDate: string;
  socialSecurityNo: string | null;
  taxId: string | null;
  isActive: boolean;
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window
        .fetch(`/api/employees`, { credentials: 'include' })
        .then((r) => r.json());
      if (res.success) {
        const employeesData = res.data || [];
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEdit(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEdit(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteEmployeeId(employee.id);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteEmployeeId) return;

    const res = await window
      .fetch(`/api/employees/${deleteEmployeeId}`, { credentials: 'include', method: 'DELETE' })
      .then((r) => r.json());

    if (res.success) {
      toast({ title: 'ลบพนักงานสำเร็จ' });
      setShowDelete(false);
      setDeleteEmployeeId(null);
      fetchAll();
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' });
    }
  };

  const filtered = (employees || []).filter((e) => {
    if (!e || typeof e !== 'object') return false;
    return (
      !search ||
      e?.firstName?.includes(search) ||
      e?.lastName?.includes(search) ||
      e?.employeeCode?.includes(search) ||
      (e?.department || '').includes(search)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Summary stats with null safety
  const active = (employees || []).filter((e) => e?.isActive);
  const totalSalary = active.reduce((s, e) => s + (e?.baseSalary || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">พนักงานที่ใช้งาน</p>
            <p className="text-2xl font-bold text-blue-600">{active.length} คน</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">ฐานเงินเดือนรวม/เดือน</p>
            <p className="text-2xl font-bold text-green-600">฿{fc(totalSalary)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">ประกันสังคมพนักงาน/เดือน</p>
            <p className="text-2xl font-bold text-purple-600">
              ฿{fc(active.reduce((s, e) => s + Math.min(e.baseSalary * 0.05, 750), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="ค้นหาพนักงาน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" />
          เพิ่มพนักงาน
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>ตำแหน่ง / แผนก</TableHead>
                  <TableHead className="text-right">เงินเดือน</TableHead>
                  <TableHead className="text-right">SSC (5%)</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                      <Users className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      {search ? 'ไม่พบพนักงานที่ค้นหา' : 'ยังไม่มีพนักงาน'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.employeeCode}</TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {e.firstName} {e.lastName}
                        </p>
                        {e.taxId && <p className="text-xs text-gray-400">{e.taxId}</p>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.position || '—'}
                        {e.department && (
                          <span className="ml-1 text-gray-400">/ {e.department}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿{fc(e.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ฿{fc(Math.min(e.baseSalary * 0.05, 750))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={e.isActive ? 'default' : 'secondary'} className="text-xs">
                          {e.isActive ? 'ทำงาน' : 'ลาออก'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEmployee(e)}
                            className="h-11 w-11 p-0"
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEmployee(e)}
                            className="h-11 w-11 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Employee Edit Dialog */}
      <EmployeeEditDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={fetchAll}
        employee={selectedEmployee as any}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบพนักงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบพนักงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              {deleteEmployeeId && (
                <span className="mt-2 block text-amber-600">
                  หมายเหตุ: พนักงานที่มีประวัติเงินเดือนจะไม่สามารถลบได้
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              ลบพนักงาน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
