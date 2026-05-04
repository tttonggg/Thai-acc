"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import {
  usePurchaseOrders,
  usePurchaseInvoices,
  usePaymentVouchers,
  useExpenseClaims,
} from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { Plus } from "lucide-react";

const tabs = [
  { key: "purchase-orders", label: "ใบสั่งซื้อ" },
  { key: "purchase-invoices", label: "ใบแจ้งหนี้ซื้อ" },
  { key: "payment-vouchers", label: "ใบสำคัญจ่าย" },
  { key: "expense-claims", label: "ใบเบิกค่าใช้จ่าย" },
];

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("purchase-orders");

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายจ่าย</h1>
            <p className="text-gray-500 mt-1">ใบสั่งซื้อ ใบแจ้งหนี้ซื้อ และใบเบิกค่าใช้จ่าย</p>
          </div>
          <Link
            href={`/expenses/${activeTab}/new`}
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
        {activeTab === "purchase-orders" && <PurchaseOrdersTab />}
        {activeTab === "purchase-invoices" && <PurchaseInvoicesTab />}
        {activeTab === "payment-vouchers" && <PaymentVouchersTab />}
        {activeTab === "expense-claims" && <ExpenseClaimsTab />}
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-50 text-blue-700",
    confirmed: "bg-green-50 text-green-700",
    received: "bg-yellow-50 text-yellow-700",
    billed: "bg-purple-50 text-purple-700",
    partially_paid: "bg-yellow-50 text-yellow-700",
    paid: "bg-green-50 text-green-700",
    approved: "bg-green-50 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    rejected: "bg-red-50 text-red-700",
    submitted: "bg-blue-50 text-blue-700",
    active: "bg-green-50 text-green-700",
    posted: "bg-green-50 text-green-700",
  };
  const labels: Record<string, string> = {
    draft: "ร่าง",
    sent: "ส่งแล้ว",
    confirmed: "ยืนยัน",
    received: "รับแล้ว",
    billed: "บันทึกบัญชี",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
    approved: "อนุมัติ",
    cancelled: "ยกเลิก",
    rejected: "ปฏิเสธ",
    submitted: "ส่งอนุมัติ",
    active: "ใช้งาน",
    posted: "บันทึกบัญชี",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

function PurchaseOrdersTab() {
  const { data: purchaseOrders, isLoading } = usePurchaseOrders();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : purchaseOrders?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบสั่งซื้อ</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ผู้จำหน่าย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่สั่งซื้อ</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders?.map((po: any) => (
              <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/expenses/purchase-orders/${po.id}`} className="font-medium text-peak-purple hover:underline">
                    {po.po_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{po.contact_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(po.order_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(po.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PurchaseInvoicesTab() {
  const { data: purchaseInvoices, isLoading } = usePurchaseInvoices();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : purchaseInvoices?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบแจ้งหนี้ซื้อ</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ผู้จำหน่าย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ครบกำหนด</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ค้างชำระ</th>
            </tr>
          </thead>
          <tbody>
            {purchaseInvoices?.map((inv: any) => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/expenses/purchase-invoices/${inv.id}`} className="font-medium text-peak-purple hover:underline">
                    {inv.bill_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{inv.contact_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(inv.due_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(inv.total_amount)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-red-600">{formatCurrency(inv.total_amount - inv.paid_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PaymentVouchersTab() {
  const { data: paymentVouchers, isLoading } = usePaymentVouchers();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : paymentVouchers?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบสำคัญจ่าย</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ผู้จำหน่าย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่จ่าย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดจ่าย</th>
            </tr>
          </thead>
          <tbody>
            {paymentVouchers?.map((pv: any) => (
              <tr key={pv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/expenses/payment-vouchers/${pv.id}`} className="font-medium text-peak-purple hover:underline">
                    {pv.voucher_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{pv.contact?.name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(pv.payment_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={pv.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(pv.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ExpenseClaimsTab() {
  const { data: expenseClaims, isLoading } = useExpenseClaims();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      ) : expenseClaims?.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ยังไม่มีใบเบิกค่าใช้จ่าย</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เลขที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">พนักงาน</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">หมวดหมู่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สถานะ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {expenseClaims?.map((claim: any) => (
              <tr key={claim.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/expenses/expense-claims/${claim.id}`} className="font-medium text-peak-purple hover:underline">
                    {claim.claim_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{claim.employee_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{claim.category || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatThaiDate(claim.expense_date)}</td>
                <td className="px-6 py-4"><StatusBadge status={claim.status} /></td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(claim.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
