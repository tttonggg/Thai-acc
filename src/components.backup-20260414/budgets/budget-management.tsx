"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { PiggyBank, Plus, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface Budget {
  id: string
  year: number
  accountId: string
  account: {
    code: string
    name: string
    type: string
  }
  amount: number
  actual: number
  variance: number
  alertAt: number
  isAlerted: boolean
  notes?: string
  alerts: Array<{
    id: string
    alertType: string
    message: string
    triggeredAt: string
  }>
}

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportDialog, setReportDialog] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [alertsDialog, setAlertsDialog] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchBudgets()
    fetchAlerts()
  }, [selectedYear])

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`/api/budgets?year=${selectedYear}`)
      const data = await res.json()
      if (data.budgets) {
        setBudgets(data.budgets)
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลงบประมาณได้")
    }
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/budgets?alerts=true")
      const data = await res.json()
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error("Error fetching alerts:", error)
    }
  }

  const handleUpdateActuals = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-actuals", year: selectedYear }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        fetchBudgets()
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/budgets?report=vs-actual&year=${selectedYear}`)
      const data = await res.json()
      
      if (res.ok) {
        setReport(data)
        setReportDialog(true)
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดรายงาน")
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge-alert", alertId }),
      })
      if (res.ok) {
        toast.success("รับทราบการแจ้งเตือนแล้ว")
        fetchAlerts()
        fetchBudgets()
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    }
  }

  const getUsagePercent = (budget: Budget) => {
    return budget.amount > 0 ? (budget.actual / budget.amount) * 100 : 0
  }

  const getStatusBadge = (budget: Budget) => {
    const usage = getUsagePercent(budget)
    if (usage >= 100) {
      return <Badge variant="destructive">เกินงบ</Badge>
    } else if (usage >= budget.alertAt) {
      return <Badge variant="default" className="bg-yellow-500">ใกล้เต็ม</Badge>
    } else if (usage >= 75) {
      return <Badge variant="secondary">ตามแผน</Badge>
    }
    return <Badge variant="default" className="bg-green-500">ปกติ</Badge>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              จัดการงบประมาณ
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return <option key={year} value={year}>{year}</option>
                })}
              </select>
              <Button variant="outline" onClick={handleUpdateActuals} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                อัปเดตยอดจริง
              </Button>
              <Button variant="outline" onClick={handleReport} disabled={loading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                รายงาน
              </Button>
              {alerts.length > 0 && (
                <Button variant="destructive" onClick={() => setAlertsDialog(true)}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  แจ้งเตือน ({alerts.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead>งบประมาณ</TableHead>
                <TableHead>ใช้จริง</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const usage = getUsagePercent(budget)
                return (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.account.code}</TableCell>
                    <TableCell>{budget.account.name}</TableCell>
                    <TableCell>{(budget.amount / 100).toLocaleString()} บาท</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span>{(budget.actual / 100).toLocaleString()} บาท</span>
                        <Progress value={usage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className={budget.variance >= 0 ? "text-green-600" : "text-red-600"}>
                      {(budget.variance / 100).toLocaleString()} บาท
                    </TableCell>
                    <TableCell>{getStatusBadge(budget)}</TableCell>
                  </TableRow>
                )
              })}
              {budgets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลงบประมาณ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={alertsDialog} onOpenChange={setAlertsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>การแจ้งเตือนงบประมาณ</DialogTitle>
            <DialogDescription>
              รายการแจ้งเตือนที่ยังไม่ได้รับทราบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex justify-between items-start p-3 bg-yellow-50 rounded">
                <div>
                  <p className="font-medium">{alert.budget?.account?.name}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.triggeredAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                  รับทราบ
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายงานเปรียบเทียบงบประมาณกับผลการใช้จริง</DialogTitle>
            <DialogDescription>
              ปี {report?.year}
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">งบประมาณรวม</p>
                  <p className="text-lg font-bold">{(report.summary.totalBudget / 100).toLocaleString()} บาท</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">ใช้จริงรวม</p>
                  <p className="text-lg font-bold">{(report.summary.totalActual / 100).toLocaleString()} บาท</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">เกินงบ</p>
                  <p className="text-lg font-bold text-red-600">{report.summary.overBudgetCount} บัญชี</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">เสี่ยงเกินงบ</p>
                  <p className="text-lg font-bold text-yellow-600">{report.summary.criticalCount} บัญชี</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
