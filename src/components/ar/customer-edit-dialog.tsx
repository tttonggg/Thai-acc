'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useToast } from '@/hooks/use-toast'

interface Customer {
  id: string
  code: string
  name: string
  taxId: string
  address: string
  phone: string
  email: string
  creditLimit: number
  paymentTerms: number
  contactPerson: string
  status: 'active' | 'inactive'
}

interface CustomerEditDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CustomerEditDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: CustomerEditDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    creditLimit: 0,
    paymentTerms: 30,
    contactPerson: '',
    status: 'active' as 'active' | 'inactive',
  })
  const [hasTransactions, setHasTransactions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-populate form when customer data changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        taxId: customer.taxId || '',
        address: customer.address || '',
        phone: customer.phone || '',
        email: customer.email || '',
        creditLimit: customer.creditLimit || 0,
        paymentTerms: customer.paymentTerms || 30,
        contactPerson: customer.contactPerson || '',
        status: customer.status || 'active',
      })
      // Check if customer has transactions (this would be an API call in real implementation)
      checkCustomerTransactions(customer.id)
    }
  }, [customer])

  const checkCustomerTransactions = async (customerId: string) => {
    try {
      // API call to check if customer has transactions
      const response = await fetch(`/api/customers/${customerId}/has-transactions`)
      if (response.ok) {
        const data = await response.json()
        setHasTransactions(data.hasTransactions)
      }
    } catch (error) {
      console.error('Error checking customer transactions:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name required
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อ'
    }

    // Tax ID validation (must be 13 digits if provided)
    if (formData.taxId && !/^\d{13}$/.test(formData.taxId.replace(/-/g, ''))) {
      newErrors.taxId = 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก'
    }

    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }

    // Credit limit validation
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'วงเงินเครดิตต้องไม่น้อยกว่า 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customer) return

    // Validate form
    if (!validateForm()) {
      return
    }

    // Check if trying to deactivate customer with transactions
    if (formData.status === 'inactive' && hasTransactions) {
      toast({
        title: 'ไม่สามารถระงับลูกค้าได้',
        description: 'ไม่สามารถระงับลูกค้าที่มีรายการแล้ว',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว',
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogDescription>
            Edit customer information dialog
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Customer Code (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                รหัสลูกค้า
              </Label>
              <Input
                id="code"
                value={customer?.code || ''}
                disabled
                className="col-span-3 bg-gray-100"
              />
            </div>

            {/* Name (Required) */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อลูกค้า <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ชื่อบริษัท/ห้างหุ้นส่วน"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Tax ID */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="taxId" className="text-right">
                เลขประจำตัวผู้เสียภาษี
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="0105555000000"
                  maxLength={13}
                  className={errors.taxId ? 'border-red-500' : ''}
                />
                {errors.taxId && (
                  <p className="text-sm text-red-500">{errors.taxId}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                ที่อยู่
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="ที่อยู่"
                className="col-span-3"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="02-000-0000"
                className="col-span-3"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                อีเมล
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@company.co.th"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Credit Limit */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="creditLimit" className="text-right">
                วงเงินเครดิต
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange('creditLimit', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={errors.creditLimit ? 'border-red-500' : ''}
                />
                {errors.creditLimit && (
                  <p className="text-sm text-red-500">{errors.creditLimit}</p>
                )}
              </div>
            </div>

            {/* Payment Terms */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentTerms" className="text-right">
                เครดิต (วัน)
              </Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', Number(e.target.value))}
                placeholder="30"
                min="0"
                className="col-span-3"
              />
            </div>

            {/* Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-right">
                ผู้ติดต่อ
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="ชื่อผู้ติดต่อ"
                className="col-span-3"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                สถานะ
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) =>
                    handleInputChange('status', checked ? 'active' : 'inactive')
                  }
                  disabled={hasTransactions}
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {formData.status === 'active' ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                </Label>
                {hasTransactions && formData.status === 'active' && (
                  <p className="text-sm text-gray-500 ml-2">
                    (ไม่สามารถระงับได้เนื่องจากมีรายการ)
                  </p>
                )}
              </div>
            </div>
          </CardContent>

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
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
