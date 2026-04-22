'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  History,
  Repeat,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface RecurringDocument {
  id: string
  type: 'INVOICE' | 'EXPENSE' | 'RECEIPT'
  title: string
  description?: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  dayOfMonth: number
  startDate: string
  endDate?: string
  nextRunAt: string
  lastRunAt?: string
  isActive: boolean
  referenceId?: string
  _count?: {
    runs: number
  }
  runs?: RecurringRun[]
}

interface RecurringRun {
  id: string
  runAt: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  documentId?: string
  error?: string
}

// Status labels
const typeLabels: Record<string, string> = {
  INVOICE: 'ใบกำกับภาษี',
  EXPENSE: 'ค่าใช้จ่าย',
  RECEIPT: 'ใบเสร็จ',
}

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'รายเดือน',
  QUARTERLY: 'รายไตรมาส',
  YEARLY: 'รายปี',
}

// Helper to get status badge variant
function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-300">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Active
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 border-gray-300">
      <Pause className="h-3 w-3 mr-1" />
      Paused
    </Badge>
  )
}

// Helper to get run status badge
function getRunStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-100 text-green-800 border-green-300">สำเร็จ</Badge>
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800 border-red-300">ล้มเหลว</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">รอดำเนินการ</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// Helper to get type icon/color
function getTypeBadge(type: string) {
  switch (type) {
    case 'INVOICE':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">ใบกำกับภาษี</Badge>
    case 'EXPENSE':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">ค่าใช้จ่าย</Badge>
    case 'RECEIPT':
      return <Badge className="bg-teal-100 text-teal-800 border-teal-300">ใบเสร็จ</Badge>
    default:
      return <Badge variant="secondary">{type}</Badge>
  }
}

export function RecurringDocuments() {
  const [documents, setDocuments] = useState<RecurringDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [selectedDocument, setSelectedDocument] = useState<RecurringDocument | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<RecurringDocument | null>(null)
  const [runHistory, setRunHistory] = useState<RecurringRun[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    type: 'INVOICE' as 'INVOICE' | 'EXPENSE' | 'RECEIPT',
    title: '',
    description: '',
    frequency: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    dayOfMonth: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Fetch documents
  useEffect(() => {
    fetchDocuments()
  }, [pagination.page, pagination.limit, filterType, filterActive])

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filterType !== 'all') params.append('type', filterType)
      if (filterActive !== 'all') params.append('isActive', filterActive)

      const res = await fetch(`/api/recurring?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Fetch failed')

      const result = await res.json()
      const data = result.data || []

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format')
      }

      setDocuments(data)
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

  // Fetch run history
  const fetchRunHistory = async (documentId: string) => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/recurring/${documentId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Fetch failed')

      const result = await res.json()
      setRunHistory(result.data?.runs || [])
    } catch (err) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'โหลดประวัติไม่สำเร็จ',
        variant: 'destructive',
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  // Filter documents
  const filteredDocuments = (documents || []).filter(doc => {
    const matchesSearch =
      !searchTerm ||
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Action handlers
  const handleView = async (document: RecurringDocument) => {
    setSelectedDocument(document)
    setIsViewDialogOpen(true)
    await fetchRunHistory(document.id)
  }

  const handleViewHistory = async (document: RecurringDocument) => {
    setSelectedDocument(document)
    setIsHistoryDialogOpen(true)
    await fetchRunHistory(document.id)
  }

  const handleEdit = (document: RecurringDocument) => {
    setEditingDocument(document)
    setFormData({
      type: document.type,
      title: document.title,
      description: document.description || '',
      frequency: document.frequency,
      dayOfMonth: String(document.dayOfMonth),
      startDate: new Date(document.startDate).toISOString().split('T')[0],
      endDate: document.endDate ? new Date(document.endDate).toISOString().split('T')[0] : '',
      isActive: document.isActive,
    })
    setIsFormDialogOpen(true)
  }

  const handleToggleActive = async (document: RecurringDocument) => {
    setProcessingAction(`toggle-${document.id}`)
    try {
      const res = await fetch(`/api/recurring/${document.id}`, { credentials: 'include', 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !document.isActive }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'อัพเดทไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: document.isActive ? 'ระงับการทำซ้ำแล้ว' : 'เปิดใช้งานแล้ว',
      })

      fetchDocuments()
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRunNow = async (document: RecurringDocument) => {
    if (!confirm(`ต้องการสร้างเอกสารจาก "${document.title}" ทันทีใช่หรือไม่?`)) {
      return
    }

    setProcessingAction(`run-${document.id}`)
    try {
      const res = await fetch(`/api/recurring/process`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ดำเนินการไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: 'สร้างเอกสารเรียบร้อยแล้ว กรุณาตรวจสอบในรายการ',
      })

      fetchDocuments()
      fetchRunHistory(document.id)
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      return
    }

    setProcessingAction(`delete-${documentId}`)
    try {
      const res = await fetch(`/api/recurring/${documentId}`, { credentials: 'include', 
        method: 'DELETE',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ลบไม่สำเร็จ')
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบรายการเรียบร้อยแล้ว',
      })

      fetchDocuments()
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      const payload = {
        ...formData,
        dayOfMonth: parseInt(formData.dayOfMonth),
        endDate: formData.endDate || null,
      }

      const url = editingDocument
        ? `/api/recurring/${editingDocument.id}`
        : '/api/recurring'

      const method = editingDocument ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'บันทึกไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: editingDocument ? 'อัพเดทเรียบร้อยแล้ว' : 'สร้างเรายการเรียบร้อยแล้ว',
      })

      setIsFormDialogOpen(false)
      setEditingDocument(null)
      resetForm()
      fetchDocuments()
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'INVOICE',
      title: '',
      description: '',
      frequency: 'MONTHLY',
      dayOfMonth: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
    })
  }

  const openNewForm = () => {
    setEditingDocument(null)
    resetForm()
    setIsFormDialogOpen(true)
  }

  // Loading UI
  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
  if (error && documents.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Calculate stats
  const stats = {
    active: documents.filter(d => d.isActive).length,
    paused: documents.filter(d => !d.isActive).length,
    dueToday: documents.filter(d => {
      if (!d.isActive || !d.nextRunAt) return false
      const today = new Date().toDateString()
      return new Date(d.nextRunAt).toDateString() === today
    }).length,
    total: documents.length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">เอกสารประจำ (Recurring Documents)</h1>
          <p className="text-gray-500 mt-1">จัดการเอกสารที่สร้างอัตโนมัติตามรอบระยะเวลา</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNewForm}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างรายการใหม่
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
              </div>
              <Repeat className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">กำลังทำงาน</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ระงับชั่วคราว</p>
                <p className="text-2xl font-bold text-gray-600">{stats.paused}</p>
              </div>
              <Pause className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ถึงกำหนดวันนี้</p>
                <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
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
                placeholder="ค้นหาตามชื่อหรือรายละเอียด..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="ประเภทเอกสาร" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="INVOICE">ใบกำกับภาษี</SelectItem>
                <SelectItem value="EXPENSE">ค่าใช้จ่าย</SelectItem>
                <SelectItem value="RECEIPT">ใบเสร็จ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อรายการ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ความถี่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>รอบถัดไป</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Repeat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>ไม่พบรายการ</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{doc.title}</div>
                        {doc.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {doc.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getTypeBadge(doc.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {frequencyLabels[doc.frequency]} วันที่ {doc.dayOfMonth}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(doc.startDate).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {doc.nextRunAt
                            ? new Date(doc.nextRunAt).toLocaleDateString('th-TH')
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.isActive)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {doc._count?.runs || 0} ครั้ง
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(doc)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewHistory(doc)}
                          >
                            <History className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(doc)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(doc)}
                            disabled={processingAction === `toggle-${doc.id}`}
                          >
                            {processingAction === `toggle-${doc.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : doc.isActive ? (
                              <Pause className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Play className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRunNow(doc)}
                            disabled={processingAction === `run-${doc.id}` || !doc.isActive}
                          >
                            {processingAction === `run-${doc.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(doc.id)}
                            disabled={processingAction === `delete-${doc.id}`}
                          >
                            {processingAction === `delete-${doc.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              {selectedDocument?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument && getStatusBadge(selectedDocument.isActive)}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">ประเภทเอกสาร</Label>
                  <p className="font-medium">{getTypeBadge(selectedDocument.type)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">ความถี่</Label>
                  <p className="font-medium">
                    {frequencyLabels[selectedDocument.frequency]} วันที่ {selectedDocument.dayOfMonth}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">วันที่เริ่มต้น</Label>
                  <p className="font-medium">
                    {new Date(selectedDocument.startDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">วันที่สิ้นสุด</Label>
                  <p className="font-medium">
                    {selectedDocument.endDate
                      ? new Date(selectedDocument.endDate).toLocaleDateString('th-TH')
                      : 'ไม่กำหนด'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">รอบถัดไป</Label>
                  <p className="font-medium text-green-600">
                    {selectedDocument.nextRunAt
                      ? new Date(selectedDocument.nextRunAt).toLocaleDateString('th-TH')
                      : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">รอบล่าสุด</Label>
                  <p className="font-medium">
                    {selectedDocument.lastRunAt
                      ? new Date(selectedDocument.lastRunAt).toLocaleDateString('th-TH')
                      : 'ยังไม่เคยทำงาน'}
                  </p>
                </div>
              </div>

              {selectedDocument.description && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">รายละเอียด</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedDocument.description}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label>ประวัติการทำงาน ({runHistory.length} ครั้ง)</Label>
                </div>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : runHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีประวัติ</p>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {runHistory.slice(0, 10).map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            {run.status === 'COMPLETED' && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {run.status === 'FAILED' && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            {run.status === 'PENDING' && (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm">
                              {new Date(run.runAt).toLocaleDateString('th-TH')} -{' '}
                              {new Date(run.runAt).toLocaleTimeString('th-TH')}
                            </span>
                          </div>
                          {getRunStatusBadge(run.status)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              ประวัติการทำงาน: {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : runHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีประวัติการทำงาน</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {runHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {run.status === 'COMPLETED' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {run.status === 'FAILED' && <XCircle className="h-5 w-5 text-red-500" />}
                      {run.status === 'PENDING' && <Clock className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <p className="font-medium">
                          {new Date(run.runAt).toLocaleDateString('th-TH')} -{' '}
                          {new Date(run.runAt).toLocaleTimeString('th-TH')}
                        </p>
                        {run.error && <p className="text-sm text-red-600">{run.error}</p>}
                      </div>
                    </div>
                    {getRunStatusBadge(run.status)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        setIsFormDialogOpen(open)
        if (!open) {
          setEditingDocument(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingDocument ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingDocument ? 'แก้ไขรายการ' : 'สร้างรายการใหม่'}
            </DialogTitle>
            <DialogDescription>
              กำหนดรอบการสร้างเอกสารอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">ประเภทเอกสาร</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVOICE">ใบกำกับภาษี</SelectItem>
                    <SelectItem value="EXPENSE">ค่าใช้จ่าย</SelectItem>
                    <SelectItem value="RECEIPT">ใบเสร็จ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">ความถี่</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value as typeof formData.frequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">รายเดือน</SelectItem>
                    <SelectItem value="QUARTERLY">รายไตรมาส</SelectItem>
                    <SelectItem value="YEARLY">รายปี</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">ชื่อรายการ</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ค่าเช่าออฟฟิต รายเดือน"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด (ไม่บังคับ)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="คำอธิบายเพิ่มเติม"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">วันที่ในเดือน (1-28)</Label>
                <Select
                  value={formData.dayOfMonth}
                  onValueChange={(value) => setFormData({ ...formData, dayOfMonth: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด (ไม่บังคับ)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">เปิดใช้งานทันที</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormDialogOpen(false)
                  setEditingDocument(null)
                  resetForm()
                }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDocument ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
