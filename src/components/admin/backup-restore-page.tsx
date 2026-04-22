'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Upload,
  Trash2,
  Database,
  HardDrive,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatThaiDate } from '@/lib/thai-accounting'

interface Backup {
  filename: string
  path: string
  size: number
  createdAt: string
  modifiedAt: string
  timestamp: string | null
}

interface BackupData {
  backups: Backup[]
  totalBackups: number
  totalSize: number
  lastBackup: string | null
  databaseLocation: string
}

export function BackupRestorePage() {
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const { toast } = useToast()

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/backups`, { credentials: 'include' })
      const result = await response.json()

      if (result.success) {
        setBackupData(result.data)
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลสำรองได้'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true)
      const response = await fetch(`/api/admin/backup`, { credentials: 'include', 
        method: 'POST'
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: 'สร้างข้อมูลสำรองสำเร็จ',
          description: `สร้างข้อมูลสำรอง ${result.data.filename} เรียบร้อยแล้ว`
        })
        await fetchBackups()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างข้อมูลสำรองได้'
      })
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedBackup) return

    try {
      setRestoring(true)
      const response = await fetch(`/api/admin/restore`, { credentials: 'include', 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: selectedBackup.filename })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: 'คืนค่าข้อมูลสำเร็จ',
          description: `คืนค่าข้อมูลจาก ${selectedBackup.filename} เรียบร้อยแล้ว`
        })
        setShowRestoreDialog(false)
        await fetchBackups()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถคืนค่าข้อมูลได้'
      })
    } finally {
      setRestoring(false)
      setSelectedBackup(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedBackup) return

    try {
      const response = await fetch(`/api/admin/backups`, { credentials: 'include', 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: selectedBackup.filename })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: 'ลบข้อมูลสำรองสำเร็จ',
          description: `ลบ ${selectedBackup.filename} เรียบร้อยแล้ว`
        })
        setShowDeleteDialog(false)
        await fetchBackups()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบข้อมูลสำรองได้'
      })
    } finally {
      setSelectedBackup(null)
    }
  }

  const handleDownload = async (backup: Backup) => {
    try {
      const response = await fetch(`/api/admin/backups/download/${backup.filename}`, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('ไม่สามารถดาวน์โหลดไฟล์ได้')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${backup.filename} เรียบร้อยแล้ว`
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดาวน์โหลดไฟล์ได้'
      })
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch(`/api/admin/backups/upload`, { credentials: 'include', 
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'อัปโหลดสำเร็จ',
          description: `อัปโหลด ${uploadFile.name} เรียบร้อยแล้ว`
        })
        setShowUploadDialog(false)
        setUploadFile(null)
        await fetchBackups()
      } else {
        toast({
          variant: 'destructive',
          title: 'เกิดข้อผิดพลาด',
          description: result.error
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปโหลดไฟล์ได้'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">สำรองและคืนค่าข้อมูล</h1>
        <p className="text-gray-600 mt-2">จัดการข้อมูลสำรองของระบบ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ข้อมูลสำรองทั้งหมด</CardTitle>
            <Database className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupData?.totalBackups || 0}</div>
            <p className="text-xs text-gray-600 mt-1">ไฟล์</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ขนาดรวม</CardTitle>
            <HardDrive className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupData?.totalSize.toFixed(2) || '0.00'} MB</div>
            <p className="text-xs text-gray-600 mt-1">ดิสก์ที่ใช้</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สำรองข้อมูลล่าสุด</CardTitle>
            <Clock className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {backupData?.lastBackup ? formatThaiDate(new Date(backupData.lastBackup)) : '-'}
            </div>
            <p className="text-xs text-gray-600 mt-1">วันที่และเวลา</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ตำแหน่งฐานข้อมูล</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate" title={backupData?.databaseLocation}>
              {backupData?.databaseLocation?.split('/').slice(-2).join('/') || '-'}
            </div>
            <p className="text-xs text-gray-600 mt-1">เส้นทางไฟล์</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {creatingBackup ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังสร้าง...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              สร้างข้อมูลสำรอง
            </>
          )}
        </Button>

        <Button
          onClick={() => setShowUploadDialog(true)}
          variant="outline"
        >
          <Upload className="w-4 h-4 mr-2" />
          อัปโหลดข้อมูลสำรอง
        </Button>

        <Button
          onClick={fetchBackups}
          variant="ghost"
          size="icon"
          title="รีเฟรชรายการ"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการข้อมูลสำรอง</CardTitle>
          <CardDescription>
            {backupData?.totalBackups === 0
              ? 'ยังไม่มีข้อมูลสำรอง สร้างข้อมูลสำรองแรกของคุณได้ที่นี่'
              : `แสดง ${backupData?.totalBackups} ข้อมูลสำรอง`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupData?.backups && backupData.backups.length > 0 ? (
            <div className="space-y-4">
              {backupData.backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{backup.filename}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatThaiDate(new Date(backup.createdAt))}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {backup.size.toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownload(backup)}
                      variant="ghost"
                      size="sm"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedBackup(backup)
                        setShowRestoreDialog(true)
                      }}
                      variant="ghost"
                      size="sm"
                      title="คืนค่า"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedBackup(backup)
                        setShowDeleteDialog(true)
                      }}
                      variant="ghost"
                      size="sm"
                      title="ลบ"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">ยังไม่มีข้อมูลสำรอง</p>
              <p className="text-sm mt-2">คลิกปุ่ม "สร้างข้อมูลสำรอง" เพื่อเริ่มต้น</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              ยืนยันการคืนค่าข้อมูล
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                คุณกำลังจะคืนค่าข้อมูลจาก <strong>{selectedBackup?.filename}</strong>
              </p>
              <p className="text-yellow-600 font-medium">
                ⚠️ การดำเนินการนี้จะแทนที่ข้อมูลทั้งหมดในระบบปัจจุบัน
              </p>
              <p className="text-sm text-gray-600">
                ระบบจะสร้างข้อมูลสำรองของข้อมูลปัจจุบันโดยอัตโนมัติก่อนคืนค่า
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRestore()
              }}
              disabled={restoring}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {restoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังคืนค่า...
                </>
              ) : (
                'คืนค่าข้อมูล'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ยืนยันการลบข้อมูลสำรอง
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ <strong>{selectedBackup?.filename}</strong>?
              <br />
              <span className="text-red-600">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบข้อมูลสำรอง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัปโหลดข้อมูลสำรอง</DialogTitle>
            <DialogDescription>
              อัปโหลดไฟล์ข้อมูลสำรอง (.db) เพื่อเพิ่มลงในรายการ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-file">ไฟล์ข้อมูลสำรอง</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".db"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                รองรับไฟล์ .db เท่านั้น
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!uploadFile}
            >
              อัปโหลด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
