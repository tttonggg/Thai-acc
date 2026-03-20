'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Plus, Settings, LayoutGrid } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface DashboardWidget {
  id: string
  type: string
  title: string
  config?: Record<string, unknown>
  size: 'small' | 'medium' | 'large' | 'full'
}

interface SortableWidgetProps {
  widget: DashboardWidget
  onRemove: (id: string) => void
  renderWidget: (widget: DashboardWidget) => React.ReactNode
  isEditMode: boolean
}

function SortableWidget({
  widget,
  onRemove,
  renderWidget,
  isEditMode,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
    full: 'col-span-full',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(sizeClasses[widget.size], isDragging && 'opacity-50')}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                {...attributes}
                {...listeners}
                className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => onRemove(widget.id)}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {renderWidget(widget)}
        </CardContent>
      </Card>
    </div>
  )
}

interface DashboardCustomizerProps {
  widgets: DashboardWidget[]
  availableWidgets: Omit<DashboardWidget, 'id'>[]
  onWidgetsChange: (widgets: DashboardWidget[]) => void
  onSave: (widgets: DashboardWidget[]) => void
  renderWidget: (widget: DashboardWidget) => React.ReactNode
  className?: string
}

export function DashboardCustomizer({
  widgets,
  availableWidgets,
  onWidgetsChange,
  onSave,
  renderWidget,
  className,
}: DashboardCustomizerProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [localWidgets, setLocalWidgets] = useState(widgets)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        setLocalWidgets((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over.id)
          const newWidgets = arrayMove(items, oldIndex, newIndex)
          onWidgetsChange(newWidgets)
          return newWidgets
        })
      }
    },
    [onWidgetsChange]
  )

  const handleRemove = useCallback(
    (id: string) => {
      const newWidgets = localWidgets.filter((w) => w.id !== id)
      setLocalWidgets(newWidgets)
      onWidgetsChange(newWidgets)
    },
    [localWidgets, onWidgetsChange]
  )

  const handleAddWidget = useCallback(
    (widget: Omit<DashboardWidget, 'id'>) => {
      const newWidget: DashboardWidget = {
        ...widget,
        id: crypto.randomUUID(),
      }
      const newWidgets = [...localWidgets, newWidget]
      setLocalWidgets(newWidgets)
      onWidgetsChange(newWidgets)
      setIsAddDialogOpen(false)
    },
    [localWidgets, onWidgetsChange]
  )

  const handleSave = () => {
    onSave(localWidgets)
    setIsEditMode(false)
  }

  const handleCancel = () => {
    setLocalWidgets(widgets)
    setIsEditMode(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          แดชบอร์ด
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                ยกเลิก
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มวิดเจ็ต
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มวิดเจ็ต</DialogTitle>
                    <DialogDescription>
                      เลือกวิดเจ็ตที่ต้องการเพิ่มลงแดชบอร์ด
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {availableWidgets.map((widget, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddWidget(widget)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted text-left transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <LayoutGrid className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{widget.title}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            ขนาด: {widget.size}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={handleSave}>
                บันทึก
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
            >
              <Settings className="w-4 h-4 mr-1" />
              ปรับแต่ง
            </Button>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {localWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemove}
                renderWidget={renderWidget}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {localWidgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">แดชบอร์ดว่างเปล่า</p>
          {!isEditMode && (
            <Button onClick={() => setIsEditMode(true)}>
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มวิดเจ็ต
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Preset widget configurations
export const presetWidgets = {
  revenue: {
    type: 'revenue-chart',
    title: 'รายได้',
    size: 'large' as const,
  },
  expenses: {
    type: 'expenses-chart',
    title: 'ค่าใช้จ่าย',
    size: 'medium' as const,
  },
  invoices: {
    type: 'invoices-summary',
    title: 'ใบกำกับภาษี',
    size: 'medium' as const,
  },
  bankBalance: {
    type: 'bank-balance',
    title: 'ยอดเงินในธนาคาร',
    size: 'small' as const,
  },
  overdueInvoices: {
    type: 'overdue-invoices',
    title: 'ใบกำกับภาษีค้างชำระ',
    size: 'small' as const,
  },
  recentActivity: {
    type: 'recent-activity',
    title: 'กิจกรรมล่าสุด',
    size: 'medium' as const,
  },
  quickActions: {
    type: 'quick-actions',
    title: 'ทำงานด่วน',
    size: 'small' as const,
  },
  taxSummary: {
    type: 'tax-summary',
    title: 'สรุปภาษี',
    size: 'small' as const,
  },
}

// Default dashboard layout
export const defaultDashboardLayout: DashboardWidget[] = [
  { id: '1', ...presetWidgets.revenue },
  { id: '2', ...presetWidgets.invoices },
  { id: '3', ...presetWidgets.bankBalance },
  { id: '4', ...presetWidgets.overdueInvoices },
  { id: '5', ...presetWidgets.recentActivity },
]
