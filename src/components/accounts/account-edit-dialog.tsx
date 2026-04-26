'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Account {
  id: string
  code: string
  name: string
  nameEn?: string | null
  type: string
  level: number
  parentId: string | null
  isDetail: boolean
  isActive: boolean
  notes?: string | null
}

interface AccountEditDialogProps {
  account: Account | null
  parentAccount: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const accountTypeLabels = {
  ASSET: 'สินทรัพย์',
  LIABILITY: 'หนี้สิน',
  EQUITY: 'ทุน',
  REVENUE: 'รายได้',
  EXPENSE: 'ค่าใช้จ่าย',
}

export function AccountEditDialog({
  account,
  parentAccount,
  open,
  onOpenChange,
  onSuccess,
}: AccountEditDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: 'ASSET' as Account['type'],
    parentId: '__none__',
    isDetail: true,
    isActive: true,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [accounts, setAccounts] = useState<Account[]>([])

  const isEditMode = !!account
  const title = isEditMode ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'
  const description = isEditMode
    ? 'แก้ไขข้อมูลบัญชีในระบบ'
    : parentAccount
    ? `เพิ่มบัญชีย่อยใต้ ${parentAccount.code} - ${parentAccount.name}`
    : 'เพิ่มบัญชีใหม่ในระบบ'

  // Fetch accounts for parent selection
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch(`/api/accounts`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setAccounts(data)
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      }
    }

    if (open) {
      fetchAccounts()
    }
  }, [open])

  // Pre-populate form when account data changes
  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || '',
        name: account.name || '',
        nameEn: account.nameEn || '',
        type: (account.type as Account['type']) || 'ASSET',
        parentId: account.parentId || '__none__',
        isDetail: account.isDetail ?? true,
        isActive: account.isActive ?? true,
        notes: account.notes || '',
      })
    } else if (parentAccount) {
      // Set default values for new child account
      const childCode = `${parentAccount.code}1`
      setFormData({
        code: childCode,
        name: '',
        nameEn: '',
        type: (parentAccount.type as Account['type']) || 'ASSET',
        parentId: parentAccount.id,
        isDetail: parentAccount.level >= 3, // Auto-set based on parent level
        isActive: true,
        notes: '',
      })
    } else {
      // Reset form for new top-level account
      setFormData({
        code: '',
        name: '',
        nameEn: '',
        type: 'ASSET',
        parentId: '__none__',
        isDetail: true,
        isActive: true,
        notes: '',
      })
    }
    setErrors({})
  }, [account, parentAccount, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Code required
    if (!formData.code.trim()) {
      newErrors.code = 'กรุณาระบุรหัสบัญชี'
    }

    // Name required
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อบัญชี'
    }

    // Type required
    if (!formData.type) {
      newErrors.type = 'กรุณาระบุประเภทบัญชี'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/accounts/${account?.id}`
        : '/api/accounts'

      const method = isEditMode ? 'PUT' : 'POST'

      const payload = isEditMode
        ? {
            name: formData.name,
            nameEn: formData.nameEn || null,
            type: formData.type,
            isDetail: formData.isDetail,
            isActive: formData.isActive,
            notes: formData.notes || null,
          }
        : {
            code: formData.code,
            name: formData.name,
            nameEn: formData.nameEn || null,
            type: formData.type,
            level: formData.code.length,
            parentId: (formData.parentId && formData.parentId !== '__none__') ? formData.parentId : null,
            isDetail: formData.isDetail,
            isActive: true,
            notes: formData.notes || null,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: isEditMode ? 'แก้ไขสำเร็จ' : 'เพิ่มบัญชีสำเร็จ',
          description: isEditMode
            ? 'แก้ไขข้อมูลบัญชีเรียบร้อยแล้ว'
            : 'เพิ่มบัญชีใหม่เรียบร้อยแล้ว',
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error.error || 'ไม่สามารถบันทึกข้อมูลได้',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving account:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Filter parent accounts (only show header accounts and not the current account)
  const parentAccounts = accounts.filter(
    (a) => !a.isDetail && a.id !== account?.id
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Account Code */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                รหัสบัญชี <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="เช่น 1111"
                  disabled={isEditMode}
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code}</p>
                )}
              </div>
            </div>

            {/* Account Name (Thai) */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อบัญชี <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ชื่อบัญชีภาษาไทย"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Account Name (English) */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="nameEn" className="text-right">
                ชื่อบัญชี (Eng)
              </Label>
              <div className="col-span-3">
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  placeholder="Account name in English"
                />
              </div>
            </div>

            {/* Account Type */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                ประเภทบัญชี <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    handleInputChange('type', v as Account['type'])
                  }
                  disabled={isEditMode}
                >
                  <SelectTrigger
                    className={errors.type ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">สินทรัพย์</SelectItem>
                    <SelectItem value="LIABILITY">หนี้สิน</SelectItem>
                    <SelectItem value="EQUITY">ทุน</SelectItem>
                    <SelectItem value="REVENUE">รายได้</SelectItem>
                    <SelectItem value="EXPENSE">ค่าใช้จ่าย</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>
            </div>

            {/* Parent Account (only for new accounts) */}
            {!isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <Label htmlFor="parentId" className="text-right">
                  บัญชีหลัก
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.parentId}
                    onValueChange={(v) => handleInputChange('parentId', v)}
                    disabled={!!parentAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ไม่มี (บัญชีหลัก)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">ไม่มี (บัญชีหลัก)</SelectItem>
                      {parentAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Account Detail Type */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="isDetail" className="text-right">
                ประเภทบัญชี
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.isDetail ? 'detail' : 'header'}
                  onValueChange={(v) =>
                    handleInputChange('isDetail', v === 'detail')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detail">
                      บัญชีรายละเอียด (สามารถลงบัญชีได้)
                    </SelectItem>
                    <SelectItem value="header">
                      บัญชีหมวด (สำหรับจัดกลุ่ม)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Status (only for edit mode) */}
            {isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  สถานะ
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange('isActive', checked)
                    }
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    {formData.isActive ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                  </Label>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                หมายเหตุ
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึก'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
