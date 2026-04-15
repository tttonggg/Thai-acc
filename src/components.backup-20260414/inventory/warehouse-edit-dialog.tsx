'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Warehouse {
  id: string
  code: string
  name: string
  type: string
  location: string | null
  notes: string | null
  isActive: boolean
}

interface WarehouseEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse?: Warehouse | null
  onSuccess: () => void
}

export function WarehouseEditDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess
}: WarehouseEditDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'MAIN',
    location: '',
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    if (warehouse) {
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        type: warehouse.type,
        location: warehouse.location || '',
        notes: warehouse.notes || '',
        isActive: warehouse.isActive,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'MAIN',
        location: '',
        notes: '',
        isActive: true,
      })
    }
  }, [warehouse, open])

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกรหัสและชื่อคลังสินค้า',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const url = warehouse
        ? `/api/warehouses/${warehouse.id}`
        : '/api/warehouses'

      const method = warehouse ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then(r => r.json())

      if (res.success) {
        toast({
          title: warehouse ? 'แก้ไขคลังสำเร็จ' : 'สร้างคลังสำเร็จ',
          description: `คลัง ${formData.name} บันทึกเรียบร้อยแล้ว`
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: 'ข้อผิดพลาด',
          description: res.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md">
        <VisuallyHidden>
          <DialogDescription>
            {warehouse ? 'แก้ไขคลังสินค้าในระบบ' : 'สร้างคลังสินค้าใหม่ในระบบ'}
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle>
            {warehouse ? 'แก้ไขคลังสินค้า' : 'สร้างคลังสินค้าใหม่'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">รหัสคลัง *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="เช่น WH01"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="name">ชื่อคลัง *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น คลังหลัก"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">ประเภทคลัง</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN">คลังหลัก (Main)</SelectItem>
                <SelectItem value="BRANCH">สาขา (Branch)</SelectItem>
                <SelectItem value="STORAGE">คลังจัดเก็บ (Storage)</SelectItem>
                <SelectItem value="VIRTUAL">คลังเสมือน (Virtual)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">ที่ตั้ง</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="เช่น ชั้น 1 อาคาร A"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม"
              disabled={loading}
            />
          </div>

          {warehouse && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                ใช้งานอยู่
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {warehouse ? 'บันทึกการแก้ไข' : 'สร้างคลัง'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
