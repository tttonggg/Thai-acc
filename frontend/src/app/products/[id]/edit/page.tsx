"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`).then((res) => res.data),
  });

  const updateProduct = useMutation({
    mutationFn: (data: any) => api.put(`/products/${productId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      router.push(`/products/${productId}`);
    },
  });

  const [form, setForm] = useState({
    sku: "",
    name: "",
    name_en: "",
    description: "",
    unit_price: "",
    cost_price: "",
    track_inventory: false,
    cost_method: "FIFO",
    quantity_on_hand: "",
    reorder_point: "",
    unit_name: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || "",
        name: product.name || "",
        name_en: product.name_en || "",
        description: product.description || "",
        unit_price: product.unit_price?.toString() || "",
        cost_price: product.cost_price?.toString() || "",
        track_inventory: product.track_inventory || false,
        cost_method: product.cost_method || "FIFO",
        quantity_on_hand: product.quantity_on_hand?.toString() || "",
        reorder_point: product.reorder_point?.toString() || "",
        unit_name: product.unit_name || "",
        category: product.category || "",
        is_active: product.is_active !== false,
      });
    }
  }, [product]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.name) return;

    await updateProduct.mutateAsync({
      sku: form.sku,
      name: form.name,
      name_en: form.name_en || undefined,
      description: form.description || undefined,
      unit_price: parseFloat(form.unit_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      track_inventory: form.track_inventory,
      cost_method: form.cost_method,
      quantity_on_hand: parseFloat(form.quantity_on_hand) || 0,
      reorder_point: parseFloat(form.reorder_point) || 0,
      unit_name: form.unit_name || undefined,
      category: form.category || undefined,
      is_active: form.is_active,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบสินค้า</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/products/${productId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขสินค้า</h1>
            <p className="text-gray-500 mt-1">{product.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลสินค้า</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (ภาษาอังกฤษ)</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย</label>
                <input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => handleChange("unit_price", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
                <input
                  type="text"
                  value={form.unit_name}
                  onChange={(e) => handleChange("unit_name", e.target.value)}
                  placeholder="ชิ้น, กล่อง, กก."
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
                  <option value="AVG">เฉลี่ย (AVG)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ</label>
                <input
                  type="number"
                  value={form.quantity_on_hand}
                  onChange={(e) => handleChange("quantity_on_hand", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="track_inventory"
                  checked={form.track_inventory}
                  onChange={(e) => handleChange("track_inventory", e.target.checked)}
                  className="w-4 h-4 text-peak-purple border-gray-300 rounded focus:ring-peak-purple"
                />
                <label htmlFor="track_inventory" className="text-sm font-medium text-gray-700">
                  ติดตามสต็อก
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 text-peak-purple border-gray-300 rounded focus:ring-peak-purple"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  ใช้งาน
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/products/${productId}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateProduct.isPending || !form.sku || !form.name}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProduct.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
