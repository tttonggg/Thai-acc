"use client";

import { useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useProducts, useCreateProduct } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Package } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data: products, isLoading } = useProducts({
    category: categoryFilter || undefined,
    search: search || undefined,
  });

  // Get unique categories from products
  const categories = [...new Set(products?.map((p: any) => p.category).filter(Boolean))] as string[];

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
            <p className="text-gray-500 mt-1">จัดการสินค้าและสต็อก</p>
          </div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้า
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนสินค้า</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : products?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ยังไม่มีสินค้า กรุณาเพิ่มสินค้าใหม่
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">SKU</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ชื่อสินค้า</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">หมวดหมู่</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ราคาขาย</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ต้นทุน</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${product.id}`}
                        className="font-medium text-gray-900 hover:text-peak-purple transition-colors"
                      >
                        {product.name}
                      </Link>
                      {product.track_inventory && (
                        <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {product.cost_method}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(product.cost_price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          product.quantity_on_hand <= product.reorder_point
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {product.quantity_on_hand} {product.unit_name}
                      </span>
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
