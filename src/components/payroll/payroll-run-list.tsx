'use client'

// ============================================
// 💰 Payroll Runs Tab
// Agent 06: Payroll & HR Engineer
// Shows payroll runs with SSC, PND1, Net Pay breakdown
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Play, Check, Plus, Download, FileText, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { PayrollRunStatusDialog } from './payroll-status-dialog'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)

interface PayrollRun {
  id: string; runNo: string; periodMonth: number; periodYear: number
  paymentDate: string; totalBaseSalary: number; totalAdditions: number
  totalDeductions: number; totalSsc: number; totalTax: number
  totalNetPay: number; status: 'DRAFT' | 'APPROVED' | 'PAID'
  payrolls: { id: string }[]
  journalEntryId?: string | null
}

interface PayrollDetail {
  id: string
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
    position?: string
    department?: string
  }
  baseSalary: number
  additions: number
  deductions: number
  socialSecurity: number
  withholdingTax: number
  netPay: number
}

const PAYROLL_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-600' },
  APPROVED: { label: 'อนุมัติ', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'จ่ายแล้ว', color: 'bg-green-100 text-green-700' },
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export function PayrollRunList() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetail[]>([])
  const [downloadingPayslip, setDownloadingPayslip] = useState<string | null>(null)
  const [form, setForm] = useState({ periodMonth: String(new Date().getMonth() + 1), periodYear: String(new Date().getFullYear()), paymentDate: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch('/api/payroll').then(r => r.json())
    if (res.success) setRuns(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreateRun = async () => {
    if (!form.paymentDate) { toast({ title: 'กรุณาระบุวันที่จ่าย', variant: 'destructive' }); return }
    const res = await window.fetch('/api/payroll', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'ประมวลผลเงินเดือนสำเร็จ', description: `${res.data.payrolls?.length || 0} พนักงาน` })
      setShowAdd(false)
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const handleViewDetails = async (runId: string) => {
    setSelectedRunId(runId)
    setShowDetails(true)

    try {
      const res = await window.fetch(`/api/payroll/${runId}`).then(r => r.json())
      if (res.success) {
        setPayrollDetails(res.data.payrolls)
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถดึงข้อมูลได้', variant: 'destructive' })
    }
  }

  const handleManageStatus = (run: PayrollRun) => {
    setSelectedRun(run)
    setShowStatus(true)
  }

  const handleDownloadPayslip = async (payrollId: string, employeeName: string) => {
    setDownloadingPayslip(payrollId)

    try {
      const response = await window.fetch(`/api/payroll/${payrollId}/payslip`)

      if (!response.ok) {
        throw new Error('ไม่สามารถสร้างสลิปเงินเดือนได้')
      }

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `payslip-${employeeName}.pdf`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: 'ดาวน์โหลดสลิปเงินเดือนสำเร็จ' })
    } catch (error) {
      console.error('Error downloading payslip:', error)
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถดาวน์โหลดสลิปเงินเดือนได้', variant: 'destructive' })
    } finally {
      setDownloadingPayslip(null)
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  const latestRun = runs[0]
  const totalPaid = runs.filter(r => r.status === 'PAID').reduce((s, r) => s + r.totalNetPay, 0)

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-xs text-gray-500">รอบเงินเดือนทั้งหมด</p><p className="text-2xl font-bold text-blue-600">{runs.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-xs text-gray-500">จ่ายแล้วสะสม</p><p className="text-xl font-bold text-green-600">฿{fc(totalPaid)}</p></CardContent></Card>
        {latestRun && <Card className="border-l-4 border-l-orange-500"><CardContent className="p-4"><p className="text-xs text-gray-500">รอบล่าสุด — SSC</p><p className="text-xl font-bold text-orange-600">฿{fc(latestRun.totalSsc)}</p></CardContent></Card>}
      </div>

      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-green-600 hover:bg-green-700"><Play className="h-4 w-4 mr-1" />ประมวลผลเงินเดือน</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>สร้างรอบเงินเดือน</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">ระบบจะคำนวณ SSC (5%, สูงสุด ฿750) และ PND1 (อัตราก้าวหน้า 2567) ให้อัตโนมัติสำหรับพนักงานที่ Active ทุกคน</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>เดือน *</Label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={form.periodMonth} onChange={e => setForm(p => ({ ...p, periodMonth: e.target.value }))}>
                    {THAI_MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <Label>ปี (ค.ศ.) *</Label>
                  <Input type="number" value={form.periodYear} onChange={e => setForm(p => ({ ...p, periodYear: e.target.value }))} />
                </div>
              </div>
              <div><Label>วันที่จ่ายเงินเดือน *</Label><Input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleCreateRun} className="bg-green-600 hover:bg-green-700"><Play className="h-4 w-4 mr-1" />ประมวลผล</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">ประวัติรอบเงินเดือน</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่รอบ</TableHead>
                <TableHead>งวด</TableHead>
                <TableHead>จำนวนพนักงาน</TableHead>
                <TableHead className="text-right">ฐานเงินเดือน</TableHead>
                <TableHead className="text-right">ประกันสังคม</TableHead>
                <TableHead className="text-right">ภาษี PND1</TableHead>
                <TableHead className="text-right">เงินได้สุทธิ</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400"><DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />ยังไม่มีรอบเงินเดือน</TableCell></TableRow>
              ) : runs.map(r => {
                const st = PAYROLL_STATUS[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.runNo}</TableCell>
                    <TableCell className="font-medium">{THAI_MONTHS[r.periodMonth - 1]} {r.periodYear + 543}</TableCell>
                    <TableCell className="text-center">{r.payrolls.length} คน</TableCell>
                    <TableCell className="text-right">฿{fc(r.totalBaseSalary)}</TableCell>
                    <TableCell className="text-right text-purple-600">฿{fc(r.totalSsc)}</TableCell>
                    <TableCell className="text-right text-red-600">฿{fc(r.totalTax)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">฿{fc(r.totalNetPay)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(r.id)}
                          className="h-8 w-8 p-0"
                          title="ดูรายละเอียดพนักงาน"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleManageStatus(r)}
                          className="h-8 w-8 p-0"
                          title="จัดการสถานะ"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payroll Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดเงินเดือนพนักงาน</DialogTitle>
          </DialogHeader>

          {payrollDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              ไม่พบข้อมูล
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">ฐานเงินเดือน</TableHead>
                  <TableHead className="text-right">เบี้ยเลี้ยง</TableHead>
                  <TableHead className="text-right">หักอื่นๆ</TableHead>
                  <TableHead className="text-right">ประกันสังคม</TableHead>
                  <TableHead className="text-right">ภาษี PND1</TableHead>
                  <TableHead className="text-right">เงินได้สุทธิ</TableHead>
                  <TableHead className="text-center">ดาวน์โหลด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollDetails.map((detail) => {
                  const employeeName = `${detail.employee.firstName} ${detail.employee.lastName}`
                  const isDownloading = downloadingPayslip === detail.id

                  return (
                    <TableRow key={detail.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employeeName}</div>
                          <div className="text-xs text-gray-500">{detail.employee.employeeCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{detail.employee.position || '-'}</TableCell>
                      <TableCell className="text-right">฿{fc(detail.baseSalary)}</TableCell>
                      <TableCell className="text-right text-green-600">฿{fc(detail.additions)}</TableCell>
                      <TableCell className="text-right text-orange-600">฿{fc(detail.deductions)}</TableCell>
                      <TableCell className="text-right text-purple-600">฿{fc(detail.socialSecurity)}</TableCell>
                      <TableCell className="text-right text-red-600">฿{fc(detail.withholdingTax)}</TableCell>
                      <TableCell className="text-right font-bold text-green-700">฿{fc(detail.netPay)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPayslip(detail.id, employeeName)}
                          disabled={isDownloading}
                          className="h-8 w-8 p-0"
                        >
                          {isDownloading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll Status Management Dialog */}
      <PayrollRunStatusDialog
        open={showStatus}
        onClose={() => setShowStatus(false)}
        onSuccess={fetchAll}
        payrollRun={selectedRun}
      />
    </div>
  )
}
