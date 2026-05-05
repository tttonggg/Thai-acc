'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw, Eye } from 'lucide-react';
import { satangToBaht } from '@/lib/currency';

type FormType = 'PND3' | 'PND53';
type Tab = 'form' | 'history';

interface TaxFormLine {
  id: string;
  lineNo: number;
  payeeName: string;
  payeeTaxId: string | null;
  description: string;
  incomeType: string;
  incomeAmount: number;
  taxRate: number;
  taxAmount: number;
  documentRef: string | null;
}

interface TaxForm {
  id: string;
  formType: FormType;
  month: number;
  year: number;
  status: string;
  totalAmount: number;
  totalTax: number;
  lines: TaxFormLine[];
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const INCOME_TYPE_LABELS: Record<string, string> = {
  '1': 'เงินเดือน/ค่าจ้าง',
  '2': 'ค่านายหน้า',
  '3': 'ค่าดอกเบี้ย',
  '4': 'ค่าปันผล',
  '5': 'ค่าเช่า',
};

const PND53_INCOME_LABELS: Record<string, string> = {
  '1': 'ค่าบริการ',
  '2': 'ค่าเช่าอาคาร',
  '3': 'ค่าส่งออก',
  '4': 'ค่าจ้างทำของ',
  '5': 'ค่าโฆษณา',
  '6': 'ค่าบริการวิชาชีพ',
};

export function TaxFormPage() {
  const [tab, setTab] = useState<Tab>('form');
  const [formType, setFormType] = useState<FormType>('PND3');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [taxForm, setTaxForm] = useState<TaxForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TaxForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load history — fetch all TaxForms for the selected year
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tax-forms/summary?year=${selectedYear}`);
      if (!res.ok) return;
      const periods: Array<{ month: number; year: number; forms: Array<{ type: string }> }> = await res.json();

      // For each period+form, fetch the full TaxForm record
      const formPromises: Promise<TaxForm | null>[] = [];
      for (const period of periods) {
        for (const f of period.forms) {
          const url = `/api/tax-forms?formType=${f.type}&month=${period.month}&year=${period.year}`;
          formPromises.push(
            fetch(url).then(r => r.ok ? r.json() : null)
          );
        }
      }
      const results = await Promise.all(formPromises);
      setHistory(results.filter(Boolean) as TaxForm[]);
    } catch {
      // silently fail for history
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  // Fetch existing tax form
  const fetchTaxForm = async () => {
    setFetching(true);
    setError(null);
    setPdfUrl(null);
    try {
      const endpoint = formType === 'PND3' ? '/api/tax-forms/pnd3' : '/api/tax-forms/pnd53';
      const res = await fetch(`${endpoint}?month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) {
        setError('ไม่สามารถดึงข้อมูลได้');
        return;
      }
      const data = await res.json();
      if (data) {
        setTaxForm(data);
      } else {
        setTaxForm(null);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setFetching(false);
    }
  };

  // Generate (create) tax form from WHT records
  const generateTaxForm = async () => {
    setLoading(true);
    setError(null);
    setPdfUrl(null);
    try {
      const endpoint = formType === 'PND3' ? '/api/tax-forms/pnd3' : '/api/tax-forms/pnd53';
      const res = await fetch(`${endpoint}?month=${selectedMonth}&year=${selectedYear}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'สร้างแบบฟอร์มไม่สำเร็จ');
        return;
      }
      const data = await res.json();
      setTaxForm(data);
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  // Preview PDF
  const previewPDF = () => {
    if (!taxForm) return;
    setPdfUrl(`/api/tax-forms/${taxForm.id}/pdf`);
  };

  // Download PDF
  const downloadPDF = () => {
    if (!taxForm) return;
    window.open(`/api/tax-forms/${taxForm.id}/pdf`, '_blank');
  };

  const incomeLabels = formType === 'PND3' ? INCOME_TYPE_LABELS : PND53_INCOME_LABELS;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <FileText className="w-5 h-5 text-violet-600" />
        <h1 className="text-lg font-semibold">แบบฟอร์มภาษี (Tax Forms)</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 bg-white border-b">
        <button
          onClick={() => setTab('form')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            tab === 'form'
              ? 'border-violet-600 text-violet-700 bg-violet-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          สร้าง/ดูแบบฟอร์ม
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            tab === 'history'
              ? 'border-violet-600 text-violet-700 bg-violet-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ประวัติ
        </button>
      </div>

      {tab === 'form' && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Selection Row */}
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Form Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">ประเภทแบบฟอร์ม</label>
                <select
                  value={formType}
                  onChange={e => { setFormType(e.target.value as FormType); setTaxForm(null); setPdfUrl(null); }}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="PND3">ภงด.3 (PND3) — บุคคลธรรมดา</option>
                  <option value="PND53">ภงด.53 (PND53) — นิติบุคคล</option>
                </select>
              </div>

              {/* Month */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">เดือน</label>
                <select
                  value={selectedMonth}
                  onChange={e => { setSelectedMonth(parseInt(e.target.value)); setTaxForm(null); setPdfUrl(null); }}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {THAI_MONTHS.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">ปี</label>
                <input
                  type="number"
                  value={selectedYear}
                  min={2000}
                  max={2100}
                  onChange={e => { setSelectedYear(parseInt(e.target.value)); setTaxForm(null); setPdfUrl(null); }}
                  className="px-3 py-2 border rounded-md text-sm w-28 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Fetch Button */}
              <button
                onClick={fetchTaxForm}
                disabled={fetching}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                ดึงข้อมูล
              </button>
            </div>

            {/* Status line */}
            {!taxForm && !fetching && !error && (
              <p className="text-sm text-slate-400">
                กด &ldquo;ดึงข้อมูล&rdquo; เพื่อตรวจสอบแบบฟอร์มที่มี หรือกด &ldquo;สร้างจาก WHT&rdquo; เพื่อสร้างใหม่จากรายการภาษีหัก ณ ที่จ่าย
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tax Form Lines */}
          {taxForm && (
            <div className="bg-white rounded-lg border">
              {/* Form Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                <div>
                  <h2 className="font-semibold text-slate-800">
                    {formType === 'PND3' ? 'ภงด.3 (PND3)' : 'ภงด.53 (PND53)'} — {THAI_MONTHS[taxForm.month - 1]} {taxForm.year}
                  </h2>
                  <p className="text-xs text-slate-500">
                    สถานะ: {taxForm.status} · {taxForm.lines.length} รายการ
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={previewPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100"
                  >
                    <Eye className="w-4 h-4" />
                    ดู PDF
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-violet-600 rounded-md hover:bg-violet-700"
                  >
                    <Download className="w-4 h-4" />
                    ดาวน์โหลด
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-slate-50 border-b">
                <div>
                  <p className="text-xs text-slate-500">มูลค่ารวม</p>
                  <p className="text-sm font-semibold">฿{satangToBaht(taxForm.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ภาษีหักรวม</p>
                  <p className="text-sm font-semibold text-red-600">฿{satangToBaht(taxForm.totalTax).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                      <th className="px-3 py-2 w-10">ลำดับ</th>
                      <th className="px-3 py-2">ชื่อผู้ถูกหักภาษี</th>
                      <th className="px-3 py-2">เลขประจำตัวผู้เสียภาษี</th>
                      <th className="px-3 py-2">ประเภทเงินได้</th>
                      <th className="px-3 py-2 text-right">มูลค่า (฿)</th>
                      <th className="px-3 py-2 text-center">อัตรา (%)</th>
                      <th className="px-3 py-2 text-right">ภาษีหัก (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {taxForm.lines.map(line => (
                      <tr key={line.id} className="hover:bg-slate-40">
                        <td className="px-3 py-2 text-slate-500">{line.lineNo}</td>
                        <td className="px-3 py-2 font-medium">{line.payeeName}</td>
                        <td className="px-3 py-2 text-slate-600">{line.payeeTaxId ?? '-'}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {incomeLabels[line.incomeType] ?? line.incomeType}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {satangToBaht(line.incomeAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-center">{line.taxRate}%</td>
                        <td className="px-3 py-2 text-right text-red-600">
                          {satangToBaht(line.taxAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {taxForm.lines.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                          ไม่มีรายการ — ลองสร้างแบบฟอร์มใหม่จากข้อมูล WHT
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Generate Button (if no form exists yet) */}
              {!taxForm && (
                <div className="px-4 py-4 border-t flex gap-3">
                  <button
                    onClick={generateTaxForm}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'กำลังสร้าง...' : 'สร้างจากรายการ WHT'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PDF Preview */}
          {pdfUrl && (
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-medium text-sm">ตัวอย่าง PDF</h3>
                <button
                  onClick={() => setPdfUrl(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ปิด
                </button>
              </div>
              <iframe
                src={pdfUrl}
                className="w-full"
                style={{ height: '600px' }}
                title="Tax Form PDF Preview"
              />
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="flex-1 overflow-auto p-6">
          {/* Year selector */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium">ปี:</label>
            <input
              type="number"
              value={selectedYear}
              min={2000}
              max={2100}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border rounded-md text-sm w-24"
            />
            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              ไม่มีแบบฟอร์มภาษีในปี {selectedYear}
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(form => (
                <div key={form.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {form.formType === 'PND3' ? 'ภงด.3' : 'ภงด.53'} — {THAI_MONTHS[form.month - 1]} {form.year}
                    </p>
                    <p className="text-sm text-slate-500">
                      {form.lines.length} รายการ · ภาษีรวม ฿{satangToBaht(form.totalTax).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      form.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                      form.status === 'SUBMITTED' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {form.status}
                    </span>
                    <button
                      onClick={() => window.open(`/api/tax-forms/${form.id}/pdf`, '_blank')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-violet-600 rounded-md hover:bg-violet-700"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
