'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  DollarSign,
  Warehouse,
  History,
  FileText
} from 'lucide-react'

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
  createdAt?: string
  updatedAt?: string
}

interface StockBalance {
  id: string
  warehouseId: string
  warehouseName: string
  quantity: number
  unitCost: number
  totalValue: number
}

interface ProductViewDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels: Record<string, string> = {
  PRODUCT: 'สินค้า',
  SERVICE: 'บริการ',
}

const vatTypeLabels: Record<string, string> = {
  EXCLUSIVE: 'ยังไม่รวม VAT',
  INCLUSIVE: 'รวม VAT แล้ว',
  NONE: 'ไม่มี VAT',
}

const costingMethodLabels: Record<string, string> = {
  WEIGHTED_AVERAGE: 'ต้นทุนเฉลี่ยถ่วงน้ำหนัก (WAC)',
  FIFO: 'เข้าก่อนออกก่อน (FIFO)',
}

const incomeTypeLabels: Record<string, string> = {
  service: 'ค่าบริการ (3%)',
  rent: 'ค่าเช่า (5%)',
  professional: 'ค่าบริการวิชาชีพ (3%)',
  contract: 'ค่าจ้างทำของ (1%)',
  advertising: 'ค่าโฆษณา (2%)',
}

export function ProductViewDialog({
  product,
  open,
  onOpenChange,
}: ProductViewDialogProps) {
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([])
  const [loadingStock, setLoadingStock] = useState(false)

  useEffect(() => {
    if (open && product?.isInventory) {
      fetchStockBalances()
    }
  }, [open, product])

  const fetchStockBalances = async () => {
    if (!product) return

    setLoadingStock(true)
    try {
      const res = await fetch(`/api/stock-balances?productId=${product.id}`)
      if (res.ok) {
        const json = await res.json()
        const data = json?.data ?? json ?? []
        setStockBalances(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching stock balances:', error)
    } finally {
      setLoadingStock(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!product) return null

  const stockLevel = product.isInventory
    ? product.quantity <= 0
      ? { color: 'bg-red-500', label: 'หมดสต็อก' }
      : product.quantity <= product.minQuantity
      ? { color: 'bg-yellow-100 text-yellow-800', label: 'ต่ำ' }
      : { color: 'bg-green-100 text-green-800', label: 'ปกติ' }
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดสินค้า/บริการ
          </DialogTitle>
          <DialogDescription>
            ดูรายละเอียดสินค้า/บริการทั้งหมดรวมทั้งราคา สต็อก ภาษี และข้อมูลอื่นๆ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              {product.nameEn && (
                <p className="text-muted-foreground">{product.nameEn}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="font-mono">{product.code}</Badge>
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'ใช้งาน' : 'ระงับ'}
              </Badge>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                ข้อมูลพื้นฐาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ประเภท</p>
                  <p className="font-medium">{typeLabels[product.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                  <p className="font-medium">{product.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">หน่วย</p>
                  <p className="font-medium">{product.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ติดตามสต็อก</p>
                  <p className="font-medium">{product.isInventory ? 'ใช่' : 'ไม่ใช่'}</p>
                </div>
              </div>

              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">รายละเอียด</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                ข้อมูลราคา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ราคาขาย</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(product.salePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ราคาทุน</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(product.costPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">อัตรา VAT</p>
                  <p className="font-medium">{product.vatRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ประเภท VAT</p>
                  <p className="font-medium">{vatTypeLabels[product.vatType]}</p>
                </div>
              </div>

              {product.costPrice > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">กำไรขั้นต้น</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(product.salePrice - product.costPrice)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({(((product.salePrice - product.costPrice) / product.salePrice) * 100).toFixed(2)}%)
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service-specific: WHT Information */}
          {product.type === 'SERVICE' && product.incomeType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ข้อมูลภาษีหัก ณ ที่จ่าย</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm text-muted-foreground">ประเภทรายได้</p>
                  <p className="font-medium">{incomeTypeLabels[product.incomeType] || product.incomeType}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory-specific: Stock Information */}
          {product.isInventory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  ข้อมูลสต็อก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนคงเหลือ</p>
                    <p className="text-2xl font-bold">{product.quantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนต่ำสุด</p>
                    <p className="text-lg font-semibold">{product.minQuantity.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">สถานะสต็อก</p>
                    {stockLevel && (
                      <Badge className={stockLevel.color}>{stockLevel.label}</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">วิธีคิดต้นทุน</p>
                  <p className="font-medium">{costingMethodLabels[product.costingMethod]}</p>
                </div>

                <Separator />

                {/* Stock Balance by Warehouse */}
                <div>
                  <p className="text-sm font-medium mb-3">สต็อกแยกตามคลังสินค้า</p>
                  {loadingStock ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : stockBalances.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ไม่พบข้อมูลสต็อก</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>คลังสินค้า</TableHead>
                          <TableHead className="text-right">จำนวน</TableHead>
                          <TableHead className="text-right">ต้นทุนต่อหน่วย</TableHead>
                          <TableHead className="text-right">มูลค่ารวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockBalances.map((balance) => (
                          <TableRow key={balance.id}>
                            <TableCell>{balance.warehouseName}</TableCell>
                            <TableCell className="text-right">
                              {balance.quantity.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(balance.unitCost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(balance.totalValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {(product.notes || product.createdAt || product.updatedAt) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  ข้อมูลเพิ่มเติม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">หมายเหตุ</p>
                    <p className="text-sm">{product.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">สร้างเมื่อ</p>
                    <p className="text-sm">{formatDate(product.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">แก้ไขล่าสุด</p>
                    <p className="text-sm">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
