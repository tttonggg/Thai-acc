'use client'

import { useState } from 'react'
import { KeeratiSidebar } from '@/components/layout/keerati-sidebar'
import { PurchaseList } from '@/components/purchases/purchase-list'

export default function PurchaseInvoicesPage() {
  const [activeModule, setActiveModule] = useState('purchase-invoices')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <KeeratiSidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-auto">
        <PurchaseList />
      </main>
    </div>
  )
}