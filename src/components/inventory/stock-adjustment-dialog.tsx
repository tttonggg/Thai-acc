'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle, Info } from 'lucide-react'

interface StockBalance {
  id: string
  product: { id: string; code: string; name: string; unit: string }
  warehouse: { id: string; code: string; name: string }
  quantity: number
  unitCost: number
  totalCost: number
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance?: StockBalance | null
  warehouses: Warehouse[]
  onSuccess: () => void
}

const ADJUSTMENT_REASONS = [
  { value: 'damage', label: 'สินค้าเสียหาย', color: 'bg-red-100 text-red-700' },
  { value: 'loss', label: 'สูญหาย', color: 'bg-orange-100 text-orange-700' },
  { value: 'found', label: 'พบเพิ่มเติม', color: 'bg-green-100 text-green-700' },
  { value: 'count', label: 'นับสต็อก (Stock Count)', color: 'bg-blue-100 text-blue-700' },
  { value: 'expiry', label: 'หมดอายุ', color: 'bg-purple-100 text-purple-700' },
  { value: 'quality', label: 'คุณภาพไม่ได้มาตรฐาน', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'other', label: 'อื่นๆ', color: 'bg-gray-100 text-gray-700' },
]

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  balance,
  warehouses,
  onSuccess
}: StockAdjustmentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    currentQuantity: 0,
    newQuantity: '',
    reason: 'count',
    notes: '',
    unitCost: 0,
  })

  useEffect(() => {
    if (balance) {
      setFormData({
        productId: balance.product.id,
        warehouseId: balance.warehouse.id,
        currentQuantity: balance.quantity,
        newQuantity: '',
        reason: 'count',
        notes: '',
        unitCost: balance.unitCost,
      })
    }
  }, [balance, open])

  const quantityDiff = formData.newQuantity !== ''
    ? parseFloat(formData.newQuantity) - formData.currentQuantity
    : 0

  const isIncrease = quantityDiff > 0
  const isSignificant = Math.abs(quantityDiff) >= formData.currentQuantity * 0.1 // 10% threshold

  const handleSubmit = async () => {
    if (formData.newQuantity === '') {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาระบุจำนวนใหม่',
        variant: 'destructive'
      })
      return
    }

    const newQty = parseFloat(formData.newQuantity)

    if (newQty < 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'จำนวนสินค้าต้องไม่ติดลบ',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/stock-movements`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          warehouseId: formData.warehouseId,
          type: 'ADJUST',
          quantity: Math.abs(quantityDiff),
          unitCost: formData.unitCost,
          notes: `${ADJUSTMENT_REASONS.find(r => r.value === formData.reason)?.label || 'ปรับปรุง'}: ${formData.notes || '-'}`,
        }),
      }).then(r => r.json())

      if (res.success) {
        toast({
          title: 'ปรับปรุงสต็อกสำเร็จ',
          description: `ปรับจำนวนเป็น ${newQty} หน่วยเรียบร้อยแล้ว`
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: res.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md">
        <VisuallyHidden>
          <DialogDescription>
            ปรับปรุงสต็อกของสินค้าคงเหลือในคลังสินค้าเป็นจำนวนใหม่
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>ปรับปรุงจำนวนสินค้าคงเหลือ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {balance && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold">{balance.product.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{balance.product.code}</p>
                </div>
                <Badge variant="outline">{selectedWarehouse?.name}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">จำนวนปัจจุบัน:</span>
                <span className="font-semibold text-blue-600">
                  {formData.currentQuantity.toFixed(2)} {balance.product.unit}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">ต้นทุน/หน่วย (WAC):</span>
                <span className="font-semibold">฿{formData.unitCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="warehouse">คลังสินค้า</Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
              disabled={loading || !!balance}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="เลือกคลัง" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="newQuantity">จำนวนใหม่ *</Label>
            <Input
              id="newQuantity"
              type="number"
              step="0.01"
              value={formData.newQuantity}
              onChange={(e) => setFormData({ ...formData, newQuantity: e.target.value })}
              placeholder="ระบุจำนวนใหม่"
              disabled={loading}
            />
          </div>

          {quantityDiff !== 0 && (
            <div className={`p-3 rounded-lg border ${
              isIncrease ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-2">
                <Info className={`h-4 w-4 ${isIncrease ? 'text-green-600' : 'text-orange-600'}`} />
                <span className="text-sm font-medium">
                  {isIncrease ? 'เพิ่ม' : 'ลด'} {Math.abs(quantityDiff).toFixed(2)} {balance?.product.unit}
                </span>
              </div>
            </div>
          )}

          {isSignificant && Math.abs(quantityDiff) > 0 && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold">การปรับปรุงจำนวนมาก</p>
                  <p>การปรับปรุงนี้จะส่งผลต่อต้นทุนเฉลี่ย (WAC) และต้นทุนขายสินค้า (COGS)</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason">เหตุผลการปรับปรุง *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
              disabled={loading}
            >
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    <span className={`px-2 py-0.5 rounded text-xs ${reason.color}`}>
                      {reason.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || formData.newQuantity === ''}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            ยืนยันการปรับปรุง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
