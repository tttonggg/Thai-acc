'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// WHT Categories for PND.53
const WHT_CATEGORIES = [
  { value: 'SERVICE', label: 'ค่าบริการ', rate: 3 },
  { value: 'RENT', label: 'ค่าเช่า', rate: 5 },
  { value: 'PROFESSIONAL', label: 'ค่าบริการวิชาชีพ', rate: 3 },
  { value: 'CONTRACT', label: 'ค่าจ้างทำของ', rate: 1 },
  { value: 'ADVERTISING', label: 'ค่าโฆษณา', rate: 2 },
  { value: 'NONE', label: 'ไม่หักภาษี', rate: 0 },
] as const

type WHTCategory = typeof WHT_CATEGORIES[number]['value']

const formSchema = z.object({
  vendorId: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
  paymentDate: z.string().min(1, 'กรุณาระบุวันที่จ่ายเงิน'),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT', 'OTHER']),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่น้อยกว่า 0'),
  notes: z.string().optional(),
  allocations: z.array(z.object({
    invoiceId: z.string(),
    invoiceNo: z.string(),
    amount: z.number().min(0),
    whtCategory: z.string().optional(),
    whtRate: z.number().min(0).max(100),
    whtAmount: z.number().min(0),
  })).min(1, 'ต้องมีการจัดจ่ายอย่างน้อย 1 รายการ'),
})

type FormValues = z.infer<typeof formSchema>

interface UnpaidInvoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  totalAmount: number
  balance: number
}

interface PaymentFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentForm({ open, onClose, onSuccess }: PaymentFormProps) {
  const [vendors, setVendors] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([])
  const [apBalance, setApBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      amount: 0,
      allocations: [],
    },
  })

  const selectedVendor = form.watch('vendorId')
  const paymentMethod = form.watch('paymentMethod')
  const amount = form.watch('amount') || 0

  // Load vendors and bank accounts on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [vendorsRes, banksRes] = await Promise.all([
          fetch(`/api/vendors?isActive=true`, { credentials: 'include' }),
          fetch(`/api/bank-accounts`, { credentials: 'include' }),
        ])

        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json()
          setVendors(vendorsData.data || vendorsData)
        }

        if (banksRes.ok) {
          const banksData = await banksRes.json()
          setBankAccounts(banksData.data || banksData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (open) fetchData()
  }, [open])

  // Load unpaid invoices when vendor is selected
  useEffect(() => {
    const loadUnpaidInvoices = async () => {
      if (!selectedVendor) {
        setUnpaidInvoices([])
        setApBalance(0)
        return
      }

      try {
        const res = await fetch(`/api/payments/unpaid-invoices?vendorId=${selectedVendor}`, { credentials: 'include' })
        if (res.ok) {
          const response = await res.json()
          // API returns { success: true, data: { invoices: [...], totalAPBalance: ..., vendorId: ... } }
          if (response.success && response.data) {
            setUnpaidInvoices(response.data.invoices || [])
            setApBalance(response.data.totalAPBalance || 0)
          } else {
            // Fallback for backward compatibility
            setUnpaidInvoices(response.invoices || [])
            setApBalance(response.totalAPBalance || 0)
          }
        } else {
          console.error('API returned error:', res.status, res.statusText)
        }
      } catch (error) {
        console.error('Error loading unpaid invoices:', error)
      }
    }
    loadUnpaidInvoices()
  }, [selectedVendor])

  // Auto-allocate to oldest invoices
  const handleAutoAllocate = () => {
    if (unpaidInvoices.length === 0 || amount <= 0) return

    let remaining = amount
    const allocations: any[] = []

    for (const invoice of unpaidInvoices) {
      if (remaining <= 0) break

      const allocateAmount = Math.min(remaining, invoice.balance)
      allocations.push({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: allocateAmount,
        whtCategory: 'SERVICE', // Default to service
        whtRate: 3, // Default 3%
        whtAmount: Math.round((allocateAmount * 3) / 100),
      })

      remaining -= allocateAmount
    }

    form.setValue('allocations', allocations)
  }

  // Pay Full - Select all unpaid invoices with full balance
  const handlePayFull = () => {
    if (unpaidInvoices.length === 0) {
      toast({
        title: 'ไม่มีใบซื้อค้างจ่าย',
        description: 'กรุณาเลือกผู้ขายที่มียอดค้างจ่าย',
        variant: 'destructive',
      })
      return
    }

    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0)
    form.setValue('amount', totalUnpaid)

    const newAllocations = unpaidInvoices.map((invoice) => ({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: invoice.balance,
      whtCategory: 'SERVICE' as WHTCategory,
      whtRate: 3,
      whtAmount: Math.round((invoice.balance * 3) / 100),
    }))
    form.setValue('allocations', newAllocations)

    toast({
      title: 'เลือกจ่ายเต็มจำนวน',
      description: 'ยอดรวม ' + unpaidInvoices.length + ' ใบ = ฿' + totalUnpaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    })
  }

  // Update allocation amount
  const updateAllocationAmount = (index: number, value: number) => {
    const allocations = form.getValues('allocations')
    allocations[index].amount = value
    allocations[index].whtAmount = Math.round((value * allocations[index].whtRate) / 100)
    form.setValue('allocations', allocations)
  }

  // Update WHT category and rate
  const updateWHTCategory = (index: number, category: WHTCategory) => {
    const allocations = form.getValues('allocations')
    allocations[index].whtCategory = category

    // Auto-populate rate based on category
    const categoryConfig = WHT_CATEGORIES.find(c => c.value === category)
    if (categoryConfig) {
      allocations[index].whtRate = categoryConfig.rate
      allocations[index].whtAmount = Math.round((allocations[index].amount * categoryConfig.rate) / 100)
    }

    form.setValue('allocations', allocations)
  }

  // Update WHT rate manually
  const updateWHTRate = (index: number, rate: number) => {
    const allocations = form.getValues('allocations')
    allocations[index].whtRate = rate
    allocations[index].whtAmount = Math.round((allocations[index].amount * rate) / 100)
    form.setValue('allocations', allocations)
  }

  // Calculate totals
  const allocations = form.watch('allocations') || []
  const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
  const totalWHT = allocations.reduce((sum, a) => sum + (a.whtAmount || 0), 0)
  const unallocated = Math.max(0, amount - totalAllocated)

  const validateForm = (values: FormValues): boolean => {
    // Validate vendor selected
    if (!values.vendorId) {
      toast({
        title: 'กรุณาเลือกผู้ขาย',
        variant: 'destructive',
      })
      return false
    }

    // Validate amount > 0
    if (values.amount <= 0) {
      toast({
        title: 'กรุณาระบุจำนวนเงินมากกว่า 0',
        variant: 'destructive',
      })
      return false
    }

    // Validate bank account for transfer/cheque
    if ((values.paymentMethod === 'TRANSFER' || values.paymentMethod === 'CHEQUE') && !values.bankAccountId) {
      toast({
        title: 'กรุณาเลือกบัญชีธนาคาร',
        description: 'วิธีการจ่ายเงินแบบโอนเงินหรือเช็คต้องระบุบัญชีธนาคาร',
        variant: 'destructive',
      })
      return false
    }

    // Validate cheque number for cheque payment
    if (values.paymentMethod === 'CHEQUE' && !values.chequeNo) {
      toast({
        title: 'กรุณาระบุเลขที่เช็ค',
        variant: 'destructive',
      })
      return false
    }

    // Validate at least 1 allocation
    if (!values.allocations || values.allocations.length === 0) {
      toast({
        title: 'กรุณาจัดจ่ายอย่างน้อย 1 รายการ',
        variant: 'destructive',
      })
      return false
    }

    // Validate totalAllocated <= amount
    if (totalAllocated > values.amount) {
      toast({
        title: 'ยอดจัดจ่ายเกินกว่ายอดจ่ายเงิน',
        description: `จัดจ่ายรวม: ฿${(totalAllocated / 100).toLocaleString()} เกินกว่ายอดจ่าย: ฿${(values.amount / 100).toLocaleString()}`,
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const onSubmit = async (values: FormValues) => {
    if (submitting) return

    // Client-side validation
    if (!validateForm(values)) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/payments`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'เกิดข้อผิดพลาด')
      }

      toast({
        title: 'สร้างใบจ่ายเงินสำเร็จ',
        description: `สร้างใบจ่ายเงินเรียบร้อยแล้ว`,
      })
      form.reset()
      onSuccess()
    } catch (error) {
      toast({
        title: 'สร้างใบจ่ายเงินไม่สำเร็จ',
        description: error instanceof Error ? error.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบจ่ายเงิน</DialogTitle>
          <DialogDescription>
            บันทึกการจ่ายเงินเจ้าหนี้และจัดจ่ายใบซื้อ
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">รายละเอียดการจ่ายเงิน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="vendorId">ผู้ขาย</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue('allocations', [])
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="!h-11 text-base" id="vendorId" aria-label="เลือกผู้ขาย">
                                <SelectValue placeholder="เลือกผู้ขาย" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.code} - {v.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="paymentDate">วันที่จ่ายเงิน</FormLabel>
                          <FormControl>
                            <Input id="paymentDate" type="date" {...field} aria-label="เลือกวันที่จ่ายเงิน" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="paymentMethod">วิธีจ่าย</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="!h-11 text-base" id="paymentMethod" aria-label="เลือกวิธีจ่ายเงิน">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CASH">เงินสด</SelectItem>
                              <SelectItem value="TRANSFER">โอนเงิน</SelectItem>
                              <SelectItem value="CHEQUE">เช็ค</SelectItem>
                              <SelectItem value="CREDIT">บัตรเครดิต</SelectItem>
                              <SelectItem value="OTHER">อื่นๆ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(paymentMethod === 'TRANSFER' || paymentMethod === 'CHEQUE') && (
                      <FormField
                        control={form.control}
                        name="bankAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="bankAccountId">บัญชีธนาคาร</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="!h-11 text-base" id="bankAccountId" aria-label="เลือกบัญชีธนาคาร">
                                  <SelectValue placeholder="เลือกบัญชี" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bankAccounts.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.bankName} - {b.accountNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {paymentMethod === 'CHEQUE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="chequeNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="chequeNo">เลขที่เช็ค</FormLabel>
                            <FormControl>
                              <Input id="chequeNo" {...field} aria-label="เลขที่เช็ค" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chequeDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="chequeDate">วันที่เช็ค</FormLabel>
                            <FormControl>
                              <Input id="chequeDate" type="date" {...field} aria-label="เลือกวันที่เช็ค" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="amount">จำนวนเงินรวม</FormLabel>
                        <FormControl>
                          <Input className="!h-11 text-base"
                            id="amount"
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ? (field.value / 100).toFixed(2) : ''}
                            onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100) || 0)}
                            aria-label="จำนวนเงินรวม"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedVendor && apBalance > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
ยอดค้างจ่าย: ฿{(apBalance / 100).toLocaleString()}                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Allocations */}
              {selectedVendor && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">จัดจ่ายใบซื้อ</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md" side="right">
                              <div className="space-y-2">
                                <p className="font-medium">อัตราหัก ณ ที่จ่าย ตาม PND.53:</p>
                                <ul className="text-sm space-y-1">
                                  <li>• ค่าบริการ (Service): 3%</li>
                                  <li>• ค่าเช่า (Rent): 5%</li>
                                  <li>• ค่าบริการวิชาชีพ (Professional): 3%</li>
                                  <li>• ค่าจ้างทำของ (Contract): 1%</li>
                                  <li>• ค่าโฆษณา (Advertising): 2%</li>
                                  <li>• ไม่หักภาษี (No WHT): 0%</li>
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePayFull}
                        disabled={unpaidInvoices.length === 0}
                      >
                        จ่ายเต็มจำนวน ({unpaidInvoices.length} ใบ)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoAllocate}
                        disabled={amount <= 0 || unpaidInvoices.length === 0}
                      >
                        จัดสรรอัตโนมัติ
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {unpaidInvoices.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
ไม่มีใบซื้อค้างจ่าย                    </p>
                    ) : (
                      <div className="space-y-3">
                        {unpaidInvoices.map((invoice) => (
                          <div key={invoice.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{invoice.invoiceNo}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(invoice.invoiceDate).toLocaleDateString('th-TH')}
                                </span>
                              </div>
                              <Badge variant="outline">
ค้างจ่าย ฿{invoice.balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                              <div>
                                <label htmlFor={`allocate-${invoice.id}`} className="text-xs text-gray-500">จัดจ่าย</label>
                                <Input className="!h-11 text-base"
                                  id={`allocate-${invoice.id}`}
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={allocations.find(a => a.invoiceId === invoice.id)?.amount || ''}
                                  onChange={(e) => {
                                    const value = Math.round(parseFloat(e.target.value) * 100) || 0
                                    const index = allocations.findIndex(a => a.invoiceId === invoice.id)
                                    if (index >= 0) {
                                      updateAllocationAmount(index, value)
                                    } else if (value > 0) {
                                      const newAllocations = [...allocations, {
                                        invoiceId: invoice.id,
                                        invoiceNo: invoice.invoiceNo,
                                        amount: value,
                                        whtCategory: 'SERVICE',
                                        whtRate: 3,
                                        whtAmount: Math.round((value * 3) / 100),
                                      }]
                                      form.setValue('allocations', newAllocations)
                                    }
                                  }}
                                  aria-label={`จำนวนเงินจัดจ่ายสำหรับ ${invoice.invoiceNo}`}
                                />
                              </div>

                              <div>
                                <label htmlFor={`whtCategory-${invoice.id}`} className="text-xs text-gray-500">หมวดหมู่ WHT</label>
                                <Select
                                  value={allocations.find(a => a.invoiceId === invoice.id)?.whtCategory || 'SERVICE'}
                                  onValueChange={(value) => {
                                    const category = value as WHTCategory
                                    const index = allocations.findIndex(a => a.invoiceId === invoice.id)
                                    if (index >= 0) {
                                      updateWHTCategory(index, category)
                                    } else {
                                      const categoryConfig = WHT_CATEGORIES.find(c => c.value === category)
                                      const newAllocations = [...allocations, {
                                        invoiceId: invoice.id,
                                        invoiceNo: invoice.invoiceNo,
                                        amount: 0,
                                        whtCategory: category,
                                        whtRate: categoryConfig?.rate || 0,
                                        whtAmount: 0,
                                      }]
                                      form.setValue('allocations', newAllocations)
                                    }
                                  }}
                                  aria-label="เลือกหมวดหมู่หัก ณ ที่จ่าย"
                                >
                                  <SelectTrigger className="!h-11 text-base" id={`whtCategory-${invoice.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {WHT_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label} ({cat.rate}%)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label htmlFor={`whtRate-${invoice.id}`} className="text-xs text-gray-500">อัตรา %</label>
                                <Input className="!h-11 text-base"
                                  id={`whtRate-${invoice.id}`}
                                  type="text"
                                  readOnly
                                  value={`${allocations.find(a => a.invoiceId === invoice.id)?.whtRate || 0}%`}
                                  aria-label="อัตราหัก ณ ที่จ่าย"
                                />
                              </div>

                              <div>
                                <label htmlFor={`whtAmount-${invoice.id}`} className="text-xs text-gray-500">WHT จำนวน</label>
                                <Input className="!h-11 text-base"
                                  id={`whtAmount-${invoice.id}`}
                                  type="text"
                                  readOnly
                                  value={
                                    ((allocations.find(a => a.invoiceId === invoice.id)?.whtAmount || 0) / 100).toLocaleString() || '0.00'
                                  }
                                  aria-label="จำนวนภาษีหัก ณ ที่จ่าย"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    {allocations.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>จัดจ่ายรวม:</span>
                          <span className="font-medium">฿{(totalAllocated / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>หัก ณ ที่จ่ายรวม:</span>
                          <span className="font-medium text-amber-600">-฿{(totalWHT / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                          <span>จ่ายสุทธิ:</span>
                          <span className="text-green-600">฿{((totalAllocated - totalWHT) / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>คงเหลือ (เครดิตเจ้าหนี้):</span>
                          <span>฿{(unallocated / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting} aria-busy={submitting}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting || allocations.length === 0} aria-busy={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                  บันทึก
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
