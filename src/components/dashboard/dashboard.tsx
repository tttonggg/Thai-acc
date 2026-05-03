'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { eventBus, EVENTS } from '@/lib/events';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Truck,
  Receipt,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Building,
  Wallet,
  CreditCard,
  FileCheck,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface DashboardSummary {
  revenue: { amount: number; change: number };
  expenses: { amount: number; change: number };
  ar: { amount: number; change: number };
  ap: { amount: number; change: number };
}

interface QuickActionItem {
  count: number;
  label: string;
  description: string;
  icon: string;
  color: string;
  action: string;
}

interface QuickActions {
  draftInvoices: QuickActionItem;
  overdueAR: QuickActionItem;
  pendingVAT: QuickActionItem;
}

interface DashboardData {
  summary: DashboardSummary;
  monthlyData: Array<{ month: string; revenue: number; expense: number }>;
  arAging: Array<{ name: string; value: number; color: string }>;
  apAging: Array<{ name: string; value: number; color: string }>;
  vatData: Array<{ month: string; vatOutput: number; vatInput: number }>;
  quickActions?: QuickActions;
}

// Module statistics interface
interface ModuleStats {
  total: number;
  draft?: number;
  pending?: number;
  sent?: number;
  approved?: number;
  overdue?: number;
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
  navigateTo?: (path: string) => void;
}

function SummaryCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg,
  onClick,
}: SummaryCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/90 p-5 transition-all hover:border-slate-600 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          <div
            className={`mt-2 flex items-center gap-1 ${isPositive ? 'text-teal-400' : 'text-red-400'}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
            <span className="text-xs text-slate-400">{changeLabel}</span>
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Helper function to get dark color classes
function getColorClasses(color: string) {
  switch (color) {
    case 'yellow':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'red':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'blue':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'purple':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'green':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'indigo':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        hover: 'hover:bg-slate-700/50',
      };
    case 'orange':
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400',
        hover: 'hover:bg-slate-700/50',
      };
    default:
      return {
        bg: 'bg-slate-800/80 border border-slate-700/50',
        iconBg: 'bg-slate-600/50',
        iconColor: 'text-slate-400',
        hover: 'hover:bg-slate-700/50',
      };
  }
}

// Shortcut Card Component
interface ShortcutCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: ModuleStats;
  color: string;
  onClick: () => void;
  loading?: boolean;
}

function ShortcutCard({
  title,
  description,
  icon,
  stats,
  color,
  onClick,
  loading,
}: ShortcutCardProps) {
  const colors = getColorClasses(color);

  return (
    <div
      className={`cursor-pointer rounded-xl p-5 transition-all ${colors.bg} ${colors.hover}`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg}`}>
          {icon}
        </div>
        <ChevronRight className={`h-5 w-5 ${colors.iconColor} opacity-50`} />
      </div>
      <h3 className="mb-1 font-semibold text-white">{title}</h3>
      <p className="mb-3 text-sm text-slate-400">{description}</p>
      {!loading && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="border-slate-600 bg-slate-700 text-xs text-slate-300"
          >
            ทั้งหมด {stats.total}
          </Badge>
          {stats.draft !== undefined && stats.draft > 0 && (
            <Badge variant="outline" className="border-amber-600/50 text-xs text-amber-400">
              ร่าง {stats.draft}
            </Badge>
          )}
          {stats.pending !== undefined && stats.pending > 0 && (
            <Badge variant="outline" className="border-orange-600/50 text-xs text-orange-400">
              รออนุมัติ {stats.pending}
            </Badge>
          )}
          {stats.sent !== undefined && stats.sent > 0 && (
            <Badge variant="outline" className="border-blue-600/50 text-xs text-blue-400">
              ส่งแล้ว {stats.sent}
            </Badge>
          )}
          {stats.approved !== undefined && stats.approved > 0 && (
            <Badge variant="outline" className="border-teal-600/50 text-xs text-teal-400">
              อนุมัติแล้ว {stats.approved}
            </Badge>
          )}
          {stats.overdue !== undefined && stats.overdue > 0 && (
            <Badge
              variant="destructive"
              className="border-red-500/50 bg-red-500/20 text-xs text-red-400"
            >
              เกินกำหนด {stats.overdue}
            </Badge>
          )}
        </div>
      )}
      {loading && (
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      )}
    </div>
  );
}

export function Dashboard({
  setActiveModule,
}: {
  setActiveModule?: (
    module:
      | 'invoices'
      | 'purchases'
      | 'customers'
      | 'vendors'
      | 'quotations'
      | 'receipts'
      | 'credit-notes'
      | 'debit-notes'
      | 'purchase-orders'
      | 'payments'
      | 'inventory'
      | 'assets'
      | 'banking'
      | 'petty-cash'
      | 'payroll'
      | 'wht'
  ) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleStats, setModuleStats] = useState<Record<string, ModuleStats>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard`, { credentials: 'include' });
        // Handle 401 - let the auth system handle redirect
        if (res.status === 401) {
          setLoading(false);
          return; // Auth error - next-auth will handle redirect
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Unknown error');
        setData(json.data);
      } catch (err) {
        // Only show error if not auth related (401 handled above)
        const message = err instanceof Error ? err.message : 'ข้อผิดพลาดในการโหลดข้อมูล';
        setError(message);
        toast({
          title: 'ข้อผิดพลาด',
          description: 'โหลดข้อมูลไม่สำเร็จ',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Listen for data changes to refresh dashboard
    const handleChange = () => fetchDashboard();
    eventBus.on(EVENTS.INVOICE_CREATED, handleChange);
    eventBus.on(EVENTS.INVOICE_UPDATED, handleChange);
    eventBus.on(EVENTS.INVOICE_DELETED, handleChange);
    eventBus.on(EVENTS.RECEIPT_CREATED, handleChange);
    eventBus.on(EVENTS.RECEIPT_UPDATED, handleChange);

    fetchDashboard();

    return () => {
      eventBus.off(EVENTS.INVOICE_CREATED, handleChange)
      eventBus.off(EVENTS.INVOICE_UPDATED, handleChange)
      eventBus.off(EVENTS.INVOICE_DELETED, handleChange)
      eventBus.off(EVENTS.RECEIPT_CREATED, handleChange)
      eventBus.off(EVENTS.RECEIPT_UPDATED, handleChange)
    }
  }, [])

  // Fetch module statistics
  useEffect(() => {
    const fetchModuleStats = async () => {
      setStatsLoading(true);
      try {
        // Fetch quotations
        const quotRes = await fetch(`/api/quotations?limit=1000`, { credentials: 'include' });
        if (quotRes.ok) {
          const quotJson = await quotRes.json();
          if (quotJson.success) {
            const quotations = quotJson.data || [];
            const draft = quotations.filter((q: any) => q.status === 'DRAFT').length;
            const sent = quotations.filter((q: any) => q.status === 'SENT').length;
            const approved = quotations.filter((q: any) => q.status === 'APPROVED').length;
            setModuleStats((prev) => ({
              ...prev,
              quotations: { total: quotations.length, draft, sent, approved },
            }));
          }
        }

        // Fetch invoices
        const invRes = await fetch(`/api/invoices?limit=1000`, { credentials: 'include' });
        if (invRes.ok) {
          const invJson = await invRes.json();
          if (invJson.success) {
            const invoices = invJson.data || [];
            const draft = invoices.filter((i: any) => i.status === 'DRAFT').length;
            const overdue = invoices.filter(
              (i: any) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'PAID'
            ).length;
            setModuleStats((prev) => ({
              ...prev,
              invoices: { total: invoices.length, draft, overdue },
            }));
          }
        }

        // Fetch receipts
        const recRes = await fetch(`/api/receipts?limit=1000`, { credentials: 'include' });
        if (recRes.ok) {
          const recJson = await recRes.json();
          if (recJson.success) {
            const receipts = recJson.data || [];
            const draft = receipts.filter((r: any) => r.status === 'DRAFT').length;
            setModuleStats((prev) => ({
              ...prev,
              receipts: { total: receipts.length, draft },
            }));
          }
        }

        // Fetch credit notes
        const cnRes = await fetch(`/api/credit-notes?limit=1000`, { credentials: 'include' });
        if (cnRes.ok) {
          const cnJson = await cnRes.json();
          if (cnJson.success) {
            const creditNotes = cnJson.data || [];
            setModuleStats((prev) => ({
              ...prev,
              creditNotes: { total: creditNotes.length },
            }));
          }
        }

        // Fetch debit notes
        const dnRes = await fetch(`/api/debit-notes?limit=1000`, { credentials: 'include' });
        if (dnRes.ok) {
          const dnJson = await dnRes.json();
          if (dnJson.success) {
            const debitNotes = dnJson.data || [];
            setModuleStats((prev) => ({
              ...prev,
              debitNotes: { total: debitNotes.length },
            }));
          }
        }

        // Fetch purchase orders
        const poRes = await fetch(`/api/purchase-orders?limit=1000`, { credentials: 'include' });
        if (poRes.ok) {
          const poJson = await poRes.json();
          if (poJson.success) {
            const purchaseOrders = poJson.data || [];
            const draft = purchaseOrders.filter((p: any) => p.status === 'DRAFT').length;
            const pending = purchaseOrders.filter(
              (p: any) => p.status === 'PENDING_APPROVAL'
            ).length;
            setModuleStats((prev) => ({
              ...prev,
              purchaseOrders: { total: purchaseOrders.length, draft, pending },
            }));
          }
        }

        // Fetch payments
        const payRes = await fetch(`/api/payments?limit=1000`, { credentials: 'include' });
        if (payRes.ok) {
          const payJson = await payRes.json();
          if (payJson.success) {
            const payments = payJson.data || [];
            setModuleStats((prev) => ({
              ...prev,
              payments: { total: payments.length },
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching module stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    // Listen for data changes from other modules
    const handleInvoiceChange = () => fetchModuleStats();
    eventBus.on(EVENTS.INVOICE_CREATED, handleInvoiceChange);
    eventBus.on(EVENTS.INVOICE_UPDATED, handleInvoiceChange);
    eventBus.on(EVENTS.INVOICE_DELETED, handleInvoiceChange);

    // Initial fetch
    fetchModuleStats();

    return () => {
      eventBus.off(EVENTS.INVOICE_CREATED, handleInvoiceChange);
      eventBus.off(EVENTS.INVOICE_UPDATED, handleInvoiceChange);
      eventBus.off(EVENTS.INVOICE_DELETED, handleInvoiceChange);
    };
  }, []);

  // Loading UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/90 p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-800/50 bg-red-900/20">
        <AlertDescription className="text-red-300">{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty UI
  if (!data) {
    return (
      <Alert className="border-slate-700/50 bg-slate-800/80">
        <AlertDescription className="text-slate-300">ไม่พบข้อมูล</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">ภาพรวมธุรกิจ</h1>
        <p className="mt-1 text-slate-400">ภาพรวมสถานะทางการเงินและบัญชี</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="รายได้รวม (เดือนนี้)"
          value={
            '฿' +
            (data?.summary?.revenue?.amount ?? 0).toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })
          }
          change={data?.summary?.revenue?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          iconBg="bg-teal-500"
          onClick={() => setActiveModule?.('invoices')}
        />
        <SummaryCard
          title="ค่าใช้จ่ายรวม (เดือนนี้)"
          value={
            '฿' +
            (data?.summary?.expenses?.amount ?? 0).toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })
          }
          change={data?.summary?.expenses?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<TrendingDown className="h-6 w-6 text-white" />}
          iconBg="bg-red-500"
          onClick={() => setActiveModule?.('purchases')}
        />
        <SummaryCard
          title="ลูกหนี้การค้า"
          value={
            '฿' +
            (data?.summary?.ar?.amount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
          }
          change={data?.summary?.ar?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<Users className="h-6 w-6 text-white" />}
          iconBg="bg-blue-500"
          onClick={() => setActiveModule?.('customers')}
        />
        <SummaryCard
          title="เจ้าหนี้การค้า"
          value={
            '฿' +
            (data?.summary?.ap?.amount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
          }
          change={data?.summary?.ap?.change ?? 0}
          changeLabel="จากเดือนก่อน"
          icon={<Truck className="h-6 w-6 text-white" />}
          iconBg="bg-orange-500"
          onClick={() => setActiveModule?.('vendors')}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Expense Chart */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">รายได้ vs ค่าใช้จ่าย</h3>
            <p className="text-sm text-slate-400">เปรียบเทียบรายได้และค่าใช้จ่ายรายเดือน</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.monthlyData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(v) => (v / 1000).toString() + 'K'}
              />
              <Tooltip
                formatter={(value: number) => [
                  '฿' + (value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
                  '',
                ]}
                labelStyle={{ color: '#e2e8f0' }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="revenue" name="รายได้" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="ค่าใช้จ่าย" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* VAT Chart */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">ภาษีมูลค่าเพิ่ม</h3>
            <p className="text-sm text-slate-400">ภาษีขายและภาษีซื้อรายเดือน</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.vatData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(v) => (v / 1000).toString() + 'K'}
              />
              <Tooltip
                formatter={(value: number) => [
                  '฿' + (value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
                  '',
                ]}
                labelStyle={{ color: '#e2e8f0' }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              <Line
                type="monotone"
                dataKey="vatOutput"
                name="ภาษีขาย"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ fill: '#818cf8' }}
              />
              <Line
                type="monotone"
                dataKey="vatInput"
                name="ภาษีซื้อ"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: '#fbbf24' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AR Aging */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">ลูกหนี้ตามอายุหนี้</h3>
            <p className="text-sm text-slate-400">จำแนกตามระยะเวลาครบกำหนด</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.arAging ?? []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'}
                labelLine={false}
              >
                {data?.arAging?.map((entry, index) => (
                  <Cell key={'cell-' + index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  '฿' +
                  (value ?? 0).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data?.arAging?.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">
                  {item.name}:{' '}
                  {'฿' + (item?.value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AP Aging */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">เจ้าหนี้ตามอายุหนี้</h3>
            <p className="text-sm text-slate-400">จำแนกตามระยะเวลาครบกำหนด</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.apAging ?? []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => name + ' ' + (percent * 100).toFixed(0) + '%'}
                labelLine={false}
              >
                {data?.apAging?.map((entry, index) => (
                  <Cell key={'cell-' + index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  '฿' +
                  (value ?? 0).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data?.apAging?.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">
                  {item.name}:{' '}
                  {'฿' + (item?.value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Shortcuts */}
      <div className="space-y-6">
        {/* Sales & Revenue */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">การขายและรายได้</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ShortcutCard
              title="ใบเสนอราคา"
              description="สร้างและจัดการใบเสนอราคา"
              icon={<FileText className="h-6 w-6 text-purple-400" />}
              stats={moduleStats.quotations || { total: 0, draft: 0, sent: 0, approved: 0 }}
              color="purple"
              onClick={() => setActiveModule?.('quotations')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบกำกับภาษี"
              description="ออกใบกำกับภาษีและใบเสร็จ"
              icon={<Receipt className="h-6 w-6 text-blue-400" />}
              stats={moduleStats.invoices || { total: 0, draft: 0, overdue: 0 }}
              color="blue"
              onClick={() => setActiveModule?.('invoices')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบเสร็จรับเงิน"
              description="บันทึกการรับชำระเงิน"
              icon={<DollarSign className="h-6 w-6 text-teal-400" />}
              stats={moduleStats.receipts || { total: 0, draft: 0 }}
              color="green"
              onClick={() => setActiveModule?.('receipts')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบลดหนี้"
              description="ออกใบลดหนี้และคืนเงิน"
              icon={<FileCheck className="h-6 w-6 text-orange-400" />}
              stats={moduleStats.creditNotes || { total: 0 }}
              color="orange"
              onClick={() => setActiveModule?.('credit-notes')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Purchases & Expenses */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">การซื้อและค่าใช้จ่าย</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ShortcutCard
              title="ใบสั่งซื้อ"
              description="ขออนุมัติและสั่งซื้อสินค้า"
              icon={<ShoppingCart className="h-6 w-6 text-indigo-400" />}
              stats={moduleStats.purchaseOrders || { total: 0, draft: 0, pending: 0 }}
              color="indigo"
              onClick={() => setActiveModule?.('purchase-orders')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบจ่ายเงิน"
              description="บันทึกการจ่ายชำระเงิน"
              icon={<CreditCard className="h-6 w-6 text-red-400" />}
              stats={moduleStats.payments || { total: 0 }}
              color="red"
              onClick={() => setActiveModule?.('payments')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ใบเพิ่มหนี้"
              description="ออกใบเพิ่มหนี้และปรับปรุง"
              icon={<FileCheck className="h-6 w-6 text-orange-400" />}
              stats={moduleStats.debitNotes || { total: 0 }}
              color="orange"
              onClick={() => setActiveModule?.('debit-notes')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Inventory & Assets */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">สินค้าและทรัพย์สิน</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ShortcutCard
              title="สินค้าคงคลัง"
              description="จัดการสต็อกและคลังสินค้า"
              icon={<Package className="h-6 w-6 text-teal-400" />}
              stats={{ total: 0 }}
              color="green"
              onClick={() => setActiveModule?.('inventory')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ทรัพย์สินถาวร"
              description="บันทึกทรัพย์สินและค่าเสื่อม"
              icon={<Building className="h-6 w-6 text-slate-400" />}
              stats={{ total: 0 }}
              color="blue"
              onClick={() => setActiveModule?.('assets')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="ธนาคาร"
              description="บัญชีธนาคารและเช็ค"
              icon={<Wallet className="h-6 w-6 text-blue-400" />}
              stats={{ total: 0 }}
              color="blue"
              onClick={() => setActiveModule?.('banking')}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* HR & Finance */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">บุคคลและการเงิน</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ShortcutCard
              title="เงินสดย่อย"
              description="กองทุนและเบิกจ่าย"
              icon={<Wallet className="h-6 w-6 text-amber-400" />}
              stats={{ total: 0 }}
              color="yellow"
              onClick={() => setActiveModule?.('petty-cash')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="เงินเดือน"
              description="คำนวณเงินเดือนและภาษี"
              icon={<Users className="h-6 w-6 text-purple-400" />}
              stats={{ total: 0 }}
              color="purple"
              onClick={() => setActiveModule?.('payroll')}
              loading={statsLoading}
            />
            <ShortcutCard
              title="หัก ณ ที่จ่าย"
              description="ภงด.3 และ ภงด.53"
              icon={<FileText className="h-6 w-6 text-red-400" />}
              stats={{ total: 0 }}
              color="red"
              onClick={() => setActiveModule?.('wht')}
              loading={statsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
