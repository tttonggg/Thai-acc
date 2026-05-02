"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useChartOfAccounts } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Search, BookOpen } from "lucide-react";

const typeLabels: Record<string, { label: string; color: string }> = {
  asset: { label: "สินทรัพย์", color: "bg-blue-50 text-blue-700" },
  liability: { label: "หนี้สิน", color: "bg-red-50 text-red-700" },
  equity: { label: "ทุน", color: "bg-purple-50 text-purple-700" },
  revenue: { label: "รายได้", color: "bg-green-50 text-green-700" },
  expense: { label: "ค่าใช้จ่าย", color: "bg-orange-50 text-orange-700" },
};

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data: accounts, isLoading } = useChartOfAccounts({
    account_type: typeFilter || undefined,
    search: search || undefined,
  });

  // Group by account type
  const grouped = accounts?.reduce((acc: any, account: any) => {
    const t = account.account_type;
    if (!acc[t]) acc[t] = [];
    acc[t].push(account);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ผังบัญชี</h1>
            <p className="text-gray-500 mt-1">Chart of Accounts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหารหัสหรือชื่อบัญชี..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
            >
              <option value="">ทั้งหมด</option>
              <option value="asset">สินทรัพย์</option>
              <option value="liability">หนี้สิน</option>
              <option value="equity">ทุน</option>
              <option value="revenue">รายได้</option>
              <option value="expense">ค่าใช้จ่าย</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {["asset", "liability", "equity", "revenue", "expense"].map((t) => {
            const count = grouped?.[t]?.length || 0;
            const info = typeLabels[t];
            return (
              <div key={t} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{info.label}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : accounts?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ไม่พบบัญชีที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">รหัส</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ชื่อบัญชี</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">หมวดย่อย</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดคงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {accounts?.map((account: any) => {
                  const info = typeLabels[account.account_type] || { label: account.account_type, color: "bg-gray-50 text-gray-700" };
                  return (
                    <tr
                      key={account.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {account.code}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{account.name}</p>
                        {account.name_en && (
                          <p className="text-sm text-gray-500">{account.name_en}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {account.account_sub_type || "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(account.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
