"use client";

import { use } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useCreditNote, useConfirmCreditNote, useCancelCreditNote, useDeleteCreditNote } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";

export default function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> } ) {
  const { id } = use(params);
  const { data: note, isLoading } = useCreditNote(id);
  const confirmNote = useConfirmCreditNote();
  const cancelNote = useCancelCreditNote();
  const deleteNote = useDeleteCreditNote();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-gray-500">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!note) {
    return (
      <AppLayout>
        <div className="p-8 text-gray-500">ไม่พบเอกสาร</div>
      </AppLayout>
    );
  }

  const handleConfirm = async () => {
    if (!confirm("ยืนยันเอกสารนี้?")) return;
    try {
      await confirmNote.mutateAsync(id);
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleCancel = async () => {
    if (!confirm("ยกเลิกเอกสารนี้?")) return;
    try {
      await cancelNote.mutateAsync(id);
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!confirm("ลบเอกสารนี้?")) return;
    try {
      await deleteNote.mutateAsync(id);
      window.location.href = "/income";
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const statusStyles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    confirmed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const typeLabel = note.note_type === "sales_credit" ? "ใบลดหนี้" : "ใบเพิ่มหนี้";

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/income" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {typeLabel} {note.document_number}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[note.status] || "bg-gray-100 text-gray-700"}`}>
                  {note.status === "draft" ? "ร่าง" : note.status === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิก"}
                </span>
                <span className="text-gray-500 text-sm">{formatThaiDate(note.issue_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {note.status === "draft" && (
              <>
                <button
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  ยืนยัน
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบ
                </button>
              </>
            )}
            {note.status === "confirmed" && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                ยกเลิก
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">ลูกค้า</p>
            <p className="font-medium text-gray-900">{note.contact_name || "-"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">อ้างอิงใบแจ้งหนี้</p>
            <p className="font-medium text-gray-900">{note.invoice_number || "-"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">เหตุผล</p>
            <p className="font-medium text-gray-900">{note.reason || "-"}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">รายการ</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ราคาต่อหน่วย</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {note.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">รวมเงิน</span>
              <span className="font-medium">{formatCurrency(note.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">VAT ({note.vat_rate}%)</span>
              <span className="font-medium">{formatCurrency(note.vat_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">รวมทั้งสิ้น</span>
              <span className="text-peak-purple">{formatCurrency(note.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
