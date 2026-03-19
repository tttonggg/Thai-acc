'use client'

// ============================================
// 👥 Payroll Page — Tab container
// Combines Employee List + Payroll Runs
// ============================================

import { useState } from 'react'
import { Users, DollarSign } from 'lucide-react'
import { EmployeeList } from './employee-list'
import { PayrollRunList } from './payroll-run-list'

export function PayrollPage() {
  const [tab, setTab] = useState<'employees' | 'runs'>('employees')
  const tabs = [
    { id: 'employees' as const, label: 'พนักงาน', icon: Users },
    { id: 'runs' as const, label: 'รอบเงินเดือน', icon: DollarSign },
  ]
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">เงินเดือน & บุคคล</h1>
        <p className="text-sm text-gray-500">
          คำนวณเงินเดือน SSC (5%, สูงสุด ฿750) และ PND1 อัตราก้าวหน้า 2567 อัตโนมัติ
        </p>
      </div>
      <div className="border-b mb-6">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'employees' ? <EmployeeList /> : <PayrollRunList />}
    </div>
  )
}
