/**
 * Invoice Preview Dialog with HTML Preview and Print Support
 * พรีวิวใบกำกับภาษีพร้อมระบบปรับแต่งและพิมพ์
 */

'use client';

import { useState, useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Eye } from 'lucide-react';

interface InvoicePreviewDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewDialog({ invoiceId, open, onOpenChange }: InvoicePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState({
    fontSize: 12,
    lineHeight: 1.4,
    tableHeaderColor: '#424242',
  });

  // Load preview when dialog opens
  useEffect(() => {
    if (open && invoiceId) {
      loadPreview();
    }
  }, [open, invoiceId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/preview`, {
        credentials: 'include',
      });
      if (response.ok) {
        const html = await response.text();
        // Create blob URL
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewUrl) {
      const printWindow = window.open(previewUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `invoice-${invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCustomizationChange = (key: string, value: string | number) => {
    setCustomization((prev) => ({ ...prev, [key]: value }));

    // Send customization to iframe
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'updateCustomization',
          customization: { ...customization, [key]: value },
        },
        '*'
      );
    }
  };

  const cleanup = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) cleanup();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden md:max-w-6xl">
        <VisuallyHidden>
          <DialogDescription>
            พรีวิว invoice dialog
            สำหรับดูตัวอย่างใบกำกับภาษีก่อนพิมพ์หรือดาวน์โหลดพร้อมการปรับแต่งรูปแบบ
          </DialogDescription>
        </VisuallyHidden>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            พรีวิวใบกำกับภาษี / Invoice Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              {/* Font Size */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">ขนาดตัวอักษร:</label>
                <input
                  type="range"
                  min="9"
                  max="16"
                  value={customization.fontSize}
                  onChange={(e) => handleCustomizationChange('fontSize', e.target.value)}
                  className="w-24"
                />
                <span className="w-8 text-sm">{customization.fontSize}</span>
              </div>

              {/* Line Height */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">ระยะบรรทัด:</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={customization.lineHeight}
                  onChange={(e) => handleCustomizationChange('lineHeight', e.target.value)}
                  className="w-24"
                />
                <span className="w-8 text-sm">{customization.lineHeight}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} size="sm">
                <Printer className="mr-2 h-4 w-4" />
                พิมพ์ / Print
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลด / Download
              </Button>
            </div>
          </div>

          {/* Preview Frame */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-gray-100">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">กำลังโหลดพรีวิว...</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                id="preview-frame"
                src={previewUrl}
                className="h-[70vh] w-full"
                sandbox="allow-same-origin allow-scripts allow-modals"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">ไม่สามารถโหลดพรีวิวได้</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="mb-1 font-medium">วิธีใช้งาน / How to use:</p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>ปรับแต่งขนาดตัวอักษรและระยะบรรทัดได้ตามต้องการ</li>
              <li>คลิก "พิมพ์" เพื่อพิมพ์เอกสาร หรือบันทึกเป็น PDF จากหน้าต่างพิมพ์</li>
              <li>คลิก "ดาวน์โหลด" เพื่อบันทึกเป็นไฟล์ HTML</li>
              <li>ในหน้าต่างพรีวิว สามารถปรับแต่งเพิ่มได้จากแผงด้านขวา</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Usage Example:
 *
 * <InvoicePreviewDialog
 *   invoiceId="invoice-id-here"
 *   open={showPreview}
 *   onOpenChange={setShowPreview}
 * />
 */
