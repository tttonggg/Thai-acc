"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useStockAdjustments } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { Boxes, Plus } from "lucide-react";

const adjustmentTypes = [
  { key: "all", label: "ทั้งหมด" },
  { key: "initial", label: "ยอดยกมา" },
  { key: "found", label: "ตรวจนับเพิ่ม" },
  { key: "loss", label: "สูญหาย" },
  { key: "damage", label: "เสียหาย" },
  { key: "correction", label: "ปรับแก้" },
];

const adjTypeLabels: Record<string, string> = {
  initial: "ยอดยกมา",
  found: "ตรวจนับเพิ่ม",
  loss: "สูญหาย",
  damage: "เสียหาย",
  correction: "ปรับแก้",
};

const adjTypeColors: Record<string, string> = {
  initial: "bg-blue-50 text-blue-700",
  found: "bg-green-50 text-green-700",
  loss: "bg-red-50 text-red-700",
  damage: "bg-orange-50 text-orange-700",
  correction: "bg-purple-50 text-purple-700",
};

export default function StockAdjustmentsPage() {
  const [filter, setFilter] = useState("all");
  const { data: adjustments, isLoading } = useStockAdjustments(
    filter === "all" ? undefined : { adjustment_type: filter }
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Boxes className="w-7 h-7 text-peak-purple" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ปรับสต็อกสินค้า</h1>
              <p className="text-gray-500 mt-1">Stock Adjustments</p>
            </div>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            สร้างการปรับสต็อก
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {adjustmentTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setFilter(type.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type.key
                  ? "bg-gradient-to-r from-peak-purple to-peak-teal text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Adjustments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : adjustments?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีการปรับสต็อก</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">วันที่</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">สินค้า</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ประเภท</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">เปลี่ยนแปลง</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ต้นทุนต่อหน่วย</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">มูลค่ารวม</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">เหตุผล</th>
                </tr>
              </thead>
              <tbody>
                {adjustments?.map((adj: any) => (
                  <tr key={adj.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatThaiDate(adj.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${adj.product_id}`}
                        className="font-medium text-peak-purple hover:underline"
                      >
                        {adj.product?.name || adj.product_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${adjTypeColors[adj.adjustment_type] || "bg-gray-100 text-gray-600"}`}>
                        {adjTypeLabels[adj.adjustment_type] || adj.adjustment_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${adj.quantity_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {adj.quantity_change > 0 ? "+" : ""}{adj.quantity_change}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatCurrency(adj.unit_cost)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(adj.total_value)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {adj.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
