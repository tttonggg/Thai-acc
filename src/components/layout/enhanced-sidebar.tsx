'use client';

import { useState } from 'react';
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
  History,
  Bell,
  Keyboard,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RecentItemsList,
  useRecentItems,
  RecentItem,
} from '@/components/personalization/recent-items';
import {
  NotificationCenter,
  useNotifications,
} from '@/components/notifications/notification-center';
import { ThemeToggle } from '@/components/personalization/user-preferences';
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from '@/components/keyboard-shortcuts/use-keyboard-shortcuts';
import {
  UserPreferencesDialog,
  UserPreferences,
} from '@/components/personalization/user-preferences';
import { SyncStatus } from '@/components/offline-sync/offline-sync-provider';
import { InstallPrompt, OfflineIndicator, UpdateNotification } from '@/components/pwa/pwa-provider';

interface MenuItem {
  id: Module;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}

interface EnhancedSidebarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  menuItems?: MenuItem[];
  userRole?: string;
  userName?: string;
  userId?: string;
  onLogout?: () => void;
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
  { id: 'payments' as Module, label: 'ใบจ่ายเงิน', icon: CreditCard },
  { id: 'inventory' as Module, label: 'สต็อกสินค้า', icon: Package },
  { id: 'banking' as Module, label: 'ธนาคาร', icon: Building2 },
  { id: 'assets' as Module, label: 'ทรัพย์สิน', icon: Hammer },
  { id: 'payroll' as Module, label: 'เงินเดือน', icon: Users },
  { id: 'petty-cash' as Module, label: 'เงินสดย่อย', icon: Wallet },
  { id: 'reports' as Module, label: 'รายงาน', icon: BarChart3 },
  { id: 'settings' as Module, label: 'ตั้งค่า', icon: Settings, adminOnly: true },
  { id: 'users' as Module, label: 'จัดการผู้ใช้', icon: UserCog, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ชมเท่านั้น',
};

export function EnhancedSidebar({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  menuItems = defaultMenuItems,
  userRole = 'VIEWER',
  userName = 'ผู้ใช้',
  userId,
  onLogout,
}: EnhancedSidebarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const { recentItems, recordAccess, clearRecentItems } = useRecentItems(userId);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications(userId);

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'n',
      ctrl: true,
      description: 'สร้างใบกำกับภาษีใหม่',
      category: 'ทั่วไป',
      action: () => setActiveModule('invoices' as Module),
    },
    { key: 's', ctrl: true, description: 'บันทึก', category: 'ทั่วไป', action: () => {} },
    {
      key: 'p',
      ctrl: true,
      description: 'พิมพ์',
      category: 'ทั่วไป',
      action: () => window.print(),
    },
    { key: 'Escape', description: 'ปิด/ยกเลิก', category: 'ทั่วไป', action: () => {} },
    { key: 'k', ctrl: true, description: 'ค้นหา', category: 'ทั่วไป', action: () => {} },
    {
      key: '?',
      description: 'แสดงคีย์ลัด',
      category: 'ทั่วไป',
      action: () => setShowShortcuts(true),
    },
  ];

  useKeyboardShortcuts(shortcuts);

  const visibleMenuItems = menuItems.filter((item) => !item.adminOnly || userRole === 'ADMIN');

  const handleRecentItemClick = (item: { module: string; recordId: string }) => {
    setActiveModule(item.module as Module);
  };

  return (
    <>
      <aside
        className={cn(
          'flex h-screen flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300',
          isOpen ? 'w-72' : 'w-16'
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
        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {visibleMenuItems.map((item) => {
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
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={20} />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Recent Items Section */}
          {isOpen && recentItems.length > 0 && (
            <div className="mt-6 border-t border-blue-700 pt-4">
              <RecentItemsList
                items={recentItems}
                onItemClick={handleRecentItemClick}
                onClear={clearRecentItems}
                maxItems={5}
              />
            </div>
          )}
        </ScrollArea>

        {/* Bottom Actions */}
        {isOpen && (
          <div className="space-y-2 border-t border-blue-700 p-3">
            <SyncStatus />
          </div>
        )}

        {/* User Profile & Logout */}
        {isOpen && (
          <div className="border-t border-blue-700 p-3">
            <div className="mb-3 flex items-center gap-2">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAll}
              />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShortcuts(true)}
                className="text-blue-100 hover:bg-blue-700 hover:text-white"
              >
                <Keyboard className="h-5 w-5" />
              </Button>
            </div>

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
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{userName}</p>
                    <p className="text-xs text-blue-300">{roleLabels[userRole] || userRole}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPreferences(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  ตั้งค่า
                </DropdownMenuItem>
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

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      {/* User Preferences Dialog */}
      <UserPreferencesDialog
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={
          {
            theme: 'system',
            density: 'normal',
            language: 'th',
            pageSize: 25,
            dateFormat: 'DD/MM/YYYY',
            currencyFormat: 'THB',
            emailNotifications: true,
            pushNotifications: true,
          } as any
        }
        onSave={() => setShowPreferences(false)}
      />

      {/* PWA Components */}
      <OfflineIndicator />
      <UpdateNotification />
      <InstallPrompt />
    </>
  );
}
