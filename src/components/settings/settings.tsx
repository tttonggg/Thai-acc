'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Building2,
  FileText,
  Users,
  Database,
  Save,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { useToast } from '@/hooks/use-toast'

interface CompanyInfo {
  name: string
  nameEn: string
  taxId: string
  branchCode: string
  address: string
  subDistrict: string
  district: string
  province: string
  postalCode: string
  phone: string
  fax: string
  email: string
  website: string
  logo?: string
}

export function Settings() {
  const { toast } = useToast()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    nameEn: '',
    taxId: '',
    branchCode: '00000',
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    logo: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch company info on mount
  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch('/api/company')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setCompanyInfo({
            name: data.name || '',
            nameEn: data.nameEn || '',
            taxId: data.taxId || '',
            branchCode: data.branchCode || '00000',
            address: data.address || '',
            subDistrict: data.subDistrict || '',
            district: data.district || '',
            province: data.province || '',
            postalCode: data.postalCode || '',
            phone: data.phone || '',
            fax: data.fax || '',
            email: data.email || '',
            website: data.website || '',
            logo: data.logo || ''
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompanyInfo = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo)
      })
      
      if (response.ok) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "ข้อมูลบริษัทถูกบันทึกเรียบร้อยแล้ว",
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save company info:', error)
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    
    const formData = new FormData()
    formData.append('file', logoFile)
    formData.append('type', 'logo')
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setCompanyInfo(prev => ({ ...prev, logo: data.url }))
        toast({
          title: "อัปโหลดโลโก้สำเร็จ",
          description: "อัปโหลดโลโก้บริษัทเรียบร้อยแล้ว",
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast({
        title: "อัปโหลดโลโก้ไม่สำเร็จ",
        description: "ไม่สามารถอัปโหลดโลโก้ได้ กรุณาลองใหม่",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/backup/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `thai-erp-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      toast({
        title: "ส่งออกไม่สำเร็จ",
        description: "ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่",
        variant: "destructive",
      })
    }
  }

  const handleImportData = async () => {
    if (!importFile) return
    
    setImporting(true)
    try {
      const fileContent = await importFile.text()
      const data = JSON.parse(fileContent)
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "นำเข้าสำเร็จ",
          description: `นำเข้าข้อมูลสำเร็จ: ${data.imported?.accounts || 0} บัญชี, ${data.imported?.customers || 0} ลูกค้า, ${data.imported?.vendors || 0} เจ้าหนี้`,
        })
        setImportFile(null)
        fetchCompanyInfo()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }
    } catch (error) {
      console.error('Failed to import data:', error)
      toast({
        title: "นำเข้าไม่สำเร็จ",
        description: error instanceof Error ? error.message : 'ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์',
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImportFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setImportFile(files[0])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตั้งค่า</h1>
        <p className="text-gray-500 mt-1">จัดการการตั้งค่าระบบ</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            ข้อมูลบริษัท
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            เอกสาร
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            ผู้ใช้งาน
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            สำรองข้อมูล
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลบริษัท</CardTitle>
              <CardDescription>ข้อมูลบริษัทสำหรับแสดงในเอกสาร</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ชื่อบริษัท (ไทย)</Label>
                  <Input 
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>ชื่อบริษัท (อังกฤษ)</Label>
                  <Input 
                    value={companyInfo.nameEn}
                    onChange={(e) => setCompanyInfo({...companyInfo, nameEn: e.target.value})}
                  />
                </div>
                <div>
                  <Label>เลขประจำตัวผู้เสียภาษี</Label>
                  <Input 
                    value={companyInfo.taxId}
                    onChange={(e) => setCompanyInfo({...companyInfo, taxId: e.target.value})}
                  />
                </div>
                <div>
                  <Label>รหัสสาขา</Label>
                  <Input 
                    value={companyInfo.branchCode}
                    onChange={(e) => setCompanyInfo({...companyInfo, branchCode: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>ที่อยู่</Label>
                  <Textarea 
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label>แขวง/ตำบล</Label>
                  <Input 
                    value={companyInfo.subDistrict}
                    onChange={(e) => setCompanyInfo({...companyInfo, subDistrict: e.target.value})}
                  />
                </div>
                <div>
                  <Label>เขต/อำเภอ</Label>
                  <Input 
                    value={companyInfo.district}
                    onChange={(e) => setCompanyInfo({...companyInfo, district: e.target.value})}
                  />
                </div>
                <div>
                  <Label>จังหวัด</Label>
                  <Input 
                    value={companyInfo.province}
                    onChange={(e) => setCompanyInfo({...companyInfo, province: e.target.value})}
                  />
                </div>
                <div>
                  <Label>รหัสไปรษณีย์</Label>
                  <Input 
                    value={companyInfo.postalCode}
                    onChange={(e) => setCompanyInfo({...companyInfo, postalCode: e.target.value})}
                  />
                </div>
                <div>
                  <Label>โทรศัพท์</Label>
                  <Input 
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>โทรสาร</Label>
                  <Input 
                    value={companyInfo.fax}
                    onChange={(e) => setCompanyInfo({...companyInfo, fax: e.target.value})}
                  />
                </div>
                <div>
                  <Label>อีเมล</Label>
                  <Input 
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>เว็บไซต์</Label>
                  <Input 
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveCompanyInfo}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      บันทึกข้อมูล
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>โลโก้บริษัท</CardTitle>
              <CardDescription>อัปโหลดโลโก้สำหรับแสดงในเอกสาร</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : companyInfo.logo ? (
                    <img src={companyInfo.logo} alt="Company logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <FileUpload
                    accept="image/png,image/jpeg,image/jpg"
                    maxSize={2}
                    onFileSelect={handleLogoSelect}
                    label="อัปโหลดโลโก้"
                    description="คลิกเพื่อเลือกไฟล์รูปภาพ"
                  />
                  {logoFile && (
                    <Button 
                      onClick={handleLogoUpload}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      บันทึกโลโก้
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">
                    รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าเลขที่เอกสาร</CardTitle>
              <CardDescription>กำหนดรูปแบบเลขที่เอกสารอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label>ประเภทเอกสาร</Label>
                    <Select defaultValue="invoice">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">ใบกำกับภาษี</SelectItem>
                        <SelectItem value="receipt">ใบเสร็จรับเงิน</SelectItem>
                        <SelectItem value="journal">บันทึกบัญชี</SelectItem>
                        <SelectItem value="payment">ใบจ่ายเงิน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>คำนำหน้า</Label>
                    <Input defaultValue="INV" />
                  </div>
                  <div>
                    <Label>รูปแบบ</Label>
                    <Input defaultValue="INV-{yyyy}-{mm}-{0000}" />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">ตัวอย่าง: <span className="font-mono">INV-2024-01-0001</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>อัตราภาษี</CardTitle>
              <CardDescription>กำหนดอัตราภาษีเริ่มต้น</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>อัตราภาษีมูลค่าเพิ่ม (%)</Label>
                  <Input type="number" defaultValue="7" />
                </div>
                <div>
                  <Label>อัตราภาษีหัก ณ ที่จ่าย - ค่าบริการ (%)</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div>
                  <Label>อัตราภาษีหัก ณ ที่จ่าย - ค่าเช่า (%)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div>
                  <Label>อัตราภาษีหัก ณ ที่จ่าย - เงินเดือน (%)</Label>
                  <Input type="number" defaultValue="3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>จัดการผู้ใช้งาน</CardTitle>
              <CardDescription>เพิ่ม/แก้ไข/ลบผู้ใช้งานระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>จัดการผู้ใช้งานระบบ</p>
                <p className="text-sm mt-2">ไปที่เมนู "จัดการผู้ใช้" เพื่อจัดการผู้ใช้งาน</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>สำรองข้อมูล</CardTitle>
              <CardDescription>สำรองและกู้คืนข้อมูลระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Export Section */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">ส่งออกข้อมูล</p>
                    <p className="text-sm text-gray-500">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกข้อมูล
                  </Button>
                </div>

                {/* Import Section */}
                <div className="p-4 bg-green-50 rounded-lg space-y-4">
                  <div className="flex items-center gap-4">
                    <Upload className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">นำเข้าข้อมูล</p>
                      <p className="text-sm text-gray-500">อัปโหลดไฟล์สำรองเพื่อกู้คืนข้อมูล</p>
                    </div>
                  </div>
                  
                  <FileUpload
                    accept=".json"
                    maxSize={10}
                    onFileSelect={handleImportFileSelect}
                    label="เลือกไฟล์สำรองข้อมูล"
                    description="ไฟล์ JSON ที่ส่งออกจากระบบ"
                    uploadedFileName={importFile?.name}
                  />
                  
                  {importFile && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleImportData}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังนำเข้า...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          นำเข้าข้อมูล
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
