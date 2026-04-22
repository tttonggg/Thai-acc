'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { Plus, Trash2, Save, Send, Loader2, Search, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { quotationSchema, quotationLineSchema } from '@/lib/validations'

// Types
interface Product {
  id: string
  code: string
  name: string
  unit: string
  salePrice: number
  costPrice: number
}

interface Customer {
  id: string
  name: string
  code: string
  taxId?: string
  creditDays?: number
}

type QuotationFormValues = z.infer<typeof quotationSchema>

interface QuotationFormProps {
  initialData?: Partial<QuotationFormValues> & { id?: string }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuotationForm({
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: QuotationFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [submitting, setSubmitting] = useState<'draft' | 'send' | null>(null)
  const { toast } = useToast()

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotationDate: new Date().toISOString(),
      validUntil: addDays(new Date(), 30).toISOString(),
      vatRate: 7,
      discountAmount: 0,
      discountPercent: 0,
      lines: [
        {
          description: '',
          quantity: 1,
          unit: 'ชิ้น',
          unitPrice: 0,
          discount: 0,
          vatRate: 7,
        },
      ],
      ...initialData,
    },
  })

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch(`/api/products`, { credentials: 'include' }).then(r => r.json()).then(d => setProducts(d.data || [])),
      fetch(`/api/customers`, { credentials: 'include' }).then(r => r.json()).then(d => setCustomers(d.data || [])),
    ])
  }, [])

  // Calculate line amount
  const calculateLineAmount = (line: any) => {
    const subtotal = line.quantity * line.unitPrice
    const discountAmount = subtotal * (line.discount / 100)
    const afterDiscount = subtotal - discountAmount
    const vatAmount = afterDiscount * (line.vatRate / 100)
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      amount: Math.round((afterDiscount + vatAmount) * 100) / 100,
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const lines = form.watch('lines') || []
    const discountPercent = form.watch('discountPercent') || 0
    const discountAmount = form.watch('discountAmount') || 0
    const vatRate = form.watch('vatRate') || 7

    const subtotal = lines.reduce((sum, line) => {
      const calc = calculateLineAmount(line)
      return sum + calc.subtotal
    }, 0)

    const lineDiscountTotal = lines.reduce((sum, line) => {
      const calc = calculateLineAmount(line)
      return sum + calc.discountAmount
    }, 0)

    const subtotalAfterLineDiscount = subtotal - lineDiscountTotal

    // Calculate document-level discount
    const docDiscountPercentAmount = subtotalAfterLineDiscount * (discountPercent / 100)
    const totalDiscount = lineDiscountTotal + docDiscountPercentAmount + discountAmount
    const afterDiscount = subtotal - totalDiscount

    const vatAmount = afterDiscount * (vatRate / 100)
    const totalAmount = afterDiscount + vatAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      lineDiscountTotal: Math.round(lineDiscountTotal * 100) / 100,
      docDiscountPercentAmount: Math.round(docDiscountPercentAmount * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      afterDiscount: Math.round(afterDiscount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    }
  }

  // Add line
  const addLine = () => {
    const lines = form.getValues('lines')
    form.setValue('lines', [
      ...lines,
      {
        description: '',
        quantity: 1,
        unit: 'ชิ้น',
        unitPrice: 0,
        discount: 0,
        vatRate: 7,
      },
    ])
  }

  // Remove line
  const removeLine = (index: number) => {
    const lines = form.getValues('lines')
    if (lines.length > 1) {
      form.setValue('lines', lines.filter((_, i) => i !== index))
    }
  }

  // Select product
  const selectProduct = (index: number, product: Product) => {
    const lines = form.getValues('lines')
    lines[index] = {
      ...lines[index],
      productId: product.id,
      description: product.name,
      unit: product.unit,
      unitPrice: product.salePrice || 0,
    }
    form.setValue('lines', lines)
  }

  // Submit form
  const onSubmit = async (data: QuotationFormValues, submitType: 'draft' | 'send') => {
    setSubmitting(submitType)
    try {
      const totals = calculateTotals()
      const lines = data.lines.map((line, index) => ({
        ...line,
        lineNo: index + 1,
        ...calculateLineAmount(line),
      }))

      const payload = {
        ...data,
        lines,
        subtotal: Math.round(totals.subtotal * 100), // Convert to Satang
        discountAmount: Math.round(totals.totalDiscount * 100),
        vatRate: data.vatRate,
        vatAmount: Math.round(totals.vatAmount * 100),
        totalAmount: Math.round(totals.totalAmount * 100),
      }

      // Create or update quotation
      const url = mode === 'edit' && initialData?.id
        ? `/api/quotations/${initialData.id}`
        : '/api/quotations'

      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'บันทึกใบเสนอราคาไม่สำเร็จ')
      }

      // Send quotation if requested
      if (submitType === 'send' && result.data?.id) {
        const sendRes = await fetch(`/api/quotations/${result.data.id}/send`, { credentials: 'include', 
          method: 'POST',
        })

        const sendResult = await sendRes.json()

        if (!sendRes.ok) {
          throw new Error(sendResult.error || 'ส่งใบเสนอราคาไม่สำเร็จ')
        }
      }

      toast({
        title: 'สำเร็จ',
        description: submitType === 'send'
          ? mode === 'edit'
            ? 'อัปเดตและส่งใบเสนอราคาเรียบร้อยแล้ว'
            : 'สร้างและส่งใบเสนอราคาเรียบร้อยแล้ว'
          : mode === 'edit'
            ? 'อัปเดตใบเสนอราคาเรียบร้อยแล้ว'
            : 'บันทึกใบเสนอราคาเรียบร้อยแล้ว',
      })

      if (onSuccess) onSuccess()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'กรุณาลองอีกครั้ง',
      })
    } finally {
      setSubmitting(null)
    }
  }

  const totals = calculateTotals()
  const selectedCustomer = customers.find(c => c.id === form.watch('customerId'))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => onSubmit(data, 'draft'))} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'edit' ? 'แก้ไขใบเสนอราคา (Quotation)' : 'สร้างใบเสนอราคา (Quotation)'}
            </CardTitle>
            <CardDescription>
              {mode === 'edit'
                ? 'แก้ไขข้อมูลใบเสนอราคา (สามารถแก้ไขได้เฉพาะสถานะร่าง/แก้ไข/ปฏิเสธ)'
                : 'กรอกข้อมูลใบเสนอราคาเพื่อส่งให้ลูกค้า'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Quotation Date */}
              <FormField
                control={form.control}
                name="quotationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันที่เสนอราคา</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd/MM/yyyy')
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valid Until */}
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันหมดอายุ *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'dd/MM/yyyy')
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          initialFocus
                          disabled={(date) => {
                            const quotationDate = form.watch('quotationDate')
                            return quotationDate
                              ? date <= new Date(quotationDate)
                              : date < new Date()
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ลูกค้า *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกลูกค้า" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.code} - {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer && (
                      <FormDescription>
                        {selectedCustomer.taxId && `เลขประจำตัวผู้เสียภาษี: ${selectedCustomer.taxId}`}
                        {selectedCustomer.creditDays && ` | เครดิต: ${selectedCustomer.creditDays} วัน`}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Person */}
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ผู้ติดต่อ</FormLabel>
                    <FormControl>
                      <Input placeholder="ชื่อผู้ติดต่อ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference */}
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อ้างอิง</FormLabel>
                    <FormControl>
                      <Input placeholder="เลขที่อ้างอิง..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Discount and VAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ส่วนลด (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ส่วนลด (บาท)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อัตราภาษีมูลค่าเพิ่ม (%)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseFloat(v))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terms */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เงื่อนไข</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เงื่อนไขการชำระเงินและการส่งมอบ..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายการสินค้า/บริการ</CardTitle>
                <CardDescription>เพิ่มรายการที่ต้องการเสนอราคา</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">ลำดับ</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="w-24">จำนวน</TableHead>
                    <TableHead>หน่วย</TableHead>
                    <TableHead className="w-32">ราคา/หน่วย</TableHead>
                    <TableHead className="w-20">ส่วนลด%</TableHead>
                    <TableHead className="w-20">VAT%</TableHead>
                    <TableHead className="w-32 text-right">จำนวนเงิน</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch('lines')?.map((line, index) => {
                    const calc = calculateLineAmount(line)
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <ProductSelector
                            products={products}
                            onSelect={(product) => selectProduct(index, product)}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="รายการสินค้า/บริการ"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.vatRate`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(v) => field.onChange(parseFloat(v))}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="7">7%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              ฿{calc.amount.toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            {calc.vatAmount > 0 && (
                              <div className="text-xs text-blue-600">
                                +VAT ฿{calc.vatAmount.toLocaleString('th-TH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(index)}
                            disabled={form.watch('lines')?.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-full md:w-96 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ยอดรวมสินค้า:</span>
                  <span className="font-medium">
                    ฿{totals.subtotal.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {totals.lineDiscountTotal > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>ส่วนลดต่อรายการ:</span>
                    <span>
                      -฿{totals.lineDiscountTotal.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {totals.docDiscountPercentAmount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>ส่วนลดเปอร์เซ็นต์:</span>
                    <span>
                      -฿{totals.docDiscountPercentAmount.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {form.watch('discountAmount') > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>ส่วนลดบาท:</span>
                    <span>
                      -฿{form.watch('discountAmount').toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">หลังหักส่วนลด:</span>
                  <span className="font-medium">
                    ฿{totals.afterDiscount.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-blue-600">
                  <span>VAT {form.watch('vatRate')}%:</span>
                  <span>
                    ฿{totals.vatAmount.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>ยอดรวมสุทธิ:</span>
                  <span className="text-green-600">
                    ฿{totals.totalAmount.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (แสดงในใบเสนอราคา)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="หมายเหตุเพิ่มเติม..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="internalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บันทึกภายใน (ไม่แสดงในใบเสนอราคา)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="บันทึกภายใน..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              ยกเลิก
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit(data => onSubmit(data, 'draft'))}
            disabled={submitting !== null}
          >
            {submitting === 'draft' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'edit' ? 'อัปเดตร่าง' : 'บันทึกร่าง'}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(data => onSubmit(data, 'send'))}
            disabled={submitting !== null}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting === 'send' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {mode === 'edit' ? 'อัปเดตและส่ง' : 'บันทึกและส่ง'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Product Selector Component
function ProductSelector({
  products,
  onSelect,
}: {
  products: Product[]
  onSelect: (product: Product) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        เลือกสินค้า...
      </Button>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เลือกสินค้า</DialogTitle>
              <DialogDescription>
                เลือกสินค้าจากรายการสินค้าในระบบ
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="ค้นหาชื่อสินค้าหรือรหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="max-h-[400px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่พบสินค้า
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          onSelect(product)
                          setOpen(false)
                        }}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            รหัส: {product.code} | หน่วย: {product.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">ราคาขาย</p>
                          <p className="font-medium">
                            ฿
                            {product.salePrice.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
