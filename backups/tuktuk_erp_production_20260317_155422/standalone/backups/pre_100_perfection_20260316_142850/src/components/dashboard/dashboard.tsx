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
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Fetch failed')
        const json = await res.json()
        setData(json.data)
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
    fetchDashboard()
  }, [toast])

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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">การดำเนินการด่วน</CardTitle>
          <CardDescription>รายการที่ต้องดำเนินการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">ใบกำกับภาษีร่าง</p>
                  <p className="text-sm text-gray-500">5 รายการรอออกใบกำกับภาษี</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">ลูกหนี้เกินกำหนด</p>
                  <p className="text-sm text-gray-500">3 รายการเกิน 90 วัน</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">รอยื่นภาษี</p>
                  <p className="text-sm text-gray-500">PP30 ประจำเดือนนี้</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
