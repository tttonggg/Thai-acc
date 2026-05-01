'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Upload,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
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
import { AccountEditDialog } from './account-edit-dialog';
import { useToast } from '@/hooks/use-toast';

const accountTypeColors = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-red-100 text-red-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-orange-100 text-orange-800',
};

const accountTypeLabels = {
  ASSET: 'สินทรัพย์',
  LIABILITY: 'หนี้สิน',
  EQUITY: 'ทุน',
  REVENUE: 'รายได้',
  EXPENSE: 'ค่าใช้จ่าย',
};

interface Account {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  type: string;
  level: number;
  parentId: string | null;
  isDetail: boolean;
  isActive: boolean;
  notes?: string | null;
}

export function ChartOfAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Edit dialog state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [parentAccountForNew, setParentAccountForNew] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete dialog state
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    parentId: '',
    isDetail: true,
  });

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/accounts`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch(`/api/accounts`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          level: newAccount.code.length,
          parentId: newAccount.code.length > 1 ? newAccount.code.slice(0, -1) : null,
        }),
      });

      if (response.ok) {
        await fetchAccounts();
        setIsAddDialogOpen(false);
        setNewAccount({
          code: '',
          name: '',
          type: 'ASSET',
          parentId: '',
          isDetail: true,
        });
      }
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    // Check if account has children
    const children = getChildAccounts(account.id);
    if (children.length > 0) {
      toast({
        title: 'ไม่สามารถลบบัญชีได้',
        description: 'ไม่สามารถลบบัญชีที่มีบัญชีย่อยได้ กรุณาลบบัญชีย่อยก่อน',
        variant: 'destructive',
      });
      return;
    }

    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/accounts/${accountToDelete.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'ลบบัญชีสำเร็จ',
          description: `ลบบัญชี ${accountToDelete.code} - ${accountToDelete.name} เรียบร้อยแล้ว`,
        });
        await fetchAccounts();
        setIsDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: 'ไม่สามารถลบบัญชีได้',
          description: error.error || 'เกิดข้อผิดพลาดในการลบบัญชี',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setParentAccountForNew(null);
    setIsEditDialogOpen(true);
  };

  const handleAddChildAccount = (parentAccount: Account) => {
    setParentAccountForNew(parentAccount);
    setEditingAccount(null);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingAccount(null);
    setParentAccountForNew(null);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/accounts/export`, { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export accounts:', error);
    }
  };

  const handleImportFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setImportFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const accountsToImport: any[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [code, name, type, isDetail] = line.split(',');
        if (code && name && type) {
          accountsToImport.push({
            code: code.trim(),
            name: name.trim(),
            type: type.trim(),
            level: code.trim().length,
            parentId: code.trim().length > 1 ? code.trim().slice(0, -1) : null,
            isDetail: isDetail?.trim() === 'true' || isDetail?.trim() === '1',
          });
        }
      }

      // Import accounts
      for (const account of accountsToImport) {
        await fetch(`/api/accounts`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(account),
        });
      }

      await fetchAccounts();
      setIsImportDialogOpen(false);
      setImportFile(null);
      alert(`นำเข้า ${accountsToImport.length} บัญชีเรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Failed to import accounts:', error);
      alert('ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setImporting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getChildAccounts = (parentId: string): Account[] => {
    if (!accounts || !Array.isArray(accounts)) return [];
    return accounts.filter((a) => a && a.parentId === parentId);
  };

  const renderAccountRow = (account: Account, depth: number = 0) => {
    const children = getChildAccounts(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.includes(account.id);
    const indent = depth * 24;

    return (
      <TableRow key={account.id} className={depth > 0 ? 'bg-gray-50/50' : ''}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: indent }}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(account.id)}
                className="mr-1 rounded p-1 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="mr-2 h-4 w-4 text-yellow-500" />
              ) : (
                <Folder className="mr-2 h-4 w-4 text-yellow-500" />
              )
            ) : null}
            <span className="font-mono text-sm">{account.code}</span>
          </div>
        </TableCell>
        <TableCell className={depth === 0 ? 'font-semibold' : ''}>{account.name}</TableCell>
        <TableCell>
          <Badge className={accountTypeColors[account.type as keyof typeof accountTypeColors]}>
            {accountTypeLabels[account.type as keyof typeof accountTypeLabels]}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {account.isDetail ? (
            <Badge variant="outline" className="border-green-200 text-green-600">
              รายละเอียด
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              หมวด
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditAccount(account)}
              title="แก้ไข"
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
            {!account.isDetail && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAddChildAccount(account)}
                title="เพิ่มบัญชีย่อย"
              >
                <Plus className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDeleteAccount(account)}
              title="ลบ"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderAccountTree = (parentId: string | null = null, depth: number = 0) => {
    if (!accounts || !Array.isArray(accounts)) return null;

    const filteredAccounts = accounts.filter((a) => a && a.parentId === parentId);

    const rows: React.ReactNode[] = [];

    filteredAccounts.forEach((account) => {
      if (!account) return;

      const isExpanded = expandedIds.includes(account.id);
      const children = getChildAccounts(account.id);

      const rowElement = <>{renderAccountRow(account, depth)}</>;

      // Add key to the first element in the fragment
      rows.push(<React.Fragment key={account.id}>{rowElement}</React.Fragment>);

      if (isExpanded && children.length > 0) {
        const childRows = renderAccountTree(account.id, depth + 1);
        if (childRows) {
          rows.push(...(childRows as React.ReactNode[]));
        }
      }
    });

    return rows;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ผังบัญชี</h1>
          <p className="mt-1 text-gray-500">จัดการผังบัญชีตามมาตรฐาน TFRS</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                นำเข้า
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>นำเข้าผังบัญชี</DialogTitle>
                <DialogDescription>นำเข้าผังบัญชีจากไฟล์ CSV</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FileUpload
                  accept=".csv"
                  maxSize={5}
                  onFileSelect={handleImportFileSelect}
                  label="เลือกไฟล์ CSV"
                  description="รูปแบบ: รหัส,ชื่อ,ประเภท,รายละเอียด"
                  uploadedFileName={importFile?.name}
                />
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="mb-2 font-medium">รูปแบบไฟล์ CSV:</p>
                  <code className="text-xs">code,name,type,isDetail</code>
                  <br />
                  <code className="text-xs">1111,เงินสด - ธนาคารกรุงเทพ,ASSET,true</code>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleImport} disabled={!importFile || importing}>
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังนำเข้า...
                    </>
                  ) : (
                    'นำเข้า'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Button */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            ส่งออก
          </Button>

          {/* Add Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มบัญชี
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลบัญชีใหม่ตามแบบฟอร์มด้านล่าง</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    รหัสบัญชี
                  </Label>
                  <Input
                    id="code"
                    className="col-span-3"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    placeholder="เช่น 1111"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    ชื่อบัญชี
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="ชื่อบัญชี"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    ประเภท
                  </Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(v) => setNewAccount({ ...newAccount, type: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSET">สินทรัพย์</SelectItem>
                      <SelectItem value="LIABILITY">หนี้สิน</SelectItem>
                      <SelectItem value="EQUITY">ทุน</SelectItem>
                      <SelectItem value="REVENUE">รายได้</SelectItem>
                      <SelectItem value="EXPENSE">ค่าใช้จ่าย</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isDetail" className="text-right">
                    ประเภทบัญชี
                  </Label>
                  <Select
                    value={newAccount.isDetail ? 'detail' : 'header'}
                    onValueChange={(v) =>
                      setNewAccount({ ...newAccount, isDetail: v === 'detail' })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detail">บัญชีรายละเอียด (สามารถลงบัญชีได้)</SelectItem>
                      <SelectItem value="header">บัญชีหมวด (สำหรับจัดกลุ่ม)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddAccount}>บันทึก</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit/Add Account Dialog */}
          <AccountEditDialog
            account={editingAccount}
            parentAccount={parentAccountForNew}
            open={isEditDialogOpen}
            onOpenChange={handleEditDialogClose}
            onSuccess={fetchAccounts}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการลบบัญชี</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบบัญชี{' '}
                  <span className="font-semibold">
                    {accountToDelete?.code} - {accountToDelete?.name}
                  </span>{' '}
                  หรือไม่?
                  <br />
                  <br />
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'กำลังลบ...' : 'ลบ'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="ค้นหาบัญชี..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการบัญชี ({accounts.length} บัญชี)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead className="w-[120px]">ประเภท</TableHead>
                <TableHead className="w-[100px] text-center">สถานะ</TableHead>
                <TableHead className="w-[120px] text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderAccountTree()}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
