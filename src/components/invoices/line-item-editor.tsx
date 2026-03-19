'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Pencil,
  Save,
  X,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatThaiDate, formatCurrency } from '@/lib/thai-accounting'

// ============================================
// Types
// ============================================

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED'

export interface Product {
  id: string
  code: string
  name: string
  unit?: string
}

export interface InvoiceLineWithProduct {
  id: string
  lineNo: number
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  vatRate: number
  vatAmount: number
  amount: number
  productId?: string | null
  product?: Product | null
  auditTrail?: AuditEntry[]
}

export interface AuditEntry {
  id: string
  action: string
  field?: string
  oldValue?: string | null
  newValue?: string | null
  beforeQuantity?: number | null
  afterQuantity?: number | null
  quantityDiff?: number | null
  beforeUnitPrice?: number | null
  afterUnitPrice?: number | null
  unitPriceDiff?: number | null
  beforeDiscount?: number | null
  afterDiscount?: number | null
  discountDiff?: number | null
  beforeDescription?: string | null
  afterDescription?: string | null
  changeReason?: string | null
  changedById: string
  changedByName?: string
  createdAt: Date | string
}

export interface LineUpdateData {
  description?: string
  quantity?: number
  unit?: string
  unitPrice?: number
  discount?: number
  changeReason?: string
}

export interface LineItemEditorProps {
  line: InvoiceLineWithProduct
  invoiceId: string
  invoiceStatus: InvoiceStatus
  onUpdate: (lineId: string, data: LineUpdateData) => Promise<void>
  onDelete?: (lineId: string) => Promise<void>
  canEdit: boolean
  showAuditButton?: boolean
  products?: Product[]
  editMode?: 'inline' | 'dialog'
}

// ============================================
// Main Component
// ============================================

export function LineItemEditor({
  line,
  invoiceId,
  invoiceStatus,
  onUpdate,
  onDelete,
  canEdit,
  showAuditButton = true,
  products = [],
  editMode = 'inline'
}: LineItemEditorProps) {
  const { toast } = useToast()

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAuditDialog, setShowAuditDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    discount: line.discount,
    changeReason: ''
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if line has been edited before
  const hasEdits = (line.auditTrail?.length ?? 0) > 0

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    setFormData({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discount: line.discount,
      changeReason: ''
    })
  }, [line])

  // Warn when trying to navigate with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // ============================================
  // Helpers
  // ============================================

  const calculateTotals = useCallback(() => {
    const beforeDiscount = formData.quantity * formData.unitPrice
    const discountAmount = beforeDiscount * (formData.discount / 100)
    const afterDiscount = beforeDiscount - discountAmount
    const vatAmount = afterDiscount * (line.vatRate / 100)
    const amount = afterDiscount

    return { amount, vatAmount }
  }, [formData.quantity, formData.unitPrice, formData.discount, line.vatRate])

  const { amount: calculatedAmount, vatAmount: calculatedVat } = calculateTotals()

  // ============================================
  // Validation
  // ============================================

  const validateField = (field: keyof typeof formData, value: any) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'description':
        if (!value || !value.trim()) {
          newErrors.description = 'กรุณาระบุรายการสินค้า'
        } else {
          delete newErrors.description
        }
        break

      case 'quantity':
        if (value <= 0) {
          newErrors.quantity = 'จำนวนต้องมากกว่า 0'
        } else if (!Number.isInteger(value)) {
          newErrors.quantity = 'จำนวนต้องเป็นจำนวนเต็ม'
        } else {
          delete newErrors.quantity
        }
        break

      case 'unitPrice':
        if (value < 0) {
          newErrors.unitPrice = 'ราคาต่อหน่วยต้องไม่ติดลบ'
        } else {
          delete newErrors.unitPrice
        }
        break

      case 'discount':
        if (value < 0) {
          newErrors.discount = 'ส่วนลดต้องไม่ติดลบ'
        } else if (value > 100) {
          newErrors.discount = 'ส่วนลดต้องไม่เกิน 100%'
        } else {
          delete newErrors.discount
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = (): boolean => {
    let isValid = true

    if (!formData.description.trim()) {
      setErrors(prev => ({ ...prev, description: 'กรุณาระบุรายการสินค้า' }))
      isValid = false
    }

    if (formData.quantity <= 0) {
      setErrors(prev => ({ ...prev, quantity: 'จำนวนต้องมากกว่า 0' }))
      isValid = false
    }

    if (formData.unitPrice < 0) {
      setErrors(prev => ({ ...prev, unitPrice: 'ราคาต่อหน่วยต้องไม่ติดลบ' }))
      isValid = false
    }

    if (formData.discount < 0 || formData.discount > 100) {
      setErrors(prev => ({ ...prev, discount: 'ส่วนลดต้องอยู่ระหว่าง 0-100%' }))
      isValid = false
    }

    return isValid
  }

  // ============================================
  // Actions
  // ============================================

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    validateField(field, value)
  }

  const handleStartEdit = () => {
    if (!canEdit) {
      toast({
        title: 'ไม่สามารถแก้ไขได้',
        description: invoiceStatus !== 'DRAFT'
          ? 'เฉพาะใบกำกับภาษีสถานะร่างเท่านั้นที่สามารถแก้ไขได้ (Thai Tax Compliance)'
          : 'คุณไม่มีสิทธิ์แก้ไขรายการ',
        variant: 'destructive',
      })
      return
    }

    setIsEditing(true)
    setHasUnsavedChanges(false)
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?')) {
        return
      }
    }

    // Reset form
    setFormData({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discount: line.discount,
      changeReason: ''
    })
    setErrors({})
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'กรุณาตรวจสอบข้อมูล',
        description: 'มีข้อมูลที่ต้องกรอกไม่ครบถ้วน',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      const updateData: LineUpdateData = {
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        unitPrice: formData.unitPrice,
        discount: formData.discount,
      }

      // Only include change reason if something actually changed
      const hasChanges =
        formData.description !== line.description ||
        formData.quantity !== line.quantity ||
        formData.unit !== line.unit ||
        formData.unitPrice !== line.unitPrice ||
        formData.discount !== line.discount

      if (hasChanges && formData.changeReason.trim()) {
        updateData.changeReason = formData.changeReason
      }

      await onUpdate(line.id, updateData)

      toast({
        title: 'บันทึกสำเร็จ',
        description: 'อัปเดตรายการสินค้าเรียบร้อยแล้ว',
      })

      setIsEditing(false)
      setHasUnsavedChanges(false)
    } catch (error: any) {
      console.error('Error saving line:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกรายการได้',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      return
    }

    try {
      await onDelete(line.id)
      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบรายการสินค้าเรียบร้อยแล้ว',
      })
    } catch (error: any) {
      console.error('Error deleting line:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบรายการได้',
        variant: 'destructive',
      })
    }
  }

  const fetchAuditHistory = async () => {
    setLoadingAudit(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/lines/${line.id}`)
      const result = await response.json()

      if (response.ok) {
        setAuditHistory(result.data?.auditTrail || [])
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถดึงประวัติการแก้ไขได้',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching audit history:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงประวัติการแก้ไขได้',
        variant: 'destructive',
      })
    } finally {
      setLoadingAudit(false)
    }
  }

  const handleOpenAuditDialog = () => {
    setShowAuditDialog(true)
    fetchAuditHistory()
  }

  // ============================================
  // Render
  // ============================================

  if (!isEditing) {
    // View Mode - Read-only display
    return (
      <>
        <div className="flex items-center justify-between gap-2 p-3 hover:bg-muted/50 rounded-lg transition-colors">
          <div className="flex-1 grid grid-cols-12 gap-3 items-center text-sm">
            {/* Line number and description */}
            <div className="col-span-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">#{line.lineNo}</span>
                <span className="font-medium">{line.description}</span>
                {hasEdits && (
                  <Badge variant="secondary" className="text-xs">
                    แก้ไขแล้ว
                  </Badge>
                )}
              </div>
              {line.product && (
                <div className="text-xs text-muted-foreground mt-1">
                  {line.product.code} - {line.product.name}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="col-span-1 text-center">
              {line.quantity.toLocaleString('th-TH')}
            </div>

            {/* Unit */}
            <div className="col-span-1">
              {line.unit}
            </div>

            {/* Unit Price */}
            <div className="col-span-1 text-right">
              {formatCurrency(line.unitPrice)}
            </div>

            {/* Discount */}
            <div className="col-span-1 text-center">
              {line.discount > 0 ? `${line.discount}%` : '-'}
            </div>

            {/* Amount */}
            <div className="col-span-2 text-right font-medium">
              {formatCurrency(line.amount)}
            </div>

            {/* VAT */}
            <div className="col-span-1 text-right text-xs text-muted-foreground">
              {formatCurrency(line.vatAmount)}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end gap-1">
              {showAuditButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleOpenAuditDialog}
                  disabled={!hasEdits}
                  title="ประวัติการแก้ไข"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleStartEdit}
                disabled={!canEdit}
                title="แก้ไขรายการ"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {onDelete && canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  title="ลบรายการ"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Audit History Dialog */}
        <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                ประวัติการแก้ไขรายการ #{line.lineNo}
              </DialogTitle>
            </DialogHeader>

            {loadingAudit ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">กำลังโหลด...</span>
              </div>
            ) : auditHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                ไม่มีประวัติการแก้ไข
              </div>
            ) : (
              <div className="space-y-3">
                {auditHistory.map((entry) => (
                  <AuditHistoryEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Edit Mode - Inline
  return (
    <div className="border-2 border-primary rounded-lg p-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">แก้ไขรายการ #{line.lineNo}</Badge>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="animate-pulse">
              มีการเปลี่ยนแปลง
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            ยกเลิก
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || Object.keys(errors).length > 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Description */}
        <div className="col-span-4 space-y-1">
          <Label className="text-sm">
            รายการสินค้า <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className={errors.description ? 'border-destructive' : ''}
            placeholder="ระบุรายการสินค้า"
            onBlur={() => validateField('description', formData.description)}
          />
          {errors.description && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="col-span-1 space-y-1">
          <Label className="text-sm">
            จำนวน <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
            className={errors.quantity ? 'border-destructive' : ''}
            onBlur={() => validateField('quantity', formData.quantity)}
          />
          {errors.quantity && (
            <p className="text-xs text-destructive">{errors.quantity}</p>
          )}
        </div>

        {/* Unit */}
        <div className="col-span-1 space-y-1">
          <Label className="text-sm">หน่วย</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => handleFieldChange('unit', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ชิ้น">ชิ้น</SelectItem>
              <SelectItem value="ชุด">ชุด</SelectItem>
              <SelectItem value="กล่อง">กล่อง</SelectItem>
              <SelectItem value="แพ็ค">แพ็ค</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="ลิตร">ลิตร</SelectItem>
              <SelectItem value="เมตร">เมตร</SelectItem>
              <SelectItem value="ครั้ง">ครั้ง</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unit Price */}
        <div className="col-span-2 space-y-1">
          <Label className="text-sm">
            ราคาต่อหน่วย <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
            className={errors.unitPrice ? 'border-destructive' : ''}
            onBlur={() => validateField('unitPrice', formData.unitPrice)}
          />
          {errors.unitPrice && (
            <p className="text-xs text-destructive">{errors.unitPrice}</p>
          )}
        </div>

        {/* Discount */}
        <div className="col-span-1 space-y-1">
          <Label className="text-sm">ส่วนลด</Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={formData.discount}
              onChange={(e) => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
              className={errors.discount ? 'border-destructive' : ''}
              onBlur={() => validateField('discount', formData.discount)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          {errors.discount && (
            <p className="text-xs text-destructive">{errors.discount}</p>
          )}
        </div>

        {/* Calculated Amount */}
        <div className="col-span-2 space-y-1">
          <Label className="text-sm">จำนวนเงิน</Label>
          <div className="p-2 bg-muted rounded text-right font-medium">
            {formatCurrency(calculatedAmount)}
          </div>
        </div>

        {/* VAT Amount */}
        <div className="col-span-1 space-y-1">
          <Label className="text-sm">VAT {line.vatRate}%</Label>
          <div className="p-2 bg-muted rounded text-right text-sm">
            {formatCurrency(calculatedVat)}
          </div>
        </div>
      </div>

      {/* Change Reason */}
      <div className="mt-4 space-y-1">
        <Label className="text-sm">เหตุผลการแก้ไข (ถ้ามี)</Label>
        <Input
          value={formData.changeReason}
          onChange={(e) => handleFieldChange('changeReason', e.target.value)}
          placeholder="ระบุเหตุผลในการแก้ไข (ไม่บังคับ)"
        />
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ยอดรวม:</span>
          <span className="font-medium">{formatCurrency(calculatedAmount + calculatedVat)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          ข้อมูลถูกต้องทั้งหมด
        </div>
      </div>
    </div>
  )
}

// ============================================
// Subcomponents
// ============================================

interface AuditHistoryEntryProps {
  entry: AuditEntry
}

function AuditHistoryEntry({ entry }: AuditHistoryEntryProps) {
  const getActionBadge = () => {
    switch (entry.action) {
      case 'CREATED':
        return <Badge variant="default">สร้าง</Badge>
      case 'UPDATED':
        return <Badge variant="secondary">แก้ไข</Badge>
      case 'DELETED':
        return <Badge variant="destructive">ลบ</Badge>
      default:
        return <Badge variant="outline">{entry.action}</Badge>
    }
  }

  const getFieldName = () => {
    const fieldNames: Record<string, string> = {
      description: 'รายการ',
      quantity: 'จำนวน',
      unit: 'หน่วย',
      unitPrice: 'ราคาต่อหน่วย',
      discount: 'ส่วนลด',
      SUMMARY: 'หลายฟิลด์',
    }
    return fieldNames[entry.field || ''] || entry.field
  }

  const renderChangeValue = () => {
    if (entry.field === 'quantity' && entry.beforeQuantity !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <span className="line-through text-muted-foreground">{entry.beforeQuantity}</span>
          <span className="text-muted-foreground">→</span>
          <span className={`font-medium ${entry.quantityDiff && entry.quantityDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {entry.afterQuantity}
          </span>
          {entry.quantityDiff !== undefined && entry.quantityDiff !== 0 && (
            <span className={`text-xs ${entry.quantityDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({entry.quantityDiff > 0 ? '+' : ''}{entry.quantityDiff})
            </span>
          )}
        </div>
      )
    }

    if (entry.field === 'unitPrice' && entry.beforeUnitPrice !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <span className="line-through text-muted-foreground">{formatCurrency(entry.beforeUnitPrice)}</span>
          <span className="text-muted-foreground">→</span>
          <span className={`font-medium ${entry.unitPriceDiff && entry.unitPriceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(entry.afterUnitPrice || 0)}
          </span>
          {entry.unitPriceDiff !== undefined && entry.unitPriceDiff !== 0 && (
            <span className={`text-xs ${entry.unitPriceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({entry.unitPriceDiff > 0 ? '+' : ''}{formatCurrency(entry.unitPriceDiff)})
            </span>
          )}
        </div>
      )
    }

    if (entry.field === 'discount' && entry.beforeDiscount !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <span className="line-through text-muted-foreground">{entry.beforeDiscount}%</span>
          <span className="text-muted-foreground">→</span>
          <span className={`font-medium ${entry.discountDiff && entry.discountDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {entry.afterDiscount}%
          </span>
          {entry.discountDiff !== undefined && entry.discountDiff !== 0 && (
            <span className={`text-xs ${entry.discountDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ({entry.discountDiff > 0 ? '+' : ''}{entry.discountDiff}%)
            </span>
          )}
        </div>
      )
    }

    if (entry.field === 'description') {
      return (
        <div className="space-y-1">
          {entry.beforeDescription && (
            <div className="text-sm">
              <span className="text-muted-foreground">ก่อนแก้ไข:</span>
              <div className="line-through text-muted-foreground">{entry.beforeDescription}</div>
            </div>
          )}
          {entry.afterDescription && (
            <div className="text-sm">
              <span className="text-muted-foreground">หลังแก้ไข:</span>
              <div className="font-medium text-green-700">{entry.afterDescription}</div>
            </div>
          )}
        </div>
      )
    }

    // Default display
    return (
      <div className="flex items-center gap-2">
        {entry.oldValue && (
          <>
            <span className="line-through text-muted-foreground">{entry.oldValue}</span>
            <span className="text-muted-foreground">→</span>
          </>
        )}
        {entry.newValue && (
          <span className="font-medium text-green-700">{entry.newValue}</span>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getActionBadge()}
          {entry.field && (
            <span className="text-sm font-medium">{getFieldName()}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatThaiDate(entry.createdAt)}
        </div>
      </div>

      {/* Change Details */}
      <div className="pl-4 border-l-2 border-muted">
        {renderChangeValue()}
      </div>

      {/* User & Reason */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
        <div>
          โดย: <span className="font-medium">{entry.changedByName || entry.changedById}</span>
        </div>
        {entry.changeReason && (
          <div>
            เหตุผล: <span>{entry.changeReason}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Export Types
// ============================================

export type {
  AuditEntry,
  LineUpdateData,
  InvoiceLineWithProduct,
  InvoiceStatus,
  Product,
  LineItemEditorProps
}
