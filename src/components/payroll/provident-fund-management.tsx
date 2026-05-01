'use client'

// ============================================
// กองทุนสำรองเลี้ยงชีพ / Provident Fund Management
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { PiggyBank, Plus, Trash2, Users, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n / 100)
const fmtRate = (r: number) => `${r}%`

interface ProvidentFund {
  id: string
  name: string
  employeeRate: number
  employerRate: number
  maxMonthly: number | null
  isActive: boolean
  createdAt: string
  _count: { contributions: number }
}

interface Contribution {
  id: string
  employeePortion: number
  employerPortion: number
  createdAt: string
  payrollRunId: string
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
  }
  providentFund: {
    name: string
  }
}

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  baseSalary: number
  isActive: boolean
}

interface PayrollRun {
  id: string
  runNo: string
  periodMonth: number
  periodYear: number
  status: string
}

export function ProvidentFundManagement() {
  const [funds, setFunds] = useState<ProvidentFund[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddFund, setShowAddFund] = useState(false)
  const [showAddContribution, setShowAddContribution] = useState(false)
  const [selectedFund, setSelectedFund] = useState<ProvidentFund | null>(null)
  const { toast } = useToast()

  const [fundForm, setFundForm] = useState({
    name: '',
    employeeRate: '5',
    employerRate: '5',
    maxMonthly: '',
  })

  const [contribForm, setContribForm] = useState({
    providentFundId: '',
    employeeId: '',
    payrollRunId: '',
    employeePortion: '',
    employerPortion: '',
  })

  const fetchFunds = useCallback(async () => {
    try {
      const res = await fetch(`/api/provident-fund`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setFunds(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setEmployees(data.data.filter((e: Employee) => e.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }, [])

  const fetchPayrollRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/payroll`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setPayrollRuns(data.data.filter((r: PayrollRun) => r.status === 'PAID'))
      }
    } catch (error) {
      console.error('Failed to fetch payroll runs:', error)
    }
  }, [])

  const fetchContributions = useCallback(async (fundId: string) => {
    try {
      const res = await fetch(`/api/provident-fund/${fundId}/contributions`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setContributions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchFunds(), fetchEmployees(), fetchPayrollRuns()])
    queueMicrotask(() => setLoading(false))
  }, [fetchFunds, fetchEmployees, fetchPayrollRuns])

  useEffect(() => {
    queueMicrotask(() => fetchAll())
  }, [fetchAll])

  const handleCreateFund = async () => {
    if (!fundForm.name || !fundForm.employeeRate || !fundForm.employerRate) {
      toast({ title: 'กรุณาระบุข้อมูลให้ครบ', variant: 'destructive' })
      return
    }

    const res = await fetch(`/api/provident-fund`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fundForm.name,
        employeeRate: parseFloat(fundForm.employeeRate),
        employerRate: parseFloat(fundForm.employerRate),
        maxMonthly: fundForm.maxMonthly ? parseFloat(fundForm.maxMonthly) * 100 : undefined,
      }),
    }).then(r => r.json())

    if (res.success) {
      toast({ title: 'สร้างกองทุนสำเร็จ', description: res.data.name })
      setShowAddFund(false)
      setFundForm({ name: '', employeeRate: '5', employerRate: '5', maxMonthly: '' })
      fetchFunds()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const handleSelectFund = (fund: ProvidentFund) => {
    setSelectedFund(fund)
    setContribForm(prev => ({ ...prev, providentFundId: fund.id }))
    fetchContributions(fund.id)
    setShowAddContribution(true)
  }

  const handleCalculateContribution = () => {
    if (!contribForm.employeeId || !selectedFund) return

    const employee = employees.find(e => e.id === contribForm.employeeId)
    if (!employee) return

    const salary = employee.baseSalary
    const empPortion = Math.round(salary * (selectedFund.employeeRate / 100))
    const emplPortion = Math.round(salary * (selectedFund.employerRate / 100))

    const max = selectedFund.maxMonthly
    const empFinal = max ? Math.min(empPortion, max) : empPortion
    const emplFinal = max ? Math.min(emplPortion, max) : emplPortion

    setContribForm(prev => ({
      ...prev,
      employeePortion: (empFinal / 100).toFixed(2),
      employerPortion: (emplFinal / 100).toFixed(2),
    }))
  }

  const handleAddContribution = async () => {
    if (!contribForm.providentFundId || !contribForm.employeeId || !contribForm.payrollRunId) {
      toast({ title: 'กรุณาระบุข้อมูลให้ครบ', variant: 'destructive' })
      return
    }

    const res = await fetch(`/api/provident-fund/${contribForm.providentFundId}/contributions`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: contribForm.employeeId,
        payrollRunId: contribForm.payrollRunId,
        employeePortion: Math.round(parseFloat(contribForm.employeePortion || '0') * 100),
        employerPortion: Math.round(parseFloat(contribForm.employerPortion || '0') * 100),
      }),
    }).then(r => r.json())

    if (res.success) {
      toast({ title: 'บันทึกเงินสมทบสำเร็จ' })
      setShowAddContribution(false)
      setContribForm({ providentFundId: '', employeeId: '', payrollRunId: '', employeePortion: '', employerPortion: '' })
      if (selectedFund) fetchContributions(selectedFund.id)
      fetchFunds()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-pink-500" />
          กองทุนสำรองเลี้ยงชีพ
        </h1>
        <p className="text-sm text-gray-500">
          จัดการเงินสมทบกองทุนสำรองเลี้ยงชีพ ทั้งส่วนพนักงานและนายจ้าง
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">กองทุนทั้งหมด</p>
            <p className="text-2xl font-bold text-pink-600">{funds.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">พนักงานที่เข้าร่วม</p>
            <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">เงินสมทบรอบล่าสุด</p>
            <p className="text-xl font-bold text-green-600">
              {funds[0] ? fmtRate(funds[0].employeeRate) + '/' + fmtRate(funds[0].employerRate) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funds List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">กองทุนสำรองเลี้ยงชีพ</CardTitle>
            <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-pink-600 hover:bg-pink-700 cursor-pointer">
                  <Plus className="h-4 w-4 mr-1" />
                  สร้างกองทุน
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างกองทุนสำรองเลี้ยงชีพใหม่</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>ชื่อกองทุน *</Label>
                    <Input
                      value={fundForm.name}
                      onChange={e => setFundForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="เช่น กองทุนสำรองเลี้ยงชีพบริษัท"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>อัตราส่วนพนักงาน (%) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={fundForm.employeeRate}
                        onChange={e => setFundForm(p => ({ ...p, employeeRate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>อัตราส่วนนายจ้าง (%) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={fundForm.employerRate}
                        onChange={e => setFundForm(p => ({ ...p, employerRate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>เพดานรายเดือน (บาท)</Label>
                    <Input
                      type="number"
                      value={fundForm.maxMonthly}
                      onChange={e => setFundForm(p => ({ ...p, maxMonthly: e.target.value }))}
                      placeholder="ไม่จำกัดถ้าว่าง"
                    />
                    <p className="text-xs text-gray-500 mt-1">ป้อนเป็นบาท ระบบจะแปลงเป็นสตางค์</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddFund(false)}>ยกเลิก</Button>
                  <Button onClick={handleCreateFund} className="bg-pink-600 hover:bg-pink-700 cursor-pointer">
                    สร้างกองทุน
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อกองทุน</TableHead>
                  <TableHead className="text-center">อัตรา พนักงาน</TableHead>
                  <TableHead className="text-center">อัตรา นายจ้าง</TableHead>
                  <TableHead className="text-right">เพดาน/เดือน</TableHead>
                  <TableHead className="text-center">จำนวนเงินสมทบ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      <PiggyBank className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      ยังไม่มีกองทุนสำรองเลี้ยงชีพ
                    </TableCell>
                  </TableRow>
                ) : funds.map(fund => (
                  <TableRow key={fund.id} className="cursor-pointer hover:bg-gray-50 transition-colors duration-150">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-pink-400" />
                        <span className="font-medium">{fund.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {fmtRate(fund.employeeRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {fmtRate(fund.employerRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {fund.maxMonthly ? `฿${fc(fund.maxMonthly)}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{fund._count.contributions} รายการ</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectFund(fund)}
                        className="cursor-pointer"
                      >
                        ดูเงินสมทบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Contributions Dialog */}
      <Dialog open={showAddContribution} onOpenChange={setShowAddContribution}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-pink-500" />
              เงินสมทบกองทุน {selectedFund?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Contribution Form */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">เพิ่มเงินสมทบใหม่</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">พนักงาน *</Label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={contribForm.employeeId}
                      onChange={e => setContribForm(p => ({ ...p, employeeId: e.target.value }))}
                    >
                      <option value="">เลือกพนักงาน</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">รอบเงินเดือน *</Label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={contribForm.payrollRunId}
                      onChange={e => setContribForm(p => ({ ...p, payrollRunId: e.target.value }))}
                    >
                      <option value="">เลือกรอบ</option>
                      {payrollRuns.map(run => (
                        <option key={run.id} value={run.id}>
                          {run.runNo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {contribForm.employeeId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateContribution}
                    className="cursor-pointer"
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    คำนวณจากเงินเดือน
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">ส่วนพนักงาน (บาท) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={contribForm.employeePortion}
                      onChange={e => setContribForm(p => ({ ...p, employeePortion: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ส่วนนายจ้าง (บาท) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={contribForm.employerPortion}
                      onChange={e => setContribForm(p => ({ ...p, employerPortion: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddContribution}
                  className="w-full bg-pink-600 hover:bg-pink-700 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  บันทึกเงินสมทบ
                </Button>
              </CardContent>
            </Card>

            {/* Contributions List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ประวัติเงินสมทบ</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>พนักงาน</TableHead>
                        <TableHead>รอบ</TableHead>
                        <TableHead className="text-right">ส่วนพนักงาน</TableHead>
                        <TableHead className="text-right">ส่วนนายจ้าง</TableHead>
                        <TableHead className="text-right">รวม</TableHead>
                        <TableHead>วันที่</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                            ไม่มีเงินสมทบ
                          </TableCell>
                        </TableRow>
                      ) : contributions.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{c.employee.firstName} {c.employee.lastName}</div>
                              <div className="text-xs text-gray-500">{c.employee.employeeCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.payrollRunId}</TableCell>
                          <TableCell className="text-right text-blue-600">฿{fc(c.employeePortion)}</TableCell>
                          <TableCell className="text-right text-green-600">฿{fc(c.employerPortion)}</TableCell>
                          <TableCell className="text-right font-bold">฿{fc(c.employeePortion + c.employerPortion)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(c.createdAt).toLocaleDateString('th-TH')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContribution(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}