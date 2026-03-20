'use client'

// ============================================
// 👥 Employee Edit Dialog
// Agent 06: Payroll & HR Engineer
// Create/Edit employee with validation
// ============================================

import { useState, useEffect } from 'react'
import { User, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n)

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  position: string | null
  department: string | null
  baseSalary: number
  hireDate: string
  taxId: string | null
  socialSecurityNo: string | null
  bankAccountNo: string | null
  bankName: string | null
  isActive: boolean
}

interface EmployeeEditDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  employee?: Employee | null
}

const EMPTY_FORM = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  position: '',
  department: '',
  hireDate: '',
  baseSalary: '',
  taxId: '',
  socialSecurityNo: '',
  bankAccountNo: '',
  bankName: '',
  isActive: 'true',
}

export function EmployeeEditDialog({ open, onClose, onSuccess, employee }: EmployeeEditDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = !!employee

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          employeeCode: employee.employeeCode || '',
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          position: employee.position || '',
          department: employee.department || '',
          hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
          baseSalary: String(employee.baseSalary || ''),
          taxId: employee.taxId || '',
          socialSecurityNo: employee.socialSecurityNo || '',
          bankAccountNo: employee.bankAccountNo || '',
          bankName: employee.bankName || '',
          isActive: String(employee.isActive !== false),
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [open, employee])

  const handleSubmit = async () => {
    // Validation
    if (!form.employeeCode || !form.firstName || !form.lastName || !form.hireDate || !form.baseSalary) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบถ้วน', variant: 'destructive' })
      return
    }

    const baseSalary = parseFloat(form.baseSalary)
    if (isNaN(baseSalary) || baseSalary <= 0) {
      toast({ title: 'เงินเดือนต้องมากกว่า 0', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await window.fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          baseSalary,
          isActive: form.isActive === 'true',
        }),
      })

      const res = await response.json()

      if (res.success) {
        toast({
          title: isEdit ? 'แก้ไขพนักงานสำเร็จ' : 'เพิ่มพนักงานสำเร็จ',
          description: `${form.firstName} ${form.lastName}`,
        })
        onSuccess()
        onClose()
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? 'แก้ไขข้อมูลพนักงานทั้งหมดรวมถึงข้อมูลส่วนตัว ที่อยู่ ข้อมูลภาษีและประกันสังคม ข้อมูลธนาคารและสถานะการทำงาน'
              : 'เพิ่มข้อมูลพนักงานใหม่โดยเติมข้อมูลส่วนตัว ที่อยู่ ข้อมูลภาษีและประกันสังคม และข้อมูลธนาคาร'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>รหัสพนักงาน *</Label>
                <Input
                  value={form.employeeCode}
                  onChange={e => setForm(p => ({ ...p, employeeCode: e.target.value }))}
                  placeholder="EMP-001"
                />
              </div>
              <div>
                <Label>วันเริ่มงาน *</Label>
                <Input
                  type="date"
                  value={form.hireDate}
                  onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ชื่อ *</Label>
                <Input
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="สมชาย"
                />
              </div>
              <div>
                <Label>นามสกุล *</Label>
                <Input
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="ใจดี"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ตำแหน่ง</Label>
                <Input
                  value={form.position}
                  onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                  placeholder="โปรแกรมเมอร์"
                />
              </div>
              <div>
                <Label>แผนก</Label>
                <Input
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="IT"
                />
              </div>
            </div>

            <div>
              <Label>เงินเดือน (฿) *</Label>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))}
                placeholder="15000"
              />
              {form.baseSalary && !isNaN(parseFloat(form.baseSalary)) && (
                <p className="text-xs text-teal-600 mt-1">
                  SSC: ฿{fc(Math.min(parseFloat(form.baseSalary) * 0.05, 750))} |{' '}
                  ประมาณ PND1: ฿{fc(Math.max(0, (parseFloat(form.baseSalary) * 12 - 150000) * 0.05 / 12))}
                </p>
              )}
            </div>
          </div>

          {/* Tax & Social Security */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-medium text-gray-700">ภาษีและประกันสังคม</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>เลขบัตรประชาชน</Label>
                <Input
                  value={form.taxId}
                  onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))}
                  placeholder="x-xxxx-xxxxx-xx-x"
                  maxLength={13}
                />
              </div>
              <div>
                <Label>เลขประกันสังคม</Label>
                <Input
                  value={form.socialSecurityNo}
                  onChange={e => setForm(p => ({ ...p, socialSecurityNo: e.target.value }))}
                  placeholder="xxxxxxxxx"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-medium text-gray-700">ข้อมูลธนาคาร</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>เลขที่บัญชีธนาคาร</Label>
                <Input
                  value={form.bankAccountNo}
                  onChange={e => setForm(p => ({ ...p, bankAccountNo: e.target.value }))}
                  placeholder="xxx-x-xxxxx-x"
                />
              </div>
              <div>
                <Label>ธนาคาร</Label>
                <Input
                  value={form.bankName}
                  onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                  placeholder="กรุงไทย"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          {isEdit && (
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-medium text-gray-700">สถานะ</h3>

              <div className="flex items-center gap-3">
                <Label className="text-sm">สถานะการทำงาน:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={form.isActive === 'true' ? 'default' : 'outline'}
                    onClick={() => setForm(p => ({ ...p, isActive: 'true' }))}
                    className={form.isActive === 'true' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    ทำงาน
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={form.isActive === 'false' ? 'default' : 'outline'}
                    onClick={() => setForm(p => ({ ...p, isActive: 'false' }))}
                    className={form.isActive === 'false' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  >
                    ลาออก
                  </Button>
                </div>
                {form.isActive === 'false' && (
                  <Badge variant="secondary" className="text-xs">ไม่รวมในการคำนวณเงินเดือน</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
