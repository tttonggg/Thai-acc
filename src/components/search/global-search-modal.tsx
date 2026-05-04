'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, Users, Package, Truck, Receipt, BookOpen, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { satangToBaht } from '@/lib/currency';
interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: string;
  icon: React.ElementType;
  onClick: () => void;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  customers: { label: 'ลูกค้า', icon: Users },
  vendors: { label: 'ผู้จำหน่าย', icon: Truck },
  products: { label: 'สินค้า/บริการ', icon: Package },
  invoices: { label: 'ใบวางบิล', icon: FileText },
  receipts: { label: 'ใบเสร็จ', icon: Receipt },
  payments: { label: 'ใบจ่ายเงิน', icon: Receipt },
  journalEntries: { label: 'รายการบัญชี', icon: BookOpen },
};

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (module: string, id?: string) => void;
}

export function GlobalSearchModal({ open, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.results) {
          const mapped: SearchResult[] = [];
          const { customers, vendors, products, invoices, receipts, payments, journalEntries } = json.results;

          customers?.forEach((c: { id: string; name: string; code: string; email?: string }) =>
            mapped.push({ id: c.id, label: c.name, sublabel: c.code, type: 'customers', icon: Users, onClick: () => { onClose(); onNavigate('customers'); } })
          );
          vendors?.forEach((v: { id: string; name: string; code: string; email?: string }) =>
            mapped.push({ id: v.id, label: v.name, sublabel: v.code, type: 'vendors', icon: Truck, onClick: () => { onClose(); onNavigate('vendors'); } })
          );
          products?.forEach((p: { id: string; name: string; code: string; unit?: string }) =>
            mapped.push({ id: p.id, label: p.name, sublabel: p.code, type: 'products', icon: Package, onClick: () => { onClose(); onNavigate('products'); } })
          );
          invoices?.forEach((i: { id: string; invoiceNo: string; customerName: string; totalAmount: number; status: string }) =>
            mapped.push({
              id: i.id, label: i.invoiceNo, sublabel: `${i.customerName} · ฿${(i.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
              type: 'invoices', icon: FileText,
              onClick: () => { onClose(); onNavigate('invoice-detail', i.id); }
            })
          );
          receipts?.forEach((r: { id: string; receiptNo: string; customerName: string; amount: number }) =>
            mapped.push({
              id: r.id, label: r.receiptNo, sublabel: `${r.customerName} · ฿${(r.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
              type: 'receipts', icon: Receipt,
              onClick: () => { onClose(); onNavigate('receipts'); }
            })
          );
          payments?.forEach((p: { id: string; paymentNo: string; vendorName: string; amount: number }) =>
            mapped.push({
              id: p.id, label: p.paymentNo, sublabel: `${p.vendorName} · ฿${(p.amount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
              type: 'payments', icon: Receipt,
              onClick: () => { onClose(); onNavigate('payments'); }
            })
          );
          journalEntries?.forEach((j: { id: string; documentNumber: string; description: string }) =>
            mapped.push({ id: j.id, label: j.documentNumber, sublabel: j.description, type: 'journalEntries', icon: BookOpen, onClick: () => { onClose(); onNavigate('journal'); } })
          );
          setResults(mapped);
          setSelectedIndex(0);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, onClose, onNavigate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].onClick();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, onClose]);

  if (!open) return null;

  // Group results by type
  const grouped: Record<string, SearchResult[]> = {};
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
          <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหา... (Ctrl+K)"
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
          />
          {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />}
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-700">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-500">ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;</div>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            const config = typeConfig[type];
            if (!config) return null;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 px-4 py-2">
                  <config.icon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase">{config.label}</span>
                </div>
                {items.map((item, i) => {
                  const globalIndex = results.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        globalIndex === selectedIndex ? 'bg-indigo-600/20' : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{item.label}</div>
                        {item.sublabel && <div className="truncate text-xs text-slate-500">{item.sublabel}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
          <span>↑↓ เลื่อน</span>
          <span>Enter เลือก</span>
          <span>Esc ปิด</span>
        </div>
      </div>
    </div>
  );
}
