/**
 * PDF Export Button Component
 * คอมโพเนนต์ปุ่มส่งออก PDF
 *
 * Usage examples for different document types
 */

'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PDFExportButtonProps {
  documentType: 'invoice' | 'receipt' | 'journal-entry';
  documentId: string;
  documentNumber?: string;
}

export function PDFExportButton({
  documentType,
  documentId,
  documentNumber,
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const endpoint = `/api/${documentType}s/${documentId}/export/pdf`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename
      const filename = documentNumber
        ? `${documentType}-${documentNumber}.pdf`
        : `${documentType}-${documentId}.pdf`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // You could add a toast notification here
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}

/**
 * Example usage in an Invoice detail page:
 *
 * import { PDFExportButton } from '@/components/pdf-export-button'
 *
 * export function InvoiceDetailPage({ invoice }) {
 *   return (
 *     <div>
 *       <h1>Invoice {invoice.invoiceNo}</h1>
 *       {/* Invoice details *\/}
 *
 *       <div className="flex gap-2">
 *         <PDFExportButton
 *           documentType="invoice"
 *           documentId={invoice.id}
 *           documentNumber={invoice.invoiceNo}
 *         />
 *       </div>
 *     </div>
 *   )
 * }
 */

/**
 * Report Export Button Component
 * คอมโพเนนต์ปุ่มส่งออกรายงาน
 */

interface ReportExportButtonProps {
  reportType: 'trial-balance' | 'income-statement' | 'balance-sheet';
  startDate?: string;
  endDate?: string;
  filename?: string;
}

export function ReportExportButton({
  reportType,
  startDate,
  endDate,
  filename,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const endpoint = `/api/reports/${reportType}/export/pdf?${params.toString()}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Use custom filename or generate default
      const defaultFilename = `${reportType}-${endDate || new Date().toISOString().split('T')[0]}.pdf`;
      a.download = filename || defaultFilename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}

/**
 * Example usage in a Reports page:
 *
 * import { ReportExportButton } from '@/components/pdf-export-button'
 *
 * export function ReportsPage() {
 *   const [dateRange, setDateRange] = useState({
 *     startDate: '2024-01-01',
 *     endDate: '2024-12-31'
 *   })
 *
 *   return (
 *     <div>
 *       <h1>Financial Reports</h1>
 *
 *       <div className="flex gap-4">
 *         <ReportExportButton
 *           reportType="trial-balance"
 *           startDate={dateRange.startDate}
 *           endDate={dateRange.endDate}
 *         />
 *
 *         <ReportExportButton
 *           reportType="income-statement"
 *           startDate={dateRange.startDate}
 *           endDate={dateRange.endDate}
 *         />
 *
 *         <ReportExportButton
 *           reportType="balance-sheet"
 *           endDate={dateRange.endDate}
 *         />
 *       </div>
 *     </div>
 *   )
 * }
 */

/**
 * Advanced Export Dropdown
 * ตัวเลือกส่งออกหลายรูปแบบ
 */

interface ExportDropdownProps {
  invoiceId: string;
  invoiceNo: string;
}

export function ExportDropdown({ invoiceId, invoiceNo }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  const handleExport = async (type: 'pdf' | 'excel' | 'email') => {
    setIsExporting(true);
    setExportType(type);

    try {
      switch (type) {
        case 'pdf':
          // Export as PDF
          const pdfResponse = await fetch(`/api/invoices/${invoiceId}/export/pdf`, {
            credentials: 'include',
          });
          if (!pdfResponse.ok) throw new Error('Failed to generate PDF');

          const pdfBlob = await pdfResponse.blob();
          const pdfUrl = window.URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = `invoice-${invoiceNo}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(pdfUrl);
          document.body.removeChild(a);
          break;

        case 'excel':
          // Export as Excel (if you have that endpoint)
          const excelResponse = await fetch(`/api/invoices/${invoiceId}/export/excel`, {
            credentials: 'include',
          });
          if (!excelResponse.ok) throw new Error('Failed to generate Excel');

          const excelBlob = await excelResponse.blob();
          const excelUrl = window.URL.createObjectURL(excelBlob);
          const b = document.createElement('a');
          b.href = excelUrl;
          b.download = `invoice-${invoiceNo}.xlsx`;
          document.body.appendChild(b);
          b.click();
          window.URL.revokeObjectURL(excelUrl);
          document.body.removeChild(b);
          break;

        case 'email':
          // Send via email (if you have that endpoint)
          const emailResponse = await fetch(`/api/invoices/${invoiceId}/email`, {
            credentials: 'include',
            method: 'POST',
          });
          if (!emailResponse.ok) throw new Error('Failed to send email');

          alert('Invoice sent successfully!');
          break;
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {exportType === 'pdf' && 'Generating PDF...'}
              {exportType === 'excel' && 'Generating Excel...'}
              {exportType === 'email' && 'Sending Email...'}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <Download className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <Download className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('email')}>
          <Download className="mr-2 h-4 w-4" />
          Send via Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
