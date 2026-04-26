'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  CheckCircle,
  Loader2,
  Calendar,
  Filter,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatThaiDate } from '@/lib/thai-accounting'

interface DataType {
  key: string
  label: string
  description: string
}

interface ExportHistory {
  id: string
  timestamp: Date
  dataTypes: string[]
  format: string
  recordCount: number
  fileSize: number
}

const DATA_TYPES: DataType[] = [
  { key: 'customers', label: 'ลูกค้า', description: 'ข้อมูลลูกหนี้/ลูกค้า' },
  { key: 'vendors', label: 'เจ้าหนี้', description: 'ข้อมูลเจ้าหนี้/เจ้าหนี้จ่าย' },
  { key: 'products', label: 'สินค้า', description: 'ข้อมูลสินค้าและบริการ' },
  { key: 'accounts', label: 'ผังบัญชี', description: 'ผังบัญชีทั้งหมด' },
  { key: 'invoices', label: 'ใบกำกับภาษี', description: 'ใบกำกับภาษีขาย' },
  { key: 'receipts', label: 'ใบเสร็จรับเงิน', description: 'ใบเสร็จรับเงิน' },
]

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: FileText, description: 'ไฟล์ CSV สำหรับเปิดใน Excel' },
  { value: 'json', label: 'JSON', icon: FileJson, description: 'ไฟล์ JSON สำหรับนำเข้าระบบ' },
]

export function DataExportPage() {
  const { toast } = useToast()
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetchExportHistory()
  }, [])

  const fetchExportHistory = async () => {
    setLoadingHistory(true)
    try {
      // Simulate loading history (in real app, this would come from API)
      setExportHistory([])
    } catch (error) {
      console.error('Failed to fetch export history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDataTypeToggle = (key: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    if (selectedDataTypes.length === DATA_TYPES.length) {
      setSelectedDataTypes([])
    } else {
      setSelectedDataTypes(DATA_TYPES.map(d => d.key))
    }
  }

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      toast({
        title: "กรุณาเลือกข้อมูล",
        description: "กรุณาเลือกอย่างน้อย 1 ประเภทข้อมูลที่ต้องการส่งออก",
        variant: "destructive",
      })
      return
    }

    setExporting(true)
    try {
      const response = await fetch(`/api/admin/export`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataTypes: selectedDataTypes,
          format: exportFormat,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          includeDeleted,
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        const timestamp = new Date().toISOString().split('T')[0]
        const ext = exportFormat === 'csv' ? 'csv' : 'json'
        a.download = `thai-erp-export-${timestamp}.${ext}`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "ส่งออกสำเร็จ",
          description: `ส่งออกข้อมูล ${selectedDataTypes.length} ประเภท เรียบร้อยแล้ว`,
        })

        // Add to history
        const newHistory: ExportHistory = {
          id: Date.now().toString(),
          timestamp: new Date(),
          dataTypes: selectedDataTypes,
          format: exportFormat,
          recordCount: 0, // Would come from API
          fileSize: blob.size,
        }
        setExportHistory(prev => [newHistory, ...prev])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      toast({
        title: "ส่งออกไม่สำเร็จ",
        description: error instanceof Error ? error.message : 'ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่',
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getDataTypesLabel = (types: string[]): string => {
    return types.map(t => {
      const dt = DATA_TYPES.find(d => d.key === t)
      return dt?.label || t
    }).join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ส่งออกข้อมูล</h1>
        <p className="text-gray-500 mt-1">ส่งออกข้อมูลระบบเพื่อการวิเคราะห์และสำรองข้อมูล</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>เลือกข้อมูลที่ต้องการส่งออก</CardTitle>
                  <CardDescription>เลือกประเภทข้อมูลที่ต้องการส่งออกจากระบบ</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedDataTypes.length === DATA_TYPES.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DATA_TYPES.map((dataType) => (
                  <div key={dataType.key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={dataType.key}
                      checked={selectedDataTypes.includes(dataType.key)}
                      onCheckedChange={() => handleDataTypeToggle(dataType.key)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={dataType.key} className="font-medium cursor-pointer">
                        {dataType.label}
                      </Label>
                      <p className="text-sm text-gray-500">{dataType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>ตัวเลือกการส่งออก</CardTitle>
              <CardDescription>กำหนดรูปแบบและเงื่อนไขการส่งออก</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Format */}
              <div>
                <Label className="text-sm font-medium">รูปแบบไฟล์</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {EXPORT_FORMATS.map((format) => {
                    const Icon = format.icon
                    return (
                      <div
                        key={format.value}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          exportFormat === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setExportFormat(format.value as 'csv' | 'json')}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 ${exportFormat === format.value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium">{format.label}</p>
                            <p className="text-xs text-gray-500">{format.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium">ช่วงวันที่ (ไม่ระบุ = ทั้งหมด)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-gray-500">ตั้งแต่</Label>
                    <input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-gray-500">ถึง</Label>
                    <input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Include Deleted Records */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDeleted"
                  checked={includeDeleted}
                  onCheckedChange={(checked) => setIncludeDeleted(checked as boolean)}
                />
                <Label htmlFor="includeDeleted" className="cursor-pointer">
                  รวมรายการที่ถูกลบ
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                onClick={handleExport}
                disabled={exporting || selectedDataTypes.length === 0}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    กำลังส่งออก...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    ส่งออกข้อมูล ({selectedDataTypes.length} ประเภท)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export History */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Database className="h-4 w-4 mr-2" />
                ประวัติการส่งออก
              </CardTitle>
              <CardDescription>การส่งออกล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : exportHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  ยังไม่มีประวัติการส่งออก
                </div>
              ) : (
                <div className="space-y-3">
                  {exportHistory.slice(0, 10).map((history) => (
                    <div key={history.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {history.format.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatThaiDate(history.timestamp)}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {history.recordCount} รายการ
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate flex-1">
                          {getDataTypesLabel(history.dataTypes)}
                        </span>
                        <span>{formatFileSize(history.fileSize)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
