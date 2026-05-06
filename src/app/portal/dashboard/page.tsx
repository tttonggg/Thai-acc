'use client';

import { useEffect, useState } from 'react';
import { usePortalAuthStore, portalLogout } from '@/stores/portal-auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { satangToBaht } from '@/lib/currency';

export default function PortalDashboardPage() {
  const { user, isAuthenticated } = usePortalAuthStore();
  const [summary, setSummary] = useState<{
    totalInvoices: number;
    outstandingCount: number;
    outstandingAmount: number;
    overdueCount: number;
    paidCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/portal/login';
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;

    // Fetch invoice summary
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/portal/invoices?pageSize=1', {
          headers: { 'x-customer-id': user.customerId },
        });
        const data = await res.json();
        if (data.success) {
          setSummary({
            totalInvoices: data.pagination?.total || 0,
            outstandingCount: data.summary?.outstandingCount || 0,
            outstandingAmount: data.summary?.outstandingAmount || 0,
            overdueCount: data.summary?.overdueCount || 0,
            paidCount: data.summary?.paidCount || 0,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  const handleLogout = async () => {
    await portalLogout();
    window.location.href = '/portal/login';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-sm text-gray-500">{user.customerName || user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            สวัสดี, {user.name}
          </h2>
          <p className="text-gray-600 mt-1">
            ยินดีต้อนรับเข้าสู่ระบบลูกค้าออนไลน์ของ Keerati
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Invoices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                รวมใบแจ้งหนี้
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">{summary?.totalInvoices ?? 0}</p>
              )}
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                รอชำระ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-600">{summary?.outstandingCount ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    ฿{satangToBaht(summary?.outstandingAmount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                เกินกำหนด
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-red-600">{summary?.overdueCount ?? 0}</p>
              )}
            </CardContent>
          </Card>

          {/* Paid */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ชำระแล้ว
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-green-600">{summary?.paidCount ?? 0}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/portal/invoices'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ใบแจ้งหนี้ของฉัน</h3>
                  <p className="text-sm text-gray-500">ดูรายการใบแจ้งหนี้ทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Clock className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ชำระเงินออนไลน์</h3>
                  <p className="text-sm text-gray-500">ชำระค่าสินค้าและบริการ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
