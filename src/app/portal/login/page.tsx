'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, Building2, UserCircle } from 'lucide-react';
import { usePortalAuthStore, portalLogin } from '@/stores/portal-auth-store';

export default function PortalLoginPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, error, isLoading } = usePortalAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await portalLogin(email, password);

    if (!result.success || !result.user) {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      return;
    }

    setUser(result.user);
    router.push('/portal/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600">
            <UserCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
          <p className="mt-2 text-gray-600">ระบบลูกค้าออนไลน์</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-semibold">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center">
              กรุณากรอกอีเมลและรหัสผ่านที่ได้รับจากฝ่ายบัญชี
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="mt-4 border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4">
            <p className="mb-2 text-sm font-medium text-emerald-800">📋 วิธีการรับรหัสผ่าน:</p>
            <div className="space-y-1 text-sm text-emerald-700">
              <p>• รหัสผ่านจะถูกส่งให้ทางอีเมลเมื่อเปิดใช้งานบริการ</p>
              <p>• หากไม่ได้รับรหัสผ่าน กรุณาติดต่อฝ่ายบัญชี</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          © 2024 Keerati Thai Accounting ERP
        </p>
      </div>
    </div>
  );
}
