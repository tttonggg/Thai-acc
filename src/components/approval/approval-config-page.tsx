'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { satangToBaht } from '@/lib/currency';

const DOCUMENT_TYPES = [
  { value: 'PURCHASE_REQUEST', label: 'ใบขอซื้อ (Purchase Request)' },
  { value: 'PURCHASE_ORDER', label: 'ใบสั่งซื้อ (Purchase Order)' },
  { value: 'PAYMENT', label: 'ใบจ่ายเงิน (Payment)' },
  { value: 'INVOICE', label: 'ใบวางบิล (Invoice)' },
];

const ROLES = [
  { value: 'ADMIN', label: 'ผู้ดูแลระบบ (Admin)' },
  { value: 'ACCOUNTANT', label: 'บัญชี (Accountant)' },
  { value: 'MANAGER', label: 'ผู้จัดการ (Manager)' },
  { value: 'USER', label: 'ผู้ใช้งาน (User)' },
];

interface ApprovalConfig {
  id: string;
  documentType: string;
  approvalOrder: number;
  role: { id: string; name: string; displayName: string | null };
}

interface PendingApproval {
  id: string;
  documentType: string;
  documentNo: string;
  status: string;
  estimatedAmount: number;
  reason: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string; email: string };
  department: { id: string; name: string; code: string } | null;
  lineCount: number;
}

export function ApprovalConfigPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ApprovalConfig[]>([]);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formDocType, setFormDocType] = useState('PURCHASE_REQUEST');
  const [formRole, setFormRole] = useState('ADMIN');

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/approval-config', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setConfigs(json.data ?? []);
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดการตั้งค่า', variant: 'destructive' });
    }
  };

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/approvals/pending', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPending(json.data ?? []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    Promise.all([fetchConfigs(), fetchPending()]).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setFormDocType('PURCHASE_REQUEST');
    setFormRole('ADMIN');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/approval-config/${editingId}` : '/api/approval-config';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: formDocType,
          approverRole: formRole,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast({ title: 'บันทึกสำเร็จ', description: 'การตั้งค่าการอนุมัติถูกบันทึกแล้ว' });
      resetForm();
      fetchConfigs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config: ApprovalConfig) => {
    setFormDocType(config.documentType);
    setFormRole(config.role.name);
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบการตั้งค่านี้?')) return;
    try {
      const res = await fetch(`/api/approval-config/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast({ title: 'ลบสำเร็จ' });
      fetchConfigs();
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-requests/${id}/approve`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'อนุมัติเรียบร้อยแล้ว' });
      fetchPending();
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอนุมัติได้', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('ระบุเหตุผลการปฏิเสธ:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/purchase-requests/${id}/reject`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'ปฏิเสธเรียบร้อยแล้ว' });
      fetchPending();
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถปฏิเสธได้', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">การอนุมัติเอกสาร</h1>
        <p className="mt-1 text-gray-500">ตั้งค่ากฎการอนุมัติและดูรายการรออนุมัติ</p>
      </div>

      {/* Approval Queue */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              รายการรออนุมัติ ({pending.length})
            </CardTitle>
            <CardDescription>เอกสารที่รอการอนุมัติจากคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{item.documentNo}</p>
                    <p className="text-sm text-gray-500">
                      {DOCUMENT_TYPES.find((d) => d.value === item.documentType)?.label ?? item.documentType}
                    </p>
                    <p className="text-sm text-gray-400">
                      {item.requestedBy.name} · {new Date(item.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">฿{satangToBaht(item.estimatedAmount).toLocaleString('th-TH')}</p>
                    <div className="mt-2 flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="mr-1 h-4 w-4" /> อนุมัติ
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(item.id)}>
                        <XCircle className="mr-1 h-4 w-4" /> ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Config Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>กฎการอนุมัติ</CardTitle>
              <CardDescription>กำหนดลำดับการอนุมัติตามประเภทเอกสาร</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> เพิ่มกฎ
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>ประเภทเอกสาร</Label>
                  <Select value={formDocType} onValueChange={setFormDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>บทบาทผู้อนุมัติ</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'บันทึก' : 'เพิ่ม'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          )}

          {configs.length === 0 && !showForm ? (
            <p className="text-gray-400 py-4">ยังไม่มีการตั้งค่าการอนุมัติ</p>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      {DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? config.documentType}
                    </p>
                    <p className="text-sm text-gray-500">
                      ลำดับที่ {config.approvalOrder} · ผู้อนุมัติ: {config.role.displayName ?? config.role.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
