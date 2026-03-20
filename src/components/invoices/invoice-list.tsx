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
  Loader2,
  MessageSquare
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { InvoiceEditDialog } from '@/components/invoices/invoice-edit-dialog'
import { useToast } from '@/hooks/use-toast'
import { getStatusBadgeProps } from '@/lib/status-badge'

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  date?: string // Keep for backward compatibility
  customerName: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  type: string
  _count?: {
    comments: number
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  PARTIAL: 'รับชำระบางส่วน',
  PAID: 'รับชำระเต็มจำนวน',
  CANCELLED: 'ยกเลิก',
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status)
  return <Badge variant={config.variant}>{statusLabels[status] || config.label}</Badge>
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
        // API returns { success: true, data: [...], pagination: {...} }
        const invoicesData = result.data || []
        if (!Array.isArray(invoicesData)) {
          throw new Error('Invalid invoices data format')
        }
        setInvoices(invoicesData)
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

  const filteredInvoices = (invoices || []).filter(invoice => {
    // Safety check - ensure invoice is an object and has required properties
    if (!invoice || typeof invoice !== 'object') return false

    // Only show invoice-related documents in this list, not CN/DN
    // CN and DN have their own dedicated sections
    const allowedTypes = ['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE']
    if (!allowedTypes.includes(invoice.type)) return false

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

  const openInvoiceForm = (type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE') => {
    // Note: CREDIT_NOTE and DEBIT_NOTE should be created from their dedicated sections
    setInvoiceFormType(type)
    setIsAddDialogOpen(true)
  }

  const handleView = (invoiceId: string) => {
    // Client-side view - open print window for viewing
    handlePrintInvoice(invoiceId, false)
  }

  const handleViewDetail = (invoiceId: string) => {
    // Navigate to invoice detail page using SPA routing
    window.history.pushState({ path: `/invoices/${invoiceId}` }, '', `/invoices/${invoiceId}`)
    // Trigger a popstate event to update the app state
    window.dispatchEvent(new PopStateEvent('popstate', { state: { path: `/invoices/${invoiceId}` } }))
  }

  const handlePrint = async (invoiceId: string) => {
    handlePrintInvoice(invoiceId, true)
  }

  const handlePrintInvoice = async (invoiceId: string, autoPrint: boolean = true) => {
    setPrintingInvoice(invoiceId)
    try {
      // Fetch invoice details and company info
      const [invoiceRes, companyRes] = await Promise.all([
        fetch(`/api/invoices/${invoiceId}`),
        fetch('/api/company')
      ])

      if (!invoiceRes.ok) throw new Error('Fetch failed')
      const result = await invoiceRes.json()
      const invoice = result.data

      let company = null
      if (companyRes.ok) {
        const companyResult = await companyRes.json()
        company = companyResult.data
      }

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Open print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: 'ไม่สามารถเปิดหน้าต่างได้',
          description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
          variant: 'destructive'
        })
        return
      }

      // Generate HTML content
      const typeLabels: Record<string, string> = {
        TAX_INVOICE: 'ใบกำกับภาษี',
        RECEIPT: 'ใบเสร็จรับเงิน',
        DELIVERY_NOTE: 'ใบส่งของ',
        CREDIT_NOTE: 'ใบลดหนี้',
        DEBIT_NOTE: 'ใบเพิ่มหนี้',
      }

      const statusLabels: Record<string, string> = {
        DRAFT: 'ร่าง',
        ISSUED: 'ออกแล้ว',
        PARTIAL: 'รับชำระบางส่วน',
        PAID: 'รับชำระเต็มจำนวน',
        CANCELLED: 'ยกเลิก',
      }

      // Build company address
      const companyAddressParts = [
        company?.address,
        company?.subDistrict,
        company?.district,
        company?.province,
        company?.postalCode
      ].filter(Boolean)
      const companyAddress = companyAddressParts.join(' ')

      // Build customer address
      const customerAddressParts = [
        invoice.customer?.address,
        invoice.customer?.subDistrict,
        invoice.customer?.district,
        invoice.customer?.province,
        invoice.customer?.postalCode
      ].filter(Boolean)
      const customerAddress = customerAddressParts.join(' ')

      // Get lines from invoice.lines (API returns 'lines', not 'items')
      const lineItems = invoice.lines || []

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${invoice.invoiceNo}</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            body {
              font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
              padding: 30px;
              max-width: 210mm;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.5;
            }
            /* Company Header */
            .company-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .company-info { flex: 1; }
            .company-name {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 5px;
              color: #333;
            }
            .company-details {
              font-size: 11px;
              color: #555;
              line-height: 1.6;
            }
            .company-logo {
              width: 80px;
              height: 80px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #999;
              margin-left: 20px;
            }
            /* Document Title */
            .doc-title {
              text-align: center;
              margin: 25px 0;
            }
            .doc-title h1 {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 5px 0;
              color: #333;
            }
            .doc-title .original-copy {
              font-size: 11px;
              color: #d32f2f;
              font-weight: 600;
              border: 1px solid #d32f2f;
              padding: 2px 10px;
              display: inline-block;
            }
            /* Info Grid */
            .info-grid {
              display: flex;
              gap: 30px;
              margin-bottom: 25px;
            }
            .info-block {
              flex: 1;
            }
            .info-block h3 {
              font-size: 12px;
              font-weight: 700;
              margin: 0 0 10px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #ddd;
              color: #333;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .info-label {
              width: 100px;
              color: #666;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              font-weight: 600;
              color: #333;
            }
            .customer-name {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #333;
            }
            /* Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 11px;
            }
            .items-table th {
              background: #424242;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
              border: 1px solid #424242;
            }
            .items-table td {
              padding: 10px 8px;
              border: 1px solid #ddd;
              vertical-align: top;
            }
            .items-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            /* Summary Section */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 280px;
              border: 1px solid #ddd;
              padding: 15px;
              background: #fafafa;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 11px;
              border-bottom: 1px dashed #ddd;
            }
            .summary-row:last-child {
              border-bottom: none;
            }
            .summary-row.total {
              font-weight: 700;
              font-size: 14px;
              color: #d32f2f;
              border-top: 2px solid #333;
              border-bottom: none;
              margin-top: 8px;
              padding-top: 10px;
            }
            /* Signature Section */
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 30px;
            }
            .signature-box {
              width: 150px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              padding-top: 10px;
              margin-top: 40px;
              font-size: 11px;
            }
            .date-line {
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
            /* Footer */
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            /* Print Styles */
            @media print {
              body {
                padding: 0;
                font-size: 11px;
              }
              .no-print { display: none !important; }
              .items-table th { background: #424242 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <!-- Company Header -->
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">${company?.name || 'บริษัท ไทย แอคเคานติ้ง จำกัด'}</div>
              <div class="company-details">
                ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                ${company?.taxId ? `<div>เลขประจำตัวผู้เสียภาษี: ${company.taxId}</div>` : ''}
                ${company?.phone ? `<div>โทร: ${company.phone}</div>` : ''}
                ${company?.email ? `<div>อีเมล: ${company.email}</div>` : ''}
              </div>
            </div>
            ${company?.logo ? `<div class="company-logo"><img src="${company.logo}" style="max-width: 80px; max-height: 80px;" /></div>` : ''}
          </div>

          <!-- Document Title -->
          <div class="doc-title">
            <h1>${typeLabels[invoice.type] || invoice.type}</h1>
            <span class="original-copy">ต้นฉบับ / ORIGINAL</span>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Left: Invoice Details -->
            <div class="info-block">
              <h3>รายละเอียดเอกสาร</h3>
              <div class="info-row">
                <span class="info-label">เลขที่:</span>
                <span class="info-value">${invoice.invoiceNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">วันที่:</span>
                <span class="info-value">${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('th-TH') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ครบกำหนด:</span>
                <span class="info-value">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('th-TH') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">อ้างอิง:</span>
                <span class="info-value">${invoice.reference || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">สถานะ:</span>
                <span class="info-value">${statusLabels[invoice.status] || invoice.status}</span>
              </div>
            </div>

            <!-- Right: Customer Info -->
            <div class="info-block">
              <h3>ลูกค้า</h3>
              <div class="customer-name">${invoice.customer?.name || invoice.customerName || '-'}</div>
              <div class="info-row">
                <span class="info-label">เลขผู้เสียภาษี:</span>
                <span class="info-value">${invoice.customer?.taxId || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ที่อยู่:</span>
                <span class="info-value">${customerAddress || '-'}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%">ลำดับ<br>No.</th>
                <th style="width: 40%" class="text-left">รายการ<br>Description</th>
                <th style="width: 10%">จำนวน<br>Qty</th>
                <th style="width: 10%">หน่วย<br>Unit</th>
                <th style="width: 15%">ราคา/หน่วย<br>Price</th>
                <th style="width: 17%">จำนวนเงิน<br>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.length > 0 ? lineItems.map((item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.unit || '-'}</td>
                  <td class="text-right">${(item.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">${(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="text-center" style="padding: 20px;">ไม่มีรายการ</td></tr>'}
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span>มูลค่าก่อน VAT</span>
                <span>${(invoice.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div class="summary-row">
                <span>VAT (7%)</span>
                <span>${(invoice.vatAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              ${invoice.discountAmount > 0 ? `
              <div class="summary-row">
                <span>ส่วนลด</span>
                <span>-${(invoice.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              ` : ''}
              ${invoice.withholdingAmount > 0 ? `
              <div class="summary-row">
                <span>หัก ณ ที่จ่าย</span>
                <span>-${(invoice.withholdingAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              ` : ''}
              <div class="summary-row total">
                <span>ยอดรวมสุทธิ</span>
                <span>${(invoice.netAmount || invoice.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong>หมายเหตุ:</strong> ${invoice.notes}
          </div>
          ` : ''}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                ผู้รับสินค้า / Received by
              </div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ผู้ส่งสินค้า / Delivered by
              </div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ผู้มีอำนาจลงนาม / Authorized
              </div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            เอกสารนี้ออกโดยระบบคอมพิวเตอร์ ใช้เป็นหลักฐานทางบัญชีได้<br>
            This is a computer-generated document for accounting purposes
          </div>

          ${autoPrint ? '<script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>' : ''}
        </body>
        </html>
      `
      
      printWindow.document.write(html)
      printWindow.document.close()
    } catch (error) {
      toast({
        title: 'พิมพ์ไม่สำเร็จ',
        description: error instanceof Error ? error.message : 'กรุณาลองอีกครั้ง',
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
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
              <Button variant="outline" className="h-24 flex-col" onClick={() => openInvoiceForm('DEBIT_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-purple-600" />
                <span>ใบเพิ่มหนี้</span>
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
          <ScrollArea className="w-full">
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
                  <TableHead className="text-center">คอมเมนต์</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetail(invoice.id)}
                  >
                    <TableCell className="font-mono">{invoice.invoiceNo}</TableCell>
                    <TableCell>{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('th-TH') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[invoice.type]}</Badge>
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell className="text-right">฿{(invoice.subtotal ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">฿{(invoice.vatAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">฿{(invoice.totalAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {invoice._count?.comments ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                          <MessageSquare className="h-3 w-3" />
                          {invoice._count.comments}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(invoice.id)
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(invoice.id)
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrint(invoice.id)
                          }}
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
                          className="h-11 w-11"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(invoice.id, invoice.invoiceNo)
                          }}
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
          </ScrollArea>
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
