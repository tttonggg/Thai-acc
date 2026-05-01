'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Package,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Types
interface Vendor {
  id: string;
  code: string;
  name: string;
  taxId?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unit?: string;
}

interface PurchaseOrderLine {
  id: string;
  lineNo: number;
  productId?: string;
  product?: Product;
  description: string;
  quantity: number;
  receivedQty: number;
  unit: string;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  vendorId: string;
  vendor?: Vendor;
  expectedDate?: string;
  lines: PurchaseOrderLine[];
}

interface GRNLine {
  poLineId: string;
  productId?: string;
  description: string;
  orderedQty: number;
  previouslyReceived: number;
  receivingToday: number;
  remaining: number;
  unit: string;
  unitPrice: number;
  notes: string;
}

interface GRNFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export function GRNForm({ open, onClose, onSuccess }: GRNFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grnNumber, setGrnNumber] = useState('');

  // Step 1: PO Selection
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Step 2: Receipt Quantities
  const [grnLines, setGrnLines] = useState<GRNLine[]>([]);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Step 3: Journal Entry Preview
  const [journalPreview, setJournalPreview] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch open POs on mount
  useEffect(() => {
    if (open) {
      fetchOpenPOs();
      generateGRNNumber();
    }
  }, [open]);

  const fetchOpenPOs = async () => {
    setFetchingData(true);
    try {
      const res = await fetch(`/api/purchase-orders?status=OPEN`, { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setPurchaseOrders(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching POs:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลใบสั่งซื้อได้',
        variant: 'destructive',
      });
    } finally {
      setFetchingData(false);
    }
  };

  const generateGRNNumber = async () => {
    try {
      const res = await fetch(`/api/document-numbers/GRN/next`, { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setGrnNumber(result.data || '');
      }
    } catch {
      // Fallback
      const date = new Date();
      const prefix = `GRN-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const random = Math.floor(Math.random() * 9000) + 1000;
      setGrnNumber(`${prefix}-${random}`);
    }
  };

  // Step 1: Handle PO Selection
  const handlePOSelect = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    setSelectedPO(po);

    // Initialize GRN lines from PO lines
    const lines: GRNLine[] = po.lines.map((line) => ({
      poLineId: line.id,
      productId: line.productId,
      description: line.description,
      orderedQty: line.quantity,
      previouslyReceived: line.receivedQty,
      receivingToday: line.quantity - line.receivedQty, // Default to remaining
      remaining: line.quantity - line.receivedQty,
      unit: line.unit,
      unitPrice: line.unitPrice,
      notes: '',
    }));

    setGrnLines(lines);
    setCurrentStep(2);
  };

  // Step 2: Calculate totals and journal preview
  const calculateTotals = () => {
    let totalValue = 0;
    let totalVariance = 0;

    grnLines.forEach((line) => {
      const lineValue = line.receivingToday * line.unitPrice;
      totalValue += lineValue;

      const variance = line.receivingToday - line.remaining;
      if (variance !== 0) {
        totalVariance += Math.abs(variance);
      }
    });

    return { totalValue, totalVariance };
  };

  const generateJournalPreview = () => {
    const { totalValue } = calculateTotals();

    // Journal entry for GRN:
    // Dr Inventory (asset) = totalValue
    // Cr GR/IR (liability) = totalValue
    return {
      debit: {
        account: 'มูลค่าสินค้าคงเหลือ (Inventory)',
        amount: totalValue,
        code: '1xxx',
      },
      credit: {
        account: 'บัญชีผู้ขาย / GR/IR (Accounts Payable)',
        amount: totalValue,
        code: '2xxx',
      },
    };
  };

  // Step 2: Update receiving quantity
  const updateReceivingQty = (index: number, value: number) => {
    setGrnLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index] };

      // Validate: cannot receive more than ordered + tolerance (5%)
      const maxAllowed = line.orderedQty * 1.05;
      if (value > maxAllowed) {
        toast({
          title: 'จำนวนเกินกว่าที่อนุญาต',
          description: 'สามารถรับได้สูงสุด 105% ของจำนวนที่สั่งซื้อ',
          variant: 'destructive',
        });
        return prev;
      }

      if (value < 0) {
        return prev;
      }

      line.receivingToday = value;
      updated[index] = line;
      return updated;
    });

    // Clear error if exists
    if (errors[`line_${index}`]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[`line_${index}`];
        return updated;
      });
    }
  };

  // Step 2: Update line notes
  const updateLineNotes = (index: number, notes: string) => {
    setGrnLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  };

  // Step 2: Validate and move to step 3
  const handleProceedToStep3 = () => {
    const newErrors: Record<string, string> = {};

    grnLines.forEach((line, index) => {
      if (line.receivingToday <= 0) {
        newErrors[`line_${index}`] = 'กรุณาระบุจำนวนที่รับ';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'กรุณาตรวจสอบข้อมูล',
        description: 'มีรายการที่ยังไม่ได้ระบุจำนวน',
        variant: 'destructive',
      });
      return;
    }

    // Generate journal preview
    const preview = generateJournalPreview();
    setJournalPreview(preview);
    setCurrentStep(3);
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

  // Step 3: Submit GRN
  const handleSubmit = async () => {
    if (!selectedPO) return;

    setLoading(true);
    try {
      const payload = {
        purchaseOrderId: selectedPO.id,
        receiptDate,
        notes,
        lines: grnLines.map((line) => ({
          poLineId: line.poLineId,
          quantity: line.receivingToday,
          notes: line.notes,
        })),
      };

      const response = await fetch(`/api/goods-receipt-notes`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถบันทึกใบรับสินค้าได้');
      }

      toast({
        title: 'บันทึกสำเร็จ',
        description: `บันทึกใบรับสินค้าเลขที่ ${result.data.grnNo} แล้ว`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error submitting GRN:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกใบรับสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setCurrentStep(1);
    setSelectedPO(null);
    setGrnLines([]);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setJournalPreview(null);
    setErrors({});
    onClose();
  };

  // Get variance badge
  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          ไม่มีผันผวน
        </Badge>
      );
    }
    if (variance > 0) {
      return <Badge variant="destructive">รับมากกว่าสั่ง ({variance.toFixed(2)})</Badge>;
    }
    return <Badge variant="outline">รับน้อยกว่าสั่ง ({Math.abs(variance).toFixed(2)})</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            สร้างใบรับสินค้า (GRN)
          </DialogTitle>
          {grnNumber && (
            <p className="mt-1 text-sm text-muted-foreground">เลขที่เอกสาร: {grnNumber}</p>
          )}
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div
            className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
            >
              {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">เลือก PO</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div
            className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
            >
              {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">ยืนยันจำนวน</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div
            className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
            >
              3
            </div>
            <span className="ml-2 text-sm font-medium">ยืนยันและบันทึก</span>
          </div>
        </div>

        <DialogDescription>
          {currentStep === 1 && 'เลือกใบสั่งซื้อที่ต้องการรับสินค้า'}
          {currentStep === 2 && 'ตรวจสอบและยืนยันจำนวนสินค้าที่ได้รับ'}
          {currentStep === 3 && 'ตรวจสอบสรุปข้อมูลก่อนบันทึก'}
        </DialogDescription>

        {fetchingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: PO Selection */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ขั้นตอนที่ 1: เลือกใบสั่งซื้อ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="poSelect" className="required">
                        เลือกใบสั่งซื้อ *
                      </Label>
                      <Select value={selectedPO?.id || ''} onValueChange={handlePOSelect}>
                        <SelectTrigger id="poSelect">
                          <SelectValue placeholder="เลือกใบสั่งซื้อที่ต้องการรับสินค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseOrders.length === 0 ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              ไม่มีใบสั่งซื้อที่รอการรับสินค้า
                            </div>
                          ) : (
                            purchaseOrders.map((po) => (
                              <SelectItem key={po.id} value={po.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{po.orderNo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {po.vendor?.name} - {po.lines.length} รายการ
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {purchaseOrders.length === 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          ไม่มีใบสั่งซื้อที่อยู่ในสถานะ "เปิด" (OPEN)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Confirm Quantities */}
            {currentStep === 2 && selectedPO && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ขั้นตอนที่ 2: ยืนยันจำนวนที่รับสินค้า</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* PO Info */}
                    <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">เลขที่ PO</Label>
                        <p className="font-medium">{selectedPO.orderNo}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">ผู้ขาย</Label>
                        <p className="font-medium">{selectedPO.vendor?.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">วันที่รับสินค้า</Label>
                        <Input
                          type="date"
                          value={receiptDate}
                          onChange={(e) => setReceiptDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">ลำดับ</TableHead>
                            <TableHead>รายการสินค้า</TableHead>
                            <TableHead className="text-right">จำนวนสั่งซื้อ</TableHead>
                            <TableHead className="text-right">รับแล้ว</TableHead>
                            <TableHead className="text-right">คงเหลือ</TableHead>
                            <TableHead className="text-right">รับวันนี้</TableHead>
                            <TableHead className="text-center">ผันผวน</TableHead>
                            <TableHead>หมายเหตุ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grnLines.map((line, index) => {
                            const variance = line.receivingToday - line.remaining;
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{line.description}</div>
                                  {line.unit && (
                                    <div className="text-xs text-muted-foreground">
                                      หน่วย: {line.unit}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {line.orderedQty.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {line.previouslyReceived.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {line.remaining.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={line.receivingToday}
                                    onChange={(e) =>
                                      updateReceivingQty(index, parseFloat(e.target.value) || 0)
                                    }
                                    className={errors[`line_${index}`] ? 'border-destructive' : ''}
                                  />
                                  {errors[`line_${index}`] && (
                                    <p className="mt-1 text-xs text-destructive">
                                      {errors[`line_${index}`]}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getVarianceBadge(variance)}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="หมายเหตุ (ถ้ามี)"
                                    value={line.notes}
                                    onChange={(e) => updateLineNotes(index, e.target.value)}
                                    className="text-sm"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Variance Warning */}
                    {calculateTotals().totalVariance > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          มีรายการที่แตกต่างจากจำนวนที่สั่งซื้อ กรุณาตรวจสอบให้แน่ใจว่าข้อมูลถูกต้อง
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">หมายเหตุทั่วไป</Label>
                      <Textarea
                        id="notes"
                        placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ย้อนกลับ
                  </Button>
                  <Button onClick={handleProceedToStep3} className="bg-blue-600 hover:bg-blue-700">
                    ดูสรุปก่อนบันทึก
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm & Post */}
            {currentStep === 3 && journalPreview && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ขั้นตอนที่ 3: ยืนยันและบันทึก</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">ข้อมูลใบรับสินค้า</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">เลขที่:</span>
                            <span className="font-medium">{grnNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">วันที่รับ:</span>
                            <span className="font-medium">{receiptDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">เลขที่ PO:</span>
                            <span className="font-medium">{selectedPO?.orderNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ผู้ขาย:</span>
                            <span className="font-medium">{selectedPO?.vendor?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">สรุปรายการ</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">จำนวนรายการ:</span>
                            <span className="font-medium">{grnLines.length} รายการ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">จำนวนรับทั้งหมด:</span>
                            <span className="font-medium">
                              {grnLines
                                .reduce((sum, line) => sum + line.receivingToday, 0)
                                .toFixed(2)}{' '}
                              หน่วย
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>มูลค่ารวม:</span>
                            <span className="text-blue-600">
                              {formatCurrency(calculateTotals().totalValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Journal Entry Preview */}
                    <div className="rounded-lg border bg-gray-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">
                          รายการบัญชีที่จะบันทึก (Journal Entry Preview)
                        </h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>บัญชี</TableHead>
                            <TableHead className="text-right">เดบิต (Dr)</TableHead>
                            <TableHead className="text-right">เครดิต (Cr)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <div className="font-medium">{journalPreview.debit.account}</div>
                              <div className="text-xs text-muted-foreground">
                                {journalPreview.debit.code}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(journalPreview.debit.amount)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div className="font-medium">{journalPreview.credit.account}</div>
                              <div className="text-xs text-muted-foreground">
                                {journalPreview.credit.code}
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatCurrency(journalPreview.credit.amount)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-100 font-semibold">
                            <TableCell>รวม</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(journalPreview.debit.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(journalPreview.credit.amount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Items Summary */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">รายการสินค้าที่รับ</h3>
                      <div className="max-h-48 overflow-hidden overflow-y-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>รายการ</TableHead>
                              <TableHead className="text-right">จำนวน</TableHead>
                              <TableHead className="text-right">มูลค่า</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grnLines.map((line, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-sm">{line.description}</TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.receivingToday.toFixed(2)} {line.unit}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  {formatCurrency(line.receivingToday * line.unitPrice)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ย้อนกลับแก้ไข
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        ยืนยันและบันทึก
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
