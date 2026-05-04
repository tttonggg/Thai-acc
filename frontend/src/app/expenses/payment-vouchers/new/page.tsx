"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useContacts, usePurchaseInvoices, useCreatePaymentVoucher } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface LineItem {
  purchase_invoice_id: string;
  amount: string;
  discount_taken: string;
}

export default function NewPaymentVoucherPage() {
  const router = useRouter();
  const { data: contacts } = useContacts({ type: "vendor" });
  const { data: purchaseInvoices } = usePurchaseInvoices();
  const createMutation = useCreatePaymentVoucher();

  const [contactId, setContactId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [whtAmount, setWhtAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ purchase_invoice_id: "", amount: "", discount_taken: "" }]);
  const [error, setError] = useState("");

  const vendorInvoices = purchaseInvoices?.filter(
    (inv: any) => inv.contact_id === contactId && ["received", "approved", "partially_paid"].includes(inv.status)
  ) || [];

  const addLine = () => setLines([...lines, { purchase_invoice_id: "", amount: "", discount_taken: "" }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    const newLines = [...lines];
    newLines[idx][field] = value;
    if (field === "purchase_invoice_id" && value) {
      const inv = purchaseInvoices?.find((i: any) => i.id === value);
      if (inv) {
        const unpaid = Number(inv.total_amount) - Number(inv.paid_amount);
        newLines[idx].amount = unpaid.toString();
      }
    }
    setLines(newLines);
  };

  const totalAmount = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!contactId) { setError("กรุณาเลือกผู้จำหน่าย"); return; }
    if (lines.some((l) => !l.purchase_invoice_id || !l.amount)) { setError("กรุณากรอกข้อมูลรายการให้ครบ"); return; }

    try {
      await createMutation.mutateAsync({
        contact_id: contactId,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        wht_amount: whtAmount || "0",
        notes: notes || undefined,
        lines: lines.map((l) => ({
          purchase_invoice_id: l.purchase_invoice_id,
          amount: l.amount,
          discount_taken: l.discount_taken || "0",
        })),
      });
      router.push("/expenses?tab=payment-vouchers");
    } catch (err: any) {
      setError(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างใบสำคัญจ่าย</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ผู้จำหน่าย</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
                <option value="">เลือกผู้จำหน่าย</option>
                {contacts?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จ่าย</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการจ่าย</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="bank_transfer">โอนเงิน</option>
                <option value="cash">เงินสด</option>
                <option value="cheque">เช็ค</option>
                <option value="credit_card">บัตรเครดิต</option>
                <option value="promptpay">พร้อมเพย์</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ภาษีหัก ณ ที่จ่าย</label>
              <input type="number" value={whtAmount} onChange={(e) => setWhtAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รายการจ่ายชำระ</label>
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-3 mb-3 items-end">
                <div className="flex-1">
                  <select value={line.purchase_invoice_id} onChange={(e) => updateLine(idx, "purchase_invoice_id", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
                    <option value="">เลือกใบแจ้งหนี้ซื้อ</option>
                    {vendorInvoices.map((inv: any) => {
                      const unpaid = Number(inv.total_amount) - Number(inv.paid_amount);
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.bill_number} (ค้างชำระ {formatCurrency(unpaid)})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-32">
                  <input type="number" value={line.amount} onChange={(e) => updateLine(idx, "amount", e.target.value)} placeholder="จำนวนเงิน" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div className="w-32">
                  <input type="number" value={line.discount_taken} onChange={(e) => updateLine(idx, "discount_taken", e.target.value)} placeholder="ส่วนลด" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addLine} className="inline-flex items-center gap-2 text-sm text-peak-purple font-medium hover:underline">
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-lg font-semibold text-gray-900">ยอดจ่ายรวม: {formatCurrency(totalAmount)}</div>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push("/expenses")} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 text-sm">
                {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกร่าง"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
