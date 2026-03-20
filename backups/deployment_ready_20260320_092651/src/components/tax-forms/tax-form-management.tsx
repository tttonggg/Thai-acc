"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { FileText, Plus, Download, Send, CheckCircle } from "lucide-react"

interface TaxForm {
  id: string
  formType: "PND3" | "PND53" | "PP30"
  month: number
  year: number
  status: "DRAFT" | "SUBMITTED" | "FILED"
  totalAmount: number
  totalTax: number
  submittedAt?: string
  filingDate?: string
  receiptNo?: string
  lines: Array<{
    lineNo: number
    payeeName: string
    payeeTaxId?: string
    incomeAmount: number
    taxAmount: number
  }>
}

const formTypeNames: Record<string, string> = {
  PND3: "ภ.ง.ด. 3",
  PND53: "ภ.ง.ด. 53",
  PP30: "ภ.พ. 30",
}

const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

export function TaxFormManagement() {
  const [taxForms, setTaxForms] = useState<TaxForm[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewDialog, setViewDialog] = useState<{ open: boolean; taxForm?: TaxForm }>({ open: false })

  useEffect(() => {
    fetchTaxForms()
  }, [selectedYear])

  const fetchTaxForms = async () => {
    try {
      const res = await fetch(`/api/tax-forms?year=${selectedYear}`)
      const data = await res.json()
      if (data.taxForms) {
        setTaxForms(data.taxForms)
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลแบบฟอร์มภาษีได้")
    }
  }

  const handleGenerate = async (formType: string, month: number, year: number) => {
    setLoading(true)
    try {
      const res = await fetch("/api/tax-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType, month, year }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        fetchTaxForms()
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้างแบบฟอร์ม")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (taxFormId: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/tax-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", taxFormId }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        fetchTaxForms()
        setViewDialog({ open: false })
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งแบบฟอร์ม")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (taxFormId: string, format: "pdf" | "excel") => {
    try {
      const res = await fetch(`/api/tax-forms/${taxFormId}/export?format=${format}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tax-form-${taxFormId}.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success("ดาวน์โหลดไฟล์สำเร็จ")
      } else {
        toast.error("ไม่สามารถส่งออกไฟล์ได้")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งออกไฟล์")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">ร่าง</Badge>
      case "SUBMITTED":
        return <Badge variant="default" className="bg-blue-500">ส่งแล้ว</Badge>
      case "FILED":
        return <Badge variant="default" className="bg-green-500">ยื่นแล้ว</Badge>
      default:
        return <Badge>ไม่ทราบ</Badge>
    }
  }

  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              จัดการแบบฟอร์มภาษี
            </CardTitle>
            <div className="flex gap-2">
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(3)].map((_, i) => {
                    const year = new Date().getFullYear() - 1 + i
                    return <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("PND3", currentMonth, selectedYear)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              สร้าง ภ.ง.ด. 3
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("PND53", currentMonth, selectedYear)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              สร้าง ภ.ง.ด. 53
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("PP30", currentMonth, selectedYear)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              สร้าง ภ.พ. 30
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>แบบฟอร์ม</TableHead>
                <TableHead>งวด</TableHead>
                <TableHead>มูลค่ารวม</TableHead>
                <TableHead>ภาษีรวม</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{formTypeNames[form.formType]}</TableCell>
                  <TableCell>{monthNames[form.month - 1]} {form.year}</TableCell>
                  <TableCell>{(form.totalAmount / 100).toLocaleString()} บาท</TableCell>
                  <TableCell>{(form.totalTax / 100).toLocaleString()} บาท</TableCell>
                  <TableCell>{getStatusBadge(form.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewDialog({ open: true, taxForm: form })}
                      >
                        ดู
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(form.id, "pdf")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {taxForms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ไม่พบข้อมูลแบบฟอร์มภาษี
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewDialog.open} onOpenChange={() => setViewDialog({ open: false })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {viewDialog.taxForm && formTypeNames[viewDialog.taxForm.formType]} 
              {viewDialog.taxForm && ` - ${monthNames[viewDialog.taxForm.month - 1]} ${viewDialog.taxForm.year}`}
            </DialogTitle>
            <DialogDescription>
              รายละเอียดแบบฟอร์มภาษี
            </DialogDescription>
          </DialogHeader>
          {viewDialog.taxForm && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                  <p className="text-lg font-bold">{(viewDialog.taxForm.totalAmount / 100).toLocaleString()} บาท</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ภาษีรวม</p>
                  <p className="text-lg font-bold">{(viewDialog.taxForm.totalTax / 100).toLocaleString()} บาท</p>
                </div>
                <div>
                  {getStatusBadge(viewDialog.taxForm.status)}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>ผู้ถูกหักภาษี</TableHead>
                    <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead className="text-right">ภาษี</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewDialog.taxForm.lines?.map((line) => (
                    <TableRow key={line.lineNo}>
                      <TableCell>{line.lineNo}</TableCell>
                      <TableCell>{line.payeeName}</TableCell>
                      <TableCell>{line.payeeTaxId || "-"}</TableCell>
                      <TableCell className="text-right">{(line.incomeAmount / 100).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{(line.taxAmount / 100).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {viewDialog.taxForm.status === "DRAFT" && (
                <div className="flex gap-2">
                  <Button onClick={() => handleSubmit(viewDialog.taxForm!.id)} disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    ส่งแบบฟอร์ม
                  </Button>
                  <Button variant="outline" onClick={() => handleExport(viewDialog.taxForm!.id, "excel")}>
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออก Excel
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
