'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Loader2
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditNoteForm } from './credit-note-form'
import { CreditNoteViewDialog } from './credit-note-view-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getStatusBadgeProps } from '@/lib/status-badge'

interface CreditNote {
  id: string
  creditNoteNo: string
  creditNoteDate: string
  customer: { id: string; name: string }
  invoice?: { id: string; invoiceNo: string }
  reason: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  notes?: string
}

const statusLabels: Record<string, string> = {
  ISSUED: 'ออกแล้ว',
  CANCELLED: 'ยกเลิก',
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status)
  return <Badge variant={config.variant}>{statusLabels[status] || config.label}</Badge>
}

const reasonLabels: Record<string, string> = {
  RETURN: 'คืนสินค้า',
  DISCOUNT: 'ส่วนลด',
  ALLOWANCE: 'ค่าเสียโอกาส',
  CANCELLATION: 'ยกเลิก',
}

export function CreditNoteList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewCreditNoteId, setViewCreditNoteId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCreditNotes = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/credit-notes')
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()
        // API returns { success: true, data: [...], pagination: {...} }
        if (result.success && result.data) {
          setCreditNotes(Array.isArray(result.data) ? result.data : [])
        } else {
          setCreditNotes([])
        }
      } catch (err) {
        console.error('Credit Notes Fetch Error:', err)
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล'
        setError(message)
        toast({
          title: 'ข้อผิดพลาด',
          description: message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchCreditNotes()
  }, [refreshKey, toast])

  const filteredCreditNotes = (creditNotes || []).filter(cn => {
    if (!cn || typeof cn !== 'object') return false

    const matchesSearch = cn.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cn.creditNoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cn.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || cn.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleCreditNoteSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setIsAddDialogOpen(false)
  }

  const handleView = (creditNoteId: string) => {
    setViewCreditNoteId(creditNoteId)
    setIsViewDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!creditNotes || creditNotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบลดหนี้ (Credit Notes)</h1>
            <p className="text-gray-500 mt-1">จัดการใบลดหนี้สำหรับลูกค้า</p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้างใบลดหนี้
          </Button>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูลใบลดหนี้</AlertDescription>
        </Alert>
        <CreditNoteForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleCreditNoteSuccess}
        />
      </div>
    )
  }

  const totalCreditAmount = creditNotes
    .filter(cn => cn.status === 'ISSUED')
    .reduce((sum, cn) => sum + (cn.totalAmount || 0), 0)

  const thisMonthCreditAmount = creditNotes
    .filter(cn => {
      const cnDate = new Date(cn.creditNoteDate)
      const now = new Date()
      return cn.status === 'ISSUED' &&
             cnDate.getMonth() === now.getMonth() &&
             cnDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, cn) => sum + (cn.totalAmount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบลดหนี้ (Credit Notes)</h1>
          <p className="text-gray-500 mt-1">จัดการใบลดหนี้สำหรับลูกค้า</p>
        </div>
        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้างใบลดหนี้
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ใบลดหนี้ทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{creditNotes?.length || 0}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">มูลค่าใบลดหนี้รวม</p>
            <p className="text-2xl font-bold text-red-600">฿{totalCreditAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">ทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">มูลค่าใบลดหนี้ (เดือนนี้)</p>
            <p className="text-2xl font-bold text-orange-600">฿{thisMonthCreditAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">เดือนนี้</p>
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
                placeholder="ค้นหาตามชื่อลูกค้า, เลขที่เอกสาร..."
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
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="ISSUED">ออกแล้ว</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Credit Note Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>เลขที่ใบกำกับภาษี</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead className="text-right">มูลค่าก่อน VAT</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreditNotes.map((cn) => (
                  <TableRow key={cn.id}>
                    <TableCell className="font-mono">{cn.creditNoteNo}</TableCell>
                    <TableCell>{formatDate(cn.creditNoteDate)}</TableCell>
                    <TableCell>{cn.customerName || '-'}</TableCell>
                    <TableCell className="font-mono">{cn.invoice?.invoiceNo || '-'}</TableCell>
                    <TableCell>{reasonLabels[cn.reason] || cn.reason}</TableCell>
                    <TableCell className="text-right">฿{(cn.subtotal ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">฿{(cn.vatAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      -฿{(cn.totalAmount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cn.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={() => handleView(cn.id)}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreditNoteForm
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleCreditNoteSuccess}
      />

      {viewCreditNoteId && (
        <CreditNoteViewDialog
          creditNoteId={viewCreditNoteId}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  )
}
