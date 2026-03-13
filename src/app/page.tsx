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
import { InventoryPage } from '@/components/inventory/inventory-page'
import { BankingPage } from '@/components/banking/banking-page'
import { AssetsPage } from '@/components/assets/assets-page'
import { PayrollPage } from '@/components/payroll/payroll-page'
import { PettyCashPage } from '@/components/petty-cash/petty-cash-page'
import { Reports } from '@/components/reports/reports'
import { Settings } from '@/components/settings/settings'
import { LoginPage } from '@/components/auth/login-page'
import { UserManagement } from '@/components/auth/user-management'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { Loader2 } from 'lucide-react'

export type Module =
  | 'dashboard'
  | 'accounts'
  | 'journal'
  | 'invoices'
  | 'vat'
  | 'wht'
  | 'customers'
  | 'vendors'
  | 'inventory'
  | 'banking'
  | 'assets'
  | 'payroll'
  | 'petty-cash'
  | 'reports'
  | 'settings'
  | 'users'

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
      case 'inventory':
        return <InventoryPage />
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
      default:
        return <Dashboard />
    }
  }

  // Filter menu items based on role
  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard' as Module, label: 'Dashboard', icon: 'LayoutDashboard' },
      { id: 'accounts' as Module, label: 'ผังบัญชี', icon: 'BookOpen' },
      { id: 'journal' as Module, label: 'บันทึกบัญชี', icon: 'PenTool' },
      { id: 'invoices' as Module, label: 'ใบกำกับภาษี', icon: 'FileText' },
      { id: 'vat' as Module, label: 'ภาษีมูลค่าเพิ่ม', icon: 'Percent' },
      { id: 'wht' as Module, label: 'ภาษีหัก ณ ที่จ่าย', icon: 'Receipt' },
      { id: 'customers' as Module, label: 'ลูกหนี้ (AR)', icon: 'Users' },
      { id: 'vendors' as Module, label: 'เจ้าหนี้ (AP)', icon: 'Truck' },
      { id: 'inventory' as Module, label: 'สต็อกสินค้า', icon: 'Package' },
      { id: 'banking' as Module, label: 'ธนาคาร', icon: 'Building2' },
      { id: 'assets' as Module, label: 'ทรัพย์สินถาวร', icon: 'Hammer' },
      { id: 'payroll' as Module, label: 'เงินเดือน', icon: 'Users' },
      { id: 'petty-cash' as Module, label: 'เงินสดย่อย', icon: 'Wallet' },
      { id: 'reports' as Module, label: 'รายงาน', icon: 'BarChart3' },
      { id: 'settings' as Module, label: 'ตั้งค่า', icon: 'Settings', adminOnly: true },
      { id: 'users' as Module, label: 'จัดการผู้ใช้', icon: 'UserCog', adminOnly: true },
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
