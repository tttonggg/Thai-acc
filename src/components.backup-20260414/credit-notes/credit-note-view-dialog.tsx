'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, FileText, User, Calendar, FileText as FileIcon } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface CreditNoteViewDialogProps {
  creditNoteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreditNoteDetail {
  id: string
  creditNoteNo: string
  creditNoteDate: string
  customer: {
    id: string
    code: string
    name: string
    taxId?: string
    address?: string
  }
  invoice?: {
    id: string
    invoiceNo: string
  }
  reason: string
  subtotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  status: string
  notes?: string
  journalEntry?: {
    id: string
    entryNo: string
    lines: Array<{
      lineNo: number
      account: {
        code: string
        name: string
      }
      description: string
      debit: number
      credit: number
    }>
  }
  createdAt: string
}

const reasonLabels: Record<string, string> = {
  RETURN: 'คืนสินค้า',
  DISCOUNT: 'ส่วนลด',
  ALLOWANCE: 'ค่าเสียโอกาส',
  CANCELLATION: 'ยกเลิก',
}

const statusColors: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  ISSUED: 'ออกแล้ว',
  CANCELLED: 'ยกเลิก',
}

export function CreditNoteViewDialog({ creditNoteId, open, onOpenChange }: CreditNoteViewDialogProps) {
  const [creditNote, setCreditNote] = useState<CreditNoteDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCreditNote = async () => {
      if (!open || !creditNoteId) return

      setLoading(true)
      try {
        const res = await fetch(`/api/credit-notes/${creditNoteId}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setCreditNote(data.data || data)
      } catch (error) {
        console.error('Failed to fetch credit note:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCreditNote()
  }, [open, creditNoteId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>กำลังโหลดข้อมูลใบลดหนี้</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!creditNote) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>เกิดข้อผิดพลาดในการโหลดข้อมูลใบลดหนี้</DialogTitle>
          </VisuallyHidden>
          <div className="text-center py-12 text-gray-500">
            ไม่พบข้อมูลใบลดหนี้
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>รายละเอียดใบลดหนี้</span>
            <Badge className={statusColors[creditNote.status]}>
              {statusLabels[creditNote.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            ดูรายละเอียดใบลดหนี้ทั้งหมดรวมทั้งข้อมูลลูกค้า บัญชี และบันทึกบัญชี
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{creditNote.creditNoteNo}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    วันที่ออก: {formatDate(creditNote.creditNoteDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600">
                    -฿{(creditNote.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">ยอดรวม</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">รหัสลูกค้า</p>
                  <p className="font-medium">{creditNote.customer.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ชื่อลูกค้า</p>
                  <p className="font-medium">{creditNote.customer.name}</p>
                </div>
                {creditNote.customer.taxId && (
                  <div>
                    <p className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี</p>
                    <p className="font-medium">{creditNote.customer.taxId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  เอกสารอ้างอิง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">เหตุผล</p>
                  <p className="font-medium">{reasonLabels[creditNote.reason] || creditNote.reason}</p>
                </div>
                {creditNote.invoice && (
                  <div>
                    <p className="text-sm text-gray-500">อ้างอิงใบกำกับภาษี</p>
                    <p className="font-medium">{creditNote.invoice.invoiceNo}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">สถานะ</p>
                  <Badge className={statusColors[creditNote.status]}>
                    {statusLabels[creditNote.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Amount Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุปยอด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">มูลค่าก่อน VAT:</span>
                <span className="font-medium">฿{(creditNote.subtotal / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">อัตรา VAT:</span>
                <span className="font-medium">{creditNote.vatRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT:</span>
                <span className="font-medium">฿{(creditNote.vatAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดรวม:</span>
                <span className="text-red-600">-฿{(creditNote.totalAmount / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Journal Entry */}
          {creditNote.journalEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  บันทึกบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">เลขที่บันทึกบัญชี</p>
                  <p className="font-mono font-medium">{creditNote.journalEntry.entryNo}</p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">บัญชี</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">รายการ</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">เดบิต</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">เครดิต</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {creditNote.journalEntry.lines.map((line) => (
                        <tr key={line.lineNo}>
                          <td className="px-4 py-2 text-sm">
                            {line.account.code} - {line.account.name}
                          </td>
                          <td className="px-4 py-2 text-sm">{line.description}</td>
                          <td className="px-4 py-2 text-sm text-right">
                            {line.debit > 0 ? `฿${(line.debit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">
                            {line.credit > 0 ? `฿${(line.credit / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">
                          รวม:
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          ฿{(creditNote.journalEntry.lines.reduce((sum, l) => sum + l.debit, 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          ฿{(creditNote.journalEntry.lines.reduce((sum, l) => sum + l.credit, 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {creditNote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">หมายเหตุ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{creditNote.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-500 text-center">
            สร้างเมื่อ {formatDate(creditNote.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
