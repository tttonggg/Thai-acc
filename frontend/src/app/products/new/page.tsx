"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useCreateProduct } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";

export default function CreateProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const [form, setForm] = useState({
    sku: "",
    name: "",
    name_en: "",
    description: "",
    category: "",
    unit_price: "0",
    cost_price: "0",
    track_inventory: true,
    cost_method: "FIFO",
    quantity_on_hand: "0",
    reorder_point: "0",
    unit_name: "ชิ้น",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.name) return;

    setIsSubmitting(true);
    try {
      await createProduct.mutateAsync({
        sku: form.sku,
        name: form.name,
        name_en: form.name_en || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        unit_price: parseFloat(form.unit_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        track_inventory: form.track_inventory,
        cost_method: form.cost_method,
        quantity_on_hand: parseFloat(form.quantity_on_hand) || 0,
        reorder_point: parseFloat(form.reorder_point) || 0,
        unit_name: form.unit_name,
      });
      router.push("/products");
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
          <Link href="/products" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มสินค้า</h1>
            <p className="text-gray-500 mt-1">กรอกข้อมูลสินค้าใหม่</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลทั่วไป</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า (SKU) *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) => handleChange("name_en", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ราคา</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย</label>
                <input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => handleChange("unit_price", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทุน</label>
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => handleChange("cost_price", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">สต็อก</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="track_inventory"
                  checked={form.track_inventory}
                  onChange={(e) => handleChange("track_inventory", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-peak-purple focus:ring-peak-purple"
                />
                <label htmlFor="track_inventory" className="text-sm font-medium text-gray-700">
                  ติดตามสต็อก
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเริ่มต้น</label>
                <input
                  type="number"
                  value={form.quantity_on_hand}
                  onChange={(e) => handleChange("quantity_on_hand", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จุดสั่งซื้อ</label>
                <input
                  type="number"
                  value={form.reorder_point}
                  onChange={(e) => handleChange("reorder_point", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
                <input
                  type="text"
                  value={form.unit_name}
                  onChange={(e) => handleChange("unit_name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วิธีคำนวณต้นทุน</label>
                <select
                  value={form.cost_method}
                  onChange={(e) => handleChange("cost_method", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="FIFO">FIFO</option>
                  <option value="AVG">เฉลี่ย</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/products"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !form.sku || !form.name}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
