'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type QuickFilter = 'all' | 'pending' | 'overdue' | 'done';

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (value: QuickFilter) => void;
}

const quickFilters: { value: QuickFilter; label: string; activeClass: string }[] = [
  {
    value: 'all',
    label: 'ทั้งหมด',
    activeClass: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700',
  },
  {
    value: 'pending',
    label: 'รอดำเนินการ',
    activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30',
  },
  {
    value: 'overdue',
    label: 'เร่งด่วน',
    activeClass: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30',
  },
  {
    value: 'done',
    label: 'เสร็จสิ้น',
    activeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/40 hover:bg-teal-500/30',
  },
];

export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  quickFilter,
  onQuickFilterChange,
}: InvoiceFiltersProps) {
  return (
    <>
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((qf) => (
          <button
            key={qf.value}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              quickFilter === qf.value
                ? qf.activeClass
                : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
            onClick={() => onQuickFilterChange(qf.value)}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="ค้นหาตามชื่อลูกค้าหรือเลขที่เอกสาร..."
              className="border-slate-700 bg-slate-900/60 pl-10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full border-slate-700 bg-slate-900/60 text-slate-200 focus:ring-indigo-500/50 md:w-[200px]">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-slate-200">
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="DRAFT">ร่าง</SelectItem>
              <SelectItem value="ISSUED">ออกแล้ว</SelectItem>
              <SelectItem value="PARTIAL">รับชำระบางส่วน</SelectItem>
              <SelectItem value="PAID">รับชำระเต็มจำนวน</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
