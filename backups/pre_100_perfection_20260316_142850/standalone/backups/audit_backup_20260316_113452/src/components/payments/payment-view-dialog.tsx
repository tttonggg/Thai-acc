'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Download, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentViewDialogProps {
  paymentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  CHEQUE: 'เช็ค',
  CREDIT: 'บัตรเครดิต',
  OTHER: 'อื่นๆ',
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

export function PaymentViewDialog({ paymentId, open, onOpenChange }: PaymentViewDialogProps) {
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPayment = async () => {
      if (!open || !paymentId) return

      setLoading(true)
      try {
        const res = await fetch(`/api/payments/${paymentId}`)
        if (!res.ok) throw new Error('Fetch failed')

        const data = await res.json()
        setPayment(data.data || data)
      } catch (error) {
        console.error('Error fetching payment:', error)
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPayment()
  }, [open, paymentId, toast])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}/export/pdf`)
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${payment?.paymentNo || 'payment'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'ดาวน์โหลดสำเร็จ',
        description: `ดาวน์โหลด ${payment?.paymentNo} เรียบร้อยแล้ว`
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

  if (loading || !payment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const totalAllocated = payment.allocations?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0
  const totalWHT = payment.whtAmount || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>ใบจ่ายเงิน</DialogTitle>
              <DialogDescription className="font-mono text-lg mt-1">
                {payment.paymentNo}
              </DialogDescription>
            </div>
            <Badge className={statusColors[payment.status]}>
              {statusLabels[payment.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียดการจ่ายเงิน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ผู้ขาย</p>
                  <p className="font-medium">{payment.vendor?.name}</p>
                  <p className="text-sm text-gray-600">{payment.vendor?.taxId}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">วันที่จ่ายเงิน</p>
                  <p className="font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString('th-TH')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">วิธีจ่าย</p>
                  <p className="font-medium">{paymentMethodLabels[payment.paymentMethod]}</p>
                </div>

                {payment.bankAccount && (
                  <div>
                    <p className="text-sm text-gray-500">บัญชีธนาคาร</p>
                    <p className="font-medium">
                      {payment.bankAccount?.bankName} - {payment.bankAccount?.accountNumber}
                    </p>
                  </div>
                )}

                {payment.chequeNo && (
                  <div>
                    <p className="text-sm text-gray-500">เลขที่เช็ค</p>
                    <p className="font-medium">{payment.chequeNo}</p>
                    {payment.chequeDate && (
                      <p className="text-sm text-gray-600">
                        วันที่: {new Date(payment.chequeDate).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {payment.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">หมายเหตุ</p>
                  <p className="text-sm">{payment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Allocations */}
          {payment.allocations && payment.allocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การจัดจ่ายใบซื้อ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment.allocations.map((allocation: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{allocation.invoice?.invoiceNo}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(allocation.invoice?.invoiceDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">฿{allocation.amount.toLocaleString()}</p>
                          {allocation.whtAmount > 0 && (
                            <p className="text-sm text-gray-500">
                              WHT ({allocation.whtRate}%): ฿{allocation.whtAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>จัดจ่ายรวม:</span>
                    <span className="font-medium">฿{totalAllocated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>หัก ณ ที่จ่ายรวม:</span>
                    <span className="font-medium">฿{totalWHT.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">ยอดจ่ายรวม:</span>
                    <span className="font-bold">฿{payment.amount.toLocaleString()}</span>
                  </div>
                  {payment.unallocated > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>คงเหลือ (เครดิตเจ้าหนี้):</span>
                      <span>฿{payment.unallocated.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Journal Entry Info */}
          {payment.journalEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">บันทึกบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">เลขที่บันทึก:</span>
                    <span className="font-mono">{payment.journalEntry.entryNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">วันที่:</span>
                    <span>{new Date(payment.journalEntry.date).toLocaleDateString('th-TH')}</span>
                  </div>
                  {payment.journalEntry.lines && payment.journalEntry.lines.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm font-medium mb-2">รายการบัญชี:</p>
                      <div className="space-y-1">
                        {payment.journalEntry.lines.map((line: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{line.account?.code} - {line.account?.name}</span>
                            <span className="font-mono">
                              {line.debit > 0 && `Dr ${line.debit.toLocaleString()}`}
                              {line.credit > 0 && `Cr ${line.credit.toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={payment.status !== 'POSTED'}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading || payment.status !== 'POSTED'}
            >
              {downloading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
