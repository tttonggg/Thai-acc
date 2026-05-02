"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Printer, CreditCard, AlertTriangle, Pencil, FileText, Send, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import { useGenerateETax, useSubmitETax, useETaxHistory } from "@/hooks/useApi";

const statusLabels: Record<string, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  paid: "ชำระแล้ว",
  partially_paid: "ชำระบางส่วน",
  overdue: "เกินกำหนด",
  cancelled: "ยกเลิก",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  partially_paid: "bg-yellow-50 text-yellow-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const etaxStatusLabels: Record<string, string> = {
  pending: "รอสร้าง",
  generated: "สร้าง XML แล้ว",
  submitted: "ส่งแล้ว",
  confirmed: "ยืนยันแล้ว",
  failed: "ล้มเหลว",
};

const etaxStatusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  generated: "bg-blue-50 text-blue-700",
  submitted: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api.get(`/invoices/${invoiceId}`).then((res) => res.data),
  });

  const { data: receipts } = useQuery({
    queryKey: ["receipts", { invoice_id: invoiceId }],
    queryFn: () => api.get("/receipts", { params: { invoice_id: invoiceId } }).then((res) => res.data),
    enabled: !!invoiceId,
  });

  const { data: eTaxHistory } = useETaxHistory(invoiceId);
  const generateETax = useGenerateETax();
  const submitETax = useSubmitETax();

  const handleGenerateETax = async () => {
    try {
      await generateETax.mutateAsync(invoiceId);
      alert("สร้าง e-Tax XML สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleSubmitETax = async () => {
    try {
      await submitETax.mutateAsync(invoiceId);
      alert("ส่ง e-Tax สำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleDownloadXml = () => {
    window.open(`/api/v1/invoices/${invoiceId}/e-tax/xml`, "_blank");
  };

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!invoice) return <AppLayout><div className="p-8 text-center">ไม่พบใบแจ้งหนี้</div></AppLayout>;

  const remaining = invoice.total_amount - invoice.paid_amount;
  const isOverdue = invoice.status === "sent" || invoice.status === "partially_paid";
  const canRecordPayment = remaining > 0 && invoice.status !== "cancelled";

  const etaxStatus = invoice.e_tax_error
    ? "failed"
    : invoice.e_tax_timestamp
    ? "confirmed"
    : invoice.e_tax_submitted_at
    ? "submitted"
    : invoice.e_tax_xml
    ? "generated"
    : "pending";

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/income" className="text-gray-500 hover:text-gray-700 print:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
                  {statusLabels[invoice.status]}
                </span>
              </div>
              <p className="text-gray-500 mt-1">ใบแจ้งหนี้</p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Link
                href={`/income/invoices/${invoiceId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                แก้ไข
              </Link>
            )}
            {canRecordPayment && (
              <Link
                href={`/income/receipts/new?invoice_id=${invoiceId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-4 h-4" />
                บันทึกรับเงิน
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors print:hidden"
            >
              <Printer className="w-4 h-4" />
              พิมพ์
            </button>
          </div>
        </div>

        {/* Overdue Alert */}
        {isOverdue && remaining > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">ค้างชำระ {formatCurrency(remaining)}</p>
              <p className="text-xs text-red-600">ครบกำหนด: {formatThaiDate(invoice.due_date)}</p>
            </div>
          </div>
        )}

        {/* Document Info */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ลูกค้า</p>
            <p className="font-semibold text-gray-900">{invoice.contact_name || "-"}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">วันที่ออก</p>
            <p className="font-semibold text-gray-900">{formatThaiDate(invoice.issue_date)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ครบกำหนด</p>
            <p className="font-semibold text-gray-900">{formatThaiDate(invoice.due_date)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">เลขที่ใบกำกับภาษี</p>
            <p className="font-semibold text-gray-900">{invoice.tax_invoice_number || "-"}</p>
          </div>
        </div>

        {invoice.project_name && (
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 mb-8">
            <p className="text-sm text-purple-700">
              <span className="font-medium">โครงการ:</span> {invoice.project_name}
            </p>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">รายละเอียด</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">จำนวน</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ราคาต่อหน่วย</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">ส่วนลด</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">รวม</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.discount_percent}%</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Payment */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปยอด</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ราคาก่อนภาษี</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({invoice.vat_rate}%)</span>
                <span className="font-medium">{formatCurrency(invoice.vat_amount)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ส่วนลด</span>
                  <span className="font-medium text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span className="text-gray-900">ยอดรวมสุทธิ</span>
                <span className="text-peak-purple">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะการชำระ</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ยอดรวม</span>
                <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ชำระแล้ว</span>
                <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span className="text-gray-900">ค้างชำระ</span>
                <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            {/* Receipts List */}
            {receipts && receipts.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">ประวัติการรับเงิน</p>
                <div className="space-y-2">
                  {receipts.map((r: any) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{r.receipt_number} ({formatThaiDate(r.receipt_date)})</span>
                      <span className="font-medium text-green-600">{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* e-Tax Invoice Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-peak-purple" />
              <h3 className="text-lg font-semibold text-gray-900">e-Tax Invoice</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${etaxStatusColors[etaxStatus]}`}>
                {etaxStatusLabels[etaxStatus]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(etaxStatus === "pending" || etaxStatus === "failed") && (
                <button
                  onClick={handleGenerateETax}
                  disabled={generateETax.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  {generateETax.isPending ? "กำลังสร้าง..." : "สร้าง XML"}
                </button>
              )}
              {etaxStatus === "generated" && (
                <button
                  onClick={handleSubmitETax}
                  disabled={submitETax.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitETax.isPending ? "กำลังส่ง..." : "ส่งกรมสรรพากร"}
                </button>
              )}
              {invoice.e_tax_xml && (
                <button
                  onClick={handleDownloadXml}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลด XML
                </button>
              )}
            </div>
          </div>

          {invoice.e_tax_error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-700">
                <span className="font-medium">ข้อผิดพลาดล่าสุด:</span> {invoice.e_tax_error}
              </p>
            </div>
          )}

          {invoice.e_tax_timestamp && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">
                <span className="font-medium">ยืนยันโดยกรมสรรพากร:</span> {formatThaiDate(invoice.e_tax_timestamp)}
              </p>
            </div>
          )}

          {/* e-Tax History */}
          {eTaxHistory && eTaxHistory.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-700 mb-3">ประวัติการส่ง</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500">วันที่</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">วิธีการ</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">สถานะ</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">ข้อความ</th>
                  </tr>
                </thead>
                <tbody>
                  {eTaxHistory.map((h: any) => (
                    <tr key={h.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-sm text-gray-900">{formatThaiDate(h.created_at)}</td>
                      <td className="py-2 text-sm text-gray-600">{h.submission_method}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${etaxStatusColors[h.status] || etaxStatusColors.pending}`}>
                          {h.status === "confirmed" && <CheckCircle className="w-3 h-3" />}
                          {h.status === "failed" && <XCircle className="w-3 h-3" />}
                          {h.status === "submitted" && <Clock className="w-3 h-3" />}
                          {etaxStatusLabels[h.status] || h.status}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-600">{h.error_message || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
