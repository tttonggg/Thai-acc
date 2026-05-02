"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useBankAccounts } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Landmark, Wallet, Smartphone, ArrowRight } from "lucide-react";

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "เงินสด", icon: <Wallet className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  bank: { label: "ธนาคาร", icon: <Landmark className="w-5 h-5" />, color: "bg-blue-50 text-blue-600" },
  promptpay: { label: "PromptPay", icon: <Smartphone className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
};

export default function BankAccountsPage() {
  const { data: accounts, isLoading } = useBankAccounts();
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = accounts?.filter((a: any) => {
    if (!typeFilter) return true;
    return a.account_type === typeFilter;
  });

  const totalBalance = filtered?.reduce((sum: number, a: any) => sum + parseFloat(a.current_balance || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บัญชีธนาคาร & เงินสด</h1>
            <p className="text-gray-500 mt-1">Bank Accounts & Cash Management</p>
          </div>
          <Link
            href="/bank-accounts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            เพิ่มบัญชี
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">จำนวนบัญชี</p>
            <p className="text-2xl font-bold text-gray-900">{filtered?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">ยอดรวมทั้งสิ้น</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {["", "cash", "bank", "promptpay"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === t
                  ? "bg-peak-purple text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "" ? "ทั้งหมด" : typeConfig[t]?.label || t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : filtered?.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">ยังไม่มีบัญชี</div>
          ) : (
            filtered.map((account: any) => {
              const config = typeConfig[account.account_type] || typeConfig.cash;
              return (
                <Link
                  key={account.id}
                  href={`/bank-accounts/${account.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center`}>
                      {config.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-peak-purple transition-colors" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{account.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {account.bank_name || "-"} {account.account_number ? `· ${account.account_number}` : ""}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">ยอดคงเหลือ</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(account.current_balance)}</span>
                  </div>
                  {account.gl_account_code && (
                    <p className="text-xs text-gray-400 mt-2">บัญชี GL: {account.gl_account_code}</p>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
