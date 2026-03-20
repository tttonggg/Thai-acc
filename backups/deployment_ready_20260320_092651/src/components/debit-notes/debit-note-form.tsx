'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { debitNoteSchema } from '@/lib/validations'
import { useToast } from '@/hooks/use-toast'

interface Vendor { id: string; code: string; name: string }
interface PurchaseInvoice { id: string; invoiceNo: string; totalAmount: number; lines: Array<any> }
interface Product { id: string; code: string; name: string; costPrice: number; vatRate: number }

interface DebitNoteFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DebitNoteForm({ open, onClose, onSuccess }: DebitNoteFormProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof debitNoteSchema>>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: {
      debitNoteDate: new Date().toISOString().split('T')[0],
      reason: 'ADDITIONAL_CHARGES',
      lines: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 7 }],
    },
  })

  const selectedVendorId = form.watch('vendorId')
  const selectedPurchaseId = form.watch('purchaseInvoiceId')
  const lines = form.watch('lines')

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return
      try {
        const [vendorsRes, productsRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/products')
        ])
        const vendorsData = await vendorsRes.json()
        const productsData = await productsRes.json()
        // APIs return { success: true, data: [...] }
        setVendors(Array.isArray(vendorsData.data) ? vendorsData.data : [])
        setProducts(Array.isArray(productsData.data) ? productsData.data : [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [open])

  useEffect(() => {
    const fetchPurchaseInvoices = async () => {
      if (!selectedVendorId) {
        setPurchaseInvoices([])
        return
      }
      try {
        const res = await fetch(`/api/purchases?vendorId=${selectedVendorId}&status=ISSUED,PAID`)
        const data = await res.json()
        setPurchaseInvoices((data.purchases || data).filter((inv: PurchaseInvoice) => inv.status !== 'CANCELLED'))
      } catch (error) {
        console.error('Failed to fetch purchase invoices:', error)
      }
    }
    fetchPurchaseInvoices()
  }, [selectedVendorId])

  useEffect(() => {
    const loadPurchaseLines = async () => {
      if (!selectedPurchaseId) {
        form.setValue('lines', [{ description: '', quantity: 1, unitPrice: 0, vatRate: 7 }])
        return
      }
      const selectedPurchase = purchaseInvoices.find(inv => inv.id === selectedPurchaseId)
      if (selectedPurchase) {
        form.setValue('lines', selectedPurchase.lines.map((line: any) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          productId: line.productId || undefined,
        })))
      }
    }
    loadPurchaseLines()
  }, [selectedPurchaseId, form, purchaseInvoices])

  const addLine = () => {
    const currentLines = form.getValues('lines')
    form.setValue('lines', [...currentLines, { description: '', quantity: 1, unitPrice: 0, vatRate: 7 }])
  }

  const removeLine = (index: number) => {
    const currentLines = form.getValues('lines')
    if (currentLines.length > 1) {
      form.setValue('lines', currentLines.filter((_, i) => i !== index))
    }
  }

  const updateLine = (index: number, field: string, value: any) => {
    const currentLines = form.getValues('lines')
    form.setValue('lines', currentLines.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const totals = lines.reduce((acc, line) => {
    const amount = line.quantity * line.unitPrice
    const vat = amount * (line.vatRate / 100)
    return { subtotal: acc.subtotal + amount, vatAmount: acc.vatAmount + vat, totalAmount: acc.totalAmount + amount + vat }
  }, { subtotal: 0, vatAmount: 0, totalAmount: 0 })

  const validateForm = (): boolean => {
    // Validate vendor selected
    if (!form.getValues('vendorId')) {
      toast({
        title: 'กรุณาเลือกผู้ขาย',
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

  const onSubmit = async (values: z.infer<typeof debitNoteSchema>) => {
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

      const res = await fetch('/api/debit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'สร้างใบเพิ่มหนี้ไม่สำเร็จ')

      toast({ title: 'สำเร็จ', description: `สร้างใบเพิ่มหนี้ ${data.data.debitNoteNo} เรียบร้อยแล้ว` })
      form.reset()
      onSuccess()
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error instanceof Error ? error.message : 'สร้างใบเพิ่มหนี้ไม่สำเร็จ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบเพิ่มหนี้ (Debit Note)</DialogTitle>
          <DialogDescription>สร้างใบเพิ่มหนี้สำหรับผู้ขายเพื่อเพิ่มหนี้จากใบซื้อ</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">ข้อมูลใบเพิ่มหนี้</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ผู้ขาย *</Label>
                  <Select value={form.watch('vendorId')} onValueChange={(v) => form.setValue('vendorId', v)}>
                    <SelectTrigger className="!h-11 text-base"><SelectValue placeholder="เลือกผู้ขาย" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.code} - {vendor.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>วันที่ออกใบเพิ่มหนี้ *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('debitNoteDate') ? new Date(form.watch('debitNoteDate')).toLocaleDateString('th-TH') : <span>เลือกวันที่</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent><Calendar mode="single" selected={new Date(form.watch('debitNoteDate'))} onSelect={(date) => date && form.setValue('debitNoteDate', date.toISOString())} /></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>อ้างอิงใบซื้อ (ถ้ามี)</Label>
                  <Select value={form.watch('purchaseInvoiceId') || ''} onValueChange={(v) => form.setValue('purchaseInvoiceId', v || null)}>
                    <SelectTrigger className="!h-11 text-base"><SelectValue placeholder="เลือกใบซื้อ" /></SelectTrigger>
                    <SelectContent>
                      {purchaseInvoices.map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNo} - ฿{inv.totalAmount.toLocaleString()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>เหตุผล *</Label>
                  <Select value={form.watch('reason')} onValueChange={(v) => form.setValue('reason', v as any)}>
                    <SelectTrigger className="!h-11 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADDITIONAL_CHARGES">ค่าใช้จ่ายเพิ่มเติม</SelectItem>
                      <SelectItem value="RETURNED_GOODS">สินค้าที่คืน</SelectItem>
                      <SelectItem value="PRICE_ADJUSTMENT">ปรับปรุงราคา</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Textarea placeholder="ระบุหมายเหตุ (ถ้ามี)" value={form.watch('notes') || ''} onChange={(e) => form.setValue('notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">รายการที่เพิ่มหนี้</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <h4 className="font-medium">รายการที่ {index + 1}</h4>
                    {lines.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>รายการ *</Label><Input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="ระบุรายการ" /></div>
                    <div className="space-y-2"><Label>สินค้า (ถ้ามี)</Label><Select value={line.productId || ''} onValueChange={(v) => { const p = products.find(x => x.id === v); if (p) { updateLine(index, 'productId', v); updateLine(index, 'unitPrice', p.costPrice); updateLine(index, 'vatRate', p.vatRate); }}}><SelectTrigger className="!h-11 text-base"><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2"><Label>จำนวน *</Label><Input type="number" className="!h-11 text-base" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                    <div className="space-y-2"><Label>ราคาต่อหน่วย *</Label><Input type="number" className="!h-11 text-base" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)} /></div>
                    <div className="space-y-2"><Label>VAT (%)</Label><Input type="number" className="!h-11 text-base" step="0.01" value={line.vatRate} onChange={(e) => updateLine(index, 'vatRate', parseFloat(e.target.value) || 0)} /></div>
                    <div className="space-y-2"><Label>จำนวนเงิน</Label><Input type="text" value={`฿${(line.quantity * line.unitPrice).toLocaleString()}`} disabled /></div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLine} className="w-full"><Plus className="h-4 w-4 mr-2" />เพิ่มรายการ</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">สรุปยอด</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>มูลค่าก่อน VAT:</span><span className="font-medium">฿{totals.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>VAT:</span><span className="font-medium">฿{totals.vatAmount.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>ยอดรวม:</span><span className="text-orange-600">+฿{totals.totalAmount.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          <Alert><AlertDescription>การออกใบเพิ่มหนี้จะเพิ่มหนี้ผู้ขายและบันทึกบัญชีอัตโนมัติ</AlertDescription></Alert>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'ออกใบเพิ่มหนี้'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
