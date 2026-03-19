'use client'

import { ProductList } from './product-list'

export function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">สินค้าและบริการ</h1>
        <p className="text-muted-foreground mt-2">
          จัดการข้อมูลสินค้าและบริการ ราคา สต็อก และข้อมูลภาษี
        </p>
      </div>

      <ProductList />
    </div>
  )
}
