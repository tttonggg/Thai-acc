'use client';

import { useState, useCallback, useRef } from 'react';
import { VirtualTable, VirtualTableColumn } from '@/components/virtual-scroll';
import {
  BulkActionsToolbar,
  useBulkSelection,
} from '@/components/bulk-operations/bulk-actions-toolbar';
import { AdvancedFilter, FilterCondition } from '@/components/filters/advanced-filter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileEdit, Eye, Trash2, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  code: string;
  name: string;
  taxId?: string;
  phone?: string;
  email?: string;
  province?: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive';
}

interface CustomerListVirtualProps {
  customers: Customer[];
  onAdd?: () => void;
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onDelete: (ids: string[]) => void;
  onExport: (ids: string[]) => void;
  onStatusChange: (ids: string[], status: 'active' | 'inactive') => void;
  onSendEmail?: (ids: string[]) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
};

export function CustomerListVirtual({
  customers,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onExport,
  onStatusChange,
  onSendEmail,
}: CustomerListVirtualProps) {
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilters, setSavedFilters] = useState<
    { id: string; name: string; filters: FilterCondition[] }[]
  >([]);
  const { selectedIds, selectedCount, toggleSelection, selectAll, clearSelection, isSelected } =
    useBulkSelection(customers);
  const { toast } = useToast();
  const selectedIdsRef = useRef<string[]>([]);

  const columns: VirtualTableColumn<Customer>[] = [
    {
      key: 'code',
      header: 'รหัส',
      width: 80,
      sortable: true,
    },
    {
      key: 'name',
      header: 'ชื่อลูกค้า',
      width: 200,
      sortable: true,
    },
    {
      key: 'taxId',
      header: 'เลขประจำตัวผู้เสียภาษี',
      width: 140,
      sortable: true,
      formatter: (value, row?): React.ReactNode => (value ? String(value) : '-'),
    },
    {
      key: 'contact',
      header: 'ติดต่อ',
      width: 180,
      formatter: (value, row) => {
        const customer = row as Customer;
        return (
          <div className="flex flex-col gap-1">
            {customer.phone && (
              <div className="flex items-center gap-1 text-xs">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {customer.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'province',
      header: 'จังหวัด',
      width: 100,
      sortable: true,
      formatter: (value, row?): React.ReactNode => (value ? String(value) : '-'),
    },
    {
      key: 'creditLimit',
      header: 'วงเงินเครดิต',
      width: 120,
      sortable: true,
      align: 'right',
      formatter: (value) => formatCurrency(value as number),
    },
    {
      key: 'balance',
      header: 'ยอดคงเหลือ',
      width: 120,
      sortable: true,
      align: 'right',
      formatter: (value) => (
        <span className="font-medium text-blue-600">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      width: 80,
      sortable: true,
      formatter: (value) => (
        <Badge
          variant={value === 'active' ? 'default' : 'secondary'}
          className={value === 'active' ? 'bg-green-100 text-green-800' : ''}
        >
          {value === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Badge>
      ),
    },
  ];

  const filterFields = [
    { key: 'code', label: 'รหัสลูกค้า', type: 'text' as const },
    { key: 'name', label: 'ชื่อลูกค้า', type: 'text' as const },
    { key: 'taxId', label: 'เลขประจำตัวผู้เสียภาษี', type: 'text' as const },
    { key: 'province', label: 'จังหวัด', type: 'text' as const },
    {
      key: 'status',
      label: 'สถานะ',
      type: 'select' as const,
      options: [
        { label: 'ใช้งาน', value: 'active' },
        { label: 'ไม่ใช้งาน', value: 'inactive' },
      ],
    },
    { key: 'creditLimit', label: 'วงเงินเครดิต', type: 'number' as const },
    { key: 'balance', label: 'ยอดคงเหลือ', type: 'number' as const },
  ];

  const handleSaveFilter = (name: string, filters: FilterCondition[]) => {
    setSavedFilters([...savedFilters, { id: crypto.randomUUID(), name, filters }]);
    toast({
      title: 'บันทึกตัวกรองสำเร็จ',
      description: `ตัวกรอง "${name}" ถูกบันทึกไว้แล้ว`,
    });
  };

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== id));
  };

  const bulkActions = [
    {
      id: 'export',
      label: 'ส่งออก Excel',
      icon: '📊',
      onClick: () => onExport(selectedIds),
    },
    ...(onSendEmail
      ? [
          {
            id: 'email',
            label: 'ส่งอีเมล',
            icon: '📧',
            onClick: () => onSendEmail(selectedIds),
          },
        ]
      : []),
    {
      id: 'activate',
      label: 'เปิดใช้งาน',
      icon: '✓',
      onClick: () => onStatusChange(selectedIds, 'active'),
    },
    {
      id: 'deactivate',
      label: 'ปิดใช้งาน',
      icon: '⊘',
      onClick: () => onStatusChange(selectedIds, 'inactive'),
    },
    {
      id: 'delete',
      label: 'ลบ',
      icon: '🗑️',
      variant: 'destructive' as const,
      onClick: () => onDelete(selectedIds),
      requiresConfirmation: true,
      confirmationTitle: 'ยืนยันการลบ',
      confirmationMessage: `คุณแน่ใจหรือไม่ที่จะลบ ${selectedCount} ลูกค้าที่เลือก? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
    },
  ];

  // Apply filters
  const filteredCustomers = customers.filter((customer) => {
    return activeFilters.every((filter) => {
      const value = customer[filter.field as keyof Customer];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'eq':
          return String(value) === String(filterValue);
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'gt':
          return Number(value) > Number(filterValue);
        case 'lt':
          return Number(value) < Number(filterValue);
        default:
          return true;
      }
    });
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">รายการลูกค้า ({filteredCustomers.length} รายการ)</h2>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มลูกค้า
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
        totalCount={customers.length}
        actions={bulkActions}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      <VirtualTable
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(row) => row.id}
        maxHeight={600}
        selectable
        selectedIds={selectedIds}
        onSelect={(ids) => { const safeIds = Array.isArray(ids) ? ids : [ids]; selectedIdsRef.current = safeIds; toggleSelection(safeIds[0]); }}
        onRowClick={onView}
        emptyMessage="ไม่พบลูกค้า"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          แสดง {filteredCustomers.length} จาก {customers.length} รายการ
        </span>
      </div>
    </div>
  );
}
