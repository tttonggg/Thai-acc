'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductForm } from './product-form'
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

interface ProductEditDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductEditDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: Partial<Product>) => {
    setIsSubmitting(true)

    try {
      const url = product?.id
        ? `/api/products/${product.id}`
        : '/api/products'

      const method = product?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ไม่สามารถบันทึกข้อมูลได้')
      }

      const result = await response.json()

      toast({
        title: product?.id ? 'บันทึกสำเร็จ' : 'สร้างสำเร็จ',
        description: product?.id
          ? 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว'
          : 'เพิ่มสินค้าใหม่เรียบร้อยแล้ว',
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error saving product:', error)

      const message = error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้'

      // Check for specific error messages
      if (message.includes('unique') || message.includes('รหัส')) {
        toast({
          title: 'รหัสสินค้าซ้ำ',
          description: 'รหัสสินค้านี้ถูกใช้งานแล้ว กรุณาระบุรหัสอื่น',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: message,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product?.id ? 'แก้ไขสินค้า/บริการ' : 'เพิ่มสินค้า/บริการใหม่'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit product information dialog
          </DialogDescription>
        </DialogHeader>

        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
