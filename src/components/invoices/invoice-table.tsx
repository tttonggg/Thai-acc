'use client';

import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Eye,
  Edit,
  Printer,
  Download,
  Loader2,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvoiceEditDialog } from '@/components/invoices/invoice-edit-dialog';

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount?: number;
  status: string;
  type: string;
  _count?: {
    comments: number;
  };
  customer?: {
    name?: string;
    address?: string;
    subDistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    taxId?: string;
    phone?: string;
    email?: string;
  };
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewDetail: (invoiceId: string) => void;
  onView: (invoiceId: string) => void;
  onEdit: (invoiceId: string) => void;
  onPrint: (invoiceId: string) => void;
  onDownload: (invoiceId: string, invoiceNo: string) => void;
  onPost: (invoiceId: string, e: React.MouseEvent) => void;
  printingInvoice: string | null;
  downloadingInvoice: string | null;
  postingInvoice: string | null;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'ร่าง',
  ISSUED: 'ออกแล้ว',
  PARTIAL: 'รับชำระบางส่วน',
  PAID: 'รับชำระเต็มจำนวน',
  CANCELLED: 'ยกเลิก',
};

const statusPillClass: Record<string, string> = {
  DRAFT: 'bg-slate-700/50 text-slate-400',
  ISSUED: 'bg-indigo-500/15 text-indigo-400',
  PARTIAL: 'bg-cyan-500/15 text-cyan-400',
  PAID: 'bg-teal-500/15 text-teal-400',
  CANCELLED: 'bg-slate-700/50 text-slate-500',
};

const typeLabels: Record<string, string> = {
  TAX_INVOICE: 'ใบกำกับภาษี',
  RECEIPT: 'ใบเสร็จรับเงิน',
  DELIVERY_NOTE: 'ใบส่งของ',
  CREDIT_NOTE: 'ใบลดหนี้',
  DEBIT_NOTE: 'ใบเพิ่มหนี้',
};

function getStatusBadge(status: string) {
  const cls = statusPillClass[status] ?? 'bg-slate-700/50 text-slate-400';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function getAgingBadge(invoice: Invoice) {
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') {
    return null;
  }
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { label: `เกิน ${diffDays} วัน`, cls: 'bg-red-500/15 text-red-400' };
  }
  if (diffDays >= -7) {
    return { label: 'ใกล้ครบกำหนด', cls: 'bg-amber-500/15 text-amber-400' };
  }
  return null;
}

export function InvoiceTable({
  invoices,
  onViewDetail,
  onView,
  onEdit,
  onPrint,
  onDownload,
  onPost,
  printingInvoice,
  downloadingInvoice,
  postingInvoice,
}: InvoiceTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const virtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleEditClick = (invoiceId: string) => {
    setEditInvoiceId(invoiceId);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
            <div className="col-span-2">เลขที่</div>
            <div className="col-span-2">วันที่</div>
            <div className="col-span-1">ประเภท</div>
            <div className="col-span-2">ลูกค้า</div>
            <div className="col-span-1 text-right">ยอดค้างรับ</div>
            <div className="col-span-1 text-right">ยอดรวม</div>
            <div className="col-span-1">สถานะ</div>
            <div className="col-span-1 text-center">คอมเมนต์</div>
            <div className="col-span-1 text-center">จัดการ</div>
          </div>
        </div>

        {/* Virtualized Body */}
        <ScrollArea className="w-full" style={{ height: '400px' }} ref={parentRef}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const invoice = invoices[virtualRow.index];
              const outstanding = Math.max(
                0,
                (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0)
              );
              const agingBadge = getAgingBadge(invoice);

              return (
                <div
                  key={invoice.id}
                  className="absolute left-0 top-0 w-full"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="grid grid-cols-12 items-center gap-2 border-t border-slate-700/50 px-4 py-2 transition-colors hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => onViewDetail(invoice.id)}
                  >
                    {/* เลขที่ */}
                    <div className="col-span-2 font-mono text-xs text-slate-200">
                      {invoice.invoiceNo}
                    </div>

                    {/* วันที่ */}
                    <div className="col-span-2 text-sm text-slate-300">
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString('th-TH')
                        : '-'}
                    </div>

                    {/* ประเภท */}
                    <div className="col-span-1">
                      <span className="inline-flex items-center rounded border border-slate-600/50 bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-300">
                        {typeLabels[invoice.type]}
                      </span>
                    </div>

                    {/* ลูกค้า */}
                    <div className="col-span-2 text-sm text-slate-200 truncate">
                      {invoice.customerName}
                    </div>

                    {/* ยอดค้างรับ */}
                    <div className="col-span-1 text-right">
                      <span
                        className={
                          outstanding > 0 ? 'font-semibold text-red-400' : 'text-teal-400'
                        }
                      >
                        ฿
                        {outstanding.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {/* ยอดรวม */}
                    <div className="col-span-1 text-right font-semibold text-slate-200">
                      ฿
                      {(invoice.totalAmount ?? 0).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>

                    {/* สถานะ */}
                    <div className="col-span-1">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(invoice.status)}
                        {agingBadge && (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${agingBadge.cls}`}
                          >
                            {agingBadge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* คอมเมนต์ */}
                    <div className="col-span-1 text-center">
                      {invoice._count?.comments ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
                          <MessageSquare className="h-3 w-3" />
                          {invoice._count.comments}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">-</span>
                      )}
                    </div>

                    {/* จัดการ */}
                    <div className="col-span-1">
                      <div className="flex flex-wrap justify-center gap-1">
                        {invoice.status === 'DRAFT' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-indigo-600 px-2 text-white hover:bg-indigo-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPost(invoice.id, e);
                            }}
                            disabled={postingInvoice === invoice.id}
                          >
                            {postingInvoice === invoice.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-3 w-3" />
                            )}
                            ออก
                          </Button>
                        )}
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(invoice.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(invoice.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-teal-500/10 hover:text-teal-400 disabled:opacity-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(invoice.id);
                          }}
                          disabled={printingInvoice === invoice.id}
                        >
                          {printingInvoice === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-purple-500/10 hover:text-purple-400 disabled:opacity-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(invoice.id, invoice.invoiceNo);
                          }}
                          disabled={downloadingInvoice === invoice.id}
                        >
                          {downloadingInvoice === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {editInvoiceId && (
        <InvoiceEditDialog
          invoiceId={editInvoiceId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            setEditInvoiceId(null);
          }}
        />
      )}
    </div>
  );
}
