'use client'

import { useState, useCallback } from 'react'
import { VirtualTable, VirtualTableColumn } from '@/components/virtual-scroll'
import { BulkActionsToolbar, useBulkSelection } from '@/components/bulk-operations/bulk-actions-toolbar'
import { AdvancedFilter, FilterCondition } from '@/components/filters/advanced-filter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileEdit, Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  code: string
  name: string
  category?: string
  type: 'PRODUCT' | 'SERVICE'
  unit: string
  salePrice: number
  costPrice: number
  quantity: number
  isActive: boolean
  isInventory: boolean
}

interface ProductListVirtualProps {
  products: Product[]
  onAdd?: () => void
  onEdit: (product: Product) => void
  onView: (product: Product) => void
  onDelete: (ids: string[]) => void
  onExport: (ids: string[]) => void
  onStatusChange: (ids: string[], isActive: boolean) => void
}

const categoryColors: Record<string, string> = {
  'สินค้าสำเร็จรูป': 'bg-blue-100 text-blue-800',
  'วัตถุดิบ': 'bg-green-100 text-green-800',
  'สินค้ากึ่งสำเร็จรูป': 'bg-yellow-100 text-yellow-800',
  'บริการ': 'bg-purple-100 text-purple-800',
  'อื่นๆ': 'bg-gray-100 text-gray-800',
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount)
}

export function ProductListVirtual({
  products,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onExport,
  onStatusChange,
}: ProductListVirtualProps) {
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([])
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string; filters: FilterCondition[] }[]>([])
  const { selectedIds, selectedCount, toggleSelection, selectAll, clearSelection, isSelected } = useBulkSelection(products)
  const { toast } = useToast()

  const columns: VirtualTableColumn<Product>[] = [
    {
      key: 'code',
      header: 'รหัส',
      width: 100,
      sortable: true,
    },
    {
      key: 'name',
      header: 'ชื่อสินค้า',
      width: 250,
      sortable: true,
    },
    {
      key: 'category',
      header: 'หมวดหมู่',
      width: 120,
      sortable: true,
      formatter: (value) => {
        const category = value as string
        if (!category) return '-'
        const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-800'
        return (
          <Badge variant="secondary" className={colorClass}>
            {category}
          </Badge>
        )
      },
    },
    {
      key: 'type',
      header: 'ประเภท',
      width: 80,
      sortable: true,
      formatter: (value) => (
        <Badge variant="outline">
          {value === 'PRODUCT' ? 'สินค้า' : 'บริการ'}
        </Badge>
      ),
    },
    {
      key: 'unit',
      header: 'หน่วย',
      width: 80,
      sortable: true,
    },
    {
      key: 'salePrice',
      header: 'ราคาขาย',
      width: 120,
      sortable: true,
      align: 'right',
      formatter: (value) => formatCurrency(value as number),
    },
    {
      key: 'costPrice',
      header: 'ราคาทุน',
      width: 120,
      sortable: true,
      align: 'right',
      formatter: (value) => formatCurrency(value as number),
    },
    {
      key: 'quantity',
      header: 'จำนวน',
      width: 100,
      sortable: true,
      align: 'right',
      formatter: (value, row) => {
        const product = row as Product
        if (!product.isInventory) return '-'
        return (value as number).toFixed(2)
      },
    },
    {
      key: 'isActive',
      header: 'สถานะ',
      width: 80,
      sortable: true,
      formatter: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-100 text-green-800' : ''}>
          {value ? 'ใช้งาน' : 'ระงับ'}
        </Badge>
      ),
    },
  ]

  const filterFields = [
    { key: 'code', label: 'รหัสสินค้า', type: 'text' as const },
    { key: 'name', label: 'ชื่อสินค้า', type: 'text' as const },
    {
      key: 'category',
      label: 'หมวดหมู่',
      type: 'select' as const,
      options: [
        { label: 'สินค้าสำเร็จรูป', value: 'สินค้าสำเร็จรูป' },
        { label: 'วัตถุดิบ', value: 'วัตถุดิบ' },
        { label: 'สินค้ากึ่งสำเร็จรูป', value: 'สินค้ากึ่งสำเร็จรูป' },
        { label: 'บริการ', value: 'บริการ' },
        { label: 'อื่นๆ', value: 'อื่นๆ' },
      ],
    },
    {
      key: 'type',
      label: 'ประเภท',
      type: 'select' as const,
      options: [
        { label: 'สินค้า', value: 'PRODUCT' },
        { label: 'บริการ', value: 'SERVICE' },
      ],
    },
    {
      key: 'isActive',
      label: 'สถานะ',
      type: 'select' as const,
      options: [
        { label: 'ใช้งาน', value: 'true' },
        { label: 'ระงับ', value: 'false' },
      ],
    },
    { key: 'salePrice', label: 'ราคาขาย', type: 'number' as const },
  ]

  const handleSaveFilter = (name: string, filters: FilterCondition[]) => {
    setSavedFilters([...savedFilters, { id: crypto.randomUUID(), name, filters }])
    toast({
      title: 'บันทึกตัวกรองสำเร็จ',
      description: `ตัวกรอง "${name}" ถูกบันทึกไว้แล้ว`,
    })
  }

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== id))
  }

  const bulkActions = [
    {
      id: 'export',
      label: 'ส่งออก Excel',
      icon: '📊',
      onClick: () => onExport(selectedIds),
    },
    {
      id: 'activate',
      label: 'เปิดใช้งาน',
      icon: '✓',
      onClick: () => onStatusChange(selectedIds, true),
    },
    {
      id: 'deactivate',
      label: 'ระงับใช้งาน',
      icon: '⊘',
      onClick: () => onStatusChange(selectedIds, false),
    },
    {
      id: 'delete',
      label: 'ลบ',
      icon: '🗑️',
      variant: 'destructive' as const,
      onClick: () => onDelete(selectedIds),
      requiresConfirmation: true,
      confirmationTitle: 'ยืนยันการลบ',
      confirmationMessage: `คุณแน่ใจหรือไม่ที่จะลบ ${selectedCount} สินค้าที่เลือก?`,
    },
  ]

  // Apply filters
  const filteredProducts = products.filter((product) => {
    return activeFilters.every((filter) => {
      const value = product[filter.field as keyof Product]
      const filterValue = filter.value

      switch (filter.operator) {
        case 'eq':
          return String(value) === String(filterValue)
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'gt':
          return Number(value) > Number(filterValue)
        case 'lt':
          return Number(value) < Number(filterValue)
        default:
          return true
      }
    })
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">รายการสินค้าและบริการ ({filteredProducts.length} รายการ)</h2>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มสินค้า/บริการ
          </Button>
        )}
      </div>

      <AdvancedFilter
        fields={filterFields}
        activeFilters={activeFilters}
        savedFilters={savedFilters}
        onFilterChange={setActiveFilters}
        onSaveFilter={handleSaveFilter}
        onDeleteFilter={handleDeleteFilter}
        onApplySavedFilter={(filter) => setActiveFilters(filter.filters)}
      />

      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={products.length}
        actions={bulkActions}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      <VirtualTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(row) => row.id}
        maxHeight={600}
        selectable
        selectedIds={selectedIds}
        onSelect={toggleSelection}
        onRowClick={onView}
        emptyMessage="ไม่พบสินค้า/บริการ"
      />

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>แสดง {filteredProducts.length} จาก {products.length} รายการ</span>
      </div>
    </div>
  )
}
