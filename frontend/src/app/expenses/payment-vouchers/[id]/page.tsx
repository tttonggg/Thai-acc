"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { usePaymentVoucher, usePostPaymentVoucher, useCancelPaymentVoucher, useDeletePaymentVoucher } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { FileText, Printer, CheckCircle, XCircle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentVoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: voucher, isLoading } = usePaymentVoucher(id);
  const postMutation = usePostPaymentVoucher();
  const cancelMutation = useCancelPaymentVoucher();
  const deleteMutation = useDeletePaymentVoucher();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!voucher) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-gray-500">ไม่พบใบสำคัญจ่าย</div>
      </AppLayout>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "ร่าง",
    posted: "บันทึกบัญชี",
    cancelled: "ยกเลิก",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const handlePost = async () => {
    if (!confirm("ยืนยันการบันทึกบัญชีใบสำคัญจ่ายนี้?")) return;
    await postMutation.mutateAsync(id);
  };

  const handleCancel = async () => {
    if (!confirm("ยืนยันการยกเลิกใบสำคัญจ่ายนี้?")) return;
    await cancelMutation.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (!confirm("ลบใบสำคัญจ่ายนี้?")) return;
    await deleteMutation.mutateAsync(id);
    router.push("/expenses");
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/expenses" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{voucher.voucher_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[voucher.status]}`}>
                  {statusLabels[voucher.status] || voucher.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                วันที่จ่าย: {formatThaiDate(voucher.payment_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {voucher.status === "draft" && (
              <>
                <button onClick={handlePost} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" /> บันทึกบัญชี
                </button>
                <button onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm">
                  <Trash2 className="w-4 h-4" /> ลบ
                </button>
              </>
            )}
            {voucher.status === "posted" && (
              <button onClick={handleCancel} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm">
                <XCircle className="w-4 h-4" /> ยกเลิก
              </button>
            )}
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm">
              <Printer className="w-4 h-4" /> พิมพ์
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">ผู้จำหน่าย</p>
            <p className="font-semibold text-gray-900">{voucher.contact?.name || "-"}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">วิธีการจ่าย</p>
            <p className="font-semibold text-gray-900">{voucher.payment_method}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">ยอดจ่ายรวม</p>
            <p className="font-semibold text-gray-900">{formatCurrency(voucher.total_amount)}</p>
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">รายการจ่ายชำระ</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">ใบแจ้งหนี้ซื้อ</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">จำนวนเงิน</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">ส่วนลด</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">สุทธิ</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lines?.map((line: any) => (
                <tr key={line.id} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{line.purchase_invoice?.bill_number || line.purchase_invoice_id}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(line.amount)}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(line.discount_taken)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(Number(line.amount) - Number(line.discount_taken))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ยอดจ่ายรวม</span>
              <span className="font-medium">{formatCurrency(voucher.total_amount)}</span>
            </div>
            {Number(voucher.wht_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ภาษีหัก ณ ที่จ่าย</span>
                <span className="font-medium">{formatCurrency(voucher.wht_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-100">
              <span>ยอดสุทธิ</span>
              <span>{formatCurrency(Number(voucher.total_amount) - Number(voucher.wht_amount))}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
