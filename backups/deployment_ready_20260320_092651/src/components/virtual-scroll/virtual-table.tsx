'use client'

import { useRef, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  width?: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row: T) => React.ReactNode
}

interface VirtualTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  rowHeight?: number
  headerHeight?: number
  maxHeight?: number
  selectable?: boolean
  selectedIds?: string[]
  onSelect?: (ids: string[]) => void
  onRowClick?: (row: T) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  emptyMessage?: string
  className?: string
  overscan?: number
}

export function VirtualTable<T>({
  data,
  columns,
  keyExtractor,
  rowHeight = 48,
  headerHeight = 48,
  maxHeight = 600,
  selectable = false,
  selectedIds = [],
  onSelect,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'ไม่พบข้อมูล',
  className,
  overscan = 5,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const allSelected = data.length > 0 && data.every(row => selectedIds.includes(keyExtractor(row)))
  const someSelected = selectedIds.length > 0 && !allSelected

  const handleSelectAll = useCallback(() => {
    if (!onSelect) return
    if (allSelected) {
      onSelect([])
    } else {
      onSelect(data.map(row => keyExtractor(row)))
    }
  }, [allSelected, data, keyExtractor, onSelect])

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (!onSelect) return
    if (checked) {
      onSelect([...selectedIds, id])
    } else {
      onSelect(selectedIds.filter(sid => sid !== id))
    }
  }, [onSelect, selectedIds])

  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable || !onSort) return
    const newDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key, newDirection)
  }, [onSort, sortKey, sortDirection])

  const virtualRows = virtualizer.getVirtualItems()

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 border rounded-lg bg-muted/50", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto border rounded-lg", className)}
      style={{ maxHeight }}
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex bg-muted border-b font-medium text-sm"
          style={{ height: headerHeight }}
        >
          {selectable && (
            <div className="flex items-center justify-center px-4 border-r bg-muted" style={{ width: 48 }}>
              <Checkbox
                checked={allSelected}
                data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                onCheckedChange={handleSelectAll}
                aria-label="เลือกทั้งหมด"
              />
            </div>
          )}
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center px-4 border-r last:border-r-0 bg-muted cursor-pointer hover:bg-muted/80 transition-colors",
                column.sortable && "cursor-pointer select-none"
              )}
              style={{
                width: column.width || 150,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start',
              }}
              onClick={() => handleSort(column)}
            >
              <span className="truncate">{column.header}</span>
              {column.sortable && (
                <span className="ml-2">
                  {sortKey === column.key ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Virtual Rows */}
        {virtualRows.map((virtualRow) => {
          const row = data[virtualRow.index]
          const rowId = keyExtractor(row)
          const isSelected = selectedIds.includes(rowId)
          const isHovered = hoveredRow === rowId

          return (
            <div
              key={rowId}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={cn(
                "flex absolute left-0 w-full border-b last:border-b-0 transition-colors",
                isSelected && "bg-primary/10",
                isHovered && !isSelected && "bg-muted/50",
                onRowClick && "cursor-pointer"
              )}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onMouseEnter={() => setHoveredRow(rowId)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <div
                  className="flex items-center justify-center px-4 border-r"
                  style={{ width: 48 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                    aria-label={`เลือกแถว ${virtualRow.index + 1}`}
                  />
                </div>
              )}
              {columns.map((column) => {
                const value = (row as Record<string, unknown>)[column.key]
                return (
                  <div
                    key={column.key}
                    className={cn(
                      "flex items-center px-4 border-r last:border-r-0 overflow-hidden",
                      column.align === 'center' && "justify-center",
                      column.align === 'right' && "justify-end"
                    )}
                    style={{
                      width: column.width || 150,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                  >
                    <span className="truncate">
                      {column.formatter
                        ? column.formatter(value, row)
                        : value as React.ReactNode}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Hook for using virtual scroll with large lists
export function useVirtualList<T>(items: T[], options?: { overscan?: number }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: options?.overscan ?? 5,
  })

  return {
    parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  }
}

export type { Column as VirtualTableColumn }
