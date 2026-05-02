"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useJournalEntries } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { formatThaiDate } from "@/lib/utils";
import { Search, List, Plus, FileText } from "lucide-react";

const typeLabels: Record<string, string> = {
  invoice: "ใบแจ้งหนี้",
  receipt: "ใบเสร็จ",
  purchase_invoice: "ใบแจ้งหนี้ซื้อ",
  expense_claim: "เบิกค่าใช้จ่าย",
  adjustment: "ปรับปรุง",
};

export default function JournalEntriesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data: entries, isLoading } = useJournalEntries({
    entry_type: typeFilter || undefined,
    limit: 100,
  });

  const filtered = entries?.filter((e: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.reference?.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s) ||
      e.document_number?.toLowerCase().includes(s)
    );
  });

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สมุดรายวัน</h1>
            <p className="text-gray-500 mt-1">Journal Entries</p>
          </div>
          <Link
            href="/accounting/journal-entries/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            บันทึกบัญชีใหม่
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่เอกสาร หรือรายละเอียด..."
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
              <option value="invoice">ใบแจ้งหนี้</option>
              <option value="receipt">ใบเสร็จ</option>
              <option value="purchase_invoice">ใบแจ้งหนี้ซื้อ</option>
              <option value="expense_claim">เบิกค่าใช้จ่าย</option>
              <option value="adjustment">ปรับปรุง</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : filtered?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ไม่พบรายการบัญชี
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่เอกสาร</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">รายละเอียด</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">เดบิต</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">เครดิต</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((entry: any) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatThaiDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                        {typeLabels[entry.entry_type] || entry.entry_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {entry.document_number || entry.reference || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="truncate max-w-xs">{entry.description || "-"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.lines?.length || 0} รายการ
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(entry.total_debit)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(entry.total_credit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
