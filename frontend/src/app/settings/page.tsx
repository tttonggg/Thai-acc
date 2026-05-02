"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useCompanies, useUpdateMyCompany } from "@/hooks/useApi";
import { authApi } from "@/lib/api";
import { Building2, Mail, Phone, MapPin, Pencil, Save, X, Lock, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const { data: companies, isLoading } = useCompanies();
  const company = companies?.[0];
  const updateCompany = useUpdateMyCompany();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    address: "",
    phone: "",
    email: "",
    fiscal_year_start_month: "1",
  });

  // Password change state
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const startEditing = () => {
    if (company) {
      setForm({
        name: company.name || "",
        name_en: company.name_en || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        fiscal_year_start_month: String(company.fiscal_year_start_month || 1),
      });
      setIsEditing(true);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany.mutateAsync({
        name: form.name || undefined,
        name_en: form.name_en || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        fiscal_year_start_month: parseInt(form.fiscal_year_start_month) || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      setPwError(err.response?.data?.detail || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPwLoading(false);
    }
  };

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าบริษัท</h1>
          {!isEditing && company && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              แก้ไข
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500">กำลังโหลด...</div>
        ) : !company ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            ไม่พบข้อมูลบริษัท
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อภาษาอังกฤษ</label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) => handleChange("name_en", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">โทรศัพท์</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ปีบัญชีเริ่มต้น (เดือน)</label>
                <select
                  value={form.fiscal_year_start_month}
                  onChange={(e) => handleChange("fiscal_year_start_month", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                >
                  {thaiMonths.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={updateCompany.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateCompany.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
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
                  {thaiMonths[(company.fiscal_year_start_month || 1) - 1]}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-5 h-5 text-peak-purple" />
            <h2 className="text-lg font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
          </div>

          {pwError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
              {pwSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านปัจจุบัน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, current_password: e.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, new_password: e.target.value }))}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-peak-purple/20 focus:border-peak-purple"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-peak-purple to-peak-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {pwLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
