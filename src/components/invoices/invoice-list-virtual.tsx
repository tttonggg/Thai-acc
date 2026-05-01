'use client';

import { useState, useCallback } from 'react';
import { VirtualTable, VirtualTableColumn } from '@/components/virtual-scroll';
import {
  BulkActionsToolbar,
  useBulkSelection,
} from '@/components/bulk-operations/bulk-actions-toolbar';
import { AdvancedFilter, FilterCondition } from '@/components/filters/advanced-filter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { FileEdit, Eye, Printer } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: Date;
  customerName: string;
  totalAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
}

interface InvoiceListVirtualProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onDelete: (ids: string[]) => void;
  onStatusChange: (ids: string[], status: string) => void;
  onExport: (ids: string[]) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800' },
  ISSUED: { label: 'ออกแล้ว', color: 'bg-blue-100 text-blue-800' },
  PARTIAL: { label: 'รับชำระบางส่วน', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'ชำระเต็มจำนวน', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount / 100);
};

export function InvoiceListVirtual({
  invoices,
  onEdit,
  onView,
  onPrint,
  onDelete,
  onStatusChange,
  onExport,
}: InvoiceListVirtualProps) {
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilters, setSavedFilters] = useState<
    { id: string; name: string; filters: FilterCondition[] }[]
  >([]);
  const { selectedIds, selectedCount, toggleSelection, selectAll, clearSelection, isSelected } =
    useBulkSelection(invoices);

  const columns: VirtualTableColumn<Invoice>[] = [
    {
      key: 'invoiceNo',
      header: 'เลขที่',
      width: 120,
      sortable: true,
    },
    {
      key: 'invoiceDate',
      header: 'วันที่',
      width: 100,
      sortable: true,
      formatter: (value) => format(new Date(value as string), 'dd/MM/yyyy', { locale: th }),
    },
    {
      key: 'customerName',
      header: 'ลูกค้า',
      width: 200,
      sortable: true,
    },
    {
      key: 'totalAmount',
      header: 'ยอดรวม',
      width: 120,
      sortable: true,
      align: 'right',
      formatter: (value) => formatCurrency(value as number),
    },
    {
      key: 'status',
      header: 'สถานะ',
      width: 120,
      sortable: true,
      formatter: (value) => {
        const config = statusConfig[value as string] || { label: value, color: '' };
        return (
          <Badge variant="secondary" className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  const filterFields = [
    { key: 'invoiceNo', label: 'เลขที่ใบกำกับภาษี', type: 'text' as const },
    { key: 'customerName', label: 'ชื่อลูกค้า', type: 'text' as const },
    {
      key: 'status',
      label: 'สถานะ',
      type: 'select' as const,
      options: [
        { label: 'ร่าง', value: 'DRAFT' },
        { label: 'ออกแล้ว', value: 'ISSUED' },
        { label: 'รับชำระบางส่วน', value: 'PARTIAL' },
        { label: 'ชำระเต็มจำหน่วย', value: 'PAID' },
        { label: 'ยกเลิก', value: 'CANCELLED' },
      ],
    },
    { key: 'invoiceDate', label: 'วันที่', type: 'dateRange' as const },
  ];

  const handleSaveFilter = (name: string, filters: FilterCondition[]) => {
    setSavedFilters([...savedFilters, { id: crypto.randomUUID(), name, filters }]);
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
    {
      id: 'print',
      label: 'พิมพ์',
      icon: '🖨️',
      onClick: () => console.log('Print', selectedIds),
    },
    {
      id: 'mark-paid',
      label: 'Mark as Paid',
      icon: '✓',
      onClick: () => onStatusChange(selectedIds, 'PAID'),
    },
    {
      id: 'delete',
      label: 'ลบ',
      icon: '🗑️',
      variant: 'destructive' as const,
      onClick: () => onDelete(selectedIds),
      requiresConfirmation: true,
      confirmationTitle: 'ยืนยันการลบ',
      confirmationMessage: `คุณแน่ใจหรือไม่ที่จะลบ ${selectedCount} ใบกำกับภาษีที่เลือก?`,
    },
  ];

  // Apply filters
  const filteredInvoices = invoices.filter((invoice) => {
    return activeFilters.every((filter) => {
      const value = invoice[filter.field as keyof Invoice];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'eq':
          return value === filterValue;
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
        totalCount={invoices.length}
        actions={bulkActions}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />

      <VirtualTable
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(row) => row.id}
        maxHeight={600}
        selectable
        selectedIds={selectedIds}
        onSelect={toggleSelection}
        onRowClick={onView}
        emptyMessage="ไม่พบใบกำกับภาษี"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          แสดง {filteredInvoices.length} จาก {invoices.length} รายการ
        </span>
      </div>
    </div>
  );
}
