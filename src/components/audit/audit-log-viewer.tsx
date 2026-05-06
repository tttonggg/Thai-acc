'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
  FileText,
  Clock,
  Filter,
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  hash: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  POST: 'bg-purple-500',
  VOID: 'bg-orange-500',
  LOGIN: 'bg-teal-500',
  LOGOUT: 'bg-gray-500',
  LOGIN_FAILED: 'bg-red-600',
  APPROVE: 'bg-green-600',
  REJECT: 'bg-orange-600',
  EXPORT: 'bg-indigo-500',
  IMPORT: 'bg-cyan-500',
  VIEW: 'bg-gray-400',
  MFA_SETUP: 'bg-violet-500',
  MFA_DISABLE: 'bg-yellow-500',
  PASSWORD_RESET: 'bg-pink-500',
  SESSION_TERMINATED: 'bg-gray-600',
  PRIVILEGE_ESCALATION: 'bg-red-700',
};

const ENTITY_ICONS: Record<string, string> = {
  Invoice: '📄',
  Receipt: '🧾',
  Payment: '💳',
  JournalEntry: '📒',
  Customer: '👤',
  Vendor: '🏪',
  User: '👨‍💻',
  Product: '📦',
  SECURITY: '🔒',
  DEFAULT: '📋',
};

function getEntityIcon(type: string) {
  return ENTITY_ICONS[type] || ENTITY_ICONS.DEFAULT;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const limit = 30;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.meta.total);
      } else {
        toast.error(data.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters.action, filters.entityType, filters.startDate, filters.endDate]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        credentials: 'include',
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        const { valid, totalRecords, invalidRecords } = data.data;
        if (valid) {
          toast.success(`✅ ตรวจสอบความสมบูรณ์สำเร็จ: ${totalRecords} รายการ ไม่พบการแก้ไข`);
        } else {
          toast.error(
            `⚠️ พบ ${invalidRecords.length} รายการที่อาจถูกแก้ไขจาก ${totalRecords} รายการทั้งหมด`
          );
        }
      } else {
        toast.error(data.error || 'ไม่สามารถตรวจสอบได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = filters.search
    ? logs.filter(
        (log) =>
          log.userEmail.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.entityId.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.action.toLowerCase().includes(filters.search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / limit);

  const actionOptions = [
    'CREATE', 'UPDATE', 'DELETE', 'POST', 'VOID',
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'VIEW',
    'MFA_SETUP', 'MFA_DISABLE', 'PASSWORD_RESET',
  ];

  const entityOptions = [
    'Invoice', 'Receipt', 'Payment', 'JournalEntry',
    'Customer', 'Vendor', 'User', 'Product', 'SECURITY',
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              บันทึกตรวจสอบระบบ (Audit Trail)
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                ตรวจสอบความสมบูรณ์
              </Button>
              <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="rounded border px-2 py-1 text-sm"
                value={filters.action}
                onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(0); }}
              >
                <option value="">ทุกการกระทำ</option>
                {actionOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select
                className="rounded border px-2 py-1 text-sm"
                value={filters.entityType}
                onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setPage(0); }}
              >
                <option value="">ทุกประเภทเอกสาร</option>
                {entityOptions.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <Input
              placeholder="ค้นหา อีเมล, ID, การกระทำ..."
              className="w-64"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-40"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(0); }}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                className="w-40"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(0); }}
              />
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              {total.toLocaleString()} รายการ
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>วัน/เวลา</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>การกระทำ</TableHead>
                <TableHead>เอกสาร</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <>
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell>
                      <button
                        onClick={() =>
                          setExpandedRow(expandedRow === log.id ? null : log.id)
                        }
                        className="cursor-pointer rounded p-1 hover:bg-muted"
                      >
                        {expandedRow === log.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${ACTION_COLORS[log.action] || 'bg-gray-500'} text-white text-xs`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{getEntityIcon(log.entityType)}</span>
                        <span className="text-sm">{log.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs" title={log.entityId}>
                      {log.entityId}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                  {expandedRow === log.id && (
                    <TableRow key={`${log.id}-detail`} className="bg-muted/30">
                      <TableCell colSpan={7}>
                        <div className="grid grid-cols-2 gap-4 p-2">
                          <div>
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">ก่อนการเปลี่ยนแปลง</p>
                            <pre className="max-h-40 overflow-auto rounded bg-black/5 p-2 text-xs">
                              {log.beforeState
                                ? JSON.stringify(log.beforeState, null, 2)
                                : '(ไม่มี)'}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">หลังการเปลี่ยนแปลง</p>
                            <pre className="max-h-40 overflow-auto rounded bg-black/5 p-2 text-xs">
                              {log.afterState
                                ? JSON.stringify(log.afterState, null, 2)
                                : '(ไม่มี)'}
                            </pre>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 p-2 text-xs text-muted-foreground">
                          <span>Hash: <span className="font-mono">{log.hash.slice(0, 16)}...</span></span>
                          <span>User-Agent: {log.userAgent.slice(0, 60)}...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    ไม่พบรายการ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                หน้า {page + 1} จาก {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
