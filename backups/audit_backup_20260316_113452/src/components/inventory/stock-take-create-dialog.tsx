'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
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
import { Loader2 } from 'lucide-react'

interface Warehouse {
  id: string
  code: string
  name: string
  type: string
  location?: string
}

interface ProductStock {
  productId: string
  productCode: string
  productName: string
  unit: string
  systemQuantity: number
  unitCost: number
  actualQuantity?: number
  notes?: string
}

interface StockTakeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StockTakeCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: StockTakeCreateDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<ProductStock[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoadingWarehouses(true)
      try {
        const res = await fetch('/api/warehouses')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setWarehouses(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error)
      } finally {
        setIsLoadingWarehouses(false)
      }
    }
    fetchWarehouses()
  }, [])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        warehouseId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setProducts([])
      setErrors({})
    }
  }, [open])

  // Fetch current stock balances for selected warehouse
  const fetchStockBalances = async () => {
    if (!formData.warehouseId) {
      toast({
        title: 'กรุณาเลือกคลังสินค้า',
        description: 'ต้องเลือกคลังสินค้าก่อนดึงข้อมูลสต็อก',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingProducts(true)
    try {
      const res = await fetch(`/api/stock-balances?warehouseId=${formData.warehouseId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data.balances) {
          const stockProducts: ProductStock[] = data.data.balances
            .filter((balance: any) => balance.quantity > 0) // Only products with stock
            .map((balance: any) => ({
              productId: balance.product.id,
              productCode: balance.product.code,
              productName: balance.product.name,
              unit: balance.product.unit,
              systemQuantity: balance.quantity,
              unitCost: balance.unitCost || balance.product.costPrice || 0,
              actualQuantity: balance.quantity, // Default to system quantity
              notes: '',
            }))

          setProducts(stockProducts)

          toast({
            title: 'ดึงข้อมูลสำเร็จ',
            description: `พบ ${stockProducts.length} รายการสินค้า`,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching stock balances:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลสต็อกได้',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Update product actual quantity
  const updateProductQuantity = (index: number, value: string) => {
    const newProducts = [...products]
    newProducts[index].actualQuantity = parseFloat(value) || 0
    setProducts(newProducts)
  }

  // Update product notes
  const updateProductNotes = (index: number, value: string) => {
    const newProducts = [...products]
    newProducts[index].notes = value
    setProducts(newProducts)
  }

  // Calculate variance for a product
  const calculateVariance = (product: ProductStock) => {
    const actual = product.actualQuantity || 0
    return actual - product.systemQuantity
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.warehouseId) {
      newErrors.warehouseId = 'กรุณาเลือกคลังสินค้า'
    }

    if (!formData.date) {
      newErrors.date = 'กรุณาระบุวันที่ตรวจนับ'
    }

    if (products.length === 0) {
      newErrors.products = 'กรุณาดึงข้อมูลสินค้าอย่างน้อย 1 รายการ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit stock take
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        date: formData.date,
        warehouseId: formData.warehouseId,
        notes: formData.notes,
        lines: products.map((product) => ({
          productId: product.productId,
          systemQuantity: product.systemQuantity,
          actualQuantity: product.actualQuantity || 0,
          notes: product.notes,
        })),
      }

      const response = await fetch('/api/stock-takes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'บันทึกสำเร็จ',
          description: `สร้างการตรวจนับสต็อก ${data.data.takeNo} เรียบร้อยแล้ว`,
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
      console.error('Error creating stock take:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate variance statistics
  const varianceStats = products.reduce(
    (acc, product) => {
      const variance = calculateVariance(product)
      const varianceValue = variance * product.unitCost

      return {
        totalVarianceQty: acc.totalVarianceQty + variance,
        totalVarianceValue: acc.totalVarianceValue + varianceValue,
        positiveVariance: variance > 0 ? acc.positiveVariance + 1 : acc.positiveVariance,
        negativeVariance: variance < 0 ? acc.negativeVariance + 1 : acc.negativeVariance,
      }
    },
    { totalVarianceQty: 0, totalVarianceValue: 0, positiveVariance: 0, negativeVariance: 0 }
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบตรวจนับสินค้า (Stock Take)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Warehouse & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warehouseId">
                  คลังสินค้า <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, warehouseId: value }))
                    setProducts([]) // Reset products when warehouse changes
                    if (errors.warehouseId) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.warehouseId
                        return newErrors
                      })
                    }
                  }}
                  disabled={isLoadingWarehouses}
                >
                  <SelectTrigger id="warehouseId" className={errors.warehouseId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="เลือกคลังสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.code} — {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouseId && (
                  <p className="text-sm text-red-500 mt-1">{errors.warehouseId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="date">
                  วันที่ตรวจนับ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                    if (errors.date) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.date
                        return newErrors
                      })
                    }
                  }}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
              </div>
            </div>

            {/* Auto-populate button */}
            {formData.warehouseId && products.length === 0 && (
              <div className="flex justify-center py-4">
                <Button
                  type="button"
                  onClick={fetchStockBalances}
                  disabled={isLoadingProducts}
                  variant="outline"
                  className="w-full"
                >
                  {isLoadingProducts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังดึงข้อมูล...
                    </>
                  ) : (
                    'ดึงข้อมูลสต็อกปัจจุบัน'
                  )}
                </Button>
              </div>
            )}

            {/* Products table */}
            {products.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>รายการสินค้า ({products.length} รายการ)</Label>
                  <Button
                    type="button"
                    onClick={fetchStockBalances}
                    disabled={isLoadingProducts}
                    variant="outline"
                    size="sm"
                  >
                    {isLoadingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'รีเฟรชข้อมูล'
                    )}
                  </Button>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="col-span-3">สินค้า</div>
                  <div className="col-span-2 text-center">สต็อกระบบ</div>
                  <div className="col-span-2 text-center">นับจริง</div>
                  <div className="col-span-2 text-center">ผลต่าง</div>
                  <div className="col-span-2 text-center">มูลค่าผลต่าง</div>
                  <div className="col-span-1">หมายเหตุ</div>
                </div>

                {/* Product rows */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {products.map((product, index) => {
                    const variance = calculateVariance(product)
                    const varianceValue = variance * product.unitCost
                    const varianceColor = variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'

                    return (
                      <div
                        key={product.productId}
                        className="grid grid-cols-12 gap-2 items-center p-2 border rounded hover:bg-gray-50"
                      >
                        {/* Product info */}
                        <div className="col-span-3 space-y-1">
                          <p className="text-sm font-medium">{product.productCode}</p>
                          <p className="text-xs text-gray-600 truncate">{product.productName}</p>
                          <p className="text-xs text-gray-500">หน่วย: {product.unit}</p>
                        </div>

                        {/* System quantity */}
                        <div className="col-span-2 text-center">
                          <Input
                            type="number"
                            value={product.systemQuantity}
                            readOnly
                            className="bg-gray-100 text-center text-sm"
                          />
                        </div>

                        {/* Actual quantity */}
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={product.actualQuantity ?? ''}
                            onChange={(e) => updateProductQuantity(index, e.target.value)}
                            className="text-center text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* Variance */}
                        <div className="col-span-2 text-center">
                          <div className={`text-sm font-semibold ${varianceColor}`}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                          </div>
                        </div>

                        {/* Variance value */}
                        <div className="col-span-2 text-center">
                          <div className={`text-sm font-semibold ${varianceColor}`}>
                            ฿{varianceValue.toFixed(2)}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="col-span-1">
                          <Input
                            type="text"
                            value={product.notes ?? ''}
                            onChange={(e) => updateProductNotes(index, e.target.value)}
                            placeholder="หมายเหตุ"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Variance summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-blue-800">สรุปผลต่าง</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-blue-700">ผลต่างทั้งหมด:</span>{' '}
                      <span className="font-semibold">
                        {varianceStats.totalVarianceQty > 0 ? '+' : ''}
                        {varianceStats.totalVarianceQty.toFixed(2)} หน่วย
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">มูลค่าผลต่าง:</span>{' '}
                      <span className="font-semibold">
                        ฿{varianceStats.totalVarianceValue.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">เกินสต็อก:</span>{' '}
                      <span className="font-semibold">{varianceStats.positiveVariance} รายการ</span>
                    </div>
                    <div>
                      <span className="text-red-700">ขาดสต็อก:</span>{' '}
                      <span className="font-semibold">{varianceStats.negativeVariance} รายการ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errors.products && (
              <p className="text-sm text-red-500">{errors.products}</p>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">หมายเหตุทั่วไป</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                rows={2}
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
            <Button type="submit" disabled={isSubmitting || products.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการตรวจนับ'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
