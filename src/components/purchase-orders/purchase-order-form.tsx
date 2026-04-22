'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Package,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  MapPin,
  FileText,
  X,
  Search,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: string
  name: string
  code: string
  taxId?: string
  address?: string
  contactName?: string
  contactPhone?: string
}

interface Product {
  id: string
  code: string
  name: string
  unit: string
  unitPrice: number
  vatRate: number
}

interface PurchaseOrderLine {
  id?: string
  lineNo: number
  productId?: string
  product?: Product
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
  vendor?: Vendor
  expectedDate?: string
  shippingTerms?: string
  paymentTerms?: string
  deliveryAddress?: string
  notes?: string
  lines: PurchaseOrderLine[]
}

interface PurchaseOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  purchaseRequestId?: string
}

const vatRateOptions = [
  { value: 0, label: '0%' },
  { value: 7, label: '7%' },
]

const paymentTermsOptions = [
  { value: 'เงินสด', label: 'เงินสด' },
  { value: 'เครดิต 15 วัน', label: 'เครดิต 15 วัน' },
  { value: 'เครดิต 30 วัน', label: 'เครดิต 30 วัน' },
  { value: 'เครดิต 45 วัน', label: 'เครดิต 45 วัน' },
  { value: 'เครดิต 60 วัน', label: 'เครดิต 60 วัน' },
]

const shippingTermsOptions = [
  { value: 'รับเอง', label: 'รับเอง' },
  { value: 'ส่งทางไปรษณีย์', label: 'ส่งทางไปรษณีย์' },
  { value: 'ส่งทางขนส่ง', label: 'ส่งทางขนส่ง' },
  { value: 'ส่งโดยผู้ขาย', label: 'ส่งโดยผู้ขาย' },
]

export function PurchaseOrderForm({ open, onOpenChange, onSuccess, purchaseRequestId }: PurchaseOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    orderNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    vendorId: '',
    expectedDate: '',
    shippingTerms: '',
    paymentTerms: 'เครดิต 30 วัน',
    deliveryAddress: '',
    notes: '',
    lines: [],
  })

  // Fetch vendors and products
  useEffect(() => {
    if (open) {
      fetchVendors()
      fetchProducts()
      generateOrderNo()
      if (purchaseRequestId) {
        loadFromPR(purchaseRequestId)
      }
    }
  }, [open, purchaseRequestId])

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/vendors`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setVendors(result.data || [])
      }
    } catch {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลผู้จำหน่าย',
        variant: 'destructive',
      })
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setProducts(result.data || [])
      }
    } catch {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลสินค้า',
        variant: 'destructive',
      })
    }
  }

  const generateOrderNo = async () => {
    try {
      const res = await fetch(`/api/document-numbers/PO/next`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setFormData(prev => ({ ...prev, orderNo: result.data }))
      }
    } catch {
      // Fallback: generate manually
      const date = new Date()
      const prefix = `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
      const random = Math.floor(Math.random() * 9000) + 1000
      setFormData(prev => ({ ...prev, orderNo: `${prefix}-${random}` }))
    }
  }

  const loadFromPR = async (prId: string) => {
    try {
      const res = await fetch(`/api/purchase-requests/${prId}`, { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        const pr = result.data
        if (pr && pr.lines) {
          setFormData(prev => ({
            ...prev,
            lines: pr.lines.map((line: any, index: number) => ({
              lineNo: index + 1,
              productId: line.productId,
              product: line.product,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              discount: 0,
              vatRate: 7,
              vatAmount: Math.round(line.quantity * line.unitPrice * 0.07),
              amount: line.quantity * line.unitPrice,
            })),
          }))
        }
      }
    } catch {
      // Silently fail
    }
  }

  const calculateLineAmounts = (line: PurchaseOrderLine): PurchaseOrderLine => {
    const baseAmount = line.quantity * line.unitPrice
    const discountAmount = baseAmount * (line.discount / 100)
    const netAmount = baseAmount - discountAmount
    const vatAmount = Math.round(netAmount * (line.vatRate / 100))
    
    return {
      ...line,
      vatAmount,
      amount: netAmount,
    }
  }

  const calculateTotals = useCallback(() => {
    const lines = formData.lines || []
    const subtotal = lines.reduce((sum, line) => {
      const baseAmount = line.quantity * line.unitPrice
      const discountAmount = baseAmount * (line.discount / 100)
      return sum + (baseAmount - discountAmount)
    }, 0)
    const vatAmount = lines.reduce((sum, line) => sum + line.vatAmount, 0)
    const totalAmount = subtotal + vatAmount
    
    return { subtotal, vatAmount, totalAmount }
  }, [formData.lines])

  const handleAddLine = () => {
    const lines = formData.lines || []
    const newLine: PurchaseOrderLine = {
      lineNo: lines.length + 1,
      description: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      discount: 0,
      vatRate: 7,
      vatAmount: 0,
      amount: 0,
    }
    setFormData(prev => ({
      ...prev,
      lines: [...lines, newLine],
    }))
  }

  const handleRemoveLine = (index: number) => {
    const lines = (formData.lines || []).filter((_, i) => i !== index)
    // Renumber lines
    const renumberedLines = lines.map((line, i) => ({ ...line, lineNo: i + 1 }))
    setFormData(prev => ({ ...prev, lines: renumberedLines }))
  }

  const handleLineChange = (index: number, field: keyof PurchaseOrderLine, value: any) => {
    const lines = [...(formData.lines || [])]
    let line = { ...lines[index], [field]: value }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        line = {
          ...line,
          description: product.name,
          unit: product.unit,
          unitPrice: product.unitPrice,
          vatRate: product.vatRate,
        }
      }
    }
    
    // Recalculate amounts
    line = calculateLineAmounts(line)
    
    lines[index] = line
    setFormData(prev => ({ ...prev, lines }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.vendorId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกผู้จำหน่าย',
        variant: 'destructive',
      })
      return
    }

    if (!formData.lines || formData.lines.length === 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ',
        variant: 'destructive',
      })
      return
    }

    for (const line of formData.lines) {
      if (!line.description) {
        toast({
          title: 'ข้อผิดพลาด',
          description: 'กรุณาระบุรายละเอียดสินค้าทุกรายการ',
          variant: 'destructive',
        })
        return
      }
      if (line.quantity <= 0) {
        toast({
          title: 'ข้อผิดพลาด',
          description: 'จำนวนสินค้าต้องมากกว่า 0',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const totals = calculateTotals()
      
      const payload = {
        ...formData,
        ...totals,
        lines: formData.lines,
        purchaseRequestId,
      }

      const res = await fetch(`/api/purchase-orders`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'สร้างไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: 'สร้างใบสั่งซื้อเรียบร้อยแล้ว',
      })

      onSuccess()
    } catch (err) {
      toast({
        title: 'ข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `฿${(amount / 100).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const selectedVendor = vendors.find(v => v.id === formData.vendorId)
  const totals = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            สร้างใบสั่งซื้อ
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเพื่อสร้างใบสั่งซื้อใหม่
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNo">
                เลขที่ PO <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orderNo"
                value={formData.orderNo}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNo: e.target.value }))}
                placeholder="PO-202603-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">
                วันที่ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                วันที่คาดว่าจะได้รับ
              </Label>
              <Input
                id="expectedDate"
                type="date"
                value={formData.expectedDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Vendor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                ข้อมูลผู้จำหน่าย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  ผู้จำหน่าย <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้จำหน่าย" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVendor && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><span className="text-gray-600">รหัส:</span> {selectedVendor.code}</p>
                  {selectedVendor.taxId && (
                    <p><span className="text-gray-600">เลขประจำตัวผู้เสียภาษี:</span> {selectedVendor.taxId}</p>
                  )}
                  {selectedVendor.contactName && (
                    <p><span className="text-gray-600">ผู้ติดต่อ:</span> {selectedVendor.contactName}</p>
                  )}
                  {selectedVendor.contactPhone && (
                    <p><span className="text-gray-600">โทรศัพท์:</span> {selectedVendor.contactPhone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">
                <CreditCard className="h-4 w-4 inline mr-1" />
                เงื่อนไขการชำระเงิน
              </Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingTerms">
                <Truck className="h-4 w-4 inline mr-1" />
                เงื่อนไขการส่งสินค้า
              </Label>
              <Select
                value={formData.shippingTerms}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shippingTerms: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเงื่อนไข" />
                </SelectTrigger>
                <SelectContent>
                  {shippingTermsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">
                <MapPin className="h-4 w-4 inline mr-1" />
                ที่อยู่จัดส่ง
              </Label>
              <Input
                id="deliveryAddress"
                value={formData.deliveryAddress || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="ที่อยู่จัดส่งสินค้า"
              />
            </div>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                รายการสินค้า
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ลำดับ</TableHead>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead className="text-right w-24">จำนวน</TableHead>
                      <TableHead className="w-24">หน่วย</TableHead>
                      <TableHead className="text-right w-32">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right w-20">ส่วนลด%</TableHead>
                      <TableHead className="text-right w-20">VAT</TableHead>
                      <TableHead className="text-right w-32">จำนวนเงิน</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(formData.lines || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          ไม่มีรายการสินค้า กรุณาเพิ่มรายการ
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.lines?.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{line.lineNo}</TableCell>
                          <TableCell>
                            <Select
                              value={line.productId || ''}
                              onValueChange={(value) => handleLineChange(index, 'productId', value)}
                            >
                              <SelectTrigger className="w-[180px]">
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
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                              placeholder="รายละเอียดสินค้า"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.unit}
                              onChange={(e) => handleLineChange(index, 'unit', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice / 100}
                              onChange={(e) => handleLineChange(index, 'unitPrice', Math.round(parseFloat(e.target.value) * 100) || 0)}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discount}
                              onChange={(e) => handleLineChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.vatRate.toString()}
                              onValueChange={(value) => handleLineChange(index, 'vatRate', parseInt(value))}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {vatRateOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(line.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleRemoveLine(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">รวมเป็นเงิน</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ภาษีมูลค่าเพิ่ม (VAT)</span>
                <span>{formatCurrency(totals.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>รวมทั้งสิ้น</span>
                <span className="text-blue-600">{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="h-4 w-4 inline mr-1" />
              หมายเหตุ
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4 mr-2" />
            )}
            บันทึกใบสั่งซื้อ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
