"use client";

import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FolderKanban,
  Receipt,
  BarChart3,
  PieChart,
} from "lucide-react";
import SimpleBarChart from "@/components/SimpleBarChart";
import SimpleDonutChart from "@/components/SimpleDonutChart";

export default function DashboardPage() {
  const { data: quotations } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => api.get("/quotations").then((res) => res.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get("/invoices").then((res) => res.data),
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.get("/contacts").then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get("/products").then((res) => res.data),
  });

  const { data: projectSummaries } = useQuery({
    queryKey: ["projects-financials-summary"],
    queryFn: () => api.get("/projects/financials/summary").then((res) => res.data),
  });

  const { data: receipts } = useQuery({
    queryKey: ["receipts"],
    queryFn: () => api.get("/receipts").then((res) => res.data),
  });

  const { data: purchaseInvoices } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: () => api.get("/purchase-invoices").then((res) => res.data),
  });

  const { data: expenseClaims } = useQuery({
    queryKey: ["expense-claims"],
    queryFn: () => api.get("/expense-claims").then((res) => res.data),
  });

  // Calculate KPIs
  const totalInvoiced = invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.paid_amount || 0), 0) || 0;
  const totalReceivable = totalInvoiced - totalPaid;
  const overdueInvoices = invoices?.filter((inv: any) => {
    const isPending = inv.status === "sent" || inv.status === "partially_paid";
    const dueDate = new Date(inv.due_date);
    return isPending && dueDate < new Date();
  }) || [];
  const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.total_amount || 0) - parseFloat(inv.paid_amount || 0)), 0);

  const pendingQuotations = quotations?.filter((q: any) => q.status === "sent").length || 0;
  const lowStockProducts = products?.filter((p: any) => parseFloat(p.quantity_on_hand) <= parseFloat(p.reorder_point)).length || 0;

  // Expense totals
  const piExpenses = purchaseInvoices?.reduce((sum: number, pi: any) => sum + parseFloat(pi.total_amount || 0), 0) || 0;
  const claimExpenses = expenseClaims?.filter((c: any) => c.status === "approved").reduce((sum: number, c: any) => sum + parseFloat(c.total_amount || 0), 0) || 0;
  const totalExpenses = piExpenses + claimExpenses;

  // Monthly revenue + expense data (last 6 months)
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthlyData = (() => {
    const items: { label: string; revenue: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthRev = (invoices || [])
        .filter((inv: any) => inv.issue_date?.startsWith(monthKey))
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0);
      const monthExp = (purchaseInvoices || [])
        .filter((pi: any) => pi.bill_date?.startsWith(monthKey))
        .reduce((sum: number, pi: any) => sum + parseFloat(pi.total_amount || 0), 0);
      items.push({ label: thaiMonths[d.getMonth()], revenue: monthRev, expense: monthExp });
    }
    return items;
  })();

  // Expense breakdown for donut
  const expenseBreakdown = [
    { label: "ใบแจ้งหนี้ซื้อ", value: piExpenses, color: "#7c3aed" },
    { label: "ค่าใช้จ่าย", value: claimExpenses, color: "#06b6d4" },
  ].filter((s) => s.value > 0);

  // Profit this month
  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const thisMonthRev = (invoices || [])
    .filter((inv: any) => inv.issue_date?.startsWith(thisMonthKey))
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || 0), 0);
  const thisMonthExp = (purchaseInvoices || [])
    .filter((pi: any) => pi.bill_date?.startsWith(thisMonthKey))
    .reduce((sum: number, pi: any) => sum + parseFloat(pi.total_amount || 0), 0);
  const thisMonthProfit = thisMonthRev - thisMonthExp;

  // Monthly revenue chart data (keep for SimpleBarChart compatibility)
  const monthlyRevenue = monthlyData.map((d) => ({ label: d.label, value: d.revenue }));

  // Recent Activity: combine latest 5 invoices + receipts sorted by created_at
  const recentInvoices = (invoices || [])
    .map((inv: any) => ({ ...inv, activity_type: "invoice" as const, activity_date: inv.created_at }))
    .sort((a: any, b: any) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
    .slice(0, 5);

  const recentReceipts = (receipts || [])
    .map((rec: any) => ({ ...rec, activity_type: "receipt" as const, activity_date: rec.created_at }))
    .sort((a: any, b: any) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
    .slice(0, 5);

  const recentActivity = [...recentInvoices, ...recentReceipts]
    .sort((a: any, b: any) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมธุรกิจ</h1>
          <p className="text-gray-500 mt-1">สรุปสถานะธุรกิจของคุณ</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KPICard
            title="ยอดขายรวม"
            value={formatCurrency(totalInvoiced)}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            bgColor="bg-green-50"
          />
          <KPICard
            title="รับเงินแล้ว"
            value={formatCurrency(totalPaid)}
            icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <KPICard
            title="ลูกหนี้การค้า"
            value={formatCurrency(totalReceivable)}
            icon={<DollarSign className="w-5 h-5 text-orange-600" />}
            bgColor="bg-orange-50"
            alert={totalReceivable > 0}
          />
          <KPICard
            title="ค่าใช้จ่ายรวม"
            value={formatCurrency(totalExpenses)}
            icon={<TrendingDown className="w-5 h-5 text-purple-600" />}
            bgColor="bg-purple-50"
          />
          <KPICard
            title="กำไรเดือนนี้"
            value={formatCurrency(thisMonthProfit)}
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            bgColor="bg-emerald-50"
            alert={thisMonthProfit < 0}
          />
          <KPICard
            title="เกินกำหนด"
            value={formatCurrency(overdueAmount)}
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            bgColor="bg-red-50"
            alert={overdueAmount > 0}
          />
        </div>

        {/* Revenue vs Expense Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-peak-purple" />
              <h3 className="font-semibold text-gray-900">รายได้ vs รายจ่าย (6 เดือน)</h3>
            </div>
            <PairedBarChart data={monthlyData} />
          </div>

          {/* Expense Breakdown Donut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-5 h-5 text-peak-purple" />
              <h3 className="font-semibold text-gray-900">สัดส่วนค่าใช้จ่าย</h3>
            </div>
            <SimpleDonutChart data={expenseBreakdown} size={180} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="ลูกค้า"
            value={contacts?.length || 0}
            icon={<Users className="w-5 h-5" />}
            href="/contacts"
          />
          <StatCard
            title="สินค้า"
            value={products?.length || 0}
            subtitle={lowStockProducts > 0 ? `${lowStockProducts} รายการใกล้หมด` : undefined}
            icon={<Package className="w-5 h-5" />}
            href="/products"
            alert={lowStockProducts > 0}
          />
          <StatCard
            title="ใบเสนอราคารอตอบ"
            value={pendingQuotations}
            icon={<FileText className="w-5 h-5" />}
            href="/income"
            alert={pendingQuotations > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overdue Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">ใบแจ้งหนี้ค้างชำระ</h3>
              <Link href="/income" className="text-sm text-peak-purple hover:underline">ดูทั้งหมด</Link>
            </div>
            {overdueInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">ไม่มีใบแจ้งหนี้ค้างชำระ</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {overdueInvoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <Link href={`/income/invoices/${inv.id}`} className="font-medium text-peak-purple hover:underline">
                        {inv.invoice_number}
                      </Link>
                      <p className="text-sm text-gray-500">{inv.contact_name} · ครบกำหนด {formatThaiDate(inv.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(inv.total_amount - inv.paid_amount)}</p>
                      <Link
                        href={`/income/receipts/new?invoice_id=${inv.id}`}
                        className="text-xs text-peak-purple hover:underline"
                      >
                        บันทึกรับเงิน
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quotations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">ใบเสนอราคาล่าสุด</h3>
              <Link href="/income" className="text-sm text-peak-purple hover:underline">ดูทั้งหมด</Link>
            </div>
            {!quotations || quotations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">ไม่มีใบเสนอราคา</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {quotations.slice(0, 5).map((q: any) => (
                  <div key={q.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <Link href={`/income/quotations/${q.id}`} className="font-medium text-peak-purple hover:underline">
                        {q.quotation_number}
                      </Link>
                      <p className="text-sm text-gray-500">{q.contact_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(q.total_amount)}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        q.status === "draft" ? "bg-gray-100 text-gray-600" :
                        q.status === "sent" ? "bg-blue-50 text-blue-600" :
                        q.status === "accepted" ? "bg-green-50 text-green-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {q.status === "draft" ? "ร่าง" : q.status === "sent" ? "ส่งแล้ว" : q.status === "accepted" ? "อนุมัติ" : q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Performance */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">ผลงานโครงการ</h3>
            <Link href="/projects" className="text-sm text-peak-purple hover:underline">ดูทั้งหมด</Link>
          </div>
          {!projectSummaries || projectSummaries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">ไม่มีข้อมูลโครงการ</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {projectSummaries.slice(0, 5).map((p: any) => (
                <div key={p.project_id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <Link href={`/projects/${p.project_id}`} className="font-medium text-peak-purple hover:underline">
                        {p.project_code}
                      </Link>
                      <p className="text-sm text-gray-500">{p.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">รายได้</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(p.invoiced_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">ต้นทุน</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(p.total_cost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">กำไร</p>
                      <p className={`text-sm font-bold ${p.gross_profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(p.gross_profit)}
                      </p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-xs text-gray-500">Margin</p>
                      <p className={`text-sm font-bold ${p.profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.profit_margin}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function PairedBarChart({ data, height = 200 }: { data: { label: string; revenue: number; expense: number }[]; height?: number }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.expense)), 1);
  const totalBars = data.length * 2;
  const barAreaWidth = 80;
  const gap = 12;
  const svgW = totalBars * (barAreaWidth / 2) + (data.length - 1) * gap + 40;

  return (
    <svg viewBox={`0 0 ${svgW} ${height}`} className="w-full" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <line key={tick} x1="20" y1={height - tick * (height - 30)} x2={svgW - 20} y2={height - tick * (height - 30)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {/* Legend */}
      <rect x={svgW - 140} y={8} width={10} height={10} fill="#7c3aed" rx="2" /><text x={svgW - 126} y={17} className="text-xs" fill="#6b7280" fontSize="10">รายได้</text>
      <rect x={svgW - 70} y={8} width={10} height={10} fill="#ef4444" rx="2" /><text x={svgW - 56} y={17} className="text-xs" fill="#6b7280" fontSize="10">รายจ่าย</text>
      {data.map((item, i) => {
        const revH = (item.revenue / maxVal) * (height - 35);
        const expH = (item.expense / maxVal) * (height - 35);
        const groupX = 30 + i * (barAreaWidth + gap);
        return (
          <g key={i}>
            <rect x={groupX} y={height - revH - 10} width={18} height={revH} fill="#7c3aed" rx="3" opacity="0.85" />
            <rect x={groupX + 22} y={height - expH - 10} width={18} height={expH} fill="#ef4444" rx="3" opacity="0.85" />
            <text x={groupX + 20} y={height - revH - 13} textAnchor="middle" fill="#6b7280" fontSize="9">{item.revenue > 0 ? (item.revenue / 1000).toFixed(0) + "k" : ""}</text>
            <text x={groupX + 20} y={height - 2} textAnchor="middle" fill="#6b7280" fontSize="11">{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function KPICard({ title, value, icon, bgColor, alert }: { title: string; value: string; icon: React.ReactNode; bgColor: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl shadow-sm border p-6 ${alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${alert ? "text-red-600" : "text-gray-500"}`}>{title}</p>
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${alert ? "text-red-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, href, alert }: { title: string; value: number; subtitle?: string; icon: React.ReactNode; href: string; alert?: boolean }) {
  return (
    <Link href={href} className={`block rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${alert ? "text-red-600" : "text-gray-500"}`}>{title}</p>
        <div className={`w-10 h-10 rounded-lg ${alert ? "bg-red-100" : "bg-gray-100"} flex items-center justify-center ${alert ? "text-red-600" : "text-gray-600"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${alert ? "text-red-700" : "text-gray-900"}`}>{value}</p>
      {subtitle && <p className={`text-sm mt-1 ${alert ? "text-red-600" : "text-gray-500"}`}>{subtitle}</p>}
    </Link>
  );
}
