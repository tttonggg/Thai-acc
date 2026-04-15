'use client'

// ============================================
// 💰 Payroll Run Status Dialog
// Agent 06: Payroll & HR Engineer
// Manage payroll run status (Draft → Approved → Paid)
// ============================================

import { useState, useEffect } from 'react'
import { CheckCircle, DollarSign, Users, AlertCircle, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)

interface PayrollRun {
  id: string
  runNo: string
  periodMonth: number
  periodYear: number
  paymentDate: string
  totalBaseSalary: number
  totalAdditions: number
  totalDeductions: number
  totalSsc: number
  totalTax: number
  totalNetPay: number
  status: 'DRAFT' | 'APPROVED' | 'PAID'
  payrolls: { id: string }[]
  journalEntryId?: string | null
}

interface PayrollStatusDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  payrollRun: PayrollRun | null
}

const PAYROLL_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-gray-100 text-gray-600' },
  APPROVED: { label: 'อนุมัติ', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'จ่ายแล้ว', color: 'bg-green-100 text-green-700' },
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export function PayrollRunStatusDialog({ open, onClose, onSuccess, payrollRun }: PayrollStatusDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleApprove = async () => {
    if (!payrollRun) return

    setLoading(true)

    try {
      const response = await window.fetch(`/api/payroll/${payrollRun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const res = await response.json()

      if (res.success) {
        toast({
          title: 'อนุมัติงวดเงินเดือนสำเร็จ',
          description: res.data.journalEntry
            ? 'บันทึกบัญชีถูกสร้างเรียบร้อยแล้ว'
            : 'อัปเดตสถานะเรียบร้อยแล้ว',
        })
        onSuccess()
        onClose()
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถอนุมัติงวดเงินเดือนได้', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!payrollRun) return

    setLoading(true)

    try {
      const response = await window.fetch(`/api/payroll/${payrollRun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markPaid' }),
      })

      const res = await response.json()

      if (res.success) {
        toast({
          title: 'บันทึกสถานะจ่ายเงินเดือนแล้ว',
        })
        onSuccess()
        onClose()
      } else {
        toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: 'ไม่สามารถบันทึกสถานะได้', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!payrollRun) return null

  const statusInfo = PAYROLL_STATUS[payrollRun.status] || PAYROLL_STATUS.DRAFT
  const canApprove = payrollRun.status === 'DRAFT'
  const canMarkPaid = payrollRun.status === 'APPROVED'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายละเอียดและสถานะงวดเงินเดือน
          </DialogTitle>
          <DialogDescription className="sr-only">
            แสดงรายละเอียดงวดเงินเดือนสำหรับงวด {THAI_MONTHS[payrollRun.periodMonth - 1]} {payrollRun.periodYear + 543}
            รวมถึงสถานะการอนุมัติการจ่ายเงิน รายละเอียดทางการเงิน เงินเดือน ประกันสังคม ภาษี
            และสถานะการบันทึกบัญชี
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Info */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">งวดเงินเดือน</p>
              <p className="text-lg font-semibold">
                {THAI_MONTHS[payrollRun.periodMonth - 1]} {payrollRun.periodYear + 543}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">เลขที่รอบ</p>
              <p className="text-lg font-semibold font-mono">{payrollRun.runNo}</p>
            </div>
            <Badge className={`${statusInfo.color} text-sm`}>{statusInfo.label}</Badge>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">จำนวนพนักงาน</p>
                <p className="text-lg font-bold text-blue-700">{payrollRun.payrolls.length} คน</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">เงินได้สุทธิรวม</p>
                <p className="text-lg font-bold text-green-700">฿{fc(payrollRun.totalNetPay)}</p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-3 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700">รายละเอียดทางการเงิน</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ฐานเงินเดือนรวม</span>
                <span className="font-semibold">฿{fc(payrollRun.totalBaseSalary)}</span>
              </div>

              {payrollRun.totalAdditions > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>เบี้ยเลี้ยง/อื่นๆ</span>
                  <span>+ ฿{fc(payrollRun.totalAdditions)}</span>
                </div>
              )}

              {payrollRun.totalDeductions > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>หักอื่นๆ</span>
                  <span>- ฿{fc(payrollRun.totalDeductions)}</span>
                </div>
              )}

              <div className="flex justify-between text-purple-600">
                <span>หัก ประกันสังคม (5%)</span>
                <span>- ฿{fc(payrollRun.totalSsc)}</span>
              </div>

              <div className="flex justify-between text-red-600">
                <span>หัก ภาษี PND1</span>
                <span>- ฿{fc(payrollRun.totalTax)}</span>
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-base font-bold text-green-700">
                  <span>เงินได้สุทธิ</span>
                  <span>฿{fc(payrollRun.totalNetPay)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Journal Entry Status */}
          {payrollRun.journalEntryId && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">บันทึกบัญชีถูกสร้างแล้ว</span>
            </div>
          )}

          {/* Warnings */}
          {payrollRun.status === 'DRAFT' && !payrollRun.journalEntryId && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-semibold">ยังไม่ได้อนุมัติ</p>
                <p className="text-xs mt-1">
                  เมื่ออนุมัติแล้ว ระบบจะสร้างบันทึกบัญชีสำหรับเงินเดือนโดยอัตโนมัติ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            ปิด
          </Button>

          <div className="flex gap-2">
            {canApprove && (
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'กำลังอนุมัติ...' : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    อนุมัติ (สร้างบันทึกบัญชี)
                  </>
                )}
              </Button>
            )}

            {canMarkPaid && (
              <Button
                onClick={handleMarkPaid}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'กำลังบันทึก...' : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    บันทึกว่าจ่ายแล้ว
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
