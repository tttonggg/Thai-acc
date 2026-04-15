/**
 * GRN List Placeholder
 * Temporary component until GRN module is fully implemented
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export function GoodsReceiptNotesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          ใบรับสินค้า (Goods Receipt Notes)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">GRN Module Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-4">
            ระบบรับสินค้า (Goods Receipt Notes) และ Three-Way Match อยู่ระหว่างการพัฒนา
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>✅ คอมโพเนนต์พื้นฐานสร้างเสร็จแล้ว</p>
            <p>🔧 กำลังแก้ไขปัญหาการแสดงผล</p>
            <p>📋 ฟีเจอร์ที่จะมี:</p>
            <ul className="list-disc list-inside ml-4 text-left">
              <li>บันทึกรับสินค้าจาก PO</li>
              <li>Three-Way Match (PO vs GRN vs Invoice)</li>
              <li>ตรวจสอบความแตกต่างของปริมาณและราคา</li>
              <li>รายงานความแตกต่าง (Variance Report)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
