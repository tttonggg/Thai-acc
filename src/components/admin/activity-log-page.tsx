'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText,
  MapPin,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatThaiDate } from '@/lib/thai-accounting'

interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  module: string
  recordId: string | null
  details: any
  ipAddress: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

interface ActivityLogResponse {
  success: boolean
  data: ActivityLogEntry[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const ACTIONS = [
  { value: 'LOGIN', label: 'เข้าสู่ระบบ' },
  { value: 'LOGOUT', label: 'ออกจากระบบ' },
  { value: 'CREATE', label: 'สร้าง' },
  { value: 'UPDATE', label: 'แก้ไข' },
  { value: 'DELETE', label: 'ลบ' },
  { value: 'POST', label: 'ลงบัญชี' },
  { value: 'VIEW', label: 'ดูข้อมูล' },
  { value: 'EXPORT', label: 'ส่งออก' },
]

const MODULES = [
  { value: 'auth', label: 'การยืนยันตัวตน' },
  { value: 'invoices', label: 'ใบกำกับภาษี' },
  { value: 'payments', label: 'ใบจ่ายเงิน' },
  { value: 'receipts', label: 'ใบเสร็จรับเงิน' },
  { value: 'inventory', label: 'สต็อกสินค้า' },
  { value: 'banking', label: 'ธนาคาร' },
  { value: 'assets', label: 'ทรัพย์สินถาวร' },
  { value: 'payroll', label: 'เงินเดือน' },
  { value: 'petty-cash', label: 'เงินสดย่อย' },
  { value: 'journal', label: 'บันทึกบัญชี' },
  { value: 'reports', label: 'รายงาน' },
]

export function ActivityLogPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filters
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, limit, selectedAction, selectedModule, selectedStatus, dateFrom, dateTo])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, page, limit, selectedAction, selectedModule, selectedStatus, dateFrom, dateTo])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedUser && { userId: selectedUser }),
        ...(selectedAction && { action: selectedAction }),
        ...(selectedModule && { module: selectedModule }),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/admin/activity-log?${params}`, { credentials: 'include' })
      const data: ActivityLogResponse = await response.json()

      if (data.success) {
        setLogs(data.data)
        setTotal(data.meta.total)
        setTotalPages(data.meta.totalPages)
      } else {
        throw new Error(data.error || 'Failed to fetch logs')
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
      toast({
        title: 'โหลดข้อมูลไม่สำเร็จ',
        description: 'ไม่สามารถดึงข้อมูลบันทึกกิจกรรมได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedUser('')
    setSelectedAction('')
    setSelectedModule('')
    setSelectedStatus('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedAction && { action: selectedAction }),
        ...(selectedModule && { module: selectedModule }),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/admin/activity-log/export?${params}`, { credentials: 'include' })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'ส่งออกสำเร็จ',
          description: 'ดาวน์โหลดบันทึกกิจกรรมเรียบร้อยแล้ว',
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Failed to export logs:', error)
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: 'ไม่สามารถส่งออกข้อมูลได้',
        variant: 'destructive',
      })
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getActionLabel = (action: string) => {
    const found = ACTIONS.find((a) => a.value === action)
    return found?.label || action
  }

  const getModuleLabel = (module: string) => {
    const found = MODULES.find((m) => m.value === module)
    return found?.label || module
  }

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          สำเร็จ
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        ล้มเหลว
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            บันทึกกิจกรรม
          </h1>
          <p className="text-gray-500 mt-1">ติดตามและตรวจสอบกิจกรรมของผู้ใช้ในระบบ</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 border-blue-300' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            อัตโนมัติ ({autoRefresh ? '30 วินาที' : 'ปิด'})
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                ตัวกรอง
              </CardTitle>
              <CardDescription>กรองและค้นหาบันทึกกิจกรรม</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-1 block">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาตาม Action, Module, ข้อความ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">ประเภทการกระทำ</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">โมดูล</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {MODULES.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">สถานะ</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="success">สำเร็จ</SelectItem>
                  <SelectItem value="failed">ล้มเหลว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">วันที่ตั้งแต่</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">วันที่ถึง</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                ค้นหา
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">รายการกิจกรรม ({total.toLocaleString()})</CardTitle>
              <CardDescription>แสดงผล {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} จาก {total.toLocaleString()} รายการ</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">รายการ/หน้า</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              ไม่พบบันทึกกิจกรรม
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      วันที่/เวลา
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ผู้ใช้
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      การกระทำ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      โมดูล
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatThaiDate(log.createdAt)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleTimeString('th-TH')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {log.user.name || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.user.email}
                              </div>
                              <div className="text-xs text-blue-600">
                                {log.user.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {getModuleLabel(log.module)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            {log.ipAddress || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(log.id)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedRows.has(log.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                      {expandedRows.has(log.id) && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={7} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-3">
                              {log.recordId && (
                                <div>
                                  <span className="text-xs font-semibold text-gray-600 uppercase">Record ID: </span>
                                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {log.recordId}
                                  </span>
                                </div>
                              )}
                              {log.errorMessage && (
                                <div>
                                  <span className="text-xs font-semibold text-red-600 uppercase">Error: </span>
                                  <p className="text-sm text-red-700 mt-1">{log.errorMessage}</p>
                                </div>
                              )}
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div>
                                  <span className="text-xs font-semibold text-gray-600 uppercase">Details: </span>
                                  <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                หน้า {page} จาก {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
