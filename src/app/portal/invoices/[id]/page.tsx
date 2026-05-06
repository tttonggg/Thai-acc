'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { formatThaiDate } from '@/lib/thai-accounting';
import { satangToBaht } from '@/lib/currency';
import { StatusBadge } from '@/lib/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  Hash,
  DollarSign,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

interface InvoiceLine {
  id: string;
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  product?: { name: string; sku?: string } | null;
}

interface ReceiptAllocation {
  id: string;
  amount: number;
  receipt: {
    id: string;
    receiptNo: string;
    receiptDate: string;
    bankAccount?: { bankName: string; accountNo: string } | null;
  };
}

interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  netAmount: number;
  paidAmount: number;
  discountAmount: number;
  withholdingAmount: number;
  balance: number;
  notes?: string;
  lines: InvoiceLine[];
  receiptAllocations: ReceiptAllocation[];
  currency?: { code: string; symbol: string } | null;
}

function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PortalInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = usePortalAuthStore();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}`, {
        headers: { 'x-customer-id': user?.customerId ?? '' },
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error('ไม่พบใบกำกับภาษีนี้');
        throw new Error('ดึงข้อมูลไม่สำเร็จ');
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'เกิดข้อผิดพลาด');
      setInvoice(data.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, user?.customerId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? 'ไม่พบข้อมูล'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isOverdue = invoice.status === 'ISSUED' && new Date(invoice.dueDate) < new Date();
  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/portal/invoices')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการใบกำกับภาษี
        </Button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNo}</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={invoice.status} />
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <AlertCircle className="h-3 w-3" />
                    เกินกำหนด
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                ข้อมูลใบกำกับภาษี
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">เลขที่ใบกำกับ</p>
                  <p className="font-medium">{invoice.invoiceNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">วันที่ออกใบกำกับ</p>
                  <p className="font-medium">{formatThaiDate(invoice.invoiceDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">วันครบกำหนด</p>
                  <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {formatThaiDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                สรุปยอดเงิน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">รวมเงิน</span>
                <span className="font-medium">{formatBaht(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ส่วนลด</span>
                  <span className="font-medium text-green-600">-{formatBaht(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ภาษีมูลค่าเพิ่ม (7%)</span>
                <span className="font-medium">{formatBaht(invoice.vatAmount)}</span>
              </div>
              {invoice.withholdingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">หัก ณ ที่จ่าย</span>
                  <span className="font-medium text-orange-600">-{formatBaht(invoice.withholdingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">ยอดรวมทั้งสิ้น</span>
                <span className="font-bold text-emerald-700">{formatBaht(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ชำระแล้ว</span>
                <span className="font-medium text-green-600">{formatBaht(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">คงเหลือ</span>
                <span className={`font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatBaht(balance)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="border-b bg-white pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              รายการสินค้า/บริการ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-[50px] text-center">#</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="text-right">รวม (บาท)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-center text-gray-500">{line.lineNo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {line.product?.name ?? line.description}
                        </p>
                        {line.product?.sku && (
                          <p className="text-xs text-gray-400">SKU: {line.product.sku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{line.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatBaht(satangToBaht(line.unitPrice))}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBaht(satangToBaht(line.totalAmount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History */}
        {invoice.receiptAllocations.length > 0 && (
          <Card className="mb-6 border-0 shadow-md">
            <CardHeader className="border-b bg-white pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                ประวัติการชำระเงิน
              </CardTitle>
              <CardDescription>รายการชำระเงินที่เกี่ยวข้องกับใบกำกับภาษีนี้</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead>เลขที่ใบเสร็จ</TableHead>
                    <TableHead>วันที่ชำระ</TableHead>
                    <TableHead>ช่องทาง</TableHead>
                    <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.receiptAllocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {alloc.receipt.receiptNo}
                        </div>
                      </TableCell>
                      <TableCell>{formatThaiDate(alloc.receipt.receiptDate)}</TableCell>
                      <TableCell>
                        {alloc.receipt.bankAccount ? (
                          <span>{alloc.receipt.bankAccount.bankName} {alloc.receipt.bankAccount.accountNo}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatBaht(satangToBaht(alloc.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
