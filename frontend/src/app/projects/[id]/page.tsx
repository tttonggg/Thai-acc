"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProjectFinancials } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, FolderKanban, Calendar, Users, TrendingUp, AlertCircle, Pencil, Receipt, ShoppingCart, Wallet } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((res) => res.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices", { project_id: projectId }],
    queryFn: () => api.get("/invoices", { params: { project_id: projectId } }).then((res) => res.data),
    enabled: !!projectId,
  });

  const { data: fin } = useProjectFinancials(projectId);

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!project) return <AppLayout><div className="p-8 text-center">ไม่พบโครงการ</div></AppLayout>;

  const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
  const budgetUsed = parseFloat(project.budget_amount || 0) > 0
    ? (parseFloat(project.actual_cost || 0) / parseFloat(project.budget_amount || 0)) * 100
    : 0;
  const remaining = parseFloat(project.budget_amount || 0) - parseFloat(project.actual_cost || 0);
  const isOverBudget = remaining < 0;

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
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
                <p className="font-medium text-gray-900">{formatCurrency(totalRevenue)}</p>
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

        {/* Linked Invoices */}
        {invoices && invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">ใบแจ้งหนี้ที่เกี่ยวข้อง</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">เลขที่</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">วันที่</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">สถานะ</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <Link href={`/income/invoices/${inv.id}`} className="text-peak-purple hover:underline font-medium">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatThaiDate(inv.issue_date)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === "paid" ? "bg-green-50 text-green-700" :
                        inv.status === "partially_paid" ? "bg-yellow-50 text-yellow-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {inv.status === "paid" ? "ชำระแล้ว" : inv.status === "partially_paid" ? "บางส่วน" : "รอชำระ"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(inv.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
