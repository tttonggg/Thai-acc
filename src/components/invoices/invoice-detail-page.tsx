'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Printer,
  FileText,
  MessageSquare,
  History,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentSection } from './comment-section';
import { AuditLog } from './audit-log';
import { RelatedDocuments } from './related-documents';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { formatThaiDate, formatCurrency } from '@/lib/thai-accounting';

// Types
interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  reference?: string;
  poNumber?: string;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  netAmount: number;
  withholdingRate?: number;
  withholdingAmount?: number;
  notes?: string;
  lines: Array<{
    id: string;
    lineNo: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    vatRate: number;
    vatAmount: number;
    amount: number;
  }>;
  _count?: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

interface InvoiceDetailPageProps {
  invoiceId: string;
  onBack: () => void;
  onEdit: (invoiceId: string) => void;
}

export function InvoiceDetailPage({ invoiceId, onBack, onEdit }: InvoiceDetailPageProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
      const result = await response.json();

      if (response.ok) {
        setInvoice(result.data);
      } else {
        throw new Error(result.error || 'ไม่พบใบกำกับภาษี');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/export/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${invoice?.invoiceNo} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบใบกำกับภาษีนี้ใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'ลบสำเร็จ',
          description: 'ลบใบกำกับภาษีเรียบร้อยแล้ว',
        });
        onBack();
      } else {
        const result = await response.json();
        throw new Error(result.error || 'ไม่สามารถลบได้');
      }
    } catch (error: any) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'ไม่พบข้อมูล'}</AlertDescription>
      </Alert>
    );
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'ร่าง',
    ISSUED: 'ออกแล้ว',
    PARTIAL: 'รับชำระบางส่วน',
    PAID: 'รับชำระเต็มจำนวน',
    CANCELLED: 'ยกเลิก',
  };

  const typeLabels: Record<string, string> = {
    TAX_INVOICE: 'ใบกำกับภาษี',
    RECEIPT: 'ใบเสร็จรับเงิน',
    DELIVERY_NOTE: 'ใบส่งของ',
    CREDIT_NOTE: 'ใบลดหนี้',
    DEBIT_NOTE: 'ใบเพิ่มหนี้',
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ISSUED: 'bg-blue-100 text-blue-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {typeLabels[invoice.type]} {invoice.invoiceNo}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-gray-500">{formatThaiDate(invoice.invoiceDate)}</p>
              <Badge className={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลด
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={printing}>
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์
          </Button>
          {invoice.status === 'DRAFT' &&
            (session?.user?.role === 'ADMIN' || invoice.createdById === session?.user?.id) && (
              <Button onClick={() => onEdit(invoiceId)}>
                <Edit className="mr-2 h-4 w-4" />
                แก้ไข
              </Button>
            )}
          {invoice.status === 'DRAFT' &&
            (session?.user?.role === 'ADMIN' || invoice.createdById === session?.user?.id) && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                ลบ
              </Button>
            )}
        </div>
      </div>

      {/* Invoice Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">ลูกค้า</p>
              <p className="font-semibold">{invoice.customer.name}</p>
              {invoice.customer.taxId && (
                <p className="text-sm text-gray-600">{invoice.customer.taxId}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">มูลค่าก่อน VAT</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.subtotal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ยอดรวมสุทธิ</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.netAmount || invoice.totalAmount)}
              </p>
            </div>
          </div>

          {invoice.status === 'ISSUED' && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                ใบกำกับภาษีถูกออกแล้ว การแก้ไขอาจกระทบการคำนวณภาษี
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            รายละเอียด
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            คอมเมนต์
            {invoice._count?.comments != null && invoice._count.comments > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invoice._count?.comments ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="mr-2 h-4 w-4" />
            ประวัติการแก้ไข
          </TabsTrigger>
          <TabsTrigger value="related">
            <Link2 className="mr-2 h-4 w-4" />
            เอกสารที่เกี่ยวข้อง
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>รายการสินค้า/บริการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{line.description}</p>
                      <p className="text-sm text-gray-500">
                        {line.quantity} {line.unit} × {formatCurrency(line.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(line.amount)}</p>
                      {line.discount > 0 && (
                        <p className="text-xs text-red-600">ส่วนลด {line.discount}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>ยอดรวมสินค้า</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>ส่วนลด</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>VAT 7%</span>
                  <span>{formatCurrency(invoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>ยอดรวมสุทธิ</span>
                  <span className="text-blue-600">
                    {formatCurrency(invoice.netAmount || invoice.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>หมายเหตุ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Reference Info */}
          {(invoice.reference || invoice.poNumber) && (
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลอ้างอิง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {invoice.reference && (
                    <div>
                      <p className="text-sm text-gray-500">เลขที่อ้างอิง</p>
                      <p className="font-medium">{invoice.reference}</p>
                    </div>
                  )}
                  {invoice.poNumber && (
                    <div>
                      <p className="text-sm text-gray-500">เลขที่ PO</p>
                      <p className="font-medium">{invoice.poNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments">
          {session?.user ? (
            <CommentSection
              invoiceId={invoiceId}
              currentUser={{
                id: session.user.id,
                name: session.user.name || undefined,
                email: session.user.email,
                role: session.user.role,
              }}
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              กรุณาเข้าสู่ระบบเพื่อดูคอมเมนต์
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit">
          <AuditLog invoiceId={invoiceId} entityType="ALL" showFilters={true} maxHeight="600px" />
        </TabsContent>

        <TabsContent value="related">
          <RelatedDocuments
            invoiceId={invoiceId}
            onDocumentClick={(module, id) => {
              // Navigate to related document
              window.location.href = `/${module}/${id}`;
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
