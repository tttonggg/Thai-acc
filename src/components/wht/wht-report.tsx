'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Printer,
  Calculator
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface WhtRecord {
  id: string
  date: string
  docNo: string
  name: string
  income: number
  rate: number
  tax: number
  incomeType?: string
}

interface WhtReport {
  pnd3Records: WhtRecord[]
  pnd53Records: WhtRecord[]
}

export function WhtReport() {
  const [selectedMonth, setSelectedMonth] = useState('6')
  const [selectedYear, setSelectedYear] = useState('2567')
  const [selectedType, setSelectedType] = useState('pnd53')
  const [data, setData] = useState<WhtReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchWhtReport = async () => {
      setLoading(true)
      setError(null)
      try {
        const month = parseInt(selectedMonth)
        const year = parseInt(selectedYear)
        const gregorianYear = year - 543
        const startDate = new Date(gregorianYear, month - 1, 1)
        const endDate = new Date(gregorianYear, month, 0)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        const res = await fetch(`/api/reports/wht?type=${selectedType.toUpperCase()}&startDate=${startDateStr}&endDate=${endDateStr}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Fetch failed')
        const json = await res.json()
        setData(json)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล'
        setError(message)
        toast({
          title: 'ข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchWhtReport()
  }, [selectedMonth, selectedYear, selectedType, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>ไม่พบข้อมูล</AlertDescription>
      </Alert>
    )
  }

  // Safely handle undefined/null arrays from API response
  const pnd3Records = data.pnd3Records || []
  const pnd53Records = data.pnd53Records || []

  const totalPnd3 = pnd3Records.reduce((sum, r) => sum + (r.tax || 0), 0)
  const totalPnd53 = pnd53Records.reduce((sum, r) => sum + (r.tax || 0), 0)

  // Convert Satang to Baht for display
  const formatBaht = (satang: number) => (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน']
    const monthName = monthNames[parseInt(selectedMonth) - 1] || selectedMonth

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>รายงานภาษีหัก ณ ที่จ่าย</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; }
          h2 { font-size: 16px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; }
          .text-right { text-align: right; }
          .total { font-weight: bold; }
          .section { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>รายงานภาษีหัก ณ ที่จ่าย</h1>
        <p style="text-align: center;">ประจำเดือน ${monthName} พ.ศ. ${selectedYear}</p>
        
        <div class="summary">
          <h3>สรุปภาษีหัก ณ ที่จ่าย</h3>
          <p>ภงด.3 (เงินเดือน/ค่าจ้าง): ${formatBaht(totalPnd3)} บาท (${pnd3Records.length} รายการ)</p>
          <p>ภงด.53 (ค่าบริการ/ค่าเช่า): ${formatBaht(totalPnd53)} บาท (${pnd53Records.length} รายการ)</p>
          <p class="total">รวมภาษีหัก ณ ที่จ่ายทั้งหมด: ${formatBaht(totalPnd3 + totalPnd53)} บาท</p>
        </div>

        <div class="section">
          <h2>รายการภงด.3 (เงินเดือน/ค่าจ้าง)</h2>
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เลขที่เอกสาร</th>
                <th>ชื่อผู้รับเงิน</th>
                <th>ประเภทเงินได้</th>
                <th class="text-right">อัตรา%</th>
                <th class="text-right">ภาษีที่หัก</th>
              </tr>
            </thead>
            <tbody>
              ${pnd3Records.map(r => `
                <tr>
                  <td>${new Date(r.date).toLocaleDateString('th-TH')}</td>
                  <td>${r.docNo}</td>
                  <td>${r.name}</td>
                  <td>${r.incomeType || '-'}</td>
                  <td class="text-right">${r.rate}%</td>
                  <td class="text-right">${formatBaht(r.tax || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>รายการภงด.53 (ค่าบริการ/ค่าเช่า/อื่นๆ)</h2>
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เลขที่เอกสาร</th>
                <th>ชื่อผู้รับเงิน</th>
                <th>ประเภทเงินได้</th>
                <th class="text-right">อัตรา%</th>
                <th class="text-right">ภาษีที่หัก</th>
              </tr>
            </thead>
            <tbody>
              ${pnd53Records.map(r => `
                <tr>
                  <td>${new Date(r.date).toLocaleDateString('th-TH')}</td>
                  <td>${r.docNo}</td>
                  <td>${r.name}</td>
                  <td>${r.incomeType || '-'}</td>
                  <td class="text-right">${r.rate}%</td>
                  <td class="text-right">${formatBaht(r.tax || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ภาษีหัก ณ ที่จ่าย</h1>
          <p className="text-gray-500 mt-1">รายงานภาษีเงินได้หัก ณ ที่จ่าย (ภงด.3, ภงด.53)</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">มกราคม</SelectItem>
              <SelectItem value="2">กุมภาพันธ์</SelectItem>
              <SelectItem value="3">มีนาคม</SelectItem>
              <SelectItem value="4">เมษายน</SelectItem>
              <SelectItem value="5">พฤษภาคม</SelectItem>
              <SelectItem value="6">มิถุนายน</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2567">2567</SelectItem>
              <SelectItem value="2566">2566</SelectItem>
              <SelectItem value="2565">2565</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ภงด.3 (เงินเดือน/ค่าจ้าง)</p>
                <p className="text-2xl font-bold text-purple-600">฿{formatBaht(totalPnd3)}</p>
                <p className="text-xs text-gray-400">{pnd3Records.length} รายการ</p>
              </div>
              <FileText className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ภงด.53 (ค่าบริการ/ค่าเช่า)</p>
                <p className="text-2xl font-bold text-teal-600">฿{formatBaht(totalPnd53)}</p>
                <p className="text-xs text-gray-400">{pnd53Records.length} รายการ</p>
              </div>
              <FileText className="h-10 w-10 text-teal-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">รวมภาษีที่ต้องยื่น</p>
                <p className="text-2xl font-bold text-red-600">฿{formatBaht(totalPnd3 + totalPnd53)}</p>
                <p className="text-xs text-gray-400">{pnd3Records.length + pnd53Records.length} รายการ</p>
              </div>
              <Calculator className="h-10 w-10 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="pnd53">ภงด.53 - ค่าบริการ/ค่าเช่า</TabsTrigger>
          <TabsTrigger value="pnd3">ภงด.3 - เงินเดือน/ค่าจ้าง</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pnd53">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียด ภงด.53</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เลขที่หนังสือรับรอง</TableHead>
                    <TableHead>ผู้ถูกหักภาษี</TableHead>
                    <TableHead>ประเภทเงินได้</TableHead>
                    <TableHead className="text-right">จำนวนเงินที่จ่าย</TableHead>
                    <TableHead className="text-center">อัตราภาษี</TableHead>
                    <TableHead className="text-right">ภาษีที่หัก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnd53Records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-mono">{record.docNo}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.incomeType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">฿{formatBaht(record.income || 0)}</TableCell>
                      <TableCell className="text-center">{record.rate}%</TableCell>
                      <TableCell className="text-right text-teal-600 font-semibold">฿{formatBaht(record.tax || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-teal-50">
                    <TableCell colSpan={4} className="font-semibold">รวม</TableCell>
                    <TableCell className="text-right font-semibold">฿{formatBaht(pnd53Records.reduce((s, r) => s + (r.income || 0), 0))}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-semibold text-teal-600">฿{formatBaht(totalPnd53)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pnd3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียด ภงด.3</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เลขที่หนังสือรับรอง</TableHead>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead className="text-right">เงินได้</TableHead>
                    <TableHead className="text-center">อัตราภาษี</TableHead>
                    <TableHead className="text-right">ภาษีที่หัก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnd3Records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-mono">{record.docNo}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell className="text-right">฿{formatBaht(record.income || 0)}</TableCell>
                      <TableCell className="text-center">{record.rate}%</TableCell>
                      <TableCell className="text-right text-purple-600 font-semibold">฿{formatBaht(record.tax || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-purple-50">
                    <TableCell colSpan={3} className="font-semibold">รวม</TableCell>
                    <TableCell className="text-right font-semibold">฿{formatBaht(pnd3Records.reduce((s, r) => s + (r.income || 0), 0))}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">฿{formatBaht(totalPnd3)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
