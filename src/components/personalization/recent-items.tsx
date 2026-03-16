'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { History, X, Clock, FileText, User, Package, Calculator, Landmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export interface RecentItem {
  id: string
  module: string
  recordId: string
  recordType: string
  recordName: string
  action: 'view' | 'edit' | 'create'
  accessedAt: Date
}

interface RecentItemsProps {
  items: RecentItem[]
  onItemClick: (item: RecentItem) => void
  onClear: () => void
  maxItems?: number
  className?: string
}

const moduleIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4" />,
  customer: <User className="w-4 h-4" />,
  vendor: <User className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  journal: <Calculator className="w-4 h-4" />,
  banking: <Landmark className="w-4 h-4" />,
  default: <FileText className="w-4 h-4" />,
}

const moduleLabels: Record<string, string> = {
  invoice: 'ใบกำกับภาษี',
  customer: 'ลูกค้า',
  vendor: 'ผู้ขาย',
  product: 'สินค้า',
  journal: 'บันทึกบัญชี',
  banking: 'ธนาคาร',
  receipt: 'ใบเสร็จ',
  payment: 'ใบจ่ายเงิน',
}

export function RecentItemsList({
  items,
  onItemClick,
  onClear,
  maxItems = 10,
  className,
}: RecentItemsProps) {
  const displayItems = items.slice(0, maxItems)

  if (displayItems.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">ไม่มีรายการล่าสุด</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          รายการล่าสุด
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3 mr-1" />
          ล้าง
        </Button>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-1 pr-3">
          {displayItems.map((item) => {
            const icon = moduleIcons[item.module] || moduleIcons.default
            const moduleLabel = moduleLabels[item.module] || item.module

            return (
              <button
                key={`${item.module}-${item.recordId}`}
                onClick={() => onItemClick(item)}
                className={cn(
                  'w-full flex items-start gap-3 p-2 rounded-lg text-left',
                  'hover:bg-muted transition-colors group'
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground group-hover:bg-background">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.recordName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{moduleLabel}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(item.accessedAt), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// Recent items sidebar component for main layout
interface RecentItemsSidebarProps {
  userId: string
  onNavigate: (module: string, recordId: string) => void
  className?: string
}

export function RecentItemsSidebar({
  userId,
  onNavigate,
  className,
}: RecentItemsSidebarProps) {
  const [items, setItems] = useState<RecentItem[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    loadRecentItems()
  }, [userId])

  const loadRecentItems = async () => {
    try {
      const response = await fetch('/api/user/recent-items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items.map((item: RecentItem) => ({
          ...item,
          accessedAt: new Date(item.accessedAt),
        })))
      }
    } catch (error) {
      console.error('Failed to load recent items:', error)
    }
  }

  const handleItemClick = (item: RecentItem) => {
    onNavigate(item.module, item.recordId)
    // Update accessed time
    recordAccess(item.module, item.recordId, item.recordName, item.recordType, 'view')
  }

  const handleClear = async () => {
    try {
      await fetch('/api/user/recent-items', { method: 'DELETE' })
      setItems([])
    } catch (error) {
      console.error('Failed to clear recent items:', error)
    }
  }

  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'border-l bg-muted/30 transition-all duration-300',
        isExpanded ? 'w-64' : 'w-10',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 flex items-center justify-center hover:bg-muted"
        title={isExpanded ? 'ยุบ' : 'ขยาย'}
      >
        <History className="w-5 h-5" />
      </button>

      {isExpanded && (
        <div className="p-3">
          <RecentItemsList
            items={items}
            onItemClick={handleItemClick}
            onClear={handleClear}
            maxItems={10}
          />
        </div>
      )}
    </div>
  )
}

// Hook for tracking recent items
export function useRecentItems(userId?: string) {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  useEffect(() => {
    if (userId) {
      loadRecentItems()
    }
  }, [userId])

  const loadRecentItems = async () => {
    try {
      const response = await fetch('/api/user/recent-items')
      if (response.ok) {
        const data = await response.json()
        setRecentItems(data.items.map((item: RecentItem) => ({
          ...item,
          accessedAt: new Date(item.accessedAt),
        })))
      }
    } catch (error) {
      console.error('Failed to load recent items:', error)
    }
  }

  const recordAccess = useCallback(
    async (
      module: string,
      recordId: string,
      recordName: string,
      recordType: string,
      action: 'view' | 'edit' | 'create' = 'view'
    ) => {
      if (!userId) return

      const newItem: RecentItem = {
        id: crypto.randomUUID(),
        module,
        recordId,
        recordName,
        recordType,
        action,
        accessedAt: new Date(),
      }

      // Update local state
      setRecentItems((prev) => {
        const filtered = prev.filter(
          (item) => !(item.module === module && item.recordId === recordId)
        )
        return [newItem, ...filtered].slice(0, 20)
      })

      // Send to server
      try {
        await fetch('/api/user/recent-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module,
            recordId,
            recordName,
            recordType,
            action,
          }),
        })
      } catch (error) {
        console.error('Failed to record access:', error)
      }
    },
    [userId]
  )

  const clearRecentItems = useCallback(async () => {
    if (!userId) return

    try {
      await fetch('/api/user/recent-items', { method: 'DELETE' })
      setRecentItems([])
    } catch (error) {
      console.error('Failed to clear recent items:', error)
    }
  }, [userId])

  return {
    recentItems,
    recordAccess,
    clearRecentItems,
    refresh: loadRecentItems,
  }
}

// Quick access card component
interface QuickAccessCardProps {
  items: RecentItem[]
  onItemClick: (item: RecentItem) => void
  className?: string
}

export function QuickAccessCard({ items, onItemClick, className }: QuickAccessCardProps) {
  const displayItems = items.slice(0, 5)

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">เข้าถึงด่วน</h3>
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => {
          const icon = moduleIcons[item.module] || moduleIcons.default

          return (
            <button
              key={`${item.module}-${item.recordId}`}
              onClick={() => onItemClick(item)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
            >
              {icon}
              <span className="truncate max-w-[120px]">{item.recordName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
