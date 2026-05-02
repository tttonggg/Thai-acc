"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContacts, useProjects } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ArrowLeft, Lock } from "lucide-react";

interface LineItem {
  id: number | string;
  description: string;
  quantity: string;
  unit_price: string;
  discount_percent: string;
}

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const queryClient = useQueryClient();
  const { data: contacts } = useContacts();
  const { data: projects } = useProjects();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => api.get(`/quotations/${quotationId}`).then((res) => res.data),
  });

  const updateQuotation = useMutation({
    mutationFn: (data: any) => api.put(`/quotations/${quotationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      router.push(`/income/quotations/${quotationId}`);
    },
  });

  const [contactId, setContactId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [vatRate, setVatRate] = useState("7");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (quotation) {
      setContactId(quotation.contact_id || "");
      setProjectId(quotation.project_id || "");
      setIssueDate(quotation.issue_date || "");
      setExpiryDate(quotation.expiry_date || "");
      setVatRate(quotation.vat_rate?.toString() || "7");
      setDiscountAmount(quotation.discount_amount?.toString() || "0");
      setNotes(quotation.notes || "");
      setTerms(quotation.terms || "");
      setItems(
        quotation.items?.map((item: any) => ({
          id: item.id,
          description: item.description || "",
          quantity: item.quantity?.toString() || "1",
          unit_price: item.unit_price?.toString() || "0",
          discount_percent: item.discount_percent?.toString() || "0",
        })) || []
      );
    }
  }, [quotation]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: "1", unit_price: "0", discount_percent: "0" }]);
  };

  const removeItem = (id: number | string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number | string, field: keyof LineItem, value: string) => {
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

    await updateQuotation.mutateAsync({
      contact_id: contactId,
      issue_date: issueDate,
      expiry_date: expiryDate || undefined,
      project_id: projectId || undefined,
      vat_rate: parseFloat(vatRate),
      discount_amount: parseFloat(discountAmount),
      notes: notes || undefined,
      terms: terms || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_percent: parseFloat(item.discount_percent),
      })),
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!quotation) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบใบเสนอราคา</div>
      </AppLayout>
    );
  }

  if (quotation.status === "converted") {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/income/quotations/${quotationId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเสนอราคา</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ไม่สามารถแก้ไขได้</h2>
            <p className="text-gray-500">ใบเสนอราคานี้ถูกแปลงเป็นใบแจ้งหนี้แล้ว ไม่สามารถแก้ไขได้</p>
            <Link
              href={`/income/quotations/${quotationId}`}
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
      <div className="p-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/income/quotations/${quotationId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขใบเสนอราคา</h1>
            <p className="text-gray-500 mt-1">{quotation.quotation_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลลูกค้า</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า *</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกลูกค้า</option>
                  {contacts?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ออก *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่หมดอายุ</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">รายการ</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-peak-purple bg-peak-purple/10 rounded-lg hover:bg-peak-purple/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="รายละเอียดสินค้า/บริการ"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="ราคาต่อหน่วย"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="ส่วนลด %"
                      value={item.discount_percent}
                      onChange={(e) => updateItem(item.id, "discount_percent", e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-12 text-right text-sm text-gray-600">
                    รวม: {formatCurrency(calculateItemAmount(item))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
              <div className="text-right text-sm text-gray-600">ราคาก่อนภาษี:</div>
              <div className="text-right text-sm font-medium">{formatCurrency(subtotal)}</div>

              <div className="text-right text-sm text-gray-600">VAT ({vatRate}%):</div>
              <div className="text-right text-sm font-medium">{formatCurrency(vatAmount)}</div>

              <div className="text-right text-sm text-gray-600">ส่วนลด:</div>
              <div className="text-right">
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-32 px-3 py-1 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>

              <div className="text-right text-base font-bold text-gray-900 border-t pt-2">ยอดรวมสุทธิ:</div>
              <div className="text-right text-base font-bold text-peak-purple border-t pt-2">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขการชำระเงิน</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/income/quotations/${quotationId}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateQuotation.isPending || !contactId}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateQuotation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
