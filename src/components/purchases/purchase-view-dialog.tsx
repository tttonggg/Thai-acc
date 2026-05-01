'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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

interface PurchaseLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
  product?: {
    code: string;
    name: string;
  };
}

interface Purchase {
  id: string;
  invoiceNo: string;
  vendorInvoiceNo?: string;
  invoiceDate: string;
  dueDate?: string;
  vendor: {
    code: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE';
  status: 'DRAFT' | 'ISSUED' | 'POSTED' | 'PAID' | 'CANCELLED';
  reference?: string;
  poNumber?: string;
  subtotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  netAmount: number;
  paidAmount: number;
  notes?: string;
  internalNotes?: string;
  lines: PurchaseLine[];
  journalEntryId?: string;
  journalEntry?: {
    entryNo: string;
    status: string;
  };
  payments?: Array<{
    paymentNo: string;
    paymentDate: string;
    amount: number;
  }>;
}

interface PurchaseViewDialogProps {
  purchaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const purchaseTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  POSTED: 'ลงบัญชีแล้ว',
  PAID: 'จ่ายแล้ว',
  CANCELLED: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  POSTED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function PurchaseViewDialog({ purchaseId, open, onOpenChange }: PurchaseViewDialogProps) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && purchaseId) {
      fetchPurchase();
    }
  }, [open, purchaseId]);

  const fetchPurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, { credentials: 'include' });

      // Handle non-OK responses with error JSON
      if (!res.ok) {
        let errorMessage = 'ไม่สามารถดึงข้อมูลใบซื้อได้';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse failed, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      setPurchase(result.data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    if (!purchase) return;

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
        <title>${purchaseTypeLabels[purchase.type]} - ${purchase.invoiceNo}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
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
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${purchaseTypeLabels[purchase.type]}</h1>
          <p>เลขที่: ${purchase.invoiceNo}</p>
          <p>วันที่: ${formatDate(purchase.invoiceDate)}</p>
          ${purchase.vendorInvoiceNo ? `<p>เลขที่ใบกำกับภาษีผู้ขาย: ${purchase.vendorInvoiceNo}</p>` : ''}
          <p>สถานะ: ${statusLabels[purchase.status]}</p>
        </div>
        
        <div class="info">
          <div class="info-block">
            <p><strong>ผู้ขาย:</strong></p>
            <p>${purchase.vendor.name}</p>
            <p>${purchase.vendor.taxId || ''}</p>
            <p>${purchase.vendor.address || ''}</p>
          </div>
          <div class="info-block">
            <p><strong>วันครบกำหนด:</strong> ${purchase.dueDate ? formatDate(purchase.dueDate) : '-'}</p>
            ${purchase.reference ? `<p><strong>อ้างอิง:</strong> ${purchase.reference}</p>` : ''}
            ${purchase.poNumber ? `<p><strong>เลขที่ PO:</strong> ${purchase.poNumber}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการ</th>
              <th class="text-right">จำนวน</th>
              <th class="text-right">ราคา/หน่วย</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${purchase.lines
              .map(
                (line, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${line.description}</td>
                <td class="text-right">${line.quantity} ${line.unit}</td>
                <td class="text-right">${formatCurrency(line.unitPrice)}</td>
                <td class="text-right">${formatCurrency(line.amount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>มูลค่าก่อน VAT</span>
            <span>${formatCurrency(purchase.subtotal)}</span>
          </div>
          ${
            purchase.discountAmount > 0
              ? `
          <div class="summary-row">
            <span>ส่วนลด</span>
            <span>-${formatCurrency(purchase.discountAmount)}</span>
          </div>
          `
              : ''
          }
          <div class="summary-row">
            <span>VAT (${purchase.vatRate}%)</span>
            <span>${formatCurrency(purchase.vatAmount)}</span>
          </div>
          <div class="summary-row total">
            <span>ยอดรวมสุทธิ</span>
            <span>${formatCurrency(purchase.totalAmount)}</span>
          </div>
          ${
            purchase.withholdingAmount > 0
              ? `
          <div class="summary-row">
            <span>หัก ณ ที่จ่าย (${purchase.withholdingRate}%)</span>
            <span>-${formatCurrency(purchase.withholdingAmount)}</span>
          </div>
          <div class="summary-row">
            <span>ยอดสุทธิหลังหัก ณ ที่จ่าย</span>
            <span>${formatCurrency(purchase.netAmount)}</span>
          </div>
          `
              : ''
          }
        </div>

        ${purchase.notes ? `<p style="margin-top: 20px;"><strong>หมายเหตุ:</strong> ${purchase.notes}</p>` : ''}

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
      // In production, this would call a PDF generation endpoint
      // For now, just print
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
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-4xl">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบซื้อ</DialogTitle>
            <DialogDescription>กำลังดึงข้อมูลใบซื้อจากระบบ</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !purchase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบซื้อ</DialogTitle>
            <DialogDescription>ไม่สามารถดึงข้อมูลใบซื้อได้ กรุณาลองใหม่</DialogDescription>
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
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-5xl print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                ดู{purchaseTypeLabels[purchase.type]} - {purchase.invoiceNo}
              </DialogTitle>
              {purchase.vendorInvoiceNo && (
                <p className="mt-1 text-sm text-muted-foreground">
                  เลขที่ใบกำกับภาษีผู้ขาย: {purchase.vendorInvoiceNo}
                </p>
              )}
            </div>
            <div className="flex gap-2">
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
          <div className="mt-2 flex items-center gap-2">
            <Badge className={statusColors[purchase.status]}>{statusLabels[purchase.status]}</Badge>
            {purchase.journalEntry && (
              <Badge variant="outline">บันทึกบัญชี: {purchase.journalEntry.entryNo}</Badge>
            )}
          </div>
        </DialogHeader>

        {/* Print Content */}
        <div className="space-y-6 print:space-y-4" id="purchase-content">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">{purchaseTypeLabels[purchase.type]}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{purchase.invoiceNo}</p>
              {purchase.vendorInvoiceNo && (
                <p className="mt-1 text-sm text-muted-foreground">
                  เลขที่ใบกำกับภาษีผู้ขาย: {purchase.vendorInvoiceNo}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="mb-2 flex items-center justify-end gap-2">
                <Badge className={statusColors[purchase.status]}>
                  {statusLabels[purchase.status]}
                </Badge>
              </div>
              <p className="text-sm">วันที่: {formatDate(purchase.invoiceDate)}</p>
              {purchase.dueDate && (
                <p className="text-sm">วันครบกำหนด: {formatDate(purchase.dueDate)}</p>
              )}
            </div>
          </div>

          {/* Vendor Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">ผู้ขาย</p>
                  <p className="text-lg font-semibold">{purchase.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{purchase.vendor.code}</p>
                  {purchase.vendor.taxId && (
                    <p className="text-sm">เลขประจำตัวผู้เสียภาษี: {purchase.vendor.taxId}</p>
                  )}
                  {purchase.vendor.address && (
                    <p className="mt-2 text-sm">{purchase.vendor.address}</p>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {purchase.reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เลขที่อ้างอิง:</span>
                      <span className="font-medium">{purchase.reference}</span>
                    </div>
                  )}
                  {purchase.poNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เลขที่ PO:</span>
                      <span className="font-medium">{purchase.poNumber}</span>
                    </div>
                  )}
                  {purchase.journalEntry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">บันทึกบัญชี:</span>
                      <span className="font-medium">{purchase.journalEntry.entryNo}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการสินค้า/บริการ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">ลำดับ</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead>หน่วย</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="text-right">ส่วนลด</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.lines.map((line, index) => (
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
                      <TableCell className="text-right">{line.quantity.toLocaleString()}</TableCell>
                      <TableCell>{line.unit}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                      <TableCell className="text-right">
                        {line.discount > 0 ? `${line.discount}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.vatRate > 0 ? `${line.vatRate}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <div className="w-full space-y-2 md:w-1/2">
                  <div className="flex justify-between text-sm">
                    <span>มูลค่าก่อน VAT</span>
                    <span>{formatCurrency(purchase.subtotal)}</span>
                  </div>

                  {purchase.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>ส่วนลด</span>
                      <span>-{formatCurrency(purchase.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>ยอดหลังหักส่วนลด</span>
                    <span>{formatCurrency(purchase.subtotal - purchase.discountAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span>VAT ({purchase.vatRate > 0 ? `${purchase.vatRate}%` : '0%'})</span>
                    <span>{formatCurrency(purchase.vatAmount)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-blue-600">{formatCurrency(purchase.totalAmount)}</span>
                  </div>

                  {purchase.withholdingRate > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>หัก ณ ที่จ่าย ({purchase.withholdingRate}%)</span>
                        <span>-{formatCurrency(purchase.withholdingAmount)}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold">
                        <span>ยอดสุทธิหลังหัก ณ ที่จ่าย</span>
                        <span className="text-green-600">{formatCurrency(purchase.netAmount)}</span>
                      </div>
                    </>
                  )}

                  {purchase.paidAmount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>จ่ายแล้ว</span>
                        <span className="text-green-600">
                          -{formatCurrency(purchase.paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-semibold">
                        <span>ค้างจ่าย</span>
                        <span className="text-orange-600">
                          {formatCurrency(purchase.totalAmount - purchase.paidAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(purchase.notes || purchase.internalNotes) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {purchase.notes && (
                    <div>
                      <p className="mb-1 text-sm font-medium">หมายเหตุ</p>
                      <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                    </div>
                  )}
                  {purchase.internalNotes && (
                    <div>
                      <p className="mb-1 text-sm font-medium">หมายเหตุภายใน</p>
                      <p className="text-sm text-muted-foreground">{purchase.internalNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          {purchase.payments && purchase.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ประวัติการจ่ายเงิน</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่ใบจ่าย</TableHead>
                      <TableHead>วันที่จ่าย</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.payments.map((payment) => (
                      <TableRow key={payment.paymentNo}>
                        <TableCell className="font-mono">{payment.paymentNo}</TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">
                        รวมทั้งหมด
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(purchase.payments.reduce((sum, p) => sum + p.amount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground print:hidden">
            <Separator className="mb-4" />
            <p>สร้างเมื่อ {new Date().toLocaleString('th-TH')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
