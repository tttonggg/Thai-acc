'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InvoicePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function InvoicePagination({ pagination, onPageChange }: InvoicePaginationProps) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              className={
                p === page
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
