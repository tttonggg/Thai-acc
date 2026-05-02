"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.get(`/contacts/${contactId}`).then((res) => res.data),
  });

  const updateContact = useMutation({
    mutationFn: (data: any) => api.put(`/contacts/${contactId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      router.push(`/contacts/${contactId}`);
    },
  });

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    type: "customer",
    tax_id: "",
    branch_number: "",
    address: "",
    phone: "",
    email: "",
    credit_limit: "",
    credit_days: "",
  });

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || "",
        name_en: contact.name_en || "",
        type: contact.type || "customer",
        tax_id: contact.tax_id || "",
        branch_number: contact.branch_number || "",
        address: contact.address || "",
        phone: contact.phone || "",
        email: contact.email || "",
        credit_limit: contact.credit_limit?.toString() || "",
        credit_days: contact.credit_days?.toString() || "",
      });
    }
  }, [contact]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    await updateContact.mutateAsync({
      name: form.name,
      name_en: form.name_en || undefined,
      type: form.type,
      tax_id: form.tax_id || undefined,
      branch_number: form.branch_number || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      credit_limit: parseFloat(form.credit_limit) || 0,
      credit_days: parseInt(form.credit_days) || 0,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center">กำลังโหลด...</div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="p-8 text-center">ไม่พบผู้ติดต่อ</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/contacts/${contactId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ติดต่อ</h1>
            <p className="text-gray-500 mt-1">{contact.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลผู้ติดต่อ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) => handleChange("name_en", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                <select
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  <option value="customer">ลูกค้า</option>
                  <option value="vendor">ผู้จำหน่าย</option>
                  <option value="both">ทั้งสอง</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={(e) => handleChange("tax_id", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
                <input
                  type="text"
                  value={form.branch_number}
                  onChange={(e) => handleChange("branch_number", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วงเงินเครดิต</label>
                <input
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => handleChange("credit_limit", e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลาเครดิต (วัน)</label>
                <input
                  type="number"
                  value={form.credit_days}
                  onChange={(e) => handleChange("credit_days", e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/contacts/${contactId}`}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={updateContact.isPending || !form.name}
              className="px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateContact.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
