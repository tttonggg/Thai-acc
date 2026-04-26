'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Asset {
  id: string
  code: string
  name: string
  purchaseDate: string
  purchaseCost: number
  salvageValue: number
  usefulLifeYears: number
  depreciationRate: number
  glAccountId: string | null
  accumDepAccountId: string | null
  depExpenseAccountId: string | null
  isActive: boolean
  metadata?: { notes?: string }
}

interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: string
}

interface AssetEditDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mode: 'create' | 'edit'
}

export function AssetEditDialog({
  asset,
  open,
  onOpenChange,
  onSuccess,
  mode,
}: AssetEditDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    purchaseDate: '',
    purchaseCost: '',
    salvageValue: '1',
    usefulLifeYears: '5',
    glAccountId: '',
    accumDepAccountId: '',
    depExpenseAccountId: '',
    isActive: true,
    notes: '',
  })
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [hasPostedDepreciation, setHasPostedDepreciation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Fetch chart of accounts
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`/api/accounts`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setAccounts(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching accounts:', error)
      }
    }
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (asset && mode === 'edit') {
      setFormData({
        code: asset.code || '',
        name: asset.name || '',
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
        purchaseCost: asset.purchaseCost?.toString() || '',
        salvageValue: asset.salvageValue?.toString() || '1',
        usefulLifeYears: asset.usefulLifeYears?.toString() || '5',
        glAccountId: asset.glAccountId || '',
        accumDepAccountId: asset.accumDepAccountId || '',
        depExpenseAccountId: asset.depExpenseAccountId || '',
        isActive: asset.isActive ?? true,
        notes: (asset.metadata as any)?.notes || '',
      })

      // Check if asset has posted depreciation
      checkPostedDepreciation(asset.id)
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        code: '',
        name: '',
        purchaseDate: '',
        purchaseCost: '',
        salvageValue: '1',
        usefulLifeYears: '5',
        glAccountId: '',
        accumDepAccountId: '',
        depExpenseAccountId: '',
        isActive: true,
        notes: '',
      })
      setHasPostedDepreciation(false)
    }
  }, [asset, mode])

  const checkPostedDepreciation = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data.schedules) {
          const posted = data.data.schedules.some((s: any) => s.posted)
          setHasPostedDepreciation(posted)
        }
      }
    } catch (error) {
      console.error('Error checking posted depreciation:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'กรุณาระบุรหัสสินทรัพย์'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อสินทรัพย์'
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'กรุณาระบุวันที่ซื้อ'
    }

    if (!formData.purchaseCost || parseFloat(formData.purchaseCost) <= 0) {
      newErrors.purchaseCost = 'กรุณาระบุราคาทุนที่ถูกต้อง'
    }

    if (!formData.usefulLifeYears || parseInt(formData.usefulLifeYears) <= 0) {
      newErrors.usefulLifeYears = 'กรุณาระบุอายุการใช้งานที่ถูกต้อง'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = mode === 'edit' && asset ? `/api/assets/${asset.id}` : '/api/assets'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const payload = {
        code: formData.code,
        name: formData.name,
        purchaseDate: formData.purchaseDate,
        purchaseCost: parseFloat(formData.purchaseCost),
        salvageValue: parseFloat(formData.salvageValue),
        usefulLifeYears: parseInt(formData.usefulLifeYears),
        glAccountId: formData.glAccountId || null,
        accumDepAccountId: formData.accumDepAccountId || null,
        depExpenseAccountId: formData.depExpenseAccountId || null,
        isActive: formData.isActive,
        notes: formData.notes,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: mode === 'edit' ? 'แก้ไขสำเร็จ' : 'สร้างสำเร็จ',
          description: mode === 'edit'
            ? `แก้ไขสินทรัพย์ ${formData.name} เรียบร้อยแล้ว`
            : `สร้างสินทรัพย์ ${formData.name} พร้อมตารางค่าเสื่อมราคาแล้ว`,
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
      console.error('Error saving asset:', error)
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

  // Calculate monthly depreciation
  const calculateMonthlyDepreciation = () => {
    const cost = parseFloat(formData.purchaseCost) || 0
    const salvage = parseFloat(formData.salvageValue) || 0
    const years = parseInt(formData.usefulLifeYears) || 1
    const depreciableAmount = cost - salvage
    const monthlyDepreciation = depreciableAmount / (years * 12)
    return monthlyDepreciation
  }

  const filterAssetAccounts = () => {
    return accounts.filter(acc => acc.code.startsWith('12')) // Asset accounts
  }

  const filterExpenseAccounts = () => {
    return accounts.filter(acc => acc.code.startsWith('5')) // Expense accounts
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'แก้ไขสินทรัพย์ถาวร' : 'ลงทะเบียนสินทรัพย์ถาวร (TAS 16)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'edit'
              ? 'แก้ไขข้อมูลสินทรัพย์ถาวรรวมถึงราคาทุน อายุการใช้งาน อัตราค่าเสื่อมราคาและการเชื่อมโยงกับบัญชีทางบัญชี'
              : 'ลงทะเบียนสินทรัพย์ถาวรใหม่พร้อมการตั้งค่าค่าเสื่อมราคาและการเชื่อมโยงกับบัญชีทางบัญชี'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">
                  รหัสสินทรัพย์ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="FA-001"
                  className={errors.code ? 'border-red-500' : ''}
                  disabled={mode === 'edit'}
                />
                {errors.code && (
                  <p className="text-sm text-red-500 mt-1">{errors.code}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">
                  ชื่อสินทรัพย์ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="เช่น คอมพิวเตอร์, รถยนต์"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Purchase Date & Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">
                  วันที่ซื้อ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  className={errors.purchaseDate ? 'border-red-500' : ''}
                  disabled={hasPostedDepreciation}
                />
                {errors.purchaseDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.purchaseDate}</p>
                )}
                {hasPostedDepreciation && (
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถแก้ไขได้ (มีการบันทึกค่าเสื่อมราคาแล้ว)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="purchaseCost">
                  ราคาทุน (บาท) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchaseCost"
                  type="number"
                  value={formData.purchaseCost}
                  onChange={(e) => handleInputChange('purchaseCost', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors.purchaseCost ? 'border-red-500' : ''}
                  disabled={hasPostedDepreciation}
                />
                {errors.purchaseCost && (
                  <p className="text-sm text-red-500 mt-1">{errors.purchaseCost}</p>
                )}
                {hasPostedDepreciation && (
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถแก้ไขได้ (มีการบันทึกค่าเสื่อมราคาแล้ว)
                  </p>
                )}
              </div>
            </div>

            {/* Salvage Value & Useful Life */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salvageValue">ค่าซาก (บาท)</Label>
                <Input
                  id="salvageValue"
                  type="number"
                  value={formData.salvageValue}
                  onChange={(e) => handleInputChange('salvageValue', e.target.value)}
                  placeholder="1.00"
                  min="0"
                  step="0.01"
                  disabled={hasPostedDepreciation}
                />
                {hasPostedDepreciation && (
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถแก้ไขได้ (มีการบันทึกค่าเสื่อมราคาแล้ว)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="usefulLifeYears">
                  อายุการใช้งาน (ปี) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usefulLifeYears"
                  type="number"
                  value={formData.usefulLifeYears}
                  onChange={(e) => handleInputChange('usefulLifeYears', e.target.value)}
                  placeholder="5"
                  min="1"
                  className={errors.usefulLifeYears ? 'border-red-500' : ''}
                  disabled={hasPostedDepreciation}
                />
                {errors.usefulLifeYears && (
                  <p className="text-sm text-red-500 mt-1">{errors.usefulLifeYears}</p>
                )}
                {hasPostedDepreciation && (
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถแก้ไขได้ (มีการบันทึกค่าเสื่อมราคาแล้ว)
                  </p>
                )}
              </div>
            </div>

            {/* Depreciation Calculation Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>คำนวณค่าเสื่อมราคา:</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                วิธีเส้นตรง (Straight-Line) - เดือนละ{' '}
                <span className="font-semibold">
                  ฿{calculateMonthlyDepreciation().toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                อัตราค่าเสื่อมราคา: {(100 / parseInt(formData.usefulLifeYears || '5')).toFixed(2)}% ต่อปี
              </p>
            </div>

            {/* GL Accounts */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="glAccountId">บัญชีสินทรัพย์ (GL)</Label>
                <Select
                  value={formData.glAccountId}
                  onValueChange={(value) => handleInputChange('glAccountId', value)}
                >
                  <SelectTrigger id="glAccountId">
                    <SelectValue placeholder="เลือกบัญชีสินทรัพย์" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterAssetAccounts().map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accumDepAccountId">บัญชีค่าเสื่อมสะสม</Label>
                  <Select
                    value={formData.accumDepAccountId}
                    onValueChange={(value) => handleInputChange('accumDepAccountId', value)}
                  >
                    <SelectTrigger id="accumDepAccountId">
                      <SelectValue placeholder="เลือกบัญชี" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterAssetAccounts().map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="depExpenseAccountId">บัญชีค่าเสื่อมประจำปี</Label>
                  <Select
                    value={formData.depExpenseAccountId}
                    onValueChange={(value) => handleInputChange('depExpenseAccountId', value)}
                  >
                    <SelectTrigger id="depExpenseAccountId">
                      <SelectValue placeholder="เลือกบัญชี" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterExpenseAccounts().map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status */}
            {mode === 'edit' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {formData.isActive ? 'ใช้งานอยู่' : 'ปลดระวางแล้ว'}
                </Label>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              />
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
              {isSubmitting
                ? 'กำลังบันทึก...'
                : mode === 'edit'
                ? 'บันทึกการแก้ไข'
                : 'บันทึก & สร้างตาราง'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
