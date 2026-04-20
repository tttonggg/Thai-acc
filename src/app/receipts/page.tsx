'use client'

import { KeeratiSidebar } from '@/components/layout/keerati-sidebar'
import { ReceiptList } from '@/components/receipts/receipt-list'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReceiptsPage() {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState('receipts')
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
        <ReceiptList />
      </main>
    </div>
  )
}
