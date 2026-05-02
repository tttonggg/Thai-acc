"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { usePurchaseOrder, useDeletePurchaseOrder } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Trash2, FileText } from "lucide-react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: po, isLoading } = usePurchaseOrder(id);
  const deletePO = useDeletePurchaseOrder();

  const handleDelete = async () => {
    if (!confirm("ต้องการลบใบสั่งซื้อนี้?")) return;
    try {
      await deletePO.mutateAsync(id);
      router.push("/expenses");
    } catch (err) {
      alert("ไม่สามารถลบใบสั่งซื้อที่ไม่ใช่สถานะร่างได้");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!po) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">ไม่พบใบสั่งซื้อ</div>
      </AppLayout>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "ร่าง",
    sent: "ส่งแล้ว",
    confirmed: "ยืนยัน",
    received: "รับแล้ว",
    billed: "บันทึกบัญชี",
    cancelled: "ยกเลิก",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-50 text-blue-700",
    confirmed: "bg-green-50 text-green-700",
    received: "bg-yellow-50 text-yellow-700",
    billed: "bg-purple-50 text-purple-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

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
                <h1 className="text-2xl font-bold text-gray-900">{po.po_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[po.status] || "bg-gray-100 text-gray-700"}`}>
                  {statusLabels[po.status] || po.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1">ใบสั่งซื้อ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {po.status === "draft" && (
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
                  <p className="font-medium text-gray-900">{po.contact_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่สั่งซื้อ</p>
                  <p className="font-medium text-gray-900">{formatThaiDate(po.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่คาดว่าจะได้รับ</p>
                  <p className="font-medium text-gray-900">{po.expected_date ? formatThaiDate(po.expected_date) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">โครงการ</p>
                  <p className="font-medium text-gray-900">{po.project_name || "-"}</p>
                </div>
              </div>
              {po.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">หมายเหตุ</p>
                  <p className="text-gray-900">{po.notes}</p>
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
                  {po.items?.map((item: any) => (
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
                  <span className="font-medium">{formatCurrency(po.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT ({po.vat_rate}%)</span>
                  <span className="font-medium">{formatCurrency(po.vat_amount)}</span>
                </div>
                {po.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ส่วนลด</span>
                    <span className="font-medium">{formatCurrency(po.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                  <span className="text-gray-900">ยอดรวมสุทธิ</span>
                  <span className="text-peak-purple">{formatCurrency(po.total_amount)}</span>
                </div>
              </div>
            </div>

            {po.converted_to_purchase_invoice_id && (
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                <p className="text-sm text-purple-700">
                  แปลงเป็นใบแจ้งหนี้ซื้อแล้ว
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
