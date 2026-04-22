'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Eye,
  Printer,
  FileText,
  Loader2,
  Package,
  CheckCircle2,
  ClipboardCheck,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getStatusBadgeProps } from '@/lib/status-badge'

interface GoodsReceiptNote {
  id: string
  grnNo: string
  grnDate: string
  purchaseOrderNo?: string
  vendorName: string
  status: 'RECEIVED' | 'INSPECTED' | 'POSTED'
  itemCount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  RECEIVED: 'รับแล้ว',
  INSPECTED: 'ตรวจสอบแล้ว',
  POSTED: 'ลงบัญชีแล้ว',
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const config = getStatusBadgeProps(status)
  return <Badge variant={config.variant}>{statusLabels[status] || config.label}</Badge>
}

// Quick filter options
type QuickFilter = 'all' | 'pending' | 'inspected' | 'posted'
const quickFilters: { value: QuickFilter; label: string; activeClass: string }[] = [
  { value: 'all', label: 'ทั้งหมด', activeClass: 'bg-blue-600 text-white hover:bg-blue-700' },
  { value: 'pending', label: 'รอตรวจสอบ', activeClass: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  { value: 'inspected', label: 'ตรวจสอบแล้ว', activeClass: 'bg-green-500 text-white hover:bg-green-600' },
  { value: 'posted', label: 'ลงบัญชีแล้ว', activeClass: 'bg-purple-500 text-white hover:bg-purple-600' },
]

export function GoodsReceiptNotesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postingGrn, setPostingGrn] = useState<string | null>(null)
  const [printingGrn, setPrintingGrn] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGrns = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/goods-receipt-notes`, { credentials: 'include' })
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()
        // API returns { success: true, data: [...], pagination: {...} }
        const grnsData = result.data || []
        if (!Array.isArray(grnsData)) {
          throw new Error('Invalid GRN data format')
        }
        setGrns(grnsData)
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
    fetchGrns()
  }, [toast])

  const filteredGrns = (grns || []).filter(grn => {
    // Safety check - ensure grn is an object and has required properties
    if (!grn || typeof grn !== 'object') return false

    const matchesSearch = grn.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          grn.grnNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          grn.purchaseOrderNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || grn.status === filterStatus

    // Quick filter logic
    if (quickFilter !== 'all') {
      if (quickFilter === 'pending') {
        if (grn.status !== 'RECEIVED') return false
      } else if (quickFilter === 'inspected') {
        if (grn.status !== 'INSPECTED') return false
      } else if (quickFilter === 'posted') {
        if (grn.status !== 'POSTED') return false
      }
    }

    return matchesSearch && matchesStatus
  })

  const handlePostGrn = async (grnId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('ต้องการลงบัญชีใบรับสินค้าฉบับนี้หรือไม่? การดำเนินการนี้จะสร้างรายการบัญชีโดยอัตโนมัติ')) return
    setPostingGrn(grnId)
    try {
      const res = await fetch(`/api/goods-receipt-notes/${grnId}`, { credentials: 'include', 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': '' },
        body: JSON.stringify({ action: 'post' }),
      })
      if (!res.ok) throw new Error('Post failed')
      toast({ title: 'ลงบัญชีสำเร็จ', description: 'เอกสารถูกลงบัญชีเรียบร้อยแล้ว' })
      // Refresh the list
      setGrns(prev => prev.map(grn =>
        grn.id === grnId ? { ...grn, status: 'POSTED' } : grn
      ))
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลงบัญชีได้', variant: 'destructive' })
    } finally {
      setPostingGrn(null)
    }
  }

  const handleInspectGrn = async (grnId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPostingGrn(grnId)
    try {
      const res = await fetch(`/api/goods-receipt-notes/${grnId}`, { credentials: 'include', 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': '' },
        body: JSON.stringify({ action: 'inspect' }),
      })
      if (!res.ok) throw new Error('Inspect failed')
      toast({ title: 'ตรวจสอบสำเร็จ', description: 'เอกสารถูกตรวจสอบเรียบร้อยแล้ว' })
      // Refresh the list
      setGrns(prev => prev.map(grn =>
        grn.id === grnId ? { ...grn, status: 'INSPECTED' } : grn
      ))
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถตรวจสอบได้', variant: 'destructive' })
    } finally {
      setPostingGrn(null)
    }
  }

  const handleView = (grnId: string) => {
    // Client-side view - open print window for viewing
    handlePrintGrn(grnId, false)
  }

  const handlePrint = async (grnId: string) => {
    handlePrintGrn(grnId, true)
  }

  const handlePrintGrn = async (grnId: string, autoPrint: boolean = true) => {
    setPrintingGrn(grnId)
    try {
      // Fetch GRN details and company info
      const [grnRes, companyRes] = await Promise.all([
        fetch(`/api/goods-receipt-notes/${grnId}`, { credentials: 'include' }),
        fetch(`/api/company`, { credentials: 'include' })
      ])

      if (!grnRes.ok) throw new Error('Fetch failed')
      const result = await grnRes.json()
      const grn = result.data

      interface CompanyInfo {
        name?: string
        address?: string
        subDistrict?: string
        district?: string
        province?: string
        postalCode?: string
        taxId?: string
        phone?: string
        email?: string
      }

      let company: CompanyInfo | null = null
      if (companyRes.ok) {
        const companyResult = await companyRes.json()
        company = companyResult.data as CompanyInfo | null
      }

      if (!grn) {
        throw new Error('GRN not found')
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

      const statusLabels: Record<string, string> = {
        RECEIVED: 'รับแล้ว',
        INSPECTED: 'ตรวจสอบแล้ว',
        POSTED: 'ลงบัญชีแล้ว',
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

      // Get items from grn.items (API returns 'items')
      const lineItems = grn.items || []

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${grn.grnNo}</title>
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
            .doc-title .doc-no {
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
            .vendor-name {
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
          </div>

          <!-- Document Title -->
          <div class="doc-title">
            <h1>ใบรับสินค้า (Goods Receipt Note)</h1>
            <span class="doc-no">ต้นฉบับ / ORIGINAL</span>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Left: GRN Details -->
            <div class="info-block">
              <h3>รายละเอียดเอกสาร</h3>
              <div class="info-row">
                <span class="info-label">เลขที่:</span>
                <span class="info-value">${grn.grnNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">วันที่รับ:</span>
                <span class="info-value">${grn.grnDate ? new Date(grn.grnDate).toLocaleDateString('th-TH') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">เลขที่ PO:</span>
                <span class="info-value">${grn.purchaseOrderNo || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">สถานะ:</span>
                <span class="info-value">${statusLabels[grn.status] || grn.status}</span>
              </div>
            </div>

            <!-- Right: Vendor Info -->
            <div class="info-block">
              <h3>ผู้ขาย</h3>
              <div class="vendor-name">${grn.vendor?.name || grn.vendorName || '-'}</div>
              <div class="info-row">
                <span class="info-label">เลขผู้เสียภาษี:</span>
                <span class="info-value">${grn.vendor?.taxId || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ที่อยู่:</span>
                <span class="info-value">${grn.vendor?.address || '-'}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%">ลำดับ<br>No.</th>
                <th style="width: 45%" class="text-left">รายการ<br>Description</th>
                <th style="width: 12%">รับ<br>Received</th>
                <th style="width: 12%">สั่งซื้อ<br>Ordered</th>
                <th style="width: 10%">หน่วย<br>Unit</th>
                <th style="width: 13%">หมายเหตุ<br>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.length > 0 ? lineItems.map((item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>
                    <div class="font-semibold">${item.product?.code || ''}</div>
                    <div>${item.product?.name || item.description || ''}</div>
                  </td>
                  <td class="text-center">${item.quantityReceived}</td>
                  <td class="text-center">${item.quantityOrdered}</td>
                  <td class="text-center">${item.unit || '-'}</td>
                  <td class="text-center">${item.remark || '-'}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="text-center" style="padding: 20px;">ไม่มีรายการ</td></tr>'}
            </tbody>
          </table>

          <!-- Notes -->
          ${grn.notes ? `
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong>หมายเหตุ:</strong> ${grn.notes}
          </div>
          ` : ''}

          <!-- Signature Section -->
          <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 30px;">
            <div style="width: 150px; text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 40px; font-size: 11px;">
                ผู้ส่งสินค้า / Delivered by
              </div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">วันที่ / Date: _________</div>
            </div>
            <div style="width: 150px; text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 40px; font-size: 11px;">
                ผู้รับสินค้า / Received by
              </div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">วันที่ / Date: _________</div>
            </div>
            <div style="width: 150px; text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 40px; font-size: 11px;">
                ผู้ตรวจสอบ / Verified by
              </div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">วันที่ / Date: _________</div>
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
      setPrintingGrn(null)
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
  if (grns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบรับสินค้า (GRN)</h1>
            <p className="text-gray-500 mt-1">จัดการใบรับสินค้าจากผู้ขาย</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            สร้าง GRN ใหม่
          </Button>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูลใบรับสินค้า</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Ensure grns is an array for safe operations
  const safeGrns = grns || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบรับสินค้า (GRN)</h1>
          <p className="text-gray-500 mt-1">จัดการใบรับสินค้าจากผู้ขายและตรวจสอบคุณภาพ</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          สร้าง GRN ใหม่
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รอตรวจสอบ</p>
            <p className="text-2xl font-bold text-yellow-600">{grns.filter(g => g.status === 'RECEIVED').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ตรวจสอบแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{grns.filter(g => g.status === 'INSPECTED').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ลงบัญชีแล้ว</p>
            <p className="text-2xl font-bold text-purple-600">{grns.filter(g => g.status === 'POSTED').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รวมทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{grns.length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {quickFilters.map(qf => (
          <Button
            key={qf.value}
            variant="outline"
            size="sm"
            className={`rounded-full px-4 text-sm font-medium transition-colors ${
              quickFilter === qf.value
                ? qf.activeClass
                : 'bg-white dark:bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setQuickFilter(qf.value)}
          >
            {qf.label}
          </Button>
        ))}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาตามชื่อผู้ขาย เลขที่ GRN หรือเลขที่ PO..."
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
                <SelectItem value="RECEIVED">รับแล้ว</SelectItem>
                <SelectItem value="INSPECTED">ตรวจสอบแล้ว</SelectItem>
                <SelectItem value="POSTED">ลงบัญชีแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่ GRN</TableHead>
                  <TableHead>วันที่รับ</TableHead>
                  <TableHead>เลขที่ PO</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead className="text-center">รายการ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrns.map((grn) => (
                  <TableRow
                    key={grn.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-mono">{grn.grnNo}</TableCell>
                    <TableCell>{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString('th-TH') : '-'}</TableCell>
                    <TableCell className="font-mono">{grn.purchaseOrderNo || '-'}</TableCell>
                    <TableCell>{grn.vendorName}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-3 w-3 text-gray-500" />
                        <span className="text-sm">{grn.itemCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(grn.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1 flex-wrap">
                        {grn.status === 'RECEIVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                            onClick={(e) => handleInspectGrn(grn.id, e)}
                            disabled={postingGrn === grn.id}
                          >
                            {postingGrn === grn.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ClipboardCheck className="h-3 w-3 mr-1" />
                            )}
                            ตรวจสอบ
                          </Button>
                        )}
                        {grn.status === 'INSPECTED' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-2 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={(e) => handlePostGrn(grn.id, e)}
                            disabled={postingGrn === grn.id}
                          >
                            {postingGrn === grn.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            ลงบัญชี
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(grn.id)
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrint(grn.id)
                          }}
                          disabled={printingGrn === grn.id}
                        >
                          {printingGrn === grn.id ? (
                            <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4 text-green-600" />
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
    </div>
  )
}
