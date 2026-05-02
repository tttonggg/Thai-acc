"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Package, TrendingUp, AlertTriangle, Pencil } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`).then((res) => res.data),
  });

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!product) return <AppLayout><div className="p-8 text-center">ไม่พบสินค้า</div></AppLayout>;

  const isLowStock = parseFloat(product.quantity_on_hand) <= parseFloat(product.reorder_point);

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      </div>
    </AppLayout>
  );
}
