'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Package,
  User,
  CalendarDays,
} from 'lucide-react';

export interface FilterPreset {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  filter: () => boolean;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  activePreset: string | null;
  onSelect: (presetId: string | null) => void;
  className?: string;
}

export function FilterPresets({ presets, activePreset, onSelect, className }: FilterPresetsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(activePreset === preset.id ? null : preset.id)}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
            activePreset === preset.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-muted'
          )}
        >
          {preset.icon}
          <span>{preset.label}</span>
          {preset.count !== undefined && (
            <Badge
              variant={activePreset === preset.id ? 'secondary' : 'outline'}
              className={cn(
                'h-5 px-1.5 text-xs',
                activePreset === preset.id && 'bg-primary-foreground/20 text-primary-foreground'
              )}
            >
              {preset.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// Common preset factories
export function createDatePresets<T extends { date: Date }>(items: T[]): FilterPreset[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  return [
    {
      id: 'today',
      label: 'วันนี้',
      icon: <Calendar className="h-3.5 w-3.5" />,
      count: items.filter((i) => i.date >= today).length,
      filter: () => true, // Actual filtering done in parent
    },
    {
      id: 'this_week',
      label: 'สัปดาห์นี้',
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      count: items.filter((i) => i.date >= thisWeekStart).length,
      filter: () => true,
    },
    {
      id: 'this_month',
      label: 'เดือนนี้',
      icon: <Calendar className="h-3.5 w-3.5" />,
      count: items.filter((i) => i.date >= thisMonthStart).length,
      filter: () => true,
    },
    {
      id: 'this_year',
      label: 'ปีนี้',
      icon: <Calendar className="h-3.5 w-3.5" />,
      count: items.filter((i) => i.date >= thisYearStart).length,
      filter: () => true,
    },
  ];
}

export function createInvoiceStatusPresets<T extends { status: string }>(
  items: T[]
): FilterPreset[] {
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    DRAFT: { label: 'ร่าง', icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-gray-100' },
    ISSUED: {
      label: 'ออกแล้ว',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      color: 'bg-blue-100',
    },
    PARTIAL: {
      label: 'รับชำระบางส่วน',
      icon: <DollarSign className="h-3.5 w-3.5" />,
      color: 'bg-yellow-100',
    },
    PAID: {
      label: 'ชำระเต็มจำนวน',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      color: 'bg-green-100',
    },
    CANCELLED: { label: 'ยกเลิก', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-red-100' },
  };

  const counts = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(statusConfig).map(([status, config]) => ({
    id: `status_${status}`,
    label: config.label,
    icon: config.icon,
    count: counts[status] || 0,
    filter: () => true,
  }));
}

export function createOverduePresets<T extends { dueDate?: Date; status: string }>(
  items: T[]
): FilterPreset[] {
  const now = new Date();

  const overdue7 = items.filter(
    (i) => i.dueDate && i.dueDate < now && i.status !== 'PAID' && i.status !== 'CANCELLED'
  ).length;

  const overdue30 = items.filter(
    (i) =>
      i.dueDate &&
      i.dueDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) &&
      i.status !== 'PAID' &&
      i.status !== 'CANCELLED'
  ).length;

  return [
    {
      id: 'overdue_7',
      label: 'ค้างชำระ 7 วัน',
      icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
      count: overdue7,
      filter: () => true,
    },
    {
      id: 'overdue_30',
      label: 'ค้างชำระ 30 วัน',
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
      count: overdue30,
      filter: () => true,
    },
  ];
}

// Quick filter component for invoices
interface InvoiceQuickFiltersProps {
  onFilterChange: (filters: { dateRange?: string; status?: string; overdue?: boolean }) => void;
  className?: string;
}

export function InvoiceQuickFilters({ onFilterChange, className }: InvoiceQuickFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleClick = (filterId: string) => {
    const newFilter = activeFilter === filterId ? null : filterId;
    setActiveFilter(newFilter);

    // Parse filter ID and call onFilterChange
    if (newFilter?.startsWith('date_')) {
      onFilterChange({ dateRange: newFilter.replace('date_', '') });
    } else if (newFilter?.startsWith('status_')) {
      onFilterChange({ status: newFilter.replace('status_', '') });
    } else if (newFilter?.startsWith('overdue')) {
      onFilterChange({ overdue: true });
    } else {
      onFilterChange({});
    }
  };

  const filters = [
    { id: 'date_today', label: 'วันนี้', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'date_this_month', label: 'เดือนนี้', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { id: 'status_PENDING', label: 'รอชำระ', icon: <Clock className="h-3.5 w-3.5" /> },
    {
      id: 'overdue',
      label: 'ค้างชำระ',
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
    },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => handleClick(filter.id)}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
            activeFilter === filter.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-muted'
          )}
        >
          {filter.icon}
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
}

// Amount range filter preset
interface AmountRangePreset {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export const commonAmountRanges: AmountRangePreset[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'under_1k', label: 'ต่ำกว่า 1,000', max: 1000 },
  { id: '1k_to_10k', label: '1,000 - 10,000', min: 1000, max: 10000 },
  { id: '10k_to_50k', label: '10,000 - 50,000', min: 10000, max: 50000 },
  { id: 'over_50k', label: 'มากกว่า 50,000', min: 50000 },
];
