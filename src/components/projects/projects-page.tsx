'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  customer?: { id: string; code: string; name: string };
  budgetRevenue?: number;
  budgetCost?: number;
  _count?: { transactions: number };
}

interface ProjectFormData {
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  customerId?: string;
  budgetRevenue?: number;
  budgetCost?: number;
  startDate?: string;
  endDate?: string;
}

async function fetchProjects(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  const res = await fetch(`/api/projects?${params}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

async function createProject(data: ProjectFormData) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error);
  return result;
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  const result = await res.json();
  if (!result.success) throw new Error(result.error);
  return result;
}

function satangToBaht(satang: number): string {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, status],
    queryFn: () => fetchProjects(search, status),
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', status: 'ACTIVE' });
    setEditingProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const projects: Project[] = data?.data || [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">โปรเจกต์ / Project Costing</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มโปรเจกต์ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'แก้ไขโปรเจกต์' : 'เพิ่มโปรเจกต์ใหม่'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">รหัสโปรเจกต์</label>
                <Input
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="PRJ-001"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">ชื่อโปรเจกต์</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="โปรเจกต์ก่อสร้างอาคาร B"
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
                <label className="text-sm font-medium">สถานะ</label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                    <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">งบประมาณรายได้ (บาท)</label>
                  <Input
                    type="number"
                    value={formData.budgetRevenue || ''}
                    onChange={e => setFormData({ ...formData, budgetRevenue: parseInt(e.target.value) || undefined })}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">งบประมาณค่าใช้จ่าย (บาท)</label>
                  <Input
                    type="number"
                    value={formData.budgetCost || ''}
                    onChange={e => setFormData({ ...formData, budgetCost: parseInt(e.target.value) || undefined })}
                    placeholder="300000"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารหัสหรือชื่อโปรเจกต์..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="ACTIVE">กำลังดำเนินการ</SelectItem>
                <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="ไม่พบโปรเจกต์"
              description="เริ่มต้นสร้างโปรเจกต์เพื่อติดตามงานและรายได้"
              action={{ label: 'สร้างโปรเจกต์', onClick: () => {} }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อโปรเจกต์</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">งบประมาณรายได้</TableHead>
                  <TableHead className="text-right">งบประมาณค่าใช้จ่าย</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono text-sm">{project.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {project.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{project.customer?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {project.budgetRevenue ? `฿${satangToBaht(project.budgetRevenue)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {project.budgetCost ? `฿${satangToBaht(project.budgetCost)}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {project._count?.transactions || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`#project-${project.id}`}>
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(project.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
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
