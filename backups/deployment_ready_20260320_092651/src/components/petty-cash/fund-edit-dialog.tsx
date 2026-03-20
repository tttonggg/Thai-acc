'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
}

interface Fund {
  id: string
  code: string
  name: string
  custodianId: string
  glAccountId: string
  maxAmount: number
  currentBalance: number
  isActive: boolean
}

interface PettyCashFundEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fund?: Fund | null
  onSuccess: () => void
  mode: 'create' | 'edit'
}

export function PettyCashFundEditDialog({
  open,
  onOpenChange,
  fund,
  onSuccess,
  mode
}: PettyCashFundEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({
    code: '',
    name: '',
    custodianId: '',
    glAccountId: '',
    maxAmount: '',
    isActive: true
  })

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        if (data.success || Array.isArray(data)) {
          setUsers(Array.isArray(data) ? data : data.data || [])
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      }
    }
    fetchUsers()
  }, [])

  // Initialize form when fund changes
  useEffect(() => {
    if (mode === 'edit' && fund) {
      setForm({
        code: fund.code,
        name: fund.name,
        custodianId: fund.custodianId,
        glAccountId: fund.glAccountId,
        maxAmount: fund.maxAmount.toString(),
        isActive: fund.isActive
      })
    } else if (mode === 'create') {
      setForm({
        code: '',
        name: '',
        custodianId: '',
        glAccountId: '',
        maxAmount: '',
        isActive: true
      })
    }
  }, [fund, mode, open])

  const handleSubmit = async () => {
    // Validation
    if (!form.code || !form.name || !form.custodianId || !form.glAccountId || !form.maxAmount) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive'
      })
      return
    }

    const maxAmount = parseFloat(form.maxAmount)
    if (isNaN(maxAmount) || maxAmount <= 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'วงเงินสูงสุดต้องมากกว่า 0',
        variant: 'destructive'
      })
      return
    }

    // Check if editing and maxAmount is less than current balance
    if (mode === 'edit' && fund && maxAmount < fund.currentBalance) {
      toast({
        title: 'ข้อผิดพลาด',
        description: `วงเงินสูงสุดไม่สามารถน้อยกว่ายอดคงเหลือปัจจุบัน (฿${fund.currentBalance.toLocaleString()})`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const url = mode === 'create'
        ? '/api/petty-cash/funds'
        : `/api/petty-cash/funds/${fund?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxAmount
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: mode === 'create' ? 'สร้างกองทุนสำเร็จ' : 'อัปเดตกองทุนสำเร็จ',
          description: `${form.name}: ฿${maxAmount.toLocaleString()}`
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
      console.error('Error saving fund:', error)
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
          <DialogTitle>
            {mode === 'create' ? 'สร้างกองทุนเงินสดย่อย' : 'แก้ไขกองทุนเงินสดย่อย'}
          </DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>
              {mode === 'create'
                ? 'ดีไซน์แบบฟอร์มสำหรับสร้างกองทุนเงินสดย่อยใหม่ กรุณากรอกรหัส ชื่อ ผู้ถือกองทุน บัญชี GL และวงเงินสูงสุด'
                : 'ดีไซน์แบบฟอร์มสำหรับแก้ไขข้อมูลกองทุนเงินสดย่อย สามารถแก้ไขชื่อ ผู้ถือกองทุน บัญชี GL วงเงินสูงสุดและสถานะได้'
              }
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="code">รหัส *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PCF-001"
                disabled={mode === 'edit'} // Don't allow changing code after creation
              />
            </div>
            <div>
              <Label htmlFor="name">ชื่อกองทุน *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="กองทุนทั่วไป"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="custodian">ผู้ถือกองทุน *</Label>
            <Select value={form.custodianId} onValueChange={(v) => setForm({ ...form, custodianId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผู้ถือ" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="maxAmount">วงเงินสูงสุด (฿) *</Label>
              <Input
                id="maxAmount"
                type="number"
                value={form.maxAmount}
                onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                placeholder="5000"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="glAccountId">รหัสบัญชี GL *</Label>
              <Input
                id="glAccountId"
                value={form.glAccountId}
                onChange={(e) => setForm({ ...form, glAccountId: e.target.value })}
                placeholder="cm3x..."
              />
            </div>
          </div>

          {mode === 'edit' && fund && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                ยอดคงเหลือปัจจุบัน: <span className="font-semibold">฿{fund.currentBalance.toLocaleString()}</span>
              </p>
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="cursor-pointer">
                สถานะกองทุน
              </Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'กำลังบันทึก...' : mode === 'create' ? 'สร้าง' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
