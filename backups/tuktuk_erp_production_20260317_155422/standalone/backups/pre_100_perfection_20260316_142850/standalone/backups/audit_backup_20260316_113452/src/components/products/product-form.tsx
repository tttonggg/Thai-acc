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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  code: string
  name: string
  nameEn?: string
  description?: string
  category?: string
  unit: string
  type: 'PRODUCT' | 'SERVICE'
  salePrice: number
  costPrice: number
  vatRate: number
  vatType: 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE'
  isInventory: boolean
  quantity: number
  minQuantity: number
  incomeType?: string
  costingMethod: 'WEIGHTED_AVERAGE' | 'FIFO'
  isActive: boolean
  notes?: string
}

interface ProductFormProps {
  product: Product | null
  onSubmit: (data: Partial<Product>) => Promise<void>
  isLoading?: boolean
}

const PRODUCT_CATEGORIES = [
  'สินค้าสำเร็จรูป',
  'วัตถุดิบ',
  'สินค้ากึ่งสำเร็จรูป',
  'บริการ',
  'อื่นๆ',
]

const PRODUCT_UNITS = [
  'ชิ้น',
  'กล่อง',
  'แพ็ค',
  'โหล',
  'กิโลกรัม',
  'กรัม',
  'ลิตร',
  'มิลลิลิตร',
  'เมตร',
  'เซนติเมตร',
  'คู่',
  'ชุด',
  'ใบ',
  'มัด',
  'ถัง',
  'กระป๋อง',
  'ขวด',
  'หีบ',
]

const VAT_RATES = [0, 7]

const INCOME_TYPES = [
  { value: 'service', label: 'ค่าบริการ (3%)' },
  { value: 'rent', label: 'ค่าเช่า (5%)' },
  { value: 'professional', label: 'ค่าบริการวิชาชีพ (3%)' },
  { value: 'contract', label: 'ค่าจ้างทำของ (1%)' },
  { value: 'advertising', label: 'ค่าโฆษณา (2%)' },
]

const COSTING_METHODS = [
  { value: 'WEIGHTED_AVERAGE', label: 'ต้นทุนเฉลี่ยถ่วงน้ำหนัก (WAC)' },
  { value: 'FIFO', label: 'เข้าก่อนออกก่อน (FIFO)' },
]

const CATEGORY_CODE_PREFIXES: Record<string, string> = {
  'สินค้าสำเร็จรูป': 'FG',
  'วัตถุดิบ': 'RM',
  'สินค้ากึ่งสำเร็จรูป': 'WIP',
  'บริการ': 'SV',
  'อื่นๆ': 'OT',
}

export function ProductForm({ product, onSubmit, isLoading = false }: ProductFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    description: '',
    category: '',
    unit: 'ชิ้น',
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    salePrice: 0,
    costPrice: 0,
    vatRate: 7,
    vatType: 'EXCLUSIVE' as 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE',
    isInventory: false,
    quantity: 0,
    minQuantity: 0,
    incomeType: '',
    costingMethod: 'WEIGHTED_AVERAGE' as 'WEIGHTED_AVERAGE' | 'FIFO',
    isActive: true,
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        nameEn: product.nameEn || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit || 'ชิ้น',
        type: product.type || 'PRODUCT',
        salePrice: product.salePrice || 0,
        costPrice: product.costPrice || 0,
        vatRate: product.vatRate || 7,
        vatType: product.vatType || 'EXCLUSIVE',
        isInventory: product.isInventory || false,
        quantity: product.quantity || 0,
        minQuantity: product.minQuantity || 0,
        incomeType: product.incomeType || '',
        costingMethod: product.costingMethod || 'WEIGHTED_AVERAGE',
        isActive: product.isActive !== false,
        notes: product.notes || '',
      })
    }
  }, [product])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Code required
    if (!formData.code.trim()) {
      newErrors.code = 'กรุณาระบุรหัสสินค้า'
    }

    // Name required
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อสินค้า'
    }

    // Sale price validation
    if (formData.salePrice < 0) {
      newErrors.salePrice = 'ราคาขายต้องไม่น้อยกว่า 0'
    }

    // Cost price validation
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'ราคาทุนต้องไม่น้อยกว่า 0'
    }

    // Sale price should be greater than cost price
    if (formData.salePrice > 0 && formData.costPrice > 0 && formData.salePrice < formData.costPrice) {
      newErrors.salePrice = 'ราคาขายควรมากกว่าราคาทุน'
    }

    // VAT rate validation
    if (formData.vatType !== 'NONE' && formData.vatRate === 0) {
      newErrors.vatRate = 'กรุณาระบุอัตรา VAT'
    }

    // Inventory validations
    if (formData.isInventory) {
      if (formData.quantity < 0) {
        newErrors.quantity = 'จำนวนคงเหลือต้องไม่น้อยกว่า 0'
      }
      if (formData.minQuantity < 0) {
        newErrors.minQuantity = 'จำนวนต่ำสุดต้องไม่น้อยกว่า 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting product:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-generate code when category changes (only for new products)
      if (field === 'category' && !product && value) {
        const prefix = CATEGORY_CODE_PREFIXES[value] || 'PD'
        newData.code = prefix + Date.now().toString().slice(-6)
      }

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }

      return newData
    })
  }

  const isService = formData.type === 'SERVICE'

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h3>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                รหัสสินค้า <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="เช่น PD000001"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            {/* Product Type */}
            <div className="space-y-2">
              <Label htmlFor="type">ประเภท <span className="text-red-500">*</span></Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => handleInputChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">สินค้า</SelectItem>
                  <SelectItem value="SERVICE">บริการ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name (Thai) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              ชื่อสินค้า (ไทย) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="ชื่อสินค้าภาษาไทย"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Name (English) */}
          <div className="space-y-2">
            <Label htmlFor="nameEn">ชื่อสินค้า (อังกฤษ)</Label>
            <Input
              id="nameEn"
              value={formData.nameEn}
              onChange={(e) => handleInputChange('nameEn', e.target.value)}
              placeholder="Product name in English"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="รายละเอียดสินค้า"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit">
                หน่วย <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ข้อมูลราคา</h3>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="salePrice">
                ราคาขาย (บาท) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salePrice"
                type="number"
                value={formData.salePrice}
                onChange={(e) => handleInputChange('salePrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={errors.salePrice ? 'border-red-500' : ''}
              />
              {errors.salePrice && (
                <p className="text-sm text-red-500">{errors.salePrice}</p>
              )}
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <Label htmlFor="costPrice">ราคาทุน (บาท)</Label>
              <Input
                id="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={errors.costPrice ? 'border-red-500' : ''}
              />
              {errors.costPrice && (
                <p className="text-sm text-red-500">{errors.costPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VAT Rate */}
            <div className="space-y-2">
              <Label htmlFor="vatRate">อัตรา VAT</Label>
              <Select
                value={formData.vatRate.toString()}
                onValueChange={(value) => handleInputChange('vatRate', parseFloat(value))}
                disabled={formData.vatType === 'NONE'}
              >
                <SelectTrigger id="vatRate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VAT Type */}
            <div className="space-y-2">
              <Label htmlFor="vatType">ประเภท VAT</Label>
              <Select
                value={formData.vatType}
                onValueChange={(value: any) => {
                  handleInputChange('vatType', value)
                  if (value === 'NONE') {
                    handleInputChange('vatRate', 0)
                  } else if (formData.vatRate === 0) {
                    handleInputChange('vatRate', 7)
                  }
                }}
              >
                <SelectTrigger id="vatType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCLUSIVE">ยังไม่รวม VAT</SelectItem>
                  <SelectItem value="INCLUSIVE">รวม VAT แล้ว</SelectItem>
                  <SelectItem value="NONE">ไม่มี VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Service-specific fields */}
        {isService && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ข้อมูลภาษีหัก ณ ที่จ่าย</h3>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="incomeType">ประเภทรายได้ (สำหรับ 50 ทวิ)</Label>
              <Select
                value={formData.incomeType}
                onValueChange={(value) => handleInputChange('incomeType', value)}
              >
                <SelectTrigger id="incomeType">
                  <SelectValue placeholder="เลือกประเภทรายได้" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                ใช้สำหรับคำนวณภาษีหัก ณ ที่จ่ายเมื่อชำระเงิน
              </p>
            </div>
          </div>
        )}

        {/* Inventory-specific fields */}
        {!isService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">ข้อมูลสต็อก</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isInventory"
                  checked={formData.isInventory}
                  onCheckedChange={(checked) => handleInputChange('isInventory', checked)}
                />
                <Label htmlFor="isInventory" className="cursor-pointer">
                  ติดตามสต็อก
                </Label>
              </div>
            </div>
            <Separator />

            {formData.isInventory && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">จำนวนคงเหลือ</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500">{errors.quantity}</p>
                  )}
                </div>

                {/* Minimum Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">จำนวนต่ำสุด</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => handleInputChange('minQuantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={errors.minQuantity ? 'border-red-500' : ''}
                  />
                  {errors.minQuantity && (
                    <p className="text-sm text-red-500">{errors.minQuantity}</p>
                  )}
                </div>

                {/* Costing Method */}
                <div className="space-y-2">
                  <Label htmlFor="costingMethod">วิธีคิดต้นทุน</Label>
                  <Select
                    value={formData.costingMethod}
                    onValueChange={(value: any) => handleInputChange('costingMethod', value)}
                  >
                    <SelectTrigger id="costingMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COSTING_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ข้อมูลเพิ่มเติม</h3>
          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {formData.isActive ? 'ใช้งาน' : 'ระงับการใช้งาน'}
            </Label>
          </div>
        </div>
      </CardContent>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 mt-6 px-6 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (product?.id) {
              // Reset form to original values
              setFormData({
                code: product.code || '',
                name: product.name || '',
                nameEn: product.nameEn || '',
                description: product.description || '',
                category: product.category || '',
                unit: product.unit || 'ชิ้น',
                type: product.type || 'PRODUCT',
                salePrice: product.salePrice || 0,
                costPrice: product.costPrice || 0,
                vatRate: product.vatRate || 7,
                vatType: product.vatType || 'EXCLUSIVE',
                isInventory: product.isInventory || false,
                quantity: product.quantity || 0,
                minQuantity: product.minQuantity || 0,
                incomeType: product.incomeType || '',
                costingMethod: product.costingMethod || 'WEIGHTED_AVERAGE',
                isActive: product.isActive !== false,
                notes: product.notes || '',
              })
            }
          }}
          disabled={isLoading}
        >
          รีเซ็ต
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'กำลังบันทึก...' : product ? 'บันทึกการแก้ไข' : 'สร้างสินค้าใหม่'}
        </Button>
      </div>
    </form>
  )
}
