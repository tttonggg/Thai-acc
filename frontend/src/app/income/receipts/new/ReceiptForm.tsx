"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useInvoices, useProjects, useCreateReceipt } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function ReceiptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillInvoiceId = searchParams.get("invoice_id");

  const { data: invoices } = useInvoices({ status: "sent" });
  const { data: projects } = useProjects();
  const createReceipt = useCreateReceipt();

  const [invoiceId, setInvoiceId] = useState(prefillInvoiceId || "");
  const [projectId, setProjectId] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [whtAmount, setWhtAmount] = useState("0");
  const [whtRate, setWhtRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInvoice = invoices?.find((inv: any) => inv.id === invoiceId);
  const remainingAmount = selectedInvoice ? selectedInvoice.total_amount - selectedInvoice.paid_amount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;

    setIsSubmitting(true);
    try {
      await createReceipt.mutateAsync({
        invoice_id: invoiceId,
        receipt_date: receiptDate,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        project_id: projectId || undefined,
        wht_amount: parseFloat(whtAmount),
        wht_rate: parseFloat(whtRate),
        notes: notes || undefined,
      });
      router.push("/income");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/income" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บันทึกรับเงิน</h1>
            <p className="text-gray-500 mt-1">บันทึกการรับชำระเงินจากใบแจ้งหนี้</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">เลือกใบแจ้งหนี้</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ใบแจ้งหนี้ *</label>
                <select
                  value={invoiceId}
                  onChange={(e) => {
                    setInvoiceId(e.target.value);
                    const inv = invoices?.find((i: any) => i.id === e.target.value);
                    if (inv) {
                      setAmount((inv.total_amount - inv.paid_amount).toString());
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกใบแจ้งหนี้</option>
                  {invoices?.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.contact_name} (ค้าง {formatCurrency(inv.total_amount - inv.paid_amount)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ยอดรวม:</span>
                    <p className="font-medium text-gray-900">{formatCurrency(selectedInvoice.total_amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ชำระแล้ว:</span>
                    <p className="font-medium text-green-600">{formatCurrency(selectedInvoice.paid_amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ค้างชำระ:</span>
                    <p className="font-medium text-red-600">{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โครงการ (ถ้ามี)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกโครงการ</option>
                  {projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.project_code} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดการชำระ</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={remainingAmount}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วิธีชำระ *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="cash">เงินสด</option>
                  <option value="bank_transfer">โอนธนาคาร</option>
                  <option value="cheque">เช็ค</option>
                  <option value="credit_card">บัตรเครดิต</option>
                  <option value="promptpay">พร้อมเพย์</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="เลขที่เช็ค / รหัสโอน"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          {/* WHT */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ภาษีหัก ณ ที่จ่าย (WHT)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อัตรา WHT (%)</label>
                <select
                  value={whtRate}
                  onChange={(e) => {
                    const rate = e.target.value;
                    setWhtRate(rate);
                    const amt = parseFloat(amount) || 0;
                    setWhtAmount((amt * parseFloat(rate) / 100).toFixed(2));
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="0">ไม่มี</option>
                  <option value="1">1% (ค่าขนส่ง)</option>
                  <option value="2">2% (ค่าโฆษณา)</option>
                  <option value="3">3% (ค่าบริการ)</option>
                  <option value="5">5% (ค่าเช่า)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน WHT</label>
                <input
                  type="number"
                  value={whtAmount}
                  onChange={(e) => setWhtAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
            />
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-peak-purple/5 to-peak-teal/5 rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">จำนวนเงินรับ:</p>
                <p className="text-sm text-gray-600">หัก WHT:</p>
                <p className="text-base font-bold text-gray-900 mt-2">รับสุทธิ:</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(parseFloat(amount) || 0)}</p>
                <p className="text-sm font-medium text-red-600">-{formatCurrency(parseFloat(whtAmount) || 0)}</p>
                <p className="text-base font-bold text-peak-purple mt-2">
                  {formatCurrency((parseFloat(amount) || 0) - (parseFloat(whtAmount) || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/income" className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">ยกเลิก</Link>
            <button type="submit" disabled={isSubmitting || !invoiceId} className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกรับเงิน"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
