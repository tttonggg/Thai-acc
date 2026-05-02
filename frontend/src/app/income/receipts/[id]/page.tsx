"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Printer } from "lucide-react";

export default function ReceiptDetailPage() {
  const params = useParams();
  const receiptId = params.id as string;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => api.get(`/receipts/${receiptId}`).then((res) => res.data),
  });

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!receipt) return <AppLayout><div className="p-8 text-center">ไม่พบใบเสร็จ</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/income" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{receipt.receipt_number}</h1>
              <p className="text-gray-500 mt-1">ใบเสร็จรับเงิน</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            พิมพ์
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">ใบแจ้งหนี้</p>
              <p className="font-semibold text-gray-900">{receipt.invoice_number || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ลูกค้า</p>
              <p className="font-semibold text-gray-900">{receipt.contact_name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">วันที่รับเงิน</p>
              <p className="font-semibold text-gray-900">{formatThaiDate(receipt.receipt_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">วิธีชำระ</p>
              <p className="font-semibold text-gray-900">{receipt.payment_method}</p>
            </div>
            {receipt.payment_reference && (
              <div>
                <p className="text-sm text-gray-500 mb-1">เลขที่อ้างอิง</p>
                <p className="font-semibold text-gray-900">{receipt.payment_reference}</p>
              </div>
            )}
            {receipt.project_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">โครงการ</p>
                <p className="font-semibold text-gray-900">{receipt.project_name}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center max-w-md ml-auto">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">จำนวนเงิน:</p>
                {receipt.wht_amount > 0 && (
                  <>
                    <p className="text-sm text-gray-600">หัก WHT ({receipt.wht_rate}%):</p>
                    <p className="text-base font-bold text-gray-900 mt-2">รับสุทธิ:</p>
                  </>
                )}
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm font-medium">{formatCurrency(receipt.amount)}</p>
                {receipt.wht_amount > 0 && (
                  <>
                    <p className="text-sm font-medium text-red-600">-{formatCurrency(receipt.wht_amount)}</p>
                    <p className="text-base font-bold text-peak-purple mt-2">{formatCurrency(receipt.total_amount)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {receipt.notes && (
            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-1">หมายเหตุ</p>
              <p className="text-sm text-gray-600">{receipt.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
