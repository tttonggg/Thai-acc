'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Loader2,
  FileText,
  Download,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface QuotationLine {
  id: string
  lineNo: number
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  vatRate: number
  vatAmount: number
  amount: number
  notes?: string
  product?: {
    id: string
    code: string
    name: string
  }
}

interface QuotationCustomer {
  id: string
  code: string
  name: string
  taxId?: string
  address?: string
  phone?: string
}

interface QuotationInvoice {
  id: string
  invoiceNo: string
  status: string
}

interface Quotation {
  id: string
  quotationNo: string
  quotationDate: string
  validUntil: string
  version: number
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'REVISED' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED'
  customer: QuotationCustomer
  contactPerson?: string
  reference?: string
  subtotal: number
  discountAmount: number
  discountPercent: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedReason?: string
  revisedAt?: string
  invoice?: QuotationInvoice
  terms?: string
  notes?: string
  internalNotes?: string
  lines: QuotationLine[]
  createdAt: string
}

interface QuotationViewDialogProps {
  quotationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  onRefresh?: () => void
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  SENT: 'ส่งแล้ว',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  REVISED: 'แก้ไขแล้ว',
  EXPIRED: 'หมดอายุ',
  CONVERTED: 'แปลงเป็นใบแจ้งหนี้',
  CANCELLED: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVISED: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-gray-200 text-gray-700',
  CONVERTED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function QuotationViewDialog({
  quotationId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRefresh
}: QuotationViewDialogProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && quotationId) {
      fetchQuotation()
    }
  }, [open, quotationId])

  const fetchQuotation = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, { credentials: 'include' })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลใบเสนอราคาได้')
      }

      setQuotation(result.data)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100) // Convert from Satang to Baht
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = () => {
    if (!quotation) return false
    return new Date(quotation.validUntil) < new Date()
  }

  const isExpiringSoon = () => {
    if (!quotation) return false
    const daysUntilExpiry = Math.ceil(
      (new Date(quotation.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }

  const handleSend = async () => {
    if (!quotation) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/send`, { credentials: 'include', 
        method: 'POST',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถส่งใบเสนอราคาได้')
      }

      toast({
        title: 'ส่งใบเสนอราคาเรียบร้อยแล้ว',
        description: `เลขที่ ${quotation.quotationNo}`,
      })

      fetchQuotation()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'ส่งใบเสนอราคาไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!quotation) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/approve`, { credentials: 'include', 
        method: 'POST',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถอนุมัติใบเสนอราคาได้')
      }

      toast({
        title: 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว',
        description: `เลขที่ ${quotation.quotationNo}`,
      })

      fetchQuotation()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'อนุมัติใบเสนอราคาไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!quotation) return

    const reason = prompt('กรุณาระบุเหตุผลการปฏิเสธ:')

    if (!reason || reason.trim() === '') {
      toast({
        title: 'กรุณาระบุเหตุผล',
        description: 'ต้องระบุเหตุผลในการปฏิเสธใบเสนอราคา',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/reject`, { credentials: 'include', 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถปฏิเสธใบเสนอราคาได้')
      }

      toast({
        title: 'ปฏิเสธใบเสนอราคาเรียบร้อยแล้ว',
        description: `เลขที่ ${quotation.quotationNo}`,
      })

      fetchQuotation()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'ปฏิเสธใบเสนอราคาไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertToInvoice = async () => {
    if (!quotation) return

    if (!confirm('ต้องการแปลงใบเสนอราคานี้เป็นใบแจ้งหนี้ใช่หรือไม่?')) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/convert-to-invoice`, { credentials: 'include', 
        method: 'POST',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้')
      }

      toast({
        title: 'แปลงเป็นใบแจ้งหนี้เรียบร้อยแล้ว',
        description: result.data?.invoiceNo || 'สำเร็จ',
      })

      fetchQuotation()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'แปลงเป็นใบแจ้งหนี้ไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!quotation) return

    if (!confirm('ต้องการยกเลิกใบเสนอราคานี้ใช่หรือไม่?')) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/cancel`, { credentials: 'include', 
        method: 'POST',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถยกเลิกใบเสนอราคาได้')
      }

      toast({
        title: 'ยกเลิกใบเสนอราคาเรียบร้อยแล้ว',
        description: `เลขที่ ${quotation.quotationNo}`,
      })

      fetchQuotation()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'ยกเลิกใบเสนอราคาไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quotation) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, { credentials: 'include', 
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถลบใบเสนอราคาได้')
      }

      toast({
        title: 'ลบใบเสนอราคาเรียบร้อยแล้ว',
        description: `เลขที่ ${quotation.quotationNo}`,
      })

      setShowDeleteDialog(false)
      onOpenChange(false)
      onDelete?.()
      onRefresh?.()
    } catch (err: any) {
      toast({
        title: 'ลบใบเสนอราคาไม่สำเร็จ',
        description: err.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    if (!quotation) return

    setPrinting(true)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'ไม่สามารถเปิดหน้าต่างได้',
        description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
        variant: 'destructive'
      })
      setPrinting(false)
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสนอราคา - ${quotation.quotationNo}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-block { flex: 1; }
          .info-block p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; border-top: 2px solid #333; padding-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .summary-row.total { font-weight: bold; font-size: 18px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบเสนอราคา</h1>
          <p>เลขที่: ${quotation.quotationNo}</p>
          <p>วันที่: ${formatDate(quotation.quotationDate)}</p>
          ${quotation.version > 1 ? `<p>รุ่นที่: ${quotation.version}</p>` : ''}
          <p>วันหมดอายุ: ${formatDate(quotation.validUntil)}</p>
          <p>สถานะ: ${statusLabels[quotation.status]}</p>
        </div>

        <div class="info">
          <div class="info-block">
            <p><strong>ลูกค้า:</strong></p>
            <p>${quotation.customer.name}</p>
            <p>${quotation.customer.code}</p>
            ${quotation.customer.taxId ? `<p>เลขประจำตัวผู้เสียภาษี: ${quotation.customer.taxId}</p>` : ''}
            ${quotation.customer.address ? `<p>${quotation.customer.address}</p>` : ''}
            ${quotation.customer.phone ? `<p>โทร: ${quotation.customer.phone}</p>` : ''}
            ${quotation.contactPerson ? `<p>ผู้ติดต่อ: ${quotation.contactPerson}</p>` : ''}
          </div>
          <div class="info-block">
            ${quotation.reference ? `<p><strong>อ้างอิง:</strong> ${quotation.reference}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการ</th>
              <th class="text-right">จำนวน</th>
              <th class="text-right">ราคา/หน่วย</th>
              <th class="text-right">ส่วนลด</th>
              <th class="text-right">VAT</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.lines.map((line, index) => `
              <tr>
                <td>${line.lineNo}</td>
                <td>
                  ${line.product ? `${line.product.code} - ${line.product.name}` : line.description}
                  ${line.notes ? `<br><small>${line.notes}</small>` : ''}
                </td>
                <td class="text-right">${line.quantity} ${line.unit}</td>
                <td class="text-right">${formatCurrency(line.unitPrice)}</td>
                <td class="text-right">${line.discount > 0 ? formatCurrency(line.discount) : '-'}</td>
                <td class="text-right">${line.vatRate > 0 ? `${line.vatRate}%` : '-'}</td>
                <td class="text-right">${formatCurrency(line.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>มูลค่าก่อน VAT</span>
            <span>${formatCurrency(quotation.subtotal)}</span>
          </div>
          ${quotation.discountAmount > 0 ? `
          <div class="summary-row">
            <span>ส่วนลด (${quotation.discountPercent}%)</span>
            <span>-${formatCurrency(quotation.discountAmount)}</span>
          </div>
          ` : ''}
          <div class="summary-row">
            <span>ยอดหลังหักส่วนลด</span>
            <span>${formatCurrency(quotation.subtotal - quotation.discountAmount)}</span>
          </div>
          <div class="summary-row">
            <span>VAT (${quotation.vatRate}%)</span>
            <span>${formatCurrency(quotation.vatAmount)}</span>
          </div>
          <div class="summary-row total">
            <span>ยอดรวมสุทธิ</span>
            <span>${formatCurrency(quotation.totalAmount)}</span>
          </div>
        </div>

        ${quotation.terms ? `<p style="margin-top: 20px;"><strong>เงื่อนไข:</strong></p><p>${quotation.terms}</p>` : ''}
        ${quotation.notes ? `<p style="margin-top: 10px;"><strong>หมายเหตุ:</strong></p><p>${quotation.notes}</p>` : ''}

        <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => setPrinting(false), 1000)
  }

  const handleDownload = async () => {
    try {
      toast({
        title: 'กำลังดาวน์โหลด',
        description: 'กำลังสร้างไฟล์ PDF...',
      })
      handlePrint()
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบเสนอราคา</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !quotation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบเสนอราคา</DialogTitle>
          </VisuallyHidden>
          <div className="text-center py-12 text-red-600">
            เกิดข้อผิดพลาด: {error || 'ไม่พบข้อมูล'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const canEdit = ['DRAFT', 'REVISED', 'REJECTED'].includes(quotation.status)
  const canDelete = quotation.status === 'DRAFT'
  const canSend = ['DRAFT', 'REVISED', 'REJECTED'].includes(quotation.status)
  const canApprove = quotation.status === 'SENT'
  const canReject = quotation.status === 'SENT'
  const canConvert = quotation.status === 'APPROVED'
  const canCancel = ['DRAFT', 'SENT', 'REVISED'].includes(quotation.status)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  ใบเสนอราคา - {quotation.quotationNo}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusColors[quotation.status]}>
                    {statusLabels[quotation.status]}
                  </Badge>
                  {quotation.version > 1 && (
                    <Badge variant="outline">
                      รุ่นที่ {quotation.version}
                    </Badge>
                  )}
                  {isExpired() && quotation.status !== 'EXPIRED' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      หมดอายุ
                    </Badge>
                  )}
                  {isExpiringSoon() && !isExpired() && (
                    <Badge variant="outline" className="border-orange-500 text-orange-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      ใกล้หมดอายุ
                    </Badge>
                  )}
                  {quotation.invoice && (
                    <Badge className="bg-purple-100 text-purple-800">
                      แปลงเป็น {quotation.invoice.invoiceNo}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={printing || actionLoading}
                >
                  {printing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  ดาวน์โหลด
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={printing || actionLoading}
                >
                  {printing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  พิมพ์
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Print Content */}
          <div className="space-y-6 print:space-y-4" id="quotation-content">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold">ใบเสนอราคา</h1>
                <p className="text-lg text-muted-foreground mt-1">{quotation.quotationNo}</p>
                {quotation.version > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    รุ่นที่ {quotation.version}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <Badge className={statusColors[quotation.status]}>
                    {statusLabels[quotation.status]}
                  </Badge>
                </div>
                <p className="text-sm">วันที่เสนอราคา: {formatDate(quotation.quotationDate)}</p>
                <p className="text-sm">วันหมดอายุ: {formatDate(quotation.validUntil)}</p>
              </div>
            </div>

            {/* Customer Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ลูกค้า</p>
                    <p className="font-semibold text-lg">{quotation.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{quotation.customer.code}</p>
                    {quotation.customer.taxId && (
                      <p className="text-sm">เลขประจำตัวผู้เสียภาษี: {quotation.customer.taxId}</p>
                    )}
                    {quotation.customer.address && (
                      <p className="text-sm mt-2">{quotation.customer.address}</p>
                    )}
                    {quotation.customer.phone && (
                      <p className="text-sm">โทร: {quotation.customer.phone}</p>
                    )}
                    {quotation.contactPerson && (
                      <p className="text-sm mt-1">ผู้ติดต่อ: {quotation.contactPerson}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {quotation.reference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เลขที่อ้างอิง:</span>
                        <span className="font-medium">{quotation.reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วันที่เสนอราคา:</span>
                      <span className="font-medium">{formatDate(quotation.quotationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วันหมดอายุ:</span>
                      <span className="font-medium">{formatDate(quotation.validUntil)}</span>
                    </div>
                    {quotation.submittedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">วันที่ส่ง:</span>
                        <span className="font-medium">{formatDateTime(quotation.submittedAt)}</span>
                      </div>
                    )}
                    {quotation.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">วันที่อนุมัติ:</span>
                        <span className="font-medium">{formatDateTime(quotation.approvedAt)}</span>
                      </div>
                    )}
                    {quotation.approvedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ผู้อนุมัติ:</span>
                        <span className="font-medium">{quotation.approvedBy}</span>
                      </div>
                    )}
                    {quotation.rejectedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">วันที่ปฏิเสธ:</span>
                        <span className="font-medium">{formatDateTime(quotation.rejectedAt)}</span>
                      </div>
                    )}
                    {quotation.revisedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">วันที่แก้ไข:</span>
                        <span className="font-medium">{formatDateTime(quotation.revisedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {quotation.status === 'REJECTED' && quotation.rejectedReason && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">เหตุผลการปฏิเสธ</p>
                    <p className="text-sm text-red-700">{quotation.rejectedReason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Converted Invoice Link */}
            {quotation.invoice && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800 mb-1">
                        แปลงเป็นใบแจ้งหนี้แล้ว
                      </p>
                      <p className="text-sm text-purple-700">
                        เลขที่ {quotation.invoice.invoiceNo} ({statusLabels[quotation.invoice.status]})
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Open invoice view dialog
                        window.open(`/invoices?id=${quotation.invoice?.id}`, '_blank')
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      ดูใบแจ้งหนี้
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายการสินค้า/บริการ</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ลำดับ</TableHead>
                      <TableHead>รายการ</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead>หน่วย</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">ส่วนลด</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.lineNo}</TableCell>
                        <TableCell>
                          <div>
                            {line.product && (
                              <p className="text-xs text-muted-foreground">
                                {line.product.code} - {line.product.name}
                              </p>
                            )}
                            <p className="font-medium">{line.description}</p>
                            {line.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{line.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{line.quantity.toLocaleString()}</TableCell>
                        <TableCell>{line.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          {line.discount > 0 ? formatCurrency(line.discount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.vatRate > 0 ? `${line.vatRate}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>มูลค่าก่อน VAT</span>
                      <span>{formatCurrency(quotation.subtotal)}</span>
                    </div>

                    {quotation.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>ส่วนลด ({quotation.discountPercent}%)</span>
                        <span>-{formatCurrency(quotation.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span>ยอดหลังหักส่วนลด</span>
                      <span>{formatCurrency(quotation.subtotal - quotation.discountAmount)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-sm">
                      <span>VAT ({quotation.vatRate > 0 ? `${quotation.vatRate}%` : '0%'})</span>
                      <span>{formatCurrency(quotation.vatAmount)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                      <span>ยอดรวมสุทธิ</span>
                      <span className="text-blue-600">{formatCurrency(quotation.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(quotation.terms || quotation.notes || quotation.internalNotes) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {quotation.terms && (
                      <div>
                        <p className="text-sm font-medium mb-1">เงื่อนไข</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.terms}</p>
                      </div>
                    )}
                    {quotation.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">หมายเหตุ</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.notes}</p>
                      </div>
                    )}
                    {quotation.internalNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">บันทึกภายใน</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{quotation.internalNotes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workflow History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ประวัติการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สร้างเมื่อ:</span>
                    <span className="font-medium">{formatDateTime(quotation.createdAt)}</span>
                  </div>
                  {quotation.submittedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ส่งเมื่อ:</span>
                      <span className="font-medium">{formatDateTime(quotation.submittedAt)}</span>
                    </div>
                  )}
                  {quotation.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">อนุมัติเมื่อ:</span>
                      <span className="font-medium">{formatDateTime(quotation.approvedAt)}</span>
                    </div>
                  )}
                  {quotation.rejectedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ปฏิเสธเมื่อ:</span>
                      <span className="font-medium">{formatDateTime(quotation.rejectedAt)}</span>
                    </div>
                  )}
                  {quotation.revisedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">แก้ไขล่าสุด:</span>
                      <span className="font-medium">{formatDateTime(quotation.revisedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground print:hidden">
              <Separator className="mb-4" />
              <p>สร้างเมื่อ {new Date().toLocaleString('th-TH')}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 print:hidden">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  onClick={onEdit}
                  disabled={actionLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ
                </Button>
              )}
              {canSend && (
                <Button
                  variant="default"
                  onClick={handleSend}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  ส่งใบเสนอราคา
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  อนุมัติ
                </Button>
              )}
              {canReject && (
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  ปฏิเสธ
                </Button>
              )}
              {canConvert && (
                <Button
                  variant="default"
                  onClick={handleConvertToInvoice}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  แปลงเป็นใบแจ้งหนี้
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  ยกเลิก
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={actionLoading}
              >
                ปิด
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบใบเสนอราคา</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบใบเสนอราคา {quotation?.quotationNo} ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ลบ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
