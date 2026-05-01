'use client';

// TODO: Consider splitting this large form (1184 lines) following the invoice-list pattern
// See: src/components/invoices/invoice-list-virtual.tsx for virtualization reference
// Consider extracting: line-item-editor, payment-allocation, receipt-details sections

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Save, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const receiptSchema = z.object({
  receiptDate: z.string().min(1, 'กรุณาระบุวันที่'),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  notes: z.string().optional(),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string(),
        invoiceNo: z.string(),
        amount: z.number().min(0),
        whtRate: z.number().min(0).max(100),
        whtAmount: z.number().min(0),
        balance: z.number(),
      })
    )
    .optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

interface Receipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  customerId: string;
  customer: any;
  paymentMethod: string;
  bankAccountId?: string;
  bankAccount?: any;
  chequeNo?: string;
  chequeDate?: string;
  amount: number;
  whtAmount: number;
  unallocated: number;
  notes?: string;
  status: string;
  allocations: Array<{
    id: string;
    invoiceId: string;
    invoice: {
      id: string;
      invoiceNo: string;
      invoiceDate: string;
      totalAmount: number;
    };
    amount: number;
    whtRate: number;
    whtAmount: number;
  }>;
}

interface ReceiptFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  receipt?: Receipt;
}

// Calculate aging days and status
const getAgingStatus = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return {
      status: 'overdue',
      days: Math.abs(daysUntilDue),
      color: 'destructive' as const,
      icon: AlertCircle,
    };
  } else if (daysUntilDue <= 7) {
    return { status: 'approaching', days: daysUntilDue, color: 'secondary' as const, icon: Clock };
  } else {
    return { status: 'current', days: daysUntilDue, color: 'default' as const, icon: CheckCircle2 };
  }
};

export function ReceiptForm({ open, onClose, onSuccess, receipt }: ReceiptFormProps) {
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [quickFillInvoiceId, setQuickFillInvoiceId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      customerId: receipt?.customerId || '',
      paymentMethod: (receipt?.paymentMethod as any) || 'CASH',
      bankAccountId: receipt?.bankAccountId || '',
      chequeNo: receipt?.chequeNo || '',
      chequeDate: receipt?.chequeDate
        ? new Date(receipt.chequeDate).toISOString().split('T')[0]
        : '',
      amount: receipt?.amount || 0,
      notes: receipt?.notes || '',
      allocations: [],
    },
  });

  const paymentMethod = form.watch('paymentMethod');
  const amount = form.watch('amount') || 0;
  const allocations = form.watch('allocations') || [];

  // Fetch customers and bank accounts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, bankAccountsRes] = await Promise.all([
          fetch(`/api/customers`, { credentials: 'include' }),
          fetch(`/api/bank-accounts`, { credentials: 'include' }),
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.data || []);
        }

        if (bankAccountsRes.ok) {
          const bankAccountsData = await bankAccountsRes.json();
          setBankAccounts(bankAccountsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Load existing receipt data
  useEffect(() => {
    if (receipt) {
      setSelectedCustomerId(receipt.customerId);
      form.setValue(
        'allocations',
        receipt.allocations.map((a) => ({
          invoiceId: a.invoiceId,
          invoiceNo: a.invoice.invoiceNo,
          amount: a.amount,
          whtRate: a.whtRate,
          whtAmount: a.whtAmount,
          balance: a.invoice.totalAmount,
        }))
      );
    }
  }, [receipt, form]);

  // Fetch unpaid invoices when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const fetchUnpaidInvoices = async () => {
        try {
          const res = await fetch(
            `/api/receipts/unpaid-invoices?customerId=${selectedCustomerId}`,
            { credentials: 'include' }
          );
          if (res.ok) {
            const data = await res.json();
            // Sort by due date (oldest first)
            const sorted = (data.data || []).sort(
              (a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
            setUnpaidInvoices(sorted);
          }
        } catch (error) {
          console.error('Error fetching unpaid invoices:', error);
        }
      };
      fetchUnpaidInvoices();
    }
  }, [selectedCustomerId]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    form.setValue('customerId', customerId);
    form.setValue('allocations', []);
    setSelectedInvoiceId('');
  };

  const handlePaymentMethodChange = (method: string) => {
    form.setValue('paymentMethod', method as any);
    if (method === 'CASH') {
      form.setValue('bankAccountId', '');
    }
  };

  const getSelectedAllocation = () => {
    if (!selectedInvoiceId) return null;
    return allocations?.find((a) => a.invoiceId === selectedInvoiceId) || null;
  };

  const updateSelectedAllocation = (updates: Partial<any>) => {
    const currentAllocations = [...allocations];
    const index = currentAllocations.findIndex((a) => a.invoiceId === selectedInvoiceId);

    if (index >= 0) {
      const allocation = currentAllocations[index];

      // Recalculate WHT if amount or rate changed
      let newAmount = allocation.amount;
      let newRate = allocation.whtRate;
      let newWhtAmount = allocation.whtAmount;

      if ('amount' in updates) {
        newAmount = updates.amount!;
        newWhtAmount = (newAmount * newRate) / 100;
      }
      if ('whtRate' in updates) {
        newRate = updates.whtRate!;
        newWhtAmount = (newAmount * newRate) / 100;
      }
      if ('whtAmount' in updates) {
        newWhtAmount = updates.whtAmount!;
      }

      currentAllocations[index] = {
        ...allocation,
        amount: newAmount,
        whtRate: newRate,
        whtAmount: newWhtAmount,
        ...updates,
      };

      form.setValue('allocations', currentAllocations);
    }
  };

  const addAllocation = (invoice: any) => {
    const currentAllocations = allocations || [];
    const existingIndex = currentAllocations.findIndex((a) => a.invoiceId === invoice.id);

    if (existingIndex >= 0) {
      setSelectedInvoiceId(invoice.id);
      return;
    }

    const totalAllocated = currentAllocations.reduce((sum, a) => sum + a.amount, 0);
    const remaining = amount - totalAllocated;
    const allocateAmount = Math.min(remaining, invoice.balance);

    if (allocateAmount <= 0) {
      toast({
        title: 'ไม่สามารถจัดจ่ายได้',
        description: 'ยอดเงินคงเหลือไม่เพียงพอ',
        variant: 'destructive',
      });
      return;
    }

    form.setValue('allocations', [
      ...currentAllocations,
      {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: allocateAmount,
        whtRate: 0,
        whtAmount: 0,
        balance: invoice.balance,
      },
    ]);

    setSelectedInvoiceId(invoice.id);
  };

  const removeAllocation = () => {
    if (!selectedInvoiceId) return;

    const currentAllocations = [...allocations];
    const index = currentAllocations.findIndex((a) => a.invoiceId === selectedInvoiceId);

    if (index >= 0) {
      currentAllocations.splice(index, 1);
      form.setValue('allocations', currentAllocations);
      setSelectedInvoiceId('');
    }
  };

  const autoAllocate = () => {
    if (unpaidInvoices.length === 0 || amount <= 0) return;

    const newAllocations: any[] = [];
    let remaining = amount;

    for (const invoice of unpaidInvoices) {
      if (remaining <= 0) break;

      const allocateAmount = Math.min(remaining, invoice.balance);
      newAllocations.push({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: allocateAmount,
        whtRate: 0,
        whtAmount: 0,
        balance: invoice.balance,
      });

      remaining -= allocateAmount;
    }

    form.setValue('allocations', newAllocations);
    setSelectedInvoiceId('');

    toast({
      title: 'จัดจ่ายอัตโนมัติสำเร็จ',
      description: `จัดจ่าย ${newAllocations.length} รายการ เรียงตามวันครบกำหนด`,
    });
  };

  // Quick-Fill Handler: Pay Full - Sum all unpaid invoices
  const handlePayFull = () => {
    if (unpaidInvoices.length === 0) {
      toast({
        title: 'ไม่มีใบกำกับภาษีค้างจ่าย',
        description: 'กรุณาเลือกลูกค้าที่มียอดค้างจ่าย',
        variant: 'destructive',
      });
      return;
    }

    const totalUnpaid = unpaidInvoices.reduce((sum: number, inv: any) => sum + inv.balance, 0);
    form.setValue('amount', totalUnpaid);
    setCustomAmount('');

    // Auto-allocate to all unpaid invoices
    const newAllocations = unpaidInvoices.map((invoice: any) => ({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: invoice.balance,
      whtRate: 0,
      whtAmount: 0,
      balance: invoice.balance,
    }));
    form.setValue('allocations', newAllocations);

    toast({
      title: 'เลือกจ่ายเต็มจำนวน',
      description: `ยอดรวมทั้งหมด ${unpaidInvoices.length} ใบ = ฿${totalUnpaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  };

  // Quick-Fill Handler: Select Invoice - Fill that invoice's balance
  const handleSelectInvoice = (invoiceId: string) => {
    setQuickFillInvoiceId(invoiceId);
    setCustomAmount('');

    if (!invoiceId) return;

    const invoice = unpaidInvoices.find((inv: any) => inv.id === invoiceId);
    if (invoice) {
      form.setValue('amount', invoice.balance);

      // Create allocation for just this invoice
      const allocation = {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.balance,
        whtRate: 0,
        whtAmount: 0,
        balance: invoice.balance,
      };
      form.setValue('allocations', [allocation]);
      setSelectedInvoiceId(invoiceId);

      toast({
        title: `เลือก ${invoice.invoiceNo}`,
        description: `ยอดค้างจ่าย ฿${invoice.balance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    }
  };

  // Quick-Fill Handler: Custom Amount
  const handleCustomAmount = (amountStr: string) => {
    setCustomAmount(amountStr);
    setQuickFillInvoiceId('');

    if (!amountStr) {
      form.setValue('amount', 0);
      form.setValue('allocations', []);
      setSelectedInvoiceId('');
      return;
    }

    const parsed = parseFloat(amountStr) || 0;
    form.setValue('amount', parsed);

    // Don't pre-fill allocations - let user manually allocate
    form.setValue('allocations', []);
    setSelectedInvoiceId('');
  };

  const validateForm = (values: ReceiptFormValues): boolean => {
    if (!values.customerId) {
      toast({
        title: 'กรุณาเลือกลูกค้า',
        variant: 'destructive',
      });
      return false;
    }

    if (values.amount <= 0) {
      toast({
        title: 'กรุณาระบุจำนวนเงินมากกว่า 0',
        variant: 'destructive',
      });
      return false;
    }

    if (!allocations || allocations.length === 0) {
      toast({
        title: 'กรุณาจัดจ่ายอย่างน้อย 1 รายการ',
        variant: 'destructive',
      });
      return false;
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated > values.amount) {
      toast({
        title: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน',
        description: `จัดจ่ายรวม: ฿${totalAllocated.toLocaleString()} เกินกว่ายอดรับ: ฿${values.amount.toLocaleString()}`,
        variant: 'destructive',
      });
      return false;
    }

    if (
      (values.paymentMethod === 'TRANSFER' || values.paymentMethod === 'CHEQUE') &&
      !values.bankAccountId
    ) {
      toast({
        title: 'กรุณาเลือกบัญชีธนาคาร',
        description: 'วิธีการชำระเงินแบบโอนเงินหรือเช็คต้องระบุบัญชีธนาคาร',
        variant: 'destructive',
      });
      return false;
    }

    if (values.paymentMethod === 'CHEQUE' && !values.chequeNo) {
      toast({
        title: 'กรุณาระบุเลขที่เช็ค',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const onSubmit = async (values: ReceiptFormValues) => {
    if (loading) return;
    if (!validateForm(values)) return;

    setLoading(true);
    try {
      const url = receipt ? `/api/receipts/${receipt.id}` : '/api/receipts';
      const method = receipt ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          allocations: allocations.map((a) => ({
            invoiceId: a.invoiceId,
            amount: a.amount,
            whtRate: a.whtRate,
            whtAmount: a.whtAmount,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'ไม่สามารถบันทึกได้');
      }

      toast({
        title: 'สำเร็จ',
        description: receipt
          ? 'แก้ไขใบเสร็จรับเงินเรียบร้อยแล้ว'
          : 'สร้างใบเสร็จรับเงินเรียบร้อยแล้ว',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถบันทึกได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const totalWht = allocations.reduce((sum, a) => sum + a.whtAmount, 0);
  const unallocated = amount - totalAllocated;

  const selectedAllocation = getSelectedAllocation();
  const selectedInvoice = unpaidInvoices.find((inv: any) => inv.id === selectedInvoiceId);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>รับเงินจาก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                format(new Date(field.value), 'dd/MM/yyyy', { locale: th })
                              ) : (
                                <span>เลือกวันที่</span>
                              )}
                              <CalendarIcon
                                className="ml-auto h-4 w-4 opacity-50"
                                aria-hidden="true"
                              />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value)}
                            onSelect={(date) =>
                              field.setValue(date?.toISOString().split('T')[0] || '')
                            }
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
                          <SelectTrigger
                            className="!h-11 text-base"
                            id="customerId"
                            aria-label="เลือกลูกค้า"
                          >
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="paymentMethod">วิธีการชำระเงิน</FormLabel>
                      <Select onValueChange={handlePaymentMethodChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger
                            className="!h-11 text-base"
                            id="paymentMethod"
                            aria-label="เลือกวิธีการชำระเงิน"
                          >
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                  format(new Date(field.value), 'dd/MM/yyyy', { locale: th })
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
                              onSelect={(date) =>
                                field.setValue(date?.toISOString().split('T')[0] || '')
                              }
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

              {/* Amount Quick-Fill Helper Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base">จำนวนเงินที่ต้องการชำระเงิน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Option 1: Pay Full */}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handlePayFull}
                      disabled={unpaidInvoices.length === 0}
                      className="min-w-[200px] flex-1"
                    >
                      จ่ายเต็มจำนวน ({unpaidInvoices.length} ใบ)
                    </Button>

                    {/* Option 2: Select Invoice */}
                    <Select onValueChange={handleSelectInvoice} value={quickFillInvoiceId}>
                      <SelectTrigger className="min-w-[250px] flex-[2]">
                        <SelectValue placeholder="เลือกใบแจ้ง/ใบวาซื้อ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unpaidInvoices.map((invoice: any) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNo} - ค้างจ่าย ฿
                            {invoice.balance.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Option 3: Custom Amount */}
                    <Input
                      type="number"
                      placeholder="ระบุจำนวน"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      className="min-w-[200px] flex-[2]"
                    />
                  </div>

                  {/* Show total summary */}
                  <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
                    <span className="text-muted-foreground">ยอดรวมที่จะจ่าย:</span>
                    <span className="text-lg font-semibold text-primary">
                      ฿
                      {amount.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Show quick-fill hint */}
                  {amount > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      จะถูกนำไปจัดจ่ายอัตโนมัติหลังจากกดบันทึก
                    </p>
                  )}
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงินรับโดยสิ้นเชิง (คำนวณอัตโนมัติ)</FormLabel>
                    <FormControl>
                      <Input
                        className="!h-11 bg-gray-100 text-base"
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        readOnly
                      />
                    </FormControl>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ใช้ปุ่มด้านบนเพื่อเลือกยอดที่ต้องการชำระ
                    </p>
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

          {/* 2-Panel Allocation Layout */}
          {selectedCustomerId && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>การจัดจ่ายใบกำกับภาษี</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ยอดรับ: ฿{amount.toLocaleString()} | จัดจ่าย: ฿
                      {totalAllocated.toLocaleString()} | WHT: ฿{totalWht.toLocaleString()} |
                      คงเหลือ: ฿{unallocated.toLocaleString()}
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
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    จัดจ่ายอัตโนมัติ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {unpaidInvoices.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    ไม่มีใบกำกับภาษีค้างจ่าย
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* LEFT PANEL: Outstanding Invoices */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">ใบกำกับที่ค้างรับ</h3>
                        <Badge variant="secondary">{unpaidInvoices.length} รายการ</Badge>
                      </div>

                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {unpaidInvoices.map((invoice: any) => {
                          const allocation = allocations?.find((a) => a.invoiceId === invoice.id);
                          const isSelected = selectedInvoiceId === invoice.id;
                          const aging = getAgingStatus(invoice.dueDate);
                          const AgingIcon = aging.icon;

                          return (
                            <button
                              key={invoice.id}
                              type="button"
                              onClick={() => setSelectedInvoiceId(invoice.id)}
                              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                              aria-label={`เลือก ${invoice.invoiceNo}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold">
                                      {invoice.invoiceNo}
                                    </span>
                                    {allocation && (
                                      <Badge variant="default" className="text-xs">
                                        จัดจ่ายแล้ว
                                      </Badge>
                                    )}
                                  </div>
                                  {invoice.dueDate && (
                                    <div className="mb-2 text-xs text-muted-foreground">
                                      ครบกำหนด:{' '}
                                      {format(new Date(invoice.dueDate), 'dd/MM/yyyy', {
                                        locale: th,
                                      })}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">ยอด:</span>
                                    <span className="font-medium">
                                      ฿
                                      {invoice.balance.toLocaleString('th-TH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                    <span className="text-muted-foreground">
                                      / ฿
                                      {invoice.totalAmount.toLocaleString('th-TH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={aging.color} className="shrink-0">
                                  <AgingIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                                  {aging.status === 'overdue' && `เกิน ${aging.days} วัน`}
                                  {aging.status === 'approaching' && `อีก ${aging.days} วัน`}
                                  {aging.status === 'current' && 'ปกติ'}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <p>
                            แนะนำ: จัดจ่ายอัตโนมัติเรียงตามวันที่เก่าสุด (FIFO)
                            เพื่อลดความเสี่ยงการเกินกำหนดชำระ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: Allocation Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">รายละเอียดการจัดจ่าย</h3>
                        {selectedAllocation && (
                          <Badge variant="outline">{selectedAllocation.invoiceNo}</Badge>
                        )}
                      </div>

                      {!selectedInvoiceId ? (
                        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                          <div className="text-center">
                            <p className="text-sm">เลือกใบกำกับภาษีทางซ้าย</p>
                            <p className="mt-1 text-xs">เพื่อจัดจ่ายหรือแก้ไขยอดจัดจ่าย</p>
                          </div>
                        </div>
                      ) : selectedInvoice ? (
                        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                          {!selectedAllocation ? (
                            // Not yet allocated - show add button
                            <div className="space-y-4">
                              <div className="py-4 text-center">
                                <p className="mb-1 text-sm text-muted-foreground">ยอดค้างรับ</p>
                                <p className="text-2xl font-bold">
                                  ฿{selectedInvoice.balance.toLocaleString()}
                                </p>
                              </div>

                              <Button
                                type="button"
                                className="w-full"
                                onClick={() => addAllocation(selectedInvoice)}
                                disabled={unallocated <= 0}
                              >
                                เพิ่มการจัดจ่าย
                              </Button>

                              <div className="text-center text-xs text-muted-foreground">
                                ยอดคงเหลือที่จัดจ่ายได้: ฿
                                {Math.min(unallocated, selectedInvoice.balance).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            // Already allocated - show edit form
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">ยอดค้างรับ:</span>
                                  <p className="font-semibold">
                                    ฿{selectedInvoice.balance.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">ครบกำหนด:</span>
                                  <p className="font-semibold">
                                    {selectedInvoice.dueDate
                                      ? format(new Date(selectedInvoice.dueDate), 'dd/MM/yyyy', {
                                          locale: th,
                                        })
                                      : '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    จำนวนเงินจัดจ่าย
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="!h-11 text-base"
                                    value={selectedAllocation.amount.toString()}
                                    onChange={(e) => {
                                      const newAmount = parseFloat(e.target.value) || 0;
                                      updateSelectedAllocation({ amount: newAmount });
                                    }}
                                    max={selectedInvoice.balance}
                                    aria-label="จำนวนเงินจัดจ่าย"
                                  />
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    สูงสุด: ฿{selectedInvoice.balance.toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-medium">
                                    หัก ณ ที่จ่าย (%)
                                  </label>
                                  <Select
                                    value={selectedAllocation.whtRate.toString()}
                                    onValueChange={(val) =>
                                      updateSelectedAllocation({ whtRate: parseFloat(val) })
                                    }
                                  >
                                    <SelectTrigger className="!h-11 text-base">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">0%</SelectItem>
                                      <SelectItem value="1">1%</SelectItem>
                                      <SelectItem value="3">3%</SelectItem>
                                      <SelectItem value="5">5%</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t pt-2">
                                  <div>
                                    <span className="text-xs text-muted-foreground">WHT:</span>
                                    <p className="text-sm font-semibold">
                                      ฿{selectedAllocation.whtAmount.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground">ยอดสุทธิ:</span>
                                    <p className="text-sm font-semibold text-primary">
                                      ฿
                                      {(
                                        selectedAllocation.amount - selectedAllocation.whtAmount
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="w-full"
                                  onClick={removeAllocation}
                                >
                                  ลบการจัดจ่ายนี้
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          ไม่พบข้อมูลใบกำกับภาษี
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Bar */}
          {amount > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">ยอดรับ</p>
                    <p className="text-lg font-bold">฿{amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">จัดจ่าย</p>
                    <p className="text-lg font-bold text-primary">
                      ฿{totalAllocated.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">WHT</p>
                    <p className="text-lg font-bold text-orange-600">
                      ฿{totalWht.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">คงเหลือ</p>
                    <p
                      className={`text-lg font-bold ${unallocated > 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      ฿{unallocated.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              aria-busy={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
