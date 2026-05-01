'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Building2, Calendar } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface DebitNoteViewDialogProps {
  debitNoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DebitNoteDetail {
  id: string;
  debitNoteNo: string;
  debitNoteDate: string;
  vendor: {
    id: string;
    code: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  purchaseInvoice?: {
    id: string;
    invoiceNo: string;
  };
  reason: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  notes?: string;
  journalEntry?: {
    id: string;
    entryNo: string;
    lines: Array<{
      lineNo: number;
      account: { code: string; name: string };
      description: string;
      debit: number;
      credit: number;
    }>;
  };
  createdAt: string;
}

const reasonLabels: Record<string, string> = {
  ADDITIONAL_CHARGES: 'ค่าใช้จ่ายเพิ่มเติม',
  RETURNED_GOODS: 'สินค้าที่คืน',
  PRICE_ADJUSTMENT: 'ปรับปรุงราคา',
};

const statusColors: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  ISSUED: 'ออกแล้ว',
  CANCELLED: 'ยกเลิก',
};

export function DebitNoteViewDialog({ debitNoteId, open, onOpenChange }: DebitNoteViewDialogProps) {
  const [debitNote, setDebitNote] = useState<DebitNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebitNote = async () => {
      if (!open || !debitNoteId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/debit-notes/${debitNoteId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDebitNote(data.data || data);
      } catch (error) {
        console.error('Failed to fetch debit note:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDebitNote();
  }, [open, debitNoteId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-4xl">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบเพิ่มหนี้</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!debitNote) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-4xl">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบเพิ่มหนี้</DialogTitle>
          </VisuallyHidden>
          <div className="py-12 text-center text-gray-500">ไม่พบข้อมูลใบเพิ่มหนี้</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>รายละเอียดใบเพิ่มหนี้</span>
            <Badge className={statusColors[debitNote.status]}>
              {statusLabels[debitNote.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            ดูรายละเอียดใบเพิ่มหนี้ทั้งหมดรวมทั้งข้อมูลผู้จัดจำหน่าย บัญชี และบันทึกบัญชี
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{debitNote.debitNoteNo}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    วันที่ออก: {formatDate(debitNote.debitNoteDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-600">
                    +฿
                    {(debitNote.totalAmount / 100).toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">ยอดรวม</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  ข้อมูลผู้ขาย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">รหัสผู้ขาย</p>
                  <p className="font-medium">{debitNote.vendor.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ชื่อผู้ขาย</p>
                  <p className="font-medium">{debitNote.vendor.name}</p>
                </div>
                {debitNote.vendor.taxId && (
                  <div>
                    <p className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี</p>
                    <p className="font-medium">{debitNote.vendor.taxId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  เอกสารอ้างอิง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">เหตุผล</p>
                  <p className="font-medium">
                    {reasonLabels[debitNote.reason] || debitNote.reason}
                  </p>
                </div>
                {debitNote.purchaseInvoice && (
                  <div>
                    <p className="text-sm text-gray-500">อ้างอิงใบซื้อ</p>
                    <p className="font-medium">{debitNote.purchaseInvoice.invoiceNo}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">สถานะ</p>
                  <Badge className={statusColors[debitNote.status]}>
                    {statusLabels[debitNote.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุปยอด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">มูลค่าก่อน VAT:</span>
                <span className="font-medium">
                  ฿
                  {(debitNote.subtotal / 100).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">อัตรา VAT:</span>
                <span className="font-medium">{debitNote.vatRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT:</span>
                <span className="font-medium">
                  ฿
                  {(debitNote.vatAmount / 100).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดรวม:</span>
                <span className="text-orange-600">
                  +฿
                  {(debitNote.totalAmount / 100).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {debitNote.journalEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  บันทึกบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">เลขที่บันทึกบัญชี</p>
                  <p className="font-mono font-medium">{debitNote.journalEntry.entryNo}</p>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">บัญชี</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">รายการ</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">เดบิต</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">เครดิต</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {debitNote.journalEntry.lines.map((line) => (
                        <tr key={line.lineNo}>
                          <td className="px-4 py-2 text-sm">
                            {line.account.code} - {line.account.name}
                          </td>
                          <td className="px-4 py-2 text-sm">{line.description}</td>
                          <td className="px-4 py-2 text-right text-sm">
                            {line.debit > 0
                              ? `฿${(line.debit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {line.credit > 0
                              ? `฿${(line.credit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right text-sm font-medium">
                          รวม:
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          ฿
                          {(
                            debitNote.journalEntry.lines.reduce((sum, l) => sum + l.debit, 0) / 100
                          ).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          ฿
                          {(
                            debitNote.journalEntry.lines.reduce((sum, l) => sum + l.credit, 0) / 100
                          ).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {debitNote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">หมายเหตุ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{debitNote.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-gray-500">
            สร้างเมื่อ {formatDate(debitNote.createdAt)}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
