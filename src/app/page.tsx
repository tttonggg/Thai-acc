'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Dashboard } from '@/components/dashboard/dashboard'
import { ChartOfAccounts } from '@/components/accounts/chart-of-accounts'
import { JournalEntry } from '@/components/journal/journal-entry'
import { InvoiceList } from '@/components/invoices/invoice-list'
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
import { PettyCashPage } from '@/components/petty-cash/petty-cash-page'
import { ProductsPage } from '@/components/products/products-page'
import { StockTakePage } from '@/components/stock-takes/stock-take-page'
import { Reports } from '@/components/reports/reports'
import { Settings } from '@/components/settings/settings'
import { LoginPage } from '@/components/auth/login-page'
import { UserManagement } from '@/components/auth/user-management'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { DataExportPage } from '@/components/admin/data-export-page'
import { BackupRestorePage } from '@/components/admin/backup-restore-page'
import { DataImportPage } from '@/components/admin/data-import-page'
import { ActivityLogPage } from '@/components/admin/activity-log-page'
import { WebhookManagement, ApiAnalytics } from '@/components/admin'
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
} from 'lucide-react'

export type Module =
  | 'dashboard'
  | 'accounts'
  | 'journal'
  | 'invoices'
  | 'vat'
  | 'wht'
  | 'customers'
  | 'vendors'
  | 'payments'
  | 'credit-notes'
  | 'debit-notes'
  | 'inventory'
  | 'products'
  | 'stock-takes'
  | 'banking'
  | 'assets'
  | 'payroll'
  | 'petty-cash'
  | 'reports'
  | 'settings'
  | 'users'
  | 'data-export'
  | 'backup-restore'
  | 'data-import'
  | 'activity-log'
  | 'webhooks'
  | 'api-analytics'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeModule, setActiveModule] = useState<Module>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        return <Dashboard />
      case 'accounts':
        return <ChartOfAccounts />
      case 'journal':
        return <JournalEntry />
      case 'invoices':
        return <InvoiceList />
      case 'vat':
        return <VatReport />
      case 'wht':
        return <WhtWithTabs />

      case 'customers':
        return <CustomerList />
      case 'vendors':
        return <VendorList />
      case 'payments':
        return <PaymentList />
      case 'credit-notes':
        return <CreditNoteList />
      case 'debit-notes':
        return <DebitNoteList />
      case 'inventory':
        return <InventoryPage />
      case 'products':
        return <ProductsPage />
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
        return <PayrollPage />
      case 'petty-cash':
        return <PettyCashPage />
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        menuItems={getMenuItems()}
        userRole={userRole}
        userName={session.user?.name || session.user?.email}
        onLogout={() => signOut({ callbackUrl: '/' })}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userName={session.user?.name || session.user?.email}
          userRole={userRole}
          onLogout={() => signOut({ callbackUrl: '/' })}
        />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  )
}
