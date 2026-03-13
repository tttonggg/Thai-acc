'use client'

// ============================================
// 👥 Employee Directory Tab
// Agent 06: Payroll & HR Engineer
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n)

interface Employee {
  id: string; employeeCode: string; firstName: string; lastName: string
  position: string | null; department: string | null
  baseSalary: number; hireDate: string
  socialSecurityNo: string | null; taxId: string | null; isActive: boolean
}

const EMPTY_FORM = {
  employeeCode: '', firstName: '', lastName: '',
  position: '', department: '', hireDate: '', baseSalary: '',
  taxId: '', socialSecurityNo: '', bankAccountNo: '', bankName: ''
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch('/api/employees').then(r => r.json())
    if (res.success) setEmployees(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async () => {
    const res = await window.fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, baseSalary: parseFloat(form.baseSalary) }),
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'เพิ่มพนักงานสำเร็จ', description: `${form.firstName} ${form.lastName}` })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const filtered = employees.filter(e =>
    !search ||
    e.firstName.includes(search) || e.lastName.includes(search) ||
    e.employeeCode.includes(search) || (e.department || '').includes(search)
  )

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  // Summary stats
  const active = employees.filter(e => e.isActive)
  const totalSalary = active.reduce((s, e) => s + e.baseSalary, 0)

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4"><p className="text-xs text-gray-500">พนักงานที่ใช้งาน</p><p className="text-2xl font-bold text-blue-600">{active.length} คน</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4"><p className="text-xs text-gray-500">ฐานเงินเดือนรวม/เดือน</p><p className="text-2xl font-bold text-green-600">฿{fc(totalSalary)}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">ประกันสังคมพนักงาน/เดือน</p>
            <p className="text-2xl font-bold text-purple-600">฿{fc(active.reduce((s, e) => s + Math.min(e.baseSalary * 0.05, 750), 0))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center justify-between">
        <Input
          placeholder="ค้นหาพนักงาน..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />เพิ่มพนักงาน</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>เพิ่มพนักงานใหม่</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>รหัสพนักงาน *</Label><Input value={form.employeeCode} onChange={e => setForm(p => ({ ...p, employeeCode: e.target.value }))} placeholder="EMP-001" /></div>
                <div><Label>วันเริ่มงาน *</Label><Input type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ชื่อ *</Label><Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                <div><Label>นามสกุล *</Label><Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ตำแหน่ง</Label><Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} /></div>
                <div><Label>แผนก</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
              </div>
              <div>
                <Label>เงินเดือน (฿) *</Label>
                <Input type="number" value={form.baseSalary} onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))} />
                {form.baseSalary && (
                  <p className="text-xs text-teal-600 mt-1">
                    SSC: ฿{fc(Math.min(parseFloat(form.baseSalary) * 0.05, 750))} | ประมาณ PND1: ฿{fc(Math.max(0, (parseFloat(form.baseSalary) * 12 - 150000) * 0.05 / 12))}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>เลขบัตรประชาชน</Label><Input value={form.taxId} onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))} /></div>
                <div><Label>เลขประกันสังคม</Label><Input value={form.socialSecurityNo} onChange={e => setForm(p => ({ ...p, socialSecurityNo: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>เลขที่บัญชีธนาคาร</Label><Input value={form.bankAccountNo} onChange={e => setForm(p => ({ ...p, bankAccountNo: e.target.value }))} /></div>
                <div><Label>ธนาคาร</Label><Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} /></div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง / แผนก</TableHead>
                <TableHead className="text-right">เงินเดือน</TableHead>
                <TableHead className="text-right">SSC (5%)</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400"><Users className="h-10 w-10 mx-auto mb-2 opacity-30" />{search ? 'ไม่พบพนักงานที่ค้นหา' : 'ยังไม่มีพนักงาน'}</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.employeeCode}</TableCell>
                  <TableCell>
                    <p className="font-medium">{e.firstName} {e.lastName}</p>
                    {e.taxId && <p className="text-xs text-gray-400">{e.taxId}</p>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {e.position || '—'}
                    {e.department && <span className="text-gray-400 ml-1">/ {e.department}</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold">฿{fc(e.baseSalary)}</TableCell>
                  <TableCell className="text-right text-purple-600">฿{fc(Math.min(e.baseSalary * 0.05, 750))}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={e.isActive ? 'default' : 'secondary'} className="text-xs">{e.isActive ? 'ทำงาน' : 'ลาออก'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
