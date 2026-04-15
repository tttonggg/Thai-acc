'use client'

import { useState, useEffect } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Info
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
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'

// Types
interface Customer {
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
  unitPrice?: number
  unit?: string
}

interface InvoiceLine {
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
}

interface InvoiceFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultType?: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
}

const invoiceTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
  CREDIT_NOTE: 'ใบลดหนี้',
  DEBIT_NOTE: 'ใบเพิ่มหนี้',
}

const vatRates = [0, 7, 10]

export function InvoiceForm({ open, onClose, onSuccess, defaultType = 'TAX_INVOICE' }: InvoiceFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState('')

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    type: defaultType,
    reference: '',
    poNumber: '',
    discountAmount: 0,
    discountPercent: 0,
    withholdingRate: 0,
    notes: '',
  })

  const [lines, setLines] = useState<InvoiceLine[]>([
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
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch customers and products on mount
  useEffect(() => {
    if (open) {
      fetchInitialData()
    }
    
    return () => {
      // Cleanup handled by AbortController in fetchInitialData
    }
  }, [open])

  const fetchInitialData = async () => {
    setFetchingData(true)
    const controller = new AbortController()
    
    try {
      const [customersRes, productsRes, invoiceNumRes] = await Promise.all([
        fetch('/api/customers', { signal: controller.signal }),
        fetch('/api/products', { signal: controller.signal }).catch(() => ({ ok: false, json: async () => ({ data: [] }) })),
        fetch('/api/invoices/next-number?type=' + formData.type, { signal: controller.signal }).catch(() => ({ ok: false, json: async () => ({ data: '' }) })),
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.data || [])
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.data || [])
      }

      if (invoiceNumRes.ok) {
        const invoiceNumData = await invoiceNumRes.json()
        setInvoiceNumber(invoiceNumData.data || '')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Error fetching initial data:', error)
    } finally {
      setFetchingData(false)
    }
    
    return () => controller.abort()
  }

  // Calculate totals
  const calculateLineTotals = (line: InvoiceLine): { amount: number; vatAmount: number } => {
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
  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value }

        // Recalculate amounts
        const { amount, vatAmount } = calculateLineTotals(updated)
        updated.amount = amount
        updated.vatAmount = vatAmount

        return updated
      }
      return line
    }))

    // Clear error for this line if exists
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
      updateLine(lineId, 'unitPrice', product.unitPrice || 0)
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = 'กรุณาเลือกลูกค้า'
    }

    if (lines.length === 0) {
      newErrors.lines = 'ต้องมีอย่างน้อย 1 รายการ'
    }

    lines.forEach((line, index) => {
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
        })),
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถบันทึกใบกำกับภาษีได้')
      }

      toast({
        title: 'บันทึกสำเร็จ',
        description: `บันทึก ${invoiceTypeLabels[formData.type]} เลขที่ ${result.data.invoiceNo} แล้ว`,
      })

      // Reset form
      setFormData({
        customerId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        type: defaultType,
        reference: '',
        poNumber: '',
        discountAmount: 0,
        discountPercent: 0,
        withholdingRate: 0,
        notes: '',
      })
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
      ])
      setErrors({})

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting invoice:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกใบกำกับภาษีได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogDescription>
            สร้างใหม่ invoice dialog สำหรับสร้างใบกำกับภาษีใหม่พร้อมรายการสินค้าและการคำนวณยอดรวม
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle className="text-xl">
            สร้าง{invoiceTypeLabels[formData.type]}ใหม่
          </DialogTitle>
          {invoiceNumber && (
            <p className="text-sm text-muted-foreground mt-1">
              เลขที่เอกสาร: {invoiceNumber}
            </p>
          )}
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="customerId" className="required">
                  ลูกค้า *
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, customerId: value }))
                    if (errors.customerId) {
                      setErrors(prev => {
                        const updated = { ...prev }
                        delete updated.customerId
                        return updated
                      })
                    }
                  }}
                  aria-label="เลือกลูกค้า"
                  aria-invalid={errors.customerId ? 'true' : 'false'}
                  aria-describedby={errors.customerId ? 'customerId-error' : undefined}
                >
                  <SelectTrigger
                    id="customerId"
                    className={errors.customerId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="เลือกลูกค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.code} - {customer.name}
                        {customer.taxId && ` (${customer.taxId})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p id="customerId-error" className="text-sm text-destructive mt-1" role="alert">{errors.customerId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="invoiceDate">วันที่เอกสาร</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  aria-label="เลือกวันที่เอกสาร"
                />
              </div>
            </div>

            {/* Reference & PO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                <Input
                  id="reference"
                  placeholder="เลขที่อ้างอิง (ถ้ามี)"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  aria-label="เลขที่อ้างอิง"
                />
              </div>
              <div>
                <Label htmlFor="poNumber">เลขที่ PO</Label>
                <Input
                  id="poNumber"
                  placeholder="เลขที่ Purchase Order (ถ้ามี)"
                  value={formData.poNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                  aria-label="เลขที่ Purchase Order"
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
                  <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
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
                  {lines.map((line, index) => (
                    <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                      {/* Product/Description */}
                      <div className="md:col-span-4 space-y-1">
                        {products.length > 0 && (
                          <Select
                            value={line.productId || ''}
                            onValueChange={(value) => selectProduct(line.id, value)}
                            aria-label="เลือกสินค้า"
                          >
                            <SelectTrigger className="w-full" id={`product-${line.id}`}>
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
                        <Input
                          placeholder="รายการสินค้า/บริการ"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          className={errors[`line_${line.id}_description`] ? 'border-destructive' : ''}
                          id={`description-${line.id}`}
                          aria-label="รายการสินค้าหรือบริการ"
                          aria-invalid={errors[`line_${line.id}_description`] ? 'true' : 'false'}
                          aria-describedby={errors[`line_${line.id}_description`] ? `description-error-${line.id}` : undefined}
                        />
                        {errors[`line_${line.id}_description`] && (
                          <p id={`description-error-${line.id}`} className="text-xs text-destructive" role="alert">{errors[`line_${line.id}_description`]}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={errors[`line_${line.id}_quantity`] ? 'border-destructive' : ''}
                          id={`quantity-${line.id}`}
                          aria-label="จำนวน"
                          aria-invalid={errors[`line_${line.id}_quantity`] ? 'true' : 'false'}
                          aria-describedby={errors[`line_${line.id}_quantity`] ? `quantity-error-${line.id}` : undefined}
                        />
                        {errors[`line_${line.id}_quantity`] && (
                          <p id={`quantity-error-${line.id}`} className="text-xs text-destructive md:hidden mt-1" role="alert">
                            {errors[`line_${line.id}_quantity`]}
                          </p>
                        )}
                      </div>

                      {/* Unit */}
                      <div>
                        <Select
                          value={line.unit}
                          onValueChange={(value) => updateLine(line.id, 'unit', value)}
                          aria-label="หน่วยนับ"
                        >
                          <SelectTrigger className="w-full" id={`unit-${line.id}`}>
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
                          onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={errors[`line_${line.id}_unitPrice`] ? 'border-destructive' : ''}
                          id={`unitPrice-${line.id}`}
                          aria-label="ราคาต่อหน่วย"
                          aria-invalid={errors[`line_${line.id}_unitPrice`] ? 'true' : 'false'}
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
                          onChange={(e) => updateLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="pr-6"
                          id={`discount-${line.id}`}
                          aria-label="ส่วนลด (%)"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>

                      {/* VAT */}
                      <div>
                        <Select
                          value={line.vatRate.toString()}
                          onValueChange={(value) => updateLine(line.id, 'vatRate', parseFloat(value))}
                          aria-label="อัตรา VAT"
                        >
                          <SelectTrigger className="w-full" id={`vatRate-${line.id}`}>
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
                          disabled={lines.length === 1}
                          aria-label="ลบรายการ"
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
                    aria-label="เพิ่มรายการสินค้า"
                  >
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
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
                      <Input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                        aria-label="ส่วนลดเปอร์เซ็นต์"
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
                        onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                        aria-label="ส่วนลดเป็นบาท"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="withholdingRate">หัก ณ ที่จ่าย (%)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground cursor-help" aria-label="ข้อมูลอัตราหัก ณ ที่จ่าย">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-xs mb-2">อัตราหัก ณ ที่จ่าย ภ.ง.ด.53</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                          <span>ค่าบริการ</span><span className="text-right font-medium">3%</span>
                          <span>ค่าเช่า</span><span className="text-right font-medium">5%</span>
                          <span>ค่าบริการวิชาชีพ</span><span className="text-right font-medium">3%</span>
                          <span>ค่าจ้างทำของ</span><span className="text-right font-medium">1%</span>
                          <span>ค่าโฆษณา</span><span className="text-right font-medium">2%</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={formData.withholdingRate.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, withholdingRate: parseFloat(value) }))}
                  aria-label="เลือกอัตราหัก ณ ที่จ่าย"
                >
                  <SelectTrigger id="withholdingRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">ไม่หัก ณ ที่จ่าย</SelectItem>
                    <SelectItem value="1">1% (ค่าจ้างทำของ)</SelectItem>
                    <SelectItem value="2">2% (ค่าโฆษณา)</SelectItem>
                    <SelectItem value="3">3% (ค่าบริการ/วิชาชีพ)</SelectItem>
                    <SelectItem value="5">5% (ค่าเช่า)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Input
                  id="notes"
                  placeholder="หมายเหตุ (ถ้ามี)"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  aria-label="หมายเหตุ"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                aria-busy={loading}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
