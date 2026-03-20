'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Plus, Trash2, Save, Send, Loader2, Search } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Types
type RequestPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'

interface Product {
  id: string
  code: string
  name: string
  unit: string
  salePrice: number
  costPrice: number
}

interface Department {
  id: string
  name: string
  code: string
}

interface DepartmentBudget {
  id: string
  name: string
  fiscalYear: number
  remainingAmount: number
  allocatedAmount: number
}

interface Vendor {
  id: string
  name: string
  code: string
}

// Form Schema
const prLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'รายการต้องไม่ว่างเปล่า'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().min(0).max(100).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  suggestedVendor: z.string().optional(),
  notes: z.string().optional(),
})

const purchaseRequestFormSchema = z.object({
  requestDate: z.string(),
  departmentId: z.string().optional(),
  requiredDate: z.string().optional(),
  reason: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']),
  budgetId: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(prLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>

interface PurchaseRequestFormProps {
  initialData?: Partial<PurchaseRequestFormValues>
  onSuccess?: () => void
  onCancel?: () => void
}

export function PurchaseRequestForm({
  initialData,
  onSuccess,
  onCancel,
}: PurchaseRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null)
  const { toast } = useToast()

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: {
      requestDate: new Date().toISOString(),
      priority: 'NORMAL',
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
      fetch('/api/products').then(r => r.json()).then(d => setProducts(d.data || [])),
      fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.data || [])),
      fetch('/api/vendors').then(r => r.json()).then(d => setVendors(d.data || [])),
    ])
  }, [])

  // Fetch budgets when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetch(`/api/departments/${selectedDepartment}/budgets`)
        .then(r => r.json())
        .then(d => setBudgets(d.data || []))
        .catch(() => setBudgets([]))
    }
  }, [selectedDepartment])

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

  // Calculate total
  const calculateTotal = () => {
    const lines = form.watch('lines') || []
    return lines.reduce((sum, line) => {
      const calc = calculateLineAmount(line)
      return sum + calc.amount
    }, 0)
  }

  // Add line
  const addLine = () => {
    const lines = form.getValues('lines')
    const lastLineNo = lines.length > 0 ? lines[lines.length - 1].lineNo || 0 : 0
    form.setValue('lines', [
      ...lines,
      {
        lineNo: lastLineNo + 1,
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
      form.setValue(
        'lines',
        lines.filter((_, i) => i !== index).map((line, i) => ({ ...line, lineNo: i + 1 }))
      )
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
      unitPrice: product.costPrice || 0,
    }
    form.setValue('lines', lines)
  }

  // Submit form
  const onSubmit = async (data: PurchaseRequestFormValues, submitType: 'draft' | 'submit') => {
    setSubmitting(submitType)
    try {
      const lines = data.lines.map(line => ({
        ...line,
        ...calculateLineAmount(line),
      }))

      const payload = {
        ...data,
        lines,
        estimatedAmount: Math.round(calculateTotal() * 100), // Convert to Satang
      }

      const res = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'สร้างใบขอซื้อไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: submitType === 'submit'
          ? 'ส่งใบขอซื้อเพื่อขออนุมัติเรียบร้อยแล้ว'
          : 'บันทึกฉบับร่างเรียบร้อยแล้ว',
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

  const selectedBudget = budgets.find(b => b.id === form.watch('budgetId'))
  const totalAmount = calculateTotal()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => onSubmit(data, 'draft'))} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>สร้างใบขอซื้อ (Purchase Request)</CardTitle>
            <CardDescription>กรอกข้อมูลใบขอซื้อเพื่อขออนุมัติงบประมาณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Request Date */}
              <FormField
                control={form.control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันที่ขอซื้อ</FormLabel>
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
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department */}
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แผนก</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedDepartment(value)
                        form.setValue('budgetId', '')
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.code} - {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ความสำคัญ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="URGENT">
                          <Badge variant="destructive" className="mr-2">เร่งด่วน</Badge>
                          URGENT
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <Badge className="bg-orange-100 text-orange-800 mr-2">สูง</Badge>
                          HIGH
                        </SelectItem>
                        <SelectItem value="NORMAL">
                          <Badge className="bg-blue-100 text-blue-800 mr-2">ปกติ</Badge>
                          NORMAL
                        </SelectItem>
                        <SelectItem value="LOW">
                          <Badge variant="secondary" className="mr-2">ต่ำ</Badge>
                          LOW
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Date */}
              <FormField
                control={form.control}
                name="requiredDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันที่ต้องการ</FormLabel>
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
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Budget */}
              {selectedDepartment && (
                <FormField
                  control={form.control}
                  name="budgetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>งบประมาณ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกงบประมาณ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {budgets.map((budget) => (
                            <SelectItem key={budget.id} value={budget.id}>
                              {budget.name} ({budget.fiscalYear}) - คงเหลือ ฿
                              {(budget.remainingAmount / 100).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedBudget && (
                        <FormDescription>
                          งบคงเหลือ: ฿
                          {(selectedBudget.remainingAmount / 100).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เหตุผลการขอซื้อ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ระบุเหตุผลการขอซื้อ..."
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
                <CardTitle>รายการสินค้า</CardTitle>
                <CardDescription>เพิ่มรายการสินค้าที่ต้องการขอซื้อ</CardDescription>
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
                                    placeholder="รายการสินค้า"
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
                          ฿{calc.amount.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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

            {/* Total */}
            <div className="flex justify-end mt-4">
              <div className="text-right space-y-2">
                <div className="text-sm text-gray-600">
                  วงเงินรวม: ฿
                  {totalAmount.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {selectedBudget && totalAmount > selectedBudget.remainingAmount / 100 && (
                  <div className="text-sm text-red-600 font-medium">
                    ⚠️ เกินงบประมาณที่กำหนด
                  </div>
                )}
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
                  <FormLabel>หมายเหตุ (แสดงในรายงาน)</FormLabel>
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
                  <FormLabel>บันทึกภายใน (ไม่แสดงในรายงาน)</FormLabel>
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
            บันทึกฉบับร่าง
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(data => onSubmit(data, 'submit'))}
            disabled={submitting !== null}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting === 'submit' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            ส่งอนุมัติ
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
                          <p className="text-sm text-gray-500">ราคาทุน</p>
                          <p className="font-medium">
                            ฿
                            {product.costPrice.toLocaleString('th-TH', {
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
