'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  PieChart,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const reports = [
  { id: 'trial_balance', name: 'งบทดลอง', icon: BarChart3, description: 'แสดงยอดเดบิตและเครดิตของแต่ละบัญชี' },
  { id: 'balance_sheet', name: 'งบดุล', icon: PieChart, description: 'แสดงสินทรัพย์ หนี้สิน และทุน' },
  { id: 'income_statement', name: 'งบกำไรขาดทุน', icon: TrendingUp, description: 'แสดงรายได้และค่าใช้จ่าย' },
  { id: 'general_ledger', name: 'สมุดบัญชีแยกประเภท', icon: FileText, description: 'รายการบัญชีแยกตามบัญชี' },
  { id: 'aging_ar', name: 'รายงานลูกหนี้ตามอายุหนี้', icon: PieChart, description: 'จำแนกลูกหนี้ตามอายุหนี้' },
  { id: 'aging_ap', name: 'รายงานเจ้าหนี้ตามอายุหนี้', icon: PieChart, description: 'จำแนกเจ้าหนี้ตามอายุหนี้' },
  { id: 'vat_report', name: 'รายงานภาษีมูลค่าเพิ่ม', icon: FileText, description: 'รายงานภาษีขาย-ภาษีซื้อ' },
  { id: 'wht_report', name: 'รายงานภาษีหัก ณ ที่จ่าย', icon: FileText, description: 'รายงาน ภงด.3, ภงด.53' },
]

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [exportingReport, setExportingReport] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExport = async (reportId: string, format: 'pdf' | 'excel') => {
    setExportingReport(reportId)
    try {
      let url = ''
      let filename = ''

      switch (reportId) {
        case 'trial_balance':
          url = `/api/reports/trial-balance/export/${format}`
          filename = `trial-balance-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'balance_sheet':
          url = `/api/reports/balance-sheet/export/${format}`
          filename = `balance-sheet-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'income_statement':
          url = `/api/reports/income-statement/export/${format}`
          filename = `income-statement-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'general_ledger':
          url = `/api/reports/general-ledger/export/${format}`
          filename = `general-ledger.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'aging_ar':
          url = `/api/reports/aging-ar/export/${format}`
          filename = `ar-aging.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'aging_ap':
          url = `/api/reports/aging-ap/export/${format}`
          filename = `ap-aging.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'vat_report':
          url = `/api/reports/vat/export/${format}`
          filename = `vat-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        case 'wht_report':
          url = `/api/reports/wht/export/${format}`
          filename = `wht-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
          break
        default:
          throw new Error('Unknown report type')
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'ดาวน์โหลดรายงานเรียบร้อยแล้ว'
      })
    } catch (error) {
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    } finally {
      setExportingReport(null)
    }
  }

  const handlePrint = (reportId: string) => {
    const url = `/api/reports/${reportId}/export/pdf`
    const win = window.open(url, '_blank')
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 1000)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายงาน</h1>
          <p className="text-gray-500 mt-1">รายงานทางการเงินและบัญชี</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
              <SelectItem value="custom">กำหนดเอง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePrint(report.id)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    พิมพ์
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleExport(report.id, 'excel')}
                    disabled={exportingReport === report.id}
                  >
                    {exportingReport === report.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        กำลังส่งออก...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออก
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Preview - Trial Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">งบทดลอง - ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">รหัสบัญชี</th>
                  <th className="text-left py-2 px-4">ชื่อบัญชี</th>
                  <th className="text-right py-2 px-4">เดบิต</th>
                  <th className="text-right py-2 px-4">เครดิต</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono">1111</td>
                  <td className="py-2 px-4">เงินสด - ธนาคารกรุงเทพ</td>
                  <td className="py-2 px-4 text-right text-blue-600">฿500,000.00</td>
                  <td className="py-2 px-4 text-right">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono">1121</td>
                  <td className="py-2 px-4">ลูกหนี้การค้า</td>
                  <td className="py-2 px-4 text-right text-blue-600">฿250,000.00</td>
                  <td className="py-2 px-4 text-right">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono">211</td>
                  <td className="py-2 px-4">เจ้าหนี้การค้า</td>
                  <td className="py-2 px-4 text-right">-</td>
                  <td className="py-2 px-4 text-right text-green-600">฿180,000.00</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono">311</td>
                  <td className="py-2 px-4">ทุนจดทะเบียน</td>
                  <td className="py-2 px-4 text-right">-</td>
                  <td className="py-2 px-4 text-right text-green-600">฿1,000,000.00</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono">411</td>
                  <td className="py-2 px-4">รายได้จากการขาย</td>
                  <td className="py-2 px-4 text-right">-</td>
                  <td className="py-2 px-4 text-right text-green-600">฿450,000.00</td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-2 px-4" colSpan={2}>รวม</td>
                  <td className="py-2 px-4 text-right text-blue-600">฿750,000.00</td>
                  <td className="py-2 px-4 text-right text-green-600">฿1,630,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
