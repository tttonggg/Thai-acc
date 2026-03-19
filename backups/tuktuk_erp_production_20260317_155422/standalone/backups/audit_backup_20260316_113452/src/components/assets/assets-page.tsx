'use client'
import { useState, useEffect, useCallback } from 'react'
import { Building2, Calendar, Plus, TrendingDown, Edit, Trash2, Eye, Power } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AssetEditDialog } from './asset-edit-dialog'
import { DepreciationScheduleViewer } from './depreciation-schedule-viewer'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'short' })

interface Asset {
  id: string; code: string; name: string
  purchaseCost: number; salvageValue: number; usefulLifeYears: number
  purchaseDate: string; isActive: boolean
  purchaseCostFormatted?: string
  // from NBV calc:
  netBookValue?: number; accumulatedDepreciation?: number
}

interface DepSchedule {
  id: string; date: string; amount: number; accumulated: number; netBookValue: number; posted: boolean
}

interface AssetWithSchedules extends Asset {
  schedules?: DepSchedule[]
}

function AssetListTab() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithSchedules | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [form, setForm] = useState({
    code: '', name: '', purchaseDate: '', purchaseCost: '', salvageValue: '1',
    usefulLifeYears: '5', glAccountId: '', accumDepAccountId: '', depExpenseAccountId: ''
  })
  const { toast } = useToast()

  const fetch = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch('/api/assets').then(r => r.json())
    if (res.success) setAssets(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const handleSubmit = async () => {
    const res = await window.fetch('/api/assets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'บันทึกสำเร็จ', description: `สินทรัพย์ ${form.name} ถูกสร้างพร้อมตารางค่าเสื่อมราคาแล้ว` })
      setShowAdd(false)
      setForm({ code: '', name: '', purchaseDate: '', purchaseCost: '', salvageValue: '1', usefulLifeYears: '5', glAccountId: '', accumDepAccountId: '', depExpenseAccountId: '' })
      fetch()
    } else toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
  }

  const handleEditAsset = async (asset: Asset) => {
    // Fetch full asset details with schedules
    try {
      const res = await window.fetch(`/api/assets/${asset.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSelectedAsset(data.data)
          setShowEdit(true)
        }
      }
    } catch (error) {
      console.error('Error fetching asset details:', error)
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถดึงข้อมูลสินทรัพย์ได้', variant: 'destructive' })
    }
  }

  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return

    try {
      const res = await window.fetch(`/api/assets/${assetToDelete.id}`, {
        method: 'DELETE'
      }).then(r => r.json())

      if (res.success) {
        toast({ title: 'ลบสำเร็จ', description: `ลบสินทรัพย์ ${assetToDelete.name} เรียบร้อยแล้ว` })
        setShowDeleteConfirm(false)
        setAssetToDelete(null)
        fetch()
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถลบสินทรัพย์ได้', variant: 'destructive' })
    }
  }

  const handleToggleStatus = async (asset: Asset) => {
    try {
      const res = await window.fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !asset.isActive })
      }).then(r => r.json())

      if (res.success) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: `สินทรัพย์ ${asset.name} ถูก${asset.isActive ? 'ปลดระวาง' : 'เปิดใช้งาน'}แล้ว`
        })
        fetch()
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error toggling asset status:', error)
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถเปลี่ยนสถานะได้', variant: 'destructive' })
    }
  }

  const handleViewSchedule = async (asset: Asset) => {
    // Fetch full asset details with schedules
    try {
      const res = await window.fetch(`/api/assets/${asset.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSelectedAsset(data.data)
          setShowSchedule(true)
        }
      }
    } catch (error) {
      console.error('Error fetching asset schedule:', error)
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถดึงตารางค่าเสื่อมราคาได้', variant: 'destructive' })
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  const totalCost = assets.reduce((s, a) => s + a.purchaseCost, 0)
  const totalNBV = assets.reduce((s, a) => s + (a.netBookValue ?? a.purchaseCost), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-xs text-gray-500">จำนวนสินทรัพย์</p><p className="text-2xl font-bold text-blue-600">{assets.length} รายการ</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardContent className="p-4"><p className="text-xs text-gray-500">ราคาทุนรวม</p><p className="text-2xl font-bold text-orange-600">฿{fc(totalCost)}</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-xs text-gray-500">มูลค่าสุทธิรวม (NBV)</p><p className="text-2xl font-bold text-green-600">฿{fc(totalNBV)}</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />เพิ่มสินทรัพย์</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>ลงทะเบียนสินทรัพย์ถาวร (TAS 16)</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>รหัส *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="FA-001" /></div>
                <div><Label>ชื่อสินทรัพย์ *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>วันที่ซื้อ *</Label><Input type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} /></div>
                <div><Label>ราคาทุน (฿) *</Label><Input type="number" value={form.purchaseCost} onChange={e => setForm(p => ({ ...p, purchaseCost: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ค่าซาก (฿)</Label><Input type="number" value={form.salvageValue} onChange={e => setForm(p => ({ ...p, salvageValue: e.target.value }))} /></div>
                <div><Label>อายุการใช้งาน (ปี) *</Label><Input type="number" value={form.usefulLifeYears} onChange={e => setForm(p => ({ ...p, usefulLifeYears: e.target.value }))} /></div>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">💡 ค่าเสื่อมราคา = {form.purchaseCost && form.salvageValue && form.usefulLifeYears ? fc((parseFloat(form.purchaseCost) - parseFloat(form.salvageValue)) / (parseInt(form.usefulLifeYears) * 12)) : '—'} ฿/เดือน</div>
              <div><Label>บัญชีสินทรัพย์ (GL ID)</Label><Input value={form.glAccountId} onChange={e => setForm(p => ({ ...p, glAccountId: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>บัญชีค่าเสื่อมสะสม</Label><Input value={form.accumDepAccountId} onChange={e => setForm(p => ({ ...p, accumDepAccountId: e.target.value }))} /></div>
                <div><Label>บัญชีค่าเสื่อมประจำปี</Label><Input value={form.depExpenseAccountId} onChange={e => setForm(p => ({ ...p, depExpenseAccountId: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก & สร้างตาราง</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>รหัส</TableHead><TableHead>ชื่อสินทรัพย์</TableHead><TableHead>วันที่ซื้อ</TableHead><TableHead className="text-right">ราคาทุน</TableHead><TableHead className="text-right">NBV</TableHead><TableHead className="text-center">อายุ (ปี)</TableHead><TableHead className="text-center">สถานะ</TableHead><TableHead className="text-center">จัดการ</TableHead></TableRow></TableHeader>
            <TableBody>
              {assets.length === 0
                ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">ยังไม่มีสินทรัพย์ถาวร</TableCell></TableRow>
                : assets.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-sm">{a.code}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm">{fd(a.purchaseDate)}</TableCell>
                    <TableCell className="text-right">฿{fc(a.purchaseCost)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">฿{fc(a.netBookValue ?? a.purchaseCost)}</TableCell>
                    <TableCell className="text-center">{a.usefulLifeYears}</TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleStatus(a)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <Badge variant={a.isActive ? 'default' : 'secondary'} className="text-xs cursor-pointer">
                          {a.isActive ? 'ใช้งาน' : 'ปลดระวาง'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewSchedule(a)}
                          title="ดูตารางค่าเสื่อมราคา"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditAsset(a)}
                          title="แก้ไข"
                        >
                          <Edit className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteAsset(a)}
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AssetEditDialog
        asset={selectedAsset}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={fetch}
        mode="edit"
      />

      {/* Create Dialog */}
      <AssetEditDialog
        asset={null}
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={fetch}
        mode="create"
      />

      {/* Depreciation Schedule Viewer */}
      <DepreciationScheduleViewer
        asset={selectedAsset}
        open={showSchedule}
        onOpenChange={setShowSchedule}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบสินทรัพย์</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              คุณต้องการลบสินทรัพย์ <strong>{assetToDelete?.name}</strong> ({assetToDelete?.code}) ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAsset}>
              ลบสินทรัพย์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AssetsPage() {
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">ทรัพย์สินถาวร (Fixed Assets)</h1>
        <p className="text-sm text-gray-500">ทะเบียนสินทรัพย์ถาวรและตารางค่าเสื่อมราคา — TAS 16 (เส้นตรง)</p>
      </div>
      <AssetListTab />
    </div>
  )
}
