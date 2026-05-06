'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { formatThaiDate } from '@/lib/thai-accounting';
import { satangToBaht, bahtToSatang } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { PaymentMethod } from '@prisma/client';

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
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    product?: { name: string } | null;
  }[];
  currency?: { code: string; symbol: string } | null;
}

function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'TRANSFER', label: 'โอนเงิน', icon: Building2 },
  { value: 'CASH', label: 'เงินสด', icon: Banknote },
  { value: 'CHEQUE', label: 'เช็ค', icon: FileText },
  { value: 'CREDIT', label: 'บัตรเครดิต', icon: CreditCard },
  { value: 'OTHER', label: 'อื่นๆ', icon: AlertCircle },
];

export default function PortalPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = usePortalAuthStore();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [notes, setNotes] = useState('');

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

  // Initialize amount when invoice loads
  useEffect(() => {
    if (invoice) {
      setAmount(invoice.balance.toFixed(2));
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    if (parsedAmount > invoice.balance) {
      setSubmitError('จำนวนเงินที่ชำระมากกว่ายอดคงเหลือ');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/portal/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': user?.customerId ?? '',
        },
        body: JSON.stringify({
          payments: [
            {
              invoiceId: invoice.id,
              amount: bahtToSatang(parsedAmount), // Convert to Satang for API
            },
          ],
          paymentMethod,
          bankAccountId: bankAccountId || undefined,
          chequeNo: chequeNo || undefined,
          chequeDate: chequeDate || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
      }

      setSubmitSuccess(`บันทึกการชำระเงินเรียบร้อยแล้ว เลขที่ใบเสร็จ: ${data.receiptNo}`);
      
      // Redirect to invoice detail after 2 seconds
      setTimeout(() => {
        router.push(`/portal/invoices/${invoiceId}`);
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
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
        <div className="mx-auto max-w-2xl px-4 py-8">
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

  const balance = invoice.balance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/portal/invoices/${invoiceId}`)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายละเอียดใบกำกับภาษี
        </Button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ชำระเงิน</h1>
            <p className="text-gray-500">{invoice.invoiceNo}</p>
          </div>
        </div>

        {/* Invoice Summary */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              ข้อมูลใบกำกับภาษี
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ยอดรวมทั้งสิ้น</span>
              <span className="font-medium">{formatBaht(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ชำระแล้ว</span>
              <span className="font-medium text-green-600">{formatBaht(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <span className="font-semibold">ยอดคงเหลือ</span>
              <span className="font-bold text-orange-600">{formatBaht(balance)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              วันครบกำหนด: {formatThaiDate(invoice.dueDate)}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">แบบฟอร์มชำระเงิน</CardTitle>
            <CardDescription>กรอกรายละเอียดการชำระเงินของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-base font-medium">วิธีการชำระเงิน</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                          paymentMethod === method.value
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-medium">
                  จำนวนเงินที่ต้องการชำระ (บาท)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance.toFixed(2)}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg font-medium"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400">
                  ยอดคงเหลือ: {formatBaht(balance)} • ชำระได้สูงสุด {formatBaht(balance)}
                </p>
              </div>

              {/* Cheque Fields - shown when CHEQUE is selected */}
              {paymentMethod === 'CHEQUE' && (
                <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="chequeNo">เลขที่เช็ค</Label>
                    <Input
                      id="chequeNo"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="เช่น 123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chequeDate">วันที่เช็ค</Label>
                    <Input
                      id="chequeDate"
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-medium">
                  หมายเหตุ (ถ้ามี)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Error */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Submit Success */}
              {submitSuccess && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{submitSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/portal/invoices/${invoiceId}`)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      บันทึกการชำระเงิน
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                การชำระเงินจะถูกส่งไปยังระบบ ERP เพื่อตรวจสอบและอนุมัติ
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
