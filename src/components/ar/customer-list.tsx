'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CustomerEditDialog } from './customer-edit-dialog';

interface Customer {
  id: string;
  code: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  province: string;
  creditLimit: number;
  balance: number;
  status: string;
}

export function CustomerList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    code: '',
    name: '',
    taxId: '',
    phone: '',
    email: '',
    creditLimit: 0,
    address: '',
  });

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/customers`, { credentials: 'include' });
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        // Ensure we always set an array, even if API returns unexpected format
        const data = json?.data ?? json ?? [];
        setCustomers(Array.isArray(data) ? data : []);
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
    fetchCustomers();
  }, [toast, refreshKey]);

  // Safe array handling - ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const filteredCustomers = safeCustomers.filter((customer) => {
    // Safety check - ensure customer is an object and has required properties
    if (!customer || typeof customer !== 'object') return false;

    const searchLower = searchTerm?.toLowerCase() ?? '';
    const nameMatch = customer.name?.toLowerCase?.().includes(searchLower) ?? false;
    const codeMatch = customer.code?.toLowerCase?.().includes(searchLower) ?? false;

    return nameMatch || codeMatch;
  });

  // Safe reduce operations with default values
  const totalBalance = safeCustomers.reduce((sum, c) => sum + (c?.balance ?? 0), 0);
  const totalCreditLimit = safeCustomers.reduce((sum, c) => sum + (c?.creditLimit ?? 0), 0);

  // Handle form field changes
  const handleNewCustomerChange = (field: string, value: any) => {
    setNewCustomer((prev) => ({ ...prev, [field]: value }));
  };

  // Handle add customer
  const handleAddCustomer = async () => {
    // Validation
    if (!newCustomer.code?.trim?.()) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาระบุรหัสลูกค้า',
        variant: 'destructive',
      });
      return;
    }

    if (!newCustomer.name?.trim?.()) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาระบุชื่อลูกค้า',
        variant: 'destructive',
      });
      return;
    }

    // Tax ID validation (13 digits if provided)
    if (newCustomer.taxId && newCustomer.taxId.length !== 13) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    if (newCustomer.email?.trim?.() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'รูปแบบอีเมลไม่ถูกต้อง',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch(`/api/customers`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          creditLimit: Number(newCustomer.creditLimit) || 0,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || json?.message || 'บันทึกไม่สำเร็จ');
      }

      toast({
        title: 'บันทึกสำเร็จ',
        description: 'เพิ่มลูกค้าใหม่เรียบร้อยแล้ว',
      });

      setIsAddDialogOpen(false);
      // Reset form
      setNewCustomer({
        code: '',
        name: '',
        taxId: '',
        phone: '',
        email: '',
        creditLimit: 0,
        address: '',
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!deleteDialog?.id) return;

    try {
      const res = await fetch(`/api/customers/${deleteDialog.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || json?.message || 'ลบไม่สำเร็จ');
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบลูกค้าเรียบร้อยแล้ว',
      });

      setDeleteDialog({ open: false, id: '', name: '' });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    }
  };

  // Open delete dialog
  const openDeleteDialog = (customer: Customer) => {
    if (!customer?.id) return;
    setDeleteDialog({
      open: true,
      id: customer.id,
      name: customer.name || 'ไม่ระบุชื่อ',
    });
  };

  // Open edit dialog
  const openEditDialog = (customer: Customer) => {
    if (!customer?.id) return;
    setEditDialog({
      open: true,
      customer: customer,
    });
  };

  // Reset form when dialog opens
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (open) {
      setNewCustomer({
        code: '',
        name: '',
        taxId: '',
        phone: '',
        email: '',
        creditLimit: 0,
        address: '',
      });
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
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
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty UI - use safeCustomers instead of customers
  if (safeCustomers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ลูกหนี้การค้า</h1>
            <p className="mt-1 text-gray-500">จัดการข้อมูลลูกค้าและลูกหนี้</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มลูกค้า
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลลูกค้าใหม่ตามแบบฟอร์มด้านล่าง</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-code" className="text-right">
                    รหัสลูกค้า
                  </Label>
                  <Input
                    id="new-code"
                    className="col-span-3"
                    placeholder="C005"
                    value={newCustomer.code}
                    onChange={(e) => handleNewCustomerChange('code', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-name" className="text-right">
                    ชื่อลูกค้า <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-name"
                    className="col-span-3"
                    placeholder="ชื่อบริษัท/ห้างหุ้นส่วน"
                    value={newCustomer.name}
                    onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-taxId" className="text-right">
                    เลขประจำตัวผู้เสียภาษี
                  </Label>
                  <Input
                    id="new-taxId"
                    className="col-span-3"
                    placeholder="0105555000000"
                    maxLength={13}
                    value={newCustomer.taxId}
                    onChange={(e) => handleNewCustomerChange('taxId', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-phone" className="text-right">
                    โทรศัพท์
                  </Label>
                  <Input
                    id="new-phone"
                    className="col-span-3"
                    placeholder="02-000-0000"
                    value={newCustomer.phone}
                    onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-email" className="text-right">
                    อีเมล
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    className="col-span-3"
                    placeholder="email@company.co.th"
                    value={newCustomer.email}
                    onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-creditLimit" className="text-right">
                    วงเงินเครดิต
                  </Label>
                  <Input
                    id="new-creditLimit"
                    className="col-span-3"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={newCustomer.creditLimit}
                    onChange={(e) => handleNewCustomerChange('creditLimit', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-address" className="text-right">
                    ที่อยู่
                  </Label>
                  <Input
                    id="new-address"
                    className="col-span-3"
                    placeholder="ที่อยู่"
                    value={newCustomer.address}
                    onChange={(e) => handleNewCustomerChange('address', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddCustomer}>บันทึก</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูล</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบลูกค้า &quot;{deleteDialog.name || 'ไม่ระบุชื่อ'}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: '', name: '' })}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ลูกหนี้การค้า</h1>
          <p className="mt-1 text-gray-500">จัดการข้อมูลลูกค้าและลูกหนี้</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มลูกค้า
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
              <DialogDescription>กรอกข้อมูลลูกค้าใหม่ตามแบบฟอร์มด้านล่าง</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-code" className="text-right">
                  รหัสลูกค้า
                </Label>
                <Input
                  id="new-code"
                  className="col-span-3"
                  placeholder="C005"
                  value={newCustomer.code}
                  onChange={(e) => handleNewCustomerChange('code', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">
                  ชื่อลูกค้า <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-name"
                  className="col-span-3"
                  placeholder="ชื่อบริษัท/ห้างหุ้นส่วน"
                  value={newCustomer.name}
                  onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-taxId" className="text-right">
                  เลขประจำตัวผู้เสียภาษี
                </Label>
                <Input
                  id="new-taxId"
                  className="col-span-3"
                  placeholder="0105555000000"
                  maxLength={13}
                  value={newCustomer.taxId}
                  onChange={(e) => handleNewCustomerChange('taxId', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-phone" className="text-right">
                  โทรศัพท์
                </Label>
                <Input
                  id="new-phone"
                  className="col-span-3"
                  placeholder="02-000-0000"
                  value={newCustomer.phone}
                  onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-email" className="text-right">
                  อีเมล
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  className="col-span-3"
                  placeholder="email@company.co.th"
                  value={newCustomer.email}
                  onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-creditLimit" className="text-right">
                  วงเงินเครดิต
                </Label>
                <Input
                  id="new-creditLimit"
                  className="col-span-3"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={newCustomer.creditLimit}
                  onChange={(e) => handleNewCustomerChange('creditLimit', Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-address" className="text-right">
                  ที่อยู่
                </Label>
                <Input
                  id="new-address"
                  className="col-span-3"
                  placeholder="ที่อยู่"
                  value={newCustomer.address}
                  onChange={(e) => handleNewCustomerChange('address', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAddCustomer}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">จำนวนลูกค้า</p>
            <p className="text-2xl font-bold text-gray-800">{safeCustomers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ลูกหนี้รวม</p>
            <p className="text-2xl font-bold text-blue-600">
              ฿{totalBalance?.toLocaleString?.() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">วงเงินเครดิตรวม</p>
            <p className="text-2xl font-bold text-green-600">
              ฿{totalCreditLimit?.toLocaleString?.() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ใช้วงเงินแล้ว</p>
            <p className="text-2xl font-bold text-orange-600">
              {totalCreditLimit > 0 ? ((totalBalance / totalCreditLimit) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="ค้นหาลูกค้า..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value ?? '')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                  <TableHead>ติดต่อ</TableHead>
                  <TableHead className="text-right">วงเงินเครดิต</TableHead>
                  <TableHead className="text-right">ยอดคงเหลือ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูลที่ตรงกับการค้นหา
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    // Extra safety check for each customer
                    if (!customer || typeof customer !== 'object') return null;

                    const customerStatus = customer?.status ?? 'inactive';
                    const isActive = customerStatus === 'active';

                    return (
                      <TableRow key={customer.id || `customer-${Math.random()}`}>
                        <TableCell className="font-mono">{customer.code || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {customer.name || 'ไม่ระบุชื่อ'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{customer.taxId || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {customer.phone || '-'}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              {customer.email || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{customer.creditLimit?.toLocaleString?.() ?? '0'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          ฿{customer.balance?.toLocaleString?.() ?? '0'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => openDeleteDialog(customer)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
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
      <CustomerEditDialog
        customer={editDialog.customer as any}
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, customer: null })}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
