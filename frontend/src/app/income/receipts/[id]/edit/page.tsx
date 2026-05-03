"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBankAccounts } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Lock } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "cash", label: "เงินสด" },
  { value: "bank_transfer", label: "โอนเงิน" },
  { value: "cheque", label: "เช็ค" },
  { value: "credit_card", label: "บัตรเครดิต" },
  { value: "promptpay", label: "พร้อมเพย์" },
];

export default function EditReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;
  const queryClient = useQueryClient();
  const { data: bankAccounts } = useBankAccounts();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => api.get(`/receipts/${receiptId}`).then((res) => res.data),
  });

  const updateReceipt = useMutation({
    mutationFn: (data: any) => api.put(`/receipts/${receiptId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt", receiptId] });
      router.push(`/income/receipts/${receiptId}`);
    },
  });

  const [receiptDate, setReceiptDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (receipt) {
      setReceiptDate(receipt.receipt_date || "");
      setPaymentMethod(receipt.payment_method || "cash");
      setPaymentReference(receipt.payment_reference || "");
      setBankAccountId(receipt.bank_account_id || "");
      setNotes(receipt.notes || "");
    }
  }, [receipt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateReceipt.mutateAsync({
      receipt_date: receiptDate,
      payment_method: paymentMethod,
      payment_reference: paymentReference || undefined,
      bank_account_id: bankAccountId || undefined,
      notes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!receipt) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบใบเสร็จ</div>
      </AppLayout>
    );
  }

  if (receipt.status === "cancelled") {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/income/receipts/${receiptId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเสร็จ</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ไม่สามารถแก้ไขได้</h2>
            <p className="text-gray-500">
              ใบเสร็จนี้อยู่ในสถานะยกเลิก ไม่สามารถแก้ไขได้
            </p>
            <Link
              href={`/income/receipts/${receiptId}`}
              className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              กลับไปหน้ารายละเอียด
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/income/receipts/${receiptId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเสร็จ</h1>
            <p className="text-gray-500 mt-1">{receipt.receipt_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลใบเสร็จ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ใบแจ้งหนี้</label>
                <p className="text-gray-900 font-medium">{receipt.invoice_number || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
                <p className="text-gray-900 font-medium">{receipt.contact_name || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
                <p className="text-gray-900 font-medium">{formatCurrency(receipt.amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รับสุทธิ</label>
                <p className="text-gray-900 font-medium">{formatCurrency(receipt.total_amount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการชำระเงิน</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับเงิน *</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วิธีชำระเงิน *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="เช่น เลขที่เช็ค, รหัสโอน"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บัญชีธนาคาร</label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกบัญชี</option>
                  {bankAccounts?.map((ba: any) => (
                    <option key={ba.id} value={ba.id}>{ba.account_name} ({ba.account_number})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/income/receipts/${receiptId}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateReceipt.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateReceipt.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
