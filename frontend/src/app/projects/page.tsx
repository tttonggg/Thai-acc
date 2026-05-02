"use client";

import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useProjects, useProjectsFinancialsSummary } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, FolderKanban, TrendingUp, AlertTriangle, Receipt } from "lucide-react";

export default function ProjectsPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: summaries, isLoading: summaryLoading } = useProjectsFinancialsSummary();

  const isLoading = projectsLoading || summaryLoading;

  // Merge project basic info with financial summary
  const merged = projects?.map((p: any) => {
    const s = summaries?.find((s: any) => s.project_id === p.id);
    return { ...p, ...s };
  });

  const totalBudget = merged?.reduce((sum: number, p: any) => sum + parseFloat(p.budget_amount || 0), 0) || 0;
  const totalInvoiced = merged?.reduce((sum: number, p: any) => sum + parseFloat(p.invoiced_amount || 0), 0) || 0;
  const totalCost = merged?.reduce((sum: number, p: any) => sum + parseFloat(p.total_cost || 0), 0) || 0;
  const totalProfit = merged?.reduce((sum: number, p: any) => sum + parseFloat(p.gross_profit || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">โครงการ</h1>
            <p className="text-gray-500 mt-1">ติดตามรายได้ ต้นทุน และกำไรตามโครงการ</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            เพิ่มโครงการ
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนโครงการ</p>
                <p className="text-2xl font-bold text-gray-900">{projects?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">รายได้รวม</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ต้นทุนรวม</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">กำไรรวม</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-blue-900" : "text-red-700"}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : merged?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีโครงการ</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">รหัส</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ชื่อโครงการ</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">งบประมาณ</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">รายได้</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ต้นทุน</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">กำไร</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700"> Margin</th>
                </tr>
              </thead>
              <tbody>
                {merged?.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/projects/${p.id}`} className="font-medium text-peak-purple hover:underline">
                        {p.project_code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "active" ? "bg-green-50 text-green-700" :
                        p.status === "completed" ? "bg-blue-50 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {p.status === "active" ? "ดำเนินการ" : p.status === "completed" ? "เสร็จสิ้น" : "ยกเลิก"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(p.budget_amount)}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(p.invoiced_amount || 0)}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(p.total_cost || 0)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <span className={(p.gross_profit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(p.gross_profit || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <span className={(p.profit_margin || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                        {p.profit_margin || 0}%
                      </span>
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
