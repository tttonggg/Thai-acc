'use client';

// TODO: Consider splitting this large dialog (1134 lines) following the invoice-list pattern
// See: src/components/invoices/invoice-list-virtual.tsx for virtualization reference
// Consider extracting: line-item-editor, invoice-preview, invoice-audit-log sections

import { useState, useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  MessageSquare,
  History,
  Link2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentSection } from './comment-section';
import { AuditLog } from './audit-log';
import { RelatedDocuments } from './related-documents';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

// Types
interface Customer {
  id: string;
  code: string;
  name: string;
  taxId?: string;
  branchCode?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  unitPrice?: number;
  unit?: string;
}

interface InvoiceLine {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  date: string;
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  reference: string;
  poNumber: string;
  discountAmount: number;
  discountPercent: number;
  withholdingRate: number;
  notes: string;
  lines: InvoiceLine[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

interface InvoiceEditDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const invoiceTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
  CREDIT_NOTE: 'ใบลดหนี้',
  DEBIT_NOTE: 'ใบเพิ่มหนี้',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  PARTIAL: 'รับชำระบางส่วน',
  PAID: 'รับชำระเต็มจำนวน',
  CANCELLED: 'ยกเลิก',
};

const vatRates = [0, 7, 10];

export function InvoiceEditDialog({
  invoiceId,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceEditDialogProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: '',
    type: 'TAX_INVOICE' as const,
    status: 'DRAFT' as const,
    reference: '',
    poNumber: '',
    discountAmount: 0,
    discountPercent: 0,
    withholdingRate: 0,
    notes: '',
  });

  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if editing is restricted
  const isEditingRestricted = invoice?.status === 'PAID' || invoice?.status === 'CANCELLED';
  const isIssuedWarning = invoice?.status === 'ISSUED';

  // Fetch customers, products, and invoice data on mount
  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open, invoiceId]);

  const fetchInitialData = async () => {
    setFetchingData(true);
    setFetchingInvoice(true);
    try {
      const [customersRes, productsRes, invoiceRes] = await Promise.all([
        fetch(`/api/customers`, { credentials: 'include' }),
        fetch(`/api/products`, { credentials: 'include' }).catch(() => ({
          ok: false,
          json: async () => ({ data: [] }),
        })),
        fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' }),
      ]);

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.data || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);
      }

      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        const invoice = invoiceData?.data;

        if (!invoice) {
          throw new Error('ไม่พบข้อมูลใบกำกับภาษี');
        }

        setInvoice(invoice);
        setCommentCount(invoice._count?.comments || 0);

        // Populate form data
        setFormData({
          customerId: invoice?.customerId || '',
          invoiceDate: invoice.invoiceDate
            ? invoice.invoiceDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          type: invoice.type || 'TAX_INVOICE',
          status: invoice.status || 'DRAFT',
          reference: invoice.reference || '',
          poNumber: invoice.poNumber || '',
          discountAmount: invoice.discountAmount || 0,
          discountPercent: invoice.discountPercent || 0,
          withholdingRate: invoice.withholdingRate || 0,
          notes: invoice.notes || '',
        });

        // Populate lines
        if (invoice.lines && invoice.lines.length > 0) {
          setLines(
            invoice.lines.map((line: any) => ({
              id: line.id || Date.now().toString() + Math.random(),
              productId: line.productId || undefined,
              description: line.description || '',
              quantity: line.quantity || 1,
              unit: line.unit || 'ชิ้น',
              unitPrice: line.unitPrice || 0,
              discount: line.discount || 0,
              vatRate: line.vatRate || 7,
              vatAmount: line.vatAmount || 0,
              amount: line.amount || 0,
            }))
          );
        } else {
          // Default line if none exists
          setLines([
            {
              id: '1',
              description: '',
              quantity: 1,
              unit: 'ชิ้น',
              unitPrice: 0,
              discount: 0,
              vatRate: 7,
              vatAmount: 0,
              amount: 0,
            },
          ]);
        }
      } else {
        const errorData = await invoiceRes.json();
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลใบกำกับภาษีได้');
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถดึงข้อมูลได้',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setFetchingData(false);
      setFetchingInvoice(false);
    }
  };

  // Calculate totals
  const calculateLineTotals = (line: InvoiceLine): { amount: number; vatAmount: number } => {
    const beforeDiscount = line.quantity * line.unitPrice;
    const discountAmount = beforeDiscount * (line.discount / 100);
    const afterDiscount = beforeDiscount - discountAmount;
    const vatAmount = afterDiscount * (line.vatRate / 100);
    const amount = afterDiscount;

    return { amount, vatAmount };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    lines.forEach((line) => {
      const { amount, vatAmount } = calculateLineTotals(line);
      subtotal += amount;
      totalVat += vatAmount;
    });

    const discountAmount = subtotal * (formData.discountPercent / 100) + formData.discountAmount;
    const afterDiscount = subtotal - discountAmount;
    const vat = totalVat;
    const grandTotal = afterDiscount + vat;
    const withholdingAmount = grandTotal * (formData.withholdingRate / 100);
    const netTotal = grandTotal - withholdingAmount;

    return {
      subtotal,
      totalVat: vat,
      discountAmount,
      grandTotal,
      withholdingAmount,
      netTotal,
    };
  };

  const totals = calculateTotals();

  // Update line
  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          const updated = { ...line, [field]: value };

          // Recalculate amounts
          const { amount, vatAmount } = calculateLineTotals(updated);
          updated.amount = amount;
          updated.vatAmount = vatAmount;

          return updated;
        }
        return line;
      })
    );

    // Clear error for this line if exists
    if (errors[`line_${id}_${field}`]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[`line_${id}_${field}`];
        return updated;
      });
    }
  };

  // Add new line
  const addLine = () => {
    const newLine: InvoiceLine = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      discount: 0,
      vatRate: 7,
      vatAmount: 0,
      amount: 0,
    };
    setLines((prev) => [...prev, newLine]);
  };

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length === 1) {
      toast({
        title: 'ไม่สามารถลบรายการได้',
        description: 'ต้องมีอย่างน้อย 1 รายการ',
        variant: 'destructive',
      });
      return;
    }
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  // Select product
  const selectProduct = (lineId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateLine(lineId, 'productId', product.id);
      updateLine(lineId, 'description', product.name);
      updateLine(lineId, 'unit', product.unit || 'ชิ้น');
      updateLine(lineId, 'unitPrice', product.unitPrice || 0);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'กรุณาเลือกลูกค้า';
    }

    if (lines.length === 0) {
      newErrors.lines = 'ต้องมีอย่างน้อย 1 รายการ';
    }

    lines.forEach((line) => {
      if (!line.description.trim()) {
        newErrors[`line_${line.id}_description`] = 'กรุณาระบุรายการสินค้า';
      }
      if (line.quantity <= 0) {
        newErrors[`line_${line.id}_quantity`] = 'จำนวนต้องมากกว่า 0';
      }
      if (line.unitPrice < 0) {
        newErrors[`line_${line.id}_unitPrice`] = 'ราคาต้องไม่ติดลบ';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Post (issue) invoice
  const handlePost = async () => {
    if (!invoice) return;
    setPosting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/post`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถออกใบกำกับภาษีได้');
      toast({
        title: 'ออกใบกำกับสำเร็จ',
        description: `ใบกำกับภาษีเลขที่ ${result.data?.invoiceNo || invoice.invoiceNo} ถูกออกแล้ว`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'กรุณาตรวจสอบข้อมูล',
        description: 'มีข้อมูลที่ต้องกรอกไม่ครบถ้วน',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        lines: lines.map((line) => ({
          productId: line.productId || null,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          discount: line.discount,
          vatRate: line.vatRate,
          vatAmount: line.vatAmount,
          amount: line.amount,
        })),
      };

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตใบกำกับภาษีได้');
      }

      toast({
        title: 'อัปเดตสำเร็จ',
        description: `อัปเดต ${invoiceTypeLabels[formData.type]} เลขที่ ${result.data.invoiceNo} แล้ว`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปเดตใบกำกับภาษีได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-6xl">
        <VisuallyHidden>
          <DialogDescription>
            แก้ไข invoice dialog สำหรับแก้ไขรายละเอียดใบกำกับภาษีและข้อมูลที่เกี่ยวข้อง
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle className="text-xl">
            แก้ไข{invoice ? invoiceTypeLabels[invoice.type] : ''} - {invoice?.invoiceNo}
          </DialogTitle>
          {invoice && (
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={
                  invoice.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-800'
                    : invoice.status === 'ISSUED'
                      ? 'bg-blue-100 text-blue-800'
                      : invoice.status === 'PARTIAL'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                }
              >
                {statusLabels[invoice.status]}
              </Badge>
            </div>
          )}
        </DialogHeader>

        {fetchingInvoice ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <>
            {/* Prominent Post button */}
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                onClick={handlePost}
                disabled={posting || !invoice || invoice.status !== 'DRAFT'}
                className="bg-green-600 px-6 font-semibold text-white hover:bg-green-700"
              >
                {posting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังออกใบกำกับ...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    ออกใบกำกับภาษี
                  </>
                )}
              </Button>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  คอมเมนต์
                  {commentCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1">
                      {commentCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="related" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  เอกสารเกี่ยวข้อง
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                <div className="space-y-6">
                  {/* Status-based alerts */}
                  {isIssuedWarning && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        ใบกำกับภาษีถูกออกแล้ว การแก้ไขอาจกระทบการคำนวณภาษี
                      </AlertDescription>
                    </Alert>
                  )}

                  {isEditingRestricted && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {invoice?.status === 'PAID' && 'ไม่สามารถแก้ไขใบที่รับชำระแล้ว'}
                        {invoice?.status === 'CANCELLED' && 'ไม่สามารถแก้ไขใบที่ยกเลิกแล้ว'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Invoice Number (Read-only) */}
                  <div>
                    <Label htmlFor="invoiceNo">เลขที่เอกสาร</Label>
                    <Input
                      id="invoiceNo"
                      value={invoice?.invoiceNo || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Customer & Type */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <Label htmlFor="customerId" className="required">
                        ลูกค้า *
                      </Label>
                      <Select
                        value={formData.customerId}
                        onValueChange={(value) => {
                          setFormData((prev) => ({ ...prev, customerId: value }));
                          if (errors.customerId) {
                            setErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.customerId;
                              return updated;
                            });
                          }
                        }}
                        disabled={isEditingRestricted}
                      >
                        <SelectTrigger
                          id="customerId"
                          className={errors.customerId ? 'border-destructive' : ''}
                        >
                          <SelectValue placeholder="เลือกลูกค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.code} - {customer.name}
                              {customer.taxId && ` (${customer.taxId})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.customerId && (
                        <p className="mt-1 text-sm text-destructive">{errors.customerId}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="invoiceDate">วันที่เอกสาร</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={formData.invoiceDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))
                        }
                        max={new Date().toISOString().split('T')[0]}
                        disabled={isEditingRestricted}
                      />
                    </div>
                  </div>

                  {/* Status & Type */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="status">สถานะ</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                        disabled={isEditingRestricted}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">ร่าง</SelectItem>
                          <SelectItem value="ISSUED">ออกแล้ว</SelectItem>
                          <SelectItem value="PARTIAL">รับชำระบางส่วน</SelectItem>
                          <SelectItem value="PAID">รับชำระเต็มจำนวน</SelectItem>
                          <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type">ประเภทเอกสาร</Label>
                      <Input
                        id="type"
                        value={invoiceTypeLabels[formData.type]}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  {/* Reference & PO */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                      <Input
                        id="reference"
                        placeholder="เลขที่อ้างอิง (ถ้ามี)"
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, reference: e.target.value }))
                        }
                        disabled={isEditingRestricted}
                      />
                    </div>
                    <div>
                      <Label htmlFor="poNumber">เลขที่ PO</Label>
                      <Input
                        id="poNumber"
                        placeholder="เลขที่ Purchase Order (ถ้ามี)"
                        value={formData.poNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, poNumber: e.target.value }))
                        }
                        disabled={isEditingRestricted}
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">รายการสินค้า/บริการ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="hidden gap-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-12">
                          <div className="col-span-4">รายการ</div>
                          <div className="col-span-1 text-center">จำนวน</div>
                          <div className="col-span-1">หน่วย</div>
                          <div className="col-span-1 text-right">ราคา/หน่วย</div>
                          <div className="col-span-1 text-center">ส่วนลด</div>
                          <div className="col-span-1 text-center">VAT</div>
                          <div className="col-span-1 text-right">จำนวนเงิน</div>
                          <div className="col-span-2"></div>
                        </div>

                        {/* Lines */}
                        {lines.map((line) => (
                          <div
                            key={line.id}
                            className="grid grid-cols-1 items-start gap-2 md:grid-cols-12"
                          >
                            {/* Product/Description */}
                            <div className="space-y-1 md:col-span-4">
                              {products.length > 0 && (
                                <Select
                                  value={line.productId || ''}
                                  onValueChange={(value) => selectProduct(line.id, value)}
                                  disabled={isEditingRestricted}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="เลือกสินค้า" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.code} - {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Input
                                placeholder="รายการสินค้า/บริการ"
                                value={line.description}
                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                className={
                                  errors[`line_${line.id}_description`] ? 'border-destructive' : ''
                                }
                                disabled={isEditingRestricted}
                              />
                              {errors[`line_${line.id}_description`] && (
                                <p className="text-xs text-destructive">
                                  {errors[`line_${line.id}_description`]}
                                </p>
                              )}
                            </div>

                            {/* Quantity */}
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className={
                                  errors[`line_${line.id}_quantity`] ? 'border-destructive' : ''
                                }
                                disabled={isEditingRestricted}
                              />
                              {errors[`line_${line.id}_quantity`] && (
                                <p className="mt-1 text-xs text-destructive md:hidden">
                                  {errors[`line_${line.id}_quantity`]}
                                </p>
                              )}
                            </div>

                            {/* Unit */}
                            <div>
                              <Select
                                value={line.unit}
                                onValueChange={(value) => updateLine(line.id, 'unit', value)}
                                disabled={isEditingRestricted}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ชิ้น">ชิ้น</SelectItem>
                                  <SelectItem value="ชุด">ชุด</SelectItem>
                                  <SelectItem value="กล่อง">กล่อง</SelectItem>
                                  <SelectItem value="แพ็ค">แพ็ค</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="ลิตร">ลิตร</SelectItem>
                                  <SelectItem value="เมตร">เมตร</SelectItem>
                                  <SelectItem value="ครั้ง">ครั้ง</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Unit Price */}
                            <div>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                                className={
                                  errors[`line_${line.id}_unitPrice`] ? 'border-destructive' : ''
                                }
                                disabled={isEditingRestricted}
                              />
                            </div>

                            {/* Discount */}
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                placeholder="0"
                                value={line.discount}
                                onChange={(e) =>
                                  updateLine(line.id, 'discount', parseFloat(e.target.value) || 0)
                                }
                                className="pr-6"
                                disabled={isEditingRestricted}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                %
                              </span>
                            </div>

                            {/* VAT */}
                            <div>
                              <Select
                                value={line.vatRate.toString()}
                                onValueChange={(value) =>
                                  updateLine(line.id, 'vatRate', parseFloat(value))
                                }
                                disabled={isEditingRestricted}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {vatRates.map((rate) => (
                                    <SelectItem key={rate} value={rate.toString()}>
                                      {rate}%
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Amount */}
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(line.amount)}</p>
                            </div>

                            {/* Remove Button */}
                            <div className="flex justify-start">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 text-destructive hover:text-destructive"
                                onClick={() => removeLine(line.id)}
                                disabled={lines.length === 1 || isEditingRestricted}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Add Line Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addLine}
                          className="w-full"
                          disabled={isEditingRestricted}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          เพิ่มรายการ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Totals */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>ยอดรวมสินค้า</span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="discountPercent">ส่วนลด (%)</Label>
                            <Input
                              id="discountPercent"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.discountPercent}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  discountPercent: parseFloat(e.target.value) || 0,
                                }))
                              }
                              disabled={isEditingRestricted}
                            />
                          </div>
                          <div>
                            <Label htmlFor="discountAmount">ส่วนลด (บาท)</Label>
                            <Input
                              id="discountAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.discountAmount}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  discountAmount: parseFloat(e.target.value) || 0,
                                }))
                              }
                              disabled={isEditingRestricted}
                            />
                          </div>
                        </div>

                        {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>ส่วนลดรวม</span>
                            <span>-{formatCurrency(totals.discountAmount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span>ยอดหลังหักส่วนลด</span>
                          <span>{formatCurrency(totals.subtotal - totals.discountAmount)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>VAT ({totals.totalVat > 0 ? '7%' : '0%'})</span>
                          <span>{formatCurrency(totals.totalVat)}</span>
                        </div>

                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                          <span>ยอดรวมสุทธิ</span>
                          <span className="text-blue-600">{formatCurrency(totals.grandTotal)}</span>
                        </div>

                        {formData.withholdingRate > 0 && (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>หัก ณ ที่จ่าย ({formData.withholdingRate}%)</span>
                              <span>-{formatCurrency(totals.withholdingAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold">
                              <span>ยอดสุทธิหลังหัก ณ ที่จ่าย</span>
                              <span className="text-green-600">
                                {formatCurrency(totals.netTotal)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Withholding Tax & Notes */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="withholdingRate">หัก ณ ที่จ่าย (%)</Label>
                      <Select
                        value={formData.withholdingRate.toString()}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, withholdingRate: parseFloat(value) }))
                        }
                        disabled={isEditingRestricted}
                      >
                        <SelectTrigger id="withholdingRate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">ไม่หัก ณ ที่จ่าย</SelectItem>
                          <SelectItem value="1">1%</SelectItem>
                          <SelectItem value="3">3%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">หมายเหตุ</Label>
                      <Input
                        id="notes"
                        placeholder="หมายเหตุ (ถ้ามี)"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        disabled={isEditingRestricted}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                    >
                      ยกเลิก
                    </Button>
                    {!isEditingRestricted && (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            บันทึกการแก้ไข
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-6 space-y-6">
                {session?.user ? (
                  <>
                    <CommentSection
                      invoiceId={invoiceId}
                      currentUser={{
                        id: session.user.id ?? '',
                        name: session.user.name ?? '',
                        email: session.user.email ?? '',
                        role: session.user.role ?? 'USER',
                      }}
                    />
                    <div className="mt-6">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <History className="h-4 w-4" />
                        ประวัติการแก้ไข
                      </h3>
                      <AuditLog
                        invoiceId={invoiceId}
                        entityType="ALL"
                        showFilters={false}
                        maxHeight="400px"
                      />
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    กรุณาเข้าสู่ระบบเพื่อดูคอมเมนต์
                  </div>
                )}
              </TabsContent>

              <TabsContent value="related" className="mt-6">
                <RelatedDocuments
                  invoiceId={invoiceId}
                  onDocumentClick={(module, id) => {
                    // Navigate to related document
                    window.location.href = `/${module}/${id}`;
                  }}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
