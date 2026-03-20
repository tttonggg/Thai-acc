'use client'

// ============================================
// 🌸 Keerati ERP - Pastel Sidebar with Grouped Menu
// FIXED: Proper contrast for all theme variants
// ============================================

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Receipt,
  Percent,
  Users,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Landmark,
  UserCog,
  LogOut,
  Package,
  Building2,
  Hammer,
  Wallet,
  CreditCard,
  Database,
  Download,
  Activity,
  Calendar,
  DollarSign,
  FileCheck,
  PiggyBank,
  Building,
  Store,
  ChevronDown,
  ChevronUp,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Heart,
  Car,
  ShoppingCart,
  Quote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Module } from '@/app/page'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useThemeStore, themeColors, ThemeVariant } from '@/stores/theme-store'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

// ============================================
// 🗂️ Menu Groups
// ============================================
interface MenuGroup {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: MenuItem[]
  color: string
}

interface MenuItem {
  id: Module
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  adminOnly?: boolean
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'หน้าหลัก (Main)',
    icon: LayoutDashboard,
    color: 'text-pink-500',
    items: [
      { id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard },
    ],
  },
  {
    id: 'sales',
    label: 'งานขาย (Sales)',
    icon: Store,
    color: 'text-rose-500',
    items: [
      { id: 'customers', label: 'ลูกค้า (Customers)', icon: Users },
      { id: 'quotations', label: 'ใบเสนอราคา (Quotation)', icon: Quote },
      { id: 'invoices', label: 'ใบกำกับภาษี (Tax Invoice)', icon: Receipt },
      { id: 'credit-notes', label: 'ใบลดหนี้ (Credit Note)', icon: FileText },
      { id: 'receipts', label: 'ใบเสร็จรับเงิน (Receipt)', icon: Receipt },
    ],
  },
  {
    id: 'purchase',
    label: 'งานซื้อ (Purchasing)',
    icon: Truck,
    color: 'text-amber-500',
    items: [
      { id: 'vendors', label: 'ผู้ขาย (Vendors)', icon: Truck },
      { id: 'purchase-requests', label: 'ใบขอซื้อ (PR)', icon: FileText },
      { id: 'purchase-orders', label: 'ใบสั่งซื้อ (PO)', icon: ShoppingCart },
      { id: 'purchases', label: 'ใบซื้อ (Purchase Invoice)', icon: Receipt },
      { id: 'payments', label: 'ใบจ่ายเงิน (Payment)', icon: CreditCard },
      { id: 'debit-notes', label: 'ใบเพิ่มหนี้ (Debit Note)', icon: FileText },
    ],
  },
  {
    id: 'inventory',
    label: 'สินค้าและคลัง (Inventory)',
    icon: Package,
    color: 'text-emerald-500',
    items: [
      { id: 'inventory', label: 'สต็อกสินค้า (Stock)', icon: Package },
      { id: 'products', label: 'สินค้า (Products)', icon: Package },
      { id: 'warehouses', label: 'คลังสินค้า (Warehouses)', icon: Building2 },
    ],
  },
  {
    id: 'accounting',
    label: 'บัญชี (Accounting)',
    icon: BookOpen,
    color: 'text-blue-500',
    items: [
      { id: 'accounts', label: 'ผังบัญชี (Chart of Accounts)', icon: BookOpen },
      { id: 'journal', label: 'บันทึกบัญชี (Journal Entry)', icon: FileText },
      { id: 'banking', label: 'ธนาคาร (Banking)', icon: Building2 },
      { id: 'assets', label: 'ทรัพย์สินถาวร (Fixed Assets)', icon: Hammer },
      { id: 'petty-cash', label: 'เงินสดย่อย (Petty Cash)', icon: Wallet },
    ],
  },
  {
    id: 'tax',
    label: 'ภาษี (Tax)',
    icon: Landmark,
    color: 'text-violet-500',
    items: [
      { id: 'vat', label: 'ภาษีมูลค่าเพิ่ม (VAT)', icon: Percent },
      { id: 'wht', label: 'ภาษีหัก ณ ที่จ่าย (Withholding Tax)', icon: Landmark },
    ],
  },
  {
    id: 'hr',
    label: 'บุคลากร (HR & Payroll)',
    icon: Users,
    color: 'text-cyan-500',
    items: [
      { id: 'payroll', label: 'เงินเดือน (Payroll)', icon: Users },
      { id: 'employees', label: 'พนักงาน (Employees)', icon: UserCog },
    ],
  },
  {
    id: 'reports',
    label: 'รายงาน (Reports)',
    icon: BarChart3,
    color: 'text-indigo-500',
    items: [
      { id: 'reports', label: 'รายงานทั้งหมด (All Reports)', icon: BarChart3 },
      { id: 'accounting-periods', label: 'งวดบัญชี (Accounting Periods)', icon: Calendar },
      { id: 'budgets', label: 'งบประมาณ (Budgets)', icon: PiggyBank },
    ],
  },
  {
    id: 'admin',
    label: 'ผู้ดูแลระบบ (Admin)',
    icon: Settings,
    color: 'text-slate-500',
    items: [
      { id: 'settings', label: 'ตั้งค่า (Settings)', icon: Settings, adminOnly: true },
      { id: 'users', label: 'จัดการผู้ใช้ (User Management)', icon: UserCog, adminOnly: true },
      { id: 'entities', label: 'บริษัทในเครือ (Entities)', icon: Building, adminOnly: true },
      { id: 'currencies', label: 'สกุลเงิน (Currencies)', icon: DollarSign, adminOnly: true },
    ],
  },
]

interface SidebarProps {
  activeModule: Module
  setActiveModule: (module: Module) => void
  userRole?: string
  userName?: string
  onLogout?: () => void
  onCloseMobile?: () => void
}

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ชมเท่านั้น',
}

// ============================================
// 🎨 Theme Customization Dialog
// ============================================
function ThemeCustomizer() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const {
    theme: pastelTheme,
    setTheme: setPastelTheme,
    animationsEnabled,
    toggleAnimations,
    borderRadius,
    setBorderRadius,
    accentIntensity,
    setAccentIntensity,
  } = useThemeStore()

  // Prevent hydration mismatch with next-themes
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync next-themes with Zustand pastel theme (with fallback to prevent issues)
  const isDarkMode = mounted && theme === 'dark'
  const toggleDarkMode = () => setTheme(isDarkMode ? 'light' : 'dark')

  const radiusLabels = { sm: 'เล็ก', md: 'ปานกลาง', lg: 'ใหญ่', xl: 'ใหญ่พิเศษ' }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] transition-colors w-full">
          <Palette size={18} />
          <span>ปรับแต่งธีม</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Sparkles className="text-[var(--primary)]" size={20} />
            ปรับแต่งธีมสีพาสเทล
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon size={18} className="text-[var(--primary)]" /> : <Sun size={18} className="text-[var(--primary)]" />}
              <Label className="text-[var(--foreground)]">โหมดกลางคืน</Label>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>

          {/* Animations Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--primary)]" />
              <Label className="text-[var(--foreground)]">เอฟเฟกต์แอนิเมชัน</Label>
            </div>
            <Switch checked={animationsEnabled} onCheckedChange={toggleAnimations} />
          </div>

          {/* Theme Colors */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--foreground)]">เลือกธีมสี</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(themeColors) as ThemeVariant[]).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setPastelTheme(variant)}
                  className={cn(
                    "relative p-3 rounded-xl transition-all hover:scale-105",
                    pastelTheme === variant ? "ring-2 ring-offset-2 ring-[var(--primary)] scale-105" : ""
                  )}
                  style={{ background: themeColors[variant].gradient }}
                  title={themeColors[variant].nameTh}
                >
                  {pastelTheme === variant && (
                    <Heart size={14} className="absolute top-1 right-1 text-[var(--primary-foreground)] drop-shadow-md" fill="currentColor" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] text-center">
              {themeColors[pastelTheme].nameTh} ({themeColors[pastelTheme].name})
            </p>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--foreground)]">ความมนของขอบ</Label>
            <div className="flex gap-2">
              {(Object.keys(radiusLabels) as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setBorderRadius(r)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm transition-all",
                    borderRadius === r
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  )}
                >
                  {radiusLabels[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Intensity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--foreground)]">ความเข้มของสี</Label>
            <div className="flex gap-2">
              {(['soft', 'medium', 'vibrant'] as const).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => setAccentIntensity(intensity)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm transition-all capitalize",
                    accentIntensity === intensity
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  )}
                >
                  {intensity === 'soft' ? 'อ่อน' : intensity === 'medium' ? 'กลาง' : 'เข้ม'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// 🌸 Main Sidebar Component
// ============================================
export function KeeratiSidebar({
  activeModule,
  setActiveModule,
  userRole = 'VIEWER',
  userName = 'ผู้ใช้',
  onLogout,
  onCloseMobile,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { expandedGroups, toggleGroup, isSidebarCollapsed, toggleSidebar } = useThemeStore()

  const isCollapsed = isSidebarCollapsed

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-300 ease-in-out border-r border-[var(--sidebar-border)]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* 🎀 Logo Header */}
      <div className={cn(
        "flex items-center border-b border-[var(--sidebar-border)]",
        isCollapsed ? "flex-col gap-2 py-3 px-2" : "justify-between px-4 py-4"
      )}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "gap-3")}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #ffb6c1, #ffd1dc)' }}
          >
            <Car className="w-7 h-7 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-xl text-[var(--sidebar-foreground)]">Keerati ERP</h1>
              <p className="text-xs text-[var(--muted-foreground)]">โปรแกรมบัญชีสไตล์คุณ</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] transition-colors flex-shrink-0",
            isCollapsed ? "p-2" : "p-2"
          )}
          title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 🗂️ Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {isCollapsed ? (
          // Collapsed view - flat list with tooltips
          menuGroups.flatMap(g => g.items).map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            if (item.adminOnly && userRole !== 'ADMIN') return null

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id)
                  onCloseMobile?.()
                }}
                className={cn(
                  "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-md"
                    : "hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)]"
                )}
                title={item.label}
              >
                <Icon size={22} />
              </button>
            )
          })
        ) : (
          // Expanded view - grouped
          menuGroups.map((group) => {
            const GroupIcon = group.icon
            const isExpanded = expandedGroups.includes(group.id)
            const hasActiveItem = group.items.some(item => item.id === activeModule)
            
            // Check if group has visible items
            const visibleItems = group.items.filter(item => !item.adminOnly || userRole === 'ADMIN')
            if (visibleItems.length === 0) return null

            return (
              <div key={group.id} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    hasActiveItem
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium"
                      : "hover:bg-[var(--sidebar-accent)]/50 text-[var(--sidebar-foreground)]"
                  )}
                >
                  <GroupIcon size={18} className={cn(hasActiveItem && group.color)} />
                  <span className="flex-1 text-sm font-medium text-left">{group.label}</span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-[var(--muted-foreground)]" />
                  ) : (
                    <ChevronDown size={16} className="text-[var(--muted-foreground)]" />
                  )}
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l-2 border-[var(--sidebar-border)] space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeModule === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveModule(item.id)
                            onCloseMobile?.()
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
                            isActive
                              ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-medium shadow-sm"
                              : "hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)]"
                          )}
                        >
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="text-left flex-1">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* 🎨 Theme Customizer & User */}
      <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2">
        {/* Theme Customizer */}
        {!isCollapsed && <ThemeCustomizer />}
        
        {/* Expand/Collapse Button (when collapsed) */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-[var(--sidebar-accent)] text-[var(--sidebar-foreground)] transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* User Profile */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-[var(--sidebar-accent)] p-3 h-auto rounded-xl text-[var(--sidebar-foreground)]"
              >
                <Avatar className="h-9 w-9" style={{ background: 'linear-gradient(135deg, #ffb6c1, #ffd1dc)' }}>
                  <AvatarFallback className="text-white text-sm font-bold">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium truncate text-[var(--sidebar-foreground)]">{userName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{roleLabels[userRole] || userRole}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[var(--foreground)]">บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-[var(--destructive)] focus:text-[var(--destructive)]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <div className="pt-2 text-center">
            <p className="text-[10px] text-[var(--muted-foreground)]">Keerati ERP v1.0 🛺</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Made with 💕</p>
          </div>
        )}
      </div>
    </aside>
  )
}
