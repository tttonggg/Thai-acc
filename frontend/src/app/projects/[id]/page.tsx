"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProjectFinancials, useProjectTransactions } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, FolderKanban, Calendar, Users, TrendingUp, AlertCircle, Pencil, Receipt, ShoppingCart, Wallet, FileText } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [filter, setFilter] = useState<"all" | "sales" | "purchase" | "expense">("all");

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((res) => res.data),
  });

  const { data: fin, isLoading: finLoading } = useProjectFinancials(projectId);
  const { data: txData, isLoading: txLoading } = useProjectTransactions(projectId);

  const isLoading = projectLoading || finLoading || txLoading;

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!project) return <AppLayout><div className="p-8 text-center">ไม่พบโครงการ</div></AppLayout>;

  const budgetUsed = parseFloat(project.budget_amount || 0) > 0
    ? (parseFloat(project.actual_cost || 0) / parseFloat(project.budget_amount || 0)) * 100
    : 0;
  const remaining = parseFloat(project.budget_amount || 0) - parseFloat(project.actual_cost || 0);
  const isOverBudget = remaining < 0;

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
          <Link href="/projects" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === "active" ? "bg-green-50 text-green-700" :
                project.status === "completed" ? "bg-blue-50 text-blue-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {project.status === "active" ? "ดำเนินการ" : project.status === "completed" ? "เสร็จสิ้น" : "ยกเลิก"}
              </span>
            </div>
            <p className="text-gray-500 font-mono">{project.project_code}</p>
          </div>
          <Link
            href={`/projects/${projectId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            แก้ไข
          </Link>
        </div>

        {/* Budget Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ความคืบหน้างบประมาณ</h3>
            {isOverBudget && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">เกินงบประมาณ!</span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-gradient-to-r from-peak-purple to-peak-teal"}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-gray-500">งบประมาณ</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(project.budget_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ใช้ไป</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(project.actual_cost)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">คงเหลือ</p>
              <p className={`text-xl font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">ระยะเวลา</p>
                <p className="font-medium text-gray-900">
                  {project.start_date ? formatThaiDate(project.start_date) : "-"} - {project.end_date ? formatThaiDate(project.end_date) : "-"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">ลูกค้า</p>
                <p className="font-medium text-gray-900">{project.contact_name || "-"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">รายได้รวม</p>
                <p className="font-medium text-gray-900">{formatCurrency(fin?.invoiced_amount || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financials Summary */}
        {fin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการเงินโครงการ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">ใบเสนอราคา</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(fin.quoted_amount)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">ใบแจ้งหนี้</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(fin.invoiced_amount)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 mb-1">รับเงินแล้ว</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(fin.received_amount)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600 mb-1">ต้นทุนรวม</p>
                <p className="text-lg font-bold text-orange-900">{formatCurrency(fin.total_cost)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg">
                <Receipt className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ใบแจ้งหนี้ซื้อ</p>
                  <p className="font-medium text-gray-900">{formatCurrency(fin.purchase_invoice_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">เบิกค่าใช้จ่าย</p>
                  <p className="font-medium text-gray-900">{formatCurrency(fin.expense_claim_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg">
                <Wallet className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">กำไรขั้นต้น</p>
                  <p className={`font-bold ${fin.gross_profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(fin.gross_profit)}
                  </p>
                </div>
              </div>
            </div>
            {fin.invoiced_amount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">อัตรากำไร (%)</span>
                  <div className="flex-1 mx-4 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${fin.profit_margin >= 0 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(Math.abs(fin.profit_margin), 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${fin.profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fin.profit_margin}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {project.description && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">รายละเอียด</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ประวัติธุรกรรมโครงการ</h3>

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
                  <th className="text-left px-6 py-3 font-medium text-gray-500">ลูกค้า/ผู้จำหน่าย</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">สถานะ</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">รายละเอียด</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                      <td className="px-6 py-4 text-gray-600">
                        {t.contact_name || "-"}
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
