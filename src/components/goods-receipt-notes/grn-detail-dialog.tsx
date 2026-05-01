'use client';

import { useState, useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Loader2,
  FileText,
  Printer,
  Download,
  Package,
  AlertCircle,
  CheckCircle2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatThaiDate, formatCurrency } from '@/lib/thai-accounting';

interface GRNLine {
  id: string;
  lineNo: number;
  productId?: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  amount: number;
  product?: {
    code: string;
    name: string;
  };
}

interface GoodsReceiptNote {
  id: string;
  grnNo: string;
  orderNo: string;
  orderDate: string;
  receivedDate: string;
  vendor: {
    code: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  status: 'RECEIVED' | 'INSPECTED' | 'POSTED' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  lines: GRNLine[];
  purchaseInvoices?: Array<{
    invoiceNo: string;
    invoiceDate: string;
    totalAmount: number;
  }>;
  journalEntry?: {
    entryNo: string;
    status: string;
  };
}

interface GRNDetailDialogProps {
  grnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

const statusLabels: Record<string, string> = {
  RECEIVED: 'รับสินค้าแล้ว',
  INSPECTED: 'ตรวจสอบแล้ว',
  POSTED: 'ลงบัญชีแล้ว',
  CANCELLED: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  INSPECTED: 'bg-yellow-100 text-yellow-800',
  POSTED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function GRNDetailDialog({ grnId, open, onOpenChange, onEdit }: GRNDetailDialogProps) {
  const [grn, setGRN] = useState<GoodsReceiptNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && grnId) {
      fetchGRN();
    }
  }, [open, grnId]);

  const fetchGRN = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grn/${grnId}`, { credentials: 'include' });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลใบรับสินค้าได้');
      }

      setGRN(result.data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const calculateVariance = (orderedQty: number, receivedQty: number): number => {
    return receivedQty - orderedQty;
  };

  const getVarianceBadge = (orderedQty: number, receivedQty: number) => {
    const variance = calculateVariance(orderedQty, receivedQty);

    if (variance === 0) {
      return (
        <Badge variant="outline" className="border-green-600 text-green-600">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          ครบถ้วน
        </Badge>
      );
    }

    if (variance > 0) {
      return (
        <Badge variant="outline" className="border-orange-600 text-orange-600">
          <AlertCircle className="mr-1 h-3 w-3" />
          รับเกิน (+{variance.toLocaleString()})
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-red-600 text-red-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        รับขาด ({variance.toLocaleString()})
      </Badge>
    );
  };

  const handlePrint = () => {
    if (!grn) return;

    setPrinting(true);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'ไม่สามารถเปิดหน้าต่างได้',
        description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
        variant: 'destructive',
      });
      setPrinting(false);
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบรับสินค้า - ${grn.grnNo}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-block { flex: 1; }
          .info-block p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; border-top: 2px solid #333; padding-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .summary-row.total { font-weight: bold; font-size: 18px; }
          .variance { font-size: 12px; margin-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบรับสินค้า (Goods Receipt Note)</h1>
          <p>เลขที่: ${grn.grnNo}</p>
          <p>วันที่รับสินค้า: ${formatThaiDate(grn.receivedDate)}</p>
          <p>สถานะ: ${statusLabels[grn.status]}</p>
        </div>

        <div class="info">
          <div class="info-block">
            <p><strong>ผู้ขาย:</strong></p>
            <p>${grn.vendor.name}</p>
            <p>${grn.vendor.taxId || ''}</p>
            <p>${grn.vendor.address || ''}</p>
          </div>
          <div class="info-block">
            <p><strong>เลขที่ PO:</strong> ${grn.orderNo}</p>
            <p><strong>วันที่สั่งซื้อ:</strong> ${formatThaiDate(grn.orderDate)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการ</th>
              <th class="text-right">สั่งซื้อ</th>
              <th class="text-right">รับจริง</th>
              <th class="text-right">หน่วย</th>
              <th class="text-right">ราคา/หน่วย</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${grn.lines
              .map((line, index) => {
                const variance = calculateVariance(line.orderedQty, line.receivedQty);
                return `
              <tr>
                <td>${index + 1}</td>
                <td>
                  ${line.description}
                  ${line.product ? `<br><small>${line.product.code} - ${line.product.name}</small>` : ''}
                  ${variance !== 0 ? `<div class="variance">ผลต่าง: ${variance > 0 ? '+' : ''}${variance.toLocaleString()}</div>` : ''}
                </td>
                <td class="text-right">${line.orderedQty.toLocaleString()}</td>
                <td class="text-right">${line.receivedQty.toLocaleString()}</td>
                <td>${line.unit}</td>
                <td class="text-right">${formatCurrency(line.unitPrice)}</td>
                <td class="text-right">${formatCurrency(line.amount)}</td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>มูลค่าก่อน VAT</span>
            <span>${formatCurrency(grn.subtotal)}</span>
          </div>
          ${
            grn.discountAmount > 0
              ? `
          <div class="summary-row">
            <span>ส่วนลด</span>
            <span>-${formatCurrency(grn.discountAmount)}</span>
          </div>
          `
              : ''
          }
          <div class="summary-row">
            <span>VAT (${grn.vatRate}%)</span>
            <span>${formatCurrency(grn.vatAmount)}</span>
          </div>
          <div class="summary-row total">
            <span>ยอดรวมสุทธิ</span>
            <span>${formatCurrency(grn.totalAmount)}</span>
          </div>
        </div>

        ${grn.notes ? `<p style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${grn.notes}</p>` : ''}

        <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => setPrinting(false), 1000);
  };

  const handleDownload = async () => {
    try {
      toast({
        title: 'กำลังดาวน์โหลด',
        description: 'กำลังสร้างไฟล์ PDF...',
      });
      handlePrint();
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-5xl">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบรับสินค้า</DialogTitle>
            <DialogDescription>กำลังดึงข้อมูลใบรับสินค้าจากระบบ</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !grn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบรับสินค้า</DialogTitle>
            <DialogDescription>ไม่สามารถดึงข้อมูลใบรับสินค้าได้ กรุณาลองใหม่</DialogDescription>
          </VisuallyHidden>
          <div className="py-12 text-center text-red-600">
            เกิดข้อผิดพลาด: {error || 'ไม่พบข้อมูล'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-6xl print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5" />
                ใบรับสินค้า (GRN) - {grn.grnNo}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={statusColors[grn.status]}>{statusLabels[grn.status]}</Badge>
                {grn.journalEntry && (
                  <Badge variant="outline">บันทึกบัญชี: {grn.journalEntry.entryNo}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && grn.status !== 'POSTED' && grn.status !== 'CANCELLED' && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  แก้ไข
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={printing}>
                {printing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                ดาวน์โหลด
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={printing}>
                {printing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                พิมพ์
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 print:space-y-4">
          {/* PO Relationship Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                ความสัมพันธ์กับเอกสารอื่น
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">เลขที่ Purchase Order</p>
                  <p className="font-mono font-semibold">{grn.orderNo}</p>
                  <p className="text-xs text-muted-foreground">
                    วันที่สั่งซื้อ: {formatThaiDate(grn.orderDate)}
                  </p>
                </div>
                {grn.purchaseInvoices && grn.purchaseInvoices.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ใบกำกับภาษีซื้อที่เกี่ยวข้อง</p>
                    {grn.purchaseInvoices.map((inv) => (
                      <div key={inv.invoiceNo} className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {inv.invoiceNo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatThaiDate(inv.invoiceDate)} - {formatCurrency(inv.totalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ข้อมูลผู้ขาย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">ชื่อผู้ขาย</p>
                  <p className="text-lg font-semibold">{grn.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{grn.vendor.code}</p>
                  {grn.vendor.taxId && (
                    <p className="mt-1 text-sm">เลขประจำตัวผู้เสียภาษี: {grn.vendor.taxId}</p>
                  )}
                  {grn.vendor.address && (
                    <p className="mt-2 text-sm text-muted-foreground">{grn.vendor.address}</p>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันที่รับสินค้า:</span>
                    <span className="font-medium">{formatThaiDate(grn.receivedDate)}</span>
                  </div>
                  {grn.journalEntry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">บันทึกบัญชี:</span>
                      <span className="font-medium">{grn.journalEntry.entryNo}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการสินค้าที่รับ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">ลำดับ</TableHead>
                      <TableHead>รายการสินค้า</TableHead>
                      <TableHead className="text-right">สั่งซื้อ</TableHead>
                      <TableHead className="text-right">รับจริง</TableHead>
                      <TableHead className="text-right">ผลต่าง</TableHead>
                      <TableHead>หน่วย</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grn.lines.map((line, index) => {
                      const variance = calculateVariance(line.orderedQty, line.receivedQty);
                      return (
                        <TableRow key={line.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.product && (
                                <p className="text-xs text-muted-foreground">
                                  {line.product.code} - {line.product.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {line.orderedQty.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {line.receivedQty.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {getVarianceBadge(line.orderedQty, line.receivedQty)}
                          </TableCell>
                          <TableCell>{line.unit}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.vatRate > 0 ? `${line.vatRate}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(line.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <div className="w-full space-y-2 md:w-1/2">
                  <div className="flex justify-between text-sm">
                    <span>มูลค่าก่อน VAT</span>
                    <span>{formatCurrency(grn.subtotal)}</span>
                  </div>

                  {grn.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>ส่วนลด</span>
                      <span>-{formatCurrency(grn.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>ยอดหลังหักส่วนลด</span>
                    <span>{formatCurrency(grn.subtotal - grn.discountAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span>VAT ({grn.vatRate > 0 ? `${grn.vatRate}%` : '0%'})</span>
                    <span>{formatCurrency(grn.vatAmount)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-blue-600">{formatCurrency(grn.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {grn.notes && (
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="mb-1 text-sm font-medium">หมายเหตุ</p>
                  <p className="text-sm text-muted-foreground">{grn.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {grn.status === 'INSPECTED' && (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">สร้างใบกำกับภาษีซื้อ</p>
                    <p className="text-sm text-muted-foreground">
                      สร้างใบกำกับภาษีซื้อจากใบรับสินค้านี้
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Navigate to create purchase invoice
                      window.location.href = `/purchases/new?grnId=${grn.id}`;
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    สร้างใบกำกับภาษีซื้อ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground print:hidden">
            <Separator className="mb-4" />
            <p>พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
