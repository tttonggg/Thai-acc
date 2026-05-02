"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin, FileText, TrendingUp, Pencil } from "lucide-react";

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.get(`/contacts/${contactId}`).then((res) => res.data),
  });

  if (isLoading) return <AppLayout><div className="p-8 text-center">กำลังโหลด...</div></AppLayout>;
  if (!contact) return <AppLayout><div className="p-8 text-center">ไม่พบผู้ติดต่อ</div></AppLayout>;

  const typeLabels: Record<string, string> = {
    customer: "ลูกค้า",
    vendor: "ผู้จำหน่าย",
    both: "ทั้งสอง",
  };

  const typeColors: Record<string, string> = {
    customer: "bg-blue-50 text-blue-700",
    vendor: "bg-orange-50 text-orange-700",
    both: "bg-purple-50 text-purple-700",
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/contacts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[contact.type]}`}>
              {typeLabels[contact.type]}
            </span>
          </div>
          <Link
            href={`/contacts/${contactId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            แก้ไข
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">เลขประจำตัวผู้เสียภาษี</p>
            <p className="font-semibold text-gray-900 font-mono">{contact.tax_id || "-"}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">วงเงินเครดิต</p>
            <p className="font-semibold text-gray-900">{formatCurrency(contact.credit_limit)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">ระยะเวลาเครดิต</p>
            <p className="font-semibold text-gray-900">{contact.credit_days} วัน</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">เบอร์โทร</p>
                <p className="font-medium text-gray-900">{contact.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">อีเมล</p>
                <p className="font-medium text-gray-900">{contact.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 col-span-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">ที่อยู่</p>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">{contact.address || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
