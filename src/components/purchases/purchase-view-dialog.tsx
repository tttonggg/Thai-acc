'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Loader2,
  FileText,
  Download,
  Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface PurchaseLine {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  amount: number
  vatRate: number
  vatAmount: number
  product?: {
    code: string
    name: string
  }
}

interface Purchase {
  id: string
  invoiceNo: string
  vendorInvoiceNo?: string
  invoiceDate: string
  dueDate?: string
  vendor: {
    code: string
    name: string
    taxId?: string
    address?: string
  }
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE'
  status: 'DRAFT' | 'ISSUED' | 'POSTED' | 'PAID' | 'CANCELLED'
  reference?: string
  poNumber?: string
  subtotal: number
  discountAmount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  withholdingRate: number
  withholdingAmount: number
  netAmount: number
  paidAmount: number
  notes?: string
  internalNotes?: string
  lines: PurchaseLine[]
  journalEntryId?: string
  journalEntry?: {
    entryNo: string
    status: string
  }
  payments?: Array<{
    paymentNo: string
    paymentDate: string
    amount: number
  }>
}

interface PurchaseViewDialogProps {
  purchaseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const purchaseTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  POSTED: 'ลงบัญชีแล้ว',
  PAID: 'จ่ายแล้ว',
  CANCELLED: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  POSTED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function PurchaseViewDialog({ purchaseId, open, onOpenChange }: PurchaseViewDialogProps) {
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && purchaseId) {
      fetchPurchase()
    }
  }, [open, purchaseId])

  const fetchPurchase = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลใบซื้อได้')
      }

      setPurchase(result.data)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 500)
  }

  const handleDownload = async () => {
    try {
      toast({
        title: 'กำลังดาวน์โหลด',
        description: 'กำลังสร้างไฟล์ PDF...',
      })
      // In production, this would call a PDF generation endpoint
      // For now, just print
      handlePrint()
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !purchase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-12 text-red-600">
            เกิดข้อผิดพลาด: {error || 'ไม่พบข้อมูล'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                ดู{purchaseTypeLabels[purchase.type]} - {purchase.invoiceNo}
              </DialogTitle>
              {purchase.vendorInvoiceNo && (
                <p className="text-sm text-muted-foreground mt-1">
                  เลขที่ใบกำกับภาษีผู้ขาย: {purchase.vendorInvoiceNo}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={printing}
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                ดาวน์โหลด
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={printing}
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                พิมพ์
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusColors[purchase.status]}>
              {statusLabels[purchase.status]}
            </Badge>
            {purchase.journalEntry && (
              <Badge variant="outline">
                บันทึกบัญชี: {purchase.journalEntry.entryNo}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Print Content */}
        <div className="space-y-6 print:space-y-4" id="purchase-content">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">{purchaseTypeLabels[purchase.type]}</h1>
              <p className="text-lg text-muted-foreground mt-1">{purchase.invoiceNo}</p>
              {purchase.vendorInvoiceNo && (
                <p className="text-sm text-muted-foreground mt-1">
                  เลขที่ใบกำกับภาษีผู้ขาย: {purchase.vendorInvoiceNo}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ผู้ขาย</p>
                  <p className="font-semibold text-lg">{purchase.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{purchase.vendor.code}</p>
                  {purchase.vendor.taxId && (
                    <p className="text-sm">เลขประจำตัวผู้เสียภาษี: {purchase.vendor.taxId}</p>
                  )}
                  {purchase.vendor.address && (
                    <p className="text-sm mt-2">{purchase.vendor.address}</p>
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
                      <TableCell className="text-right">{line.discount > 0 ? `${line.discount}%` : '-'}</TableCell>
                      <TableCell className="text-right">{line.vatRate > 0 ? `${line.vatRate}%` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(line.amount)}</TableCell>
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
                <div className="w-full md:w-1/2 space-y-2">
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
                        <span className="text-green-600">-{formatCurrency(purchase.paidAmount)}</span>
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
                      <p className="text-sm font-medium mb-1">หมายเหตุ</p>
                      <p className="text-sm text-muted-foreground">{purchase.notes}</p>
                    </div>
                  )}
                  {purchase.internalNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">หมายเหตุภายใน</p>
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
  )
}
