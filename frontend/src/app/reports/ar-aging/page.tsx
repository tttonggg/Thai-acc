"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useARAging } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Calendar, AlertTriangle, User } from "lucide-react";

export default function ARAgingPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const { data, isLoading } = useARAging({ as_of: asOfDate });

  const buckets = [
    { key: "current", label: "ปัจจุบัน", color: "text-green-700 bg-green-50" },
    { key: "days_1_30", label: "1-30 วัน", color: "text-yellow-700 bg-yellow-50" },
    { key: "days_31_60", label: "31-60 วัน", color: "text-orange-700 bg-orange-50" },
    { key: "days_61_90", label: "61-90 วัน", color: "text-red-700 bg-red-50" },
    { key: "days_over_90", label: "90+ วัน", color: "text-red-800 bg-red-100" },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/reports" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ลูกหนี้ Aging</h1>
              <p className="text-gray-500 mt-1">Accounts Receivable Aging Report</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-600">ณ วันที่</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {buckets.map((b) => (
            <div key={b.key} className={`rounded-xl border p-4 ${b.color.split(" ")[1]} border-opacity-20`}>
              <p className="text-xs font-medium opacity-70">{b.label}</p>
              <p className="text-lg font-bold mt-1">{formatCurrency((data as any)?.[`grand_${b.key}`] || 0)}</p>
            </div>
          ))}
          <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
            <p className="text-xs font-medium text-gray-500">รวมทั้งสิ้น</p>
            <p className="text-lg font-bold mt-1 text-gray-900">{formatCurrency(data?.grand_total || 0)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : !data?.items?.length ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              ไม่มีลูกหนี้ค้างชำระ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">ลูกค้า</th>
                    <th className="text-right px-4 py-4 font-semibold text-gray-700">ปัจจุบัน</th>
                    <th className="text-right px-4 py-4 font-semibold text-gray-700">1-30 วัน</th>
                    <th className="text-right px-4 py-4 font-semibold text-gray-700">31-60 วัน</th>
                    <th className="text-right px-4 py-4 font-semibold text-gray-700">61-90 วัน</th>
                    <th className="text-right px-4 py-4 font-semibold text-gray-700">90+ วัน</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-700">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any) => (
                    <tr key={item.contact_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{item.contact_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-green-700">{formatCurrency(item.current)}</td>
                      <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(item.days_1_30)}</td>
                      <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(item.days_31_60)}</td>
                      <td className="px-4 py-4 text-right text-red-700">{formatCurrency(item.days_61_90)}</td>
                      <td className="px-4 py-4 text-right text-red-800">{formatCurrency(item.days_over_90)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.total_outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-gray-900">รวมทั้งสิ้น</td>
                    <td className="px-4 py-4 text-right text-green-700">{formatCurrency(data.grand_current)}</td>
                    <td className="px-4 py-4 text-right text-yellow-700">{formatCurrency(data.grand_1_30)}</td>
                    <td className="px-4 py-4 text-right text-orange-700">{formatCurrency(data.grand_31_60)}</td>
                    <td className="px-4 py-4 text-right text-red-700">{formatCurrency(data.grand_61_90)}</td>
                    <td className="px-4 py-4 text-right text-red-800">{formatCurrency(data.grand_over_90)}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(data.grand_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
