"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { usePurchaseInvoice, useDeletePurchaseInvoice, useUpdatePurchaseInvoiceStatus } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Trash2, Pencil, CheckCircle, Check, XCircle, Wallet } from "lucide-react";

export default function PurchaseInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: pi, isLoading } = usePurchaseInvoice(id);
  const deletePI = useDeletePurchaseInvoice();
  const updateStatus = useUpdatePurchaseInvoiceStatus();

  const handleDelete = async () => {
    if (!confirm("ต้องการลบใบแจ้งหนี้ซื้อนี้?")) return;
    try {
      await deletePI.mutateAsync(id);
      router.push("/expenses");
    } catch (err) {
      alert("ไม่สามารถลบใบแจ้งหนี้ซื้อที่ไม่ใช่สถานะร่างได้");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`เปลี่ยนสถานะเป็น "${statusLabels[newStatus]}"?`)) return;
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
    } catch (err: any) {
      alert(err.response?.data?.detail || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!pi) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">ไม่พบใบแจ้งหนี้ซื้อ</div>
      </AppLayout>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "ร่าง",
    received: "รับแล้ว",
    approved: "อนุมัติ",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
    cancelled: "ยกเลิก",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    received: "bg-yellow-50 text-yellow-700",
    approved: "bg-blue-50 text-blue-700",
    partially_paid: "bg-orange-50 text-orange-700",
    paid: "bg-green-50 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const outstanding = parseFloat(pi.total_amount) - parseFloat(pi.paid_amount);

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/expenses" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{pi.bill_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[pi.status] || "bg-gray-100 text-gray-700"}`}>
                  {statusLabels[pi.status] || pi.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1">ใบแจ้งหนี้ซื้อ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["draft", "received"].includes(pi.status) && (
              <Link
                href={`/expenses/purchase-invoices/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                แก้ไข
              </Link>
            )}
            {pi.status === "draft" && (
              <button
                onClick={() => handleStatusChange("received")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                รับบิล
              </button>
            )}
            {pi.status === "received" && (
              <button
                onClick={() => handleStatusChange("approved")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                อนุมัติ
              </button>
            )}
            {pi.status === "approved" && (
              <button
                onClick={() => handleStatusChange("paid")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                จ่ายเงิน
              </button>
            )}
            {["draft", "received", "approved", "partially_paid"].includes(pi.status) && (
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                ยกเลิก
              </button>
            )}
            {pi.status === "draft" && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Info */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลทั่วไป</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ผู้จำหน่าย</p>
                  <p className="font-medium text-gray-900">{pi.contact_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่รับ bill</p>
                  <p className="font-medium text-gray-900">{formatThaiDate(pi.bill_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ครบกำหนด</p>
                  <p className="font-medium text-gray-900">{formatThaiDate(pi.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">โครงการ</p>
                  <p className="font-medium text-gray-900">{pi.project_name || "-"}</p>
                </div>
                {pi.purchase_order_number && (
                  <div>
                    <p className="text-sm text-gray-500">ใบสั่งซื้อ</p>
                    <p className="font-medium text-peak-purple">{pi.purchase_order_number}</p>
                  </div>
                )}
              </div>
              {pi.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">หมายเหตุ</p>
                  <p className="text-gray-900">{pi.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">รายการ</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">รายละเอียด</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">จำนวน</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">ราคาต่อหน่วย</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">ส่วนลด</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {pi.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{item.discount_percent}%</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ราคาก่อนภาษี</span>
                  <span className="font-medium">{formatCurrency(pi.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT ({pi.vat_rate}%)</span>
                  <span className="font-medium">{formatCurrency(pi.vat_amount)}</span>
                </div>
                {pi.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ส่วนลด</span>
                    <span className="font-medium">{formatCurrency(pi.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                  <span className="text-gray-900">ยอดรวมสุทธิ</span>
                  <span className="text-peak-purple">{formatCurrency(pi.total_amount)}</span>
                </div>
                {pi.paid_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ชำระแล้ว</span>
                    <span className="font-medium text-green-600">{formatCurrency(pi.paid_amount)}</span>
                  </div>
                )}
                {outstanding > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค้างชำระ</span>
                    <span className="font-medium text-red-600">{formatCurrency(outstanding)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
