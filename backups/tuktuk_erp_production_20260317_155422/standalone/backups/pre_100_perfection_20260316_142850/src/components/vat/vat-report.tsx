'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Printer,
  Calculator,
  TrendingUp,
  TrendingDown
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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

interface VatData {
  month: string
  vatOutput: number
  vatInput: number
  net: number
}

interface VatRecord {
  id: string
  date: string
  docNo: string
  name: string
  amount: number
  vat: number
}

interface VatReport {
  monthlyData: VatData[]
  vatOutputRecords: VatRecord[]
  vatInputRecords: VatRecord[]
}

export function VatReport() {
  const [selectedMonth, setSelectedMonth] = useState('6')
  const [selectedYear, setSelectedYear] = useState('2567')
  const [data, setData] = useState<VatReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVatReport = async () => {
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
        
        const res = await fetch(`/api/reports/vat?startDate=${startDateStr}&endDate=${endDateStr}`)
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
    fetchVatReport()
  }, [selectedMonth, selectedYear, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
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
            <Skeleton className="h-[300px] w-full" />
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

  const vatOutputRecords = data?.vatOutputRecords || []
  const vatInputRecords = data?.vatInputRecords || []
  const totalVatOutput = vatOutputRecords.reduce((sum, r) => sum + r.vat, 0)
  const totalVatInput = vatInputRecords.reduce((sum, r) => sum + r.vat, 0)
  const netVatVal = totalVatOutput - totalVatInput

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ภาษีมูลค่าเพิ่ม (VAT)</h1>
          <p className="text-gray-500 mt-1">รายงานภาษีขายและภาษีซื้อ</p>
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
              <SelectItem value="7">กรกฎาคม</SelectItem>
              <SelectItem value="8">สิงหาคม</SelectItem>
              <SelectItem value="9">กันยายน</SelectItem>
              <SelectItem value="10">ตุลาคม</SelectItem>
              <SelectItem value="11">พฤศจิกายน</SelectItem>
              <SelectItem value="12">ธันวาคม</SelectItem>
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
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก PP30
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ภาษีขาย (Output VAT)</p>
                <p className="text-2xl font-bold text-blue-600">฿{totalVatOutput?.toLocaleString() ?? '0'}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ภาษีซื้อ (Input VAT)</p>
                <p className="text-2xl font-bold text-orange-600">฿{totalVatInput?.toLocaleString() ?? '0'}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ภาษีที่ต้องชำระ</p>
                <p className="text-2xl font-bold text-red-600">
                  ฿{netVatVal?.toLocaleString() ?? '0'}
                </p>
              </div>
              <Calculator className="h-10 w-10 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">กราฟเปรียบเทียบภาษีขาย-ภาษีซื้อ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
              <Tooltip formatter={(value: number) => [`฿${value?.toLocaleString() ?? '0'}`, '']} />
              <Legend />
              <Bar dataKey="vatOutput" name="ภาษีขาย" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vatInput" name="ภาษีซื้อ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายละเอียดภาษีขาย</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">มูลค่าสินค้า/บริการ</TableHead>
                <TableHead className="text-right">ภาษีมูลค่าเพิ่ม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatOutputRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="font-mono">{record.docNo}</TableCell>
                  <TableCell>{record.name}</TableCell>
                  <TableCell className="text-right">฿{record.amount?.toLocaleString() ?? '0'}</TableCell>
                  <TableCell className="text-right text-blue-600 font-semibold">฿{record.vat?.toLocaleString() ?? '0'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-blue-50">
                <TableCell colSpan={3} className="font-semibold">รวม</TableCell>
                <TableCell className="text-right font-semibold">฿{vatOutputRecords.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-blue-600">฿{totalVatOutput?.toLocaleString() ?? '0'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายละเอียดภาษีซื้อ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>ผู้ขาย</TableHead>
                <TableHead className="text-right">มูลค่าสินค้า/บริการ</TableHead>
                <TableHead className="text-right">ภาษีมูลค่าเพิ่ม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatInputRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="font-mono">{record.docNo}</TableCell>
                  <TableCell>{record.name}</TableCell>
                  <TableCell className="text-right">฿{record.amount?.toLocaleString() ?? '0'}</TableCell>
                  <TableCell className="text-right text-orange-600 font-semibold">฿{record.vat?.toLocaleString() ?? '0'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-orange-50">
                <TableCell colSpan={3} className="font-semibold">รวม</TableCell>
                <TableCell className="text-right font-semibold">฿{vatInputRecords.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-orange-600">฿{totalVatInput?.toLocaleString() ?? '0'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
