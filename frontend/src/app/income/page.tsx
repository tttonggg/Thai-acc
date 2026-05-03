"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import {
  useQuotations,
  useInvoices,
  useReceipts,
  useCreditNotes,
} from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react";

const tabs = [
  { key: "quotations", label: "ใบเสนอราคา" },
  { key: "invoices", label: "ใบแจ้งหนี้" },
  { key: "receipts", label: "ใบเสร็จ" },
  { key: "credit-notes", label: "ลด/เพิ่มหนี้" },
];

export default function IncomePage() {
  const [activeTab, setActiveTab] = useState("quotations");

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายรับ</h1>
            <p className="text-gray-500 mt-1">ใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จรับเงิน</p>
          </div>
          <Link
            href={`/income/${activeTab}/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            สร้างใหม่
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-peak-purple text-peak-purple"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "quotations" && <QuotationsTab />}
        {activeTab === "invoices" && <InvoicesTab />}
        {activeTab === "receipts" && <ReceiptsTab />}
        {activeTab === "credit-notes" && <CreditNotesTab />}
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-50 text-blue-700",
    accepted: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    converted: "bg-purple-50 text-purple-700",
    paid: "bg-green-50 text-green-700",
    partially_paid: "bg-yellow-50 text-yellow-700",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    active: "bg-green-50 text-green-700",
  };
  const labels: Record<string, string> = {
    draft: "ร่าง",
    sent: "ส่งแล้ว",
    accepted: "อนุมัติ",
    rejected: "ปฏิเสธ",
    converted: "แปลงเป็นใบแจ้งหนี้",
    paid: "ชำระแล้ว",
    partially_paid: "ชำระบางส่วน",
    overdue: "เกินกำหนด",
    cancelled: "ยกเลิก",
    active: "ใช้งาน",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

function QuotationsTab() {
  const { data: quotations, isLoading } = useQuotations();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : quotations?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบเสนอราคา</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ลูกค้า</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {quotations?.map((q: any) => (
              <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/income/quotations/${q.id}`} className="font-medium text-peak-purple hover:underline">
                    {q.quotation_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{q.contact_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(q.issue_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(q.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const etaxFilterOptions = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รอสร้าง" },
  { key: "generated", label: "สร้าง XML แล้ว" },
  { key: "submitted", label: "ส่งแล้ว" },
  { key: "confirmed", label: "ยืนยันแล้ว" },
  { key: "failed", label: "ล้มเหลว" },
];

function ETaxStatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    generated: "bg-blue-50 text-blue-700",
    submitted: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "รอสร้าง",
    generated: "สร้าง XML",
    submitted: "ส่งแล้ว",
    confirmed: "ยืนยัน",
    failed: "ล้มเหลว",
  };
  const s = status || "pending";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${styles[s] || styles.pending}`}>
      {labels[s] || labels.pending}
    </span>
  );
}

function InvoicesTab() {
  const [eTaxFilter, setETaxFilter] = useState<string>("all");
  const { data: invoices, isLoading } = useInvoices(
    eTaxFilter !== "all" ? { e_tax_status: eTaxFilter } : undefined
  );

  return (
    <div>
      {/* e-Tax Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">e-Tax:</span>
        {etaxFilterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setETaxFilter(opt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              eTaxFilter === opt.key
                ? "bg-peak-purple text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : invoices?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ยังไม่มีใบแจ้งหนี้</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ลูกค้า</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ครบกำหนด</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">e-Tax</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ค้างชำระ</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((inv: any) => {
                const etaxStatus = inv.e_tax_error
                  ? "failed"
                  : inv.e_tax_timestamp
                  ? "confirmed"
                  : inv.e_tax_submitted_at
                  ? "submitted"
                  : inv.e_tax_xml
                  ? "generated"
                  : "pending";
                return (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/income/invoices/${inv.id}`} className="font-medium text-peak-purple hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{inv.contact_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(inv.due_date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4"><ETaxStatusBadge status={etaxStatus} /></td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-red-600">{formatCurrency(inv.total_amount - inv.paid_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReceiptsTab() {
  const { data: receipts, isLoading } = useReceipts();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : receipts?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบเสร็จ</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ใบแจ้งหนี้</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วิธีชำระ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรับ</th>
            </tr>
          </thead>
          <tbody>
            {receipts?.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-peak-purple">{r.receipt_number}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{r.invoice_number || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(r.receipt_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{r.payment_method}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-green-600">{formatCurrency(r.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreditNotesTab() {
  const { data: notes, isLoading } = useCreditNotes();

  const typeLabels: Record<string, string> = {
    sales_credit: "ใบลดหนี้",
    sales_debit: "ใบเพิ่มหนี้",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : notes?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบลด/เพิ่มหนี้</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ลูกค้า</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {notes?.map((n: any) => (
              <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/income/credit-notes/${n.id}`} className="font-medium text-peak-purple hover:underline">
                    {n.document_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{typeLabels[n.note_type] || n.note_type}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{n.contact_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(n.issue_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={n.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(n.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
