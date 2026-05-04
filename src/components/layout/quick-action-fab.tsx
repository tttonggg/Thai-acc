'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Receipt, FilePlus, BookOpen, X } from 'lucide-react';

interface QuickActionFabProps {
  onNavigate: (module: string) => void;
}

const actions = [
  { label: '+ ใบวางบิล', icon: FileText, module: 'invoices' },
  { label: '+ บันทึกรายจ่าย', icon: Receipt, module: 'payments' },
  { label: '+ บันทึกรายได้', icon: FilePlus, module: 'receipts' },
  { label: '+ บันทึกรายการ', icon: BookOpen, module: 'journal' },
];

export function QuickActionFab({ onNavigate }: QuickActionFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleAction = (module: string) => {
    setIsOpen(false);
    onNavigate(module);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB */}
      <div ref={fabRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Action list */}
        {isOpen && (
          <div className="flex flex-col gap-2">
            {actions.map(({ label, icon: Icon, module }) => (
              <button
                key={module}
                onClick={() => handleAction(module)}
                className="flex items-center gap-3 rounded-full bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-slate-700"
                style={{ minHeight: '44px' }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-95"
          aria-label={isOpen ? 'ปิด' : 'เปิดเมนูด่วน'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
