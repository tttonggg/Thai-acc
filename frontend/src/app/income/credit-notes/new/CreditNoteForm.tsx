"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useContacts, useInvoices, useCreateCreditNote } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface LineItem {
  id: number;
  description: string;
  quantity: string;
  unit_price: string;
}

export default function CreditNoteForm() {
  const router = useRouter();
  const { data: contacts } = useContacts();
  const { data: invoices } = useInvoices();
  const createCreditNote = useCreateCreditNote();

  const [contactId, setContactId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [noteType, setNoteType] = useState("sales_credit");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [vatRate, setVatRate] = useState("7");
  const [currencyCode, setCurrencyCode] = useState("THB");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", unit_price: "0" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencies = [
    { code: "THB", label: "THB - บาท" },
    { code: "USD", label: "USD - ดอลลาร์สหรัฐ" },
    { code: "EUR", label: "EUR - ยูโร" },
    { code: "CNY", label: "CNY - หยวนจีน" },
    { code: "JPY", label: "JPY - เยนญี่ปุ่น" },
    { code: "GBP", label: "GBP - ปอนด์สเตอร์ลิง" },
  ];

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: "1", unit_price: "0" }]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof LineItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const calculateItemAmount = (item: LineItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const vatAmount = subtotal * (parseFloat(vatRate) || 0) / 100;
  const totalAmount = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        contact_id: contactId,
        invoice_id: invoiceId || undefined,
        issue_date: issueDate,
        note_type: noteType,
        vat_rate: parseFloat(vatRate),
        currency_code: currencyCode,
        exchange_rate: parseFloat(exchangeRate) || 1,
        reason: reason || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      };
      await createCreditNote.mutateAsync(payload);
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
      <div className="p-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/income" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {noteType === "sales_credit" ? "สร้างใบลดหนี้" : "สร้างใบเพิ่มหนี้"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                >
                  <option value="sales_credit">ใบลดหนี้ (ลดลูกหนี้)</option>
                  <option value="sales_debit">ใบเพิ่มหนี้ (เพิ่มลูกหนี้)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ลูกค้า *</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                >
                  <option value="">เลือกลูกค้า</option>
                  {contacts?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อ้างอิงใบแจ้งหนี้</label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                >
                  <option value="">เลือกใบแจ้งหนี้ (ไม่บังคับ)</option>
                  {invoices?.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.contact_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สกุลเงิน</label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              {currencyCode !== "THB" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อัตราแลกเปลี่ยน</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อัตรา VAT (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผล</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น สินค้าชำรุด, ส่วนลดหลังการขาย"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายการ</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="รายละเอียด"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      placeholder="จำนวน"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", e.target.value)}
                      placeholder="ราคาต่อหน่วย"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peak-purple focus:border-transparent"
                    />
                  </div>
                  <div className="w-28 text-right pt-2 text-sm text-gray-600">
                    {formatCurrency(calculateItemAmount(item))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">รวมเงิน</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">VAT ({vatRate}%)</span>
                <span className="font-medium">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">รวมทั้งสิ้น</span>
                <span className="text-peak-purple">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกร่าง"}
            </button>
            <Link
              href="/income"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
