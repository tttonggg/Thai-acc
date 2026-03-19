'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

// Types
interface Vendor {
  id: string
  code: string
  name: string
  taxId?: string
  branchCode?: string
}

interface Product {
  id: string
  code: string
  name: string
  nameEn?: string
  costPrice?: number
  unit?: string
  vatRate?: number
}

interface PurchaseLine {
  id: string
  productId?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  vatRate: number
  vatAmount: number
  amount: number
  notes?: string
}

interface Purchase {
  id: string
  invoiceNo: string
  vendorId: string
  invoiceDate: string
  dueDate?: string
  vendorInvoiceNo?: string
  type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE'
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'POSTED'
  reference?: string
  poNumber?: string
  discountAmount: number
  discountPercent: number
  withholdingRate: number
  notes?: string
  internalNotes?: string
  lines: PurchaseLine[]
  subtotal: number
  vatAmount: number
  totalAmount: number
}

interface PurchaseEditDialogProps {
  purchaseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const purchaseTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบซื้อ/ใบกำกับภาษีซื้อ',
  RECEIPT: 'ใบเสร็จรับเงินซื้อ',
  DELIVERY_NOTE: 'ใบส่งของซื้อ',
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
  POSTED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const vatRates = [0, 7, 10]

export function PurchaseEditDialog({ purchaseId, open, onOpenChange, onSuccess }: PurchaseEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [fetchingPurchase, setFetchingPurchase] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [purchase, setPurchase] = useState<Purchase | null>(null)

  const [formData, setFormData] = useState({
    vendorId: '',
    invoiceDate: '',
    dueDate: '',
    type: 'TAX_INVOICE' as const,
    status: 'DRAFT' as const,
    vendorInvoiceNo: '',
    reference: '',
    poNumber: '',
    discountAmount: 0,
    discountPercent: 0,
    withholdingRate: 0,
    notes: '',
    internalNotes: '',
  })

  const [lines, setLines] = useState<PurchaseLine[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if editing is restricted
  const isEditingRestricted = purchase?.status === 'PAID' || purchase?.status === 'CANCELLED' || purchase?.status === 'POSTED'
  const isIssuedWarning = purchase?.status === 'ISSUED'

  // Fetch vendors, products, and purchase data on mount
  useEffect(() => {
    if (open) {
      fetchInitialData()
    }
  }, [open, purchaseId])

  const fetchInitialData = async () => {
    setFetchingData(true)
    setFetchingPurchase(true)
    try {
      const [vendorsRes, productsRes, purchaseRes] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/products').catch(() => ({ ok: false, json: async () => ({ data: [] }) })),
        fetch(`/api/purchases/${purchaseId}`),
      ])

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json()
        setVendors(vendorsData.data || [])
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.data || [])
      }

      if (purchaseRes.ok) {
        const purchaseData = await purchaseRes.json()
        const purchase = purchaseData?.data

        if (!purchase) {
          throw new Error('ไม่พบข้อมูลใบซื้อ')
        }

        setPurchase(purchase)

        // Populate form data
        setFormData({
          vendorId: purchase.vendorId || '',
          invoiceDate: purchase.invoiceDate ? purchase.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: purchase.dueDate ? purchase.dueDate.split('T')[0] : '',
          type: purchase.type || 'TAX_INVOICE',
          status: purchase.status || 'DRAFT',
          vendorInvoiceNo: purchase.vendorInvoiceNo || '',
          reference: purchase.reference || '',
          poNumber: purchase.poNumber || '',
          discountAmount: purchase.discountAmount || 0,
          discountPercent: purchase.discountPercent || 0,
          withholdingRate: purchase.withholdingRate || 0,
          notes: purchase.notes || '',
          internalNotes: purchase.internalNotes || '',
        })

        // Populate lines
        if (purchase.lines && purchase.lines.length > 0) {
          setLines(purchase.lines.map((line: any) => ({
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
            notes: line.notes || '',
          })))
        } else {
          setLines([{
            id: '1',
            description: '',
            quantity: 1,
            unit: 'ชิ้น',
            unitPrice: 0,
            discount: 0,
            vatRate: 7,
            vatAmount: 0,
            amount: 0,
          }])
        }
      } else {
        const errorData = await purchaseRes.json()
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลใบซื้อได้')
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถดึงข้อมูลได้',
        variant: 'destructive',
      })
      onOpenChange(false)
    } finally {
      setFetchingData(false)
      setFetchingPurchase(false)
    }
  }

  // Calculate totals
  const calculateLineTotals = (line: PurchaseLine): { amount: number; vatAmount: number } => {
    const beforeDiscount = line.quantity * line.unitPrice
    const discountAmount = beforeDiscount * (line.discount / 100)
    const afterDiscount = beforeDiscount - discountAmount
    const vatAmount = afterDiscount * (line.vatRate / 100)
    const amount = afterDiscount

    return { amount, vatAmount }
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalVat = 0

    lines.forEach(line => {
      const { amount, vatAmount } = calculateLineTotals(line)
      subtotal += amount
      totalVat += vatAmount
    })

    const discountAmount = subtotal * (formData.discountPercent / 100) + formData.discountAmount
    const afterDiscount = subtotal - discountAmount
    const vat = totalVat
    const grandTotal = afterDiscount + vat
    const withholdingAmount = grandTotal * (formData.withholdingRate / 100)
    const netTotal = grandTotal - withholdingAmount

    return {
      subtotal,
      totalVat: vat,
      discountAmount,
      grandTotal,
      withholdingAmount,
      netTotal,
    }
  }

  const totals = calculateTotals()

  // Update line
  const updateLine = (id: string, field: keyof PurchaseLine, value: any) => {
    setLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value }

        const { amount, vatAmount } = calculateLineTotals(updated)
        updated.amount = amount
        updated.vatAmount = vatAmount

        return updated
      }
      return line
    }))

    if (errors[`line_${id}_${field}`]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[`line_${id}_${field}`]
        return updated
      })
    }
  }

  // Add new line
  const addLine = () => {
    const newLine: PurchaseLine = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      discount: 0,
      vatRate: 7,
      vatAmount: 0,
      amount: 0,
    }
    setLines(prev => [...prev, newLine])
  }

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length === 1) {
      toast({
        title: 'ไม่สามารถลบรายการได้',
        description: 'ต้องมีอย่างน้อย 1 รายการ',
        variant: 'destructive',
      })
      return
    }
    setLines(prev => prev.filter(line => line.id !== id))
  }

  // Select product
  const selectProduct = (lineId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      updateLine(lineId, 'productId', product.id)
      updateLine(lineId, 'description', product.name)
      updateLine(lineId, 'unit', product.unit || 'ชิ้น')
      updateLine(lineId, 'unitPrice', product.costPrice || 0)
      updateLine(lineId, 'vatRate', product.vatRate || 7)
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.vendorId) {
      newErrors.vendorId = 'กรุณาเลือกผู้ขาย'
    }

    if (lines.length === 0) {
      newErrors.lines = 'ต้องมีอย่างน้อย 1 รายการ'
    }

    lines.forEach((line) => {
      if (!line.description.trim()) {
        newErrors[`line_${line.id}_description`] = 'กรุณาระบุรายการสินค้า'
      }
      if (line.quantity <= 0) {
        newErrors[`line_${line.id}_quantity`] = 'จำนวนต้องมากกว่า 0'
      }
      if (line.unitPrice < 0) {
        newErrors[`line_${line.id}_unitPrice`] = 'ราคาต้องไม่ติดลบ'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'กรุณาตรวจสอบข้อมูล',
        description: 'มีข้อมูลที่ต้องกรอกไม่ครบถ้วน',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        lines: lines.map(line => ({
          productId: line.productId || null,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          discount: line.discount,
          vatRate: line.vatRate,
          vatAmount: line.vatAmount,
          amount: line.amount,
          notes: line.notes,
        })),
      }

      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตใบซื้อได้')
      }

      toast({
        title: 'อัปเดตสำเร็จ',
        description: `อัปเดต ${purchaseTypeLabels[formData.type]} เลขที่ ${result.data.invoiceNo} แล้ว`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating purchase:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปเดตใบซื้อได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            แก้ไข{purchase ? purchaseTypeLabels[purchase.type] : ''} - {purchase?.invoiceNo}
          </DialogTitle>
          {purchase && (
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[purchase.status]}>
                {statusLabels[purchase.status]}
              </Badge>
            </div>
          )}
        </DialogHeader>

        {fetchingPurchase ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status-based alerts */}
            {isIssuedWarning && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ใบซื้อถูกออกแล้ว การแก้ไขอาจกระทบการคำนวณภาษี
                </AlertDescription>
              </Alert>
            )}

            {isEditingRestricted && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {purchase?.status === 'PAID' && 'ไม่สามารถแก้ไขใบที่จ่ายแล้ว'}
                  {purchase?.status === 'POSTED' && 'ไม่สามารถแก้ไขใบที่ลงบัญชีแล้ว'}
                  {purchase?.status === 'CANCELLED' && 'ไม่สามารถแก้ไขใบที่ยกเลิกแล้ว'}
                </AlertDescription>
              </Alert>
            )}

            {/* Invoice Number (Read-only) */}
            <div>
              <Label htmlFor="invoiceNo">เลขที่เอกสาร</Label>
              <Input className="!h-11 text-base"
                id="invoiceNo"
                value={purchase?.invoiceNo || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Vendor & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="vendorId" className="required">
                  ผู้ขาย *
                </Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, vendorId: value }))
                    if (errors.vendorId) {
                      setErrors(prev => {
                        const updated = { ...prev }
                        delete updated.vendorId
                        return updated
                      })
                    }
                  }}
                  disabled={isEditingRestricted}
                >
                  <SelectTrigger
                    id="vendorId"
                    className={errors.vendorId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="เลือกผู้ขาย" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.code} - {vendor.name}
                        {vendor.taxId && ` (${vendor.taxId})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendorId && (
                  <p className="text-sm text-destructive mt-1">{errors.vendorId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="invoiceDate">วันที่เอกสาร</Label>
                <Input className="!h-11 text-base"
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isEditingRestricted}
                />
              </div>

              <div>
                <Label htmlFor="dueDate">วันครบกำหนด</Label>
                <Input className="!h-11 text-base"
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={formData.invoiceDate}
                  disabled={isEditingRestricted}
                />
              </div>
            </div>

            {/* Vendor Invoice No & Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorInvoiceNo">เลขที่ใบกำกับภาษีผู้ขาย</Label>
                <Input className="!h-11 text-base"
                  id="vendorInvoiceNo"
                  placeholder="เลขที่ใบกำกับภาษีของผู้ขาย"
                  value={formData.vendorInvoiceNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorInvoiceNo: e.target.value }))}
                  disabled={isEditingRestricted}
                />
              </div>
              <div>
                <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                <Input className="!h-11 text-base"
                  id="reference"
                  placeholder="เลขที่อ้างอิง (ถ้ามี)"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  disabled={isEditingRestricted}
                />
              </div>
            </div>

            {/* PO Number */}
            <div>
              <Label htmlFor="poNumber">เลขที่ PO</Label>
              <Input className="!h-11 text-base"
                id="poNumber"
                placeholder="เลขที่ Purchase Order (ถ้ามี)"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                disabled={isEditingRestricted}
              />
            </div>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายการสินค้า/บริการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lines */}
                  {lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                      {/* Product/Description */}
                      <div className="md:col-span-4 space-y-1">
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
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Input className="!h-11 text-base"
                          placeholder="รายการสินค้า/บริการ"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          className={errors[`line_${line.id}_description`] ? 'border-destructive' : ''}
                          disabled={isEditingRestricted}
                        />
                        {errors[`line_${line.id}_description`] && (
                          <p className="text-xs text-destructive">{errors[`line_${line.id}_description`]}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <Input className="!h-11 text-base"
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={errors[`line_${line.id}_quantity`] ? 'border-destructive' : ''}
                          disabled={isEditingRestricted}
                        />
                        {errors[`line_${line.id}_quantity`] && (
                          <p className="text-xs text-destructive md:hidden mt-1">
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
                        <Input className="!h-11 text-base"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={errors[`line_${line.id}_unitPrice`] ? 'border-destructive' : ''}
                          disabled={isEditingRestricted}
                        />
                      </div>

                      {/* Discount */}
                      <div className="relative">
                        <Input className="!h-11 text-base"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="0"
                          value={line.discount}
                          onChange={(e) => updateLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="pr-6"
                          disabled={isEditingRestricted}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>

                      {/* VAT */}
                      <div>
                        <Select
                          value={line.vatRate.toString()}
                          onValueChange={(value) => updateLine(line.id, 'vatRate', parseFloat(value))}
                          disabled={isEditingRestricted}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {vatRates.map(rate => (
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
                    <Plus className="h-4 w-4 mr-2" />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountPercent">ส่วนลด (%)</Label>
                      <Input className="!h-11 text-base"
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                        disabled={isEditingRestricted}
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountAmount">ส่วนลด (บาท)</Label>
                      <Input className="!h-11 text-base"
                        id="discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
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

                  <div className="flex justify-between text-lg font-bold border-t pt-2">
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
                        <span className="text-green-600">{formatCurrency(totals.netTotal)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Withholding Tax & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="withholdingRate">หัก ณ ที่จ่าย (%)</Label>
                <Select
                  value={formData.withholdingRate.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, withholdingRate: parseFloat(value) }))}
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
                <Input className="!h-11 text-base"
                  id="notes"
                  placeholder="หมายเหตุ (ถ้ามี)"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isEditingRestricted}
                />
              </div>

              <div>
                <Label htmlFor="internalNotes">หมายเหตุภายใน</Label>
                <Input className="!h-11 text-base"
                  id="internalNotes"
                  placeholder="หมายเหตุภายใน (ถ้ามี)"
                  value={formData.internalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                  disabled={isEditingRestricted}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      บันทึกการแก้ไข
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
