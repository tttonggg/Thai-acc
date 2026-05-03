'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
} from 'lucide-react';
import { eventBus, EVENTS } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { InvoicePagination } from '@/components/invoices/invoice-pagination';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  date?: string;
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
  lines?: any[];
}

type QuickFilter = 'all' | 'pending' | 'overdue' | 'done';

export function InvoiceList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [invoiceFormType, setInvoiceFormType] = useState<
    'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  >('TAX_INVOICE');
  const [refreshKey, setRefreshKey] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<string | null>(null);
  const [postingInvoice, setPostingInvoice] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.page));
        params.set('limit', String(pagination.limit));
        if (filterStatus !== 'all') params.set('status', filterStatus);
        if (searchTerm) params.set('search', searchTerm);

        const res = await fetch(`/api/invoices?${params.toString()}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Fetch failed');
        const result = await res.json();
        const invoicesData = result.data || [];
        if (!Array.isArray(invoicesData)) {
          throw new Error('Invalid invoices data format');
        }
        setInvoices(invoicesData);
        if (result.pagination) {
          setPagination(prev => ({ ...prev, ...result.pagination }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล';
        setError(message);
        toast({
          title: 'ข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [refreshKey, pagination.page, pagination.limit, filterStatus, searchTerm, toast]);

  const filteredInvoices = (invoices || []).filter((invoice) => {
    if (!invoice || typeof invoice !== 'object') return false;

    const allowedTypes = ['TAX_INVOICE', 'RECEIPT', 'DELIVERY_NOTE'];
    if (!allowedTypes.includes(invoice.type)) return false;

    const matchesSearch =
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (quickFilter !== 'all') {
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = dueDate
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : -999;
      const aging = diffDays;
      if (quickFilter === 'pending') {
        if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false;
      } else if (quickFilter === 'overdue') {
        if (aging <= 0 && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') return false;
      } else if (quickFilter === 'done') {
        if (invoice.status !== 'PAID') return false;
      }
    }

    return matchesSearch;
  });

  const handleInvoiceSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddDialogOpen(false);
    eventBus.emit(EVENTS.INVOICE_CREATED);
  };

  const openInvoiceForm = (
    type: 'TAX_INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  ) => {
    setInvoiceFormType(type);
    setIsAddDialogOpen(true);
  };

  const handleViewDetail = (invoiceId: string) => {
    eventBus.emit(EVENTS.INVOICE_VIEW_DETAIL, invoiceId);
  };

  const handleView = (invoiceId: string) => {
    handlePrintInvoice(invoiceId, false);
  };

  const handlePrint = async (invoiceId: string) => {
    handlePrintInvoice(invoiceId, true);
  };

  const handlePostInvoice = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm('ต้องการออกใบกำกับภาษีฉบับนี้หรือไม่? การดำเนินการนี้จะสร้างรายการบัญชีโดยอัตโนมัติ')
    )
      return;
    setPostingInvoice(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': '' },
        body: JSON.stringify({ action: 'post' }),
      });
      if (!res.ok) throw new Error('Post failed');
      toast({ title: 'ออกใบกำกับภาษีสำเร็จ', description: 'เอกสารถูกออกเรียบร้อยแล้ว' });
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถออกใบกำกับภาษีได้',
        variant: 'destructive',
      });
    } finally {
      setPostingInvoice(null);
    }
  };

  const handlePrintInvoice = async (invoiceId: string, autoPrint: boolean = true) => {
    setPrintingInvoice(invoiceId);
    try {
      const [invoiceRes, companyRes] = await Promise.all([
        fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' }),
        fetch(`/api/company`, { credentials: 'include' }),
      ]);

      if (!invoiceRes.ok) throw new Error('Fetch failed');
      const result = await invoiceRes.json();
      const invoice = result.data;

      interface CompanyInfo {
        name?: string;
        address?: string;
        subDistrict?: string;
        district?: string;
        province?: string;
        postalCode?: string;
        taxId?: string;
        phone?: string;
        email?: string;
        logo?: string;
      }
      let company: CompanyInfo | null = null;
      if (companyRes.ok) {
        const companyResult = await companyRes.json();
        company = companyResult.data;
      }

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'ไม่สามารถเปิดหน้าต่างได้',
          description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
          variant: 'destructive',
        });
        return;
      }

      const typeLabels: Record<string, string> = {
        TAX_INVOICE: 'ใบกำกับภาษี',
        RECEIPT: 'ใบเสร็จรับเงิน',
        DELIVERY_NOTE: 'ใบส่งของ',
        CREDIT_NOTE: 'ใบลดหนี้',
        DEBIT_NOTE: 'ใบเพิ่มหนี้',
      };

      const statusLabels: Record<string, string> = {
        DRAFT: 'ร่าง',
        ISSUED: 'ออกแล้ว',
        PARTIAL: 'รับชำระบางส่วน',
        PAID: 'รับชำระเต็มจำนวน',
        CANCELLED: 'ยกเลิก',
      };

      const companyAddressParts = [
        company?.address,
        company?.subDistrict,
        company?.district,
        company?.province,
        company?.postalCode,
      ].filter(Boolean);
      const companyAddress = companyAddressParts.join(' ');

      const customerAddressParts = [
        invoice.customer?.address,
        invoice.customer?.subDistrict,
        invoice.customer?.district,
        invoice.customer?.province,
        invoice.customer?.postalCode,
      ].filter(Boolean);
      const customerAddress = customerAddressParts.join(' ');

      const lineItems = invoice.lines || [];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${invoice.invoiceNo}</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            body {
              font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
              padding: 30px;
              max-width: 210mm;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.5;
            }
            .company-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .company-info { flex: 1; }
            .company-name {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 5px;
              color: #333;
            }
            .company-details {
              font-size: 11px;
              color: #555;
              line-height: 1.6;
            }
            .company-logo {
              width: 80px;
              height: 80px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #999;
              margin-left: 20px;
            }
            .doc-title {
              text-align: center;
              margin: 25px 0;
            }
            .doc-title h1 {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 5px 0;
              color: #333;
            }
            .doc-title .original-copy {
              font-size: 11px;
              color: #d32f2f;
              font-weight: 600;
              border: 1px solid #d32f2f;
              padding: 2px 10px;
              display: inline-block;
            }
            .info-grid {
              display: flex;
              gap: 30px;
              margin-bottom: 25px;
            }
            .info-block { flex: 1; }
            .info-block h3 {
              font-size: 12px;
              font-weight: 700;
              margin: 0 0 10px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #ddd;
              color: #333;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .info-label {
              width: 100px;
              color: #666;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              font-weight: 600;
              color: #333;
            }
            .customer-name {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #333;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 11px;
            }
            .items-table th {
              background: #424242;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
              border: 1px solid #424242;
            }
            .items-table td {
              padding: 10px 8px;
              border: 1px solid #ddd;
              vertical-align: top;
            }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary-box {
              width: 280px;
              border: 1px solid #ddd;
              padding: 15px;
              background: #fafafa;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 11px;
              border-bottom: 1px dashed #ddd;
            }
            .summary-row:last-child { border-bottom: none; }
            .summary-row.total {
              font-weight: 700;
              font-size: 14px;
              color: #d32f2f;
              border-top: 2px solid #333;
              border-bottom: none;
              margin-top: 8px;
              padding-top: 10px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              padding-top: 30px;
            }
            .signature-box {
              width: 150px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              padding-top: 10px;
              margin-top: 40px;
              font-size: 11px;
            }
            .date-line {
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            @media print {
              body { padding: 0; font-size: 11px; }
              .no-print { display: none !important; }
              .items-table th { background: #424242 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">${company?.name || 'บริษัท ไทย แอคเคานติ้ง จำกัด'}</div>
              <div class="company-details">
                ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                ${company?.taxId ? `<div>เลขประจำตัวผู้เสียภาษี: ${company.taxId}</div>` : ''}
                ${company?.phone ? `<div>โทร: ${company.phone}</div>` : ''}
                ${company?.email ? `<div>อีเมล: ${company.email}</div>` : ''}
              </div>
            </div>
            ${company?.logo ? `<div class="company-logo"><img src="${company.logo}" style="max-width: 80px; max-height: 80px;" /></div>` : ''}
          </div>

          <div class="doc-title">
            <h1>${typeLabels[invoice.type] || invoice.type}</h1>
            <span class="original-copy">ต้นฉบับ / ORIGINAL</span>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <h3>รายละเอียดเอกสาร</h3>
              <div class="info-row">
                <span class="info-label">เลขที่:</span>
                <span class="info-value">${invoice.invoiceNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">วันที่:</span>
                <span class="info-value">${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('th-TH') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ครบกำหนด:</span>
                <span class="info-value">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('th-TH') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">อ้างอิง:</span>
                <span class="info-value">${invoice.reference || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">สถานะ:</span>
                <span class="info-value">${statusLabels[invoice.status] || invoice.status}</span>
              </div>
            </div>

            <div class="info-block">
              <h3>ลูกค้า</h3>
              <div class="customer-name">${invoice.customer?.name || invoice.customerName || '-'}</div>
              <div class="info-row">
                <span class="info-label">เลขผู้เสียภาษี:</span>
                <span class="info-value">${invoice.customer?.taxId || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ที่อยู่:</span>
                <span class="info-value">${customerAddress || '-'}</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%">ลำดับ<br>No.</th>
                <th style="width: 40%" class="text-left">รายการ<br>Description</th>
                <th style="width: 10%">จำนวน<br>Qty</th>
                <th style="width: 10%">หน่วย<br>Unit</th>
                <th style="width: 15%">ราคา/หน่วย<br>Price</th>
                <th style="width: 17%">จำนวนเงิน<br>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                lineItems.length > 0
                  ? lineItems
                      .map(
                        (item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.unit || '-'}</td>
                  <td class="text-right">${(item.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">${(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                </tr>
              `
                      )
                      .join('')
                  : '<tr><td colspan="6" class="text-center" style="padding: 20px;">ไม่มีรายการ</td></tr>'
              }
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span>มูลค่าก่อน VAT</span>
                <span>${(invoice.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div class="summary-row">
                <span>VAT (7%)</span>
                <span>${(invoice.vatAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              ${
                invoice.discountAmount > 0
                  ? `
              <div class="summary-row">
                <span>ส่วนลด</span>
                <span>-${(invoice.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              `
                  : ''
              }
              ${
                invoice.withholdingAmount > 0
                  ? `
              <div class="summary-row">
                <span>หัก ณ ที่จ่าย</span>
                <span>-${(invoice.withholdingAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              `
                  : ''
              }
              <div class="summary-row total">
                <span>ยอดรวมสุทธิ</span>
                <span>${(invoice.netAmount || invoice.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
            </div>
          </div>

          ${
            invoice.notes
              ? `
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong>หมายเหตุ:</strong> ${invoice.notes}
          </div>
          `
              : ''
          }

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">ผู้รับสินค้า / Received by</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">ผู้ส่งสินค้า / Delivered by</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">ผู้มีอำนาจลงนาม / Authorized</div>
              <div class="date-line">วันที่ / Date: _________</div>
            </div>
          </div>

          <div class="footer">
            เอกสารนี้ออกโดยระบบคอมพิวเตอร์ ใช้เป็นหลักฐานทางบัญชีได้<br>
            This is a computer-generated document for accounting purposes
          </div>

          ${autoPrint ? '<script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>' : ''}
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      toast({
        title: 'พิมพ์ไม่สำเร็จ',
        description: error instanceof Error ? error.message : 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setPrintingInvoice(null);
    }
  };

  const handleDownload = async (invoiceId: string, invoiceNo: string) => {
    setDownloadingInvoice(invoiceId);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/export/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'ดาวน์โหลดสำเร็จ', description: `ดาวน์โหลด ${invoiceNo} เรียบร้อยแล้ว` });
    } catch {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // ── Loading UI ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-64 bg-slate-700/50" />
            <Skeleton className="h-5 w-80 bg-slate-700/30" />
          </div>
          <Skeleton className="h-10 w-40 bg-slate-700/50" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <Skeleton className="h-16 w-full bg-slate-700/40" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <Skeleton className="mb-4 h-12 w-full bg-slate-700/40" />
          <Skeleton className="h-64 w-full bg-slate-700/40" />
        </div>
      </div>
    );
  }

  // ── Error UI ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // ── Empty UI ────────────────────────────────────────────────────────────────
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">ใบกำกับภาษี / เอกสารการขาย</h1>
            <p className="mt-1 text-slate-400">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                สร้างเอกสารใหม่
              </Button>
            </DialogTrigger>
          </Dialog>
          <Alert>
            <AlertDescription>ไม่พบข้อมูล</AlertDescription>
          </Alert>
          <InvoiceForm
            open={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onSuccess={handleInvoiceSuccess}
            defaultType={invoiceFormType}
          />
        </div>
      </div>
    );
  }

  const safeInvoices = invoices || [];

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">ใบกำกับภาษี / เอกสารการขาย</h1>
          <p className="mt-1 text-slate-400">จัดการใบกำกับภาษี ใบเสร็จ และเอกสารที่เกี่ยวข้อง</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              สร้างเอกสารใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-slate-100">สร้างเอกสารใหม่</DialogTitle>
              <DialogDescription className="text-slate-400">
                เลือกประเภทเอกสารที่ต้องการสร้าง
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"
                onClick={() => openInvoiceForm('TAX_INVOICE')}
              >
                <FileText className="mb-2 h-8 w-8 text-indigo-400" />
                <span>ใบกำกับภาษี</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"
                onClick={() => openInvoiceForm('RECEIPT')}
              >
                <FileText className="mb-2 h-8 w-8 text-teal-400" />
                <span>ใบเสร็จรับเงิน</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"
                onClick={() => openInvoiceForm('DELIVERY_NOTE')}
              >
                <FileText className="mb-2 h-8 w-8 text-amber-400" />
                <span>ใบส่งของ</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"
                onClick={() => openInvoiceForm('CREDIT_NOTE')}
              >
                <FileText className="mb-2 h-8 w-8 text-red-400" />
                <span>ใบลดหนี้</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"
                onClick={() => openInvoiceForm('DEBIT_NOTE')}
              >
                <FileText className="mb-2 h-8 w-8 text-purple-400" />
                <span>ใบเพิ่มหนี้</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <InvoiceForm
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleInvoiceSuccess}
          defaultType={invoiceFormType}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">รอออกใบกำกับภาษี</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">
            {invoices.filter((i) => i.status === 'DRAFT').length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">รายการ</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">รอรับชำระ</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">
            {invoices.filter((i) => i.status === 'ISSUED' || i.status === 'PARTIAL').length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">รายการ</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">รับชำระแล้ว (เดือนนี้)</p>
          <p className="mt-1 text-2xl font-bold text-teal-400">
            ฿
            {safeInvoices
              .filter((i) => i.status === 'PAID' || i.status === 'PARTIAL')
              .reduce((sum, i) => sum + (i.paidAmount || 0), 0)
              .toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {safeInvoices.filter((i) => i.status === 'PAID' || i.status === 'PARTIAL').length}{' '}
            รายการ
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">ภาษีขายรวม</p>
          <p className="mt-1 text-2xl font-bold text-purple-400">
            ฿
            {safeInvoices
              .reduce((sum, i) => sum + (i.vatAmount || 0), 0)
              .toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">เดือนนี้</p>
        </div>
      </div>

      {/* Filters Component */}
      <InvoiceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
      />

      {/* Virtualized Table Component */}
      <InvoiceTable
        invoices={filteredInvoices}
        onViewDetail={handleViewDetail}
        onView={handleView}
        onEdit={() => {}}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onPost={handlePostInvoice}
        printingInvoice={printingInvoice}
        downloadingInvoice={downloadingInvoice}
        postingInvoice={postingInvoice}
      />

      {/* Pagination */}
      <InvoicePagination
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />
    </div>
  );
}
