'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft } from 'lucide-react';

interface ProjectTransaction {
  id: string;
  type: 'REVENUE' | 'EXPENSE' | 'TIME_COST';
  amount: number;
  description?: string;
  date: string;
  invoiceId?: string;
  paymentId?: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  customer?: { id: string; code: string; name: string };
  budgetRevenue?: number;
  budgetCost?: number;
  startDate?: string;
  endDate?: string;
  transactions: ProjectTransaction[];
  summary: {
    totalRevenue: number;
    totalExpense: number;
    profit: number;
  };
}

interface TransactionFormData {
  type: 'REVENUE' | 'EXPENSE' | 'TIME_COST';
  amount: number;
  description?: string;
  date: string;
}

async function fetchProject(id: string) {
  const res = await fetch(`/api/projects/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

async function createTransaction(projectId: string, data: TransactionFormData) {
  const res = await fetch(`/api/projects/${projectId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error);
  return result;
}

function satangToBaht(satang: number): string {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

const typeLabels: Record<string, string> = {
  REVENUE: 'รายได้',
  EXPENSE: 'ค่าใช้จ่าย',
  TIME_COST: 'ค่าแรง',
};

const typeColors: Record<string, string> = {
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-red-100 text-red-800',
  TIME_COST: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'EXPENSE',
    amount: 0,
    description: '',
    date: new Date().toISOString(),
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => createTransaction(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsOpen(false);
      setFormData({ type: 'EXPENSE', amount: 0, description: '', date: new Date().toISOString() });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  if (!project) {
    return <div className="p-6 text-center">ไม่พบโปรเจกต์</div>;
  }

  const profitPercent = project.summary.totalRevenue > 0
    ? Math.round((project.summary.profit / project.summary.totalRevenue) * 10000) / 100
    : 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.code} | {project.customer?.name || 'ไม่ระบุลูกค้า'}
          </p>
        </div>
        <Badge className="ml-auto">{statusLabels[project.status]}</Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">รายได้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ฿{satangToBaht(project.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ค่าใช้จ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ฿{satangToBaht(project.summary.totalExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${project.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ฿{satangToBaht(project.summary.profit)} ({profitPercent}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">งบประมาณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>รายได้: {project.budgetRevenue ? `${satangToBaht(project.budgetRevenue)} (${Math.round((project.summary.totalRevenue / project.budgetRevenue) * 100)}%)` : '-'}</div>
              <div>ค่าใช้จ่าย: {project.budgetCost ? `${satangToBaht(project.budgetCost)} (${Math.round((project.summary.totalExpense / project.budgetCost) * 100)}%)` : '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>รายการธุรกรรม</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มรายการธุรกรรม</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ประเภท</label>
                  <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVENUE">รายได้</SelectItem>
                      <SelectItem value="EXPENSE">ค่าใช้จ่าย</SelectItem>
                      <SelectItem value="TIME_COST">ค่าแรง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">จำนวนเงิน (บาท)</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">รายละเอียด</label>
                  <Input
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="รายละเอียดเพิ่มเติม"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">วันที่</label>
                  <Input
                    type="datetime-local"
                    value={formData.date.slice(0, 16)}
                    onChange={e => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {project.transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ไม่มีรายการธุรกรรม</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[tx.type]}>{typeLabels[tx.type]}</Badge>
                    </TableCell>
                    <TableCell>{tx.description || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'REVENUE' ? '+' : '-'}฿{satangToBaht(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
