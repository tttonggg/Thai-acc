'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { InvoiceEditDialog } from '@/components/invoices/invoice-edit-dialog'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customerName: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  type: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  PARTIAL: 'รับชำระบางส่วน',
  PAID: 'รับชำระเต็มจำนวน',
  CANCELLED: 'ยกเลิก',
}

const typeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
  CREDIT_NOTE: 'ใบลดหนี้',
  DEBIT_NOTE: 'ใบเพิ่มหนี้',
}

export function InvoiceList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [invoiceFormType, setInvoiceFormType] = useState<'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'>('TAX_INVOICE')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [printingInvoice, setPrintingInvoice] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/invoices')
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()
        // API returns { success: true, data: [...] }
        setInvoices(result.data || result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล'
        setError(message)
        toast({
          title: 'ข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [refreshKey, toast])

  const filteredInvoices = invoices.filter(invoice => {
    // Safety check - ensure invoice is an object and has required properties
    if (!invoice || typeof invoice !== 'object') return false

    const matchesSearch = invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleInvoiceSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setIsAddDialogOpen(false)
  }

  const handleEditInvoiceSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setIsEditDialogOpen(false)
    setEditInvoiceId(null)
  }

  const openEditDialog = (invoiceId: string) => {
    setEditInvoiceId(invoiceId)
    setIsEditDialogOpen(true)
  }

  const openInvoiceForm = (type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE') => {
    setInvoiceFormType(type)
    setIsAddDialogOpen(true)
  }

  const handleView = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/export/pdf`, '_blank')
  }

  const handlePrint = async (invoiceId: string) => {
    setPrintingInvoice(invoiceId)
    try {
      const url = `/api/invoices/${invoiceId}/export/pdf`
      const win = window.open(url, '_blank')
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 1000)
        }
      }
    } catch (error) {
      toast({
        title: 'พิมพ์ไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    } finally {
      setPrintingInvoice(null)
    }
  }

  const handleDownload = async (invoiceId: string, invoiceNo: string) => {
    setDownloadingInvoice(invoiceId)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/export/pdf`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${invoiceNo} เรียบร้อยแล้ว`
      })
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    } finally {
      setDownloadingInvoice(null)
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
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Empty UI
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบกำกับภาษี / เอกสารการขาย</h1>
            <p className="text-gray-500 mt-1">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                สร้างเอกสารใหม่
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูล</AlertDescription>
        </Alert>
        <InvoiceForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleInvoiceSuccess}
          defaultType={invoiceFormType}
        />
      </div>
    )
  }

  // Ensure invoices is an array for safe operations
  const safeInvoices = invoices || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบกำกับภาษี / เอกสารการขาย</h1>
          <p className="text-gray-500 mt-1">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              สร้างเอกสารใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>สร้างเอกสารใหม่</DialogTitle>
              <DialogDescription>
                เลือกประเภทเอกสารที่ต้องการสร้าง
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-24 flex-col" onClick={() => openInvoiceForm('TAX_INVOICE')}>
                <FileText className="h-8 w-8 mb-2 text-blue-600" />
                <span>ใบกำกับภาษี</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" onClick={() => openInvoiceForm('RECEIPT')}>
                <FileText className="h-8 w-8 mb-2 text-green-600" />
                <span>ใบเสร็จรับเงิน</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" onClick={() => openInvoiceForm('DELIVERY_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-orange-600" />
                <span>ใบส่งของ</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" onClick={() => openInvoiceForm('CREDIT_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-red-600" />
                <span>ใบลดหนี้</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <InvoiceForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleInvoiceSuccess}
          defaultType={invoiceFormType}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รอออกใบกำกับภาษี</p>
            <p className="text-2xl font-bold text-yellow-600">{invoices.filter(i => i.status === 'DRAFT').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รอรับชำระ</p>
            <p className="text-2xl font-bold text-blue-600">{invoices.filter(i => i.status === 'ISSUED' || i.status === 'PARTIAL').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รับชำระแล้ว (เดือนนี้)</p>
            <p className="text-2xl font-bold text-green-600">฿{safeInvoices?.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.totalAmount || 0), 0)?.toLocaleString() ?? '0'}</p>
            <p className="text-xs text-gray-400">{safeInvoices?.filter(i => i.status === 'PAID').length ?? 0} รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ภาษีขายรวม</p>
            <p className="text-2xl font-bold text-purple-600">฿{safeInvoices?.reduce((sum, i) => sum + (i.vatAmount || 0), 0)?.toLocaleString() ?? '0'}</p>
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
                placeholder="ค้นหาตามชื่อลูกค้าหรือเลขที่เอกสาร..." 
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
                <SelectItem value="DRAFT">ร่าง</SelectItem>
                <SelectItem value="ISSUED">ออกแล้ว</SelectItem>
                <SelectItem value="PARTIAL">รับชำระบางส่วน</SelectItem>
                <SelectItem value="PAID">รับชำระเต็มจำนวน</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">มูลค่าก่อน VAT</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoiceNo}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[invoice.type]}</Badge>
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell className="text-right">฿{(invoice.subtotal ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">฿{(invoice.vatAmount ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">฿{(invoice.totalAmount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleView(invoice.id)}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(invoice.id)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePrint(invoice.id)}
                        disabled={printingInvoice === invoice.id}
                      >
                        {printingInvoice === invoice.id ? (
                          <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(invoice.id, invoice.invoiceNo)}
                        disabled={downloadingInvoice === invoice.id}
                      >
                        {downloadingInvoice === invoice.id ? (
                          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 text-purple-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editInvoiceId && (
        <InvoiceEditDialog
          invoiceId={editInvoiceId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditInvoiceSuccess}
        />
      )}
    </div>
  )
}
