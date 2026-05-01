'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  Users,
  Clock,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface HealthData {
  database: {
    status: string;
    size: number;
    sizeFormatted: string;
    lastModified: string | null;
    lastBackup: string | null;
    records: {
      users: number;
      companies: number;
      chartOfAccounts: number;
      journalEntries: number;
      invoices: number;
      purchaseInvoices: number;
      receipts: number;
      payments: number;
      customers: number;
      vendors: number;
      products: number;
      warehouses: number;
      assets: number;
      bankAccounts: number;
      cheques: number;
      pettyCashFunds: number;
      employees: number;
      payrollRuns: number;
      total: number;
    };
  };
  performance: {
    apiResponseTime: number;
    slowQueries: any[];
    errorRate: number;
    activeConnections: number;
    responseTime: number;
  };
  resources: {
    disk: {
      free: number;
      total: number;
      used: number;
      percentage: number;
      freeFormatted: string;
      totalFormatted: string;
      usedFormatted: string;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
      heapUsedFormatted: string;
      heapTotalFormatted: string;
      rssFormatted: string;
    };
  };
  activity: {
    totalUsers: number;
    activeUsers: number;
    recentOperations: number;
    failedOperations: number;
  };
  system: {
    version: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    environment: string;
    uptime: string;
    uptimeSeconds: number;
    lastRestart: string;
  };
}

export function SystemHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(`/api/admin/health`, { credentials: 'include' });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('กรุณาเข้าสู่ระบบ');
        }
        if (response.status === 403) {
          throw new Error('ไม่มีสิทธิ์เข้าถึง (ต้องการสิทธิ์ผู้ดูแลระบบ)');
        }
        throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }

      setHealthData(result.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching health data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            ปกติ
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            ผิดปกติ
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
            <AlertTriangle className="mr-1 h-3 w-3" />
            แจ้งเตือน
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">สุขภาพระบบ</h1>
            <p className="text-muted-foreground">ตรวจสอบสถานะและประสิทธิภาพของระบบ</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">สุขภาพระบบ</h1>
            <p className="text-muted-foreground">ตรวจสอบสถานะและประสิทธิภาพของระบบ</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">เกิดข้อผิดพลาด</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">สุขภาพระบบ</h1>
          <p className="text-muted-foreground">ตรวจสอบสถานะและประสิทธิภาพของระบบ</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
          </div>
          <Button onClick={fetchHealthData} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Database Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle>ฐานข้อมูล</CardTitle>
            </div>
            {getStatusBadge(healthData.database.status)}
          </div>
          <CardDescription>
            ขนาด: {healthData.database.sizeFormatted} • รวมทั้งหมด:{' '}
            {healthData.database.records.total.toLocaleString()} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ผู้ใช้งาน</p>
              <p className="text-2xl font-bold">{healthData.database.records.users}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ลูกค้า</p>
              <p className="text-2xl font-bold">{healthData.database.records.customers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ผู้ขาย</p>
              <p className="text-2xl font-bold">{healthData.database.records.vendors}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">บันทึกบัญชี</p>
              <p className="text-2xl font-bold">{healthData.database.records.journalEntries}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ใบกำกับภาษี</p>
              <p className="text-2xl font-bold">{healthData.database.records.invoices}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ใบซื้อ</p>
              <p className="text-2xl font-bold">{healthData.database.records.purchaseInvoices}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">สินค้า</p>
              <p className="text-2xl font-bold">{healthData.database.records.products}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">คลังสินค้า</p>
              <p className="text-2xl font-bold">{healthData.database.records.warehouses}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ทรัพย์สินถาวร</p>
              <p className="text-2xl font-bold">{healthData.database.records.assets}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">พนักงาน</p>
              <p className="text-2xl font-bold">{healthData.database.records.employees}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">บัญชีธนาคาร</p>
              <p className="text-2xl font-bold">{healthData.database.records.bankAccounts}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">เงินสดย่อย</p>
              <p className="text-2xl font-bold">{healthData.database.records.pettyCashFunds}</p>
            </div>
          </div>
          {healthData.database.lastModified && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                แก้ไขล่าสุด: {new Date(healthData.database.lastModified).toLocaleString('th-TH')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <CardTitle>ประสิทธิภาพ</CardTitle>
          </div>
          <CardDescription>
            เวลาตอบสนอง API: {healthData.performance.responseTime}ms • การเชื่อมต่อที่ใช้งาน:{' '}
            {healthData.performance.activeConnections}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">เวลาตอบสนอง API</p>
                <span className="text-lg font-bold">
                  {healthData.performance.apiResponseTime}ms
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    healthData.performance.apiResponseTime < 100
                      ? 'bg-green-500'
                      : healthData.performance.apiResponseTime < 200
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(healthData.performance.apiResponseTime / 3, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">อัตราความผิดพลาด</p>
                <span className="text-lg font-bold">{healthData.performance.errorRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    healthData.performance.errorRate < 1
                      ? 'bg-green-500'
                      : healthData.performance.errorRate < 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(healthData.performance.errorRate * 10, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">การเชื่อมต่อที่ใช้งาน</p>
                <span className="text-lg font-bold">
                  {healthData.performance.activeConnections}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${Math.min((healthData.performance.activeConnections / 50) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Disk Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <CardTitle>การใช้งานดิสก์</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ใช้งานแล้ว</span>
                <span className="font-medium">
                  {healthData.resources.disk.usedFormatted} /{' '}
                  {healthData.resources.disk.totalFormatted}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    healthData.resources.disk.percentage < 70
                      ? 'bg-green-500'
                      : healthData.resources.disk.percentage < 85
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  } transition-all`}
                  style={{ width: `${healthData.resources.disk.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">เหลือว่าง</span>
                <span className="font-medium">{healthData.resources.disk.freeFormatted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-orange-600" />
              <CardTitle>การใช้งานหน่วยความจำ</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Heap ที่ใช้งาน</span>
                <span className="font-medium">
                  {healthData.resources.memory.heapUsedFormatted} /{' '}
                  {healthData.resources.memory.heapTotalFormatted}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    healthData.resources.memory.heapUsed / healthData.resources.memory.heapTotal <
                    0.7
                      ? 'bg-green-500'
                      : healthData.resources.memory.heapUsed /
                            healthData.resources.memory.heapTotal <
                          0.85
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  } transition-all`}
                  style={{
                    width: `${(healthData.resources.memory.heapUsed / healthData.resources.memory.heapTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">RSS (Resident Set Size)</span>
                <span className="font-medium">{healthData.resources.memory.rssFormatted}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            <CardTitle>กิจกรรมการใช้งาน</CardTitle>
          </div>
          <CardDescription>24 ชั่วโมงที่ผ่านมา</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ผู้ใช้งานทั้งหมด</p>
              <p className="text-2xl font-bold">{healthData.activity.totalUsers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ใช้งานแล้ว</p>
              <p className="text-2xl font-bold text-green-600">{healthData.activity.activeUsers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ปฏิบัติการสำเร็จ</p>
              <p className="text-2xl font-bold text-blue-600">
                {healthData.activity.recentOperations}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ปฏิบัติการล้มเหลว</p>
              <p className="text-2xl font-bold text-red-600">
                {healthData.activity.failedOperations}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-600" />
            <CardTitle>ข้อมูลระบบ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">เวอร์ชันแอปพลิเคชัน</p>
              <p className="text-lg font-semibold">{healthData.system.version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">สภาพแวดล้อม</p>
              <Badge
                variant={healthData.system.environment === 'production' ? 'default' : 'secondary'}
              >
                {healthData.system.environment === 'production' ? 'Production' : 'Development'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">เวอร์ชัน Node.js</p>
              <p className="text-lg font-semibold">{healthData.system.nodeVersion}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">แพลตฟอร์ม</p>
              <p className="text-lg font-semibold">
                {healthData.system.platform} ({healthData.system.arch})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">เวลาทำงาน</p>
              <p className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-4 w-4 text-green-600" />
                {healthData.system.uptime}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">เริ่มระบบล่าสุด</p>
              <p className="text-lg font-semibold">
                {new Date(healthData.system.lastRestart).toLocaleString('th-TH')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
