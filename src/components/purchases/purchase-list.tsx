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
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Label } from '@/components/ui/label'
import { PurchaseForm } from '@/components/purchases/purchase-form'
import { PurchaseEditDialog } from '@/components/purchases/purchase-edit-dialog'
import { PurchaseViewDialog } from '@/components/purchases/purchase-view-dialog'
import { useToast } from '@/hooks/use-toast'
import { getStatusBadgeProps } from '@/lib/status-badge'

interface Purchase {
  id: string
  invoiceNo: string
  vendorInvoiceNo?: string
  invoiceDate: string
  vendorName: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  type: string
  paidAmount: number
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  POSTED: 'ลงบัญชีแล้ว',
  PAID: 'จ่ายแล้ว',
  CANCELLED: 'ยกเลิก',
  ISSUED: 'ออกแล้ว',
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
}

interface PurchaseListProps {
  refreshKey?: number
  onRefresh?: () => void
}

export function PurchaseList({ refreshKey = 0, onRefresh }: PurchaseListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshKeyInternal, setRefreshKeyInternal] = useState(0)
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewPurchaseId, setViewPurchaseId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true)
      setError(null)
      try {
        // Add cache-busting timestamp to prevent stale responses
        const cacheBuster = new Date().getTime()
        const res = await fetch(`/api/purchases?_=${cacheBuster}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Fetch failed')
        const result = await res.json()

        // Handle empty response
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response from server')
        }

        // Check for API error response
        if (!result.success) {
          throw new Error(result.error || 'Failed to load purchases')
        }

        // Check for missing data property
        if (!result.data) {
          console.error('Response missing data property:', result)
          throw new Error('No data received from server')
        }

        // API returns { success: true, data: [...], pagination: {...} }
        const purchasesData = result.data || []
        if (!Array.isArray(purchasesData)) {
          console.error('Unexpected data format:', result)
          console.error('Response type:', typeof result)
          console.error('Has success?', 'success' in result)
          console.error('Has data?', 'data' in result)
          console.error('Data type:', typeof result.data)
          console.error('Data value:', result.data)
          console.error('Is data null?', result.data === null)
          console.error('Is data undefined?', result.data === undefined)
          setPurchases([]) // Set empty array instead of throwing error
          return
        }
        console.log('Successfully loaded', purchasesData.length, 'purchases')
        setPurchases(purchasesData)
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
    fetchPurchases()
  }, [refreshKey + refreshKeyInternal, toast])

  const filteredPurchases = (purchases || []).filter(purchase => {
    if (!purchase || typeof purchase !== 'object') return false

    const matchesSearch = purchase.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          purchase.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          purchase.vendorInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || purchase.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handlePurchaseSuccess = () => {
    setRefreshKeyInternal(prev => prev + 1)
    setIsAddDialogOpen(false)
    onRefresh?.()
  }

  const handleEditPurchaseSuccess = () => {
    setRefreshKeyInternal(prev => prev + 1)
    setIsEditDialogOpen(false)
    setEditPurchaseId(null)
    onRefresh?.()
  }

  const openEditDialog = (purchaseId: string) => {
    setEditPurchaseId(purchaseId)
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (purchaseId: string) => {
    setViewPurchaseId(purchaseId)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async (purchaseId: string) => {
    if (!confirm('ยืนยันที่จะลบใบซื้อนี้?')) return

    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, { credentials: 'include', 
        method: 'DELETE'
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถลบได้')
      }

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบใบซื้อเรียบร้อยแล้ว',
      })
      setRefreshKeyInternal(prev => prev + 1)
      onRefresh?.()
    } catch (error: any) {
      toast({
        title: 'ลบไม่สำเร็จ',
        description: error.message || 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
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
  if (purchases.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ใบซื้อ / ใบสั่งซื้อสินค้า</h1>
            <p className="text-gray-500 mt-1">จัดการใบซื้อ ใบกำกับภาษีจากผู้ขาย</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้างใบซื้อใหม่
          </Button>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูลใบซื้อ</AlertDescription>
        </Alert>
        <PurchaseForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handlePurchaseSuccess}
        />
      </div>
    )
  }

  const safePurchases = purchases || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบซื้อ / ใบสั่งซื้อสินค้า</h1>
          <p className="text-gray-500 mt-1">จัดการใบซื้อ ใบกำกับภาษีจากผู้ขาย</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้างใบซื้อใหม่
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{safePurchases.length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">รอออกใบซื้อ</p>
            <p className="text-2xl font-bold text-yellow-600">{safePurchases.filter(p => p.status === 'DRAFT').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ออกแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{safePurchases.filter(p => p.status === 'ISSUED' || p.status === 'POSTED').length}</p>
            <p className="text-xs text-gray-400">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ยอดรวมทั้งหมด</p>
            <p className="text-2xl font-bold text-purple-600">
              ฿{(safePurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0) / 100).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">บาท</p>
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
                placeholder="ค้นหาตามชื่อผู้ขายหรือเลขที่เอกสาร..."
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
                <SelectItem value="POSTED">ลงบัญชีแล้ว</SelectItem>
                <SelectItem value="PAID">จ่ายแล้ว</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>เลขที่ใบกำกับภาษี</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead className="text-right">มูลค่าก่อน VAT</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead className="text-right">จ่ายแล้ว</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono">{purchase.invoiceNo}</TableCell>
                    <TableCell className="font-mono text-sm">{purchase.vendorInvoiceNo || '-'}</TableCell>
                    <TableCell>
                      {new Date(purchase.invoiceDate).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>{purchase.vendorName}</TableCell>
                    <TableCell className="text-right">฿{((purchase.subtotal ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">฿{((purchase.vatAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold">฿{((purchase.totalAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">฿{((purchase.paidAmount ?? 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      {getStatusBadge(purchase.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={() => openViewDialog(purchase.id)}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        {(purchase.status === 'DRAFT') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => openEditDialog(purchase.id)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => handleDelete(purchase.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
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
      <PurchaseForm
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />

      {editPurchaseId && (
        <PurchaseEditDialog
          purchaseId={editPurchaseId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditPurchaseSuccess}
        />
      )}

      {viewPurchaseId && (
        <PurchaseViewDialog
          purchaseId={viewPurchaseId}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  )
}
