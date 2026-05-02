"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Printer, FileText, Trash2, Send, CheckCircle, XCircle, RotateCcw, Pencil } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  accepted: "อนุมัติ",
  rejected: "ปฏิเสธ",
  converted: "แปลงเป็นใบแจ้งหนี้",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  converted: "bg-purple-50 text-purple-700",
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const queryClient = useQueryClient();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => api.get(`/quotations/${quotationId}`).then((res) => res.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/quotations/${quotationId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] }),
  });

  const deleteQuotation = useMutation({
    mutationFn: () => api.delete(`/quotations/${quotationId}`),
    onSuccess: () => router.push("/income"),
  });

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!quotation) return <AppLayout><div className="p-8 text-center">ไม่พบใบเสนอราคา</div></AppLayout>;

  const canConvert = quotation.status === "accepted";
  const canDelete = quotation.status === "draft";
  const canSend = quotation.status === "draft";

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/income" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{quotation.quotation_number}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[quotation.status]}`}>
                  {statusLabels[quotation.status]}
                </span>
              </div>
              <p className="text-gray-500 mt-1">ใบเสนอราคา</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {quotation.status !== "converted" && (
              <Link
                href={`/income/quotations/${quotationId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                แก้ไข
              </Link>
            )}
            {canSend && (
              <button
                onClick={() => updateStatus.mutate("sent")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                ส่งใบเสนอราคา
              </button>
            )}
            {canConvert && (
              <Link
                href={`/income/invoices/new?quotation_id=${quotationId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <FileText className="w-4 h-4" />
                แปลงเป็นใบแจ้งหนี้
              </Link>
            )}
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              พิมพ์
            </button>
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm("ต้องการลบใบเสนอราคานี้?")) deleteQuotation.mutate();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            )}
          </div>
        </div>

        {/* Document Info */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ลูกค้า</p>
            <p className="font-semibold text-gray-900">{quotation.contact_name || "-"}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">วันที่ออก</p>
            <p className="font-semibold text-gray-900">{formatThaiDate(quotation.issue_date)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">วันที่หมดอายุ</p>
            <p className="font-semibold text-gray-900">{quotation.expiry_date ? formatThaiDate(quotation.expiry_date) : "-"}</p>
          </div>
        </div>

        {quotation.project_name && (
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 mb-8">
            <p className="text-sm text-purple-700">
              <span className="font-medium">โครงการ:</span> {quotation.project_name}
            </p>
          </div>
        )}

        {/* Line Items Table */}
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
              {quotation.items?.map((item: any) => (
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

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ราคาก่อนภาษี</span>
                <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({quotation.vat_rate}%)</span>
                <span className="font-medium">{formatCurrency(quotation.vat_amount)}</span>
              </div>
              {quotation.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ส่วนลด</span>
                  <span className="font-medium text-red-600">-{formatCurrency(quotation.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span className="text-gray-900">ยอดรวมสุทธิ</span>
                <span className="text-peak-purple">{formatCurrency(quotation.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(quotation.notes || quotation.terms) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {quotation.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">หมายเหตุ</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">เงื่อนไขการชำระเงิน</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
