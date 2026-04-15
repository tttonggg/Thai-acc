'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  Filter,
  X,
  Save,
  CalendarIcon,
  Search,
  Bookmark,
} from 'lucide-react'

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: unknown
  value2?: unknown // For between operator
}

export interface SavedFilterData {
  id: string
  name: string
  filters: FilterCondition[]
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  isDefault?: boolean
}

interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'dateRange'
  options?: { label: string; value: string }[]
}

interface AdvancedFilterProps {
  fields: FilterField[]
  activeFilters: FilterCondition[]
  savedFilters: SavedFilterData[]
  onFilterChange: (filters: FilterCondition[]) => void
  onSaveFilter: (name: string, filters: FilterCondition[]) => void
  onDeleteFilter: (id: string) => void
  onApplySavedFilter: (filter: SavedFilterData) => void
  className?: string
}

const operatorLabels: Record<FilterOperator, string> = {
  eq: 'เท่ากับ',
  ne: 'ไม่เท่ากับ',
  gt: 'มากกว่า',
  gte: 'มากกว่าหรือเท่ากับ',
  lt: 'น้อยกว่า',
  lte: 'น้อยกว่าหรือเท่ากับ',
  contains: 'มีคำว่า',
  startsWith: 'ขึ้นต้นด้วย',
  endsWith: 'ลงท้ายด้วย',
  in: 'อยู่ใน',
  between: 'ระหว่าง',
}

export function AdvancedFilter({
  fields,
  activeFilters,
  savedFilters,
  onFilterChange,
  onSaveFilter,
  onDeleteFilter,
  onApplySavedFilter,
  className,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [newFilter, setNewFilter] = useState<FilterCondition>({
    field: fields[0]?.key || '',
    operator: 'contains',
    value: '',
  })
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const handleAddFilter = () => {
    let value = newFilter.value
    if (newFilter.operator === 'between' && dateRange.from && dateRange.to) {
      value = dateRange.from.toISOString()
      newFilter.value2 = dateRange.to.toISOString()
    }

    const updatedFilters = [...activeFilters, { ...newFilter, value }]
    onFilterChange(updatedFilters)
    setNewFilter({ field: fields[0]?.key || '', operator: 'contains', value: '' })
    setDateRange({})
  }

  const handleRemoveFilter = (index: number) => {
    const updated = activeFilters.filter((_, i) => i !== index)
    onFilterChange(updated)
  }

  const handleClearAll = () => {
    onFilterChange([])
  }

  const handleSave = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName, activeFilters)
      setFilterName('')
      setSaveDialogOpen(false)
    }
  }

  const getFieldLabel = (key: string) => {
    return fields.find(f => f.key === key)?.label || key
  }

  const getFieldType = (key: string) => {
    return fields.find(f => f.key === key)?.type || 'text'
  }

  const getFieldOptions = (key: string) => {
    return fields.find(f => f.key === key)?.options || []
  }

  const renderFilterValue = (filter: FilterCondition) => {
    const fieldType = getFieldType(filter.field)

    if (fieldType === 'date' && typeof filter.value === 'string') {
      return format(parseISO(filter.value), 'dd/MM/yyyy', { locale: th })
    }

    if (fieldType === 'dateRange' && filter.operator === 'between') {
      const from = filter.value ? format(parseISO(filter.value as string), 'dd/MM/yyyy', { locale: th }) : ''
      const to = filter.value2 ? format(parseISO(filter.value2 as string), 'dd/MM/yyyy', { locale: th }) : ''
      return `${from} - ${to}`
    }

    if (fieldType === 'select') {
      const option = getFieldOptions(filter.field).find(o => o.value === filter.value)
      return option?.label || filter.value
    }

    return String(filter.value)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Active Filter Badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              <span className="font-medium">{getFieldLabel(filter.field)}</span>
              <span className="text-muted-foreground">{operatorLabels[filter.operator]}</span>
              <span>{renderFilterValue(filter)}</span>
              <button
                onClick={() => handleRemoveFilter(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-6 text-xs">
            ล้างทั้งหมด
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              กรอง
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">เพิ่มตัวกรอง</h4>

              <div className="space-y-2">
                <Label>ฟิลด์</Label>
                <Select
                  value={newFilter.field}
                  onValueChange={(v) => setNewFilter({ ...newFilter, field: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>เงื่อนไข</Label>
                <Select
                  value={newFilter.operator}
                  onValueChange={(v) => setNewFilter({ ...newFilter, operator: v as FilterOperator })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(operatorLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ค่า</Label>
                {getFieldType(newFilter.field) === 'select' ? (
                  <Select
                    value={String(newFilter.value)}
                    onValueChange={(v) => setNewFilter({ ...newFilter, value: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getFieldOptions(newFilter.field).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : getFieldType(newFilter.field) === 'date' || newFilter.operator === 'between' ? (
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'จาก'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))}
                          locale={th}
                        />
                      </PopoverContent>
                    </Popover>
                    {newFilter.operator === 'between' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'ถึง'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))}
                            locale={th}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ) : (
                  <Input
                    value={String(newFilter.value || '')}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                    placeholder="ค่าที่ต้องการกรอง"
                  />
                )}
              </div>

              <Button onClick={handleAddFilter} className="w-full">
                เพิ่มตัวกรอง
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Bookmark className="w-4 h-4" />
                ตัวกรองที่บันทึก
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">ตัวกรองที่บันทึกไว้</h4>
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted group"
                  >
                    <button
                      onClick={() => onApplySavedFilter(filter)}
                      className="flex-1 text-left"
                    >
                      <span className="text-sm">{filter.name}</span>
                      {filter.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs">ค่าเริ่มต้น</Badge>
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteFilter(filter.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            บันทึกตัวกรอง
          </Button>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกตัวกรอง</DialogTitle>
            <DialogDescription>
              ตั้งชื่อสำหรับตัวกรองนี้เพื่อใช้ในภายหลัง
            </DialogDescription>
          </DialogHeader>
          <Input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="ชื่อตัวกรอง เช่น ใบกำกับภาษีค้างชำระ"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Quick filter buttons component
interface QuickFilterButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
  icon?: React.ReactNode
}

export function QuickFilterButton({
  label,
  isActive,
  onClick,
  count,
  icon,
}: QuickFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted hover:bg-muted/80 text-muted-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-xs",
          isActive ? "bg-primary-foreground/20" : "bg-background"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
