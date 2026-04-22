'use client'

import { useState, useCallback } from 'react'
import { DashboardCustomizer, DashboardWidget, presetWidgets } from '@/components/dashboard/dashboard-customizer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText,
  AlertCircle,
  Plus
} from 'lucide-react'
import { QuickAccessCard, useRecentItems } from '@/components/personalization/recent-items'
import { ActivityFeed } from '@/components/websocket/websocket-provider'

// Widget renderer component
function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case 'revenue-chart':
      return <RevenueWidget />
    case 'expenses-chart':
      return <ExpensesWidget />
    case 'invoices-summary':
      return <InvoicesWidget />
    case 'bank-balance':
      return <BankBalanceWidget />
    case 'overdue-invoices':
      return <OverdueInvoicesWidget />
    case 'recent-activity':
      return <RecentActivityWidget />
    case 'quick-actions':
      return <QuickActionsWidget />
    case 'tax-summary':
      return <TaxSummaryWidget />
    default:
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          ไม่พบวิดเจ็ต
        </div>
      )
  }
}

function RevenueWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">฿1,250,000</p>
          <p className="text-sm text-muted-foreground">รายได้เดือนนี้</p>
        </div>
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+12%</span>
        </div>
      </div>
      <div className="h-24 bg-muted rounded-lg flex items-end justify-between p-2">
        {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 95].map((h, i) => (
          <div
            key={i}
            className="w-4 bg-primary/80 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function ExpensesWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">฿850,000</p>
          <p className="text-sm text-muted-foreground">ค่าใช้จ่ายเดือนนี้</p>
        </div>
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+5%</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>ค่าใช้จ่ายประจำ</span>
          <span>65%</span>
        </div>
        <Progress value={65} />
        <div className="flex justify-between text-sm">
          <span>ค่าใช้จ่ายผันแปร</span>
          <span>35%</span>
        </div>
        <Progress value={35} />
      </div>
    </div>
  )
}

function InvoicesWidget() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-lg font-bold">45</p>
          <p className="text-xs text-muted-foreground">ทั้งหมด</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-600">12</p>
          <p className="text-xs text-muted-foreground">รอชำระ</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">30</p>
          <p className="text-xs text-muted-foreground">ชำระแล้ว</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-lg font-bold text-red-600">3</p>
          <p className="text-xs text-muted-foreground">เกินกำหนด</p>
        </div>
      </div>
    </div>
  )
}

function BankBalanceWidget() {
  const accounts = [
    { name: 'กสิกรไทย', balance: 450000 },
    { name: 'ไทยพาณิชย์', balance: 280000 },
    { name: 'กรุงเทพ', balance: 120000 },
  ]

  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold">฿850,000</p>
      <div className="space-y-2">
        {accounts.map((acc) => (
          <div key={acc.name} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{acc.name}</span>
            <span>฿{(acc.balance / 100).toLocaleString('th-TH')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OverdueInvoicesWidget() {
  const overdue = [
    { customer: 'บริษัท เอ', amount: 50000, days: 15 },
    { customer: 'บริษัท บี', amount: 35000, days: 30 },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{overdue.length} รายการค้างชำระ</span>
      </div>
      <div className="space-y-2">
        {overdue.map((inv, i) => (
          <div key={i} className="p-2 bg-amber-50 rounded text-sm">
            <div className="flex justify-between">
              <span>{inv.customer}</span>
              <span className="font-medium">฿{inv.amount.toLocaleString('th-TH')}</span>
            </div>
            <p className="text-xs text-muted-foreground">เกินกำหนด {inv.days} วัน</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivityWidget() {
  const activities = [
    { user: 'Admin', action: 'สร้างใบกำกับภาษี', time: '5 นาทีที่แล้ว' },
    { user: 'User', action: 'บันทึกรับชำระ', time: '15 นาทีที่แล้ว' },
    { user: 'System', action: 'สำรองข้อมูล', time: '1 ชั่วโมงที่แล้ว' },
  ]

  return (
    <div className="space-y-3">
      {activities.map((act, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
          <div>
            <p><span className="font-medium">{act.user}</span> {act.action}</p>
            <p className="text-xs text-muted-foreground">{act.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuickActionsWidget() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col items-center gap-1">
        <FileText className="w-5 h-5" />
        <span className="text-xs">ใบกำกับภาษี</span>
      </Button>
      <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col items-center gap-1">
        <DollarSign className="w-5 h-5" />
        <span className="text-xs">บันทึกรับ</span>
      </Button>
      <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col items-center gap-1">
        <Users className="w-5 h-5" />
        <span className="text-xs">ลูกค้าใหม่</span>
      </Button>
      <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col items-center gap-1">
        <Plus className="w-5 h-5" />
        <span className="text-xs">เพิ่มเติม</span>
      </Button>
    </div>
  )
}

function TaxSummaryWidget() {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">ภาษีขาย (Output VAT)</p>
        <p className="text-lg font-medium">฿87,500</p>
      </div>
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">ภาษีซื้อ (Input VAT)</p>
        <p className="text-lg font-medium">฿59,500</p>
      </div>
      <div className="p-3 bg-primary/10 rounded-lg">
        <p className="text-xs text-muted-foreground">ต้องชำระ</p>
        <p className="text-lg font-bold text-primary">฿28,000</p>
      </div>
    </div>
  )
}

// Main Dashboard Component
interface EnhancedDashboardProps {
  userId?: string
  onNavigate?: (module: string, recordId?: string) => void
}

export function EnhancedDashboard({ userId, onNavigate }: EnhancedDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: '1', ...presetWidgets.revenue },
    { id: '2', ...presetWidgets.invoices },
    { id: '3', ...presetWidgets.bankBalance },
    { id: '4', ...presetWidgets.overdueInvoices },
    { id: '5', ...presetWidgets.recentActivity },
    { id: '6', ...presetWidgets.quickActions },
  ])

  const availableWidgets = Object.values(presetWidgets)
  const { recentItems } = useRecentItems(userId)

  const handleSaveDashboard = useCallback(async (newWidgets: DashboardWidget[]) => {
    // Save to API
    if (userId) {
      try {
        await fetch(`/api/user/preferences`, { credentials: 'include', 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboardLayout: newWidgets,
          }),
        })
      } catch (error) {
        console.error('Failed to save dashboard:', error)
      }
    }
    setWidgets(newWidgets)
  }, [userId])

  const handleQuickAccessClick = (item: { module: string; recordId: string }) => {
    onNavigate?.(item.module, item.recordId)
  }

  return (
    <div className="space-y-6">
      {/* Quick Access */}
      {recentItems.length > 0 && (
        <QuickAccessCard
          items={recentItems}
          onItemClick={handleQuickAccessClick}
        />
      )}

      {/* Customizable Dashboard */}
      <DashboardCustomizer
        widgets={widgets}
        availableWidgets={availableWidgets}
        onWidgetsChange={setWidgets}
        onSave={handleSaveDashboard}
        renderWidget={(widget) => <WidgetRenderer widget={widget} />}
      />
    </div>
  )
}
