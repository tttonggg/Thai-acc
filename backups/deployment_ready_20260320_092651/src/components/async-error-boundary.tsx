'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface AsyncErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  state: AsyncErrorBoundaryState = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('AsyncErrorBoundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              เกิดข้อผิดพลาด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-mono bg-gray-100 p-2 rounded hover:bg-gray-200 transition-colors">
                    รายละเอียดข้อผิดพลาด
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                โหลดหน้าใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
