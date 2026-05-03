'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History, X, Clock, FileText, User, Package, Calculator, Landmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export interface RecentItem {
  id: string;
  module: string;
  recordId: string;
  recordType: string;
  recordName: string;
  action: 'view' | 'edit' | 'create';
  accessedAt: Date;
}

interface RecentItemsProps {
  items: RecentItem[];
  onItemClick: (item: RecentItem) => void;
  onClear: () => void;
  maxItems?: number;
  className?: string;
}

const moduleIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="h-4 w-4" />,
  customer: <User className="h-4 w-4" />,
  vendor: <User className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  journal: <Calculator className="h-4 w-4" />,
  banking: <Landmark className="h-4 w-4" />,
  default: <FileText className="h-4 w-4" />,
};

const moduleLabels: Record<string, string> = {
  invoice: 'ใบกำกับภาษี',
  customer: 'ลูกค้า',
  vendor: 'ผู้ขาย',
  product: 'สินค้า',
  journal: 'บันทึกบัญชี',
  banking: 'ธนาคาร',
  receipt: 'ใบเสร็จ',
  payment: 'ใบจ่ายเงิน',
};

export function RecentItemsList({
  items,
  onItemClick,
  onClear,
  maxItems = 10,
  className,
}: RecentItemsProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">ไม่มีรายการล่าสุด</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" />
          รายการล่าสุด
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="mr-1 h-3 w-3" />
          ล้าง
        </Button>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-1 pr-3">
          {displayItems.map((item) => {
            const icon = moduleIcons[item.module] || moduleIcons.default;
            const moduleLabel = moduleLabels[item.module] || item.module;

            return (
              <button
                key={`${item.module}-${item.recordId}`}
                onClick={() => onItemClick(item)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg p-2 text-left',
                  'group transition-colors hover:bg-muted'
                )}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted text-muted-foreground group-hover:bg-background">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.recordName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{moduleLabel}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.accessedAt), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Recent items sidebar component for main layout
interface RecentItemsSidebarProps {
  userId: string;
  onNavigate: (module: string, recordId: string) => void;
  className?: string;
}

export function RecentItemsSidebar({ userId, onNavigate, className }: RecentItemsSidebarProps) {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper: load recent items from API
  const loadRecentItems = async () => {
    try {
      const response = await fetch(`/api/user/recent-items`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        queueMicrotask(() =>
          setItems(
            data.items.map((item: RecentItem) => ({
              ...item,
              accessedAt: new Date(item.accessedAt),
            }))
          )
        );
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
    }
  };

  useEffect(() => {
    loadRecentItems();
  }, [userId]);

  const handleItemClick = (item: RecentItem) => {
    onNavigate(item.module, item.recordId);
  };

  const handleClear = async () => {
    try {
      await fetch(`/api/user/recent-items`, { credentials: 'include', method: 'DELETE' });
      setItems([]);
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  };

  if (items.length === 0) return null;

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
        className="flex w-full items-center justify-center p-2 hover:bg-muted"
        title={isExpanded ? 'ยุบ' : 'ขยาย'}
      >
        <History className="h-5 w-5" />
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
  );
}

// Hook for tracking recent items
export function useRecentItems(userId?: string) {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Helper: load recent items from API
  const loadRecentItems = async () => {
    try {
      const response = await fetch(`/api/user/recent-items`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        queueMicrotask(() =>
          setRecentItems(
            data.items.map((item: RecentItem) => ({
              ...item,
              accessedAt: new Date(item.accessedAt),
            }))
          )
        );
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadRecentItems();
    }
  }, [userId]);

  const recordAccess = useCallback(
    async (
      module: string,
      recordId: string,
      recordName: string,
      recordType: string,
      action: 'view' | 'edit' | 'create' = 'view'
    ) => {
      if (!userId) return;

      const newItem: RecentItem = {
        id: crypto.randomUUID(),
        module,
        recordId,
        recordName,
        recordType,
        action,
        accessedAt: new Date(),
      };

      // Update local state
      setRecentItems((prev) => {
        const filtered = prev.filter(
          (item) => !(item.module === module && item.recordId === recordId)
        );
        return [newItem, ...filtered].slice(0, 20);
      });

      // Send to server
      try {
        await fetch(`/api/user/recent-items`, {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module,
            recordId,
            recordName,
            recordType,
            action,
          }),
        });
      } catch (error) {
        console.error('Failed to record access:', error);
      }
    },
    [userId]
  );

  const clearRecentItems = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch(`/api/user/recent-items`, { credentials: 'include', method: 'DELETE' });
      setRecentItems([]);
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  }, [userId]);

  return {
    recentItems,
    recordAccess,
    clearRecentItems,
    refresh: loadRecentItems,
  };
}

// Quick access card component
interface QuickAccessCardProps {
  items: RecentItem[];
  onItemClick: (item: RecentItem) => void;
  className?: string;
}

export function QuickAccessCard({ items, onItemClick, className }: QuickAccessCardProps) {
  const displayItems = items.slice(0, 5);

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">เข้าถึงด่วน</h3>
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => {
          const icon = moduleIcons[item.module] || moduleIcons.default;

          return (
            <button
              key={`${item.module}-${item.recordId}`}
              onClick={() => onItemClick(item)}
              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-muted/80"
            >
              {icon}
              <span className="max-w-[120px] truncate">{item.recordName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
