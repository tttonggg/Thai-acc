'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Trash2, Search } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { creditNoteSchema } from '@/lib/validations'
import { useToast } from '@/hooks/use-toast'

interface Customer {
  id: string
  code: string
  name: string
  taxId?: string
}

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  totalAmount: number
  lines: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    productId?: string | null
  }>
}

interface Product {
  id: string
  code: string
  name: string
  salePrice: number
  vatRate: number
  unit: string
}

interface CreditNoteFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  creditNoteId?: string
}

export function CreditNoteForm({ open, onClose, onSuccess, creditNoteId }: CreditNoteFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchProduct, setSearchProduct] = useState('')
  const { toast } = useToast()

  const form = useForm<z.infer<typeof creditNoteSchema>>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      creditNoteDate: new Date().toISOString().split('T')[0],
      reason: 'RETURN',
      lines: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 7, returnStock: false }],
    },
  })

  const selectedCustomerId = form.watch('customerId')
  const selectedInvoiceId = form.watch('invoiceId')
  const lines = form.watch('lines')

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers')
        const data = await res.json()
        // API returns { success: true, data: [...] }
        setCustomers(Array.isArray(data.data) ? data.data : [])
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      }
    }
    if (open) fetchCustomers()
  }, [open])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        // API returns { success: true, data: [...] }
        setProducts(Array.isArray(data.data) ? data.data : [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }
    if (open) fetchProducts()
  }, [open])

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedCustomerId) {
        setInvoices([])
        return
      }
      try {
        const res = await fetch(`/api/invoices?customerId=${selectedCustomerId}&status=ISSUED,PAID`)
        const data = await res.json()
        setInvoices((data.data || data).filter((inv: Invoice) => inv.status !== 'CANCELLED'))
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      }
    }
    fetchInvoices()
  }, [selectedCustomerId])

  useEffect(() => {
    const loadInvoiceLines = async () => {
      if (!selectedInvoiceId) {
        form.setValue('lines', [{ description: '', quantity: 1, unitPrice: 0, vatRate: 7, returnStock: false }])
        return
      }

      const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId)
      if (selectedInvoice) {
        form.setValue('lines', selectedInvoice.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          productId: line.productId || undefined,
          returnStock: false,
        })))
      }
    }
    loadInvoiceLines()
  }, [selectedInvoiceId, form, invoices])

  const addLine = () => {
    const currentLines = form.getValues('lines')
    form.setValue('lines', [
      ...currentLines,
      { description: '', quantity: 1, unitPrice: 0, vatRate: 7, returnStock: false },
    ])
  }

  const removeLine = (index: number) => {
    const currentLines = form.getValues('lines')
    if (currentLines.length > 1) {
      form.setValue('lines', currentLines.filter((_, i) => i !== index))
    }
  }

  const updateLine = (index: number, field: string, value: any) => {
    const currentLines = form.getValues('lines')
    const updatedLine = { ...currentLines[index], [field]: value }

    // Calculate amount and VAT
    if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
      const amount = updatedLine.quantity * updatedLine.unitPrice
      updatedLine.amount = amount
    }

    form.setValue('lines', currentLines.map((line, i) => (i === index ? updatedLine : line)))
  }

  const calculateTotals = () => {
    let subtotal = 0
    let vatAmount = 0

    lines.forEach(line => {
      const lineAmount = line.quantity * line.unitPrice
      const lineVat = lineAmount * (line.vatRate / 100)
      subtotal += lineAmount
      vatAmount += lineVat
    })

    return { subtotal, vatAmount, totalAmount: subtotal + vatAmount }
  }

  const totals = calculateTotals()

  const validateForm = (): boolean => {
    // Validate customer selected
    if (!form.getValues('customerId')) {
      toast({
        title: 'กรุณาเลือกลูกค้า',
        variant: 'destructive',
      })
      return false
    }

    // Validate at least 1 line
    const currentLines = form.getValues('lines')
    if (!currentLines || currentLines.length === 0) {
      toast({
        title: 'กรุณาเพิ่มรายการ',
        variant: 'destructive',
      })
      return false
    }

    // Validate each line
    for (let i = 0; i < currentLines.length; i++) {
      const line = currentLines[i]
      
      if (!line.description || line.description.trim() === '') {
        toast({
          title: `รายการที่ ${i + 1}: กรุณาระบุรายการ`,
          variant: 'destructive',
        })
        return false
      }

      if (line.quantity <= 0) {
        toast({
          title: `รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`,
          variant: 'destructive',
        })
        return false
      }

      if (line.unitPrice < 0) {
        toast({
          title: `รายการที่ ${i + 1}: ราคาต่อหน่วยต้องไม่ติดลบ`,
          variant: 'destructive',
        })
        return false
      }
    }

    return true
  }

  const onSubmit = async (values: z.infer<typeof creditNoteSchema>) => {
    if (loading) return

    // Client-side validation
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = {
        ...values,
        lines: values.lines.map(line => ({
          ...line,
          amount: line.quantity * line.unitPrice,
          vatAmount: line.quantity * line.unitPrice * (line.vatRate / 100),
        })),
        subtotal: totals.subtotal,
        vatRate: 7,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
      }

      const res = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'สร้างใบลดหนี้ไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: `สร้างใบลดหนี้ ${data.data.creditNoteNo} เรียบร้อยแล้ว`,
      })

      form.reset()
      onSuccess()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'สร้างใบลดหนี้ไม่สำเร็จ',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.code.toLowerCase().includes(searchProduct.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบลดหนี้ (Credit Note)</DialogTitle>
          <DialogDescription>สร้างใบลดหนี้สำหรับลูกค้าเพื่อลดหนี้จากใบกำกับภาษี</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลใบลดหนี้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">ลูกค้า *</Label>
                  <Select
                    value={form.watch('customerId')}
                    onValueChange={(value) => form.setValue('customerId', value)}
                    aria-label="เลือกลูกค้า"
                    aria-invalid={form.formState.errors.customerId ? 'true' : 'false'}
                    aria-describedby={form.formState.errors.customerId ? 'customerId-error' : undefined}
                  >
                    <SelectTrigger className="!h-11 text-base" id="customerId">
                      <SelectValue placeholder="เลือกลูกค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.code} - {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.customerId && (
                    <p id="customerId-error" className="text-sm text-red-500" role="alert">{form.formState.errors.customerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditNoteDate">วันที่ออกใบลดหนี้ *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-normal"
                        id="creditNoteDate"
                        aria-label="เลือกวันที่ออกใบลดหนี้"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {form.watch('creditNoteDate') ? (
                          new Date(form.watch('creditNoteDate')).toLocaleDateString('th-TH')
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(form.watch('creditNoteDate'))}
                        onSelect={(date) => date && form.setValue('creditNoteDate', date.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.creditNoteDate && (
                    <p id="creditNoteDate-error" className="text-sm text-red-500" role="alert">{form.formState.errors.creditNoteDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceId">อ้างอิงใบกำกับภาษี (ถ้ามี)</Label>
                  <Select
                    value={form.watch('invoiceId') || ''}
                    onValueChange={(value) => form.setValue('invoiceId', value || null)}
                    aria-label="เลือกใบกำกับภาษีอ้างอิง"
                  >
                    <SelectTrigger className="!h-11 text-base" id="invoiceId">
                      <SelectValue placeholder="เลือกใบกำกับภาษี" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNo} - ฿{invoice.totalAmount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">เหตุผล *</Label>
                  <Select
                    value={form.watch('reason')}
                    onValueChange={(value) => form.setValue('reason', value as any)}
                    aria-label="เลือกเหตุผล"
                    aria-invalid={form.formState.errors.reason ? 'true' : 'false'}
                    aria-describedby={form.formState.errors.reason ? 'reason-error' : undefined}
                  >
                    <SelectTrigger className="!h-11 text-base" id="reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RETURN">คืนสินค้า</SelectItem>
                      <SelectItem value="DISCOUNT">ส่วนลด</SelectItem>
                      <SelectItem value="ALLOWANCE">ค่าเสียโอกาส</SelectItem>
                      <SelectItem value="CANCELLATION">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.reason && (
                    <p id="reason-error" className="text-sm text-red-500" role="alert">{form.formState.errors.reason.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  value={form.watch('notes') || ''}
                  onChange={(e) => form.setValue('notes', e.target.value)}
                  aria-label="หมายเหตุ"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการที่ลดหนี้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium" id={`line-heading-${index}`}>รายการที่ {index + 1}</h4>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                        aria-label={`ลบรายการที่ ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`description-${index}`}>รายการ *</Label>
                      <Input className="!h-11 text-base"
                        id={`description-${index}`}
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="ระบุรายการ"
                        aria-label={`รายการที่ ${index + 1}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`product-${index}`}>สินค้า (ถ้ามี)</Label>
                      <Select
                        value={line.productId || ''}
                        onValueChange={(value) => {
                          const product = products.find(p => p.id === value)
                          if (product) {
                            updateLine(index, 'productId', value)
                            updateLine(index, 'unitPrice', product.salePrice)
                            updateLine(index, 'vatRate', product.vatRate)
                          }
                        }}
                        aria-label="เลือกสินค้า"
                      >
                        <SelectTrigger className="!h-11 text-base" id={`product-${index}`}>
                          <SelectValue placeholder="เลือกสินค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          <Input className="!h-11 text-base"
                            placeholder="ค้นหา..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            className="mb-2"
                          />
                          {filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>จำนวน *</Label>
                      <Input className="!h-11 text-base"
                        id={`quantity-${index}`}
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                        aria-label="จำนวน"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`unitPrice-${index}`}>ราคาต่อหน่วย *</Label>
                      <Input className="!h-11 text-base"
                        id={`unitPrice-${index}`}
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        aria-label="ราคาต่อหน่วย"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`vatRate-${index}`}>อัตรา VAT (%)</Label>
                      <Input className="!h-11 text-base"
                        id={`vatRate-${index}`}
                        type="number"
                        step="0.01"
                        value={line.vatRate}
                        onChange={(e) => updateLine(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        aria-label="อัตรา VAT"
                      />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>จำนวนเงิน</Label>
                  <Input className="!h-11 text-base"
                    id={`amount-${index}`}
                    type="text"
                    value={`฿${(line.quantity * line.unitPrice).toLocaleString()}`}
                    disabled
                    aria-label="จำนวนเงิน"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`returnStock-${index}`}
                  checked={line.returnStock || false}
                  onChange={(e) => updateLine(index, 'returnStock', e.target.checked)}
                  className="rounded"
                  aria-label="คืนสินค้าเข้าสต็อก"
                />
                <Label htmlFor={`returnStock-${index}`} className="text-sm">
                  คืนสินค้าเข้าสต็อก
                </Label>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addLine} className="w-full" aria-label="เพิ่มรายการ">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            เพิ่มรายการ
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">สรุปยอด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>มูลค่าก่อน VAT:</span>
            <span className="font-medium">฿{totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT:</span>
            <span className="font-medium">฿{totals.vatAmount.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>ยอดรวม:</span>
            <span className="text-red-600">-฿{totals.totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription role="status">
          การออกใบลดหนี้จะลดหนี้ลูกค้าและบันทึกบัญชีอัตโนมัติ
          {lines.some(l => l.returnStock) && ' และคืนสินค้าเข้าสต็อกตามที่ระบุ'}
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading} aria-busy={loading}>
          ยกเลิก
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading} aria-busy={loading}>
          {loading ? 'กำลังบันทึก...' : 'ออกใบลดหนี้'}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
)
}
