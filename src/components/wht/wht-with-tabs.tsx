'use client';
// WHT Module — Tab switcher for Management + Report views
import { useState } from 'react';
import { WhtManagement } from './wht-management';
import { WhtReport } from './wht-report';

export function WhtWithTabs() {
  const [tab, setTab] = useState<'manage' | 'report'>('manage');
  return (
    <div className="space-y-0">
      <div className="mb-6 border-b">
        <nav className="flex gap-1" aria-label="WHT tabs">
          <button
            onClick={() => setTab('manage')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'manage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            จัดการ 50 ทวิ
          </button>
          <button
            onClick={() => setTab('report')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            รายงาน ภ.ง.ด.
          </button>
        </nav>
      </div>
      {tab === 'manage' ? <WhtManagement /> : <WhtReport />}
    </div>
  );
}
