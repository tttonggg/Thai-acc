'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Truck,
  Receipt,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Building,
  Wallet,
  CreditCard,
  FileCheck,
  ShoppingCart,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

interface DashboardSummary {
  revenue: { amount: number; change: number }
  expenses: { amount: number; change: number }
  ar: { amount: number; change: number }
  ap: { amount: number; change: number }
}

interface QuickActionItem {
  count: number
  label: string
  description: string
  icon: string
  color: string
  action: string
}

interface QuickActions {
  draftInvoices: QuickActionItem
  overdueAR: QuickActionItem
  pendingVAT: QuickActionItem
}

interface DashboardData {
  summary: DashboardSummary
  monthlyData: Array<{ month: string; revenue: number; expense: number }>
  arAging: Array<{ name: string; value: number; color: string }>
  apAging: Array<{ name: string; value: number; color: string }>
  vatData: Array<{ month: string; vatOutput: number; vatInput: number }>
  quickActions?: QuickActions
}

// Module statistics interface
interface ModuleStats {
  total: number
  draft?: number
  pending?: number
  sent?: number
  approved?: number
  overdue?: number
}

// Summary Card Component
interface SummaryCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: React.ReactNode
  iconBg: string
}

function SummaryCard({ title, value, change, changeLabel, icon, iconBg }: SummaryCardProps) {
  const isPositive = change >= 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
              <span className="text-xs text-gray-400">{changeLabel}</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get icon component by name
function getIconComponent(iconName: string, className: string) {
  switch (iconName) {
    case 'FileText':
      return <FileText className={className} />
    case 'Users':
      return <Users className={className} />
    case 'DollarSign':
      return <DollarSign className={className} />
    case 'Receipt':
      return <Receipt className={className} />
    default:
      return <Receipt className={className} />
  }
}

// Helper function to get color classes
function getColorClasses(color: string) {
  switch (color) {
    case 'yellow':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        hover: 'hover:bg-yellow-100'
      }
    case 'red':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        hover: 'hover:bg-red-100'
      }
    case 'blue':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        hover: 'hover:bg-blue-100'
      }
    case 'purple':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        hover: 'hover:bg-purple-100'
      }
    case 'green':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        hover: 'hover:bg-green-100'
      }
    case 'indigo':
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        hover: 'hover:bg-indigo-100'
      }
    case 'orange':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        hover: 'hover:bg-orange-100'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        hover: 'hover:bg-gray-100'
      }
  }
}

// Shortcut Card Component
interface ShortcutCardProps {
  title: string
  description: string
  icon: React.ReactNode
  stats: ModuleStats
  color: string
  onClick: () => void
  loading?: boolean
}

function ShortcutCard({ title, description, icon, stats, color, onClick, loading }: ShortcutCardProps) {
  const colors = getColorClasses(color)

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${colors.hover} border-2 ${colors.border}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
            {icon}
          </div>
          <ChevronRight className={`h-5 w-5 ${colors.iconColor} opacity-50`} />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        {!loading && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              ทั้งหมด {stats.total}
            </Badge>
            {stats.draft !== undefined && stats.draft > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                ร่าง {stats.draft}
              </Badge>
            )}
            {stats.pending !== undefined && stats.pending > 0 && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                รออนุมัติ {stats.pending}
              </Badge>
            )}
            {stats.sent !== undefined && stats.sent > 0 && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                ส่งแล้ว {stats.sent}
              </Badge>
            )}
            {stats.approved !== undefined && stats.approved > 0 && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                อนุมัติแล้ว {stats.approved}
              </Badge>
            )}
            {stats.overdue !== undefined && stats.overdue > 0 && (
              <Badge variant="destructive" className="text-xs">
                เกินกำหนด {stats.overdue}
              </Badge>
            )}
          </div>
        )}
        {loading && (
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moduleStats, setModuleStats] = useState<Record<string, ModuleStats>>({})
  const [statsLoading, setStatsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/dashboard')
        // Handle 401 - let the auth system handle redirect
        if (res.status === 401) {
          setLoading(false)
          return // Auth error - next-auth will handle redirect
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Unknown error')
        setData(json.data)
      } catch (err) {
        // Only show error if not auth related (401 handled above)
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
    fetchDashboard()
  }, [toast])

  // Fetch module statistics
  useEffect(() => {
    const fetchModuleStats = async () => {
      setStatsLoading(true)
      try {
        // Fetch quotations
        const quotRes = await fetch('/api/quotations?limit=1000')
        if (quotRes.ok) {
          const quotJson = await quotRes.json()
          if (quotJson.success) {
            const quotations = quotJson.data || []
            const draft = quotations.filter((q: any) => q.status === 'DRAFT').length
            const sent = quotations.filter((q: any) => q.status === 'SENT').length
            const approved = quotations.filter((q: any) => q.status === 'APPROVED').length
            setModuleStats(prev => ({
              ...prev,
              quotations: { total: quotations.length, draft, sent, approved }
            }))
          }
        }

        // Fetch invoices
        const invRes = await fetch('/api/invoices?limit=1000')
        if (invRes.ok) {
          const invJson = await invRes.json()
          if (invJson.success) {
            const invoices = invJson.data || []
            const draft = invoices.filter((i: any) => i.status === 'DRAFT').length
            const overdue = invoices.filter((i: any) =>
              i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'PAID'
            ).length
            setModuleStats(prev => ({
              ...prev,
              invoices: { total: invoices.length, draft, overdue }
            }))
          }
        }

        // Fetch receipts
        const recRes = await fetch('/api/receipts?limit=1000')
        if (recRes.ok) {
          const recJson = await recRes.json()
          if (recJson.success) {
            const receipts = recJson.data || []
            const draft = receipts.filter((r: any) => r.status === 'DRAFT').length
            setModuleStats(prev => ({
              ...prev,
              receipts: { total: receipts.length, draft }
            }))
          }
        }

        // Fetch credit notes
        const cnRes = await fetch('/api/credit-notes?limit=1000')
        if (cnRes.ok) {
          const cnJson = await cnRes.json()
          if (cnJson.success) {
            const creditNotes = cnJson.data || []
            setModuleStats(prev => ({
              ...prev,
              creditNotes: { total: creditNotes.length }
            }))
          }
        }

        // Fetch debit notes
        const dnRes = await fetch('/api/debit-notes?limit=1000')
        if (dnRes.ok) {
          const dnJson = await dnRes.json()
          if (dnJson.success) {
            const debitNotes = dnJson.data || []
            setModuleStats(prev => ({
              ...prev,
              debitNotes: { total: debitNotes.length }
            }))
          }
        }

        // Fetch purchase orders
        const poRes = await fetch('/api/purchase-orders?limit=1000')
        if (poRes.ok) {
          const poJson = await poRes.json()
          if (poJson.success) {
            const purchaseOrders = poJson.data || []
            const draft = purchaseOrders.filter((p: any) => p.status === 'DRAFT').length
            const pending = purchaseOrders.filter((p: any) => p.status === 'PENDING_APPROVAL').length
            setModuleStats(prev => ({
              ...prev,
              purchaseOrders: { total: purchaseOrders.length, draft, pending }
            }))
          }
        }

        // Fetch payments
        const payRes = await fetch('/api/payments?limit=1000')
        if (payRes.ok) {
          const payJson = await payRes.json()
          if (payJson.success) {
            const payments = payJson.data || []
            setModuleStats(prev => ({
              ...prev,
              payments: { total: payments.length }
            }))
          }
        }

      } catch (err) {
        console.error('Error fetching module stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchModuleStats()
  }, [])

  // Navigation handler
  const navigateTo = (path: string) => {
    router.push(path)
  }

  // Loading UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error UI
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Empty UI
  if (!data) {
    return (
      <Alert>
        <AlertDescription>ไม่พบข้อมูล</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ภาพรวมธุรกิจ</h1>
        <p className="text-gray-500 mt-1">ภาพรวมสถานะทางการเงินและบัญชี</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="รายได้รวม (เดือนนี้)"
          value={`฿${data?.summary?.revenue?.amount?.toLocaleString() ?? '0'}`}
          change={data?.summary?.revenue?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          iconBg="bg-green-500"
        />
        <SummaryCard
          title="ค่าใช้จ่ายรวม (เดือนนี้)"
          value={`฿${data?.summary?.expenses?.amount?.toLocaleString() ?? '0'}`}
          change={data?.summary?.expenses?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<TrendingDown className="h-6 w-6 text-white" />}
          iconBg="bg-red-500"
        />
        <SummaryCard
          title="ลูกหนี้การค้า"
          value={`฿${data?.summary?.ar?.amount?.toLocaleString() ?? '0'}`}
          change={data?.summary?.ar?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<Users className="h-6 w-6 text-white" />}
          iconBg="bg-blue-500"
        />
        <SummaryCard
          title="เจ้าหนี้การค้า"
          value={`฿${data?.summary?.ap?.amount?.toLocaleString() ?? '0'}`}
          change={data?.summary?.ap?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<Truck className="h-6 w-6 text-white" />}
          iconBg="bg-orange-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">รายได้ vs ค่าใช้จ่าย</CardTitle>
            <CardDescription>เปรียบเทียบรายได้และค่าใช้จ่ายรายเดือน</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.monthlyData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                <Tooltip
                  formatter={(value: number) => [`฿${value?.toLocaleString() ?? '0'}`, '']}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="รายได้" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="ค่าใช้จ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* VAT Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ภาษีมูลค่าเพิ่ม</CardTitle>
            <CardDescription>ภาษีขายและภาษีซื้อรายเดือน</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.vatData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                <Tooltip
                  formatter={(value: number) => [`฿${value?.toLocaleString() ?? '0'}`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="vatOutput"
                  name="ภาษีขาย"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="vatInput"
                  name="ภาษีซื้อ"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AR Aging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ลูกหนี้ตามอายุหนี้</CardTitle>
            <CardDescription>จำแนกตามระยะเวลาครบกำหนด</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.arAging ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data?.arAging?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `฿${value?.toLocaleString() ?? '0'}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {data?.arAging?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}: ฿{item?.value?.toLocaleString() ?? '0'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AP Aging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">เจ้าหนี้ตามอายุหนี้</CardTitle>
            <CardDescription>จำแนกตามระยะเวลาครบกำหนด</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.apAging ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data?.apAging?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `฿${value?.toLocaleString() ?? '0'}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {data?.apAging?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}: ฿{item?.value?.toLocaleString() ?? '0'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Shortcuts */}
      <div className="space-y-6">
        {/* Sales & Revenue */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">การขายและรายได้</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ShortcutCard
              title="ใบเสนอราคา"
              description="สร้างและจัดการใบเสนอราคา"
              icon={<FileText className="h-6 w-6 text-purple-600" />}
              stats={moduleStats.quotations || { total: 0, draft: 0, sent: 0, approved: 0 }}
              color="purple"
              onClick={() => navigateTo('/quotations')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบกำกับภาษี"
              description="ออกใบกำกับภาษีและใบเสร็จ"
              icon={<Receipt className="h-6 w-6 text-blue-600" />}
              stats={moduleStats.invoices || { total: 0, draft: 0, overdue: 0 }}
              color="blue"
              onClick={() => navigateTo('/invoices')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบเสร็จรับเงิน"
              description="บันทึกการรับชำระเงิน"
              icon={<DollarSign className="h-6 w-6 text-green-600" />}
              stats={moduleStats.receipts || { total: 0, draft: 0 }}
              color="green"
              onClick={() => navigateTo('/receipts')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบลดหนี้"
              description="ออกใบลดหนี้และคืนเงิน"
              icon={<FileCheck className="h-6 w-6 text-orange-600" />}
              stats={moduleStats.creditNotes || { total: 0 }}
              color="orange"
              onClick={() => navigateTo('/credit-notes')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Purchases & Expenses */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">การซื้อและค่าใช้จ่าย</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ShortcutCard
              title="ใบสั่งซื้อ"
              description="ขออนุมัติและสั่งซื้อสินค้า"
              icon={<ShoppingCart className="h-6 w-6 text-indigo-600" />}
              stats={moduleStats.purchaseOrders || { total: 0, draft: 0, pending: 0 }}
              color="indigo"
              onClick={() => navigateTo('/purchase-orders')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบจ่ายเงิน"
              description="บันทึกการจ่ายชำระเงิน"
              icon={<CreditCard className="h-6 w-6 text-red-600" />}
              stats={moduleStats.payments || { total: 0 }}
              color="red"
              onClick={() => navigateTo('/payments')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบเพิ่มหนี้"
              description="ออกใบเพิ่มหนี้และปรับปรุง"
              icon={<FileCheck className="h-6 w-6 text-orange-600" />}
              stats={moduleStats.debitNotes || { total: 0 }}
              color="orange"
              onClick={() => navigateTo('/debit-notes')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Inventory & Assets */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">สินค้าและทรัพย์สิน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ShortcutCard
              title="สินค้าคงคลัง"
              description="จัดการสต็อกและคลังสินค้า"
              icon={<Package className="h-6 w-6 text-teal-600" />}
              stats={{ total: 0 }}
              color="green"
              onClick={() => navigateTo('/inventory')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ทรัพย์สินถาวร"
              description="บันทึกทรัพย์สินและค่าเสื่อม"
              icon={<Building className="h-6 w-6 text-slate-600" />}
              stats={{ total: 0 }}
              color="blue"
              onClick={() => navigateTo('/fixed-assets')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ธนาคาร"
              description="บัญชีธนาคารและเช็ค"
              icon={<Wallet className="h-6 w-6 text-blue-600" />}
              stats={{ total: 0 }}
              color="blue"
              onClick={() => navigateTo('/banking')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* HR & Finance */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">บุคคลและการเงิน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ShortcutCard
              title="เงินสดย่อย"
              description="กองทุนและเบิกจ่าย"
              icon={<Wallet className="h-6 w-6 text-amber-600" />}
              stats={{ total: 0 }}
              color="yellow"
              onClick={() => navigateTo('/petty-cash')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="เงินเดือน"
              description="คำนวณเงินเดือนและภาษี"
              icon={<Users className="h-6 w-6 text-purple-600" />}
              stats={{ total: 0 }}
              color="purple"
              onClick={() => navigateTo('/payroll')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="หัก ณ ที่จ่าย"
              description="ภงด.3 และ ภงด.53"
              icon={<FileText className="h-6 w-6 text-red-600" />}
              stats={{ total: 0 }}
              color="red"
              onClick={() => navigateTo('/wht')}
              loading={statsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
