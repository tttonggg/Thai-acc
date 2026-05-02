"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProductTransactions } from "@/hooks/useApi";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  AlertTriangle,
  Pencil,
  FileText,
  ShoppingCart,
  ShoppingBag,
  Tag,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [filter, setFilter] = useState<"all" | "sales" | "purchase">("all");

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`).then((res) => res.data),
  });

  const { data: txData, isLoading: txLoading } = useProductTransactions(productId);

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

        {/* Transaction History */}
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
      </div>
    </AppLayout>
  );
}
