'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  Play,
  Edit,
  Trash2,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Loader2,
  Download,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatThaiDate } from '@/lib/thai-accounting'

interface ScheduledReport {
  id: string
  name: string
  reportType: string
  schedule: string
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  monthOfYear?: number | null
  time: string
  enabled: boolean
  recipients: string
  outputFormat: string
  emailSubject?: string | null
  emailBody?: string | null
  createdAt: string
  updatedAt: string
  nextRunDate?: Date | null
  lastRunStatus?: string | null
  lastRunAt?: Date | null
  runs: ScheduledReportRun[]
}

interface ScheduledReportRun {
  id: string
  status: string
  runAt: string
  errorMessage?: string | null
  fileUrl?: string | null
  fileSize?: number | null
  generatedRecords?: number | null
  createdAt: string
}

const REPORT_TYPES = [
  { value: 'TRIAL_BALANCE', label: 'งบทดลอง (Trial Balance)' },
  { value: 'BALANCE_SHEET', label: 'งบดุล (Balance Sheet)' },
  { value: 'INCOME_STATEMENT', label: 'งบกำไรขาดทุน (Income Statement)' },
  { value: 'GENERAL_LEDGER', label: 'สมุดบัญชีแยกประเภท (General Ledger)' },
  { value: 'AGING_AR', label: 'รายงานลูกหนี้ตามอายุหนี้ (AR Aging)' },
  { value: 'AGING_AP', label: 'รายงานเจ้าหนี้ตามอายุหนี้ (AP Aging)' },
  { value: 'VAT_REPORT', label: 'รายงานภาษีมูลค่าเพิ่ม (VAT Report)' },
  { value: 'WHT_REPORT', label: 'รายงานภาษีหัก ณ ที่จ่าย (WHT Report)' },
  { value: 'INVENTORY_REPORT', label: 'รายงานสต็อกสินค้า (Inventory Report)' },
  { value: 'SALES_REPORT', label: 'รายงานยอดขาย (Sales Report)' },
  { value: 'PURCHASE_REPORT', label: 'รายงานการซื้อ (Purchase Report)' },
]

const SCHEDULE_TYPES = [
  { value: 'daily', label: 'รายวัน (Daily)' },
  { value: 'weekly', label: 'รายสัปดาห์ (Weekly)' },
  { value: 'monthly', label: 'รายเดือน (Monthly)' },
  { value: 'quarterly', label: 'รายไตรมาส (Quarterly)' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'อาทิตย์ (Sunday)' },
  { value: 1, label: 'จันทร์ (Monday)' },
  { value: 2, label: 'อังคาร (Tuesday)' },
  { value: 3, label: 'พุธ (Wednesday)' },
  { value: 4, label: 'พฤหัสบดี (Thursday)' },
  { value: 5, label: 'ศุกร์ (Friday)' },
  { value: 6, label: 'เสาร์ (Saturday)' },
]

export function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null)
  const [viewingRuns, setViewingRuns] = useState<ScheduledReport | null>(null)
  const [runHistory, setRunHistory] = useState<ScheduledReportRun[]>([])
  const [saving, setSaving] = useState(false)
  const [runningReport, setRunningReport] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    reportType: '',
    schedule: 'daily',
    dayOfWeek: 1,
    dayOfMonth: 1,
    monthOfYear: 1,
    time: '09:00',
    enabled: true,
    recipients: '',
    outputFormat: 'PDF',
    emailSubject: '',
    emailBody: '',
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports/scheduled`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setReports(result.data)
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถดึงข้อมูลรายงานที่กำหนดเวลาได้',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRunHistory = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${reportId}/runs`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setRunHistory(result.data)
      }
    } catch (error) {
      console.error('Error fetching run history:', error)
    }
  }

  const handleCreate = () => {
    setEditingReport(null)
    setFormData({
      name: '',
      reportType: '',
      schedule: 'daily',
      dayOfWeek: 1,
      dayOfMonth: 1,
      monthOfYear: 1,
      time: '09:00',
      enabled: true,
      recipients: '',
      outputFormat: 'PDF',
      emailSubject: '',
      emailBody: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (report: ScheduledReport) => {
    setEditingReport(report)
    setFormData({
      name: report.name,
      reportType: report.reportType,
      schedule: report.schedule,
      dayOfWeek: report.dayOfWeek || 1,
      dayOfMonth: report.dayOfMonth || 1,
      monthOfYear: report.monthOfYear || 1,
      time: report.time,
      enabled: report.enabled,
      recipients: report.recipients,
      outputFormat: report.outputFormat,
      emailSubject: report.emailSubject || '',
      emailBody: report.emailBody || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const url = editingReport
        ? `/api/reports/scheduled/${editingReport.id}`
        : '/api/reports/scheduled'

      const method = editingReport ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: editingReport
            ? 'อัปเดตรายงานที่กำหนดเวลาเรียบร้อยแล้ว'
            : 'สร้างรายงานที่กำหนดเวลาเรียบร้อยแล้ว',
        })
        setDialogOpen(false)
        fetchReports()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถบันทึกข้อมูลได้',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายงานที่กำหนดเวลานี้ใช่หรือไม่?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/scheduled/${id}`, { credentials: 'include', 
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'ลบสำเร็จ',
          description: 'ลบรายงานที่กำหนดเวลาเรียบร้อยแล้ว',
        })
        fetchReports()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถลบข้อมูลได้',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    }
  }

  const handleRunNow = async (id: string) => {
    setRunningReport(id)

    try {
      const response = await fetch(`/api/reports/scheduled/${id}/run`, { credentials: 'include', 
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'รันสำเร็จ',
          description: 'สร้างรายงานเรียบร้อยแล้ว',
        })
        fetchReports()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถรันรายงานได้',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    } finally {
      setRunningReport(null)
    }
  }

  const handleToggleEnabled = async (report: ScheduledReport) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${report.id}`, { credentials: 'include', 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !report.enabled }),
      })

      const result = await response.json()

      if (result.success) {
        fetchReports()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถอัปเดตสถานะได้',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      })
    }
  }

  const handleViewRuns = (report: ScheduledReport) => {
    setViewingRuns(report)
    fetchRunHistory(report.id)
  }

  const getScheduleLabel = (report: ScheduledReport) => {
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

    switch (report.schedule) {
      case 'daily':
        return `รายวัน เวลา ${report.time}`
      case 'weekly':
        return `ทุก${dayNames[report.dayOfWeek || 1]} เวลา ${report.time}`
      case 'monthly':
        return `ทุกวันที่ ${report.dayOfMonth} เวลา ${report.time}`
      case 'quarterly':
        return `ไตรมาส ${Math.ceil((report.monthOfYear || 1) / 3)} เวลา ${report.time}`
      default:
        return report.schedule
    }
  }

  const getStatusBadge = (status?: string | null) => {
    if (!status)
      return <Badge variant="outline">ยังไม่รัน</Badge>

    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            สำเร็จ
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            ล้มเหลว
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            กำลังดำเนินการ
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-'
    return (bytes / 1024).toFixed(2) + ' KB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายงานอัตโนมัติตามกำหนดเวลา</h1>
          <p className="text-muted-foreground mt-2">
            จัดการรายงานที่สร้างและส่งอีเมลอัตโนมัติตามกำหนดเวลา
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          สร้างกำหนดการ
        </Button>
      </div>

      <div className="grid gap-6">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่มีรายงานที่กำหนดเวลา</h3>
              <p className="text-muted-foreground text-center mb-4">
                คุณยังไม่ได้สร้างรายงานอัตโนมัติ<br />
                คลิกปุ่ม "สร้างกำหนดการ" เพื่อเริ่มต้น
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                สร้างกำหนดการ
              </Button>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className={!report.enabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{report.name}</CardTitle>
                      <Badge variant="outline">{report.outputFormat}</Badge>
                      {!report.enabled && <Badge variant="secondary">ปิดใช้งาน</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {REPORT_TYPES.find((t) => t.value === report.reportType)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={() => handleToggleEnabled(report)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(report)}
                      title="แก้ไข"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRunNow(report.id)}
                      disabled={runningReport === report.id}
                      title="รันทันที"
                    >
                      {runningReport === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(report.id)}
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">กำหนดการ</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{getScheduleLabel(report)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ผู้รับอีเมล</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate">{report.recipients}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">รันครั้งล่าสุด</p>
                    <div className="flex items-center gap-2">
                      {report.lastRunAt ? (
                        <>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatThaiDate(new Date(report.lastRunAt))}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">ยังไม่เคยรัน</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">สถานะล่าสุด</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.lastRunStatus)}
                    </div>
                  </div>
                </div>

                {report.nextRunDate && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      รันครั้งต่อไป:{' '}
                      <span className="font-medium text-foreground">
                        {formatThaiDate(new Date(report.nextRunDate))}
                      </span>
                    </p>
                  </div>
                )}

                {report.runs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRuns(report)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      ดูประวัติการรัน ({report.runs.length} ครั้ง)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'แก้ไขรายงานที่กำหนดเวลา' : 'สร้างรายงานที่กำหนดเวลา'}
            </DialogTitle>
            <DialogDescription>
              {editingReport
                ? 'แก้ไขการตั้งค่ารายงานอัตโนมัติ'
                : 'สร้างรายงานอัตโนมัติที่จะส่งทางอีเมลตามกำหนดเวลา'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อรายงาน *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น รายงานงบทดลองรายวัน"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">ประเภทรายงาน *</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value) => setFormData({ ...formData, reportType: value })}
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="เลือกประเภทรายงาน" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule">กำหนดการ *</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger id="schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">เวลา *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {formData.schedule === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">วัน *</Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.schedule === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">วันที่ *</Label>
                <Select
                  value={formData.dayOfMonth.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfMonth: parseInt(value) })
                  }
                >
                  <SelectTrigger id="dayOfMonth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.schedule === 'quarterly' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthOfYear">เดือน *</Label>
                  <Select
                    value={formData.monthOfYear.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, monthOfYear: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="monthOfYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarterDayOfMonth">วันที่ *</Label>
                  <Select
                    value={formData.dayOfMonth.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dayOfMonth: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="quarterDayOfMonth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outputFormat">รูปแบบไฟล์ *</Label>
                <Select
                  value={formData.outputFormat}
                  onValueChange={(value: 'PDF' | 'EXCEL') =>
                    setFormData({ ...formData, outputFormat: value })
                  }
                >
                  <SelectTrigger id="outputFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EXCEL">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enabled">สถานะ</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    {formData.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">อีเมลผู้รับ *</Label>
              <Input
                id="recipients"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                คั่นด้วยจุลภาค (,) หากมีหลายอีเมล
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSubject">หัวข้ออีเมล</Label>
              <Input
                id="emailSubject"
                value={formData.emailSubject}
                onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                placeholder="เช่น รายงานงบทดลองประจำวัน"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailBody">เนื้อหาอีเมล</Label>
              <Textarea
                id="emailBody"
                value={formData.emailBody}
                onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                placeholder="เนื้อหาอีเมลที่จะส่งพร้อมไฟล์รายงาน"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก
                </>
              ) : (
                'บันทึก'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run History Dialog */}
      <Dialog open={!!viewingRuns} onOpenChange={() => setViewingRuns(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติการรัน</DialogTitle>
            <DialogDescription>
              {viewingRuns?.name} - รายการทั้งหมด {runHistory.length} ครั้ง
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {runHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่มีประวัติการรัน
              </div>
            ) : (
              runHistory.map((run) => (
                <div
                  key={run.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatThaiDate(new Date(run.runAt))}
                      </span>
                    </div>
                    {run.errorMessage && (
                      <p className="text-sm text-destructive">{run.errorMessage}</p>
                    )}
                    {run.generatedRecords && (
                      <p className="text-xs text-muted-foreground">
                        {run.generatedRecords} รายการ • {formatFileSize(run.fileSize)}
                      </p>
                    )}
                  </div>
                  {run.fileUrl && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRuns(null)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
