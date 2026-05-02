"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useContacts, useProjects, usePurchaseOrders, useCreatePurchaseInvoice } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface LineItem {
  id: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_percent: string;
}

export default function PurchaseInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPoId = searchParams.get("purchase_order_id");

  const { data: contacts } = useContacts();
  const { data: projects } = useProjects();
  const { data: purchaseOrders } = usePurchaseOrders();
  const createPurchaseInvoice = useCreatePurchaseInvoice();

  const [contactId, setContactId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState(prefillPoId || "");
  const [projectId, setProjectId] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState("7");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", unit_price: "0", discount_percent: "0" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: "1", unit_price: "0", discount_percent: "0" }]);
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
    const disc = parseFloat(item.discount_percent) || 0;
    return qty * price * (1 - disc / 100);
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const vatAmount = subtotal * (parseFloat(vatRate) || 0) / 100;
  const discount = parseFloat(discountAmount) || 0;
  const totalAmount = subtotal + vatAmount - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        contact_id: contactId,
        bill_date: billDate,
        due_date: dueDate || undefined,
        project_id: projectId || undefined,
        vat_rate: parseFloat(vatRate),
        discount_amount: parseFloat(discountAmount),
        notes: notes || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount_percent: parseFloat(item.discount_percent),
        })),
      };
      if (purchaseOrderId) {
        payload.purchase_order_id = purchaseOrderId;
      }
      await createPurchaseInvoice.mutateAsync(payload);
      router.push("/expenses");
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
          <Link href="/expenses" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สร้างใบแจ้งหนี้ซื้อ</h1>
            <p className="text-gray-500 mt-1">กรอกข้อมูลเพื่อสร้างใบแจ้งหนี้ซื้อใหม่</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor & Project */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลผู้จำหน่าย</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้จำหน่าย *</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกผู้จำหน่าย</option>
                  {contacts?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ใบสั่งซื้อ (ถ้ามี)</label>
                <select
                  value={purchaseOrderId}
                  onChange={(e) => setPurchaseOrderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกใบสั่งซื้อ</option>
                  {purchaseOrders?.filter((po: any) => po.status === "confirmed" || po.status === "received").map((po: any) => (
                    <option key={po.id} value={po.id}>{po.po_number} - {po.contact_name}</option>
                  ))}
                </select>
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับบิล *</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ครบกำหนด *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">รายการ</h2>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-peak-purple bg-peak-purple/10 rounded-lg hover:bg-peak-purple/20 transition-colors">
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <input type="text" placeholder="รายละเอียด" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="จำนวน" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} min="0.01" step="0.01" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="ราคา" value={item.unit_price} onChange={(e) => updateItem(item.id, "unit_price", e.target.value)} min="0" step="0.01" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" placeholder="ส่วนลด %" value={item.discount_percent} onChange={(e) => updateItem(item.id, "discount_percent", e.target.value)} min="0" max="100" step="0.01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple" />
                  </div>
                  <div className="col-span-1 flex justify-end pt-2">
                    <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="col-span-12 text-right text-sm text-gray-600">รวม: {formatCurrency(calculateItemAmount(item))}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
              <div className="text-right text-sm text-gray-600">ราคาก่อนภาษี:</div>
              <div className="text-right text-sm font-medium">{formatCurrency(subtotal)}</div>
              <div className="text-right text-sm text-gray-600">VAT ({vatRate}%):</div>
              <div className="text-right text-sm font-medium">{formatCurrency(vatAmount)}</div>
              <div className="text-right text-sm text-gray-600">ส่วนลด:</div>
              <div className="text-right">
                <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} min="0" step="0.01" className="w-32 px-3 py-1 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple" />
              </div>
              <div className="text-right text-base font-bold text-gray-900 border-t pt-2">ยอดรวมสุทธิ:</div>
              <div className="text-right text-base font-bold text-peak-purple border-t pt-2">{formatCurrency(totalAmount)}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/expenses" className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">ยกเลิก</Link>
            <button type="submit" disabled={isSubmitting || !contactId} className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "กำลังบันทึก..." : "สร้างใบแจ้งหนี้ซื้อ"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
