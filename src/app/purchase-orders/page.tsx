'use client';

import { KeeratiSidebar } from '@/components/layout/keerati-sidebar';
import { PurchaseOrderList } from '@/components/purchase-orders/purchase-order-list';
import { useState } from 'react';

export default function PurchaseOrdersPage() {
  const [activeModule, setActiveModule] = useState('purchase-orders');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <KeeratiSidebar
        {...({
          activeModule: activeModule as any,
          setActiveModule: setActiveModule as any,
          isCollapsed: sidebarCollapsed,
          setSidebarCollapsed: setSidebarCollapsed as any,
        } as any)}
      />
      <main className="flex-1 overflow-auto">
        <PurchaseOrderList />
      </main>
    </div>
  );
}
