'use client'

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

interface MenuItem {
  id: Module
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  adminOnly?: boolean
}

interface SidebarProps {
  activeModule: Module
  setActiveModule: (module: Module) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  menuItems?: MenuItem[]
  userRole?: string
  userName?: string
  onLogout?: () => void
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard: LayoutDashboard,
  BookOpen: BookOpen,
  PenTool: FileText,
  FileText: Receipt,
  Percent: Percent,
  Receipt: Landmark,
  Users: Users,
  Truck: Truck,
  Package: Package,
  Building2: Building2,
  Hammer: Hammer,
  Wallet: Wallet,
  BarChart3: BarChart3,
  Settings: Settings,
  UserCog: UserCog,
}

const defaultMenuItems: MenuItem[] = [
  { id: 'dashboard' as Module, label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'accounts' as Module, label: 'ผังบัญชี', icon: BookOpen },
  { id: 'journal' as Module, label: 'บันทึกบัญชี', icon: FileText },
  { id: 'invoices' as Module, label: 'ใบกำกับภาษี', icon: Receipt },
  { id: 'vat' as Module, label: 'ภาษีมูลค่าเพิ่ม', icon: Percent },
  { id: 'wht' as Module, label: 'ภาษีหัก ณ ที่จ่าย', icon: Landmark },
  { id: 'customers' as Module, label: 'ลูกหนี้', icon: Users },
  { id: 'vendors' as Module, label: 'เจ้าหนี้', icon: Truck },
  { id: 'inventory' as Module, label: 'สต็อกสินค้า', icon: Package },
  { id: 'banking' as Module, label: 'ธนาคาร', icon: Building2 },
  { id: 'assets' as Module, label: 'ทรัพย์สิน', icon: Hammer },
  { id: 'payroll' as Module, label: 'เงินเดือน', icon: Users },
  { id: 'petty-cash' as Module, label: 'เงินสดย่อย', icon: Wallet },
  { id: 'reports' as Module, label: 'รายงาน', icon: BarChart3 },
  { id: 'settings' as Module, label: 'ตั้งค่า', icon: Settings, adminOnly: true },
  { id: 'users' as Module, label: 'จัดการผู้ใช้', icon: UserCog, adminOnly: true },
]

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ชมเท่านั้น',
}

export function Sidebar({ 
  activeModule, 
  setActiveModule, 
  isOpen, 
  setIsOpen,
  menuItems = defaultMenuItems,
  userRole = 'VIEWER',
  userName = 'ผู้ใช้',
  onLogout
}: SidebarProps) {
  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center w-full")}>
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Landmark className="w-6 h-6 text-blue-900" />
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg">Thai ERP</h1>
              <p className="text-xs text-blue-200">โปรแกรมบัญชีมาตรฐานไทย</p>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-blue-700 rounded hidden lg:block flex-shrink-0"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeModule === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                isActive 
                  ? "bg-yellow-500 text-blue-900 font-medium shadow-lg" 
                  : "hover:bg-blue-700 text-blue-100",
                !isOpen && "justify-center"
              )}
            >
              <Icon size={20} />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      {isOpen && (
        <div className="p-3 border-t border-blue-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-blue-100 hover:bg-blue-700 hover:text-white p-2 h-auto"
              >
                <Avatar className="h-8 w-8 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[120px]">{userName}</p>
                  <p className="text-xs text-blue-300">{roleLabels[userRole] || userRole}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-blue-700 text-xs text-blue-300">
          <p>Thai Accounting ERP v1.0</p>
          <p>มาตรฐานบัญชีไทย (TFRS)</p>
        </div>
      )}
    </aside>
  )
}
