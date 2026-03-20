'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

const receiptSchema = z.object({
  receiptDate: z.string().min(1, 'กรุณาระบุวันที่'),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  notes: z.string().optional(),
  allocations: z.array(z.object({
    invoiceId: z.string(),
    invoiceNo: z.string(),
    amount: z.number().min(0),
    whtRate: z.number().min(0).max(100),
    whtAmount: z.number().min(0),
    balance: z.number(),
  })).optional(),
})

type ReceiptFormValues = z.infer<typeof receiptSchema>

interface Receipt {
  id: string
  receiptNo: string
  receiptDate: string
  customerId: string
  customer: any
  paymentMethod: string
  bankAccountId?: string
  bankAccount?: any
  chequeNo?: string
  chequeDate?: string
  amount: number
  whtAmount: number
  unallocated: number
  notes?: string
  status: string
  allocations: Array<{
    id: string
    invoiceId: string
    invoice: {
      id: string
      invoiceNo: string
      invoiceDate: string
      totalAmount: number
    }
    amount: number
    whtRate: number
    whtAmount: number
  }>
}

interface ReceiptFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  receipt?: Receipt
}

export function ReceiptForm({ open, onClose, onSuccess, receipt }: ReceiptFormProps) {
  const [customers, setCustomers] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const { toast } = useToast()

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      customerId: receipt?.customerId || '',
      paymentMethod: (receipt?.paymentMethod as any) || 'CASH',
      bankAccountId: receipt?.bankAccountId || '',
      chequeNo: receipt?.chequeNo || '',
      chequeDate: receipt?.chequeDate ? new Date(receipt.chequeDate).toISOString().split('T')[0] : '',
      amount: receipt?.amount || 0,
      notes: receipt?.notes || '',
      allocations: [],
    }
  })

  const paymentMethod = form.watch('paymentMethod')
  const amount = form.watch('amount') || 0
  const allocations = form.watch('allocations') || []

  // Fetch customers and bank accounts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, bankAccountsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/bank-accounts'),
        ])

        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData.data || [])
        }

        if (bankAccountsRes.ok) {
          const bankAccountsData = await bankAccountsRes.json()
          setBankAccounts(bankAccountsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  // Load existing receipt data
  useEffect(() => {
    if (receipt) {
      setSelectedCustomerId(receipt.customerId)
      form.setValue('allocations', receipt.allocations.map(a => ({
        invoiceId: a.invoiceId,
        invoiceNo: a.invoice.invoiceNo,
        amount: a.amount,
        whtRate: a.whtRate,
        whtAmount: a.whtAmount,
        balance: a.invoice.totalAmount,
      })))
    }
  }, [receipt, form])

  // Fetch unpaid invoices when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const fetchUnpaidInvoices = async () => {
        try {
          const res = await fetch(`/api/receipts/unpaid-invoices?customerId=${selectedCustomerId}`)
          if (res.ok) {
            const data = await res.json()
            setUnpaidInvoices(data.data || [])
          }
        } catch (error) {
          console.error('Error fetching unpaid invoices:', error)
        }
      }
      fetchUnpaidInvoices()
    }
  }, [selectedCustomerId])

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId)
    form.setValue('customerId', customerId)
    form.setValue('allocations', []) // Clear allocations when customer changes
  }

  const handlePaymentMethodChange = (method: string) => {
    form.setValue('paymentMethod', method as any)
    // Reset bank account if switching to cash
    if (method === 'CASH') {
      form.setValue('bankAccountId', '')
    }
  }

  const addAllocation = (invoice: any) => {
    const currentAllocations = allocations || []
    const existingIndex = currentAllocations.findIndex(a => a.invoiceId === invoice.id)

    if (existingIndex >= 0) {
      return // Already allocated
    }

    const totalAllocated = currentAllocations.reduce((sum, a) => sum + a.amount, 0)
    const remaining = amount - totalAllocated
    const allocateAmount = Math.min(remaining, invoice.balance)

    if (allocateAmount <= 0) return

    form.setValue('allocations', [
      ...currentAllocations,
      {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: allocateAmount,
        whtRate: 0,
        whtAmount: 0,
        balance: invoice.balance,
      }
    ])
  }

  const updateAllocationAmount = (index: number, newAmount: number) => {
    const currentAllocations = [...allocations]
    const allocation = currentAllocations[index]

    const whtAmount = newAmount * (allocation.whtRate / 100)

    currentAllocations[index] = {
      ...allocation,
      amount: newAmount,
      whtAmount,
    }

    form.setValue('allocations', currentAllocations)
  }

  const updateAllocationWhtRate = (index: number, newRate: number) => {
    const currentAllocations = [...allocations]
    const allocation = currentAllocations[index]

    const whtAmount = allocation.amount * (newRate / 100)

    currentAllocations[index] = {
      ...allocation,
      whtRate: newRate,
      whtAmount,
    }

    form.setValue('allocations', currentAllocations)
  }

  const removeAllocation = (index: number) => {
    const currentAllocations = [...allocations]
    currentAllocations.splice(index, 1)
    form.setValue('allocations', currentAllocations)
  }

  const autoAllocate = () => {
    if (unpaidInvoices.length === 0 || amount <= 0) return

    const newAllocations: any[] = []
    let remaining = amount

    for (const invoice of unpaidInvoices) {
      if (remaining <= 0) break

      const allocateAmount = Math.min(remaining, invoice.balance)
      newAllocations.push({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: allocateAmount,
        whtRate: 0,
        whtAmount: 0,
        balance: invoice.balance,
      })

      remaining -= allocateAmount
    }

    form.setValue('allocations', newAllocations)
  }

  const validateForm = (values: ReceiptFormValues): boolean => {
    // Validate customer selected
    if (!values.customerId) {
      toast({
        title: 'กรุณาเลือกลูกค้า',
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

    // Validate at least 1 allocation
    if (!allocations || allocations.length === 0) {
      toast({
        title: 'กรุณาจัดจ่ายอย่างน้อย 1 รายการ',
        variant: 'destructive',
      })
      return false
    }

    // Validate totalAllocated <= amount
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0)
    if (totalAllocated > values.amount) {
      toast({
        title: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน',
        description: `จัดจ่ายรวม: ฿${totalAllocated.toLocaleString()} เกินกว่ายอดรับ: ฿${values.amount.toLocaleString()}`,
        variant: 'destructive',
      })
      return false
    }

    // Validate bank account for transfer/cheque
    if ((values.paymentMethod === 'TRANSFER' || values.paymentMethod === 'CHEQUE') && !values.bankAccountId) {
      toast({
        title: 'กรุณาเลือกบัญชีธนาคาร',
        description: 'วิธีการชำระเงินแบบโอนเงินหรือเช็คต้องระบุบัญชีธนาคาร',
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

    return true
  }

  const onSubmit = async (values: ReceiptFormValues) => {
    if (loading) return

    // Client-side validation
    if (!validateForm(values)) return

    setLoading(true)
    try {
      const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0)

      if (totalAllocated > values.amount) {
        toast({
          title: 'ผิดพลาด',
          description: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน',
          variant: 'destructive'
        })
        return
      }

      if ((values.paymentMethod === 'TRANSFER' || values.paymentMethod === 'CHEQUE') && !values.bankAccountId) {
        toast({
          title: 'ผิดพลาด',
          description: 'กรุณาระบุบัญชีธนาคาร',
          variant: 'destructive'
        })
        return
      }

      if (values.paymentMethod === 'CHEQUE' && !values.chequeNo) {
        toast({
          title: 'ผิดพลาด',
          description: 'กรุณาระบุเลขที่เช็ค',
          variant: 'destructive'
        })
        return
      }

      const url = receipt ? `/api/receipts/${receipt.id}` : '/api/receipts'
      const method = receipt ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          allocations: allocations.map(a => ({
            invoiceId: a.invoiceId,
            amount: a.amount,
            whtRate: a.whtRate,
            whtAmount: a.whtAmount,
          }))
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถบันทึกได้')
      }

      toast({
        title: 'สำเร็จ',
        description: receipt ? 'แก้ไขใบเสร็จรับเงินเรียบร้อยแล้ว' : 'สร้างใบเสร็จรับเงินเรียบร้อยแล้ว',
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถบันทึกได้',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0)
  const totalWht = allocations.reduce((sum, a) => sum + a.whtAmount, 0)
  const unallocated = amount - totalAllocated

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดการรับเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel htmlFor="receiptDate">วันที่รับเงิน</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                              id="receiptDate"
                              aria-label="เลือกวันที่รับเงิน"
                            >
                              {field.value ? (
                                new Date(field.value).toLocaleDateString('th-TH')
                              ) : (
                                <span>เลือกวันที่</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value)}
                            onSelect={(date) => field.setValue(date?.toISOString().split('T')[0] || '')}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="customerId">ลูกค้า</FormLabel>
                      <Select onValueChange={handleCustomerChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="!h-11 text-base" id="customerId" aria-label="เลือกลูกค้า">
                            <SelectValue placeholder="เลือกลูกค้า" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.code} - {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <FormLabel htmlFor="paymentMethod">วิธีการชำระเงิน</FormLabel>
                      <Select onValueChange={handlePaymentMethodChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="!h-11 text-base" id="paymentMethod" aria-label="เลือกวิธีการชำระเงิน">
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
                        <FormLabel>บัญชีธนาคาร</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="!h-11 text-base">
                              <SelectValue placeholder="เลือกบัญชีธนาคาร" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber}
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
                        <FormLabel>เลขที่เช็ค</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chequeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>วันที่เช็ค</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  new Date(field.value).toLocaleDateString('th-TH')
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
                              onSelect={(date) => field.setValue(date?.toISOString().split('T')[0] || '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                    <FormLabel>จำนวนเงินรับโดยสิ้นเชิง</FormLabel>
                    <FormControl>
                      <Input className="!h-11 text-base"
                        type="number"
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Allocation */}
          {selectedCustomerId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>จัดจ่ายใบกำกับภาษี</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    ยอดรวม: ฿{amount.toLocaleString()} | จัดจ่ายแล้ว: ฿{totalAllocated.toLocaleString()} | คงเหลือ: ฿{unallocated.toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoAllocate}
                  disabled={amount <= 0 || unpaidInvoices.length === 0}
                  aria-label="จัดจ่ายอัตโนมัติ"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  จัดจ่ายอัตโนมัติ
                </Button>
              </CardHeader>
              <CardContent>
                {unpaidInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่มีใบกำกับภาษีค้างจ่าย
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เลขที่</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead className="text-right">ยอดรวม</TableHead>
                        <TableHead className="text-right">ค้างจ่าย</TableHead>
                        <TableHead className="text-right">จัดจ่าย</TableHead>
                        <TableHead className="text-right">หัก ณ ที่จ่าย (%)</TableHead>
                        <TableHead className="text-right">ภาษีหัก ณ ที่จ่าย</TableHead>
                        <TableHead aria-label="การจัดการ"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidInvoices.map((invoice: any) => {
                        const allocation = allocations?.find(a => a.invoiceId === invoice.id)
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoiceNo}</TableCell>
                            <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('th-TH')}</TableCell>
                            <TableCell className="text-right">฿{invoice.totalAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">฿{invoice.balance.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {allocation ? (
                                <Input className="!h-11 text-base"
                                  type="number"
                                  value={allocation.amount}
                                  onChange={(e) => updateAllocationAmount(
                                    allocations.indexOf(allocation),
                                    parseFloat(e.target.value) || 0
                                  )}
                                  className="w-24 text-right"
                                  aria-label={`จำนวนเงินจัดจ่ายสำหรับ ${invoice.invoiceNo}`}
                                />
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addAllocation(invoice)}
                                  disabled={unallocated <= 0}
                                  aria-label={`เพิ่มการจัดจ่ายสำหรับ ${invoice.invoiceNo}`}
                                >
                                  <Plus className="h-3 w-3" aria-hidden="true" />
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {allocation ? (
                                <Select
                                  value={allocation.whtRate.toString()}
                                  onValueChange={(val) => updateAllocationWhtRate(
                                    allocations.indexOf(allocation),
                                    parseFloat(val)
                                  )}
                                  aria-label="อัตราหัก ณ ที่จ่าย"
                                >
                                  <SelectTrigger className="!h-11 text-base" className="w-20" aria-label="เลือกอัตรา WHT">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="1">1%</SelectItem>
                                    <SelectItem value="3">3%</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {allocation ? `฿${allocation.whtAmount.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell>
                              {allocation && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeAllocation(allocations.indexOf(allocation))}
                                  aria-label={`ลบการจัดจ่าย ${invoice.invoiceNo}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {amount > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ยอดรับเงินรวม</span>
                    <span className="font-semibold">฿{amount.toLocaleString()}</span>
                  </div>
                  {totalAllocated > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>จัดจ่ายใบกำกับภาษี</span>
                        <span>฿{totalAllocated.toLocaleString()}</span>
                      </div>
                      {totalWht > 0 && (
                        <div className="flex justify-between">
                          <span>ภาษีหัก ณ ที่จ่าย</span>
                          <span>฿{totalWht.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  {unallocated > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>เครดิตคงเหลือ</span>
                      <span>฿{unallocated.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>ยอดสุทธิ</span>
                    <span>฿{amount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} aria-busy={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
