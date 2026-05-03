"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useExpenseClaim, useDeleteExpenseClaim, useUpdateExpenseClaimStatus } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Trash2, Pencil, Send, CheckCircle, Wallet, XCircle } from "lucide-react";

export default function ExpenseClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: claim, isLoading } = useExpenseClaim(id);
  const deleteClaim = useDeleteExpenseClaim();
  const updateStatus = useUpdateExpenseClaimStatus();

  const handleDelete = async () => {
    if (!confirm("ต้องการลบใบเบิกค่าใช้จ่ายนี้?")) return;
    try {
      await deleteClaim.mutateAsync(id);
      router.push("/expenses");
    } catch (err) {
      alert("ไม่สามารถลบใบเบิกที่ไม่ใช่สถานะร่างได้");
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

  if (!claim) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">ไม่พบใบเบิกค่าใช้จ่าย</div>
      </AppLayout>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "ร่าง",
    submitted: "ส่งอนุมัติ",
    approved: "อนุมัติ",
    paid: "จ่ายแล้ว",
    rejected: "ปฏิเสธ",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-50 text-blue-700",
    approved: "bg-green-50 text-green-700",
    paid: "bg-purple-50 text-purple-700",
    rejected: "bg-red-50 text-red-700",
  };

  const categoryLabels: Record<string, string> = {
    travel: "ค่าเดินทาง",
    meals: "ค่าอาหาร",
    office: "ค่าใช้จ่ายสำนักงาน",
    entertainment: "ค่าบันเทิง",
    supplies: "ค่าวัสดุสิ้นเปลือง",
    utilities: "ค่าสาธารณูปโภค",
    other: "อื่นๆ",
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
                <h1 className="text-2xl font-bold text-gray-900">{claim.claim_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[claim.status] || "bg-gray-100 text-gray-700"}`}>
                  {statusLabels[claim.status] || claim.status}
                </span>
              </div>
              <p className="text-gray-500 mt-1">ใบเบิกค่าใช้จ่าย</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["draft", "rejected"].includes(claim.status) && (
              <Link
                href={`/expenses/expense-claims/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                แก้ไข
              </Link>
            )}
            {claim.status === "draft" && (
              <button
                onClick={() => handleStatusChange("submitted")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                ส่งอนุมัติ
              </button>
            )}
            {claim.status === "submitted" && (
              <>
                <button
                  onClick={() => handleStatusChange("approved")}
                  disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  ปฏิเสธ
                </button>
              </>
            )}
            {claim.status === "approved" && (
              <button
                onClick={() => handleStatusChange("paid")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                จ่ายเงิน
              </button>
            )}
            {claim.status === "draft" && (
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
                  <p className="text-sm text-gray-500">พนักงาน</p>
                  <p className="font-medium text-gray-900">{claim.employee_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">หมวดหมู่</p>
                  <p className="font-medium text-gray-900">{categoryLabels[claim.category] || claim.category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่ใช้จ่าย</p>
                  <p className="font-medium text-gray-900">{formatThaiDate(claim.expense_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่เบิก</p>
                  <p className="font-medium text-gray-900">{formatThaiDate(claim.claim_date)}</p>
                </div>
                {claim.approved_by_name && (
                  <div>
                    <p className="text-sm text-gray-500">ผู้อนุมัติ</p>
                    <p className="font-medium text-gray-900">{claim.approved_by_name}</p>
                  </div>
                )}
                {claim.approved_at && (
                  <div>
                    <p className="text-sm text-gray-500">วันที่อนุมัติ</p>
                    <p className="font-medium text-gray-900">{formatThaiDate(claim.approved_at)}</p>
                  </div>
                )}
              </div>
              {claim.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">รายละเอียด</p>
                  <p className="text-gray-900">{claim.description}</p>
                </div>
              )}
            </div>

            {/* Receipts */}
            {claim.receipts && claim.receipts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ใบเสร็จ</h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-sm font-medium text-gray-500">เลขที่ใบเสร็จ</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-500">ผู้ออก</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claim.receipts.map((receipt: any) => (
                      <tr key={receipt.id} className="border-b border-gray-50">
                        <td className="py-3 text-sm text-gray-900">{receipt.receipt_number || "-"}</td>
                        <td className="py-3 text-sm text-gray-900">{receipt.issuer_name || "-"}</td>
                        <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(receipt.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ราคาก่อนภาษี</span>
                  <span className="font-medium">{formatCurrency(claim.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT ({claim.vat_rate}%)</span>
                  <span className="font-medium">{formatCurrency(claim.vat_amount)}</span>
                </div>
                {claim.wht_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ภาษีหัก ณ ที่จ่าย ({claim.wht_rate}%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(claim.wht_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                  <span className="text-gray-900">ยอดรวมสุทธิ</span>
                  <span className="text-peak-purple">{formatCurrency(claim.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
