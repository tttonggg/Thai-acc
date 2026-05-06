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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PiggyBank, Plus, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface Budget {
  id: string;
  year: number;
  accountId: string;
  account: {
    code: string;
    name: string;
    type: string;
  };
  amount: number;
  actual: number;
  variance: number;
  alertAt: number;
  isAlerted: boolean;
  notes?: string;
  alerts: Array<{
    id: string;
    alertType: string;
    message: string;
    triggeredAt: string;
  }>;
}

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportDialog, setReportDialog] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [alertsDialog, setAlertsDialog] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    accountId: '',
    amount: '',
    alertAt: 80,
    notes: '',
  });

  useEffect(() => {
    fetchBudgets();
    fetchAlerts();
  }, [selectedYear]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`/api/budgets?year=${selectedYear}`, { credentials: 'include' });
      const data = await res.json();
      if (data.budgets) {
        setBudgets(data.budgets);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลงบประมาณได้');
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`/api/budgets?alerts=true`, { credentials: 'include' });
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/chart-of-accounts?type=EXPENSE&isDetail=true', { credentials: 'include' });
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const openBudgetDialog = async (budget?: Budget) => {
    await fetchAccounts();
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        year: budget.year,
        accountId: budget.accountId,
        amount: (budget.amount / 100).toString(),
        alertAt: budget.alertAt,
        notes: budget.notes || '',
      });
    } else {
      setEditingBudget(null);
      setFormData({
        year: selectedYear,
        accountId: '',
        amount: '',
        alertAt: 80,
        notes: '',
      });
    }
    setBudgetDialog(true);
  };

  const handleSaveBudget = async () => {
    if (!formData.accountId || !formData.amount) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setFormLoading(true);
    try {
      const satangAmount = Math.round(parseFloat(formData.amount) * 100);
      const res = await fetch('/api/budgets', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: formData.year,
          accountId: formData.accountId,
          amount: satangAmount,
          alertAt: formData.alertAt,
          notes: formData.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingBudget ? 'อัปเดตงบประมาณแล้ว' : 'สร้างงบประมาณแล้ว');
        setBudgetDialog(false);
        fetchBudgets();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('ยืนยันการลบงบประมาณนี้?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('ลบงบประมาณแล้ว');
        fetchBudgets();
      } else {
        toast.error('เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleUpdateActuals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-actuals', year: selectedYear }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchBudgets();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?report=vs-actual&year=${selectedYear}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        setReport(data);
        setReportDialog(true);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/budgets`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge-alert', alertId }),
      });
      if (res.ok) {
        toast.success('รับทราบการแจ้งเตือนแล้ว');
        fetchAlerts();
        fetchBudgets();
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getUsagePercent = (budget: Budget) => {
    return budget.amount > 0 ? (budget.actual / budget.amount) * 100 : 0;
  };

  const getStatusBadge = (budget: Budget) => {
    const usage = getUsagePercent(budget);
    if (usage >= 100) {
      return <Badge variant="destructive">เกินงบ</Badge>;
    } else if (usage >= budget.alertAt) {
      return (
        <Badge variant="default" className="bg-yellow-500">
          ใกล้เต็ม
        </Badge>
      );
    } else if (usage >= 75) {
      return <Badge variant="secondary">ตามแผน</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-500">
        ปกติ
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              จัดการงบประมาณ
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => openBudgetDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มงบประมาณ
              </Button>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded border px-2 py-1"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <Button variant="outline" onClick={handleUpdateActuals} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                อัปเดตยอดจริง
              </Button>
              <Button variant="outline" onClick={handleReport} disabled={loading}>
                <TrendingUp className="mr-2 h-4 w-4" />
                รายงาน
              </Button>
              {alerts.length > 0 && (
                <Button variant="destructive" onClick={() => setAlertsDialog(true)}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  แจ้งเตือน ({alerts.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead>งบประมาณ</TableHead>
                <TableHead>ใช้จริง</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const usage = getUsagePercent(budget);
                return (
                  <TableRow
                    key={budget.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openBudgetDialog(budget)}
                  >
                    <TableCell className="font-medium">{budget.account.code}</TableCell>
                    <TableCell>{budget.account.name}</TableCell>
                    <TableCell>{(budget.amount / 100).toLocaleString()} บาท</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span>{(budget.actual / 100).toLocaleString()} บาท</span>
                        <Progress value={usage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className={budget.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(budget.variance / 100).toLocaleString()} บาท
                    </TableCell>
                    <TableCell>{getStatusBadge(budget)}</TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBudget(budget.id);
                        }}
                        className="cursor-pointer rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {budgets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลงบประมาณ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Budget Dialog */}
      <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'แก้ไขงบประมาณ' : 'เพิ่มงบประมาณ'}
            </DialogTitle>
            <DialogDescription>
              {editingBudget
                ? `แก้ไขงบประมาณ ${editingBudget.account.name}`
                : 'กำหนดวงเงินงบประมาณสำหรับบัญชีค่าใช้จ่าย'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ปีงบประมาณ</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  min={2020}
                  max={2100}
                />
              </div>
              <div className="space-y-2">
                <Label>แจ้งเตือนเมื่อถึง (%)</Label>
                <Input
                  type="number"
                  value={formData.alertAt}
                  onChange={(e) =>
                    setFormData({ ...formData, alertAt: parseInt(e.target.value) })
                  }
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>บัญชีค่าใช้จ่าย</Label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                disabled={!!editingBudget}
              >
                <option value="">-- เลือกบัญชี --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>วงเงินงบประมาณ (บาท)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={2}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBudgetDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveBudget} disabled={formLoading}>
                {formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={alertsDialog} onOpenChange={setAlertsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>การแจ้งเตือนงบประมาณ</DialogTitle>
            <DialogDescription>รายการแจ้งเตือนที่ยังไม่ได้รับทราบ</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between rounded bg-yellow-50 p-3"
              >
                <div>
                  <p className="font-medium">{alert.budget?.account?.name}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.triggeredAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                  รับทราบ
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายงานเปรียบเทียบงบประมาณกับผลการใช้จริง</DialogTitle>
            <DialogDescription>ปี {report?.year}</DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">งบประมาณรวม</p>
                  <p className="text-lg font-bold">
                    {(report.summary.totalBudget / 100).toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">ใช้จริงรวม</p>
                  <p className="text-lg font-bold">
                    {(report.summary.totalActual / 100).toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">เกินงบ</p>
                  <p className="text-lg font-bold text-red-600">
                    {report.summary.overBudgetCount} บัญชี
                  </p>
                </div>
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">เสี่ยงเกินงบ</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {report.summary.criticalCount} บัญชี
                  </p>
                </div>
              </div>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสบัญชี</TableHead>
                    <TableHead>ชื่อบัญชี</TableHead>
                    <TableHead className="text-right">งบประมาณ</TableHead>
                    <TableHead className="text-right">ใช้จริง</TableHead>
                    <TableHead className="text-right">ผลต่าง</TableHead>
                    <TableHead className="text-center">% ใช้ไป</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.accounts.map((acc: any) => {
                    const varianceSign = acc.variance >= 0 ? '+' : '';
                    return (
                      <TableRow key={acc.accountId}>
                        <TableCell className="font-medium">{acc.accountCode}</TableCell>
                        <TableCell>{acc.accountName}</TableCell>
                        <TableCell className="text-right">
                          {(acc.budget / 100).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(acc.actual / 100).toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${acc.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {varianceSign}
                          {(acc.variance / 100).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(acc.usagePercent, 100)}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs text-muted-foreground">
                              {acc.usagePercent.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {acc.status === 'OVER' && (
                            <Badge variant="destructive">เกินงบ</Badge>
                          )}
                          {acc.status === 'CRITICAL' && (
                            <Badge className="bg-orange-500">เสี่ยง</Badge>
                          )}
                          {acc.status === 'ON_TRACK' && (
                            <Badge variant="secondary">ตามแผน</Badge>
                          )}
                          {acc.status === 'UNDER' && (
                            <Badge className="bg-green-500">ปกติ</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
