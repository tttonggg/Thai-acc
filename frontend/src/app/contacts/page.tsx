"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useContacts, useCreateContact } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Users } from "lucide-react";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { data: contacts, isLoading } = useContacts({
    type: typeFilter || undefined,
    search: search || undefined,
  });
  const createContact = useCreateContact();

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ลูกค้า & ผู้ติดต่อ</h1>
            <p className="text-gray-500 mt-1">จัดการข้อมูลลูกค้าและผู้จำหน่าย</p>
          </div>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้ติดต่อ
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เลขประจำตัวผู้เสียภาษี..."
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
              <option value="customer">ลูกค้า</option>
              <option value="vendor">ผู้จำหน่าย</option>
              <option value="both">ทั้งสอง</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนผู้ติดต่อ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : contacts?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ยังไม่มีผู้ติดต่อ กรุณาเพิ่มผู้ติดต่อใหม่
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ชื่อ</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขประจำตัวผู้เสียภาษี</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เบอร์โทร</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">วงเงินเครดิต</th>
                </tr>
              </thead>
              <tbody>
                {contacts?.map((contact: any) => (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-gray-900 hover:text-peak-purple transition-colors"
                      >
                        {contact.name}
                      </Link>
                      {contact.name_en && (
                        <p className="text-sm text-gray-500">{contact.name_en}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          contact.type === "customer"
                            ? "bg-blue-50 text-blue-700"
                            : contact.type === "vendor"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {contact.type === "customer"
                          ? "ลูกค้า"
                          : contact.type === "vendor"
                          ? "ผู้จำหน่าย"
                          : "ทั้งสอง"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {contact.tax_id || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(contact.credit_limit)}
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
