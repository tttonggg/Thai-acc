'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Server,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  errorRate: number;
  averageDuration: number;
  p50: number;
  p95: number;
  p99: number;
  topUsers: Array<{
    userId: string | null;
    userName: string | null;
    requestCount: number;
  }>;
  topPaths: Array<{
    path: string;
    requestCount: number;
    averageDuration: number;
    errorRate: number;
  }>;
  statusCodes: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
}

interface ApiRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId: string | null;
  user: {
    name: string;
    email: string;
  } | null;
  ipAddress: string;
  userAgent: string;
  error: string | null;
}

export function ApiAnalytics() {
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [recentRequests, setRecentRequests] = useState<ApiRequest[]>([]);
  const [slowRequests, setSlowRequests] = useState<ApiRequest[]>([]);
  const [errorRequests, setErrorRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch overview metrics
      const metricsRes = await fetch(`/api/admin/analytics?range=${timeRange}&type=overview`);
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // Fetch recent requests
      const recentRes = await fetch(`/api/admin/analytics?type=recent&limit=50`);
      const recentData = await recentRes.json();
      if (recentData.success) {
        setRecentRequests(recentData.data);
      }

      // Fetch slow requests
      const slowRes = await fetch(`/api/admin/analytics?type=slow&threshold=1000&limit=20`);
      const slowData = await slowRes.json();
      if (slowData.success) {
        setSlowRequests(slowData.data);
      }

      // Fetch error requests
      const errorRes = await fetch(`/api/admin/analytics?type=errors&limit=20`);
      const errorData = await errorRes.json();
      if (errorData.success) {
        setErrorRequests(errorData.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'bg-green-100 text-green-800';
    if (status < 400) return 'bg-blue-100 text-blue-800';
    if (status < 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Analytics</h2>
          <p className="text-gray-500">Monitor API performance, usage, and errors</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Requests</p>
                    <p className="text-3xl font-bold">{formatNumber(metrics.totalRequests)}</p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(metrics.requestsPerMinute)}/min
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Error Rate</p>
                    <p className="text-3xl font-bold">
                      {(metrics.errorRate * 100).toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {metrics.errorRate > 0.05 ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          High
                        </span>
                      ) : (
                        <span className="text-green-500 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${metrics.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Response Time</p>
                    <p className="text-3xl font-bold">{formatDuration(metrics.averageDuration)}</p>
                    <p className="text-sm text-gray-500">
                      p95: {formatDuration(metrics.p95)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-3xl font-bold">{formatNumber(metrics.topUsers.length)}</p>
                    <p className="text-sm text-gray-500">
                      Unique API consumers
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Percentiles */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Percentiles</CardTitle>
              <CardDescription>Distribution of response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">p50 (Median)</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.p50)}</p>
                  <p className="text-xs text-gray-400">50% of requests</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">p95</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.p95)}</p>
                  <p className="text-xs text-gray-400">95% of requests</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">p99</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.p99)}</p>
                  <p className="text-xs text-gray-400">99% of requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Tabs */}
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Recent Requests</TabsTrigger>
              <TabsTrigger value="slow">Slow Queries</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="paths">Top Paths</TabsTrigger>
              <TabsTrigger value="users">Top Users</TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Recent API Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRequests.slice(0, 20).map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMethodColor(req.method)}>
                              {req.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {req.path}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(req.statusCode)}>
                              {req.statusCode}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDuration(req.duration)}</TableCell>
                          <TableCell>{req.user?.name || 'Anonymous'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="slow">
              <Card>
                <CardHeader>
                  <CardTitle>Slow Requests (&gt;1000ms)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slowRequests.map((req) => (
                        <TableRow key={req.id} className="bg-yellow-50">
                          <TableCell>
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMethodColor(req.method)}>
                              {req.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {req.path}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatDuration(req.duration)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(req.statusCode)}>
                              {req.statusCode}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {slowRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            No slow requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle>Error Requests (4xx/5xx)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorRequests.map((req) => (
                        <TableRow key={req.id} className="bg-red-50">
                          <TableCell>
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMethodColor(req.method)}>
                              {req.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {req.path}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(req.statusCode)}>
                              {req.statusCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-red-600 text-sm">
                            {req.error || 'Unknown error'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {errorRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            No errors found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paths">
              <Card>
                <CardHeader>
                  <CardTitle>Top API Paths</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Avg Duration</TableHead>
                        <TableHead>Error Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topPaths.map((path) => (
                        <TableRow key={path.path}>
                          <TableCell className="font-mono text-sm">
                            {path.path}
                          </TableCell>
                          <TableCell>{formatNumber(path.requestCount)}</TableCell>
                          <TableCell>{formatDuration(path.averageDuration)}</TableCell>
                          <TableCell>
                            <span className={path.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}>
                              {(path.errorRate * 100).toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Top API Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Request Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topUsers.map((user) => (
                        <TableRow key={user.userId || 'anonymous'}>
                          <TableCell>{user.userName || 'Anonymous'}</TableCell>
                          <TableCell>{formatNumber(user.requestCount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
