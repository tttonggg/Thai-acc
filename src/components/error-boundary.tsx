'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">เกิดข้อผิดพลาด</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  ระบบพบข้อผิดพลาดในการแสดงผล กรุณาลองใหม่อีกครั้ง
                </p>
                <Button onClick={() => window.location.reload()} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  โหลดหน้าใหม่
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
