'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Trash2,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  FileOutput,
  Printer,
} from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  allSelected?: boolean;
  className?: string;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  actions,
  onSelectAll,
  onClearSelection,
  allSelected = false,
  className,
}: BulkActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
    } else {
      // Get selected IDs from context/parent
      action.onClick([]);
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.onClick([]);
      setConfirmAction(null);
    }
  };

  if (selectedCount === 0) {
    return (
      <div className={cn('flex items-center justify-between py-2', className)}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll} className="text-xs">
            เลือกทั้งหมด ({totalCount})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border bg-primary/5 px-3 py-2 animate-in fade-in slide-in-from-top-2',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">เลือกแล้ว {selectedCount} รายการ</span>
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-7 text-xs">
            ยกเลิกการเลือก
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {actions.slice(0, 3).map((action) => (
            <Button
              key={action.id}
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => handleActionClick(action)}
              className="h-8 text-xs"
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </Button>
          ))}

          {actions.length > 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.slice(3).map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmationTitle || 'ยืนยันการดำเนินการ'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationMessage ||
                `คุณแน่ใจหรือไม่ที่จะดำเนินการนี้กับ ${selectedCount} รายการที่เลือก?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                confirmAction?.variant === 'destructive' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Pre-defined common bulk actions
export const createCommonBulkActions = (handlers: {
  onDelete?: (ids: string[]) => void;
  onExport?: (ids: string[]) => void;
  onPrint?: (ids: string[]) => void;
  onStatusChange?: (ids: string[], status: string) => void;
}): BulkAction[] => {
  const actions: BulkAction[] = [];

  if (handlers.onStatusChange) {
    actions.push({
      id: 'approve',
      label: 'อนุมัติ',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (ids) => handlers.onStatusChange?.(ids, 'approved'),
    });
    actions.push({
      id: 'reject',
      label: 'ไม่อนุมัติ',
      icon: <XCircle className="h-4 w-4" />,
      onClick: (ids) => handlers.onStatusChange?.(ids, 'rejected'),
    });
  }

  if (handlers.onExport) {
    actions.push({
      id: 'export',
      label: 'ส่งออก Excel',
      icon: <FileOutput className="h-4 w-4" />,
      onClick: handlers.onExport,
    });
  }

  if (handlers.onPrint) {
    actions.push({
      id: 'print',
      label: 'พิมพ์',
      icon: <Printer className="h-4 w-4" />,
      onClick: handlers.onPrint,
    });
  }

  if (handlers.onDelete) {
    actions.push({
      id: 'delete',
      label: 'ลบ',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: handlers.onDelete,
      requiresConfirmation: true,
      confirmationTitle: 'ยืนยันการลบ',
      confirmationMessage: `คุณแน่ใจหรือไม่ที่จะลบรายการที่เลือก? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
    });
  }

  return actions;
};

// Hook for managing bulk selection
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (idOrIds: string | string[]) => {
    if (Array.isArray(idOrIds)) {
      // When passed as onSelect(ids: string[]), treat as explicit selection
      setSelectedIds(idOrIds);
    } else {
      // Single toggle
      setSelectedIds((prev) =>
        prev.includes(idOrIds) ? prev.filter((sid) => sid !== idOrIds) : [...prev, idOrIds]
      );
    }
  };

  const selectAll = () => {
    setSelectedIds(items.map((item) => item.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => selectedIds.includes(id);
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return {
    selectedIds,
    selectedItems: items.filter((item) => selectedIds.includes(item.id)),
    selectedCount: selectedIds.length,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    setSelectedIds,
  };
}
