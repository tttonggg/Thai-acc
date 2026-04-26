'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FileText,
  Download,
  Eye,
  Save,
  Loader2,
  Settings,
  Filter,
  Columns,
  Calendar,
  FileOutput,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Report configuration schema
const customReportSchema = z.object({
  reportType: z.enum([
    'TRIAL_BALANCE',
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'AGING_AR',
    'AGING_AP',
    'STOCK_REPORT',
  ]),
  reportName: z.string().min(1, 'กรุณาระบุชื่อรายงาน'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  comparePrevious: z.boolean().default(false),
  includeZeroBalances: z.boolean().default(false),
  accountLevel: z.enum(['detail', 'summary']).default('detail'),
  columnAccountCode: z.boolean().default(true),
  columnAccountName: z.boolean().default(true),
  columnAccountNameEn: z.boolean().default(false),
  columnOpeningBalance: z.boolean().default(false),
  columnDebits: z.boolean().default(true),
  columnCredits: z.boolean().default(true),
  columnClosingBalance: z.boolean().default(true),
  columnBudget: z.boolean().default(false),
  columnVariance: z.boolean().default(false),
  filterAccountType: z.string().optional(),
  filterAccountFrom: z.string().optional(),
  filterAccountTo: z.string().optional(),
  outputFormat: z.enum(['preview', 'pdf', 'excel']).default('preview'),
  notes: z.string().optional(),
})

type CustomReportForm = z.infer<typeof customReportSchema>

const reportTypes = [
  { value: 'TRIAL_BALANCE', label: 'งบทดลอง', icon: FileText },
  { value: 'BALANCE_SHEET', label: 'งบดุลการเงิน', icon: FileText },
  { value: 'INCOME_STATEMENT', label: 'งบกำไรขาดทุน', icon: FileText },
  { value: 'AGING_AR', label: 'รายงานลูกหนี้เก่า', icon: FileText },
  { value: 'AGING_AP', label: 'รายงานเจ้าหนี้เก่า', icon: FileText },
  { value: 'STOCK_REPORT', label: 'รายงานสต็อก', icon: FileText },
]

const accountTypes = [
  { value: 'ASSET', label: 'สินทรัพย์ (Assets)' },
  { value: 'LIABILITY', label: 'หนี้สิน (Liabilities)' },
  { value: 'EQUITY', label: 'ทุน (Equity)' },
  { value: 'REVENUE', label: 'รายได้ (Revenue)' },
  { value: 'EXPENSE', label: 'ค่าใช้จ่าย (Expenses)' },
]

export function CustomReportBuilder() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [reportData, setReportData] = useState<any>(null)
  const { toast } = useToast()

  // Convert Satang to Baht for display
  const formatBaht = (satang: number) => (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const form = useForm<CustomReportForm>({
    resolver: zodResolver(customReportSchema),
    defaultValues: {
      reportType: 'TRIAL_BALANCE',
      reportName: '',
      comparePrevious: false,
      includeZeroBalances: false,
      accountLevel: 'detail',
      columnAccountCode: true,
      columnAccountName: true,
      columnAccountNameEn: false,
      columnOpeningBalance: false,
      columnDebits: true,
      columnCredits: true,
      columnClosingBalance: true,
      columnBudget: false,
      columnVariance: false,
      outputFormat: 'preview',
    },
  })

  const selectedReportType = form.watch('reportType')
  const outputFormat = form.watch('outputFormat')

  // Update report name based on type
  useEffect(() => {
    const reportType = reportTypes.find((r) => r.value === selectedReportType)
    if (reportType && !form.getValues('reportName')) {
      form.setValue('reportName', `${reportType.label} - ${new Date().toLocaleDateString('th-TH')}`)
    }
  }, [selectedReportType, form])

  const handleGenerate = async (data: CustomReportForm) => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/reports/custom`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถสร้างรายงานได้')
      }

      if (data.outputFormat === 'preview') {
        // Show preview in dialog
        setReportData(result.data)
      } else {
        // Download file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.reportName}.${data.outputFormat === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'ส่งออกรายงานสำเร็จ',
          description: `ดาวน์โหลด ${data.reportName} เรียบร้อยแล้ว`,
        })
      }
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างรายงานได้',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'กรุณาระบุชื่อเทมเพลต',
        description: 'ต้องระบุชื่อเทมเพลตก่อนบันทึก',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const config = form.getValues()
      const response = await fetch(`/api/reports/templates`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          config,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถบันทึกเทมเพลตได้')
      }

      toast({
        title: 'บันทึกเทมเพลตสำเร็จ',
        description: `บันทึก ${templateName} เรียบร้อยแล้ว`,
      })

      setShowTemplateDialog(false)
      setTemplateName('')
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกเทมเพลตได้',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            สร้างรายงานแบบกำหนดเอง
          </h1>
          <p className="text-gray-500 mt-1">สร้างรายงานตามความต้องการของคุณ</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowTemplateDialog(true)}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          บันทึกเป็นเทมเพลต
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleGenerate)}>
        {/* Report Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ประเภทรายงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedReportType === type.value
                        ? 'ring-2 ring-blue-600 bg-blue-50'
                        : ''
                    }`}
                    onClick={() => form.setValue('reportType', type.value as any)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedReportType === type.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-gray-500">
                            {type.value.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="mt-4">
              <Label htmlFor="reportName">ชื่อรายงาน</Label>
              <Input
                id="reportName"
                {...form.register('reportName')}
                placeholder="ระบุชื่อรายงาน"
                className="mt-1"
              />
              {form.formState.errors.reportName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.reportName.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ตัวเลือกข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">จากวันที่</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  {...form.register('dateFrom')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">ถึงวันที่</Label>
                <Input
                  id="dateTo"
                  type="date"
                  {...form.register('dateTo')}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comparePrevious"
                  checked={form.watch('comparePrevious')}
                  onCheckedChange={(checked) =>
                    form.setValue('comparePrevious', checked as boolean)
                  }
                />
                <Label htmlFor="comparePrevious" className="cursor-pointer">
                  เปรียบเทียบกับงวดก่อนหน้า
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeZeroBalances"
                  checked={form.watch('includeZeroBalances')}
                  onCheckedChange={(checked) =>
                    form.setValue('includeZeroBalances', checked as boolean)
                  }
                />
                <Label htmlFor="includeZeroBalances" className="cursor-pointer">
                  รวมบัญชีที่มียอดเป็นศูนย์
                </Label>
              </div>

              <div>
                <Label htmlFor="accountLevel">ระดับบัญชี</Label>
                <Select
                  value={form.watch('accountLevel')}
                  onValueChange={(value) =>
                    form.setValue('accountLevel', value as 'detail' | 'summary')
                  }
                >
                  <SelectTrigger id="accountLevel" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detail">รายละเอียด (Detail)</SelectItem>
                    <SelectItem value="summary">สรุป (Summary)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5" />
              เลือกคอลัมน์ที่ต้องการแสดง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnAccountCode"
                  checked={form.watch('columnAccountCode')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnAccountCode', checked as boolean)
                  }
                />
                <Label htmlFor="columnAccountCode" className="cursor-pointer">
                  รหัสบัญชี
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnAccountName"
                  checked={form.watch('columnAccountName')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnAccountName', checked as boolean)
                  }
                />
                <Label htmlFor="columnAccountName" className="cursor-pointer">
                  ชื่อบัญชี (ไทย)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnAccountNameEn"
                  checked={form.watch('columnAccountNameEn')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnAccountNameEn', checked as boolean)
                  }
                />
                <Label htmlFor="columnAccountNameEn" className="cursor-pointer">
                  ชื่อบัญชี (อังกฤษ)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnOpeningBalance"
                  checked={form.watch('columnOpeningBalance')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnOpeningBalance', checked as boolean)
                  }
                />
                <Label htmlFor="columnOpeningBalance" className="cursor-pointer">
                  ยอดยกมา
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnDebits"
                  checked={form.watch('columnDebits')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnDebits', checked as boolean)
                  }
                />
                <Label htmlFor="columnDebits" className="cursor-pointer">
                  เดบิต
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnCredits"
                  checked={form.watch('columnCredits')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnCredits', checked as boolean)
                  }
                />
                <Label htmlFor="columnCredits" className="cursor-pointer">
                  เครดิต
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnClosingBalance"
                  checked={form.watch('columnClosingBalance')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnClosingBalance', checked as boolean)
                  }
                />
                <Label htmlFor="columnClosingBalance" className="cursor-pointer">
                  ยอดเหลือ
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnBudget"
                  checked={form.watch('columnBudget')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnBudget', checked as boolean)
                  }
                />
                <Label htmlFor="columnBudget" className="cursor-pointer">
                  งบประมาณ
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="columnVariance"
                  checked={form.watch('columnVariance')}
                  onCheckedChange={(checked) =>
                    form.setValue('columnVariance', checked as boolean)
                  }
                />
                <Label htmlFor="columnVariance" className="cursor-pointer">
                  ผลต่าง
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ตัวกรองข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Type Filter */}
            <div>
              <Label htmlFor="filterAccountType">ประเภทบัญชี</Label>
              <Select
                value={form.watch('filterAccountType')}
                onValueChange={(value) => form.setValue('filterAccountType', value)}
              >
                <SelectTrigger id="filterAccountType" className="mt-1">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">ทั้งหมด</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterAccountFrom">จากรหัสบัญชี</Label>
                <Input
                  id="filterAccountFrom"
                  placeholder="เช่น 1000"
                  {...form.register('filterAccountFrom')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="filterAccountTo">ถึงรหัสบัญชี</Label>
                <Input
                  id="filterAccountTo"
                  placeholder="เช่น 1999"
                  {...form.register('filterAccountTo')}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="เพิ่มหมายเหตุสำหรับรายงานนี้..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Output Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              รูปแบบ输出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div
                className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${
                  outputFormat === 'preview'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => form.setValue('outputFormat', 'preview')}
              >
                <Checkbox
                  id="outputPreview"
                  checked={outputFormat === 'preview'}
                  onChange={() => form.setValue('outputFormat', 'preview')}
                />
                <Eye className="h-5 w-5" />
                <Label htmlFor="outputPreview" className="cursor-pointer">
                  แสดงตัวอย่างบนหน้าจอ
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${
                  outputFormat === 'pdf'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => form.setValue('outputFormat', 'pdf')}
              >
                <Checkbox
                  id="outputPdf"
                  checked={outputFormat === 'pdf'}
                  onChange={() => form.setValue('outputFormat', 'pdf')}
                />
                <FileText className="h-5 w-5" />
                <Label htmlFor="outputPdf" className="cursor-pointer">
                  PDF
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-all ${
                  outputFormat === 'excel'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => form.setValue('outputFormat', 'excel')}
              >
                <Checkbox
                  id="outputExcel"
                  checked={outputFormat === 'excel'}
                  onChange={() => form.setValue('outputFormat', 'excel')}
                />
                <FileText className="h-5 w-5" />
                <Label htmlFor="outputExcel" className="cursor-pointer">
                  Excel
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังสร้างรายงาน...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                สร้างรายงาน
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกเป็นเทมเพลต</DialogTitle>
            <DialogDescription>
              บันทึกการตั้งค่ารายงานนี้เพื่อใช้งานในภายหลัง
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="templateName">ชื่อเทมเพลต</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="เช่น งบทดลองรายเดือน"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label>การตั้งค่าที่จะบันทึก</Label>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• ประเภทรายงาน: {reportTypes.find((r) => r.value === selectedReportType)?.label}</p>
                <p>• คอลัมน์ที่เลือก: {[
                  form.watch('columnAccountCode') && 'รหัสบัญชี',
                  form.watch('columnAccountName') && 'ชื่อบัญชี',
                  form.watch('columnDebits') && 'เดบิต',
                  form.watch('columnCredits') && 'เครดิต',
                ].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  บันทึกเทมเพลต
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      {reportData && (
        <Dialog open={!!reportData} onOpenChange={() => setReportData(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{form.getValues('reportName')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Report Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">รวมเดบิต</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ฿{reportData.totals?.debit !== undefined ? formatBaht(reportData.totals.debit) : '0.00'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">รวมเครดิต</p>
                    <p className="text-2xl font-bold text-green-600">
                      ฿{reportData.totals?.credit !== undefined ? formatBaht(reportData.totals.credit) : '0.00'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">สถานะ</p>
                    <p className="text-2xl font-bold">
                      {reportData.totals?.isBalanced ? (
                        <span className="text-green-600">สมดุล</span>
                      ) : (
                        <span className="text-red-600">ไม่สมดุล</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Report Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {form.watch('columnAccountCode') && (
                        <th className="text-left py-2 px-4">รหัสบัญชี</th>
                      )}
                      {form.watch('columnAccountName') && (
                        <th className="text-left py-2 px-4">ชื่อบัญชี</th>
                      )}
                      {form.watch('columnDebits') && (
                        <th className="text-right py-2 px-4">เดบิต</th>
                      )}
                      {form.watch('columnCredits') && (
                        <th className="text-right py-2 px-4">เครดิต</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.accounts?.map((account: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {form.watch('columnAccountCode') && (
                          <td className="py-2 px-4 font-mono">{account.code}</td>
                        )}
                        {form.watch('columnAccountName') && (
                          <td className="py-2 px-4">{account.name}</td>
                        )}
                        {form.watch('columnDebits') && (
                          <td className="py-2 px-4 text-right text-blue-600">
                            {account.debit > 0 ? `฿${formatBaht(account.debit)}` : '-'}
                          </td>
                        )}
                        {form.watch('columnCredits') && (
                          <td className="py-2 px-4 text-right text-green-600">
                            {account.credit > 0 ? `฿${formatBaht(account.credit)}` : '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReportData(null)}>
                ปิด
              </Button>
              <Button onClick={() => {
                const data = form.getValues()
                form.setValue('outputFormat', 'pdf')
                handleGenerate(data)
              }}>
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
