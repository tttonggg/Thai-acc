'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Eye,
  FileText,
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
import { DebitNoteForm } from './debit-note-form'
import { DebitNoteViewDialog } from './debit-note-view-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface DebitNote {
  id: string
  debitNoteNo: string
  debitNoteDate: string
  vendor: { id: string; name: string }
  purchaseInvoice?: { id: string; invoiceNo: string }
  reason: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  notes?: string
}

const statusColors: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  ISSUED: 'ออกแล้ว',
  CANCELLED: 'ยกเลิก',
}

const reasonLabels: Record<string, string> = {
  ADDITIONAL_CHARGES: 'ค่าใช้จ่ายเพิ่มเติม',
  RETURNED_GOODS: 'สินค้าที่คืน',
  PRICE_ADJUSTMENT: 'ปรับปรุงราคา',
}

export function DebitNoteList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewDebitNoteId, setViewDebitNoteId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDebitNotes = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/debit-notes')
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()
        // API returns { success: true, data: [...], pagination: {...} }
        if (result.success && result.data) {
          setDebitNotes(Array.isArray(result.data) ? result.data : [])
        } else {
          setDebitNotes([])
        }
      } catch (err) {
        console.error('Debit Notes Fetch Error:', err)
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
    fetchDebitNotes()
  }, [refreshKey, toast])

  const filteredDebitNotes = (debitNotes || []).filter(dn => {
    if (!dn || typeof dn !== 'object') return false

    const matchesSearch = dn.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dn.debitNoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dn.purchaseInvoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || dn.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleDebitNoteSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setIsAddDialogOpen(false)
  }

  const handleView = (debitNoteId: string) => {
    setViewDebitNoteId(debitNoteId)
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

  if (!debitNotes || debitNotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบเพิ่มหนี้ (Debit Notes)</h1>
            <p className="text-gray-500 mt-1">จัดการใบเพิ่มหนี้สำหรับผู้ขาย</p>
          </div>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้างใบเพิ่มหนี้
          </Button>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูลใบเพิ่มหนี้</AlertDescription>
        </Alert>
        <DebitNoteForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleDebitNoteSuccess}
        />
      </div>
    )
  }

  const totalDebitAmount = debitNotes
    .filter(dn => dn.status === 'ISSUED')
    .reduce((sum, dn) => sum + (dn.totalAmount || 0), 0)

  const thisMonthDebitAmount = debitNotes
    .filter(dn => {
      const dnDate = new Date(dn.debitNoteDate)
      const now = new Date()
      return dn.status === 'ISSUED' &&
             dnDate.getMonth() === now.getMonth() &&
             dnDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, dn) => sum + (dn.totalAmount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบเพิ่มหนี้ (Debit Notes)</h1>
          <p className="text-gray-500 mt-1">จัดการใบเพิ่มหนี้สำหรับผู้ขาย</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้างใบเพิ่มหนี้
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ใบเพิ่มหนี้ทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{debitNotes?.length || 0}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">มูลค่าใบเพิ่มหนี้รวม</p>
            <p className="text-2xl font-bold text-orange-600">฿{totalDebitAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">ทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">มูลค่าใบเพิ่มหนี้ (เดือนนี้)</p>
            <p className="text-2xl font-bold text-purple-600">฿{thisMonthDebitAmount.toLocaleString()}</p>
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
                placeholder="ค้นหาตามชื่อผู้ขาย, เลขที่เอกสาร..."
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

      {/* Debit Note Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead>เลขที่ใบซื้อ</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead className="text-right">มูลค่าก่อน VAT</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebitNotes.map((dn) => (
                  <TableRow key={dn.id}>
                    <TableCell className="font-mono">{dn.debitNoteNo}</TableCell>
                    <TableCell>{formatDate(dn.debitNoteDate)}</TableCell>
                    <TableCell>{dn.vendor?.name}</TableCell>
                    <TableCell className="font-mono">{dn.purchaseInvoice?.invoiceNo || '-'}</TableCell>
                    <TableCell>{reasonLabels[dn.reason] || dn.reason}</TableCell>
                    <TableCell className="text-right">฿{(dn.subtotal ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">฿{(dn.vatAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      +฿{(dn.totalAmount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[dn.status]}>
                        {statusLabels[dn.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(dn.id)}
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
      <DebitNoteForm
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleDebitNoteSuccess}
      />

      {viewDebitNoteId && (
        <DebitNoteViewDialog
          debitNoteId={viewDebitNoteId}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  )
}
