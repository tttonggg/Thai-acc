'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileUpload } from '@/components/ui/file-upload'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DataType = 'customers' | 'vendors' | 'products' | 'accounts'

interface ImportPreview {
  action: 'create' | 'update' | 'error'
  data?: any
  error?: string
}

interface ImportResult {
  success: boolean
  dryRun?: boolean
  totalRecords: number
  validCount?: number
  errorCount?: number
  created?: number
  updated?: number
  errors?: number
  preview?: ImportPreview[]
  importErrors?: Array<{ row: number; error: string; data?: any }>
}

interface ImportHistory {
  id: string
  dataType: string
  fileName: string
  fileType: string
  totalRecords: number
  createdCount: number
  updatedCount: number
  errorCount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  createdAt: string
  importedBy?: {
    name: string
    email: string
  }
}

const dataTypeLabels: Record<DataType, string> = {
  customers: 'ลูกค้า (Customers)',
  vendors: 'ผู้ขาย (Vendors)',
  products: 'สินค้า (Products)',
  accounts: 'ผังบัญชี (Chart of Accounts)',
}

const dataTypeExamples: Record<DataType, string> = {
  customers: 'code,name,taxId,address,phone,email\nC001,บริษัท ก. จำกัด,1234567890123,123 ถ.สุขุมวิท,02-123-4567,contact@example.com',
  vendors: 'code,name,taxId,address,phone,email\nV001,บริษัท ค. จำกัด,9876543210987,456 ถ.พหลโยธิน,02-765-4321,supplier@example.com',
  products: 'code,name,category,unit,salePrice,costPrice,vatRate\nP001,สินค้า A,หมวด A,ชิ้น,100,75,7',
  accounts: 'code,name,type,level,isDetail\n1000,สินทรัพย์,ASSET,1,false',
}

export function DataImportPage() {
  const [dataType, setDataType] = useState<DataType>('customers')
  const [files, setFiles] = useState<File[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(false)
  const [updateExisting, setUpdateExisting] = useState(true)
  const [isDryRun, setIsDryRun] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/import`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setImportHistory(result.data)
      } else {
        setError(result.error || 'ไม่สามารถดึงประวัติการนำเข้าได้')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Load history on mount
  useState(() => {
    loadHistory()
  })

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    setPreviewResult(null)
    setImportResult(null)
    setError(null)
  }

  const handleValidate = async () => {
    if (files.length === 0) {
      setError('กรุณาเลือกไฟล์')
      return
    }

    setIsValidating(true)
    setError(null)
    setPreviewResult(null)

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('dataType', dataType)
      formData.append('skipDuplicates', skipDuplicates.toString())
      formData.append('updateExisting', updateExisting.toString())
      formData.append('dryRun', 'true')

      const response = await fetch(`/api/admin/import`, { credentials: 'include', 
        method: 'POST',
        body: formData,
      })

      const result: ImportResult = await response.json()

      if (result.success) {
        setPreviewResult(result)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการตรวจสอบ')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error(err)
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (files.length === 0) {
      setError('กรุณาเลือกไฟล์')
      return
    }

    setIsImporting(true)
    setError(null)
    setImportResult(null)
    setShowConfirmDialog(false)

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('dataType', dataType)
      formData.append('skipDuplicates', skipDuplicates.toString())
      formData.append('updateExisting', updateExisting.toString())
      formData.append('dryRun', 'false')

      const response = await fetch(`/api/admin/import`, { credentials: 'include', 
        method: 'POST',
        body: formData,
      })

      const result: ImportResult = await response.json()

      if (result.success) {
        setImportResult(result)
        setFiles([])
        setPreviewResult(null)
        // Reload history
        await loadHistory()
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการนำเข้า')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error(err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleConfirmImport = () => {
    setShowConfirmDialog(true)
  }

  const downloadTemplate = () => {
    const csv = dataTypeExamples[dataType]
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${dataType}_template.csv`
    link.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />สำเร็จ</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />ล้มเหลว</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-500">กำลังประมวลผล</Badge>
      default:
        return <Badge variant="outline">รอดำเนินการ</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">นำเข้าข้อมูล</h1>
        <p className="text-muted-foreground mt-2">
          นำเข้าข้อมูลจากไฟล์ CSV หรือ JSON เพื่อเพิ่มหรืออัปเดตข้อมูลในระบบ
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            นำเข้าข้อมูล
          </TabsTrigger>
          <TabsTrigger value="history" onClick={loadHistory}>
            <History className="h-4 w-4 mr-2" />
            ประวัติการนำเข้า
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>เลือกประเภทข้อมูล</CardTitle>
              <CardDescription>
                เลือกประเภทข้อมูลที่ต้องการนำเข้า
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(dataTypeLabels) as DataType[]).map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      dataType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => setDataType(type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{dataTypeLabels[type]}</p>
                        </div>
                        {dataType === type && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>อัปโหลดไฟล์</CardTitle>
              <CardDescription>
                รองรับไฟล์ CSV และ JSON (ขนาดสูงสุด 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                accept=".csv,.json"
                maxSize={5}
                onFileSelect={handleFileSelect}
                label="คลิกหรือลากไฟล์มาวางที่นี่"
                description="รองรับไฟล์ CSV, JSON"
              />

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดไฟล์ตัวอย่าง
                </Button>
                <span className="text-sm text-muted-foreground">
                  ดาวน์โหลดไฟล์ตัวอย่างสำหรับ {dataTypeLabels[dataType]}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle>ตัวเลือกการนำเข้า</CardTitle>
              <CardDescription>
                กำหนดวิธีการจัดการกับข้อมูลที่มีอยู่แล้ว
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dryRun"
                  checked={isDryRun}
                  onCheckedChange={(checked) => setIsDryRun(checked as boolean)}
                />
                <Label htmlFor="dryRun" className="cursor-pointer">
                  โหมดตรวจสอบ (Dry Run) - ตรวจสอบข้อมูลโดยไม่นำเข้าจริง
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  disabled={isDryRun}
                />
                <Label htmlFor="skipDuplicates" className="cursor-pointer">
                  ข้ามรหัสที่มีอยู่แล้ว (Skip Duplicates)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={updateExisting}
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                  disabled={skipDuplicates || isDryRun}
                />
                <Label htmlFor="updateExisting" className="cursor-pointer">
                  อัปเดตข้อมูลที่มีอยู่แล้ว
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleValidate}
              disabled={files.length === 0 || isValidating}
              size="lg"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ตรวจสอบข้อมูล
                </>
              )}
            </Button>

            {!isDryRun && previewResult?.preview && (
              <Button
                onClick={handleConfirmImport}
                disabled={isImporting}
                size="lg"
                variant="default"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    นำเข้าข้อมูล
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Results */}
          {previewResult && previewResult.preview && (
            <Card>
              <CardHeader>
                <CardTitle>ผลการตรวจสอบ</CardTitle>
                <CardDescription>
                  ทั้งหมด {previewResult.totalRecords} รายการ |
                  ถูกต้อง {previewResult.validCount || 0} รายการ |
                  ผิดพลาด {previewResult.errorCount || 0} รายการ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {previewResult.preview.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        item.action === 'error'
                          ? 'bg-red-50 border border-red-200'
                          : item.action === 'update'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      {item.action === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : item.action === 'update' ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        {item.error ? (
                          <p className="text-sm text-red-700">{item.error}</p>
                        ) : (
                          <p className="text-sm font-medium">
                            {item.action === 'create' && 'จะสร้างใหม่: '}
                            {item.action === 'update' && 'จะอัปเดต: '}
                            {item.data?.code || item.data?.name || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle>ผลการนำเข้าข้อมูล</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">ทั้งหมด</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {importResult.totalRecords}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">สร้างใหม่</p>
                      <p className="text-2xl font-bold text-green-700">
                        {importResult.created || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600 font-medium">อัปเดต</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {importResult.updated || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">ผิดพลาด</p>
                      <p className="text-2xl font-bold text-red-700">
                        {importResult.errors || 0}
                      </p>
                    </div>
                  </div>

                  {importResult.success && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        การนำเข้าข้อมูลเสร็จสมบูรณ์!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Dialog */}
          <DeleteConfirmDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
            title="ยืนยันการนำเข้าข้อมูล"
            message={
              previewResult
                ? `คุณต้องการนำเข้าข้อมูล ${previewResult.totalRecords} รายการใช่หรือไม่? การดำเนินการนี้จะเปลี่ยนแปลงข้อมูลในระบบ`
                : 'คุณต้องการนำเข้าข้อมูลใช่หรือไม่?'
            }
            confirmLabel="นำเข้าข้อมูล"
            onConfirm={handleImport}
            loading={isImporting}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการนำเข้าข้อมูล</CardTitle>
              <CardDescription>
                ดูประวัติการนำเข้าข้อมูลทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : importHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่พบประวัติการนำเข้าข้อมูล
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>ชื่อไฟล์</TableHead>
                      <TableHead className="text-right">ทั้งหมด</TableHead>
                      <TableHead className="text-right">สร้าง</TableHead>
                      <TableHead className="text-right">อัปเดต</TableHead>
                      <TableHead className="text-right">ผิดพลาด</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((importItem) => (
                      <TableRow key={importItem.id}>
                        <TableCell className="text-sm">
                          {new Date(importItem.createdAt).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {dataTypeLabels[importItem.dataType as DataType] || importItem.dataType}
                        </TableCell>
                        <TableCell className="text-sm">{importItem.fileName}</TableCell>
                        <TableCell className="text-sm text-right">
                          {importItem.totalRecords}
                        </TableCell>
                        <TableCell className="text-sm text-right text-green-600">
                          {importItem.createdCount}
                        </TableCell>
                        <TableCell className="text-sm text-right text-yellow-600">
                          {importItem.updatedCount}
                        </TableCell>
                        <TableCell className="text-sm text-right text-red-600">
                          {importItem.errorCount}
                        </TableCell>
                        <TableCell>{getStatusBadge(importItem.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
