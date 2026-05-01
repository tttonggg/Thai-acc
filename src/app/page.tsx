'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth-store';
import { useQueryClient } from '@tanstack/react-query';
import { KeeratiSidebar } from '@/components/layout/keerati-sidebar';
import { eventBus, EVENTS } from '@/lib/events';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// Lazy-loaded module components for code-splitting
const Dashboard = lazy(() => import('@/components/dashboard/dashboard').then(m => ({ default: m.Dashboard })));
const EntityManagement = lazy(() => import('@/components/entities/entity-management').then(m => ({ default: m.EntityManagement })));
const CurrencyManagement = lazy(() => import('@/components/currencies/currency-management').then(m => ({ default: m.CurrencyManagement })));
const ChartOfAccounts = lazy(() => import('@/components/accounts/chart-of-accounts').then(m => ({ default: m.ChartOfAccounts })));
const JournalEntry = lazy(() => import('@/components/journal/journal-entry').then(m => ({ default: m.JournalEntry })));
const InvoiceList = lazy(() => import('@/components/invoices/invoice-list').then(m => ({ default: m.InvoiceList })));
const InvoiceDetailPage = lazy(() => import('@/components/invoices/invoice-detail-page').then(m => ({ default: m.InvoiceDetailPage })));
const VatReport = lazy(() => import('@/components/vat/vat-report').then(m => ({ default: m.VatReport })));
const WhtWithTabs = lazy(() => import('@/components/wht/wht-with-tabs').then(m => ({ default: m.WhtWithTabs })));
const CustomerList = lazy(() => import('@/components/ar/customer-list').then(m => ({ default: m.CustomerList })));
const VendorList = lazy(() => import('@/components/ap/vendor-list').then(m => ({ default: m.VendorList })));
const PaymentList = lazy(() => import('@/components/payments/payment-list').then(m => ({ default: m.PaymentList })));
const CreditNoteList = lazy(() => import('@/components/credit-notes/credit-note-list').then(m => ({ default: m.CreditNoteList })));
const DebitNoteList = lazy(() => import('@/components/debit-notes/debit-note-list').then(m => ({ default: m.DebitNoteList })));
const InventoryPage = lazy(() => import('@/components/inventory/inventory-page').then(m => ({ default: m.InventoryPage })));
const BankingPage = lazy(() => import('@/components/banking/banking-page').then(m => ({ default: m.BankingPage })));
const AssetsPage = lazy(() => import('@/components/assets/assets-page').then(m => ({ default: m.AssetsPage })));
const PayrollPage = lazy(() => import('@/components/payroll/payroll-page').then(m => ({ default: m.PayrollPage })));
const ProvidentFundManagement = lazy(() => import('@/components/payroll/provident-fund-management').then(m => ({ default: m.ProvidentFundManagement })));
const LeaveManagement = lazy(() => import('@/components/leave/leave-management').then(m => ({ default: m.LeaveManagement })));
const PettyCashPage = lazy(() => import('@/components/petty-cash/petty-cash-page').then(m => ({ default: m.PettyCashPage })));
const ProductsPage = lazy(() => import('@/components/products/products-page').then(m => ({ default: m.ProductsPage })));
const StockTakePage = lazy(() => import('@/components/stock-takes/stock-take-page').then(m => ({ default: m.StockTakePage })));
const PurchaseRequestList = lazy(() => import('@/components/purchase-requests/purchase-request-list').then(m => ({ default: m.PurchaseRequestList })));
const PurchaseOrderList = lazy(() => import('@/components/purchase-orders/purchase-order-list').then(m => ({ default: m.PurchaseOrderList })));
const PurchaseList = lazy(() => import('@/components/purchases/purchase-list').then(m => ({ default: m.PurchaseList })));
const QuotationList = lazy(() => import('@/components/quotations/quotation-list').then(m => ({ default: m.QuotationList })));
const GoodsReceiptNotesList = lazy(() => import('@/components/goods-receipt-notes').then(m => ({ default: m.GoodsReceiptNotesList })));
const ReceiptList = lazy(() => import('@/components/receipts/receipt-list').then(m => ({ default: m.ReceiptList })));
const Reports = lazy(() => import('@/components/reports/reports').then(m => ({ default: m.Reports })));
const CashFlowReport = lazy(() => import('@/components/reports/cash-flow-report').then(m => ({ default: m.CashFlowReport })));
const PeriodManagement = lazy(() => import('@/components/accounting-periods/period-management').then(m => ({ default: m.PeriodManagement })));
const BudgetManagement = lazy(() => import('@/components/budgets/budget-management').then(m => ({ default: m.BudgetManagement })));
const Settings = lazy(() => import('@/components/settings/settings').then(m => ({ default: m.Settings })));
const LoginPage = lazy(() => import('@/components/auth/login-page').then(m => ({ default: m.LoginPage })));
const UserManagement = lazy(() => import('@/components/auth/user-management').then(m => ({ default: m.UserManagement })));
const PermissionGuard = lazy(() => import('@/components/auth/permission-guard').then(m => ({ default: m.PermissionGuard })));
const DataExportPage = lazy(() => import('@/components/admin/data-export-page').then(m => ({ default: m.DataExportPage })));
const BackupRestorePage = lazy(() => import('@/components/admin/backup-restore-page').then(m => ({ default: m.BackupRestorePage })));
const DataImportPage = lazy(() => import('@/components/admin/data-import-page').then(m => ({ default: m.DataImportPage })));
const ActivityLogPage = lazy(() => import('@/components/admin/activity-log-page').then(m => ({ default: m.ActivityLogPage })));
const RoleManagement = lazy(() => import('@/components/admin/role-management/role-management').then(m => ({ default: m.RoleManagement })));
const ApproverConfig = lazy(() => import('@/components/admin/approver-config/approver-config').then(m => ({ default: m.ApproverConfig })));
const WebhookManagement = lazy(() => import('@/components/admin').then(m => ({ default: m.WebhookManagement })));
const ApiAnalytics = lazy(() => import('@/components/admin').then(m => ({ default: m.ApiAnalytics })));
const RecurringDocuments = lazy(() => import('@/components/recurring/recurring-documents').then(m => ({ default: m.RecurringDocuments })));
const SSOFiling = lazy(() => import('@/components/payroll/sso-filing').then(m => ({ default: m.SSOFiling })));

// Module loading skeleton fallback
function ModuleSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">กำลังโหลด...</p>
      </div>
    </div>
  );
}

// Separate client component for dashboard data prefetching
// This prevents Next.js from trying to prerender useQueryClient at module level
function DashboardPrefetch({ status }: { status: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'authenticated') {
      queryClient.prefetchQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
          const res = await fetch(`/api/dashboard`, { credentials: 'include' });
          if (!res.ok) throw new Error('Failed to fetch dashboard');
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Unknown error');
          return json.data;
        },
        staleTime: 2 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: ['recent-invoices'],
        queryFn: async () => {
          const res = await fetch(`/api/invoices?limit=10&sort=createdAt:desc`, { credentials: 'include' });
          if (!res.ok) throw new Error('Failed to fetch recent invoices');
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Unknown error');
          return json.data;
        },
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [status, queryClient]);

  return null;
}
import {
  Loader2,
  LayoutDashboard,
  BookOpen,
  PenTool,
  FileText,
  Percent,
  Receipt,
  Users,
  Truck,
  CreditCard,
  FileMinus,
  FilePlus,
  Package,
  ShoppingBag,
  FileCheck,
  Building2,
  Hammer,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  UserCog,
  Download,
  Upload,
  Database,
  Activity,
  Webhook,
  BarChart,
  Menu,
  Shield,
} from 'lucide-react';

export type Module =
  | 'dashboard'
  | 'accounts'
  | 'journal'
  | 'invoices'
  | 'invoice-detail'
  | 'quotations'
  | 'receipts'
  | 'vat'
  | 'wht'
  | 'customers'
  | 'vendors'
  | 'purchase-requests'
  | 'role-management'
  | 'purchase-orders'
  | 'purchases'
  | 'goods-receipt-notes'
  | 'payments'
  | 'credit-notes'
  | 'debit-notes'
  | 'inventory'
  | 'products'
  | 'warehouses'
  | 'stock-takes'
  | 'banking'
  | 'assets'
  | 'payroll'
  | 'leave'
  | 'provident-fund'
  | 'employees'
  | 'petty-cash'
  | 'sso-filing'
  | 'reports'
  | 'settings'
  | 'users'
  | 'data-export'
  | 'backup-restore'
  | 'data-import'
  | 'activity-log'
  | 'webhooks'
  | 'api-analytics'
  | 'cash-flow'
  | 'recurring'
  | 'approver-config'
  | 'entities'
  | 'currencies'
  | 'accounting-periods'
  | 'budgets';

export default function Home() {
  const { data: session, status } = useSession();
  const store = useAuthStore();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch permissions on mount and store in auth - MUST be at top level
  useEffect(() => {
    const { setUser, setPermissions } = useAuthStore.getState();
    async function loadPermissions() {
      try {
        const permsRes = await fetch('/api/admin/permissions/my');
        const permsData = await permsRes.json();
        const perms = permsData.data?.permissions || [];
        setPermissions(perms);
      } catch (e) {
        console.error('Failed to load permissions', e);
      }
    }
    if (session?.user) {
      const userRole = session.user.role as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER';
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || null,
        role: userRole,
        isActive: true,
      });
      loadPermissions();
    }
  }, [session]);

  // Sync URL with activeModule using history API (doesn't trigger Next.js routing)
  useEffect(() => {
    if (status === 'authenticated') {
      // Map module to URL path
      const moduleToPath: Record<Module, string> = {
        dashboard: '/',
        accounts: '/accounts',
        journal: '/journal',
        invoices: '/invoices',
        quotations: '/quotations',
        receipts: '/receipts',
        vat: '/vat',
        wht: '/wht',
        customers: '/customers',
        vendors: '/vendors',
        'purchase-requests': '/purchase-requests',
        'purchase-orders': '/purchase-orders',
        purchases: '/purchases',
        'goods-receipt-notes': '/goods-receipt-notes',
        payments: '/payments',
        'credit-notes': '/credit-notes',
        'debit-notes': '/debit-notes',
        inventory: '/inventory',
        products: '/products',
        warehouses: '/warehouses',
        'stock-takes': '/stock-takes',
        banking: '/banking',
        assets: '/assets',
        payroll: '/payroll',
        leave: '/leave',
        'provident-fund': '/provident-fund',
        employees: '/employees',
        'petty-cash': '/petty-cash',
        'sso-filing': '/sso-filing',
        reports: '/reports',
        settings: '/settings',
        users: '/users',
        'data-export': '/data-export',
        'data-import': '/data-import',
        'backup-restore': '/backup-restore',
        'activity-log': '/activity-log',
        webhooks: '/webhooks',
        'api-analytics': '/api-analytics',
        'role-management': '/role-management',
        recurring: '/recurring',
        'cash-flow': '/cash-flow',
        'invoice-detail': '/invoices',
        'approver-config': '/approver-config',
        entities: '/entities',
        currencies: '/currencies',
        'accounting-periods': '/accounting-periods',
        budgets: '/budgets',
      };

      // Update URL when activeModule changes (using history API to avoid Next.js routing)
      const targetPath = moduleToPath[activeModule];
      if (targetPath && window.location.pathname !== targetPath) {
        window.history.pushState({ path: targetPath }, '', targetPath);
      }
    }
  }, [activeModule, status]);

  // Initialize activeModule from URL on mount and handle browser navigation
  useEffect(() => {
    if (status === 'authenticated') {
      const pathToModule: Record<string, Module> = {
        '/': 'dashboard',
        '/accounts': 'accounts',
        '/journal': 'journal',
        '/invoices': 'invoices',
        '/quotations': 'quotations',
        '/receipts': 'receipts',
        '/vat': 'vat',
        '/wht': 'wht',
        '/customers': 'customers',
        '/vendors': 'vendors',
        '/purchase-requests': 'purchase-requests',
        '/purchase-orders': 'purchase-orders',
        '/purchases': 'purchases',
        '/goods-receipt-notes': 'goods-receipt-notes',
        '/payments': 'payments',
        '/credit-notes': 'credit-notes',
        '/debit-notes': 'debit-notes',
        '/inventory': 'inventory',
        '/products': 'products',
        '/warehouses': 'warehouses',
        '/stock-takes': 'stock-takes',
        '/banking': 'banking',
        '/assets': 'assets',
        '/payroll': 'payroll',
        '/leave': 'leave',
        '/provident-fund': 'provident-fund',
        '/employees': 'employees',
        '/petty-cash': 'petty-cash',
        '/sso-filing': 'sso-filing',
        '/reports': 'reports',
        '/settings': 'settings',
        '/users': 'users',
        '/data-export': 'data-export',
        '/data-import': 'data-import',
        '/backup-restore': 'backup-restore',
        '/activity-log': 'activity-log',
        '/webhooks': 'webhooks',
        '/api-analytics': 'api-analytics',
        '/recurring': 'recurring',
        '/cash-flow': 'cash-flow',
        '/approver-config': 'approver-config',
        '/entities': 'entities',
        '/currencies': 'currencies',
        '/accounting-periods': 'accounting-periods',
        '/budgets': 'budgets',
      };

      const handlePopState = () => {
        const pathname = window.location.pathname;

        // Check if it's an invoice detail URL
        const invoiceDetailMatch = pathname.match(/^\/invoices\/([^\/]+)$/);
        if (invoiceDetailMatch) {
          const invoiceId = invoiceDetailMatch[1];
          setActiveModule('invoice-detail');
          setSelectedInvoiceId(invoiceId);
          return;
        }

        const moduleFromPath = pathToModule[pathname] || 'dashboard';
        setActiveModule(moduleFromPath);
        setSelectedInvoiceId(null);
      };

      // Set initial module from current URL
      handlePopState();

      // Listen for browser back/forward navigation
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [status]);

  // Listen for invoice detail view events from child components
  useEffect(() => {
    const handleViewDetail = (invoiceId: string) => {
      setActiveModule('invoice-detail');
      setSelectedInvoiceId(invoiceId);
      window.history.pushState({ path: `/invoices/${invoiceId}` }, '', `/invoices/${invoiceId}`);
    };
    eventBus.on(EVENTS.INVOICE_VIEW_DETAIL, handleViewDetail);
    return () => eventBus.off(EVENTS.INVOICE_VIEW_DETAIL, handleViewDetail);
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (status === 'unauthenticated' || !session) {
    return <Suspense fallback={<ModuleSkeleton />}><LoginPage /></Suspense>;
  }

  // Authenticated - show main app
  const userRole = session.user?.role as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER';

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard setActiveModule={setActiveModule} />;
      case 'accounts':
        return <ChartOfAccounts />;
      case 'journal':
        return <JournalEntry />;
      case 'invoices':
        return <InvoiceList />;
      case 'invoice-detail':
        return selectedInvoiceId ? (
          <InvoiceDetailPage
            invoiceId={selectedInvoiceId}
            onBack={() => {
              setActiveModule('invoices');
              setSelectedInvoiceId(null);
              window.history.pushState({ path: '/invoices' }, '', '/invoices');
            }}
            onEdit={(invoiceId) => {
              // Open edit dialog
              // This will be handled by the InvoiceList component
              window.location.href = `/invoices?edit=${invoiceId}`;
            }}
          />
        ) : null;
      case 'quotations':
        return <QuotationList />;
      case 'receipts':
        return <ReceiptList />;
      case 'vat':
        return <VatReport />;
      case 'wht':
        return <WhtWithTabs />;

      case 'customers':
        return <CustomerList />;
      case 'vendors':
        return <VendorList />;
      case 'purchase-requests':
        return <PurchaseRequestList />;
      case 'purchase-orders':
        return <PurchaseOrderList />;
      case 'purchases':
        return <PurchaseList />;
      case 'goods-receipt-notes':
        return <GoodsReceiptNotesList />;
      case 'payments':
        return <PaymentList />;
      case 'credit-notes':
        return <CreditNoteList />;
      case 'debit-notes':
        return <DebitNoteList />;
      case 'inventory':
        return <InventoryPage key="inventory" />;
      case 'products':
        return <ProductsPage key="products" />;
      case 'warehouses':
        return <InventoryPage key="warehouses" initialTab="warehouses" />;
      case 'stock-takes':
        return (
          <PermissionGuard permission="INVENTORY_VIEW">
            <StockTakePage />
          </PermissionGuard>
        );
      case 'banking':
        return <BankingPage />;
      case 'assets':
        return <AssetsPage />;
      case 'payroll':
        return <PayrollPage key="payroll" initialTab="runs" />;
      case 'leave':
        return <LeaveManagement />;
      case 'provident-fund':
        return <ProvidentFundManagement />;
      case 'employees':
        return <PayrollPage key="employees" initialTab="employees" />;
      case 'petty-cash':
        return <PettyCashPage />;
      case 'sso-filing':
        return <SSOFiling />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <Settings />
          </PermissionGuard>
        );
      case 'users':
        return (
          <PermissionGuard permission="USER_MANAGEMENT">
            <UserManagement />
          </PermissionGuard>
        );
      case 'data-export':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <DataExportPage />
          </PermissionGuard>
        );
      case 'data-import':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <DataImportPage />
          </PermissionGuard>
        );
      case 'backup-restore':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <BackupRestorePage />
          </PermissionGuard>
        );
      case 'activity-log':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <ActivityLogPage />
          </PermissionGuard>
        );
      case 'webhooks':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <WebhookManagement />
          </PermissionGuard>
        );
      case 'api-analytics':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <ApiAnalytics />
          </PermissionGuard>
        );
      case 'role-management':
        return <RoleManagement />;
      case 'approver-config':
        return <ApproverConfig />;
      case 'entities':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <EntityManagement />
          </PermissionGuard>
        );
      case 'currencies':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <CurrencyManagement />
          </PermissionGuard>
        );
      case 'accounting-periods':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <PeriodManagement />
          </PermissionGuard>
        );
      case 'budgets':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <BudgetManagement />
          </PermissionGuard>
        );
      case 'recurring':
        return <RecurringDocuments />;
      case 'cash-flow':
        return <CashFlowReport />;
      default:
        return <Dashboard />;
    }
  };

  // Filter menu items based on role
  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard' as Module, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'accounts' as Module, label: 'ผังบัญชี', icon: BookOpen },
      { id: 'journal' as Module, label: 'บันทึกบัญชี', icon: PenTool },
      { id: 'invoices' as Module, label: 'ใบกำกับภาษี', icon: FileText },
      { id: 'vat' as Module, label: 'ภาษีมูลค่าเพิ่ม', icon: Percent },
      { id: 'wht' as Module, label: 'ภาษีหัก ณ ที่จ่าย', icon: Receipt },
      { id: 'customers' as Module, label: 'ลูกหนี้ (AR)', icon: Users },
      { id: 'vendors' as Module, label: 'เจ้าหนี้ (AP)', icon: Truck },
      { id: 'payments' as Module, label: 'ใบจ่ายเงิน', icon: CreditCard },
      { id: 'credit-notes' as Module, label: 'ใบลดหนี้ (CN)', icon: FileMinus },
      { id: 'debit-notes' as Module, label: 'ใบเพิ่มหนี้ (DN)', icon: FilePlus },
      { id: 'inventory' as Module, label: 'สต็อกสินค้า', icon: Package },
      { id: 'products' as Module, label: 'สินค้าและบริการ', icon: ShoppingBag },
      { id: 'stock-takes' as Module, label: 'การตรวจนับสต็อก', icon: FileCheck },
      { id: 'banking' as Module, label: 'ธนาคาร', icon: Building2 },
      { id: 'assets' as Module, label: 'ทรัพย์สินถาวร', icon: Hammer },
      { id: 'payroll' as Module, label: 'เงินเดือน', icon: Users },
      { id: 'petty-cash' as Module, label: 'เงินสดย่อย', icon: Wallet },
      { id: 'reports' as Module, label: 'รายงาน', icon: BarChart3 },
      { id: 'settings' as Module, label: 'ตั้งค่า', icon: SettingsIcon, adminOnly: true },
      { id: 'users' as Module, label: 'จัดการผู้ใช้', icon: UserCog, adminOnly: true },
      { id: 'data-export' as Module, label: 'ส่งออกข้อมูล', icon: Download, adminOnly: true },
      { id: 'data-import' as Module, label: 'นำเข้าข้อมูล', icon: Upload, adminOnly: true },
      { id: 'backup-restore' as Module, label: 'สำรองข้อมูล', icon: Database, adminOnly: true },
      { id: 'activity-log' as Module, label: 'บันทึกกิจกรรม', icon: Activity, adminOnly: true },
      { id: 'webhooks' as Module, label: 'Webhooks', icon: Webhook, adminOnly: true },
      { id: 'api-analytics' as Module, label: 'API Analytics', icon: BarChart, adminOnly: true },
    ];

    if (userRole === 'ADMIN') {
      return allItems;
    }

    return allItems.filter((item) => !item.adminOnly);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Prefetch dashboard data on mount */}
      <DashboardPrefetch status={status} />

      {/* Mobile Hamburger Menu */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="rounded-lg border border-border bg-background p-2 shadow-sm"
              aria-label="เปิดเมนู"
            >
              <Menu size={24} className="text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <KeeratiSidebar
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              userRole={userRole}
              permissions={store.permissions}
              userName={session.user?.name || session.user?.email}
              onLogout={() => signOut({ callbackUrl: '/' })}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <KeeratiSidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userRole={userRole}
          permissions={store.permissions}
          userName={session.user?.name || session.user?.email}
          onLogout={() => signOut({ callbackUrl: '/' })}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)] pt-16 md:pt-0">
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6"><Suspense fallback={<ModuleSkeleton />}>{renderModule()}</Suspense></main>
      </div>
    </div>
  );
}
