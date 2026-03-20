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
  RefreshCw,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileCheck
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

interface Quotation {
  id: string
  quotationNo: string
  quotationDate: string
  validUntil: string
  reference?: string
  customerId: string
  customer: {
    id: string
    name: string
    taxId?: string
  }
  subtotal: number
  discountAmount: number
  vatAmount: number
  totalAmount: number
  status: string
  notes?: string
  terms?: string
  invoiceId?: string
  invoice?: {
    id: string
    invoiceNo: string
  }
  lines: Array<{
    id: string
    lineNo: number
    description: string
    quantity: number
    unit: string
    unitPrice: number
    amount: number
  }>
  _count?: {
    lines: number
  }
}

// Status labels and colors (Thai)
const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  SENT: 'ส่งแล้ว',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  REVISED: 'แก้ไขแล้ว',
  EXPIRED: 'หมดอายุ',
  CONVERTED: 'แปลงเป็นใบกำกับภาษี',
  CANCELLED: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  SENT: 'bg-blue-100 text-blue-800 border-blue-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  REVISED: 'bg-orange-100 text-orange-800 border-orange-300',
  EXPIRED: 'bg-purple-100 text-purple-800 border-purple-300',
  CONVERTED: 'bg-teal-100 text-teal-800 border-teal-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
}

export function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [deletingQuotation, setDeletingQuotation] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch quotations
  useEffect(() => {
    fetchQuotations()
  }, [pagination.page, pagination.limit])

  const fetchQuotations = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterCustomer !== 'all') params.append('customerId', filterCustomer)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/quotations?${params}`)
      if (!res.ok) throw new Error('Fetch failed')

      const result = await res.json()
      const quotationsData = result.data || []

      if (!Array.isArray(quotationsData)) {
        throw new Error('Invalid data format')
      }

      setQuotations(quotationsData)
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

  // Filter quotations
  const filteredQuotations = (quotations || []).filter(quotation => {
    const matchesSearch =
      !searchTerm ||
      quotation.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || quotation.status === filterStatus
    const matchesCustomer =
      filterCustomer === 'all' || quotation.customer?.id === filterCustomer

    return matchesSearch && matchesStatus && matchesCustomer
  })

  // Check if quotation is expiring soon (within 7 days)
  const isExpiringSoon = (validUntil: string) => {
    const today = new Date()
    const expiryDate = new Date(validUntil)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 7
  }

  // Check if quotation is expired
  const isExpired = (validUntil: string) => {
    const today = new Date()
    const expiryDate = new Date(validUntil)
    return expiryDate < today
  }

  // Action handlers
  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (quotationId: string) => {
    // TODO: Open edit dialog
    toast({
      title: 'แก้ไขใบเสนอราคา',
      description: 'ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้',
    })
  }

  const handleDelete = async (quotationId: string) => {
    if (!confirm('คุณต้องการลบใบเสนอราคานี้ใช่หรือไม่?')) {
      return
    }

    setDeletingQuotation(quotationId)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ลบไม่สำเร็จ')
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบใบเสนอราคาเรียบร้อยแล้ว',
      })

      fetchQuotations()
    } catch (err) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: err instanceof Error ? err.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setDeletingQuotation(null)
    }
  }

  const handleAction = async (
    quotationId: string,
    action: 'send' | 'approve' | 'reject' | 'revise'
  ) => {
    setProcessingAction(`${quotationId}-${action}`)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'ดำเนินการไม่สำเร็จ')
      }

      const actionLabels = {
        send: 'ส่งเสนอราคา',
        approve: 'อนุมัติ',
        reject: 'ปฏิเสธ',
        revise: 'แก้ไข',
      }

      toast({
        title: 'สำเร็จ',
        description: `${actionLabels[action]}เรียบร้อยแล้ว`,
      })

      fetchQuotations()
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

  const handleConvertToInvoice = async (quotationId: string) => {
    setProcessingAction(`${quotationId}-convert`)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/convert-to-invoice`, {
        method: 'POST',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'แปลงเป็นใบกำกับภาษีไม่สำเร็จ')
      }

      toast({
        title: 'สำเร็จ',
        description: 'แปลงเป็นใบกำกับภาษีเรียบร้อยแล้ว',
      })

      fetchQuotations()
      setIsViewDialogOpen(false)
    } catch (err) {
      toast({
        title: 'แปลงเป็นใบกำกับภาษีไม่สำเร็จ',
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
    draft: quotations.filter(q => q.status === 'DRAFT').length,
    sent: quotations.filter(q => q.status === 'SENT').length,
    approved: quotations.filter(q => q.status === 'APPROVED').length,
    expiring: quotations.filter(q => isExpiringSoon(q.validUntil)).length,
    totalAmount: quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบเสนอราคา (Quotations)</h1>
          <p className="text-gray-500 mt-1">จัดการใบเสนอราคาและการอนุมัติ</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          สร้างใบเสนอราคา
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <p className="text-sm text-gray-500">ส่งแล้ว</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
              </div>
              <Send className="h-10 w-10 text-blue-500" />
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
                <p className="text-sm text-gray-500">ใกล้หมดอายุ</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">มูลค่ารวม</p>
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
                placeholder="ค้นหาตามเลขที่ เลขที่อ้างอิง หรือชื่อลูกค้า..."
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
                <SelectItem value="SENT">ส่งแล้ว</SelectItem>
                <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
                <SelectItem value="REVISED">แก้ไขแล้ว</SelectItem>
                <SelectItem value="EXPIRED">หมดอายุ</SelectItem>
                <SelectItem value="CONVERTED">แปลงเป็นใบกำกับภาษี</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">มูลค่าสุทธิ (บาท)</TableHead>
                  <TableHead>วันหมดอายุ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>ไม่พบใบเสนอราคา</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow
                      key={quotation.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-mono font-medium">
                        {quotation.quotationNo}
                        {quotation.reference && (
                          <div className="text-xs text-gray-500">
                            Ref: {quotation.reference}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(quotation.quotationDate).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span>{quotation.customer?.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{(quotation.totalAmount / 100).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {quotation.vatAmount > 0 && (
                          <div className="text-xs text-gray-500">
                            (VAT ฿{(quotation.vatAmount / 100).toFixed(2)})
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>
                            {new Date(quotation.validUntil).toLocaleDateString('th-TH')}
                          </span>
                          {isExpiringSoon(quotation.validUntil) &&
                            quotation.status !== 'EXPIRED' && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                ใกล้หมดอายุ
                              </Badge>
                            )}
                          {isExpired(quotation.validUntil) &&
                            quotation.status !== 'EXPIRED' && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                หมดอายุ
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[quotation.status]}
                          variant="outline"
                        >
                          {statusLabels[quotation.status]}
                        </Badge>
                        {quotation.invoiceId && (
                          <div className="text-xs text-green-600 mt-1">
                            <FileCheck className="h-3 w-3 inline mr-1" />
                            {quotation.invoice?.invoiceNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {quotation._count?.lines || quotation.lines?.length || 0} รายการ
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(quotation)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          {(quotation.status === 'DRAFT' ||
                            quotation.status === 'REVISED' ||
                            quotation.status === 'REJECTED') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(quotation.id)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              {quotation.status === 'DRAFT' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(quotation.id)}
                                  disabled={deletingQuotation === quotation.id}
                                >
                                  {deletingQuotation === quotation.id ? (
                                    <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              )}
                            </>
                          )}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ใบเสนอราคา: {selectedQuotation?.quotationNo}
            </DialogTitle>
            <DialogDescription>
              {selectedQuotation && (
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    className={statusColors[selectedQuotation.status]}
                    variant="outline"
                  >
                    {statusLabels[selectedQuotation.status]}
                  </Badge>
                  {isExpiringSoon(selectedQuotation.validUntil) &&
                    selectedQuotation.status !== 'EXPIRED' && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        ใกล้หมดอายุ
                      </Badge>
                    )}
                  {isExpired(selectedQuotation.validUntil) &&
                    selectedQuotation.status !== 'EXPIRED' && (
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        หมดอายุแล้ว
                      </Badge>
                    )}
                  {selectedQuotation.invoiceId && (
                    <Badge className="bg-teal-100 text-teal-800 border-teal-300">
                      <FileCheck className="h-3 w-3 mr-1" />
                      แปลงเป็น {selectedQuotation.invoice?.invoiceNo}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันที่เสนอราคา
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedQuotation.quotationDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันหมดอายุ
                  </Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedQuotation.validUntil).toLocaleDateString('th-TH')}
                  </p>
                </div>
                {selectedQuotation.reference && (
                  <div className="space-y-2">
                    <Label>เลขที่อ้างอิง</Label>
                    <p className="text-sm font-medium">{selectedQuotation.reference}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    ลูกค้า
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedQuotation.customer?.name}
                    {selectedQuotation.customer?.taxId && (
                      <span className="text-gray-500 ml-2">
                        ({selectedQuotation.customer.taxId})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <Label>รายการสินค้า/บริการ ({selectedQuotation.lines?.length || 0} รายการ)</Label>
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
                      {selectedQuotation.lines?.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="text-center">{line.lineNo}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">
                            {line.quantity.toLocaleString('th-TH')} {line.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{(line.unitPrice / 100).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ฿{(line.amount / 100).toLocaleString('th-TH', {
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
                  <div className="text-right space-y-2">
                    {selectedQuotation.discountAmount > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">มูลค่าก่อนส่วนลด:</span>{' '}
                        <span className="font-medium">
                          ฿
                          {(selectedQuotation.subtotal / 100).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {selectedQuotation.discountAmount > 0 && (
                      <div className="text-sm text-red-600">
                        <span>ส่วนลด:</span>{' '}
                        <span className="font-medium">
                          -฿
                          {(selectedQuotation.discountAmount / 100).toLocaleString(
                            'th-TH',
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    )}
                    {selectedQuotation.vatAmount > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">VAT (7%):</span>{' '}
                        <span className="font-medium">
                          ฿
                          {(selectedQuotation.vatAmount / 100).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-blue-600 pt-2 border-t">
                      ยอดรวมสุทธิ:{' '}
                      <span>
                        ฿
                        {(selectedQuotation.totalAmount / 100).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {selectedQuotation.terms && (
                <div className="space-y-2">
                  <Label>เงื่อนไข</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {selectedQuotation.terms}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedQuotation.notes && (
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedQuotation.notes}</p>
                </div>
              )}

              {/* Invoice Reference */}
              {selectedQuotation.invoiceId && (
                <div className="bg-teal-50 p-4 rounded-lg">
                  <Label className="text-teal-900 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    อ้างอิงใบกำกับภาษี
                  </Label>
                  <div className="mt-2 text-sm">
                    <p>
                      <span className="text-gray-600">เลขที่ใบกำกับภาษี:</span>{' '}
                      <span className="font-medium">
                        {selectedQuotation.invoice?.invoiceNo}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedQuotation.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(selectedQuotation.id, 'send')}
                      disabled={processingAction === `${selectedQuotation.id}-send`}
                    >
                      {processingAction === `${selectedQuotation.id}-send` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      ส่งเสนอราคา
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedQuotation.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </Button>
                  </>
                )}
                {selectedQuotation.status === 'SENT' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(selectedQuotation.id, 'approve')}
                      disabled={processingAction === `${selectedQuotation.id}-approve`}
                    >
                      {processingAction === `${selectedQuotation.id}-approve` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      อนุมัติ
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(selectedQuotation.id, 'reject')}
                      disabled={processingAction === `${selectedQuotation.id}-reject`}
                    >
                      {processingAction === `${selectedQuotation.id}-reject` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      ปฏิเสธ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction(selectedQuotation.id, 'revise')}
                      disabled={processingAction === `${selectedQuotation.id}-revise`}
                    >
                      {processingAction === `${selectedQuotation.id}-revise` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      ขอแก้ไข
                    </Button>
                  </>
                )}
                {(selectedQuotation.status === 'APPROVED' ||
                  selectedQuotation.status === 'REVISED') &&
                  !selectedQuotation.invoiceId && (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConvertToInvoice(selectedQuotation.id)}
                      disabled={processingAction === `${selectedQuotation.id}-convert`}
                    >
                      {processingAction === `${selectedQuotation.id}-convert` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileCheck className="h-4 w-4 mr-2" />
                      )}
                      แปลงเป็นใบกำกับภาษี
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
