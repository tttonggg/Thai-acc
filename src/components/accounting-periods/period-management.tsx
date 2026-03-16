"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Lock, Unlock, LockKeyhole, Calendar, RefreshCw } from "lucide-react"

interface AccountingPeriod {
  id: string
  year: number
  month: number
  status: "OPEN" | "CLOSED" | "LOCKED"
  closedBy: string | null
  closedAt: string | null
  reopenedBy: string | null
  reopenedAt: string | null
}

const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

export function PeriodManagement() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reconcileDialog, setReconcileDialog] = useState<{ open: boolean; year: number; month: number } | null>(null)
  const [reconcileReport, setReconcileReport] = useState<any>(null)

  useEffect(() => {
    fetchPeriods()
  }, [selectedYear])

  const fetchPeriods = async () => {
    try {
      const res = await fetch(`/api/accounting-periods?year=${selectedYear}`)
      const data = await res.json()
      if (data.periods) {
        setPeriods(data.periods)
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลงวดบัญชีได้")
    }
  }

  const handleAction = async (action: string, year: number, month: number) => {
    setLoading(true)
    try {
      const res = await fetch("/api/accounting-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, year, month }),
      })
      const data = await res.json()
      
      if (res.ok) {
        if (action === "reconcile") {
          setReconcileReport(data.report)
          setReconcileDialog({ open: true, year, month })
        } else {
          toast.success(data.message)
          fetchPeriods()
        }
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดำเนินการ")
    } finally {
      setLoading(false)
    }
  }

  const handleInitYear = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/accounting-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init-year", year: selectedYear }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        fetchPeriods()
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้างงวดบัญชี")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="default" className="bg-green-500">เปิด</Badge>
      case "CLOSED":
        return <Badge variant="secondary">ปิด</Badge>
      case "LOCKED":
        return <Badge variant="destructive">ล็อก</Badge>
      default:
        return <Badge>ไม่ทราบ</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              จัดการงวดบัญชี
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
              <Button variant="outline" onClick={handleInitYear} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                สร้างงวดบัญชี
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เดือน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ปิดโดย</TableHead>
                <TableHead>วันที่ปิด</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{monthNames[period.month - 1]} {period.year}</TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell>{period.closedBy || "-"}</TableCell>
                  <TableCell>
                    {period.closedAt 
                      ? new Date(period.closedAt).toLocaleDateString("th-TH") 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {period.status === "OPEN" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("close", period.year, period.month)}
                            disabled={loading}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            ปิด
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("reconcile", period.year, period.month)}
                            disabled={loading}
                          >
                            กระทบยอด
                          </Button>
                        </>
                      )}
                      {period.status === "CLOSED" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("reopen", period.year, period.month)}
                            disabled={loading}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            เปิดใหม่
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAction("lock", period.year, period.month)}
                            disabled={loading}
                          >
                            <LockKeyhole className="h-4 w-4 mr-1" />
                            ล็อก
                          </Button>
                        </>
                      )}
                      {period.status === "LOCKED" && (
                        <Badge variant="destructive">ล็อกถาวร</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {periods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลงวดบัญชี กรุณาสร้างงวดบัญชี
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={reconcileDialog?.open} onOpenChange={() => setReconcileDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              รายงานกระทบยอด {reconcileDialog && monthNames[reconcileDialog.month - 1]} {reconcileDialog?.year}
            </DialogTitle>
            <DialogDescription>
              ตรวจสอบความถูกต้องของงวดบัญชีก่อนปิด
            </DialogDescription>
          </DialogHeader>
          {reconcileReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">รวมเดบิต</p>
                  <p className="text-lg font-bold">{(reconcileReport.totalDebits / 100).toLocaleString()} บาท</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">รวมเครดิต</p>
                  <p className="text-lg font-bold">{(reconcileReport.totalCredits / 100).toLocaleString()} บาท</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">รายการรอดำเนินการ</p>
                  <p className="text-lg font-bold">{reconcileReport.pendingEntries} รายการ</p>
                </div>
              </div>
              {reconcileReport.discrepancies?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">ข้อผิดพลาดที่พบ:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {reconcileReport.discrepancies.map((d: any, i: number) => (
                      <li key={i}>
                        {d.accountCode} {d.accountName}: ผลต่าง {(d.difference / 100).toLocaleString()} บาท
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
