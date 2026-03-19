'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  ShoppingCart,
  Package,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface PurchaseRequest {
  id: string
  requestNo: string
  requestDate: string
  requiredDate?: string
  reason?: string
  priority: string
  status: string
  estimatedAmount: number
  requestedByUser: {
    id: string
    name: string
    email: string
  }
  departmentData?: {
    id: string
    name: string
    code: string
  }
  approvedByUser?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: string
  approvalNotes?: string
  budget?: {
    id: string
    name: string
    fiscalYear: number
    remainingAmount: number
  }
  purchaseOrder?: {
    id: string
    orderNo: string
    status: string
  }
  lines: Array<{
    id: string
    lineNo: number
    description: string
    quantity: number
    unit: string
    unitPrice: number
    amount: number
    product?: {
      id: string
      code: string
      name: string
    }
  }>
  _count?: {
    lines: number
  }
}

// Status labels and colors
const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  CONVERTED: 'แปลงเป็น PO',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
  CONVERTED: 'bg-blue-100 text-blue-800 border-blue-300',
}

// Priority labels and colors
const priorityLabels: Record<string, string> = {
  URGENT: 'เร่งด่วน',
  HIGH: 'สูง',
  NORMAL: 'ปกติ',
  LOW: 'ต่ำ',
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-300',
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
}

export function PurchaseRequestList() {
  const [prs, setPrs] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [deletingPR, setDeletingPR] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch PRs
  useEffect(() => {
    fetchPRs()
  }, [pagination.page, pagination.limit])

  const fetchPRs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterDepartment !== 'all') params.append('departmentId', filterDepartment)
      if (filterPriority !== 'all') params.append('priority', filterPriority)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/purchase-requests?${params}`)
      if (!res.ok) throw new Error('Fetch failed')

      const result = await res.json()
      const prsData = result.data || []

      if (!Array.isArray(prsData)) {
        throw new Error('Invalid data format')
      }

      setPrs(prsData)
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล'
      setError(message)
      toast({
        title: 'ข้อผิดพลาด',
        description: 'โหลดข้อมูลไม่สำเร็จ',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter PRs
  const filteredPRs = (prs || []).filter(pr => {
    const matchesSearch =
      !searchTerm ||
      pr.requestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.reason?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || pr.status === filterStatus
    const matchesDepartment =
      filterDepartment === 'all' || pr.departmentData?.id === filterDepartment
    const matchesPriority = filterPriority === 'all' || pr.priority === filterPriority

    return matchesSearch && matchesStatus && matchesDepartment && matchesPriority
  })

  // Action handlers
  const handleView = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (prId: string) => {
    // TODO: Open edit dialog
    toast({
      title: 'แก้ไขใบขอซื้อ',
      description: 'ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้',
    })
  }

  const handleDelete = async (prId: string) => {
    if (!confirm('คุณต้องการลบใบขอซื้อนี้ใช่หรือไม่?')) {
      return
    }

    setDeletingPR(prId)
    try {
      const res = await fetch(`/api/purchase-requests/${prId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ลบไม่สำเร็จ')
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบใบขอซื้อเรียบร้อยแล้ว',
      })

      fetchPRs()
    } catch (err) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setDeletingPR(null)
    }
  }

  const handleAction = async (prId: string, action: 'submit' | 'approve' | 'reject') => {
    setProcessingAction(`${prId}-${action}`)
    try {
      const res = await fetch(`/api/purchase-requests/${prId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ดำเนินการไม่สำเร็จ')
      }

      const actionLabels = {
        submit: 'ส่งอนุมัติ',
        approve: 'อนุมัติ',
        reject: 'ปฏิเสธ',
      }

      toast({
        title: 'สำเร็จ',
        description: `${actionLabels[action]}เรียบร้อยแล้ว`,
      })

      fetchPRs()
      setIsViewDialogOpen(false)
    } catch (err) {
      toast({
        title: 'ดำเนินการไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleConvertToPO = async (prId: string) => {
    setProcessingAction(`${prId}-convert`)
    try {
      const res = await fetch(`/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseRequestId: prId }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'แปลงเป็น PO ไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: 'แปลงเป็นใบสั่งซื้อเรียบร้อยแล้ว',
      })

      fetchPRs()
      setIsViewDialogOpen(false)
    } catch (err) {
      toast({
        title: 'แปลงเป็น PO ไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setProcessingAction(null)
    }
  }

  // Loading UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error UI
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Calculate stats
  const stats = {
    draft: prs.filter(p => p.status === 'DRAFT').length,
    pending: prs.filter(p => p.status === 'PENDING').length,
    approved: prs.filter(p => p.status === 'APPROVED').length,
    totalAmount: prs.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบขอซื้อ (Purchase Request)</h1>
          <p className="text-gray-500 mt-1">จัดการใบขอซื้อและขั้นตอนการอนุมัติ</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          สร้างใบขอซื้อ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ฉบับร่าง</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">รออนุมัติ</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">วงเงินรวม</p>
                <p className="text-2xl font-bold text-blue-600">
                  ฿{(stats.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาตามเลขที่ PR หรือเหตุผล..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="PENDING">รออนุมัติ</SelectItem>
                <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
                <SelectItem value="CONVERTED">แปลงเป็น PO</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกความสำคัญ</SelectItem>
                <SelectItem value="URGENT">เร่งด่วน</SelectItem>
                <SelectItem value="HIGH">สูง</SelectItem>
                <SelectItem value="NORMAL">ปกติ</SelectItem>
                <SelectItem value="LOW">ต่ำ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PR Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>ผู้ขอ</TableHead>
                <TableHead className="text-right">วงเงิน (บาท)</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">รายการ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPRs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่พบใบขอซื้อ</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPRs.map((pr) => (
                  <TableRow key={pr.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-mono font-medium">{pr.requestNo}</TableCell>
                    <TableCell>
                      {new Date(pr.requestDate).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      {pr.departmentData ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span>{pr.departmentData.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span>{pr.requestedByUser.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{(pr.estimatedAmount / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[pr.priority]} variant="outline">
                        {priorityLabels[pr.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[pr.status]} variant="outline">
                        {statusLabels[pr.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{pr._count?.lines || 0} รายการ</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(pr)}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        {pr.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(pr.id)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(pr.id)}
                              disabled={deletingPR === pr.id}
                            >
                              {deletingPR === pr.id ? (
                                <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} จากทั้งหมด{' '}
            {pagination.total} รายการ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              ใบขอซื้อ: {selectedPR?.requestNo}
            </DialogTitle>
            <DialogDescription>
              {selectedPR && (
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={statusColors[selectedPR.status]} variant="outline">
                    {statusLabels[selectedPR.status]}
                  </Badge>
                  <Badge className={priorityColors[selectedPR.priority]} variant="outline">
                    {priorityLabels[selectedPR.priority]}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPR && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันที่ขอซื้อ
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedPR.requestDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                {selectedPR.requiredDate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      วันที่ต้องการ
                    </Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedPR.requiredDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ผู้ขอซื้อ
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedPR.requestedByUser.name} ({selectedPR.requestedByUser.email})
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    แผนก
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedPR.departmentData?.name || '-'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              {selectedPR.reason && (
                <div className="space-y-2">
                  <Label>เหตุผลการขอซื้อ</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedPR.reason}</p>
                </div>
              )}

              {/* Budget Info */}
              {selectedPR.budget && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Label className="text-blue-900">งบประมาณ</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ชื่องบประมาณ:</span>{' '}
                      <span className="font-medium">{selectedPR.budget.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ปีงบประมาณ:</span>{' '}
                      <span className="font-medium">{selectedPR.budget.fiscalYear}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">งบคงเหลือ:</span>{' '}
                      <span className="font-medium">
                        ฿{(selectedPR.budget.remainingAmount / 100).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  รายการสินค้า ({selectedPR.lines?.length || 0} รายการ)
                </Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ลำดับ</TableHead>
                        <TableHead>รายการ</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead className="text-right">ราคา/หน่วย</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPR.lines?.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-center">{line.lineNo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.product && (
                                <p className="text-xs text-gray-500">
                                  รหัส: {line.product.code}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {line.quantity.toLocaleString('th-TH')} {line.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{line.unitPrice.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ฿{line.amount.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">วงเงินรวม</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ฿{(selectedPR.estimatedAmount / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Info */}
              {selectedPR.approvedByUser && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <Label className="text-green-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    ข้อมูลการอนุมัติ
                  </Label>
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="text-gray-600">ผู้อนุมัติ:</span>{' '}
                      <span className="font-medium">{selectedPR.approvedByUser.name}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">วันที่อนุมัติ:</span>{' '}
                      <span className="font-medium">
                        {selectedPR.approvedAt
                          ? new Date(selectedPR.approvedAt).toLocaleDateString('th-TH')
                          : '-'}
                      </span>
                    </p>
                    {selectedPR.approvalNotes && (
                      <p className="mt-2">
                        <span className="text-gray-600">หมายเหตุ:</span>{' '}
                        <span className="font-medium">{selectedPR.approvalNotes}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PO Reference */}
              {selectedPR.purchaseOrder && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Label className="text-blue-900 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    อ้างอิงใบสั่งซื้อ
                  </Label>
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="text-gray-600">เลขที่ PO:</span>{' '}
                      <span className="font-medium">{selectedPR.purchaseOrder.orderNo}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">สถานะ:</span>{' '}
                      <Badge variant="outline" className="ml-2">
                        {selectedPR.purchaseOrder.status}
                      </Badge>
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPR.notes && (
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedPR.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedPR.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(selectedPR.id, 'submit')}
                      disabled={processingAction === `${selectedPR.id}-submit`}
                    >
                      {processingAction === `${selectedPR.id}-submit` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      ส่งอนุมัติ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedPR.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </Button>
                  </>
                )}
                {selectedPR.status === 'PENDING' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(selectedPR.id, 'approve')}
                      disabled={processingAction === `${selectedPR.id}-approve`}
                    >
                      {processingAction === `${selectedPR.id}-approve` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      อนุมัติ
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(selectedPR.id, 'reject')}
                      disabled={processingAction === `${selectedPR.id}-reject`}
                    >
                      {processingAction === `${selectedPR.id}-reject` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      ปฏิเสธ
                    </Button>
                  </>
                )}
                {selectedPR.status === 'APPROVED' && !selectedPR.purchaseOrder && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleConvertToPO(selectedPR.id)}
                    disabled={processingAction === `${selectedPR.id}-convert`}
                  >
                    {processingAction === `${selectedPR.id}-convert` ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    แปลงเป็น PO
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
