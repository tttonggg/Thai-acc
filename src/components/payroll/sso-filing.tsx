'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';

interface SSOSummary {
  totalEmployees: number;
  totalContribution: string;
  employeePortion: string;
  employerPortion: string;
  averagePerEmployee: string;
}

interface EmployeeSSO {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  socialSecurityNo: string | null;
  baseSalary: number;
  employeePortion: number;
  employerPortion: number;
}

interface SSOData {
  year: number;
  month: number;
  periodLabel: string;
  totalEmployees: number;
  totalEmployeePortion: number;
  totalEmployerPortion: number;
  totalSSC: number;
  employees: EmployeeSSO[];
  summary: SSOSummary;
  generatedAt: string;
}

export function SSOFiling() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<SSOData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSSOData();
  }, [year, month]);

  async function fetchSSOData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payroll/sso/${year}/${month}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'ไม่สามารถโหลดข้อมูลประกันสังคม');
        setData(null);
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/payroll/sso/${year}/${month}/export`, {
        credentials: 'include',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SSO_${year}${month.toString().padStart(2, '0')}_50Tong.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('ไม่สามารถส่งออกไฟล์');
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการส่งออกไฟล์');
    } finally {
      setExporting(false);
    }
  }

  const monthNames = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
          <Shield className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">ประกันสังคม (SSC)</h1>
          <p className="text-sm text-[var(--muted-foreground)]">ยื่นแบบและส่งไฟล์ 50 ทวิ</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="text-sm text-[var(--foreground)]">ประจำเดือน:</span>
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
        >
          {monthNames.map((name, idx) => (
            <option key={idx} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={() => fetchSSOData()}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          ค้นหา
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Users className="h-4 w-4" />
                จำนวนพนักงาน
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {data.summary.totalEmployees}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                ส่วนพนักงาน
              </div>
              <p className="text-2xl font-bold text-blue-600">{data.summary.employeePortion}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                ส่วนนายจ้าง
              </div>
              <p className="text-2xl font-bold text-indigo-600">{data.summary.employerPortion}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                รวมทั้งหมด
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {data.summary.totalContribution}
              </p>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                รายละเอียดการคำนวณ SSC
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                อัตรา 5% ของเงินเดือน สูงสุด 750 บาท/เดือน
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || data.employees.length === 0}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export 50 ทวิ File
            </button>
          </div>

          {/* Employee Table */}
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    พนักงาน
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    เงินเดือน
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    ส่วนพนักงาน (5%)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    ส่วนนายจ้าง (5%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.employees.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className="hover:bg-[var(--accent)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {emp.fullName}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {emp.employeeCode} | เลขที่บัตร: {emp.socialSecurityNo || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--foreground)]">
                      {(emp.baseSalary / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600">
                      {(emp.employeePortion / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-indigo-600">
                      {(emp.employerPortion / 100).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            ข้อมูล ณ วันที่ {new Date(data.generatedAt).toLocaleString('th-TH')}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !data && !error && (
        <div className="py-16 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">เลือกเดือนและปีเพื่อดูข้อมูลประกันสังคม</p>
        </div>
      )}
    </div>
  );
}
