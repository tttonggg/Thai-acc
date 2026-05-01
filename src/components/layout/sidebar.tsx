'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module } from '@/app/page';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MenuItem {
  id: Module;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}

interface SidebarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  menuItems?: MenuItem[];
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
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
  Payment: CreditCard,
  Package: Package,
  Building2: Building2,
  Hammer: Hammer,
  Wallet: Wallet,
  BarChart3: BarChart3,
  Settings: Settings,
  UserCog: UserCog,
  Download: Download,
  Database: Database,
  Activity: Activity,
};

const defaultMenuItems: MenuItem[] = [
  { id: 'dashboard' as Module, label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'accounts' as Module, label: 'ผังบัญชี', icon: BookOpen },
  { id: 'journal' as Module, label: 'บันทึกบัญชี', icon: FileText },
  { id: 'invoices' as Module, label: 'ใบกำกับภาษี', icon: Receipt },
  { id: 'vat' as Module, label: 'ภาษีมูลค่าเพิ่ม', icon: Percent },
  { id: 'wht' as Module, label: 'ภาษีหัก ณ ที่จ่าย', icon: Landmark },
  { id: 'customers' as Module, label: 'ลูกหนี้', icon: Users },
  { id: 'vendors' as Module, label: 'เจ้าหนี้', icon: Truck },
  { id: 'payments' as Module, label: 'ใบจ่ายเงิน', icon: CreditCard },
  { id: 'inventory' as Module, label: 'สต็อกสินค้า', icon: Package },
  { id: 'banking' as Module, label: 'ธนาคาร', icon: Building2 },
  { id: 'assets' as Module, label: 'ทรัพย์สิน', icon: Hammer },
  { id: 'payroll' as Module, label: 'เงินเดือน', icon: Users },
  { id: 'petty-cash' as Module, label: 'เงินสดย่อย', icon: Wallet },
  { id: 'reports' as Module, label: 'รายงาน', icon: BarChart3 },
  // Phase B: Accounting Excellence
  { id: 'accounting-periods' as Module, label: 'งวดบัญชี', icon: Calendar },
  { id: 'currencies' as Module, label: 'สกุลเงิน', icon: DollarSign },
  { id: 'tax-forms' as Module, label: 'แบบฟอร์มภาษี', icon: FileCheck },
  { id: 'budgets' as Module, label: 'งบประมาณ', icon: PiggyBank },
  { id: 'entities' as Module, label: 'บริษัทในเครือ', icon: Building },
  { id: 'settings' as Module, label: 'ตั้งค่า', icon: Settings, adminOnly: true },
  { id: 'users' as Module, label: 'จัดการผู้ใช้', icon: UserCog, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ชมเท่านั้น',
};

export function Sidebar({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  menuItems = defaultMenuItems,
  userRole = 'VIEWER',
  userName = 'ผู้ใช้',
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-blue-700 p-4">
        <div className={cn('flex items-center gap-3', !isOpen && 'w-full justify-center')}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-500">
            <Landmark className="h-6 w-6 text-blue-900" />
          </div>
          {isOpen && (
            <div>
              <h1 className="text-lg font-bold">Thai ERP</h1>
              <p className="text-xs text-blue-200">โปรแกรมบัญชีมาตรฐานไทย</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden flex-shrink-0 rounded p-1 hover:bg-blue-700 lg:block"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-yellow-500 font-medium text-blue-900 shadow-lg'
                  : 'text-blue-100 hover:bg-blue-700',
                !isOpen && 'justify-center'
              )}
            >
              <Icon size={20} />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      {isOpen && (
        <div className="border-t border-blue-700 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 p-2 text-blue-100 hover:bg-blue-700 hover:text-white"
              >
                <Avatar className="h-8 w-8 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-sm text-white">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="max-w-[120px] truncate text-sm font-medium">{userName}</p>
                  <p className="text-xs text-blue-300">{roleLabels[userRole] || userRole}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Footer */}
      {isOpen && (
        <div className="border-t border-blue-700 p-4 text-xs text-blue-300">
          <p>Thai Accounting ERP v1.0</p>
          <p>มาตรฐานบัญชีไทย (TFRS)</p>
        </div>
      )}
    </aside>
  );
}
