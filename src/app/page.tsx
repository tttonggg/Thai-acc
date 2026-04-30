'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { KeeratiSidebar } from '@/components/layout/keerati-sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { EntityManagement } from '@/components/entities/entity-management'
import { CurrencyManagement } from '@/components/currencies/currency-management'
import { ChartOfAccounts } from '@/components/accounts/chart-of-accounts'
import { JournalEntry } from '@/components/journal/journal-entry'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { InvoiceDetailPage } from '@/components/invoices/invoice-detail-page'
import { VatReport } from '@/components/vat/vat-report'
import { WhtWithTabs } from '@/components/wht/wht-with-tabs'
import { CustomerList } from '@/components/ar/customer-list'
import { VendorList } from '@/components/ap/vendor-list'
import { PaymentList } from '@/components/payments/payment-list'
import { CreditNoteList } from '@/components/credit-notes/credit-note-list'
import { DebitNoteList } from '@/components/debit-notes/debit-note-list'
import { InventoryPage } from '@/components/inventory/inventory-page'
import { BankingPage } from '@/components/banking/banking-page'
import { AssetsPage } from '@/components/assets/assets-page'
import { PayrollPage } from '@/components/payroll/payroll-page'
import { ProvidentFundManagement } from '@/components/payroll/provident-fund-management'
import { LeaveManagement } from '@/components/leave/leave-management'
import { PettyCashPage } from '@/components/petty-cash/petty-cash-page'
import { ProductsPage } from '@/components/products/products-page'
import { StockTakePage } from '@/components/stock-takes/stock-take-page'
import { PurchaseRequestList } from '@/components/purchase-requests/purchase-request-list'
import { PurchaseOrderList } from '@/components/purchase-orders/purchase-order-list'
import { PurchaseList } from '@/components/purchases/purchase-list'
import { QuotationList } from '@/components/quotations/quotation-list'
import { GoodsReceiptNotesList } from '@/components/goods-receipt-notes'
import { ReceiptList } from '@/components/receipts/receipt-list'
import { Reports } from '@/components/reports/reports'
import { CashFlowReport } from '@/components/reports/cash-flow-report'
import { PeriodManagement } from '@/components/accounting-periods/period-management'
import { BudgetManagement } from '@/components/budgets/budget-management'
import { Settings } from '@/components/settings/settings'
import { LoginPage } from '@/components/auth/login-page'
import { UserManagement } from '@/components/auth/user-management'
import { PermissionGuard } from '@/components/auth/permission-guard'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DataExportPage } from '@/components/admin/data-export-page'
import { BackupRestorePage } from '@/components/admin/backup-restore-page'
import { DataImportPage } from '@/components/admin/data-import-page'
import { ActivityLogPage } from '@/components/admin/activity-log-page'
import { WebhookManagement, ApiAnalytics } from '@/components/admin'
import { RecurringDocuments } from '@/components/recurring/recurring-documents'
import { SSOFiling } from '@/components/payroll/sso-filing'
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
} from 'lucide-react'

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

export default function Home() {
  const { data: session, status } = useSession()
  const [activeModule, setActiveModule] = useState<Module>('dashboard')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sync URL with activeModule using history API (doesn't trigger Next.js routing)
  useEffect(() => {
    if (status === 'authenticated') {
      // Map module to URL path
      const moduleToPath: Record<Module, string> = {
        'dashboard': '/',
        'accounts': '/accounts',
        'journal': '/journal',
        'invoices': '/invoices',
        'quotations': '/quotations',
        'receipts': '/receipts',
        'vat': '/vat',
        'wht': '/wht',
        'customers': '/customers',
        'vendors': '/vendors',
        'purchase-requests': '/purchase-requests',
        'purchase-orders': '/purchase-orders',
        'purchases': '/purchases',
        'goods-receipt-notes': '/goods-receipt-notes',
        'payments': '/payments',
        'credit-notes': '/credit-notes',
        'debit-notes': '/debit-notes',
        'inventory': '/inventory',
        'products': '/products',
        'warehouses': '/warehouses',
        'stock-takes': '/stock-takes',
        'banking': '/banking',
        'assets': '/assets',
        'payroll': '/payroll',
        'leave': '/leave',
        'provident-fund': '/provident-fund',
        'employees': '/employees',
        'petty-cash': '/petty-cash',
        'sso-filing': '/sso-filing',
        'reports': '/reports',
        'settings': '/settings',
        'users': '/users',
        'data-export': '/data-export',
        'data-import': '/data-import',
        'backup-restore': '/backup-restore',
        'activity-log': '/activity-log',
        'webhooks': '/webhooks',
        'api-analytics': '/api-analytics',
        'recurring': '/recurring',
        'cash-flow': '/cash-flow',
        'invoice-detail': '/invoices',
      }

      // Update URL when activeModule changes (using history API to avoid Next.js routing)
      const targetPath = moduleToPath[activeModule]
      if (targetPath && window.location.pathname !== targetPath) {
        window.history.pushState({ path: targetPath }, '', targetPath)
      }
    }
  }, [activeModule, status])

  // Initialize activeModule from URL on mount and handle browser navigation
  useEffect(() => {
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
    }

    const handlePopState = () => {
      const pathname = window.location.pathname

      // Check if it's an invoice detail URL
      const invoiceDetailMatch = pathname.match(/^\/invoices\/([^\/]+)$/)
      if (invoiceDetailMatch) {
        const invoiceId = invoiceDetailMatch[1]
        setActiveModule('invoice-detail')
        setSelectedInvoiceId(invoiceId)
        return
      }

      const moduleFromPath = pathToModule[pathname] || 'dashboard'
      setActiveModule(moduleFromPath)
      setSelectedInvoiceId(null)
    }

    // Set initial module from current URL (runs on every mount, captures current browser URL)
    handlePopState()

    // Override pushState/replaceState so SPA navigations (sidebar clicks, etc.)
    // also trigger URL → state sync (not just browser back/forward)
    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    window.history.pushState = (state, _, pathname$?) => {
      originalPushState(state, _, pathname$)
      window.dispatchEvent(new Event('__spa_push__'))
    }
    window.history.replaceState = (state, _, pathname$?) => {
      originalReplaceState(state, _, pathname$)
      window.dispatchEvent(new Event('__spa_push__'))
    }

    // Listen for both browser back/forward AND programmatic pushState navigations
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('__spa_push__', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('__spa_push__', handlePopState)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, []) // Empty deps = run once on mount, before NextAuth status is resolved

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login page
  if (status === 'unauthenticated' || !session) {
    return <LoginPage />
  }

  // Authenticated - show main app
  const userRole = session.user?.role as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'
  
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard setActiveModule={setActiveModule} />
      case 'accounts':
        return <ChartOfAccounts />
      case 'journal':
        return <JournalEntry />
      case 'invoices':
        return <InvoiceList />
      case 'invoice-detail':
        return selectedInvoiceId ? (
          <InvoiceDetailPage
            invoiceId={selectedInvoiceId}
            onBack={() => {
              setActiveModule('invoices')
              setSelectedInvoiceId(null)
              window.history.pushState({ path: '/invoices' }, '', '/invoices')
            }}
            onEdit={(invoiceId) => {
              // Open edit dialog
              // This will be handled by the InvoiceList component
              window.location.href = `/invoices?edit=${invoiceId}`
            }}
          />
        ) : null
      case 'quotations':
        return <QuotationList />
      case 'receipts':
        return <ReceiptList />
      case 'vat':
        return <VatReport />
      case 'wht':
        return <WhtWithTabs />

      case 'customers':
        return <CustomerList />
      case 'vendors':
        return <VendorList />
      case 'purchase-requests':
        return <PurchaseRequestList />
      case 'purchase-orders':
        return <PurchaseOrderList />
      case 'purchases':
        return <PurchaseList />
      case 'goods-receipt-notes':
        return <GoodsReceiptNotesList />
      case 'payments':
        return <PaymentList />
      case 'credit-notes':
        return <CreditNoteList />
      case 'debit-notes':
        return <DebitNoteList />
      case 'inventory':
        return <InventoryPage key="inventory" />
      case 'products':
        return <ProductsPage key="products" />
      case 'warehouses':
        return <InventoryPage key="warehouses" initialTab="warehouses" />
      case 'stock-takes':
        return (
          <PermissionGuard permission="INVENTORY_VIEW">
            <StockTakePage />
          </PermissionGuard>
        )
      case 'banking':
        return <BankingPage />
      case 'assets':
        return <AssetsPage />
      case 'payroll':
        return <PayrollPage key="payroll" initialTab="runs" />
      case 'leave':
        return <LeaveManagement />
      case 'provident-fund':
        return <ProvidentFundManagement />
      case 'employees':
        return <PayrollPage key="employees" initialTab="employees" />
      case 'petty-cash':
        return <PettyCashPage />
      case 'sso-filing':
        return <SSOFiling />
      case 'reports':
        return <Reports />
      case 'settings':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <Settings />
          </PermissionGuard>
        )
      case 'users':
        return (
          <PermissionGuard permission="USER_MANAGEMENT">
            <UserManagement />
          </PermissionGuard>
        )
      case 'data-export':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <DataExportPage />
          </PermissionGuard>
        )
      case 'data-import':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <DataImportPage />
          </PermissionGuard>
        )
      case 'backup-restore':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <BackupRestorePage />
          </PermissionGuard>
        )
      case 'activity-log':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <ActivityLogPage />
          </PermissionGuard>
        )
      case 'webhooks':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <WebhookManagement />
          </PermissionGuard>
        )
      case 'api-analytics':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <ApiAnalytics />
          </PermissionGuard>
        )
      case 'entities':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <EntityManagement />
          </PermissionGuard>
        )
      case 'currencies':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <CurrencyManagement />
          </PermissionGuard>
        )
      case 'accounting-periods':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <PeriodManagement />
          </PermissionGuard>
        )
      case 'budgets':
        return (
          <PermissionGuard permission="SETTINGS_VIEW">
            <BudgetManagement />
          </PermissionGuard>
        )
      case 'recurring':
        return <RecurringDocuments />
      case 'cash-flow':
        return <CashFlowReport />
      default:
        return <Dashboard />
    }
  }

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
    ]

    if (userRole === 'ADMIN') {
      return allItems
    }

    return allItems.filter(item => !item.adminOnly)
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 bg-background border border-border rounded-lg shadow-sm"
              aria-label="เปิดเมนู"
            >
              <Menu size={24} className="text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <KeeratiSidebar
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              userRole={userRole}
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
          userName={session.user?.name || session.user?.email}
          onLogout={() => signOut({ callbackUrl: '/' })}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)] md:pt-0 pt-16">
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  )
}
