'use client';

import { useState } from 'react';
import { KeeratiSidebar } from '@/components/layout/keerati-sidebar';
import { PurchaseRequestList } from '@/components/purchase-requests/purchase-request-list';

export default function PurchaseRequestsPage() {
  const [activeModule, setActiveModule] = useState('purchase-requests');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <KeeratiSidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-auto">
        <PurchaseRequestList />
      </main>
    </div>
  );
}
