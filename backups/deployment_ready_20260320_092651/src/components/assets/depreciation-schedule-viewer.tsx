'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, TrendingDown, DollarSign } from 'lucide-react'

interface DepreciationSchedule {
  id: string
  date: string
  amount: number
  accumulated: number
  netBookValue: number
  posted: boolean
  journalEntryId: string | null
}

interface Asset {
  id: string
  code: string
  name: string
  purchaseCost: number
  salvageValue: number
  usefulLifeYears: number
}

interface DepreciationScheduleViewerProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepreciationScheduleViewer({
  asset,
  open,
  onOpenChange,
}: DepreciationScheduleViewerProps) {
  const [schedules, setSchedules] = useState<DepreciationSchedule[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && asset) {
      fetchSchedules()
    }
  }, [open, asset])

  const fetchSchedules = async () => {
    if (!asset) return

    setLoading(true)
    try {
      const res = await fetch(`/api/assets/${asset.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data.schedules) {
          setSchedules(data.data.schedules)
        }
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fc = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const fd = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', {
      year: '2-digit',
      month: 'short',
    })

  // Check if a date is the current month
  const isCurrentMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  // Get summary stats
  const totalDepreciation = schedules.reduce((sum, s) => sum + s.amount, 0)
  const postedCount = schedules.filter((s) => s.posted).length
  const currentNBV = schedules.length > 0 ? schedules[schedules.length - 1].netBookValue : asset?.purchaseCost || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ตารางค่าเสื่อมราคา - {asset?.name} ({asset?.code})
          </DialogTitle>
          <DialogDescription className="sr-only">
            แสดงตารางค่าเสื่อมราคาเดือนต่อเดือนของสินทรัพย์ {asset?.name}
            รวมถึงค่าเสื่อมราคาสะสม มูลค่าสุทธิปัจจุบัน (Net Book Value)
            และสถานะการบันทึกลงบัญชี
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">ค่าเสื่อมราคารวม</p>
            </div>
            <p className="text-xl font-bold text-blue-800">฿{fc(totalDepreciation)}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">มูลค่าสุทธิปัจจุบัน (NBV)</p>
            </div>
            <p className="text-xl font-bold text-green-800">฿{fc(currentNBV)}</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-700 font-medium mb-1">สถานะการบันทึก</p>
            <p className="text-xl font-bold text-purple-800">
              {postedCount} / {schedules.length} เดือน
            </p>
            {postedCount > 0 && (
              <p className="text-xs text-purple-600 mt-1">ล่าสุด: {fd(schedules[postedCount - 1]?.date)}</p>
            )}
          </div>
        </div>

        {/* Asset Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">ราคาทุน</p>
              <p className="font-semibold">฿{fc(asset?.purchaseCost || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600">ค่าซาก</p>
              <p className="font-semibold">฿{fc(asset?.salvageValue || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600">อายุการใช้งาน</p>
              <p className="font-semibold">{asset?.usefulLifeYears || 0} ปี</p>
            </div>
            <div>
              <p className="text-gray-600">ค่าเสื่อม/เดือน</p>
              <p className="font-semibold text-blue-600">
                ฿{fc(((asset?.purchaseCost || 0) - (asset?.salvageValue || 0)) / ((asset?.usefulLifeYears || 1) * 12))}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[120px]">เดือน/ปี</TableHead>
                  <TableHead className="text-right">ค่าเสื่อมราคา</TableHead>
                  <TableHead className="text-right">ค่าเสื่อมสะสม</TableHead>
                  <TableHead className="text-right">มูลค่าสุทธิ (NBV)</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      ไม่พบตารางค่าเสื่อมราคา
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      className={isCurrentMonth(schedule.date) ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-mono text-sm">
                        {isCurrentMonth(schedule.date) && (
                          <Badge className="mr-2 text-xs" variant="default">
                            เดือนนี้
                          </Badge>
                        )}
                        {fd(schedule.date)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{fc(schedule.amount)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ฿{fc(schedule.accumulated)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ฿{fc(schedule.netBookValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {schedule.posted ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            บันทึกแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            รอบันทึก
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>เดือนปัจจุบัน</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>บันทึกแล้ว</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 rounded"></div>
            <span>รอบันทึก</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
