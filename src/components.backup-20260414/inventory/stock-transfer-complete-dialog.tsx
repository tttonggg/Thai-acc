'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Package, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface StockTransfer {
  transferNo: string
  date: string
  productId: string
  product: { code: string; name: string; unit: string }
  fromWarehouse: { code: string; name: string }
  toWarehouse: { code: string; name: string }
  quantity: number
  status: string
  notes: string | null
}

interface StockTransferCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer?: StockTransfer | null
  onSuccess: () => void
}

export function StockTransferCompleteDialog({
  open,
  onOpenChange,
  transfer,
  onSuccess
}: StockTransferCompleteDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'complete' | 'cancel'>('complete')
  const [receivedQuantity, setReceivedQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (transfer) {
      setReceivedQuantity(transfer.quantity.toString())
      setNotes('')
      setMode('complete')
    }
  }, [transfer, open])

  if (!transfer) return null

  const quantityDiff = receivedQuantity !== ''
    ? parseFloat(receivedQuantity) - transfer.quantity
    : 0

  const hasDifference = Math.abs(quantityDiff) > 0.01

  const handleSubmit = async () => {
    if (mode === 'complete' && receivedQuantity === '') {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาระบุจำนวนที่ได้รับ',
        variant: 'destructive'
      })
      return
    }

    const qty = parseFloat(receivedQuantity)

    if (qty < 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'จำนวนที่ได้รับต้องไม่ติดลบ',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/stock/transfers/${transfer.transferNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          receivedQuantity: mode === 'complete' ? qty : undefined,
          notes,
        }),
      }).then(r => r.json())

      if (res.success) {
        toast({
          title: mode === 'complete' ? 'ยืนยันการรับสินค้าสำเร็จ' : 'ยกเลิกการโอนสำเร็จ',
          description: res.data?.message || res.message || 'ดำเนินการเรียบร้อยแล้ว'
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

  const isCompleted = transfer.status === 'COMPLETED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md">
        <VisuallyHidden>
          <DialogDescription>
            {isCompleted ? 'แสดงรายละเอียดการโอนสินค้าที่สำเร็จแล้ว' : 'ดำเนินการยืนยันรับสินค้าหรือยกเลิกการโอน'}
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>
            {isCompleted ? 'รายละเอียดการโอนสินค้า' : 'ดำเนินการการโอนสินค้า'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transfer Info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold">{transfer.product.name}</p>
                <p className="text-xs text-gray-500 font-mono">{transfer.product.code}</p>
              </div>
              <Badge className={isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                {isCompleted ? 'สำเร็จ' : 'ระหว่างดำเนินการ'}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm py-2">
              <div className="text-center flex-1">
                <Badge variant="outline" className="mb-1">{transfer.fromWarehouse.name}</Badge>
                <p className="text-xs text-gray-500">จากคลัง</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
              <div className="text-center flex-1">
                <Badge variant="outline" className="mb-1">{transfer.toWarehouse.name}</Badge>
                <p className="text-xs text-gray-500">ไปยังคลัง</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm pt-2 border-t">
              <span>จำนวนที่โอน:</span>
              <span className="font-semibold text-blue-600">
                {transfer.quantity.toFixed(2)} {transfer.product.unit}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              วันที่: {new Date(transfer.date).toLocaleDateString('th-TH', { dateStyle: 'short' })}
            </div>

            {transfer.notes && (
              <div className="text-xs text-gray-600 pt-1 border-t">
                หมายเหตุ: {transfer.notes}
              </div>
            )}
          </div>

          {!isCompleted && (
            <>
              {/* Action Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('complete')}
                  disabled={isCompleted}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-1 inline" />
                  ยืนยันรับสินค้า
                </button>
                <button
                  onClick={() => setMode('cancel')}
                  disabled={isCompleted}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === 'cancel'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-1 inline" />
                  ยกเลิกการโอน
                </button>
              </div>

              {mode === 'complete' && (
                <>
                  <div>
                    <Label htmlFor="receivedQuantity">จำนวนที่ได้รับ *</Label>
                    <Input
                      id="receivedQuantity"
                      type="number"
                      step="0.01"
                      value={receivedQuantity}
                      onChange={(e) => setReceivedQuantity(e.target.value)}
                      placeholder="ระบุจำนวนที่ได้รับจริง"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      จำนวนที่โอน: {transfer.quantity} {transfer.product.unit}
                    </p>
                  </div>

                  {hasDifference && (
                    <div className={`p-3 rounded-lg border ${
                      quantityDiff > 0 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                          quantityDiff > 0 ? 'text-orange-600' : 'text-red-600'
                        }`} />
                        <div className="text-xs">
                          <p className="font-semibold">
                            {quantityDiff > 0 ? 'ได้รับมากกว่าที่โอน' : 'ได้รับน้อยกว่าที่โอน'}
                          </p>
                          <p className="text-gray-600 mt-1">
                            ผลต่าง: {Math.abs(quantityDiff).toFixed(2)} {transfer.product.unit}
                          </p>
                          {quantityDiff < 0 && (
                            <p className="text-gray-600 mt-1">
                              ระบบจะบันทึกเป็นสูญหาย/เสียหาย {Math.abs(quantityDiff).toFixed(2)} {transfer.product.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ระบุรายละเอียดเพิ่มเติม เช่น สภาพสินค้า บรรจุภัณฑ์"
                      disabled={loading}
                      rows={2}
                    />
                  </div>
                </>
              )}

              {mode === 'cancel' && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold">ยกเลิกการโอนสินค้า</p>
                      <p className="text-xs mt-1">
                        ระบบจะคืนสินค้ากลับเข้าคลังต้นทาง และยกเลิกรายการโอนนี้
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isCompleted && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">การโอนสินค้าสำเร็จแล้ว</p>
                  <p className="text-xs mt-1">
                    สินค้าถูกโอนไปยังคลังปลายทางเรียบร้อยแล้ว
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {isCompleted ? 'ปิด' : 'ยกเลิก'}
          </Button>
          {!isCompleted && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={mode === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'complete' ? 'ยืนยันรับสินค้า' : 'ยืนยันการยกเลิก'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
