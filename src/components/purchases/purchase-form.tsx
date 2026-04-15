'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Save,
  Loader2
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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

interface PurchaseOrderLine {
  id: string
  lineNo: number
  productId?: string
  description: string
  quantity: number
  receivedQty: number
  unit: string
  unitPrice: number
}

interface PurchaseOrder {
  id: string
  orderNo: string
  vendorId: string
  lines: PurchaseOrderLine[]
}

interface ThreeWayMatchResult {
  lineId: string
  poQty: number
  grnQty: number
  invoiceQty: number
  poPrice: number
  invoicePrice: number
  qtyVariancePercent: number
  priceVariancePercent: number
  status: 'MATCH' | 'WARNING' | 'BLOCKED'
  qtyIssue: string
  priceIssue: string
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

interface PurchaseFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultType?: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE'
}

const purchaseTypeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบซื้อ/ใบกำกับภาษีซื้อ',
  RECEIPT: 'ใบเสร็จรับเงินซื้อ',
  DELIVERY_NOTE: 'ใบส่งของซื้อ',
}

const vatRates = [0, 7, 10]

export function PurchaseForm({ open, onClose, onSuccess, defaultType = 'TAX_INVOICE' }: PurchaseFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [purchaseNumber, setPurchaseNumber] = useState('')

  const [formData, setFormData] = useState({
    vendorId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    type: defaultType,
    vendorInvoiceNo: '',
    reference: '',
    poNumber: '',
    discountAmount: 0,
    discountPercent: 0,
    withholdingRate: 0,
    notes: '',
    internalNotes: '',
  })

  const [lines, setLines] = useState<PurchaseLine[]>([
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
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [matchResults, setMatchResults] = useState<ThreeWayMatchResult[]>([])
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)

  // Fetch vendors and products on mount
  useEffect(() => {
    if (open) {
      fetchInitialData()
    }
  }, [open])

  // Fetch PO details when PO number changes
  useEffect(() => {
    if (formData.poNumber && formData.poNumber.trim()) {
      fetchPODetails(formData.poNumber.trim())
    } else {
      setSelectedPO(null)
      setMatchResults([])
    }
  }, [formData.poNumber])

  // Recalculate match results when lines or PO changes
  useEffect(() => {
    if (selectedPO && lines.length > 0) {
      calculateThreeWayMatch()
    } else {
      setMatchResults([])
    }
  }, [selectedPO, lines])

  const fetchInitialData = async () => {
    setFetchingData(true)
    try {
      const [vendorsRes, productsRes] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/products'),
      ])

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json()
        setVendors(vendorsData.data || [])
      }

      // Always set products to an array, even on error
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(Array.isArray(productsData.data) ? productsData.data : [])
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      // Ensure products is always an array
      setProducts([])
    } finally {
      setFetchingData(false)
    }
  }

  const fetchPODetails = async (poNumber: string) => {
    try {
      const res = await fetch(`/api/purchase-orders?orderNo=${poNumber}`)
      if (res.ok) {
        const result = await res.json()
        if (result.data && result.data.length > 0) {
          const po = result.data[0]
          setSelectedPO(po)
          // Pre-fill lines from PO
          if (po.lines && po.lines.length > 0) {
            const poLines: PurchaseLine[] = po.lines.map((line: PurchaseOrderLine, idx: number) => ({
              id: Date.now().toString() + idx,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity - line.receivedQty, // Default to remaining qty
              unit: line.unit,
              unitPrice: line.unitPrice,
              discount: 0,
              vatRate: 7,
              vatAmount: 0,
              amount: 0,
            }))
            setLines(poLines.length > 0 ? poLines : lines)
          }
        } else {
          toast({
            title: 'ไม่พบ PO',
            description: `ไม่พบเลขที่ PO ${poNumber} ในระบบ`,
            variant: 'destructive',
          })
          setSelectedPO(null)
        }
      }
    } catch (error) {
      console.error('Error fetching PO details:', error)
    }
  }

  const calculateThreeWayMatch = () => {
    if (!selectedPO || !selectedPO.lines) return

    const results: ThreeWayMatchResult[] = selectedPO.lines.map((poLine) => {
      // Find matching invoice line by product or description
      const invoiceLine = lines.find(
        (l) => l.productId === poLine.productId || l.description === poLine.description
      )

      const invoiceQty = invoiceLine?.quantity || 0
      const invoicePrice = invoiceLine?.unitPrice || 0

      // Calculate quantity variance
      const qtyDiff = Math.abs(poLine.quantity - invoiceQty)
      const qtyVariancePercent = poLine.quantity > 0 ? (qtyDiff / poLine.quantity) * 100 : 0

      // Calculate price variance
      const priceDiff = Math.abs(poLine.unitPrice - invoicePrice)
      const priceVariancePercent = poLine.unitPrice > 0 ? (priceDiff / poLine.unitPrice) * 100 : 0

      // Determine status
      let status: 'MATCH' | 'WARNING' | 'BLOCKED' = 'MATCH'
      let qtyIssue = ''
      let priceIssue = ''

      if (qtyVariancePercent > 10) {
        status = 'BLOCKED'
        qtyIssue = `ปริมาณต่างกัน ${qtyVariancePercent.toFixed(1)}% (เกินกำหนด 10%)`
      } else if (qtyVariancePercent > 5) {
        status = 'WARNING'
        qtyIssue = `ปริมาณต่างกัน ${qtyVariancePercent.toFixed(1)}%`
      }

      if (priceVariancePercent > 5) {
        status = 'BLOCKED'
        priceIssue = `ราคาต่างกัน ${priceVariancePercent.toFixed(1)}% (เกินกำหนด 5%)`
      } else if (priceVariancePercent > 3) {
        if (status !== 'BLOCKED') status = 'WARNING'
        priceIssue = `ราคาต่างกัน ${priceVariancePercent.toFixed(1)}%`
      }

      return {
        lineId: poLine.id,
        poQty: poLine.quantity,
        grnQty: poLine.receivedQty,
        invoiceQty,
        poPrice: poLine.unitPrice,
        invoicePrice,
        qtyVariancePercent,
        priceVariancePercent,
        status,
        qtyIssue,
        priceIssue,
      }
    })

    setMatchResults(results)
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

    // Check three-way match blocking
    const hasBlockedItems = matchResults.some((r) => r.status === 'BLOCKED')
    if (hasBlockedItems && !overrideReason.trim()) {
      newErrors.threeWayMatch = 'มีรายการที่ไม่ผ่านการตรวจสอบ 3-way match กรุณาระบุเหตุผลในการอนุมัติ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const hasBlockedItems = (): boolean => {
    return matchResults.some((r) => r.status === 'BLOCKED')
  }

  const hasWarningItems = (): boolean => {
    return matchResults.some((r) => r.status === 'WARNING')
  }

  const getMatchStatusBadge = (status: 'MATCH' | 'WARNING' | 'BLOCKED') => {
    switch (status) {
      case 'MATCH':
        return <Badge variant="default" className="bg-green-600">✅ ตรงกัน</Badge>
      case 'WARNING':
        return <Badge variant="default" className="bg-yellow-600">⚠️ แจ้งเตือน</Badge>
      case 'BLOCKED':
        return <Badge variant="destructive">🔴 ระงับ</Badge>
    }
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
        // Include three-way match metadata
        metadata: {
          threeWayMatch: matchResults.length > 0 ? {
            purchaseOrderId: selectedPO?.id,
            purchaseOrderNo: formData.poNumber,
            matchResults,
            hasBlockedItems: hasBlockedItems(),
            hasWarningItems: hasWarningItems(),
            overrideReason: overrideReason || null,
            validatedAt: new Date().toISOString(),
          } : null,
        },
      }

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถบันทึกใบซื้อได้')
      }

      toast({
        title: 'บันทึกสำเร็จ',
        description: `บันทึก ${purchaseTypeLabels[formData.type]} เลขที่ ${result.data.invoiceNo} แล้ว`,
      })

      // Reset form
      setFormData({
        vendorId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        type: defaultType,
        vendorInvoiceNo: '',
        reference: '',
        poNumber: '',
        discountAmount: 0,
        discountPercent: 0,
        withholdingRate: 0,
        notes: '',
        internalNotes: '',
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
      setSelectedPO(null)
      setMatchResults([])
      setOverrideReason('')

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting purchase:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกใบซื้อได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            สร้าง{purchaseTypeLabels[formData.type]}ใหม่
          </DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดใบซื้อ รายการสินค้า และคำนวณยอดรวม ใบซื้อนี้จะถูกบันทึกลงระบบและลงบัญชีการเงิน
          </DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vendor & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                >
                  <SelectTrigger
                    id="vendorId"
                    className={`!h-11 text-base ${errors.vendorId ? 'border-destructive' : ''}`}
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
                <Input
                  id="invoiceDate"
                  type="date"
                  className="!h-11 text-base"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="dueDate">วันครบกำหนด</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="!h-11 text-base"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={formData.invoiceDate}
                />
              </div>
            </div>

            {/* Vendor Invoice No & Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorInvoiceNo">เลขที่ใบกำกับภาษีผู้ขาย</Label>
                <Input
                  id="vendorInvoiceNo"
                  placeholder="เลขที่ใบกำกับภาษีของผู้ขาย"
                  className="!h-11 text-base"
                  value={formData.vendorInvoiceNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorInvoiceNo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                <Input
                  id="reference"
                  placeholder="เลขที่อ้างอิง (ถ้ามี)"
                  className="!h-11 text-base"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>
            </div>

            {/* PO Number */}
            <div>
              <Label htmlFor="poNumber">เลขที่ PO</Label>
              <Input
                id="poNumber"
                placeholder="เลขที่ Purchase Order (ถ้ามี)"
                className="!h-11 text-base"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
              />
            </div>

            {/* Three-Way Match Validation Panel */}
            {matchResults.length > 0 && (
              <Card className={`border-2 ${hasBlockedItems() ? 'border-red-500 bg-red-50' : hasWarningItems() ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>📊 ตรวจสอบ 3-Way Match (PO vs ใบส่งของ vs ใบกำกับภาษี)</span>
                    {hasBlockedItems() ? (
                      <Badge variant="destructive" className="text-base">🔴 ระงับการบันทึก</Badge>
                    ) : hasWarningItems() ? (
                      <Badge variant="default" className="bg-yellow-600 text-base">⚠️ มีคำเตือน</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 text-base">✅ ผ่านการตรวจสอบ</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Match Results Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">ลำดับ</TableHead>
                          <TableHead>รายการ</TableHead>
                          <TableHead className="text-right">PO</TableHead>
                          <TableHead className="text-right">รับแล้ว</TableHead>
                          <TableHead className="text-right">ใบซื้อ</TableHead>
                          <TableHead className="text-right">สถานะปริมาณ</TableHead>
                          <TableHead className="text-right">ราคา PO</TableHead>
                          <TableHead className="text-right">ราคาใบซื้อ</TableHead>
                          <TableHead className="text-center">สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchResults.map((result, idx) => (
                          <TableRow key={result.lineId} className={
                            result.status === 'BLOCKED' ? 'bg-red-100' :
                            result.status === 'WARNING' ? 'bg-yellow-50' : ''
                          }>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell>
                              {selectedPO?.lines.find(l => l.id === result.lineId)?.description || '-'}
                            </TableCell>
                            <TableCell className="text-right">{result.poQty}</TableCell>
                            <TableCell className="text-right">{result.grnQty}</TableCell>
                            <TableCell className="text-right font-medium">
                              {result.invoiceQty}
                              {result.qtyVariancePercent > 5 && (
                                <span className="ml-2 text-xs text-red-600">
                                  ({result.qtyVariancePercent.toFixed(1)}%)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {result.qtyIssue ? (
                                <span className="text-xs text-red-600">{result.qtyIssue}</span>
                              ) : (
                                <span className="text-green-600 text-xs">✅ ตรง</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(result.poPrice)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(result.invoicePrice)}
                              {result.priceVariancePercent > 3 && (
                                <span className="ml-2 text-xs text-red-600">
                                  ({result.priceVariancePercent.toFixed(1)}%)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {getMatchStatusBadge(result.status)}
                              {result.priceIssue && (
                                <div className="mt-1 text-xs text-red-600">{result.priceIssue}</div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Validation Messages */}
                  {hasBlockedItems() && (
                    <Alert className="mt-4 border-red-500 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="font-semibold mb-2">⚠️ ไม่สามารถบันทึกใบซื้อได้</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>ปริมาณหรือราคาต่างกันเกินเกณฑ์ที่กำหนด (ปริมาณ {'>'} 10%, ราคา {'>'} 5%)</li>
                          <li>กรุณาตรวจสอบรายการที่มีปัญหา หรือขออนุมัติพิเศษ</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {hasWarningItems() && !hasBlockedItems() && (
                    <Alert className="mt-4 border-yellow-500 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <div className="font-semibold mb-1">⚠️ มีความแตกต่างระดับคำเตือน</div>
                        <p className="text-sm">ปริมาณหรือราคาต่างกันอยู่ในช่วงที่อนุญาต (ปริมาณ 5-10%, ราคา 3-5%)</p>
                        <p className="text-sm">คุณสามารถบันทึกใบซื้อได้ แต่ควรตรวจสอบความถูกต้อง</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!hasBlockedItems() && !hasWarningItems() && (
                    <Alert className="mt-4 border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="font-semibold">✅ ผ่านการตรวจสอบ 3-Way Match</div>
                        <p className="text-sm">ปริมาณและราคาตรงกับ PO และใบส่งของ สามารถดำเนินการต่อได้</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions for blocked items */}
                  {hasBlockedItems() && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowOverrideDialog(true)}
                      >
                        📝 ขออนุมัติพิเศษ (Override)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          toast({
                            title: 'ส่งกลับไปตรวจสอบ',
                            description: 'กรุณาติดต่อฝ่ายจัดซื้อเพื่อตรวจสอบ PO หรือ GRN',
                          })
                        }}
                      >
                        📧 แจ้งฝ่ายจัดซื้อ (Return to Vendor)
                      </Button>
                    </div>
                  )}

                  {/* Override Reason Input */}
                  {overrideReason && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-semibold text-blue-900 mb-1">📝 เหตุผลการอนุมัติพิเศษ:</div>
                      <p className="text-sm text-blue-800">{overrideReason}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-blue-600 hover:text-blue-800"
                        onClick={() => setOverrideReason('')}
                      >
                        แก้ไขเหตุผล
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  {lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                      {/* Product/Description */}
                      <div className="md:col-span-4 space-y-1">
                        {products.length > 0 && (
                          <Select
                            value={line.productId || ''}
                            onValueChange={(value) => selectProduct(line.id, value)}
                          >
                            <SelectTrigger className="w-full !h-11 text-base">
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
                          className={`!h-11 text-base ${errors[`line_${line.id}_description`] ? 'border-destructive' : ''}`}
                        />
                        {errors[`line_${line.id}_description`] && (
                          <p className="text-xs text-destructive">{errors[`line_${line.id}_description`]}</p>
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
                          className={`!h-11 text-base ${errors[`line_${line.id}_quantity`] ? 'border-destructive' : ''}`}
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
                        >
                          <SelectTrigger className="w-full !h-11 text-base">
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
                          className={`!h-11 text-base ${errors[`line_${line.id}_unitPrice`] ? 'border-destructive' : ''}`}
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
                          className="!h-11 text-base pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>

                      {/* VAT */}
                      <div>
                        <Select
                          value={line.vatRate.toString()}
                          onValueChange={(value) => updateLine(line.id, 'vatRate', parseFloat(value))}
                        >
                          <SelectTrigger className="w-full !h-11 text-base">
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
                          className="h-11 w-11 text-destructive hover:text-destructive"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
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
                      <Input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        className="!h-11 text-base"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountAmount">ส่วนลด (บาท)</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="!h-11 text-base"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="withholdingRate">หัก ณ ที่จ่าย (%)</Label>
                <Select
                  value={formData.withholdingRate.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, withholdingRate: parseFloat(value) }))}
                >
                  <SelectTrigger id="withholdingRate" className="!h-11 text-base">
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
                  className="!h-11 text-base"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="internalNotes">หมายเหตุภายใน</Label>
                <Input
                  id="internalNotes"
                  placeholder="หมายเหตุภายใน (ถ้ามี)"
                  className="!h-11 text-base"
                  value={formData.internalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
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
              >
                ยกเลิก
              </Button>
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
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Override Reason Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ขออนุมัติพิเศษ (Override)</DialogTitle>
            <DialogDescription>
              ระบุเหตุผลในการอนุมัติใบซื้อที่ไม่ผ่านการตรวจสอบ 3-Way Match
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="overrideReason" className="required">เหตุผลการอนุมัติ *</Label>
              <Textarea
                id="overrideReason"
                placeholder="ระบุเหตุผล เช่น: ราคาปรับตามราคาตลาด, ปริมาณเปลี่ยนตามการตรวจสอบจริง, ฯลฯ"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
                className="!min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                เหตุผลนี้จะถูกบันทึกในระบบเพื่อการตรวจสอบภายหลัง
              </p>
            </div>
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                การอนุมัติพิเศษจะต้องได้รับการตรวจสอบจากผู้บังคับบัญชาระดับสูงกว่า
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowOverrideDialog(false)
                setOverrideReason('')
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                if (!overrideReason.trim()) {
                  toast({
                    title: 'กรุณาระบุเหตุผล',
                    description: 'ต้องระบุเหตุผลในการอนุมัติพิเศษ',
                    variant: 'destructive',
                  })
                  return
                }
                setShowOverrideDialog(false)
                toast({
                  title: 'บันทึกเหตุผลแล้ว',
                  description: 'สามารถกดบันทึกใบซื้อได้',
                })
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ยืนยันเหตุผล
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
