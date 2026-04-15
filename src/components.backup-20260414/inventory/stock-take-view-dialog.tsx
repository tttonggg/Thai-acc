'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ClipboardList,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  FileText,
  Calendar,
  Warehouse as WarehouseIcon,
  User,
} from 'lucide-react'

interface StockTakeLine {
  id: string
  productId: string
  product: {
    id: string
    code: string
    name: string
    unit: string
  }
  expectedQty: number
  actualQty: number
  varianceQty: number
  varianceValue: number
  costPerUnit: number
  notes: string | null
}

interface StockTake {
  id: string
  stockTakeNumber: string
  status: string
  takeDate: string
  warehouseId: string
  warehouse: {
    id: string
    code: string
    name: string
  }
  createdBy: string
  createdByName?: string | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: string | null
  journalEntryId?: string | null
  journalEntry?: {
    id: string
    entryNo: string
    lines?: {
      account: { code: string; name: string }
      debit: number
      credit: number
    }[]
  } | null
  notes?: string | null
  lines: StockTakeLine[]
  createdAt: string
  updatedAt: string
}

interface StockTakeViewDialogProps {
  stockTakeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800', icon: Edit },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  PENDING_APPROVAL: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: User },
  APPROVED: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  POSTED: { label: 'ลงบัญชีแล้ว', color: 'bg-emerald-100 text-emerald-800', icon: FileText },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function StockTakeViewDialog({
  stockTakeId,
  open,
  onOpenChange,
  onSuccess,
}: StockTakeViewDialogProps) {
  const [stockTake, setStockTake] = useState<StockTake | null>(null)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [posting, setPosting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && stockTakeId) {
      fetchStockTake()
    }
  }, [open, stockTakeId])

  const fetchStockTake = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock-takes/${stockTakeId}`)
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      setStockTake(result.data)
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: 'โหลดข้อมูลการตรวจนับสต็อกไม่สำเร็จ',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('คุณต้องการอนุมัติการตรวจนับสต็อกนี้ใช่หรือไม่?')) {
      return
    }

    setApproving(true)
    try {
      const res = await fetch(`/api/stock-takes/${stockTakeId}/approve`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถอนุมัติได้')
      }

      toast({
        title: 'สำเร็จ',
        description: 'อนุมัติการตรวจนับสต็อกเรียบร้อยแล้ว',
      })

      onSuccess?.()
      fetchStockTake()
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถอนุมัติได้',
        variant: 'destructive',
      })
    } finally {
      setApproving(false)
    }
  }

  const handlePost = async () => {
    if (!confirm('คุณต้องการลงบัญชีการตรวจนับสต็อกนี้ใช่หรือไม่?')) {
      return
    }

    setPosting(true)
    try {
      const res = await fetch(`/api/stock-takes/${stockTakeId}/post`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถลงบัญชีได้')
      }

      toast({
        title: 'สำเร็จ',
        description: 'ลงบัญชีการตรวจนับสต็อกเรียบร้อยแล้ว',
      })

      onSuccess?.()
      fetchStockTake()
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลงบัญชีได้',
        variant: 'destructive',
      })
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบการตรวจนับสต็อกนี้ใช่หรือไม่?')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/stock-takes/${stockTakeId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถลบได้')
      }

      toast({
        title: 'สำเร็จ',
        description: 'ลบการตรวจนับสต็อกเรียบร้อยแล้ว',
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลบได้',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!stockTake) {
    return null
  }

  const statusInfo = statusConfig[stockTake.status] || statusConfig.DRAFT
  const StatusIcon = statusInfo.icon

  // Calculate statistics
  const totalItems = stockTake.lines.length
  const totalExpectedQty = stockTake.lines.reduce((sum, line) => sum + line.expectedQty, 0)
  const totalActualQty = stockTake.lines.reduce((sum, line) => sum + line.actualQty, 0)
  const totalVarianceQty = stockTake.lines.reduce((sum, line) => sum + line.varianceQty, 0)
  const totalVarianceValue = stockTake.lines.reduce((sum, line) => sum + line.varianceValue, 0)
  const accuracyRate = totalExpectedQty > 0
    ? ((1 - Math.abs(totalVarianceQty) / totalExpectedQty) * 100).toFixed(2)
    : '100.00'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogDescription>
            แสดงรายละเอียดการตรวจนับสต็อกทั้งหมดรวมทั้งผลต่าง สาเหตุ และสถานะ
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            รายละเอียดการตรวจนับสต็อก
          </DialogTitle>
          <DialogDescription>
            ดูรายละเอียดการตรวจนับสต็อกทั้งหมดรวมทั้งผลต่าง สาเหตุ และสถานะ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{stockTake.stockTakeNumber}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(stockTake.takeDate)}
                </div>
                <div className="flex items-center gap-1">
                  <WarehouseIcon className="h-4 w-4" />
                  {stockTake.warehouse.name}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Created/Approved By */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">สร้างโดย</p>
                  <p className="font-medium">{stockTake.createdByName || stockTake.createdBy}</p>
                </div>
                {stockTake.approvedBy && (
                  <div>
                    <p className="text-muted-foreground">อนุมัติโดย</p>
                    <p className="font-medium">
                      {stockTake.approvedByName || stockTake.approvedBy}
                      {stockTake.approvedAt && (
                        <span className="text-muted-foreground font-normal ml-2">
                          ({formatDate(stockTake.approvedAt)})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">รายการทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold">{totalItems}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">จำนวนคาดหวัง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalExpectedQty.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">จำนวนนับจริง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActualQty.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">ผลต่างจำนวน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-xl font-bold ${
                  totalVarianceQty < 0 ? 'text-red-600' : totalVarianceQty > 0 ? 'text-green-600' : ''
                }`}>
                  {totalVarianceQty < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : totalVarianceQty > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : null}
                  {totalVarianceQty > 0 ? '+' : ''}{totalVarianceQty.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">มูลค่าผลต่าง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${
                  totalVarianceValue < 0 ? 'text-red-600' : totalVarianceValue > 0 ? 'text-green-600' : ''
                }`}>
                  {totalVarianceValue > 0 ? '+' : ''}{formatCurrency(totalVarianceValue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">ความแม่นยำ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accuracyRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Lines Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายการนับสต็อก</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="text-right">จำนวนคาดหวัง</TableHead>
                    <TableHead className="text-right">จำนวนนับจริง</TableHead>
                    <TableHead className="text-right">ผลต่าง</TableHead>
                    <TableHead className="text-right">มูลค่าผลต่าง</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockTake.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono">{line.product.code}</TableCell>
                      <TableCell>{line.product.name}</TableCell>
                      <TableCell className="text-right">{line.expectedQty.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{line.actualQty.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        line.varianceQty < 0 ? 'text-red-600' : line.varianceQty > 0 ? 'text-green-600' : ''
                      }`}>
                        {line.varianceQty > 0 ? '+' : ''}{line.varianceQty.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${
                        line.varianceValue < 0 ? 'text-red-600' : line.varianceValue > 0 ? 'text-green-600' : ''
                      }`}>
                        {line.varianceValue > 0 ? '+' : ''}{formatCurrency(line.varianceValue)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{line.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Journal Entry Preview */}
          {stockTake.status === 'POSTED' && stockTake.journalEntry && (
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  บันทึกบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">เลขที่: {stockTake.journalEntry.entryNo}</p>
                  {stockTake.journalEntry.lines && stockTake.journalEntry.lines.length > 0 && (
                    <div className="mt-3 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>บัญชี</TableHead>
                            <TableHead className="text-right">เดบิต</TableHead>
                            <TableHead className="text-right">เครดิต</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockTake.journalEntry.lines.map((line, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {line.account.code} - {line.account.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {stockTake.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">หมายเหตุ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{stockTake.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            สร้างเมื่อ: {formatDate(stockTake.createdAt)}
          </div>
          <div className="flex gap-2">
            {stockTake.status === 'DRAFT' && (
              <>
                <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  ลบ
                </Button>
              </>
            )}

            {stockTake.status === 'IN_PROGRESS' && (
              <Button variant="default" size="sm" onClick={handleApprove} disabled={approving}>
                {approving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                อนุมัติ
              </Button>
            )}

            {stockTake.status === 'APPROVED' && (
              <Button variant="default" size="sm" onClick={handlePost} disabled={posting}>
                {posting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                ลงบัญชี
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
