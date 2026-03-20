'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Fund {
  id: string
  name: string
  currentBalance: number
}

interface Voucher {
  id: string
  voucherNo: string
  fundId: string
  date: string
  payee: string
  description: string
  amount: number
  glExpenseAccountId: string
  isReimbursed: boolean
  journalEntryId?: string
}

interface PettyCashVoucherEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher?: Voucher | null
  funds: Fund[]
  onSuccess: () => void
}

export function PettyCashVoucherEditDialog({
  open,
  onOpenChange,
  voucher,
  funds,
  onSuccess
}: PettyCashVoucherEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fundId: '',
    date: '',
    payee: '',
    description: '',
    amount: '',
    glExpenseAccountId: ''
  })

  // Initialize form when voucher changes
  useEffect(() => {
    if (voucher && open) {
      const dateObj = new Date(voucher.date)
      const dateStr = dateObj.toISOString().split('T')[0] // Format as YYYY-MM-DD

      setForm({
        fundId: voucher.fundId,
        date: dateStr,
        payee: voucher.payee,
        description: voucher.description,
        amount: voucher.amount.toString(),
        glExpenseAccountId: voucher.glExpenseAccountId
      })
    }
  }, [voucher, open])

  const selectedFund = funds.find(f => f.id === form.fundId)
  const voucherAmount = parseFloat(form.amount) || 0

  const handleSubmit = async () => {
    // Validation
    if (!form.fundId || !form.payee || !form.description || !form.amount || !form.glExpenseAccountId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive'
      })
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'จำนวนเงินต้องมากกว่า 0',
        variant: 'destructive'
      })
      return
    }

    // Check fund balance
    if (selectedFund) {
      // If changing fund or amount, we need to check balance
      const oldAmount = voucher?.amount || 0
      const balanceChange = amount - oldAmount

      if (form.fundId === voucher?.fundId && balanceChange > 0 && selectedFund.currentBalance < balanceChange) {
        toast({
          title: 'ข้อผิดพลาด',
          description: `เงินสดย่อยไม่เพียงพอสำหรับวงเงินที่เพิ่มขึ้น (คงเหลือ ฿${selectedFund.currentBalance.toLocaleString()})`,
          variant: 'destructive'
        })
        return
      }

      // If changing to different fund
      if (form.fundId !== voucher?.fundId && selectedFund.currentBalance < amount) {
        toast({
          title: 'ข้อผิดพลาด',
          description: `เงินสดย่อยไม่เพียงพอ (คงเหลือ ฿${selectedFund.currentBalance.toLocaleString()})`,
          variant: 'destructive'
        })
        return
      }
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/petty-cash/vouchers/${voucher?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: 'อัปเดตใบสำคัญสำเร็จ',
          description: `฿${amount.toLocaleString()} - ${form.payee}`
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: data.error || 'เกิดข้อผิดพลาด',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating voucher:', error)
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการบันทึก',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขใบสำคัญเงินสดย่อย</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>
              ดีไซน์แบบฟอร์มสำหรับแก้ไขใบสำคัญเงินสดย่อย สามารถแก้ไขข้อมูลกองทุน วันที่ จำนวนเงิน ผู้รับเงิน รายละเอียดค่าใช้จ่ายและบัญชี GL ได้
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>เลขที่ใบสำคัญ</Label>
            <Input value={voucher?.voucherNo || ''} disabled className="bg-gray-50" />
          </div>

          <div>
            <Label htmlFor="fundId">กองทุน *</Label>
            <Select value={form.fundId} onValueChange={(v) => setForm({ ...form, fundId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกกองทุน" />
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} (คงเหลือ ฿{f.currentBalance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFund && (
              <p className="text-xs text-gray-500 mt-1">
                วงเงินคงเหลือ: ฿{selectedFund.currentBalance.toLocaleString()}
                {form.fundId === voucher?.fundId && (
                  <span className="ml-2">
                    (สามารถใช้เพิ่มได้อีก ฿{(selectedFund.currentBalance - (parseFloat(form.amount) || 0) + (voucher?.amount || 0)).toLocaleString()})
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">วันที่</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">จำนวนเงิน (฿) *</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payee">จ่ายให้ *</Label>
            <Input
              id="payee"
              value={form.payee}
              onChange={(e) => setForm({ ...form, payee: e.target.value })}
              placeholder="ชื่อผู้รับเงิน"
            />
          </div>

          <div>
            <Label htmlFor="description">รายละเอียด *</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="รายละเอียดค่าใช้จ่าย"
            />
          </div>

          <div>
            <Label htmlFor="glExpenseAccountId">รหัสบัญชีค่าใช้จ่าย GL *</Label>
            <Input
              id="glExpenseAccountId"
              value={form.glExpenseAccountId}
              onChange={(e) => setForm({ ...form, glExpenseAccountId: e.target.value })}
              placeholder="cm5x..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
