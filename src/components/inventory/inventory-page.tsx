'use client'

// ============================================
// 📦 Inventory Management Page (TAS 2 Compliant)
// Agent 03: Inventory Engineer
// Tabs: Stock Balance | Movements | Warehouses | Stock Transfers
// ============================================

import { useState, useEffect, useCallback } from 'react'
import {
  Package, Warehouse, ArrowLeftRight, TrendingDown, TrendingUp,
  Plus, RefreshCw, Search, ChevronDown, Filter, ArrowRight,
  Edit, Trash2, MoreHorizontal, Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { WarehouseEditDialog } from './warehouse-edit-dialog'
import { StockAdjustmentDialog } from './stock-adjustment-dialog'
import { StockMovementEditDialog } from './stock-movement-edit-dialog'
import { StockTransferCompleteDialog } from './stock-transfer-complete-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockBalance {
  id: string
  product: { id: string; code: string; name: string; unit: string }
  warehouse: { id: string; code: string; name: string }
  quantity: number
  unitCost: number
  totalCost: number
}

interface StockMovement {
  id: string
  product: { code: string; name: string }
  warehouse: { code: string; name: string }
  type: string
  quantity: number
  unitCost: number
  totalCost: number
  date: string
  referenceNo: string | null
  notes: string | null
}

interface WarehouseItem {
  id: string
  code: string
  name: string
  type: string
  location: string | null
  isActive: boolean
}

interface StockTransfer {
  transferNo: string
  date: string
  productId: string
  product: { code: string; name: string }
  fromWarehouse: { code: string; name: string }
  toWarehouse: { code: string; name: string }
  quantity: number
  status: string
  notes: string | null
}

// ─── Movement type label/color ─────────────────────────────────────────────

const MOVEMENT_TYPES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  RECEIVE: { label: 'รับสินค้า', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  ISSUE: { label: 'เบิกสินค้า', color: 'bg-red-100 text-red-700', icon: TrendingDown },
  TRANSFER_IN: { label: 'โอนเข้า', color: 'bg-blue-100 text-blue-700', icon: ArrowLeftRight },
  TRANSFER_OUT: { label: 'โอนออก', color: 'bg-orange-100 text-orange-700', icon: ArrowLeftRight },
  ADJUST: { label: 'ปรับปรุง', color: 'bg-purple-100 text-purple-700', icon: RefreshCw },
  COUNT: { label: 'นับสต็อก', color: 'bg-gray-100 text-gray-700', icon: Package },
}

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'short' })

// ─── Stock Balance Tab ─────────────────────────────────────────────────────

function StockBalanceTab() {
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalProducts: 0, totalQty: 0, totalValue: 0 })
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [showAdjust, setShowAdjust] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<StockBalance | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [res, whRes] = await Promise.all([
        window.fetch(`/api/stock-balances`, { credentials: 'include' }).then(r => r.json()),
        window.fetch(`/api/warehouses`, { credentials: 'include' }).then(r => r.json()),
      ])
      if (res.success) {
        setBalances(res.data.balances || [])
        setSummary(res.data.summary || {})
      }
      if (whRes.success) {
        setWarehouses(whRes.data)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleAdjust = (balance: StockBalance) => {
    setSelectedBalance(balance)
    setShowAdjust(true)
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">รายการสินค้า</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">จำนวนรวม</p>
            <p className="text-2xl font-bold text-teal-600">{fc(summary.totalQty)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">มูลค่าสินค้าคงเหลือ (WAC)</p>
            <p className="text-2xl font-bold text-purple-600">฿{fc(summary.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            ยอดคงเหลือสินค้า
            <Button size="sm" variant="ghost" onClick={fetch}><RefreshCw className="h-3 w-3" /></Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>คลัง</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ต้นทุน/หน่วย (WAC)</TableHead>
                  <TableHead className="text-right">มูลค่ารวม</TableHead>
                  <TableHead className="text-right">ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">ยังไม่มีข้อมูลสินค้าคงเหลือ</TableCell></TableRow>
                ) : balances.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.product.code}</TableCell>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{b.warehouse.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fc(b.quantity)}</TableCell>
                    <TableCell className="text-right">฿{fc(b.unitCost)}</TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">฿{fc(b.totalCost)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAdjust(b)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <StockAdjustmentDialog
        open={showAdjust}
        onOpenChange={setShowAdjust}
        balance={selectedBalance}
        warehouses={warehouses}
        onSuccess={fetch}
      />
    </div>
  )
}

// ─── Stock Movements Tab ───────────────────────────────────────────────────

function StockMovementsTab() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [products, setProducts] = useState<{ id: string; code: string; name: string }[]>([])
  const [formData, setFormData] = useState({ productId: '', warehouseId: '', type: 'RECEIVE', quantity: '', unitCost: '', notes: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = typeFilter !== 'ALL' ? `?type=${typeFilter}` : ''
      const [movRes, whRes, prodRes] = await Promise.all([
        window.fetch(`/api/stock-movements${params}`, { credentials: 'include' }).then(r => r.json()),
        window.fetch(`/api/warehouses`, { credentials: 'include' }).then(r => r.json()),
        window.fetch(`/api/products`, { credentials: 'include' }).then(r => r.json()),
      ])
      if (movRes.success) setMovements(movRes.data)
      if (whRes.success) setWarehouses(whRes.data)
      if (prodRes.success) setProducts(prodRes.data)
    } finally { setLoading(false) }
  }, [typeFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleViewMovement = async (movementId: string) => {
    try {
      const res = await window.fetch(`/api/stock-movements/${movementId}`, { credentials: 'include' }).then(r => r.json())
      if (res.success) {
        setSelectedMovement(res.data)
        setShowEdit(true)
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลการเคลื่อนไหวได้',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async () => {
    const res = await window.fetch(`/api/stock-movements`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, quantity: parseFloat(formData.quantity), unitCost: parseFloat(formData.unitCost) }),
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'บันทึกสำเร็จ', description: 'บันทึกการเคลื่อนไหวสินค้าแล้ว' })
      setShowAdd(false)
      setFormData({ productId: '', warehouseId: '', type: 'RECEIVE', quantity: '', unitCost: '', notes: '' })
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'RECEIVE', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${typeFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {t === 'ALL' ? 'ทั้งหมด' : MOVEMENT_TYPES[t]?.label || t}
            </button>
          ))}
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />บันทึกการเคลื่อนไหว
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>บันทึกการเคลื่อนไหวสินค้า</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>สินค้า</Label>
                <Select value={formData.productId} onValueChange={v => setFormData(p => ({ ...p, productId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>คลังสินค้า</Label>
                <Select value={formData.warehouseId} onValueChange={v => setFormData(p => ({ ...p, warehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกคลัง" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ประเภท</Label>
                <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVE">รับสินค้า (IN)</SelectItem>
                    <SelectItem value="ISSUE">เบิกสินค้า (OUT)</SelectItem>
                    <SelectItem value="ADJUST">ปรับปรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>จำนวน</Label>
                  <Input type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div>
                  <Label>ต้นทุน/หน่วย (฿)</Label>
                  <Input type="number" value={formData.unitCost} onChange={e => setFormData(p => ({ ...p, unitCost: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Input value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>คลัง</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                  <TableHead>อ้างอิง</TableHead>
                  <TableHead className="text-right">ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">ยังไม่มีการเคลื่อนไหว</TableCell></TableRow>
                ) : movements.map(m => {
                  const mt = MOVEMENT_TYPES[m.type] || { label: m.type, color: 'bg-gray-100 text-gray-700', icon: Package }
                  const isOut = ['ISSUE', 'TRANSFER_OUT'].includes(m.type)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{fd(m.date)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mt.color}`}>{mt.label}</span>
                      </TableCell>
                      <TableCell className="text-sm">{m.product.code} — {m.product.name}</TableCell>
                      <TableCell className="text-sm">{m.warehouse.name}</TableCell>
                      <TableCell className={`text-right font-semibold ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                        {isOut ? '-' : '+'}{fc(Math.abs(m.quantity))}
                      </TableCell>
                      <TableCell className="text-right text-sm">฿{fc(m.unitCost)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{fc(m.totalCost)}</TableCell>
                      <TableCell className="text-xs text-gray-400">{m.referenceNo || m.notes || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewMovement(m.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <StockMovementEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        movement={selectedMovement}
        onSuccess={fetchAll}
      />
    </div>
  )
}

// ─── Warehouses Tab ────────────────────────────────────────────────────────

function WarehousesTab() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null)
  const { toast } = useToast()

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.fetch(`/api/warehouses`, { credentials: 'include' }).then(r => r.json())
      if (res.success) setWarehouses(res.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleEdit = (warehouse: WarehouseItem) => {
    setSelectedWarehouse(warehouse)
    setShowEdit(true)
  }

  const handleDelete = async (warehouse: WarehouseItem) => {
    if (!confirm(`ยืนยันที่จะลบคลัง "${warehouse.name}"?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return
    }

    try {
      const res = await window.fetch(`/api/warehouses/${warehouse.id}`, { credentials: 'include', 
        method: 'DELETE',
      }).then(r => r.json())

      if (res.success) {
        toast({
          title: 'ลบคลังสำเร็จ',
          description: `คลัง ${warehouse.name} ถูกลบเรียบร้อยแล้ว`
        })
        fetch()
      } else {
        toast({
          title: 'ไม่สามารถลบได้',
          description: res.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        variant: 'destructive'
      })
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setSelectedWarehouse(null)
            setShowEdit(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />เพิ่มคลังใหม่
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map(w => (
          <Card key={w.id} className={`border ${!w.isActive ? 'opacity-50' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-400">{w.code}</p>
                  <p className="font-semibold text-gray-800">{w.name}</p>
                  {w.location && <p className="text-xs text-gray-500 mt-1">📍 {w.location}</p>}
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">{w.type}</Badge>
                    {!w.isActive && <Badge variant="secondary" className="text-xs">ไม่ใช้งาน</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(w)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(w)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีคลังสินค้า กด &quot;เพิ่มคลังใหม่&quot; เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      <WarehouseEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        warehouse={selectedWarehouse}
        onSuccess={fetch}
      />
    </div>
  )
}

// ─── Stock Transfers Tab ────────────────────────────────────────────────────

function StockTransfersTab() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [products, setProducts] = useState<{ id: string; code: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [transRes, whRes, prodRes] = await Promise.all([
        window.fetch(`/api/stock/transfers`, { credentials: 'include' }).then(r => r.json()),
        window.fetch(`/api/warehouses`, { credentials: 'include' }).then(r => r.json()),
        window.fetch(`/api/products`, { credentials: 'include' }).then(r => r.json()),
      ])
      if (transRes.success) setTransfers(transRes.data)
      if (whRes.success) setWarehouses(whRes.data)
      if (prodRes.success) setProducts(prodRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCompleteTransfer = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer)
    setShowComplete(true)
  }

  const handleSubmit = async () => {
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast({ title: 'ข้อผิดพลาด', description: 'คลังต้นทางและคลังปลายทางต้องไม่ใช่คลังเดียวกัน', variant: 'destructive' })
      return
    }

    const res = await window.fetch(`/api/stock/transfers`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        quantity: parseFloat(formData.quantity),
        date: new Date(formData.date).toISOString(),
      }),
    }).then(r => r.json())

    if (res.success) {
      toast({
        title: 'โอนสต็อกสำเร็จ',
        description: `โอนสินค้าเลขที่ ${res.data.transferNo} เรียบร้อยแล้ว`
      })
      setShowAdd(false)
      setFormData({
        fromWarehouseId: '',
        toWarehouseId: '',
        productId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />โอนสต็อก
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>โอนสินค้าระหว่างคลัง</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>จากคลัง *</Label>
                <Select value={formData.fromWarehouseId} onValueChange={v => setFormData(p => ({ ...p, fromWarehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกคลังต้นทาง" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ไปยังคลัง *</Label>
                <Select value={formData.toWarehouseId} onValueChange={v => setFormData(p => ({ ...p, toWarehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกคลังปลายทาง" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>สินค้า *</Label>
                <Select value={formData.productId} onValueChange={v => setFormData(p => ({ ...p, productId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>จำนวน *</Label>
                <Input type="number" min="1" step="0.01" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} placeholder="ระบุจำนวน" />
              </div>
              <div>
                <Label>วันที่</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Input value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="เหตุผลการโอน (ถ้ามี)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">โอนสต็อก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            ประวัติการโอนสินค้าระหว่างคลัง
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่โอน</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>จากคลัง</TableHead>
                  <TableHead></TableHead>
                  <TableHead>ไปยังคลัง</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">ยังไม่มีการโอนสินค้า</TableCell></TableRow>
                ) : transfers.map(t => (
                  <TableRow key={t.transferNo}>
                    <TableCell className="font-mono text-sm font-semibold">{t.transferNo}</TableCell>
                    <TableCell className="text-sm">{fd(t.date)}</TableCell>
                    <TableCell className="text-sm">{t.product.code} — {t.product.name}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">{t.fromWarehouse.name}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">{t.toWarehouse.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">{fc(t.quantity)}</TableCell>
                    <TableCell>
                      <Badge className={t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {t.status === 'COMPLETED' ? 'สำเร็จ' : 'ระหว่างดำเนินการ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCompleteTransfer(t)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {t.status === 'COMPLETED' ? <MoreHorizontal className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <StockTransferCompleteDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        transfer={selectedTransfer}
        onSuccess={fetchAll}
      />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export function InventoryPage({ initialTab }: { initialTab?: 'balance' | 'movements' | 'warehouses' | 'transfers' } = {}) {
  const [tab, setTab] = useState<'balance' | 'movements' | 'warehouses' | 'transfers'>(initialTab || 'balance')

  // Update tab when initialTab prop changes (e.g., when navigating between /inventory and /warehouses)
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const tabs = [
    { id: 'balance' as const, label: 'ยอดคงเหลือ', icon: Package },
    { id: 'movements' as const, label: 'การเคลื่อนไหว', icon: ArrowLeftRight },
    { id: 'warehouses' as const, label: 'คลังสินค้า', icon: Warehouse },
    { id: 'transfers' as const, label: 'โอนสต็อก', icon: ArrowLeftRight },
  ]
  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">คลังสินค้า (Inventory)</h1>
          <p className="text-sm text-gray-500">ระบบจัดการสินค้าคงคลัง — ต้นทุนแบบ WAC ตาม TAS 2</p>
        </div>
      </div>
      <div className="border-b mb-6">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'balance' && <StockBalanceTab />}
      {tab === 'movements' && <StockMovementsTab />}
      {tab === 'warehouses' && <WarehousesTab />}
      {tab === 'transfers' && <StockTransfersTab />}
    </div>
  )
}
