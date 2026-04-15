'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { VendorEditDialog } from './vendor-edit-dialog'

interface Vendor {
  id: string
  code: string
  name: string
  taxId: string
  phone: string
  email: string
  province: string
  creditDays: number
  balance: number
  status: string
}

export function VendorList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  // New vendor form state
  const [newVendor, setNewVendor] = useState({
    code: '',
    name: '',
    taxId: '',
    phone: '',
    email: '',
    creditDays: 30,
    address: ''
  })

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, id: string, name: string }>({
    open: false,
    id: '',
    name: ''
  })

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{ open: boolean; vendor: Vendor | null }>({
    open: false,
    vendor: null
  })

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/vendors')
        if (!res.ok) throw new Error('Fetch failed')
        const json = await res.json()
        setVendors(json.data || json)
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
    fetchVendors()
  }, [toast, refreshKey])

  const filteredVendors = (vendors || []).filter(vendor => {
    // Safety check - ensure vendor is an object and has required properties
    if (!vendor || typeof vendor !== 'object') return false

    return vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vendor.code?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalBalance = (vendors || []).reduce((sum, v) => sum + (v?.balance || 0), 0)

  // Handle form field changes
  const handleNewVendorChange = (field: string, value: any) => {
    setNewVendor(prev => ({ ...prev, [field]: value }))
  }

  // Handle add vendor
  const handleAddVendor = async () => {
    // Validation
    if (!newVendor.code.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุรหัสผู้ขาย",
        variant: "destructive"
      })
      return
    }

    if (!newVendor.name.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุชื่อผู้ขาย",
        variant: "destructive"
      })
      return
    }

    // Tax ID validation (13 digits if provided)
    if (newVendor.taxId && newVendor.taxId.length !== 13) {
      toast({
        title: "ข้อผิดพลาด",
        description: "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก",
        variant: "destructive"
      })
      return
    }

    // Email validation
    if (newVendor.email && newVendor.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVendor.email)) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รูปแบบอีเมลไม่ถูกต้อง",
        variant: "destructive"
      })
      return
    }

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVendor,
          creditDays: Number(newVendor.creditDays)
        })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'บันทึกไม่สำเร็จ')
      }

      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มผู้ขายใหม่เรียบร้อยแล้ว"
      })

      setIsAddDialogOpen(false)
      // Reset form
      setNewVendor({
        code: '',
        name: '',
        taxId: '',
        phone: '',
        email: '',
        creditDays: 30,
        address: ''
      })
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: "destructive"
      })
    }
  }

  // Handle delete vendor
  const handleDeleteVendor = async () => {
    if (!deleteDialog?.id) return

    try {
      const res = await fetch(`/api/vendors/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'ลบไม่สำเร็จ')
      }

      toast({
        title: "ลบสำเร็จ",
        description: "ลบผู้ขายเรียบร้อยแล้ว"
      })

      setDeleteDialog({ open: false, id: '', name: '' })
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast({
        title: "ลบไม่สำเร็จ",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: "destructive"
      })
    }
  }

  // Open delete dialog
  const openDeleteDialog = (vendor: Vendor) => {
    if (!vendor?.id) return
    setDeleteDialog({
      open: true,
      id: vendor.id,
      name: vendor.name || 'ไม่ระบุชื่อ'
    })
  }

  // Open edit dialog
  const openEditDialog = (vendor: Vendor) => {
    if (!vendor?.id) return
    setEditDialog({
      open: true,
      vendor: vendor
    })
  }

  // Reset form when dialog opens
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (open) {
      setNewVendor({
        code: '',
        name: '',
        taxId: '',
        phone: '',
        email: '',
        creditDays: 30,
        address: ''
      })
    }
  }

  // Loading UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
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
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Empty UI
  if (!vendors || vendors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">เจ้าหนี้การค้า</h1>
            <p className="text-gray-500 mt-1">จัดการข้อมูลผู้ขายและเจ้าหนี้</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผู้ขาย
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        <Alert>
          <AlertDescription>ไม่พบข้อมูล</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบผู้ขาย &quot;{deleteDialog.name || 'ไม่ระบุชื่อ'}&quot; ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: '', name: '' })}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVendor} className="bg-red-600 hover:bg-red-700">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">เจ้าหนี้การค้า</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลผู้ขายและเจ้าหนี้</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มผู้ขาย
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ขายใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลผู้ขายใหม่ตามแบบฟอร์มด้านล่าง
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-code" className="text-right">รหัสผู้ขาย</Label>
                <Input
                  id="vendor-code"
                  className="col-span-3"
                  placeholder="V005"
                  value={newVendor.code}
                  onChange={(e) => handleNewVendorChange('code', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-name" className="text-right">ชื่อผู้ขาย <span className="text-red-500">*</span></Label>
                <Input
                  id="vendor-name"
                  className="col-span-3"
                  placeholder="ชื่อบริษัท/ห้างหุ้นส่วน"
                  value={newVendor.name}
                  onChange={(e) => handleNewVendorChange('name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-taxId" className="text-right">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="vendor-taxId"
                  className="col-span-3"
                  placeholder="0105556000000"
                  maxLength={13}
                  value={newVendor.taxId}
                  onChange={(e) => handleNewVendorChange('taxId', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-phone" className="text-right">โทรศัพท์</Label>
                <Input
                  id="vendor-phone"
                  className="col-span-3"
                  placeholder="02-000-0000"
                  value={newVendor.phone}
                  onChange={(e) => handleNewVendorChange('phone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-email" className="text-right">อีเมล</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  className="col-span-3"
                  placeholder="email@company.co.th"
                  value={newVendor.email}
                  onChange={(e) => handleNewVendorChange('email', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-creditDays" className="text-right">เครดิต (วัน)</Label>
                <Input
                  id="vendor-creditDays"
                  className="col-span-3"
                  type="number"
                  placeholder="30"
                  min="0"
                  value={newVendor.creditDays}
                  onChange={(e) => handleNewVendorChange('creditDays', Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor-address" className="text-right">ที่อยู่</Label>
                <Input
                  id="vendor-address"
                  className="col-span-3"
                  placeholder="ที่อยู่"
                  value={newVendor.address}
                  onChange={(e) => handleNewVendorChange('address', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleAddVendor}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">จำนวนผู้ขาย</p>
            <p className="text-2xl font-bold text-gray-800">{vendors?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">เจ้าหนี้รวม</p>
            <p className="text-2xl font-bold text-orange-600">฿{totalBalance?.toLocaleString() ?? '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ผู้ขายที่ใช้งาน</p>
            <p className="text-2xl font-bold text-green-600">{(vendors || []).filter(v => v?.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="ค้นหาผู้ขาย..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อผู้ขาย</TableHead>
                  <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                  <TableHead>ติดต่อ</TableHead>
                  <TableHead className="text-center">เครดิต</TableHead>
                  <TableHead className="text-right">ยอดคงเหลือ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-mono">{vendor.code}</TableCell>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="font-mono text-sm">{vendor.taxId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {vendor.phone}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{vendor.creditDays} วัน</TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">฿{vendor?.balance?.toLocaleString() ?? '0'}</TableCell>
                    <TableCell>
                      <Badge className={vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {vendor.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={() => openDeleteDialog(vendor)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* Edit Dialog */}
      <VendorEditDialog
        vendor={editDialog.vendor}
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, vendor: null })}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  )
}
