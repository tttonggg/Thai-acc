'use client'
import { useState, useEffect } from 'react'

// Helper function to translate cheque status
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'ON_HAND': 'อยู่ในมือ',
    'DEPOSITED': 'นำฝากแล้ว',
    'CLEARED': 'เคลียร์แล้ว',
    'BOUNCED': 'เช็คเด้ง',
    'CANCELLED': 'ยกเลิก',
  }
  return statusMap[status] || status
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
}

interface Cheque {
  id: string
  chequeNo: string
  type: 'RECEIVE' | 'PAY'
  bankAccountId: string
  amount: number
  dueDate: string
  payeeName: string | null
  status: string
}

interface ChequeEditDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  cheque?: Cheque | null
  bankAccounts: BankAccount[]
}

export function ChequeEditDialog({
  open,
  onClose,
  onSuccess,
  cheque,
  bankAccounts,
}: ChequeEditDialogProps) {
  const [form, setForm] = useState({
    chequeNo: '',
    type: 'RECEIVE' as 'RECEIVE' | 'PAY',
    bankAccountId: '',
    amount: '',
    dueDate: '',
    payeeName: '',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (cheque) {
      setForm({
        chequeNo: cheque.chequeNo || '',
        type: cheque.type || 'RECEIVE',
        bankAccountId: cheque.bankAccountId || '',
        amount: cheque.amount?.toString() || '',
        dueDate: cheque.dueDate ? new Date(cheque.dueDate).toISOString().split('T')[0] : '',
        payeeName: cheque.payeeName || '',
      })
    } else {
      setForm({
        chequeNo: '',
        type: 'RECEIVE',
        bankAccountId: '',
        amount: '',
        dueDate: '',
        payeeName: '',
      })
    }
  }, [cheque, open])

  const handleSubmit = async () => {
    if (!form.chequeNo || !form.bankAccountId || !form.amount || !form.dueDate) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const url = cheque ? `/api/cheques/${cheque.id}` : '/api/cheques'
      const method = 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast({
          title: cheque ? 'แก้ไขเช็คสำเร็จ' : 'เพิ่มเช็คสำเร็จ',
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: res.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการบันทึก',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cheque ? 'แก้ไขเช็ค' : 'เพิ่มเช็ค'}</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>
              {cheque ? 'แก้ไขข้อมูลเช็ครับหรือเช็คจ่าย' : 'สร้างเช็ครับหรือเช็คจ่ายใหม่'}
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="chequeNo">เลขที่เช็ค *</Label>
              <Input
                id="chequeNo"
                value={form.chequeNo}
                onChange={(e) => setForm({ ...form, chequeNo: e.target.value })}
                placeholder="CHK001"
              />
            </div>
            <div>
              <Label htmlFor="type">ประเภท *</Label>
              <Select value={form.type} onValueChange={(v: 'RECEIVE' | 'PAY') => setForm({ ...form, type: v })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVE">เช็ครับ</SelectItem>
                  <SelectItem value="PAY">เช็คจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="bankAccountId">บัญชีธนาคาร *</Label>
            <Select value={form.bankAccountId} onValueChange={(v) => setForm({ ...form, bankAccountId: v })}>
              <SelectTrigger id="bankAccountId">
                <SelectValue placeholder="เลือกบัญชี" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">จำนวนเงิน *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">วันครบกำหนด *</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="payeeName">ผู้รับ/จ่าย</Label>
            <Input
              id="payeeName"
              value={form.payeeName}
              onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
              placeholder="ชื่อผู้รับ/จ่ายเงิน"
            />
          </div>
          {cheque && cheque.status !== 'ON_HAND' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ เช็คนี้ถูกประมวลผลแล้ว ({getStatusLabel(cheque.status)}) การแก้ไขอาจส่งผลต่อบันทึกบัญชี
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'กำลังบันทึก...' : cheque ? 'บันทึกการแก้ไข' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
