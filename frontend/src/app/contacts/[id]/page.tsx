"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContactTransactions } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Pencil,
  FileText,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Receipt,
  AlertTriangle,
} from "lucide-react";

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const [filter, setFilter] = useState<"all" | "sales" | "purchase" | "expense">("all");

  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.get(`/contacts/${contactId}`).then((res) => res.data),
  });

  const { data: txData, isLoading: txLoading } = useContactTransactions(contactId);

  const isLoading = contactLoading || txLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบผู้ติดต่อ</div>
      </AppLayout>
    );
  }

  const typeLabels: Record<string, string> = {
    customer: "ลูกค้า",
    vendor: "ผู้จำหน่าย",
    both: "ทั้งสอง",
  };

  const typeColors: Record<string, string> = {
    customer: "bg-blue-50 text-blue-700",
    vendor: "bg-orange-50 text-orange-700",
    both: "bg-purple-50 text-purple-700",
  };

  const summary = txData?.summary;
  const allTransactions = txData?.transactions || [];

  const filteredTransactions = allTransactions.filter((t: any) => {
    if (filter === "all") return true;
    if (filter === "sales") return ["quotation", "invoice", "receipt"].includes(t.document_type);
    if (filter === "purchase") return ["purchase_order", "purchase_invoice"].includes(t.document_type);
    if (filter === "expense") return t.document_type === "expense_claim";
    return true;
  });

  const docTypeColors: Record<string, string> = {
    quotation: "bg-gray-100 text-gray-700",
    invoice: "bg-blue-100 text-blue-700",
    receipt: "bg-green-100 text-green-700",
    purchase_order: "bg-orange-100 text-orange-700",
    purchase_invoice: "bg-amber-100 text-amber-700",
    expense_claim: "bg-red-100 text-red-700",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-600",
    accepted: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    converted: "bg-purple-100 text-purple-600",
    paid: "bg-green-100 text-green-600",
    partially_paid: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-600",
    cancelled: "bg-gray-200 text-gray-500",
    confirmed: "bg-green-100 text-green-600",
    received: "bg-teal-100 text-teal-600",
    billed: "bg-indigo-100 text-indigo-600",
    submitted: "bg-blue-100 text-blue-600",
    approved: "bg-green-100 text-green-600",
    reimbursed: "bg-green-100 text-green-600",
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/contacts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[contact.type]}`}>
              {typeLabels[contact.type]}
            </span>
          </div>
          <Link
            href={`/contacts/${contactId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            แก้ไข
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">เลขประจำตัวผู้เสียภาษี</p>
            <p className="font-semibold text-gray-900 font-mono">{contact.tax_id || "-"}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">วงเงินเครดิต</p>
            <p className="font-semibold text-gray-900">{formatCurrency(contact.credit_limit)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ระยะเวลาเครดิต</p>
            <p className="font-semibold text-gray-900">{contact.credit_days} วัน</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">เบอร์โทร</p>
                <p className="font-medium text-gray-900">{contact.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">อีเมล</p>
                <p className="font-medium text-gray-900">{contact.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">ที่อยู่</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">{contact.address || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">ยอดแจ้งหนี้รวม</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_invoiced)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">ชำระแล้ว</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_paid)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-gray-500">ค้างชำระ</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_outstanding)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-sm text-gray-500">ยอดซื้อรวม</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_purchased)}</p>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ประวัติธุรกรรม</h3>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "ทั้งหมด" },
                { key: "sales", label: "ขาย" },
                { key: "purchase", label: "ซื้อ" },
                { key: "expense", label: "เบิกจ่าย" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">ประเภท</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">เลขที่เอกสาร</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">วันที่</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">สถานะ</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">รายละเอียด</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      ไม่มีธุรกรรม
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${docTypeColors[t.document_type] || "bg-gray-100 text-gray-700"}`}
                        >
                          <FileText className="w-3 h-3" />
                          {t.document_type_label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={t.link}
                          className="font-medium text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          {t.document_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {t.document_date ? formatThaiDate(t.document_date) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColors[t.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {t.status_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {t.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
              แสดง {filteredTransactions.length} รายการ
              {allTransactions.length > 100 && " (แสดงสูงสุด 100 รายการล่าสุด)"}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
