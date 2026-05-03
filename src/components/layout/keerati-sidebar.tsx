'use client';

// ============================================
// 🌸 Keerati ERP - Pastel Sidebar with Grouped Menu
// FIXED: Proper contrast for all theme variants
// ============================================

import { useState, useEffect } from 'react';
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
  RefreshCw,
  Shield,
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
import { useThemeStore, themeColors, ThemeVariant } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// ============================================
// 🗂️ Menu Groups
// ============================================
interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: MenuItem[];
  color: string;
}

interface MenuItem {
  id: Module;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiredPermission?: { module: string; action: string }; // RBAC: required permission to show item
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'หน้าหลัก (Main)',
    icon: LayoutDashboard,
    color: 'text-pink-500',
    items: [{ id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard }],
  },
  {
    id: 'sell',
    label: 'ขาย (SELL)',
    icon: Store,
    color: 'text-blue-600',
    items: [
      {
        id: 'customers',
        label: 'ลูกค้า (Customers)',
        icon: Users,
        requiredPermission: { module: 'customer', action: 'read' },
      },
      {
        id: 'quotations',
        label: 'ใบเสนอราคา (Quotation)',
        icon: Quote,
        requiredPermission: { module: 'quotation', action: 'read' },
      },
      {
        id: 'invoices',
        label: 'ใบกำกับภาษี (Tax Invoice)',
        icon: Receipt,
        requiredPermission: { module: 'invoice', action: 'read' },
      },
      {
        id: 'credit-notes',
        label: 'ใบลดหนี้ (Credit Note)',
        icon: FileText,
        requiredPermission: { module: 'credit_note', action: 'read' },
      },
      {
        id: 'debit-notes',
        label: 'ใบเพิ่มหนี้ (Debit Note)',
        icon: FileText,
        requiredPermission: { module: 'debit_note', action: 'read' },
      },
      {
        id: 'receipts',
        label: 'รับเงิน (Receipt)',
        icon: Receipt,
        requiredPermission: { module: 'receipt', action: 'read' },
      },
    ],
  },
  {
    id: 'buy',
    label: 'ซื้อ (BUY)',
    icon: ShoppingCart,
    color: 'text-amber-600',
    items: [
      {
        id: 'vendors',
        label: 'ผู้ขาย (Vendors)',
        icon: Truck,
        requiredPermission: { module: 'vendor', action: 'read' },
      },
      {
        id: 'purchase-requests',
        label: 'ใบขอซื้อ (PR)',
        icon: FileText,
        requiredPermission: { module: 'pr', action: 'read' },
      },
      {
        id: 'purchase-orders',
        label: 'ใบสั่งซื้อ (PO)',
        icon: ShoppingCart,
        requiredPermission: { module: 'po', action: 'read' },
      },
      {
        id: 'goods-receipt-notes',
        label: 'รับสินค้า (GRN)',
        icon: Package,
        requiredPermission: { module: 'grn', action: 'read' },
      },
      {
        id: 'purchases',
        label: 'บันทึกราคา (Purchase Invoice)',
        icon: Receipt,
        requiredPermission: { module: 'purchase_invoice', action: 'read' },
      },
      {
        id: 'payments',
        label: 'จ่ายเงิน (Payment)',
        icon: CreditCard,
        requiredPermission: { module: 'payment', action: 'read' },
      },
    ],
  },
  {
    id: 'accounting',
    label: 'บัญชี (ACCOUNTING)',
    icon: BookOpen,
    color: 'text-emerald-600',
    items: [
      {
        id: 'accounts',
        label: 'ผังบัญชี (Chart of Accounts)',
        icon: BookOpen,
        requiredPermission: { module: 'account', action: 'read' },
      },
      {
        id: 'journal',
        label: 'รายวัน (Journal Entry)',
        icon: FileText,
        requiredPermission: { module: 'journal', action: 'read' },
      },
      {
        id: 'banking',
        label: 'ธนาคาร (Banking)',
        icon: Building2,
        requiredPermission: { module: 'banking', action: 'read' },
      },
    ],
  },
  {
    id: 'reports-tax',
    label: 'รายงาน/ภาษี (REPORTS & TAX)',
    icon: BarChart3,
    color: 'text-violet-600',
    items: [
      {
        id: 'vat',
        label: 'VAT Report',
        icon: Percent,
        requiredPermission: { module: 'report', action: 'read' },
      },
      {
        id: 'wht',
        label: 'WHT Report',
        icon: Landmark,
        requiredPermission: { module: 'report', action: 'read' },
      },
      {
        id: 'reports',
        label: 'Variance Report',
        icon: Activity,
        requiredPermission: { module: 'report', action: 'read' },
      },
      {
        id: 'cash-flow',
        label: 'งบกระแสเงินสด (Cash Flow)',
        icon: BarChart3,
        requiredPermission: { module: 'report', action: 'read' },
      },
      {
        id: 'accounting-periods',
        label: 'งวดบัญชี (Accounting Periods)',
        icon: Calendar,
        requiredPermission: { module: 'accounting_period', action: 'read' },
      },
      {
        id: 'recurring',
        label: 'เอกสารประจำ (Recurring)',
        icon: RefreshCw,
        requiredPermission: { module: 'recurring', action: 'read' },
      },
    ],
  },
  {
    id: 'assets-inventory',
    label: 'สินทรัพย์ (ASSETS & INVENTORY)',
    icon: Package,
    color: 'text-cyan-600',
    items: [
      {
        id: 'assets',
        label: 'สินทรัพย์ถาวร (Fixed Assets)',
        icon: Hammer,
        requiredPermission: { module: 'asset', action: 'read' },
      },
      {
        id: 'inventory',
        label: 'สินค้าคงคลัง (Inventory)',
        icon: Package,
        requiredPermission: { module: 'inventory', action: 'read' },
      },
      {
        id: 'products',
        label: 'สินค้า (Products)',
        icon: Package,
        requiredPermission: { module: 'product', action: 'read' },
      },
      {
        id: 'warehouses',
        label: 'คลังสินค้า (Warehouses)',
        icon: Building2,
        requiredPermission: { module: 'warehouse', action: 'read' },
      },
      {
        id: 'petty-cash',
        label: 'กระเป๋าเงินสด (Petty Cash)',
        icon: Wallet,
        requiredPermission: { module: 'petty_cash', action: 'read' },
      },
    ],
  },
  {
    id: 'people',
    label: 'บุคคล (PEOPLE)',
    icon: Users,
    color: 'text-rose-600',
    items: [
      {
        id: 'employees',
        label: 'พนักงาน (Employees)',
        icon: UserCog,
        requiredPermission: { module: 'employee', action: 'read' },
      },
      {
        id: 'payroll',
        label: 'ค่าจ้าง (Payroll)',
        icon: Users,
        requiredPermission: { module: 'payroll', action: 'read' },
      },
      {
        id: 'provident-fund',
        label: 'กองทุนสำรองเลี้ยงชีพ (Provident)',
        icon: PiggyBank,
        requiredPermission: { module: 'provident_fund', action: 'read' },
      },
      { id: 'leave', label: 'ลางาน (Leave)', icon: Calendar },
      { id: 'sso-filing', label: 'ประกันสังคม (SSC)', icon: Shield },
    ],
  },
  {
    id: 'settings',
    label: 'ตั้งค่า (SETTINGS)',
    icon: Settings,
    color: 'text-slate-500',
    items: [
      {
        id: 'settings',
        label: 'ตั้งค่าระบบ (System Settings)',
        icon: Settings,
        requiredPermission: { module: 'admin', action: 'manage' },
      },
      {
        id: 'users',
        label: 'จัดการผู้ใช้ (User Management)',
        icon: UserCog,
        requiredPermission: { module: 'admin', action: 'users' },
      },
      {
        id: 'entities',
        label: 'บริษัทในเครือ (Entities)',
        icon: Building,
        requiredPermission: { module: 'company', action: 'read' },
      },
      {
        id: 'currencies',
        label: 'สกุลเงิน (Currencies)',
        icon: DollarSign,
        requiredPermission: { module: 'currency', action: 'read' },
      },
      {
        id: 'budgets',
        label: 'งบประมาณ (Budgets)',
        icon: PiggyBank,
        requiredPermission: { module: 'budget', action: 'read' },
      },
    ],
  },
];

interface SidebarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  userRole?: string;
  permissions?: string[];
  userName?: string;
  onLogout?: () => void;
  onCloseMobile?: () => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ชมเท่านั้น',
};

// ============================================
// 🎨 Theme Customization Dialog
// ============================================
function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    theme: pastelTheme,
    setTheme: setPastelTheme,
    animationsEnabled,
    toggleAnimations,
    borderRadius,
    setBorderRadius,
    accentIntensity,
    setAccentIntensity,
  } = useThemeStore();

  // Prevent hydration mismatch with next-themes
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Sync next-themes with Zustand pastel theme (with fallback to prevent issues)
  const isDarkMode = mounted && theme === 'dark';
  const toggleDarkMode = () => setTheme(isDarkMode ? 'light' : 'dark');

  const radiusLabels = { sm: 'เล็ก', md: 'ปานกลาง', lg: 'ใหญ่', xl: 'ใหญ่พิเศษ' };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]">
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
              {isDarkMode ? (
                <Moon size={18} className="text-[var(--primary)]" />
              ) : (
                <Sun size={18} className="text-[var(--primary)]" />
              )}
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
                    'relative rounded-xl p-3 transition-all hover:scale-105',
                    pastelTheme === variant
                      ? 'scale-105 ring-2 ring-[var(--primary)] ring-offset-2'
                      : ''
                  )}
                  style={{ background: themeColors[variant].gradient }}
                  title={themeColors[variant].nameTh}
                >
                  {pastelTheme === variant && (
                    <Heart
                      size={14}
                      className="absolute right-1 top-1 text-[var(--primary-foreground)] drop-shadow-md"
                      fill="currentColor"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              {themeColors[pastelTheme].nameTh} ({themeColors[pastelTheme].name})
            </p>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--foreground)]">ความมนของขอบ</Label>
            <div className="flex gap-2">
              {(Object.keys(radiusLabels) as Array<'sm' | 'md' | 'lg' | 'xl'>).map((r) => (
                <button
                  key={r}
                  onClick={() => setBorderRadius(r)}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm transition-all',
                    borderRadius === r
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)]'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
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
                    'flex-1 rounded-lg px-3 py-2 text-sm capitalize transition-all',
                    accentIntensity === intensity
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)]'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
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
  );
}

// ============================================
// 🌸 Main Sidebar Component
// ============================================
export function KeeratiSidebar({
  activeModule,
  setActiveModule,
  userRole = 'VIEWER',
  permissions = [],
  userName = 'ผู้ใช้',
  onLogout,
  onCloseMobile,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { expandedGroups, toggleGroup, isSidebarCollapsed, toggleSidebar } = useThemeStore();
  const authStore = useAuthStore();

  const isCollapsed = isSidebarCollapsed;

  // Permission check helper
  const hasPermission = (module: string, action: string): boolean => {
    // ADMIN has all permissions
    if (userRole === 'ADMIN') return true;
    // Use passed permissions or fallback to auth store
    const perms = permissions.length > 0 ? permissions : authStore.permissions;
    const code = `${module}.${action}`;
    return perms.includes(code);
  };

  // Filter items by permission
  const filterByPermission = (item: MenuItem): boolean => {
    if (!item.requiredPermission) return true;
    const { module, action } = item.requiredPermission;
    return hasPermission(module, action);
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* 🎀 Logo Header */}
      <div
        className={cn(
          'flex items-center border-b border-[var(--sidebar-border)]',
          isCollapsed ? 'flex-col gap-2 px-2 py-3' : 'justify-between px-4 py-4'
        )}
      >
        <div className={cn('flex items-center', isCollapsed ? 'w-full justify-center' : 'gap-3')}>
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #ffb6c1, #ffd1dc)' }}
          >
            <Car className="h-7 w-7 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-[var(--sidebar-foreground)]">Keerati ERP</h1>
              <p className="text-xs text-[var(--muted-foreground)]">โปรแกรมบัญชีสไตล์คุณ</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex-shrink-0 rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)]',
            isCollapsed ? 'p-2' : 'p-2'
          )}
          title={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* 🗂️ Grouped Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {isCollapsed
          ? // Collapsed view - flat list with tooltips
            menuGroups
              .flatMap((g) => g.items)
              .filter(filterByPermission)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      onCloseMobile?.();
                    }}
                    className={cn(
                      'flex w-full items-center justify-center rounded-xl p-3 transition-all duration-200',
                      isActive
                        ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-md'
                        : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]'
                    )}
                    title={item.label}
                  >
                    <Icon size={22} />
                  </button>
                );
              })
          : // Expanded view - grouped
            menuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups.includes(group.id);
              const hasActiveItem = group.items.some((item) => item.id === activeModule);

              // Check if group has visible items (based on permissions)
              const visibleItems = group.items.filter(filterByPermission);
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.id} className="mb-2">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                      hasActiveItem
                        ? 'bg-[var(--sidebar-accent)] font-medium text-[var(--sidebar-accent-foreground)]'
                        : 'hover:bg-[var(--sidebar-accent)]/50 text-[var(--sidebar-foreground)]'
                    )}
                  >
                    <GroupIcon size={18} className={cn(hasActiveItem && group.color)} />
                    <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-[var(--muted-foreground)]" />
                    ) : (
                      <ChevronDown size={16} className="text-[var(--muted-foreground)]" />
                    )}
                  </button>

                  {/* Group Items */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-[var(--sidebar-border)] pl-3">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeModule === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveModule(item.id);
                              onCloseMobile?.();
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200',
                              isActive
                                ? 'bg-[var(--sidebar-primary)] font-medium text-[var(--sidebar-primary-foreground)] shadow-sm'
                                : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]'
                            )}
                          >
                            <Icon size={16} className="flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
      </nav>

      {/* 🎨 Theme Customizer & User */}
      <div className="space-y-2 border-t border-[var(--sidebar-border)] p-3">
        {/* Theme Customizer */}
        {!isCollapsed && <ThemeCustomizer />}

        {/* Expand/Collapse Button (when collapsed) */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-xl p-3 text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)]"
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
                className="h-auto w-full justify-start gap-3 rounded-xl p-3 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
              >
                <Avatar
                  className="h-9 w-9"
                  style={{ background: 'linear-gradient(135deg, #ffb6c1, #ffd1dc)' }}
                >
                  <AvatarFallback className="text-sm font-bold text-white">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="truncate text-sm font-medium text-[var(--sidebar-foreground)]">
                    {userName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {roleLabels[userRole] || userRole}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[var(--foreground)]">
                บัญชีของฉัน
              </DropdownMenuLabel>
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
  );
}
