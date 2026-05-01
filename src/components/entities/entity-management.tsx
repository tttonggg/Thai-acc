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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Plus, RefreshCw, GitCompare, FileSpreadsheet } from 'lucide-react';

interface Entity {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  taxId?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export function EntityManagement() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [newEntity, setNewEntity] = useState({ code: '', name: '', nameEn: '', taxId: '' });

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const res = await fetch(`/api/entities`, { credentials: 'include' });
      const data = await res.json();
      if (data.entities) {
        setEntities(data.entities);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลบริษัทได้');
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entities`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchEntities();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างบริษัทหลัก');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entities`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntity),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('สร้างบริษัทสำเร็จ');
        setCreateDialog(false);
        setNewEntity({ code: '', name: '', nameEn: '', taxId: '' });
        fetchEntities();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างบริษัท');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEliminate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entities`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-eliminate' }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการกำจัดขั้นตอนรวม');
    } finally {
      setLoading(false);
    }
  };

  const handleReconciliationReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entities?report=reconciliation`, { credentials: 'include' });
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              จัดการบริษัทในเครือ
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleInitialize} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                สร้างบริษัทหลัก
              </Button>
              <Button variant="outline" onClick={handleAutoEliminate} disabled={loading}>
                <GitCompare className="mr-2 h-4 w-4" />
                กำจัดอัตโนมัติ
              </Button>
              <Button variant="outline" onClick={handleReconciliationReport} disabled={loading}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                รายงานกระทบยอด
              </Button>
              <Button onClick={() => setCreateDialog(true)} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มบริษัท
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.code}</TableCell>
                  <TableCell>
                    {entity.name}
                    {entity.nameEn && (
                      <div className="text-sm text-muted-foreground">{entity.nameEn}</div>
                    )}
                  </TableCell>
                  <TableCell>{entity.taxId || '-'}</TableCell>
                  <TableCell>
                    {entity.isPrimary && (
                      <Badge variant="default" className="bg-blue-500">
                        บริษัทหลัก
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entity.isActive ? 'default' : 'secondary'}>
                      {entity.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {entities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลบริษัท กรุณาสร้างบริษัทหลัก
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มบริษัทในเครือ</DialogTitle>
            <DialogDescription>กรอกข้อมูลบริษัทใหม่</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>รหัสบริษัท</Label>
              <Input
                value={newEntity.code}
                onChange={(e) => setNewEntity({ ...newEntity, code: e.target.value })}
                placeholder="เช่น SUB-01"
              />
            </div>
            <div>
              <Label>ชื่อบริษัท (ไทย)</Label>
              <Input
                value={newEntity.name}
                onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                placeholder="ชื่อบริษัท"
              />
            </div>
            <div>
              <Label>ชื่อบริษัท (อังกฤษ)</Label>
              <Input
                value={newEntity.nameEn}
                onChange={(e) => setNewEntity({ ...newEntity, nameEn: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div>
              <Label>เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                value={newEntity.taxId}
                onChange={(e) => setNewEntity({ ...newEntity, taxId: e.target.value })}
                placeholder="เลข 13 หลัก"
              />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              สร้างบริษัท
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายงานการกระทบยอดระหว่างบริษัท</DialogTitle>
            <DialogDescription>สรุปรายการระหว่างบริษัทในเครือ</DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">ลูกหนี้รวม</p>
                  <p className="text-lg font-bold">
                    {(report.summary.totalReceivables / 100).toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">เจ้าหนี้รวม</p>
                  <p className="text-lg font-bold">
                    {(report.summary.totalPayables / 100).toLocaleString()} บาท
                  </p>
                </div>
                <div className="rounded bg-muted p-4">
                  <p className="text-sm text-muted-foreground">ยอดค้างกระทบ</p>
                  <p className="text-lg font-bold text-red-600">
                    {(report.summary.unmatchedAmount / 100).toLocaleString()} บาท
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>จากบริษัท</TableHead>
                    <TableHead>ถึงบริษัท</TableHead>
                    <TableHead className="text-right">ยอด A→B</TableHead>
                    <TableHead className="text-right">ยอด B→A</TableHead>
                    <TableHead className="text-right">สุทธิ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.pairs?.map((pair: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{pair.entityA.name}</TableCell>
                      <TableCell>{pair.entityB.name}</TableCell>
                      <TableCell className="text-right">
                        {(pair.aToB / 100).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(pair.bToA / 100).toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right ${pair.net !== 0 ? 'font-bold text-red-600' : ''}`}
                      >
                        {(pair.net / 100).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
