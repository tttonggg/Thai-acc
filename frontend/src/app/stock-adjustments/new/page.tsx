"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProducts } from "@/hooks/useApi";
import { ArrowLeft, Plus } from "lucide-react";

const adjustmentTypes = [
  { value: "initial", label: "ยอดยกมา" },
  { value: "found", label: "ตรวจนับเพิ่ม" },
  { value: "loss", label: "สูญหาย" },
  { value: "damage", label: "เสียหาย" },
  { value: "correction", label: "ปรับแก้" },
];

export default function NewStockAdjustmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: products } = useProducts();

  const createAdjustment = useMutation({
    mutationFn: (data: any) => api.post("/stock-adjustments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      router.push("/stock-adjustments");
    },
  });

  const [productId, setProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("initial");
  const [quantityChange, setQuantityChange] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantityChange) return;

    await createAdjustment.mutateAsync({
      product_id: productId,
      adjustment_type: adjustmentType,
      quantity_change: parseFloat(quantityChange),
      unit_cost: parseFloat(unitCost) || 0,
      reason: reason || undefined,
      reference_number: referenceNumber || undefined,
    });
  };

  const selectedProduct = products?.find((p: any) => p.id === productId);
  const isNegativeType = adjustmentType === "loss" || adjustmentType === "damage";
  const qty = parseFloat(quantityChange) || 0;
  const cost = parseFloat(unitCost) || selectedProduct?.cost_price || 0;
  const totalValue = qty * cost;

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/stock-adjustments" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สร้างการปรับสต็อก</h1>
            <p className="text-gray-500 mt-1">บันทึกการปรับปรุงจำนวนสินค้าในคลัง</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการปรับสต็อก</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สินค้า *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="">เลือกสินค้า</option>
                  {products?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — คงเหลือ: {p.quantity_on_hand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการปรับ *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  {adjustmentTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {isNegativeType && (
                  <p className="text-xs text-amber-600 mt-1">ระบบจะหักจำนวนออกจากสต็อกอัตโนมัติ</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน {isNegativeType ? "ที่หัก" : "ที่เพิ่ม"} *
                  </label>
                  <input
                    type="number"
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทุนต่อหน่วย</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder={selectedProduct?.cost_price?.toString() || "0.00"}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                  {selectedProduct?.cost_price > 0 && !unitCost && (
                    <p className="text-xs text-gray-500 mt-1">
                      ใช้ต้นทุนเดิม: {selectedProduct.cost_price}
                    </p>
                  )}
                </div>
              </div>

              {qty > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">มูลค่ารวม:</span>
                    <span className="font-medium text-gray-900">
                      {totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="เช่น ยอดยกมาต้นงวด, สินค้าเสียหายจากการขนส่ง"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="เช่น ใบตรวจนับ #123"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/stock-adjustments"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={createAdjustment.isPending || !productId || !quantityChange}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAdjustment.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
