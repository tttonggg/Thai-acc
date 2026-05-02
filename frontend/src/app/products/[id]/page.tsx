"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import {
  ArrowLeft,
  AlertTriangle,
  Pencil,
  FileText,
  ShoppingCart,
  ShoppingBag,
  Tag,
  Plus,
} from "lucide-react";
import { useProductTransactions, useStockMovements, useCreateStockAdjustment, useFifoLayers } from "@/hooks/useApi";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [filter, setFilter] = useState<"all" | "sales" | "purchase">("all");
  const [activeTab, setActiveTab] = useState<"transactions" | "inventory">("transactions");
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: "correction",
    quantity_change: "",
    unit_cost: "",
    reason: "",
    reference_number: "",
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`).then((res) => res.data),
  });

  const { data: txData, isLoading: txLoading } = useProductTransactions(productId);
  const { data: movements, isLoading: movementsLoading } = useStockMovements(productId);
  const { data: fifoLayers, isLoading: fifoLoading } = useFifoLayers(productId);
  const createAdjustment = useCreateStockAdjustment();

  const isLoading = productLoading || txLoading;

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

  const isLowStock = parseFloat(product.quantity_on_hand) <= parseFloat(product.reorder_point);
  const summary = txData?.summary;
  const allTransactions = txData?.transactions || [];

  const filteredTransactions = allTransactions.filter((t: any) => {
    if (filter === "all") return true;
    if (filter === "sales") return ["quotation", "invoice"].includes(t.document_type);
    if (filter === "purchase") return ["purchase_order", "purchase_invoice"].includes(t.document_type);
    return true;
  });

  const docTypeColors: Record<string, string> = {
    quotation: "bg-gray-100 text-gray-700",
    invoice: "bg-blue-100 text-blue-700",
    purchase_order: "bg-orange-100 text-orange-700",
    purchase_invoice: "bg-amber-100 text-amber-700",
  };

  const adjTypeLabels: Record<string, string> = {
    initial: "ยอดยกมา",
    found: "ตรวจนับเพิ่ม",
    loss: "สูญหาย",
    damage: "เสียหาย",
    correction: "ปรับแก้",
  };

  const adjTypeColors: Record<string, string> = {
    initial: "bg-blue-100 text-blue-700",
    found: "bg-green-100 text-green-700",
    loss: "bg-red-100 text-red-700",
    damage: "bg-orange-100 text-orange-700",
    correction: "bg-purple-100 text-purple-700",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-600",
    accepted: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    converted: "bg-purple-100 text-purple-600",
    paid: "bg-green-100 text-green-600",
    partially_paid: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-600",
    cancelled: "bg-gray-200 text-gray-500",
    confirmed: "bg-green-100 text-green-600",
    received: "bg-teal-100 text-teal-600",
    billed: "bg-indigo-100 text-indigo-600",
    approved: "bg-green-100 text-green-600",
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <span className="text-sm text-gray-500 font-mono">{product.sku}</span>
            </div>
            {product.name_en && <p className="text-gray-500">{product.name_en}</p>}
          </div>
          <Link
            href={`/products/${productId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            แก้ไข
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ราคาขาย</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.unit_price)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ต้นทุน</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.cost_price)}</p>
          </div>
          <div className={`rounded-xl shadow-sm border p-6 ${isLowStock ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm ${isLowStock ? "text-red-600" : "text-gray-500"}`}>คงเหลือ</p>
              {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-2xl font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
              {product.quantity_on_hand} {product.unit_name}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">จุดสั่งซื้อ</p>
            <p className="text-2xl font-bold text-gray-900">{product.reorder_point} {product.unit_name}</p>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลสินค้า</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">หมวดหมู่</p>
              <p className="font-medium text-gray-900">{product.category || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">วิธีคำนวณต้นทุน</p>
              <p className="font-medium text-gray-900">{product.cost_method}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ติดตามสต็อก</p>
              <p className="font-medium text-gray-900">{product.track_inventory ? "ใช่" : "ไม่"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">สถานะ</p>
              <p className="font-medium text-gray-900">{product.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}</p>
            </div>
          </div>
          {product.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-1">รายละเอียด</p>
              <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">ขายรวม</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_sold_amount)}</p>
              <p className="text-xs text-gray-500">{summary.total_sold_quantity} {product.unit_name}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">ซื้อรวม</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_purchased_amount)}</p>
              <p className="text-xs text-gray-500">{summary.total_purchased_quantity} {product.unit_name}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">ใบเสนอราคา</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{summary.quotation_count} รายการ</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Tag className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-sm text-gray-500">ใบแจ้งหนี้</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{summary.invoice_count} รายการ</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "transactions", label: "ประวัติธุรกรรม" },
            { key: "inventory", label: "สต็อก / การปรับปรุง" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "transactions" ? (
          /* Transaction History */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ประวัติธุรกรรม</h3>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: "ทั้งหมด" },
                  { key: "sales", label: "ขาย" },
                  { key: "purchase", label: "ซื้อ" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === tab.key
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">ประเภท</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">เลขที่เอกสาร</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">วันที่</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">ลูกค้า/ผู้จำหน่าย</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">สถานะ</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวน</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">ราคา/หน่วย</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        ไม่มีธุรกรรม
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${docTypeColors[t.document_type] || "bg-gray-100 text-gray-700"}`}
                          >
                            <FileText className="w-3 h-3" />
                            {t.document_type_label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={t.link}
                            className="font-medium text-teal-600 hover:text-teal-800 hover:underline"
                          >
                            {t.document_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {t.document_date ? formatThaiDate(t.document_date) : "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {t.contact_name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColors[t.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {t.status_label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {t.quantity} {product.unit_name}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {formatCurrency(t.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
                แสดง {filteredTransactions.length} รายการ
                {allTransactions.length > 100 && " (แสดงสูงสุด 100 รายการล่าสุด)"}
              </div>
            )}
          </div>
        ) : (
          /* Inventory / Stock Adjustments */
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {showAdjustmentForm ? "ยกเลิก" : "ปรับปรุงสต็อก"}
              </button>
            </div>

            {/* Adjustment Form */}
            {showAdjustmentForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">บันทึกการปรับปรุงสต็อก</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      value={adjustmentForm.adjustment_type}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, adjustment_type: e.target.value })
                      }
                    >
                      <option value="initial">ยอดยกมา (Initial)</option>
                      <option value="found">ตรวจนับเพิ่ม (Found)</option>
                      <option value="loss">สูญหาย (Loss)</option>
                      <option value="damage">เสียหาย (Damage)</option>
                      <option value="correction">ปรับแก้ (Correction)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเปลี่ยนแปลง</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น 10 หรือ -5"
                      value={adjustmentForm.quantity_change}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, quantity_change: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ใส่ค่าลบสำหรับ loss/damage หรือ correction ที่ต้องการลด
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทุน/หน่วย (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder={product.cost_price}
                      value={adjustmentForm.unit_cost}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, unit_cost: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="เช่น INV-2026-001"
                      value={adjustmentForm.reference_number}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, reference_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล / หมายเหตุ</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      rows={2}
                      placeholder="ระบุเหตุผลการปรับปรุง"
                      value={adjustmentForm.reason}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowAdjustmentForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      const qty = parseFloat(adjustmentForm.quantity_change);
                      if (isNaN(qty)) {
                        alert("กรุณาระบุจำนวนเปลี่ยนแปลง");
                        return;
                      }
                      createAdjustment.mutate(
                        {
                          product_id: productId,
                          adjustment_type: adjustmentForm.adjustment_type,
                          quantity_change: qty,
                          unit_cost: adjustmentForm.unit_cost
                            ? parseFloat(adjustmentForm.unit_cost)
                            : undefined,
                          reason: adjustmentForm.reason || undefined,
                          reference_number: adjustmentForm.reference_number || undefined,
                        },
                        {
                          onSuccess: () => {
                            setShowAdjustmentForm(false);
                            setAdjustmentForm({
                              adjustment_type: "correction",
                              quantity_change: "",
                              unit_cost: "",
                              reason: "",
                              reference_number: "",
                            });
                          },
                          onError: (err: any) => {
                            alert(err?.response?.data?.detail || "เกิดข้อผิดพลาด");
                          },
                        }
                      );
                    }}
                    disabled={createAdjustment.isPending}
                    className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {createAdjustment.isPending ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </div>
            )}

            {/* FIFO Layers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">ชั้นต้นทุน FIFO</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">วันที่ซื้อ</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวนรับ</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">คงเหลือ</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">ต้นทุน/หน่วย</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">มูลค่าคงเหลือ</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fifoLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">กำลังโหลด...</td>
                      </tr>
                    ) : !fifoLayers || fifoLayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          ไม่มีชั้นต้นทุน FIFO (ยังไม่มีการซื้อสินค้า)
                        </td>
                      </tr>
                    ) : (
                      fifoLayers.map((layer: any) => (
                        <tr key={layer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-600">
                            {layer.purchase_date ? formatThaiDate(layer.purchase_date) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {layer.quantity} {product.unit_name}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {layer.remaining_qty} {product.unit_name}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {formatCurrency(layer.unit_cost)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatCurrency(layer.remaining_qty * layer.unit_cost)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                              layer.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {layer.is_active ? "ใช้งาน" : "หมดแล้ว"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movements Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">ประวัติการเคลื่อนไหวสต็อก</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">วันที่</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">ประเภท</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">จำนวน</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">คงเหลือ</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">ต้นทุน/หน่วย</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">อ้างอิง</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {movementsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">กำลังโหลด...</td>
                      </tr>
                    ) : !movements || movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          ไม่มีประวัติการเคลื่อนไหวสต็อก
                        </td>
                      </tr>
                    ) : (
                      movements.map((m: any) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-600">
                            {m.created_at ? formatThaiDate(m.created_at) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                                adjTypeColors[m.adjustment_type as string] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {adjTypeLabels[m.adjustment_type as string] || m.adjustment_type}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-medium ${m.quantity_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {m.quantity_change >= 0 ? "+" : ""}{m.quantity_change} {product.unit_name}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {m.quantity_after} {product.unit_name}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {m.unit_cost ? formatCurrency(m.unit_cost) : "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {m.reference_number || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {m.reason || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
