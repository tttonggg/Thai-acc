'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface BankAccount {
  id: string
  code: string
  bankName: string
  branchName: string
  accountNumber: string
  accountName: string
  glAccountId: string
  isActive: boolean
}

interface BankAccountEditDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  account?: BankAccount | null
}

export function BankAccountEditDialog({
  open,
  onClose,
  onSuccess,
  account,
}: BankAccountEditDialogProps) {
  const [form, setForm] = useState({
    code: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountName: '',
    glAccountId: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (account) {
      setForm({
        code: account.code || '',
        bankName: account.bankName || '',
        branchName: account.branchName || '',
        accountNumber: account.accountNumber || '',
        accountName: account.accountName || '',
        glAccountId: account.glAccountId || '',
        isActive: account.isActive !== undefined ? account.isActive : true,
      })
    } else {
      setForm({
        code: '',
        bankName: '',
        branchName: '',
        accountNumber: '',
        accountName: '',
        glAccountId: '',
        isActive: true,
      })
    }
  }, [account, open])

  const handleSubmit = async () => {
    if (!form.code || !form.bankName || !form.accountNumber || !form.glAccountId) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const url = account ? `/api/bank-accounts/${account.id}` : '/api/bank-accounts'
      const method = account ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then((r) => r.json())

      if (res.success) {
        toast({
          title: account ? 'แก้ไขบัญชีธนาคารสำเร็จ' : 'เพิ่มบัญชีธนาคารสำเร็จ',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>
              {account ? 'แก้ไขข้อมูลบัญชีธนาคารของบริษัท' : 'สร้างบัญชีธนาคารใหม่'}
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="code">รหัส *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="BANK-001"
              />
            </div>
            <div>
              <Label htmlFor="bankName">ธนาคาร *</Label>
              <Input
                id="bankName"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="ธ.กสิกรไทย"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="branchName">สาขา</Label>
            <Input
              id="branchName"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              placeholder="สาขาถนนสุขุมวิท"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="accountNumber">เลขที่บัญชี *</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="123-4-56789-0"
              />
            </div>
            <div>
              <Label htmlFor="accountName">ชื่อบัญชี</Label>
              <Input
                id="accountName"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="บริษัท จำกัด"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="glAccountId">GL Account ID *</Label>
            <Input
              id="glAccountId"
              value={form.glAccountId}
              onChange={(e) => setForm({ ...form, glAccountId: e.target.value })}
              placeholder="ID ของบัญชีแยกประเภท"
            />
          </div>
          {account && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                บัญชีใช้งานอยู่
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'กำลังบันทึก...' : account ? 'บันทึกการแก้ไข' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
