'use client'

import { useState, useEffect } from 'react'
import { Download, Printer, Edit, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ReceiptAllocation {
  id: string
  invoice: {
    id: string
    invoiceNo: string
    invoiceDate: string
    totalAmount: number
  }
  amount: number
  whtRate: number
  whtAmount: number
}

interface Receipt {
  id: string
  receiptNo: string
  receiptDate: string
  customer: {
    id: string
    code: string
    name: string
    taxId?: string
    address?: string
  }
  paymentMethod: string
  bankAccount?: {
    id: string
    bankName: string
    accountNumber: string
  }
  chequeNo?: string
  chequeDate?: string
  amount: number
  whtAmount: number
  unallocated: number
  notes?: string
  status: string
  totalAllocated: number
  totalWht: number
  remaining: number
  allocations: ReceiptAllocation[]
  journalEntry?: {
    id: string
    entryNo: string
  }
}

interface ReceiptViewDialogProps {
  receiptId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReceiptViewDialog({
  receiptId,
  open,
  onOpenChange,
  onSuccess
}: ReceiptViewDialogProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && receiptId) {
      fetchReceipt()
    }
  }, [open, receiptId])

  const fetchReceipt = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/receipts/${receiptId}`)
      if (!res.ok) throw new Error('Fetch failed')
      const result = await res.json()
      setReceipt(result.data)
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: 'โหลดข้อมูลไม่สำเร็จ',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!receipt) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'ไม่สามารถเปิดหน้าต่างได้',
        description: 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่',
        variant: 'destructive'
      })
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จรับเงิน - ${receipt.receiptNo}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .section { margin: 20px 0; }
          .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .text-right { text-align: right; }
          .total { font-weight: bold; font-size: 16px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบเสร็จรับเงิน</h1>
          <p>เลขที่: ${receipt.receiptNo}</p>
          <p>วันที่: ${new Date(receipt.receiptDate).toLocaleDateString('th-TH')}</p>
          <p>สถานะ: ${statusLabels[receipt.status]}</p>
        </div>
        
        <div class="section">
          <h3>ข้อมูลลูกค้า</h3>
          <p><strong>ชื่อ:</strong> ${receipt.customer?.name || '-'}</p>
          <p><strong>รหัส:</strong> ${receipt.customer?.code || '-'}</p>
          ${receipt.customer?.taxId ? `<p><strong>เลขประจำตัวผู้เสียภาษี:</strong> ${receipt.customer.taxId}</p>` : ''}
        </div>

        <div class="section">
          <h3>รายละเอียดการชำระ</h3>
          <p><strong>วิธีการชำระ:</strong> ${paymentMethodLabels[receipt.paymentMethod]}</p>
          ${receipt.bankAccount ? `<p><strong>ธนาคาร:</strong> ${receipt.bankAccount.bankName} (${receipt.bankAccount.accountNumber})</p>` : ''}
          ${receipt.chequeNo ? `<p><strong>เลขที่เช็ค:</strong> ${receipt.chequeNo}</p>` : ''}
        </div>

        ${receipt.allocations.length > 0 ? `
        <div class="section">
          <h3>รายการจัดจ่าย</h3>
          <table>
            <thead>
              <tr>
                <th>เลขที่ใบกำกับภาษี</th>
                <th class="text-right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.allocations.map(a => `
                <tr>
                  <td>${a.invoice.invoiceNo}</td>
                  <td class="text-right">${a.amount.toLocaleString('th-TH')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <p class="total">ยอดรับเงินรวม: ${receipt.amount.toLocaleString('th-TH')} บาท</p>
          ${receipt.totalWht > 0 ? `<p>ภาษีหัก ณ ที่จ่าย: ${receipt.totalWht.toLocaleString('th-TH')} บาท</p>` : ''}
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
      </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Client-side download as HTML
      if (!receipt) return
      
      const paymentMethodLabels: Record<string, string> = {
        CASH: 'เงินสด',
        CHEQUE: 'เช็ค',
        TRANSFER: 'โอนเงิน',
        CREDIT: 'บัตรเครดิต',
        OTHER: 'อื่นๆ',
      }
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบเสร็จรับเงิน - ${receipt.receiptNo}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; }
            .header h1 { margin: 0; }
            .info { margin: 20px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ใบเสร็จรับเงิน</h1>
            <p>เลขที่: ${receipt.receiptNo}</p>
            <p>วันที่: ${new Date(receipt.receiptDate).toLocaleDateString('th-TH')}</p>
          </div>
          <div class="info">
            <p><strong>ลูกค้า:</strong> ${receipt.customer?.name || '-'}</p>
            <p><strong>วิธีการชำระ:</strong> ${paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}</p>
            <p class="total">จำนวนเงิน: ${receipt.amount.toLocaleString('th-TH')} บาท</p>
          </div>
        </body>
        </html>
      `
      
      const blob = new Blob([html], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${receipt.receiptNo}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${receipt.receiptNo} เรียบร้อยแล้ว`
      })
    } catch (error) {
      toast({
        title: 'ดาวน์โหลดไม่สำเร็จ',
        description: 'กรุณาลองอีกครั้ง',
        variant: 'destructive'
      })
    } finally {
      setDownloading(false)
    }
  }

  const handlePost = async () => {
    setPosting(true)
    try {
      const res = await fetch(`/api/receipts/${receiptId}/post`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถลงบัญชีได้')
      }

      toast({
        title: 'สำเร็จ',
        description: 'ลงบัญชีใบเสร็จรับเงินเรียบร้อยแล้ว',
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลงบัญชีได้',
        variant: 'destructive'
      })
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบใบเสร็จรับเงินนี้ใช่หรือไม่?')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'ไม่สามารถลบได้')
      }

      toast({
        title: 'สำเร็จ',
        description: 'ลบใบเสร็จรับเงินเรียบร้อยแล้ว',
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'ผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลบได้',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    POSTED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'ร่าง',
    POSTED: 'ลงบัญชีแล้ว',
    CANCELLED: 'ยกเลิก',
  }

  const paymentMethodLabels: Record<string, string> = {
    CASH: 'เงินสด',
    CHEQUE: 'เช็ค',
    TRANSFER: 'โอนเงิน',
    CREDIT: 'บัตรเครดิต',
    OTHER: 'อื่นๆ',
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[700px]">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบเสร็จ</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!receipt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[700px]">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบเสร็จ</DialogTitle>
          </VisuallyHidden>
          <div className="text-center py-12 text-red-600">
            ไม่พบข้อมูลใบเสร็จ
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">รายละเอียดใบเสร็จรับเงิน</DialogTitle>
          <DialogDescription>
            {receipt.receiptNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge className={statusColors[receipt.status]}>
              {statusLabels[receipt.status]}
            </Badge>
            <div className="flex gap-2">
              {receipt.status === 'DRAFT' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePost}
                    disabled={posting}
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    ลงบัญชี
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    ลบ
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                พิมพ์
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                ดาวน์โหลด
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">ลูกค้า</h3>
            <p className="text-lg">{receipt.customer.name}</p>
            {receipt.customer.taxId && (
              <p className="text-sm text-gray-600 mt-1">
                เลขประจำตัวผู้เสียภาษี: {receipt.customer.taxId}
              </p>
            )}
            {receipt.customer.address && (
              <p className="text-sm text-gray-600 mt-1">{receipt.customer.address}</p>
            )}
          </div>

          {/* Receipt Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">รายละเอียดการรับเงิน</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">วันที่รับเงิน:</span>
                <span className="ml-2">{new Date(receipt.receiptDate).toLocaleDateString('th-TH')}</span>
              </div>
              <div>
                <span className="text-gray-600">วิธีการชำระ:</span>
                <span className="ml-2">{paymentMethodLabels[receipt.paymentMethod]}</span>
              </div>
              {receipt.bankAccount && (
                <>
                  <div>
                    <span className="text-gray-600">ธนาคาร:</span>
                    <span className="ml-2">{receipt.bankAccount.bankName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">บัญชี:</span>
                    <span className="ml-2">{receipt.bankAccount.accountNumber}</span>
                  </div>
                </>
              )}
              {receipt.chequeNo && (
                <div>
                  <span className="text-gray-600">เลขที่เช็ค:</span>
                  <span className="ml-2">{receipt.chequeNo}</span>
                </div>
              )}
              {receipt.chequeDate && (
                <div>
                  <span className="text-gray-600">วันที่เช็ค:</span>
                  <span className="ml-2">{new Date(receipt.chequeDate).toLocaleDateString('th-TH')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Allocations */}
          {receipt.allocations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">รายการจัดจ่าย</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">เลขที่</th>
                      <th className="text-right p-3">ยอดรวม</th>
                      <th className="text-right p-3">จัดจ่าย</th>
                      <th className="text-right p-3">หัก ณ ที่จ่าย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.allocations.map((allocation) => (
                      <tr key={allocation.id} className="border-t">
                        <td className="p-3">
                          {allocation.invoice.invoiceNo}
                          <div className="text-xs text-gray-500">
                            {new Date(allocation.invoice.invoiceDate).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="text-right p-3">
                          ฿{allocation.invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="text-right p-3">
                          ฿{allocation.amount.toLocaleString()}
                        </td>
                        <td className="text-right p-3">
                          {allocation.whtRate > 0 ? (
                            <>
                              {allocation.whtRate}% (฿{allocation.whtAmount.toLocaleString()})
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">สรุปยอด</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ยอดรับเงินรวม</span>
                <span className="font-semibold">฿{receipt.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              {receipt.totalAllocated > 0 && (
                <div className="flex justify-between">
                  <span>จัดจ่ายใบกำกับภาษี</span>
                  <span>฿{receipt.totalAllocated.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {receipt.totalWht > 0 && (
                <div className="flex justify-between">
                  <span>ภาษีหัก ณ ที่จ่าย</span>
                  <span>฿{receipt.totalWht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {receipt.unallocated > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>เครดิตคงเหลือ</span>
                  <span>฿{receipt.unallocated.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>ยอดสุทธิ</span>
                <span>฿{receipt.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Journal Entry */}
          {receipt.journalEntry && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">บันทึกบัญชี</h3>
              <p className="text-sm">เลขที่: {receipt.journalEntry.entryNo}</p>
            </div>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div>
              <h3 className="font-semibold mb-2">หมายเหตุ</h3>
              <p className="text-sm text-gray-600">{receipt.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
