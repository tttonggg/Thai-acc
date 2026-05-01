'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface ApproverConfig {
  id: string;
  documentType: string;
  condition: string | null;
  approverType: 'ROLE' | 'USER' | 'DEPARTMENT_HEAD' | 'CHAIN';
  approverId: string | null;
  approverDepartmentId: string | null;
  approvalOrder: number;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

const DOCUMENT_TYPES = [
  'PURCHASE_REQUEST',
  'PURCHASE_ORDER',
  'INVOICE',
  'RECEIPT',
  'JOURNAL_ENTRY',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
];

export function ApproverConfig() {
  const [configs, setConfigs] = useState<ApproverConfig[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { hasPermission } = useAuthStore();

  const canManage = hasPermission('admin', 'manage');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [configsRes, rolesRes, deptsRes] = await Promise.all([
        fetch('/api/admin/approver-config'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/departments'),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.data || []);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.data || []);
      }
      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function createConfig(formData: Partial<ApproverConfig>) {
    try {
      const res = await fetch('/api/admin/approver-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await loadData();
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm('ยืนยันการลบ?')) return;
    try {
      const res = await fetch(`/api/admin/approver-config?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
  }

  // Group configs by document type
  const configsByType = DOCUMENT_TYPES.reduce(
    (acc, type) => {
      acc[type] = configs.filter((c) => c.documentType === type);
      return acc;
    },
    {} as Record<string, ApproverConfig[]>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ตั้งค่าผู้อนุมัติ (Approver Configuration)</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showForm ? 'ยกเลิก' : '+ เพิ่มการตั้งค่า'}
          </button>
        )}
      </div>

      {!canManage && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">คุณไม่มีสิทธิ์ในการจัดการผู้อนุมัติ</p>
        </div>
      )}

      {showForm && canManage && (
        <ApproverConfigForm
          roles={roles}
          departments={departments}
          documentTypes={DOCUMENT_TYPES}
          onSubmit={createConfig}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Configurations by Document Type */}
      <div className="space-y-6">
        {DOCUMENT_TYPES.map((docType) => (
          <div key={docType} className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">{docType.replace('_', ' ')}</h2>
            {configsByType[docType].length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีการตั้งค่า</p>
            ) : (
              <div className="space-y-2">
                {configsByType[docType].map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">ลำดับ {config.approvalOrder}</span>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {config.approverType}
                      </span>
                      {config.approverId && (
                        <span className="text-sm text-gray-600">
                          {roles.find((r) => r.id === config.approverId)?.name || config.approverId}
                        </span>
                      )}
                      {config.approverDepartmentId && (
                        <span className="text-sm text-gray-600">
                          {departments.find((d) => d.id === config.approverDepartmentId)?.name ||
                            config.approverDepartmentId}
                        </span>
                      )}
                      {config.condition && (
                        <span className="text-xs text-gray-500">เงื่อนไข: {config.condition}</span>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => deleteConfig(config.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ApproverConfigFormProps {
  roles: Role[];
  departments: Department[];
  documentTypes: string[];
  onSubmit: (data: Partial<ApproverConfig>) => void;
  onCancel: () => void;
}

function ApproverConfigForm({
  roles,
  departments,
  documentTypes,
  onSubmit,
  onCancel,
}: ApproverConfigFormProps) {
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [approverType, setApproverType] = useState<ApproverConfig['approverType']>('ROLE');
  const [approverId, setApproverId] = useState('');
  const [approverDepartmentId, setApproverDepartmentId] = useState('');
  const [approvalOrder, setApprovalOrder] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      documentType,
      approverType,
      approverId: approverId || null,
      approverDepartmentId: approverDepartmentId || null,
      approvalOrder,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">ประเภทเอกสาร</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full rounded border p-2"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ลำดับการอนุมัติ</label>
          <input
            type="number"
            value={approvalOrder}
            onChange={(e) => setApprovalOrder(parseInt(e.target.value) || 1)}
            min={1}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ประเภทผู้อนุมัติ</label>
          <select
            value={approverType}
            onChange={(e) => setApproverType(e.target.value as ApproverConfig['approverType'])}
            className="w-full rounded border p-2"
          >
            <option value="ROLE">ตามบทบาท (Role)</option>
            <option value="USER">ตามผู้ใช้ (User)</option>
            <option value="DEPARTMENT_HEAD">หัวหน้าแผนก</option>
            <option value="CHAIN">ลำดับการอนุมัติ</option>
          </select>
        </div>
        {approverType === 'ROLE' && (
          <div>
            <label className="mb-1 block text-sm font-medium">บทบาท</label>
            <select
              value={approverId}
              onChange={(e) => setApproverId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">-- เลือกบทบาท --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {approverType === 'DEPARTMENT_HEAD' && (
          <div>
            <label className="mb-1 block text-sm font-medium">แผนก</label>
            <select
              value={approverDepartmentId}
              onChange={(e) => setApproverDepartmentId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">-- เลือกแผนก --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-gray-600 hover:bg-gray-200"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          บันทึก
        </button>
      </div>
    </form>
  );
}
