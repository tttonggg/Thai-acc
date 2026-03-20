'use client'

import {
  ShoppingCart,
  Building2,
  Calendar,
  User,
  Truck,
  CreditCard,
  MapPin,
  FileText,
  Package,
  Printer,
  CheckCircle2,
  XCircle,
  Ban,
  Ship,
  Loader2,
  Clock,
  Edit,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface Vendor {
  id: string
  name: string
  code: string
  taxId?: string
  address?: string
  contactName?: string
  contactPhone?: string
}

interface PurchaseOrderLine {
  id: string
  lineNo: number
  productId?: string
  product?: {
    id: string
    code: string
    name: string
  }
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  vatRate: number
  vatAmount: number
  amount: number
}

interface PurchaseOrder {
  id: string
  orderNo: string
  orderDate: string
  vendorId: string
  vendor: Vendor
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
  subtotal: number
  vatAmount: number
  totalAmount: number
  expectedDate?: string
  shippingTerms?: string
  paymentTerms?: string
  deliveryAddress?: string
  notes?: string
  lines: PurchaseOrderLine[]
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  confirmedAt?: string
  confirmedBy?: string
  shippedAt?: string
  shippedBy?: string
  receivedAt?: string
  receivedBy?: string
  cancelledAt?: string
  cancelledBy?: string
  cancelledReason?: string
  purchaseRequest?: {
    id: string
    requestNo: string
  }
  goodsReceipts?: Array<{
    id: string
    receiptNo: string
    receiptDate: string
    quantity: number
  }>
}

// Status labels and colors
const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  PENDING: 'รออนุมัติ',
  CONFIRMED: 'ยืนยันแล้ว',
  SHIPPED: 'จัดส่งแล้ว',
  PARTIAL: 'รับบางส่วน',
  RECEIVED: 'รับสินค้าแล้ว',
  CANCELLED: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  PARTIAL: 'bg-orange-100 text-orange-800 border-orange-300',
  RECEIVED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
}

interface PurchaseOrderViewDialogProps {
  po: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (poId: string, action: 'confirm' | 'receive' | 'ship' | 'cancel') => void
  processingAction: string | null
  onEdit: (po: PurchaseOrder) => void
}

export function PurchaseOrderViewDialog({
  po,
  open,
  onOpenChange,
  onAction,
  processingAction,
  onEdit,
}: PurchaseOrderViewDialogProps) {
  const formatCurrency = (amount: number) => {
    return `฿${(amount / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('th-TH')
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH')
  }

  const handlePrint = () => {
    window.open(`/api/purchase-orders/${po?.id}/print`, '_blank')
  }

  if (!po) return null

  const totalQuantity = po.lines.reduce((sum, line) => sum + line.quantity, 0)
  const totalReceived = po.goodsReceipts?.reduce((sum, gr) => sum + gr.quantity, 0) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            ใบสั่งซื้อ: {po.orderNo}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={statusColors[po.status]} variant="outline">
                {statusLabels[po.status]}
              </Badge>
              <span className="text-gray-500">
                วันที่: {formatDate(po.orderDate)}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">รายละเอียด</TabsTrigger>
            <TabsTrigger value="items">รายการสินค้า</TabsTrigger>
            <TabsTrigger value="history">ประวัติ</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  ข้อมูลผู้จำหน่าย
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500">ชื่อผู้จำหน่าย</Label>
                  <p className="font-medium">{po.vendor?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">รหัสผู้จำหน่าย</Label>
                  <p className="font-medium">{po.vendor?.code || '-'}</p>
                </div>
                {po.vendor?.taxId && (
                  <div className="space-y-1">
                    <Label className="text-gray-500">เลขประจำตัวผู้เสียภาษี</Label>
                    <p className="font-medium">{po.vendor.taxId}</p>
                  </div>
                )}
                {po.vendor?.contactName && (
                  <div className="space-y-1">
                    <Label className="text-gray-500">ผู้ติดต่อ</Label>
                    <p className="font-medium">{po.vendor.contactName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    ข้อมูลการสั่งซื้อ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">วันที่สั่งซื้อ</span>
                    <span>{formatDate(po.orderDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">วันที่คาดว่าจะได้รับ</span>
                    <span>{formatDate(po.expectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ผู้สร้าง</span>
                    <span>{po.createdBy?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">วันที่สร้าง</span>
                    <span>{formatDateTime(po.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    เงื่อนไข
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">เงื่อนไขการชำระเงิน</span>
                    <span>{po.paymentTerms || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">เงื่อนไขการส่งสินค้า</span>
                    <span>{po.shippingTerms || '-'}</span>
                  </div>
                  {po.deliveryAddress && (
                    <div className="space-y-1">
                      <span className="text-gray-500">ที่อยู่จัดส่ง</span>
                      <p className="text-sm">{po.deliveryAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* PR Reference */}
            {po.purchaseRequest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    อ้างอิงใบขอซื้อ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    <span className="text-gray-500">เลขที่ PR:</span>{' '}
                    <span className="font-medium">{po.purchaseRequest.requestNo}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {po.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">หมายเหตุ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-gray-50 p-3 rounded">{po.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Totals */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-end">
                  <div className="w-full md:w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">รวมเป็นเงิน</span>
                      <span>{formatCurrency(po.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ภาษีมูลค่าเพิ่ม (VAT)</span>
                      <span>{formatCurrency(po.vatAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>รวมทั้งสิ้น</span>
                      <span className="text-blue-600">{formatCurrency(po.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  รายการสินค้า ({po.lines?.length || 0} รายการ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ลำดับ</TableHead>
                        <TableHead>รายการ</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead className="text-right">ราคา/หน่วย</TableHead>
                        <TableHead className="text-right">ส่วนลด</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.lines?.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-center">{line.lineNo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.product && (
                                <p className="text-xs text-gray-500">
                                  รหัส: {line.product.code}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {line.quantity.toLocaleString('th-TH')} {line.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.discount > 0 ? `${line.discount}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.vatRate}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(line.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Receipt Progress */}
                {po.status !== 'DRAFT' && po.status !== 'CANCELLED' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">ความคืบหน้าการรับสินค้า</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>รับแล้ว {totalReceived.toLocaleString('th-TH')} จาก {totalQuantity.toLocaleString('th-TH')} ชิ้น</span>
                          <span>{Math.round((totalReceived / totalQuantity) * 100) || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((totalReceived / totalQuantity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {po.goodsReceipts && po.goodsReceipts.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">ประวัติการรับสินค้า:</p>
                        <ul className="text-sm space-y-1">
                          {po.goodsReceipts.map((gr) => (
                            <li key={gr.id} className="text-gray-600">
                              • {gr.receiptNo} - {formatDate(gr.receiptDate)} ({gr.quantity.toLocaleString('th-TH')} ชิ้น)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <div className="w-full md:w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">รวมเป็นเงิน</span>
                      <span>{formatCurrency(po.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ภาษีมูลค่าเพิ่ม (VAT)</span>
                      <span>{formatCurrency(po.vatAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>รวมทั้งสิ้น</span>
                      <span className="text-blue-600">{formatCurrency(po.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  ประวัติการดำเนินการ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">สร้างใบสั่งซื้อ</p>
                      <p className="text-sm text-gray-500">
                        โดย {po.createdBy?.name} วันที่ {formatDateTime(po.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Confirmed */}
                  {po.confirmedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">ยืนยันใบสั่งซื้อ</p>
                        <p className="text-sm text-gray-500">
                          วันที่ {formatDateTime(po.confirmedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shipped */}
                  {po.shippedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Ship className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">จัดส่งสินค้า</p>
                        <p className="text-sm text-gray-500">
                          วันที่ {formatDateTime(po.shippedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Received */}
                  {po.receivedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">รับสินค้า</p>
                        <p className="text-sm text-gray-500">
                          วันที่ {formatDateTime(po.receivedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cancelled */}
                  {po.cancelledAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <Ban className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">ยกเลิก</p>
                        <p className="text-sm text-gray-500">
                          วันที่ {formatDateTime(po.cancelledAt)}
                          {po.cancelledReason && ` - เหตุผล: ${po.cancelledReason}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {/* Edit for Draft */}
          {po.status === 'DRAFT' && (
            <Button
              variant="outline"
              onClick={() => onEdit(po)}
            >
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </Button>
          )}

          {/* Confirm for Draft/Pending */}
          {(po.status === 'DRAFT' || po.status === 'PENDING') && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onAction(po.id, 'confirm')}
              disabled={processingAction === `${po.id}-confirm`}
            >
              {processingAction === `${po.id}-confirm` ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              ยืนยัน PO
            </Button>
          )}

          {/* Ship for Confirmed */}
          {po.status === 'CONFIRMED' && (
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => onAction(po.id, 'ship')}
              disabled={processingAction === `${po.id}-ship`}
            >
              {processingAction === `${po.id}-ship` ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ship className="h-4 w-4 mr-2" />
              )}
              จัดส่ง
            </Button>
          )}

          {/* Receive for Confirmed/Shipped/Partial */}
          {(po.status === 'CONFIRMED' || po.status === 'SHIPPED' || po.status === 'PARTIAL') && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onAction(po.id, 'receive')}
              disabled={processingAction === `${po.id}-receive`}
            >
              {processingAction === `${po.id}-receive` ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              รับสินค้า
            </Button>
          )}

          {/* Cancel for non-completed */}
          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
            <Button
              variant="destructive"
              onClick={() => onAction(po.id, 'cancel')}
              disabled={processingAction === `${po.id}-cancel`}
            >
              {processingAction === `${po.id}-cancel` ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              ยกเลิก
            </Button>
          )}

          {/* Print */}
          <Button
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
