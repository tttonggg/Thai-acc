'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, ChevronRight, Loader2 } from 'lucide-react';

interface LowStockItem {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  warehouseName: string;
  currentQty: number;
  minQuantity: number;
  shortage: number;
  shortagePct: number;
}

export function LowStockBanner() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const res = await fetch('/api/products/low-stock');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 300_000, // refresh every 5 min
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span className="text-sm text-amber-700">กำลังตรวจสอบสต็อก...</span>
      </div>
    );
  }

  if (error || !data?.success || data.lowStock?.length === 0) {
    return null;
  }

  const { lowStock, summary } = data as { lowStock: LowStockItem[]; summary: { total: number; outOfStock: number } };

  if (summary.total === 0) return null;

  const outOfStockLabel = summary.outOfStock > 0
    ? ` (รวม ${summary.outOfStock} รายการที่หมดสต็อก)`
    : '';

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-800">
              ⚠️ มี {summary.total} รายการที่สต็อกต่ำกว่าจุดสั่งซื้อ{outOfStockLabel}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            {lowStock.slice(0, 3).map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-xs text-amber-700">
                <Package className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{item.productName}</span>
                <span className="text-amber-500">
                  {item.currentQty === 0
                    ? 'หมดสต็อก'
                    : `เหลือ ${item.currentQty} ${item.unit} (min: ${item.minQuantity})`}
                </span>
                {item.warehouseName && (
                  <span className="text-amber-400">· {item.warehouseName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <a
          href="/products"
          className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
        >
          ดูทั้งหมด <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
