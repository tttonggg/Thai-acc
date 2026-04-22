'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface Asset {
  id: string
  code: string
  name: string
  purchaseCost: number // Satang
  salvageValue: number // Satang
  netBookValue?: number
  accumulatedDepreciation?: number
  schedules?: Array<{
    accumulated: number
    posted: boolean
  }>
}

interface RevaluationResult {
  id: string
  oldCost: number
  oldAccumDep: number
  newCost: number
  newAccumDep: number
  revalGain: number
  revalLoss: number
}

interface RevaluationHistory {
  id: string
  revalDate: string
  oldCost: number
  oldAccumDep: number
  newCost: number
  newAccumDep: number
  revalGain: number
  revalLoss: number
  notes: string | null
  createdAt: string
}

interface AssetRevaluationDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const fc = (n: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n / 100)
const fd = (d: string) =>
  new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' })

function calculateNewValues(
  oldCost: number,
  oldAccumDep: number,
  newFairValue: number
): {
  newCost: number
  newAccumDep: number
  revalGain: number
  revalLoss: number
} {
  const oldNetBookValue = oldCost - oldAccumDep
  const netChange = newFairValue - oldNetBookValue

  let newCost = oldCost
  let newAccumDep = oldAccumDep
  let revalGain = 0
  let revalLoss = 0

  if (netChange > 0) {
    revalGain = netChange
    newCost = oldCost + netChange
    newAccumDep = oldAccumDep
  } else if (netChange < 0) {
    revalLoss = Math.abs(netChange)
    const absNetChange = Math.abs(netChange)
    if (absNetChange <= oldAccumDep) {
      newAccumDep = oldAccumDep - absNetChange
      newCost = oldCost
    } else {
      newCost = oldCost - (absNetChange - oldAccumDep)
      newAccumDep = 0
    }
  }

  return { newCost, newAccumDep, revalGain, revalLoss }
}

export function AssetRevaluationDialog({
  asset,
  open,
  onOpenChange,
  onSuccess,
}: AssetRevaluationDialogProps) {
  const { toast } = useToast()
  const [newFairValue, setNewFairValue] = useState('')
  const [revalDate, setRevalDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [history, setHistory] = useState<RevaluationHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const oldCost = asset?.purchaseCost ?? 0
  const oldAccumDep = asset?.schedules?.find((s) => s.posted)?.accumulated ?? 0

  const preview = useMemo(() => {
    if (!newFairValue || isNaN(Number(newFairValue)) || Number(newFairValue) <= 0) {
      return null
    }
    const fairValueSatang = Math.round(parseFloat(newFairValue) * 100)
    return calculateNewValues(oldCost, oldAccumDep, fairValueSatang)
  }, [newFairValue, oldCost, oldAccumDep])

  useEffect(() => {
    if (asset?.id && open) {
      fetchHistory()
    }
  }, [asset?.id, open])

  const fetchHistory = async () => {
    if (!asset) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/revaluations`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setHistory(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching revaluation history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async () => {
    if (!asset || !preview) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}/revaluation`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newFairValue: Math.round(parseFloat(newFairValue) * 100),
          revalDate,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: 'บันทึกสำเร็จ',
          description:
            data.data.revalGain > 0
              ? `บันทึกการตีราคาสำเร็จ กำไรจากการตีราคา ฿${fc(data.data.revalGain)}`
              : `บันทึกการตีราคาสำเร็จ ขาดทุนจากการตีราคา ฿${fc(data.data.revalLoss)}`,
        })
        setNewFairValue('')
        setNotes('')
        onSuccess()
        onOpenChange(false)
        fetchHistory()
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: data.error || 'ไม่สามารถบันทึกการตีราคาได้',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting revaluation:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setNewFairValue('')
      setNotes('')
    }
    onOpenChange(open)
  }

  if (!asset) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>ตีราคาสินทรัพย์ (Revaluation)</DialogTitle>
          <DialogDescription>
            {asset.code} — {asset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
          {/* Left: Form */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Current Values */}
            <Card className="bg-gray-50">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">มูลค่าปัจจุบัน</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">ราคาทุน:</span>{' '}
                    <span className="font-medium">฿{fc(oldCost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ค่าเสื่อมสะสม:</span>{' '}
                    <span className="font-medium">฿{fc(oldAccumDep)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">มูลค่าสุทธิตามบัญชี:</span>{' '}
                    <span className="font-semibold text-green-600">
                      ฿{fc(oldCost - oldAccumDep)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="newFairValue">
                  มูลค่ายุติธรรมใหม่ (บาท) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newFairValue"
                  type="number"
                  value={newFairValue}
                  onChange={(e) => setNewFairValue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="revalDate">วันที่ตีราคา</Label>
                <Input
                  id="revalDate"
                  type="date"
                  value={revalDate}
                  onChange={(e) => setRevalDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <Card
                className={
                  preview.revalGain > 0
                    ? 'bg-green-50 border-green-200'
                    : preview.revalLoss > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50'
                }
              >
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    ผลการตีราคา (Preview)
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">ราคาทุนใหม่:</span>{' '}
                      <span className="font-medium">฿{fc(preview.newCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ค่าเสื่อมสะสมใหม่:</span>{' '}
                      <span className="font-medium">฿{fc(preview.newAccumDep)}</span>
                    </div>
                  </div>

                  {preview.revalGain > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        กำไรจากการตีราคา: ฿{fc(preview.revalGain)}
                      </span>
                    </div>
                  )}

                  {preview.revalLoss > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-red-200">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        ขาดทุนจากการตีราคา: ฿{fc(preview.revalLoss)}
                      </span>
                    </div>
                  )}

                  {preview.revalGain === 0 && preview.revalLoss === 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <Minus className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        ไม่มีการเปลี่ยนแปลง
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: History */}
          <div className="w-72 flex flex-col border-l pl-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">ประวัติการตีราคา</span>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                ยังไม่มีประวัติการตีราคา
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-2">
                  {history.map((h) => (
                    <Card key={h.id} className="bg-gray-50/50">
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {fd(h.revalDate)}
                          </span>
                          {h.revalGain > 0 && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200 text-xs"
                            >
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                              กำไร
                            </Badge>
                          )}
                          {h.revalLoss > 0 && (
                            <Badge
                              variant="outline"
                              className="text-red-600 border-red-200 text-xs"
                            >
                              <TrendingDown className="h-3 w-3 mr-0.5" />
                              ขาดทุน
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ราคาทุนเดิม:</span>
                            <span>฿{fc(h.oldCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ราคาทุนใหม่:</span>
                            <span className="font-medium">
                              ฿{fc(h.newCost)}
                            </span>
                          </div>
                          {h.revalGain > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>กำไร:</span>
                              <span>฿{fc(h.revalGain)}</span>
                            </div>
                          )}
                          {h.revalLoss > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>ขาดทุน:</span>
                              <span>฿{fc(h.revalLoss)}</span>
                            </div>
                          )}
                        </div>
                        {h.notes && (
                          <p className="text-xs text-gray-400 italic pt-1 border-t">
                            {h.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!preview || isSubmitting}
            className={
              (preview?.revalGain ?? 0) > 0
                ? 'bg-green-600 hover:bg-green-700'
                : (preview?.revalLoss ?? 0) > 0
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกการตีราคา'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
