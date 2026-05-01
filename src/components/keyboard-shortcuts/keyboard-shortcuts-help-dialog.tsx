'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Keyboard,
  Command,
  Search,
  Save,
  ArrowUp,
  ArrowDown,
  FilePlus,
  Printer,
  X,
} from 'lucide-react';

export interface ShortcutCategory {
  name: string;
  shortcuts: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    description: string;
  }[];
}

interface KeyboardShortcutsHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: ShortcutCategory[];
}

const defaultCategories: ShortcutCategory[] = [
  {
    name: 'ทั่วไป',
    shortcuts: [
      { key: '?', description: 'แสดง/ซ่อนคีย์ลัด' },
      { key: 's', ctrl: true, description: 'บันทึก (Ctrl+S)' },
      { key: 'n', ctrl: true, description: 'สร้างใหม่ (Ctrl+N)' },
      { key: 'p', ctrl: true, description: 'พิมพ์ (Ctrl+P)' },
      { key: 'Escape', description: 'ปิด/ยกเลิก' },
    ],
  },
  {
    name: 'การนำทาง',
    shortcuts: [
      { key: '/', description: 'ค้นหา' },
      { key: 'k', description: 'เลือกรายการก่อนหน้า (Vim: k)' },
      { key: 'j', description: 'เลือกรายการถัดไป (Vim: j)' },
      { key: 'g', ctrl: true, description: 'ไปรายการแรก (Ctrl+G)' },
      { key: 'G', shift: true, description: 'ไปรายการสุดท้าย (Shift+G)' },
      { key: 'Enter', description: 'เปิด/เลือกรายการ' },
    ],
  },
  {
    name: 'ตาราง/รายการ',
    shortcuts: [
      { key: 'ArrowUp', description: 'เลื่อนขึ้น' },
      { key: 'ArrowDown', description: 'เลื่อนลง' },
      { key: 'Home', description: 'ไปรายการแรก' },
      { key: 'End', description: 'ไปรายการสุดท้าย' },
      { key: 'a', ctrl: true, description: 'เลือกทั้งหมด (Ctrl+A)' },
    ],
  },
];

function formatShortcut(shortcut: {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}) {
  const keys: string[] = [];
  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');
  if (shortcut.meta) keys.push('⌘');
  keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return keys.join(' + ');
}

export function KeyboardShortcutsHelpDialog({
  isOpen,
  onClose,
  categories = defaultCategories,
}: KeyboardShortcutsHelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            คีย์ลัดแป้นพิมพ์
          </DialogTitle>
          <DialogDescription>ใช้คีย์ลัดเหล่านี้เพื่อทำงานได้รวดเร็วขึ้น</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-6 p-6 pt-2">
            {categories.map((category) => (
              <div key={category.name}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="flex items-center gap-1">
                        {shortcut.ctrl && <Command className="h-3 w-3" />}
                        {formatShortcut(shortcut)
                          .split(' + ')
                          .map((key, i, arr) => (
                            <span key={i} className="flex items-center">
                              <span className="rounded border bg-muted px-2 py-1 font-mono text-xs shadow-sm">
                                {key === 'Ctrl' && <Command className="inline h-3 w-3" />}
                                {key === '⌘' ? '⌘' : key}
                              </span>
                              {i < arr.length - 1 && (
                                <span className="mx-1 text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-6 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              กด <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">?</kbd>{' '}
              เพื่อแสดง/ซ่อนหน้าต่างนี้
            </p>
            <Button onClick={onClose} size="sm">
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick reference badge for toolbar
interface KeyboardShortcutBadgeProps {
  shortcut: string;
  className?: string;
}

export function KeyboardShortcutBadge({ shortcut, className }: KeyboardShortcutBadgeProps) {
  return (
    <kbd
      className={cn(
        'hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex',
        className
      )}
    >
      {shortcut}
    </kbd>
  );
}

// Shortcut hint component for buttons
interface ShortcutHintProps {
  shortcut: string;
  children: React.ReactNode;
}

export function ShortcutHint({ shortcut, children }: ShortcutHintProps) {
  return (
    <span className="flex items-center gap-2">
      {children}
      <KeyboardShortcutBadge shortcut={shortcut} />
    </span>
  );
}
