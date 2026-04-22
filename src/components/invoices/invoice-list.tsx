'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Eye, Download, Printer, FileText, Loader2, MessageSquare, Send } from 'lucide-react'
import { eventBus, EVENTS } from '@/lib/events'
import { Card, CardContent } from '@/components/ui/card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { InvoiceEditDialog } from '@/components/invoices/invoice-edit-dialog'
import { useToast } from '@/hooks/use-toast'
import { getStatusBadgeProps } from '@/lib/status-badge'

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  dueDate?: string
  date?: string // Keep for backward compatibility
  customerName: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  paidAmount?: number
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

// Dark pastel status pills
const statusPillClass: Record<string, string> = {
  DRAFT:     'bg-slate-700/50 text-slate-400',
  ISSUED:    'bg-indigo-500/15 text-indigo-400',
  PARTIAL:   'bg-cyan-500/15 text-cyan-400',
  PAID:      'bg-teal-500/15 text-teal-400',
  CANCELLED: 'bg-slate-700/50 text-slate-500',
}

const getStatusBadge = (status: string) => {
  // keep getStatusBadgeProps import alive (used for variant logic elsewhere if needed)
  void getStatusBadgeProps
  const cls = statusPillClass[status] ?? 'bg-slate-700/50 text-slate-400'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

const typeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
  CREDIT_NOTE: 'ใบลดหนี้',
  DEBIT_NOTE: 'ใบเพิ่มหนี้',
}

// Quick filter options
type QuickFilter = 'all' | 'pending' | 'overdue' | 'done'
const quickFilters: { value: QuickFilter; label: string; activeClass: string }[] = [
  { value: 'all',     label: 'ทั้งหมด',      activeClass: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' },
  { value: 'pending', label: 'รอดำเนินการ', activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30' },
  { value: 'overdue', label: 'เร่งด่วน',     activeClass: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30' },
  { value: 'done',    label: 'เสร็จสิ้น',    activeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/40 hover:bg-teal-500/30' },
]

// Compute aging badge for outstanding invoices
function getAgingBadge(invoice: Invoice) {
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') {
    return null
  }
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 0) {
    return { label: `เกิน ${diffDays} วัน`, cls: 'bg-red-500/15 text-red-400' }
  }
  if (diffDays >= -7) {
    return { label: 'ใกล้ครบกำหนด', cls: 'bg-amber-500/15 text-amber-400' }
  }
  return null
}

export function InvoiceList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
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
  const [postingInvoice, setPostingInvoice] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/invoices', { credentials: 'include' })
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()
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
    if (!invoice || typeof invoice !== 'object') return false

    const allowedTypes = ['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE']
    if (!allowedTypes.includes(invoice.type)) return false

    const matchesSearch = invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus

    if (quickFilter !== 'all') {
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diffDays = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : -999
      const aging = diffDays
      if (quickFilter === 'pending') {
        if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false
      } else if (quickFilter === 'overdue') {
        if (aging <= 0 && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') return false
      } else if (quickFilter === 'done') {
        if (invoice.status !== 'PAID') return false
      }
    }

    return matchesSearch && matchesStatus
  })

  const handleInvoiceSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setIsAddDialogOpen(false)
    eventBus.emit(EVENTS.INVOICE_CREATED)
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
    handlePrintInvoice(invoiceId, false)
  }

  const handleViewDetail = (invoiceId: string) => {
    eventBus.emit(EVENTS.INVOICE_VIEW_DETAIL, invoiceId)
  }

  const handlePrint = async (invoiceId: string) => {
    handlePrintInvoice(invoiceId, true)
  }

  const handlePostInvoice = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('ต้องการออกใบกำกับภาษีฉบับนี้หรือไม่? การดำเนินการนี้จะสร้างรายการบัญชีโดยอัตโนมัติ')) return
    setPostingInvoice(invoiceId)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include', 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': '' },
        body: JSON.stringify({ action: 'post' }),
      })
      if (!res.ok) throw new Error('Post failed')
      toast({ title: 'ออกใบกำกับภาษีสำเร็จ', description: 'เอกสารถูกออกเรียบร้อยแล้ว' })
      setRefreshKey(prev => prev + 1)
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถออกใบกำกับภาษีได้', variant: 'destructive' })
    } finally {
      setPostingInvoice(null)
    }
  }

  const handlePrintInvoice = async (invoiceId: string, autoPrint: boolean = true) => {
    setPrintingInvoice(invoiceId)
    try {
      const [invoiceRes, companyRes] = await Promise.all([
        fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' }),
        fetch(`/api/company`, { credentials: 'include' })
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

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: 'ไม่สามารถเปิดหน้าต่างได้',
          description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
          variant: 'destructive'
        })
        return
      }

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

      const companyAddressParts = [
        company?.address,
        company?.subDistrict,
        company?.district,
        company?.province,
        company?.postalCode
      ].filter(Boolean)
      const companyAddress = companyAddressParts.join(' ')

      const customerAddressParts = [
        invoice.customer?.address,
        invoice.customer?.subDistrict,
        invoice.customer?.district,
        invoice.customer?.province,
        invoice.customer?.postalCode
      ].filter(Boolean)
      const customerAddress = customerAddressParts.join(' ')

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
            .info-grid {
              display: flex;
              gap: 30px;
              margin-bottom: 25px;
            }
            .info-block { flex: 1; }
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
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
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
            .summary-row:last-child { border-bottom: none; }
            .summary-row.total {
              font-weight: 700;
              font-size: 14px;
              color: #d32f2f;
              border-top: 2px solid #333;
              border-bottom: none;
              margin-top: 8px;
              padding-top: 10px;
            }
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
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            @media print {
              body { padding: 0; font-size: 11px; }
              .no-print { display: none !important; }
              .items-table th { background: #424242 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
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

          <div class="doc-title">
            <h1>${typeLabels[invoice.type] || invoice.type}</h1>
            <span class="original-copy">ต้นฉบับ / ORIGINAL</span>
          </div>

          <div class="info-grid">
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

          ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong>หมายเหตุ:</strong> ${invoice.notes}
          </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">ผู้รับสินค้า / Received by</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">ผู้ส่งสินค้า / Delivered by</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">ผู้มีอำนาจลงนาม / Authorized</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
          </div>

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
      const response = await fetch(`/api/invoices/${invoiceId}/export/pdf`, { credentials: 'include' })
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

      toast({ title: 'ดาวน์โหลดสำเร็จ', description: `ดาวน์โหลด ${invoiceNo} เรียบร้อยแล้ว` })
    } catch (error) {
      toast({ title: 'ดาวน์โหลดไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง', variant: 'destructive' })
    } finally {
      setDownloadingInvoice(null)
    }
  }

  // ── Loading UI ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2 bg-slate-700/50" />
            <Skeleton className="h-5 w-80 bg-slate-700/30" />
          </div>
          <Skeleton className="h-10 w-40 bg-slate-700/50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <Skeleton className="h-16 w-full bg-slate-700/40" />
            </div>
          ))}
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <Skeleton className="h-12 w-full mb-4 bg-slate-700/40" />
          <Skeleton className="h-64 w-full bg-slate-700/40" />
        </div>
      </div>
    )
  }

  // ── Error UI ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // ── Empty UI ────────────────────────────────────────────────────────────────
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">ใบกำกับภาษี / เอกสารการขาย</h1>
            <p className="text-slate-400 mt-1">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                สร้างเอกสารใหม่
              </Button>
            </DialogTrigger>
          </Dialog>
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
      </div>
    )
  }

  const safeInvoices = invoices || []

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">ใบกำกับภาษี / เอกสารการขาย</h1>
          <p className="text-slate-400 mt-1">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/40">
              <Plus className="h-4 w-4 mr-2" />
              สร้างเอกสารใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-slate-100">สร้างเอกสารใหม่</DialogTitle>
              <DialogDescription className="text-slate-400">
                เลือกประเภทเอกสารที่ต้องการสร้าง
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
              <Button variant="outline" className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60" onClick={() => openInvoiceForm('TAX_INVOICE')}>
                <FileText className="h-8 w-8 mb-2 text-indigo-400" />
                <span>ใบกำกับภาษี</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60" onClick={() => openInvoiceForm('RECEIPT')}>
                <FileText className="h-8 w-8 mb-2 text-teal-400" />
                <span>ใบเสร็จรับเงิน</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60" onClick={() => openInvoiceForm('DELIVERY_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-amber-400" />
                <span>ใบส่งของ</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60" onClick={() => openInvoiceForm('CREDIT_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-red-400" />
                <span>ใบลดหนี้</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60" onClick={() => openInvoiceForm('DEBIT_NOTE')}>
                <FileText className="h-8 w-8 mb-2 text-purple-400" />
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
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-400">รอออกใบกำกับภาษี</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{invoices.filter(i => i.status === 'DRAFT').length}</p>
          <p className="text-xs text-slate-500 mt-0.5">รายการ</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-400">รอรับชำระ</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{invoices.filter(i => i.status === 'ISSUED' || i.status === 'PARTIAL').length}</p>
          <p className="text-xs text-slate-500 mt-0.5">รายการ</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-400">รับชำระแล้ว (เดือนนี้)</p>
          <p className="text-2xl font-bold text-teal-400 mt-1">
            ฿{(safeInvoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').reduce((sum, i) => sum + (i.paidAmount || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{safeInvoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').length} รายการ</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-400">ภาษีขายรวม</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            ฿{(safeInvoices.reduce((sum, i) => sum + (i.vatAmount || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">เดือนนี้</p>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {quickFilters.map(qf => (
          <button
            key={qf.value}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              quickFilter === qf.value
                ? qf.activeClass
                : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
            onClick={() => setQuickFilter(qf.value)}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="ค้นหาตามชื่อลูกค้าหรือเลขที่เอกสาร..."
              className="pl-10 bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-900/60 border-slate-700 text-slate-200 focus:ring-indigo-500/50">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="DRAFT">ร่าง</SelectItem>
              <SelectItem value="ISSUED">ออกแล้ว</SelectItem>
              <SelectItem value="PARTIAL">รับชำระบางส่วน</SelectItem>
              <SelectItem value="PAID">รับชำระเต็มจำนวน</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-left">เลขที่</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-left">วันที่</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-left">ประเภท</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-left">ลูกค้า</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-right">ยอดค้างรับ</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-right">ยอดรวม</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-left">สถานะ</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-center">คอมเมนต์</th>
                <th className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900">
              {filteredInvoices.map((invoice) => {
                const outstanding = Math.max(0, (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0))
                const agingBadge = getAgingBadge(invoice)
                return (
                  <tr
                    key={invoice.id}
                    className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(invoice.id)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-200 text-xs">{invoice.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-300">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('th-TH') : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                        {typeLabels[invoice.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{invoice.customerName}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={outstanding > 0 ? 'font-semibold text-red-400' : 'text-teal-400'}>
                        ฿{outstanding.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-200">
                      ฿{(invoice.totalAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(invoice.status)}
                        {agingBadge && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${agingBadge.cls}`}>
                            {agingBadge.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {invoice._count?.comments ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-300">
                          <MessageSquare className="h-3 w-3" />
                          {invoice._count.comments}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {invoice.status === 'DRAFT' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={(e) => handlePostInvoice(invoice.id, e)}
                            disabled={postingInvoice === invoice.id}
                          >
                            {postingInvoice === invoice.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            ออก
                          </Button>
                        )}
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleView(invoice.id) }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(invoice.id) }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors disabled:opacity-40"
                          onClick={(e) => { e.stopPropagation(); handlePrint(invoice.id) }}
                          disabled={printingInvoice === invoice.id}
                        >
                          {printingInvoice === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-40"
                          onClick={(e) => { e.stopPropagation(); handleDownload(invoice.id, invoice.invoiceNo) }}
                          disabled={downloadingInvoice === invoice.id}
                        >
                          {downloadingInvoice === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>

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
