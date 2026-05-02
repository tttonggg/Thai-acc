"use client";

import AppLayout from "@/components/AppLayout";
import { useCompanies } from "@/hooks/useApi";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export default function SettingsPage() {
  const { data: companies, isLoading } = useCompanies();
  const company = companies?.[0];

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">ตั้งค่าบริษัท</h1>

        {isLoading ? (
          <div className="text-center text-gray-500">กำลังโหลด...</div>
        ) : !company ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            ไม่พบข้อมูลบริษัท
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-peak-purple to-peak-teal flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
                <p className="text-gray-500">{company.name_en}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 font-mono">
                    {company.tax_id}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สาขา
                  </label>
                  <div className="text-gray-900">{company.branch_number}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <div className="flex items-start gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>{company.address || "-"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{company.email || "-"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    โทรศัพท์
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{company.phone || "-"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ปีบัญชีเริ่มต้น
                </label>
                <div className="text-gray-900">
                  เดือน {company.fiscal_year_start_month}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
