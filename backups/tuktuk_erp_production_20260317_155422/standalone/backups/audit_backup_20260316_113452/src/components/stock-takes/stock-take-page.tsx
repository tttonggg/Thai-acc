'use client'

// ============================================
// 📦 Stock Take Management Page (TAS 2 Compliant)
// Stock Count & Variance Processing
// ============================================

import { useState, useEffect } from 'react'
import {
  Package, ClipboardCheck, Plus, Search, Filter, Calendar,
  Warehouse, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, Download, Eye, Edit, Trash2, MoreHorizontal,
  TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockTake {
  id: string
  takeNo: string
  date: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  warehouse: {
    id: string
    code: string
    name: string
  }
  lines: StockTakeLine[]
  metadata?: any
}

interface StockTakeLine {
  id: string
  productId: string
  product: {
    id: string
    code: string
    name: string
    unit: string
  }
  systemQuantity: number
  actualQuantity: number
  varianceQuantity: number
  unitCost: number
  notes: string | null
}

interface Warehouse {
  id: string
  code: string
  name: string
  type: string
  location: string | null
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-700', icon: FileText },
  IN_PROGRESS: { label: 'กำลังนับ', color: 'bg-blue-100 text-blue-700', icon: Clock },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'short' })

// ─── Main Component ───────────────────────────────────────────────────────────

export function StockTakePage() {
  const [stockTakes, setStockTakes] = useState<StockTake[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedStockTake, setSelectedStockTake] = useState<StockTake | null>(null)
  const [editingLine, setEditingLine] = useState<StockTakeLine | null>(null)
  const [newActualQty, setNewActualQty] = useState<number>(0)

  // Form state for new stock take
  const [newStockTake, setNewStockTake] = useState({
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const { toast } = useToast()

  // Fetch stock takes
  const fetchStockTakes = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (warehouseFilter !== 'ALL') params.append('warehouseId', warehouseFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/stock-takes?${params}`)
      const json = await response.json()

      if (json.success && json.data) {
        // Handle different response structures
        const stockTakesData = json.data?.data || json.data || json.stockTakes || []
        setStockTakes(Array.isArray(stockTakesData) ? stockTakesData : [])
      } else {
        setError(json.error || 'ไม่สามารถดึงข้อมูลได้')
        setStockTakes([])
      }
    } catch (error) {
      console.error('Error fetching stock takes:', error)
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
      setStockTakes([])
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลการตรวจนับสต็อกได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses')
      const json = await response.json()

      if (json.success) {
        // Warehouses API returns { success: true, data: [...] } directly
        const warehousesData = json.data || json.warehouses || []
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : [])
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      setWarehouses([])
    }
  }

  useEffect(() => {
    fetchStockTakes()
    fetchWarehouses()
  }, [statusFilter, warehouseFilter])

  // Create stock take
  const handleCreate = async () => {
    if (!newStockTake.warehouseId) {
      toast({
        title: 'กรุณากรอกข้อมูล',
        description: 'เลือกคลังสินค้า',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/stock-takes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStockTake),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'สร้างสำเร็จ',
          description: `สร้างการตรวจนับ ${data.data.takeNo} เรียบร้อยแล้ว`,
        })
        setShowCreateDialog(false)
        setNewStockTake({
          warehouseId: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        })
        fetchStockTakes()
      } else {
        throw new Error(data.error || 'ไม่สามารถสร้างการตรวจนับได้')
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างการตรวจนับได้',
        variant: 'destructive',
      })
    }
  }

  // View stock take details
  const handleView = (stockTake: StockTake) => {
    setSelectedStockTake(stockTake)
    setShowViewDialog(true)
  }

  // Update stock take line
  const handleUpdateLine = async () => {
    if (!editingLine || !selectedStockTake) return

    try {
      // Update all lines with the modified line
      const updatedLines = selectedStockTake.lines.map((line) =>
        line.id === editingLine.id
          ? { ...line, actualQuantity: newActualQty }
          : { productId: line.productId, actualQuantity: line.actualQuantity, notes: line.notes || '' }
      )

      const response = await fetch(`/api/stock-takes/${selectedStockTake.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: updatedLines }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'อัปเดตสำเร็จ',
          description: 'อัปเดตยอดตรวจนับเรียบร้อยแล้ว',
        })
        setEditingLine(null)
        setNewActualQty(0)
        // Refresh data
        setSelectedStockTake(data.data)
        fetchStockTakes()
      } else {
        throw new Error(data.error || 'ไม่สามารถอัปเดตได้')
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปเดตได้',
        variant: 'destructive',
      })
    }
  }

  // Approve stock take
  const handleApprove = async () => {
    if (!selectedStockTake) return

    try {
      const response = await fetch(`/api/stock-takes/${selectedStockTake.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'อนุมัติสำเร็จ',
          description: `อนุมัติการตรวจนับ ${selectedStockTake.takeNo} เรียบร้อยแล้ว`,
        })
        setShowViewDialog(false)
        fetchStockTakes()
      } else {
        throw new Error(data.error || 'ไม่สามารถอนุมัติได้')
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอนุมัติได้',
        variant: 'destructive',
      })
    }
  }

  // Calculate summary
  const calculateSummary = (stockTake: StockTake) => {
    const totalItems = stockTake.lines.length
    const totalVariance = stockTake.lines.reduce((sum, line) => sum + line.varianceQuantity, 0)
    const totalVarianceValue = stockTake.lines.reduce(
      (sum, line) => sum + Math.abs(line.varianceQuantity) * line.unitCost,
      0
    )
    const lossCount = stockTake.lines.filter((line) => line.varianceQuantity < 0).length
    const gainCount = stockTake.lines.filter((line) => line.varianceQuantity > 0).length

    return { totalItems, totalVariance, totalVarianceValue, lossCount, gainCount }
  }

  // Filtered stock takes
  const filteredStockTakes = (stockTakes || []).filter((st) => {
    const matchesSearch =
      st?.takeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st?.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Summary cards
  const summaryStats = {
    total: (stockTakes || []).length,
    draft: (stockTakes || []).filter((st) => st?.status === 'DRAFT').length,
    inProgress: (stockTakes || []).filter((st) => st?.status === 'IN_PROGRESS').length,
    completed: (stockTakes || []).filter((st) => st?.status === 'COMPLETED').length,
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การตรวจนับสต็อก</h1>
            <p className="text-sm text-gray-500 mt-1">Stock Take Management</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การตรวจนับสต็อก</h1>
            <p className="text-sm text-gray-500 mt-1">Stock Take Management</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การตรวจนับสต็อก</h1>
          <p className="text-sm text-gray-500 mt-1">Stock Take Management</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          สร้างการตรวจนับ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ร่าง</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.draft}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">กำลังนับ</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">เสร็จสิ้น</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาเลขที่, คลังสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="IN_PROGRESS">กำลังนับ</SelectItem>
                <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="คลังสินค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.code} - {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchStockTakes} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Takes Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการตรวจนับสต็อก</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>คลังสินค้า</TableHead>
                  <TableHead>จำนวนรายการ</TableHead>
                  <TableHead>ผลต่าง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStockTakes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      ไม่พบข้อมูลการตรวจนับสต็อก
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStockTakes.map((stockTake) => {
                    const summary = calculateSummary(stockTake)
                    const statusConfig = STATUS_CONFIG[stockTake.status]
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow key={stockTake.id}>
                        <TableCell className="font-medium">{stockTake.takeNo}</TableCell>
                        <TableCell>{fd(stockTake.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4 text-gray-400" />
                            {stockTake.warehouse.code} - {stockTake.warehouse.name}
                          </div>
                        </TableCell>
                        <TableCell>{summary.totalItems} รายการ</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {summary.totalVariance !== 0 && (
                              <>
                                {summary.totalVariance < 0 ? (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                ) : (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                )}
                                <span
                                  className={summary.totalVariance < 0 ? 'text-red-600' : 'text-green-600'}
                                >
                                  {summary.totalVariance > 0 ? '+' : ''}
                                  {summary.totalVariance}
                                </span>
                              </>
                            )}
                            {summary.totalVariance === 0 && <span className="text-gray-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(stockTake)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            ดูรายละเอียด
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>สร้างการตรวจนับสต็อกใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>คลังสินค้า *</Label>
              <Select
                value={newStockTake.warehouseId}
                onValueChange={(value) => setNewStockTake({ ...newStockTake, warehouseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>วันที่ตรวจนับ *</Label>
              <Input
                type="date"
                value={newStockTake.date}
                onChange={(e) => setNewStockTake({ ...newStockTake, date: e.target.value })}
              />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea
                value={newStockTake.notes}
                onChange={(e) => setNewStockTake({ ...newStockTake, notes: e.target.value })}
                placeholder="ระบุหมายเหตุ (ถ้ามี)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate}>สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              {selectedStockTake?.takeNo}
            </DialogTitle>
          </DialogHeader>

          {selectedStockTake && (
            <div className="space-y-4 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">คลังสินค้า</Label>
                  <p className="font-medium">{selectedStockTake.warehouse.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="font-medium">{fd(selectedStockTake.date)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">สถานะ</Label>
                  <div className="mt-1">
                    <Badge className={STATUS_CONFIG[selectedStockTake.status].color}>
                      {STATUS_CONFIG[selectedStockTake.status].label}
                    </Badge>
                  </div>
                </div>
                {selectedStockTake.notes && (
                  <div>
                    <Label className="text-gray-500">หมายเหตุ</Label>
                    <p className="font-medium">{selectedStockTake.notes}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {calculateSummary(selectedStockTake).totalItems > 0 && (
                <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">รายการทั้งหมด</p>
                    <p className="text-lg font-bold">{calculateSummary(selectedStockTake).totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ผลต่างรวม</p>
                    <p className="text-lg font-bold">
                      {calculateSummary(selectedStockTake).totalVariance > 0 ? '+' : ''}
                      {calculateSummary(selectedStockTake).totalVariance}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ขาด</p>
                    <p className="text-lg font-bold text-red-600">
                      {calculateSummary(selectedStockTake).lossCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เกิน</p>
                    <p className="text-lg font-bold text-green-600">
                      {calculateSummary(selectedStockTake).gainCount}
                    </p>
                  </div>
                </div>
              )}

              {/* Lines Table */}
              <div>
                <h3 className="font-semibold mb-2">รายการตรวจนับ</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สินค้า</TableHead>
                      <TableHead className="text-right">ยอดระบบ</TableHead>
                      <TableHead className="text-right">นับจริง</TableHead>
                      <TableHead className="text-right">ผลต่าง</TableHead>
                      <TableHead className="text-center">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStockTake.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{line.product.name}</p>
                            <p className="text-sm text-gray-500">{line.product.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{line.systemQuantity}</TableCell>
                        <TableCell className="text-right">
                          {editingLine?.id === line.id ? (
                            <Input
                              type="number"
                              value={newActualQty}
                              onChange={(e) => setNewActualQty(Number(e.target.value))}
                              className="w-24"
                            />
                          ) : (
                            <span
                              className={
                                line.actualQuantity !== line.systemQuantity
                                  ? 'font-bold text-blue-600'
                                  : ''
                              }
                            >
                              {line.actualQuantity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              line.varianceQuantity < 0
                                ? 'text-red-600 font-medium'
                                : line.varianceQuantity > 0
                                ? 'text-green-600 font-medium'
                                : ''
                            }
                          >
                            {line.varianceQuantity !== 0 ? (
                              <>
                                {line.varianceQuantity > 0 ? '+' : ''}
                                {line.varianceQuantity}
                              </>
                            ) : (
                              '-'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingLine?.id === line.id ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" onClick={handleUpdateLine}>
                                บันทึก
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingLine(null)
                                  setNewActualQty(0)
                                }}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLine(line)
                                setNewActualQty(line.actualQuantity)
                              }}
                              disabled={
                                selectedStockTake.status === 'COMPLETED' ||
                                selectedStockTake.status === 'CANCELLED'
                              }
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              {selectedStockTake.status === 'DRAFT' || selectedStockTake.status === 'IN_PROGRESS' ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                    ปิด
                  </Button>
                  <Button onClick={handleApprove} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    อนุมัติการตรวจนับ
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                    ปิด
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
